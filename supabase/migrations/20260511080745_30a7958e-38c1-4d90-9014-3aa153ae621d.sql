
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

CREATE POLICY "view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Brands
CREATE TABLE public.car_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authed can read brands" ON public.car_brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins manage brands" ON public.car_brands
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.car_brands (name) VALUES
  ('MG'), ('Volkswagen'), ('Toyota'), ('Renault'),
  ('Peugeot'), ('Hyundai'), ('Kia'), ('Dacia'), ('Ford')
ON CONFLICT (name) DO NOTHING;

-- Username on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Admin can view/manage all users data
CREATE POLICY "admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins view all vehicles" ON public.vehicles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete vehicles" ON public.vehicles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins view all oil_changes" ON public.oil_changes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins view all maintenance" ON public.maintenance_items
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins view all insurance" ON public.insurance
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins view all scans" ON public.scans
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
