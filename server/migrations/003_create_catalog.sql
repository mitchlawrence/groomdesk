CREATE TABLE shop_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name text NOT NULL,
  opening_time time NOT NULL DEFAULT '09:00',
  closing_time time NOT NULL DEFAULT '18:00',
  slot_minutes smallint NOT NULL DEFAULT 30 CHECK (slot_minutes IN (15, 30, 60)),
  timezone text NOT NULL DEFAULT 'Asia/Manila',
  currency char(3) NOT NULL DEFAULT 'PHP',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closing_time > opening_time)
);

INSERT INTO shop_settings (shop_name) VALUES ('Groomdesk Grooming Shop');

CREATE TABLE size_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX size_categories_name_unique ON size_categories (lower(name));

CREATE TABLE services (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('package', 'add_on')),
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('dog', 'cat', 'all')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX services_name_unique ON services (lower(name));

CREATE TABLE service_prices (
  service_id integer NOT NULL REFERENCES services (id),
  size_category_id integer NOT NULL REFERENCES size_categories (id),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  PRIMARY KEY (service_id, size_category_id)
);

CREATE INDEX service_prices_size_idx ON service_prices (size_category_id);

CREATE TABLE stations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX stations_name_unique ON stations (lower(name));