import { createClient } from '@insforge/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

loadEnv();

const insforge = createClient({
  baseUrl: process.env.VITE_INSFORGE_URL,
  anonKey: process.env.VITE_INSFORGE_ANON_KEY,
});

async function run() {
  const force = process.argv.includes('--force');

  const { data: existing, error: countError } = await insforge.database
    .from('organizations')
    .select('id', { count: 'exact' })
    .limit(1);

  if (countError) throw countError;

  if (existing && existing.length > 0 && !force) {
    console.log('Database already has organizations. Re-run with --force to wipe and reseed.');
    return;
  }

  if (existing && existing.length > 0) {
    for (const table of ['activities', 'deals', 'contacts', 'organizations']) {
      const { error } = await insforge.database.from(table).delete().not('id', 'is', null);
      if (error) throw error;
    }
    console.log('Cleared existing data.');
  }

  const organizations = [
    { name: 'Acme Corporation', website: 'https://acme.com', industry: 'Technology', notes: 'Large enterprise client. Key account for Q4.' },
    { name: 'Greenfield Industries', website: 'https://greenfield.com', industry: 'Manufacturing', notes: 'Mid-size manufacturer looking to modernize their stack.' },
    { name: 'Summit Healthcare', website: 'https://summithealth.com', industry: 'Healthcare', notes: 'Healthcare provider with strict compliance needs.' },
    { name: 'Brightpath Education', website: 'https://brightpath.edu', industry: 'Education', notes: 'University system with 12 campuses.' },
    { name: 'Coastal Dynamics', website: 'https://coastaldyn.com', industry: 'Consulting', notes: 'Boutique consulting firm, 50 employees.' },
  ];

  const { data: orgs, error: orgError } = await insforge.database
    .from('organizations')
    .insert(organizations)
    .select('id, name');
  if (orgError) throw orgError;

  const org = (name: string) => {
    const match = orgs!.find((o) => o.name === name);
    if (!match) throw new Error(`Organization not found: ${name}`);
    return match.id;
  };

  const acme = org('Acme Corporation');
  const greenfield = org('Greenfield Industries');
  const summit = org('Summit Healthcare');
  const brightpath = org('Brightpath Education');
  const coastal = org('Coastal Dynamics');

  const contacts = [
    { name: 'Alice Chen', email: 'alice.chen@acme.com', phone: '555-0101', job_title: 'CTO', organization_id: acme, status: 'customer' },
    { name: 'Bob Martinez', email: 'bob.martinez@acme.com', phone: '555-0102', job_title: 'VP Engineering', organization_id: acme, status: 'qualified' },
    { name: 'Carol Johnson', email: 'carol@greenfield.com', phone: '555-0201', job_title: 'Director of IT', organization_id: greenfield, status: 'lead' },
    { name: 'David Kim', email: 'david.kim@summithealth.com', phone: '555-0301', job_title: 'CISO', organization_id: summit, status: 'qualified' },
    { name: 'Eva Williams', email: 'eva@brightpath.edu', phone: '555-0401', job_title: 'Dean of Technology', organization_id: brightpath, status: 'lead' },
    { name: "Frank O'Brien", email: 'frank@coastaldyn.com', phone: '555-0501', job_title: 'Managing Partner', organization_id: coastal, status: 'customer' },
    { name: 'Grace Liu', email: 'grace.liu@acme.com', phone: '555-0103', job_title: 'Product Manager', organization_id: acme, status: 'qualified' },
    { name: 'Henry Taylor', email: 'henry@greenfield.com', phone: '555-0202', job_title: 'Plant Manager', organization_id: greenfield, status: 'lead' },
  ];

  const { data: ct, error: contactError } = await insforge.database
    .from('contacts')
    .insert(contacts)
    .select('id, name');
  if (contactError) throw contactError;

  const contact = (name: string) => {
    const match = ct!.find((c) => c.name === name);
    if (!match) throw new Error(`Contact not found: ${name}`);
    return match.id;
  };

  const alice = contact('Alice Chen');
  const bob = contact('Bob Martinez');
  const carol = contact('Carol Johnson');
  const david = contact('David Kim');
  const eva = contact('Eva Williams');
  const frank = contact("Frank O'Brien");
  const grace = contact('Grace Liu');
  const henry = contact('Henry Taylor');

  const deals = [
    { name: 'Acme Cloud Migration', organization_id: acme, contact_id: alice, stage: 'negotiation', value: 250000, close_date: '2026-03-31' },
    { name: 'Acme Security Audit', organization_id: acme, contact_id: bob, stage: 'proposal', value: 75000, close_date: '2026-04-15' },
    { name: 'Greenfield ERP Upgrade', organization_id: greenfield, contact_id: carol, stage: 'new', value: 180000, close_date: '2026-06-01' },
    { name: 'Summit Compliance Suite', organization_id: summit, contact_id: david, stage: 'qualified', value: 120000, close_date: '2026-05-20' },
    { name: 'Brightpath LMS Integration', organization_id: brightpath, contact_id: eva, stage: 'new', value: 95000, close_date: '2026-07-01' },
    { name: 'Coastal CRM Replacement', organization_id: coastal, contact_id: frank, stage: 'won', value: 45000, close_date: '2026-01-15' },
    { name: 'Acme Data Platform', organization_id: acme, contact_id: grace, stage: 'proposal', value: 320000, close_date: '2026-05-30' },
    { name: 'Greenfield IoT Pilot', organization_id: greenfield, contact_id: henry, stage: 'new', value: 60000, close_date: '2026-08-01' },
    { name: 'Summit Telehealth Portal', organization_id: summit, contact_id: david, stage: 'negotiation', value: 200000, close_date: '2026-04-30' },
    { name: 'Coastal Training Platform', organization_id: coastal, contact_id: frank, stage: 'won', value: 35000, close_date: '2025-12-01' },
  ];

  const { data: dl, error: dealError } = await insforge.database
    .from('deals')
    .insert(deals)
    .select('id, name');
  if (dealError) throw dealError;

  const deal = (name: string) => {
    const match = dl!.find((d) => d.name === name);
    if (!match) throw new Error(`Deal not found: ${name}`);
    return match.id;
  };

  const activities = [
    { type: 'note', contact_id: alice, deal_id: deal('Acme Cloud Migration'), description: 'Discussed migration timeline. Alice prefers a phased approach over full cutover.', activity_date: '2026-07-01', due_date: null, done: true },
    { type: 'email', contact_id: bob, deal_id: deal('Acme Security Audit'), description: 'Sent proposal for security audit scope and pricing.', activity_date: '2026-07-05', due_date: null, done: true },
    { type: 'note', contact_id: carol, deal_id: deal('Greenfield ERP Upgrade'), description: 'Carol mentioned budget cycle starts in September. Need to follow up before then.', activity_date: '2026-07-08', due_date: '2026-08-15', done: false },
    { type: 'call', contact_id: david, deal_id: deal('Summit Compliance Suite'), description: 'David wants to see a compliance demo with HIPAA-specific workflows.', activity_date: '2026-07-10', due_date: '2026-07-20', done: false },
    { type: 'email', contact_id: eva, deal_id: deal('Brightpath LMS Integration'), description: 'Sent introductory deck. Eva will review with her team.', activity_date: '2026-07-02', due_date: '2026-07-15', done: true },
    { type: 'note', contact_id: frank, deal_id: deal('Coastal CRM Replacement'), description: 'Frank signed the contract! Deal closed. Onboarding starts next week.', activity_date: '2026-01-10', due_date: null, done: true },
    { type: 'call', contact_id: grace, deal_id: deal('Acme Data Platform'), description: 'Grace wants to see the data platform roadmap for the next 12 months.', activity_date: '2026-07-12', due_date: '2026-07-18', done: false },
    { type: 'email', contact_id: alice, deal_id: deal('Acme Cloud Migration'), description: 'Follow-up on cloud migration POC results.', activity_date: '2026-07-13', due_date: '2026-07-17', done: false },
    { type: 'note', contact_id: david, deal_id: deal('Summit Telehealth Portal'), description: 'David is interested in the telehealth module. Need to schedule a technical deep-dive.', activity_date: '2026-07-06', due_date: '2026-07-25', done: false },
    { type: 'call', contact_id: frank, deal_id: deal('Coastal Training Platform'), description: 'Onboarding kick-off went smoothly. Frank is happy with the timeline.', activity_date: '2025-12-10', due_date: null, done: true },
  ];

  const { error: activityError } = await insforge.database.from('activities').insert(activities);
  if (activityError) throw activityError;

  console.log(
    `Seeded ${organizations.length} organizations, ${contacts.length} contacts, ${deals.length} deals, ${activities.length} activities.`,
  );
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
