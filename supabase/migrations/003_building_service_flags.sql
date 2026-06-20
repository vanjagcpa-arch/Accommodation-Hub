-- Add service flag columns to buildings table
-- manages_electricity: include in Electricity Billing module
-- manages_maintenance: include in Maintenance module
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS manages_electricity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS manages_maintenance boolean NOT NULL DEFAULT true;
