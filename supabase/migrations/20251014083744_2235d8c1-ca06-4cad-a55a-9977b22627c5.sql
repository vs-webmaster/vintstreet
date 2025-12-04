-- Drop the existing check constraint on attributes.data_type
ALTER TABLE public.attributes DROP CONSTRAINT IF EXISTS attributes_data_type_check;

-- Add new check constraint that includes multi-select
ALTER TABLE public.attributes ADD CONSTRAINT attributes_data_type_check 
  CHECK (data_type IN ('string', 'multi-select', 'number', 'boolean', 'date'));