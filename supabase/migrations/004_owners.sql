-- Create property owners (landlords) table
CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  company_name text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id)
);

-- Link each property to its owner (landlord)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES owners(id);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
