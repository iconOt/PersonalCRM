-- Personal CRM schema
-- Single-user local CRM: organizations, contacts, deals, activities.

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'qualified', 'customer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value numeric(14, 2) NOT NULL DEFAULT 0,
  close_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'call', 'email')),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  activity_date date NOT NULL DEFAULT current_date,
  due_date date,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contacts_organization_id_idx ON public.contacts (organization_id);
CREATE INDEX contacts_status_idx ON public.contacts (status);
CREATE INDEX deals_organization_id_idx ON public.deals (organization_id);
CREATE INDEX deals_contact_id_idx ON public.deals (contact_id);
CREATE INDEX deals_stage_idx ON public.deals (stage);
CREATE INDEX activities_contact_id_idx ON public.activities (contact_id);
CREATE INDEX activities_deal_id_idx ON public.activities (deal_id);
CREATE INDEX activities_due_date_idx ON public.activities (due_date);
CREATE INDEX activities_activity_date_idx ON public.activities (activity_date);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

-- The CRM is single-user and local, so the SDK's anon role gets full access.
-- RLS is enabled with permissive policies so access is explicit rather than
-- relying on implicit table-wide grants.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_all ON public.organizations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY contacts_all ON public.contacts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY deals_all ON public.deals
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY activities_all ON public.activities
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
