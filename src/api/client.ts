import { createClient } from '@insforge/sdk';
import type { Activity, Contact, DashboardStats, Deal, Organization } from '../types';

const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL as string,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY as string,
});

const LIST_LIMIT = 1000;

type Row = Record<string, any>;

async function unwrap<T>(request: PromiseLike<{ data: any; error: any }>): Promise<T> {
  const { data, error } = await request;
  if (error) {
    throw new Error(error.message || 'InsForge request failed');
  }
  return data as T;
}

function likeTerm(search: string): string {
  return search.replace(/[,()"\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

function nullableId(value: unknown): string | null {
  return value === '' || value === null || value === undefined ? null : (value as string);
}

function nullableDate(value: unknown): string | null {
  return value === '' || value === null || value === undefined ? null : (value as string);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function pick(source: Row, fields: readonly string[]): Row {
  const out: Row = {};
  for (const field of fields) {
    if (source && Object.prototype.hasOwnProperty.call(source, field) && source[field] !== undefined) {
      out[field] = source[field];
    }
  }
  return out;
}

const ACTIVITY_SELECT =
  'id, type, contact_id, deal_id, description, activity_date, due_date, done, created_at, updated_at, contacts(name), deals(name)';

function mapActivity(row: Row): Activity {
  const { contacts, deals, ...rest } = row;
  return {
    ...rest,
    contact_name: contacts?.name ?? null,
    deal_name: deals?.name ?? null,
  } as Activity;
}

const DEAL_SELECT =
  'id, name, organization_id, contact_id, stage, value, close_date, created_at, updated_at, organizations(name), contacts(name)';

function mapDeal(row: Row): Deal {
  const { organizations, contacts, ...rest } = row;
  return {
    ...rest,
    value: Number(rest.value ?? 0),
    organization_name: organizations?.name ?? null,
    contact_name: contacts?.name ?? null,
  } as Deal;
}

const CONTACT_SELECT =
  'id, name, email, phone, job_title, organization_id, status, created_at, updated_at, organizations(name)';

function mapContact(row: Row): Contact {
  const { organizations, ...rest } = row;
  return {
    ...rest,
    organization_name: organizations?.name ?? null,
  } as Contact;
}

const ORGANIZATION_SELECT = 'id, name, website, industry, notes, created_at, updated_at';

function toOrganizationPayload(data: Row): Row {
  return pick(data, ['name', 'website', 'industry', 'notes']);
}

function toContactPayload(data: Row): Row {
  const payload = pick(data, ['name', 'email', 'phone', 'job_title', 'status']);
  if ('organization_id' in data) payload.organization_id = nullableId(data.organization_id);
  return payload;
}

function toDealPayload(data: Row): Row {
  const payload = pick(data, ['name', 'stage']);
  if ('organization_id' in data) payload.organization_id = nullableId(data.organization_id);
  if ('contact_id' in data) payload.contact_id = nullableId(data.contact_id);
  if ('close_date' in data) payload.close_date = nullableDate(data.close_date);
  if ('value' in data) payload.value = Number(data.value) || 0;
  return payload;
}

function toActivityPayload(data: Row): Row {
  const payload = pick(data, ['type', 'description', 'done']);
  if ('contact_id' in data) payload.contact_id = nullableId(data.contact_id);
  if ('deal_id' in data) payload.deal_id = nullableId(data.deal_id);
  if ('due_date' in data) payload.due_date = nullableDate(data.due_date);
  if ('activity_date' in data) {
    payload.activity_date = nullableDate(data.activity_date) ?? today();
  }
  if ('done' in data) payload.done = Boolean(data.done);
  return payload;
}

async function listActivities(filter?: { contactId?: string; dealId?: string }): Promise<Activity[]> {
  let query = insforge.database
    .from('activities')
    .select(ACTIVITY_SELECT)
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  if (filter?.contactId) query = query.eq('contact_id', filter.contactId);
  if (filter?.dealId) query = query.eq('deal_id', filter.dealId);

  return (await unwrap<Row[]>(query)).map(mapActivity);
}

export const api = {
  organizations: {
    async list(search?: string): Promise<Organization[]> {
      let query = insforge.database
        .from('organizations')
        .select(ORGANIZATION_SELECT)
        .order('name', { ascending: true })
        .limit(LIST_LIMIT);

      const term = search ? likeTerm(search) : '';
      if (term) {
        query = query.or(`name.ilike.*${term}*,website.ilike.*${term}*,industry.ilike.*${term}*`);
      }

      return unwrap<Organization[]>(query);
    },

    async get(id: string): Promise<Organization> {
      const row = await unwrap<Row>(
        insforge.database
          .from('organizations')
          .select(
            `${ORGANIZATION_SELECT}, contacts(id, name, email, job_title), deals(id, name, stage, value, close_date, contacts(name))`,
          )
          .eq('id', id)
          .single(),
      );

      const { contacts, deals, ...rest } = row;
      return {
        ...rest,
        contacts: contacts ?? [],
        deals: (deals ?? []).map(({ contacts: dealContact, ...deal }: Row) => ({
          ...deal,
          value: Number(deal.value ?? 0),
          organization_name: rest.name,
          contact_name: dealContact?.name ?? null,
        })),
      } as Organization;
    },

    async create(data: Row): Promise<Organization> {
      return unwrap<Organization>(
        insforge.database.from('organizations').insert([toOrganizationPayload(data)]).select().single(),
      );
    },

    async update(id: string, data: Row): Promise<Organization> {
      return unwrap<Organization>(
        insforge.database
          .from('organizations')
          .update(toOrganizationPayload(data))
          .eq('id', id)
          .select()
          .single(),
      );
    },

    async delete(id: string): Promise<void> {
      await unwrap(insforge.database.from('organizations').delete().eq('id', id));
    },
  },

  contacts: {
    async list(search?: string, status?: string): Promise<Contact[]> {
      let query = insforge.database
        .from('contacts')
        .select(CONTACT_SELECT)
        .order('name', { ascending: true })
        .limit(LIST_LIMIT);

      if (status) query = query.eq('status', status);

      const term = search ? likeTerm(search) : '';
      if (term) {
        query = query.or(`name.ilike.*${term}*,email.ilike.*${term}*,phone.ilike.*${term}*`);
      }

      return (await unwrap<Row[]>(query)).map(mapContact);
    },

    async get(id: string): Promise<Contact & { deals: Deal[]; activities: Activity[] }> {
      const row = await unwrap<Row>(
        insforge.database
          .from('contacts')
          .select(`${CONTACT_SELECT}, deals(id, name, stage, value, close_date, contacts(name))`)
          .eq('id', id)
          .single(),
      );

      const contact = mapContact(row);
      const activities = await listActivities({ contactId: id });

      return {
        ...contact,
        deals: (row.deals ?? []).map(({ contacts, ...deal }: Row) => ({
          ...deal,
          value: Number(deal.value ?? 0),
          contact_name: contacts?.name ?? null,
        })),
        activities,
      } as Contact & { deals: Deal[]; activities: Activity[] };
    },

    async create(data: Row): Promise<Contact> {
      return unwrap<Contact>(insforge.database.from('contacts').insert([toContactPayload(data)]).select().single());
    },

    async update(id: string, data: Row): Promise<Contact> {
      return unwrap<Contact>(
        insforge.database.from('contacts').update(toContactPayload(data)).eq('id', id).select().single(),
      );
    },

    async delete(id: string): Promise<void> {
      await unwrap(insforge.database.from('contacts').delete().eq('id', id));
    },
  },

  deals: {
    async list(search?: string, stage?: string): Promise<Deal[]> {
      let query = insforge.database
        .from('deals')
        .select(DEAL_SELECT)
        .order('name', { ascending: true })
        .limit(LIST_LIMIT);

      if (stage) query = query.eq('stage', stage);

      const term = search ? likeTerm(search) : '';
      if (term) {
        query = query.or(`name.ilike.*${term}*`);
      }

      return (await unwrap<Row[]>(query)).map(mapDeal);
    },

    async get(id: string): Promise<Deal & { activities: Activity[] }> {
      const row = await unwrap<Row>(
        insforge.database
          .from('deals')
          .select(`${DEAL_SELECT}, activities(${ACTIVITY_SELECT})`)
          .eq('id', id)
          .single(),
      );

      const deal = mapDeal(row);
      const activities = (row.activities ?? []).map(mapActivity);

      return { ...deal, activities } as Deal & { activities: Activity[] };
    },

    async create(data: Row): Promise<Deal> {
      return unwrap<Deal>(insforge.database.from('deals').insert([toDealPayload(data)]).select().single());
    },

    async update(id: string, data: Row): Promise<Deal> {
      return unwrap<Deal>(
        insforge.database.from('deals').update(toDealPayload(data)).eq('id', id).select().single(),
      );
    },

    async delete(id: string): Promise<void> {
      await unwrap(insforge.database.from('deals').delete().eq('id', id));
    },
  },

  activities: {
    list: (contactId?: string, dealId?: string) => listActivities({ contactId, dealId }),

    async tasks(): Promise<Activity[]> {
      const rows = await unwrap<Row[]>(
        insforge.database
          .from('activities')
          .select(ACTIVITY_SELECT)
          .not('due_date', 'is', null)
          .eq('done', false)
          .order('due_date', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(LIST_LIMIT),
      );
      return rows.map(mapActivity);
    },

    async create(data: Row): Promise<Activity> {
      const row = await unwrap<Row>(
        insforge.database
          .from('activities')
          .insert([toActivityPayload(data)])
          .select(ACTIVITY_SELECT)
          .single(),
      );
      return mapActivity(row);
    },

    async update(id: string, data: Row): Promise<Activity> {
      const row = await unwrap<Row>(
        insforge.database
          .from('activities')
          .update(toActivityPayload(data))
          .eq('id', id)
          .select(ACTIVITY_SELECT)
          .single(),
      );
      return mapActivity(row);
    },

    async toggle(id: string): Promise<Activity> {
      const current = await unwrap<Row>(insforge.database.from('activities').select('done').eq('id', id).single());
      return api.activities.update(id, { done: !current.done });
    },

    async delete(id: string): Promise<void> {
      await unwrap(insforge.database.from('activities').delete().eq('id', id));
    },
  },

  dashboard: {
    async stats(): Promise<DashboardStats> {
      const [wonDeals, recentActivity, tasks] = await Promise.all([
        unwrap<Row[]>(
          insforge.database.from('deals').select('value, close_date').eq('stage', 'won').limit(LIST_LIMIT),
        ),
        listActivities().then((rows) => rows.slice(0, 10)),
        api.activities.tasks(),
      ]);

      const byMonth = new Map<string, { month: string; count: number; total: number }>();
      for (const deal of wonDeals) {
        if (!deal.close_date) continue;
        const month = String(deal.close_date).slice(0, 7);
        const entry = byMonth.get(month) ?? { month, count: 0, total: 0 };
        entry.count += 1;
        entry.total += Number(deal.value ?? 0);
        byMonth.set(month, entry);
      }

      const monthly = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));

      return {
        dealsWonPerMonth: monthly.map(({ month, count }) => ({ month, count })),
        revenuePerMonth: monthly.map(({ month, total }) => ({ month, total })),
        recentActivity,
        tasks,
      };
    },
  },
};
