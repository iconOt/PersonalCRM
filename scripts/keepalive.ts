import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Daily keep-alive for the linked InsForge project.
 *
 * InsForge pauses free projects after 1 week of inactivity (insforge.dev/pricing),
 * so this makes one cheap request every day to reset that clock. If a platform
 * access token is available it also checks for a paused project and restores it.
 *
 * This cannot be done by an InsForge schedule: schedules run inside Postgres via
 * pg_cron, which does not run while the instance is stopped. The trigger has to be
 * external — see .github/workflows/keepalive.yml.
 *
 * Usage: npm run keepalive
 *
 * Optional: set INSFORGE_ACCESS_TOKEN to enable the pause check and auto-restore.
 */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, '.insforge', 'project.json');
const cliEntry = path.join(root, 'node_modules', '@insforge', 'cli', 'dist', 'index.js');

type ProjectConfig = {
  project_id: string;
  project_name: string;
  org_id: string;
  appkey: string;
  region: string;
  api_key: string;
  oss_host: string;
};

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

function readConfig(): ProjectConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `${configPath} not found. Link the directory with "npx -y @insforge/cli link", ` +
        'or set INSFORGE_* repository secrets when running from CI.',
    );
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<ProjectConfig>;

  const required: (keyof ProjectConfig)[] = ['project_id', 'api_key', 'oss_host'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`${configPath} is missing: ${missing.join(', ')}`);
  }

  return config as ProjectConfig;
}

function cli(args: string[]): any {
  const stdout = execFileSync(process.execPath, [cliEntry, ...args, '--json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
  });
  const start = stdout.indexOf('{');
  const startArray = stdout.indexOf('[');
  const from = start === -1 ? startArray : startArray === -1 ? start : Math.min(start, startArray);
  if (from === -1) throw new Error(`unexpected CLI output: ${stdout.slice(0, 300)}`);
  return JSON.parse(stdout.slice(from));
}

async function ping(config: ProjectConfig) {
  const url = `${config.oss_host}/api/database/records/organizations?select=id&limit=1`;
  const response = await fetch(url, {
    headers: { apikey: config.api_key, Authorization: `Bearer ${config.api_key}` },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`data plane responded ${response.status}: ${body.slice(0, 300)}`);
  }
  return body;
}

function hasPlatformToken(): boolean {
  if (process.env.INSFORGE_ACCESS_TOKEN) return true;
  const credentials = path.join(os.homedir(), '.insforge', 'credentials.json');
  return fs.existsSync(credentials);
}

async function ensureActive(config: ProjectConfig) {
  if (!hasPlatformToken()) {
    console.log('Status:  skipped (set INSFORGE_ACCESS_TOKEN to enable the pause check)');
    return;
  }

  let project = cli(['projects', 'get', '--project', config.project_id]);
  console.log(`Status:  ${project.status}`);

  if (project.status === 'active') return;

  console.log(`Project is ${project.status} — restoring...`);
  cli(['projects', 'restore', '--project', config.project_id, '-y']);

  const deadline = Date.now() + 5 * 60 * 1000;
  for (;;) {
    project = cli(['projects', 'get', '--project', config.project_id]);
    if (project.status === 'active') break;
    if (Date.now() > deadline) {
      throw new Error(`project still ${project.status} after 5 minutes`);
    }
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  console.log('Status:  active (restored)');
}

async function main() {
  loadEnvFile(path.join(root, '.env'));
  const config = readConfig();

  console.log(`Project: ${config.project_name ?? config.project_id} (${config.project_id})`);
  console.log(`URL:     ${config.oss_host}`);

  await ensureActive(config);

  await ping(config);
  console.log('Ping:    ok');
  console.log('Keep-alive complete.');
}

main().catch((error) => {
  console.error('Keep-alive FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});