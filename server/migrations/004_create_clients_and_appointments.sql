CREATE TABLE owners (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX owners_full_name_idx ON owners (lower(full_name));
CREATE INDEX owners_phone_idx ON owners (phone);

CREATE TABLE pets (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id integer NOT NULL REFERENCES owners (id),
  name text NOT NULL,
  species text NOT NULL CHECK (species IN ('dog', 'cat')),
  breed text,
  sex text NOT NULL DEFAULT 'unknown' CHECK (sex IN ('male', 'female', 'unknown')),
  birth_date date,
  size_category_id integer NOT NULL REFERENCES size_categories (id),
  coat_type text CHECK (coat_type IN ('short', 'medium', 'long', 'double', 'curly', 'wire', 'hairless')),
  color text,
  temperament_notes text NOT NULL DEFAULT '',
  health_notes text NOT NULL DEFAULT '',
  rabies_expiry date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pets_owner_id_idx ON pets (owner_id);
CREATE INDEX pets_name_idx ON pets (lower(name));
CREATE INDEX pets_size_category_id_idx ON pets (size_category_id);

CREATE TABLE appointments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pet_id integer NOT NULL REFERENCES pets (id),
  station_id integer NOT NULL REFERENCES stations (id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz,
  paid_at timestamptz,
  payment_method text CHECK (payment_method IN ('cash', 'gcash', 'card')),
  created_by integer REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  CHECK ((paid_at IS NULL) = (payment_method IS NULL)),
  CHECK (paid_at IS NULL OR status = 'completed'),
  CONSTRAINT appointments_no_station_overlap EXCLUDE USING gist (
    station_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('scheduled', 'in_progress', 'completed'))
);

CREATE INDEX appointments_start_at_idx ON appointments (start_at);
CREATE INDEX appointments_pet_id_idx ON appointments (pet_id);

CREATE TABLE appointment_services (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id integer NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  service_id integer NOT NULL REFERENCES services (id),
  service_name text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  UNIQUE (appointment_id, service_id)
);

CREATE INDEX appointment_services_service_id_idx ON appointment_services (service_id);