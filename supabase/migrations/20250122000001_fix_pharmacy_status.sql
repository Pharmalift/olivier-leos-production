-- Fix pharmacy status constraint to use French values
-- Drop the old constraint
ALTER TABLE pharmacies DROP CONSTRAINT IF EXISTS pharmacies_status_check;

-- Add the new constraint with French values
ALTER TABLE pharmacies ADD CONSTRAINT pharmacies_status_check
  CHECK (status IN ('actif', 'inactif', 'prospect'));

-- Update existing data to match new values
UPDATE pharmacies SET status = 'actif' WHERE status = 'client';
UPDATE pharmacies SET status = 'inactif' WHERE status = 'inactive';
