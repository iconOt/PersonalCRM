// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api } from '../api/client';
import type { Contact, Deal, Organization } from '../types';

/**
 * These tests run against the linked InsForge project, so they exercise the real
 * backend end to end. Every record created here is tagged with a unique run id
 * and removed afterwards, leaving the seeded sample data untouched.
 */

const RUN_ID = `test-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const tag = (label: string) => `${label} ${RUN_ID}`;

const createdOrgs: string[] = [];
const createdContacts: string[] = [];
const createdDeals: string[] = [];
const createdActivities: string[] = [];

async function makeOrg(overrides: Partial<Organization> = {}): Promise<Organization> {
  const org = await api.organizations.create({ name: tag('Org'), website: '', industry: '', notes: '', ...overrides });
  createdOrgs.push(org.id);
  return org;
}

async function makeContact(overrides: Partial<Contact> = {}): Promise<Contact> {
  const contact = await api.contacts.create({
    name: tag('Contact'),
    email: `${RUN_ID}@example.com`,
    phone: '',
    job_title: '',
    organization_id: null,
    status: 'lead',
    ...overrides,
  });
  createdContacts.push(contact.id);
  return contact;
}

async function makeDeal(overrides: Partial<Deal> = {}): Promise<Deal> {
  const deal = await api.deals.create({
    name: tag('Deal'),
    organization_id: null,
    contact_id: null,
    stage: 'new',
    value: 0,
    close_date: null,
    ...overrides,
  });
  createdDeals.push(deal.id);
  return deal;
}

beforeAll(() => {
  if (!import.meta.env.VITE_INSFORGE_URL || !import.meta.env.VITE_INSFORGE_ANON_KEY) {
    throw new Error('VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY must be set (see .env.example)');
  }
});

afterAll(async () => {
  await Promise.allSettled([
    ...createdActivities.map((id) => api.activities.delete(id)),
    ...createdDeals.map((id) => api.deals.delete(id)),
    ...createdContacts.map((id) => api.contacts.delete(id)),
    ...createdOrgs.map((id) => api.organizations.delete(id)),
  ]);
}, 60000);

describe('Organizations', () => {
  it('creates, reads, updates and deletes an organization', async () => {
    const created = await api.organizations.create({
      name: 'CRUD Org',
      website: 'https://crud.example.com',
      industry: 'Technology',
      notes: 'round trip',
    });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('CRUD Org');

    const read = await api.organizations.get(created.id);
    expect(read.name).toBe('CRUD Org');
    expect(read.website).toBe('https://crud.example.com');

    const updated = await api.organizations.update(created.id, { name: 'CRUD Org Renamed' });
    expect(updated.name).toBe('CRUD Org Renamed');

    const reread = await api.organizations.get(created.id);
    expect(reread.name).toBe('CRUD Org Renamed');

    await api.organizations.delete(created.id);
    await expect(api.organizations.get(created.id)).rejects.toBeTruthy();
  });

  it('searches organizations by name', async () => {
    const needle = tag('Searchable');
    await makeOrg({ name: needle });
    await makeOrg({ name: `${needle}-other-industry` });

    const results = await api.organizations.list(needle);
    expect(results).toHaveLength(2);
    expect(results.every((o) => o.name.includes(needle))).toBe(true);

    const none = await api.organizations.list('zzz-no-such-organization-zzz');
    expect(none).toHaveLength(0);
  });

  it("returns an organization's contacts and deals on the detail view", async () => {
    const org = await makeOrg();
    const contactName = tag('Linked Contact');
    await makeContact({ organization_id: org.id, name: contactName });
    await makeDeal({ organization_id: org.id, name: tag('Linked Deal'), stage: 'proposal' });

    const detail = await api.organizations.get(org.id);
    expect(detail.contacts).toHaveLength(1);
    expect(detail.contacts?.[0].name).toBe(contactName);
    expect(detail.deals).toHaveLength(1);
    expect(detail.deals?.[0].name).toBe(tag('Linked Deal'));
    expect(detail.deals?.[0].organization_name).toBe(org.name);
  });
});

describe('Contacts', () => {
  it('creates, reads, updates and deletes a contact', async () => {
    const org = await makeOrg();

    const created = await api.contacts.create({
      name: 'CRUD Contact',
      email: 'crud@example.com',
      phone: '555-0000',
      job_title: 'Engineer',
      organization_id: org.id,
      status: 'lead',
    });
    expect(created.organization_id).toBe(org.id);
    expect(created.status).toBe('lead');

    const read = await api.contacts.get(created.id);
    expect(read.name).toBe('CRUD Contact');
    expect(read.email).toBe('crud@example.com');
    expect(read.organization_name).toBe(org.name);

    const updated = await api.contacts.update(created.id, { name: 'CRUD Contact Renamed', status: 'customer' });
    expect(updated.name).toBe('CRUD Contact Renamed');
    expect(updated.status).toBe('customer');

    const reread = await api.contacts.get(created.id);
    expect(reread.status).toBe('customer');

    await api.contacts.delete(created.id);
    await expect(api.contacts.get(created.id)).rejects.toBeTruthy();
  });

  it('searches contacts by name and by email', async () => {
    const nameNeedle = tag('ByName');
    const emailNeedle = `needle.${RUN_ID}@example.com`;
    await makeContact({ name: nameNeedle, email: `other.${RUN_ID}@example.com` });
    await makeContact({ name: 'Unrelated Person', email: emailNeedle });

    const byName = await api.contacts.list(nameNeedle);
    expect(byName.map((c) => c.name)).toEqual([nameNeedle]);

    const byEmail = await api.contacts.list(emailNeedle);
    expect(byEmail.map((c) => c.email)).toEqual([emailNeedle]);
  });

  it('filters contacts by status', async () => {
    const marker = tag('StatusFilter');
    for (const status of ['lead', 'qualified', 'customer'] as const) {
      await makeContact({ name: `${marker} ${status}`, status });
    }

    for (const status of ['lead', 'qualified', 'customer'] as const) {
      const results = await api.contacts.list(marker, status);
      expect(results.map((c) => c.name)).toEqual([`${marker} ${status}`]);
    }
  });
});

describe('Deals', () => {
  it('creates, reads, updates and deletes a deal', async () => {
    const org = await makeOrg();
    const contact = await makeContact({ organization_id: org.id });

    const created = await api.deals.create({
      name: 'CRUD Deal',
      organization_id: org.id,
      contact_id: contact.id,
      stage: 'new',
      value: 100000,
      close_date: '2026-12-31',
    });
    expect(created.value).toBe(100000);
    expect(created.close_date).toBe('2026-12-31');

    const read = await api.deals.get(created.id);
    expect(read.name).toBe('CRUD Deal');
    expect(read.organization_name).toBe(org.name);
    expect(read.contact_name).toBe(contact.name);

    const updated = await api.deals.update(created.id, { name: 'CRUD Deal Renamed', value: 250000 });
    expect(updated.name).toBe('CRUD Deal Renamed');
    expect(updated.value).toBe(250000);

    await api.deals.delete(created.id);
    await expect(api.deals.get(created.id)).rejects.toBeTruthy();
  });

  it('changes deal stage through every stage, including won and lost', async () => {
    const deal = await makeDeal({ value: 100000 });

    for (const stage of ['qualified', 'proposal', 'negotiation', 'won', 'lost'] as const) {
      const updated = await api.deals.update(deal.id, { stage });
      expect(updated.stage).toBe(stage);

      const persisted = await api.deals.get(deal.id);
      expect(persisted.stage).toBe(stage);
    }
  });

  it('searches deals by name', async () => {
    const needle = tag('DealSearch');
    await makeDeal({ name: needle });
    await makeDeal({ name: 'Some Other Deal' });

    const results = await api.deals.list(needle);
    expect(results.map((d) => d.name)).toEqual([needle]);
  });
});

describe('Activities and tasks', () => {
  it('creates, reads, updates and deletes an activity', async () => {
    const contact = await makeContact();

    const created = await api.activities.create({
      type: 'note',
      contact_id: contact.id,
      deal_id: null,
      description: 'Test note',
      activity_date: '2026-07-01',
    });
    createdActivities.push(created.id);
    expect(created.type).toBe('note');
    expect(created.description).toBe('Test note');
    expect(created.done).toBe(false);
    expect(created.contact_name).toBe(contact.name);

    const read = await api.activities.list(contact.id);
    expect(read.some((a) => a.id === created.id)).toBe(true);

    const updated = await api.activities.update(created.id, { type: 'email', description: 'Now an email' });
    expect(updated.type).toBe('email');
    expect(updated.description).toBe('Now an email');

    await api.activities.delete(created.id);
    const afterDelete = await api.activities.list(contact.id);
    expect(afterDelete.some((a) => a.id === created.id)).toBe(false);
  });

  it('orders a contact timeline newest first', async () => {
    const contact = await makeContact();

    const older = await api.activities.create({
      type: 'note',
      contact_id: contact.id,
      description: 'Older',
      activity_date: '2026-01-01',
    });
    const newer = await api.activities.create({
      type: 'note',
      contact_id: contact.id,
      description: 'Newer',
      activity_date: '2026-06-01',
    });
    createdActivities.push(older.id, newer.id);

    const timeline = await api.activities.list(contact.id);
    const dates = timeline.filter((a) => a.id === older.id || a.id === newer.id).map((a) => a.activity_date);
    expect(dates).toEqual(['2026-06-01', '2026-01-01']);
  });

  it('toggles task completion', async () => {
    const contact = await makeContact();
    const contactId = contact.id;
    const created = await api.activities.create({
      type: 'call',
      contact_id: contactId,
      description: 'Follow up next week',
      activity_date: '2026-07-01',
      due_date: '2026-07-08',
    });
    createdActivities.push(created.id);
    expect(created.done).toBe(false);
    expect(created.due_date).toBe('2026-07-08');

    const tasks = await api.activities.tasks();
    expect(tasks.some((t) => t.id === created.id)).toBe(true);

    const done = await api.activities.toggle(created.id);
    expect(done.done).toBe(true);

    const afterDone = await api.activities.list(contactId);
    expect(afterDone.find((a) => a.id === created.id)?.done).toBe(true);

    const notDone = await api.activities.toggle(created.id);
    expect(notDone.done).toBe(false);

    const afterNotDone = await api.activities.list(contactId);
    expect(afterNotDone.find((a) => a.id === created.id)?.done).toBe(false);
  });
});

describe('Dashboard', () => {
  it('reports won deals and revenue per month matching the underlying data', async () => {
    const month = '2027-03';
    const first = await makeDeal({ name: tag('Won A'), stage: 'won', value: 1000, close_date: `${month}-10` });
    const second = await makeDeal({ name: tag('Won B'), stage: 'won', value: 2500, close_date: `${month}-20` });
    await makeDeal({ name: tag('Lost'), stage: 'lost', value: 999999, close_date: `${month}-15` });

    const stats = await api.dashboard.stats();
    const won = stats.dealsWonPerMonth.find((m) => m.month === month);
    const revenue = stats.revenuePerMonth.find((m) => m.month === month);

    expect(won).toBeDefined();
    expect(revenue).toBeDefined();
    expect(won!.count).toBeGreaterThanOrEqual(2);
    expect(revenue!.total).toBeGreaterThanOrEqual(3500);

    await api.deals.delete(first.id);
    await api.deals.delete(second.id);

    const after = await api.dashboard.stats();
    expect(after.dealsWonPerMonth.find((m) => m.month === month)?.count ?? 0).toBeLessThan(won!.count);
  });

  it('feeds recent activity and tasks', async () => {
    const contact = await makeContact();
    const activity = await api.activities.create({
      type: 'email',
      contact_id: contact.id,
      description: tag('Dashboard note'),
      activity_date: '2027-05-01',
      due_date: '2027-05-20',
    });
    createdActivities.push(activity.id);

    const stats = await api.dashboard.stats();
    expect(stats.recentActivity.length).toBeGreaterThan(0);
    expect(stats.recentActivity.length).toBeLessThanOrEqual(10);
    expect(stats.tasks.some((t) => t.id === activity.id)).toBe(true);
  });
});
