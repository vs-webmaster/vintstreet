-- ================================================================
-- PHASE 1: Audit Logging Tables and Triggers
-- ================================================================

-- Create audit table for product images changes
CREATE TABLE public.audit_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  old_images JSONB,
  new_images JSONB,
  operation TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_info TEXT
);

-- Create audit table for product attribute values
CREATE TABLE public.audit_product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  attribute_id UUID,
  old_values JSONB,
  new_values JSONB,
  operation TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_info TEXT
);

-- Create audit table for product tag links
CREATE TABLE public.audit_product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  tag_id UUID,
  operation TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_info TEXT
);

-- Enable RLS on audit tables
ALTER TABLE public.audit_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_product_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only admins can read audit logs
CREATE POLICY "Admins can view product image audit logs"
ON public.audit_product_images FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view product attribute audit logs"
ON public.audit_product_attributes FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view product tag audit logs"
ON public.audit_product_tags FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies: Admins can delete old audit logs (for cleanup)
CREATE POLICY "Admins can delete old product image audit logs"
ON public.audit_product_images FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete old product attribute audit logs"
ON public.audit_product_attributes FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete old product tag audit logs"
ON public.audit_product_tags FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for efficient querying
CREATE INDEX idx_audit_product_images_listing_id ON public.audit_product_images(listing_id);
CREATE INDEX idx_audit_product_images_changed_at ON public.audit_product_images(changed_at DESC);
CREATE INDEX idx_audit_product_attributes_product_id ON public.audit_product_attributes(product_id);
CREATE INDEX idx_audit_product_attributes_changed_at ON public.audit_product_attributes(changed_at DESC);
CREATE INDEX idx_audit_product_tags_product_id ON public.audit_product_tags(product_id);
CREATE INDEX idx_audit_product_tags_changed_at ON public.audit_product_tags(changed_at DESC);

-- ================================================================
-- AUDIT TRIGGERS
-- ================================================================

-- Trigger function for product_images changes in listings table
CREATE OR REPLACE FUNCTION public.audit_product_images_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only audit if product_images actually changed
  IF OLD.product_images IS DISTINCT FROM NEW.product_images THEN
    INSERT INTO public.audit_product_images (
      listing_id,
      old_images,
      new_images,
      operation,
      changed_by,
      source_info
    ) VALUES (
      NEW.id,
      to_jsonb(OLD.product_images),
      to_jsonb(NEW.product_images),
      'UPDATE',
      auth.uid(),
      'listings table update'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for product_attribute_values changes
CREATE OR REPLACE FUNCTION public.audit_product_attribute_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_product_attributes (
      product_id,
      attribute_id,
      old_values,
      new_values,
      operation,
      changed_by,
      source_info
    ) VALUES (
      NEW.product_id,
      NEW.attribute_id,
      NULL,
      jsonb_build_object(
        'value_text', NEW.value_text,
        'value_number', NEW.value_number,
        'value_boolean', NEW.value_boolean,
        'value_date', NEW.value_date
      ),
      'INSERT',
      auth.uid(),
      'product_attribute_values insert'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_product_attributes (
      product_id,
      attribute_id,
      old_values,
      new_values,
      operation,
      changed_by,
      source_info
    ) VALUES (
      NEW.product_id,
      NEW.attribute_id,
      jsonb_build_object(
        'value_text', OLD.value_text,
        'value_number', OLD.value_number,
        'value_boolean', OLD.value_boolean,
        'value_date', OLD.value_date
      ),
      jsonb_build_object(
        'value_text', NEW.value_text,
        'value_number', NEW.value_number,
        'value_boolean', NEW.value_boolean,
        'value_date', NEW.value_date
      ),
      'UPDATE',
      auth.uid(),
      'product_attribute_values update'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_product_attributes (
      product_id,
      attribute_id,
      old_values,
      new_values,
      operation,
      changed_by,
      source_info
    ) VALUES (
      OLD.product_id,
      OLD.attribute_id,
      jsonb_build_object(
        'value_text', OLD.value_text,
        'value_number', OLD.value_number,
        'value_boolean', OLD.value_boolean,
        'value_date', OLD.value_date
      ),
      NULL,
      'DELETE',
      auth.uid(),
      'product_attribute_values delete'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger function for product_tag_links changes
CREATE OR REPLACE FUNCTION public.audit_product_tag_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_product_tags (
      product_id,
      tag_id,
      operation,
      changed_by,
      source_info
    ) VALUES (
      NEW.product_id,
      NEW.tag_id,
      'INSERT',
      auth.uid(),
      'product_tag_links insert'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_product_tags (
      product_id,
      tag_id,
      operation,
      changed_by,
      source_info
    ) VALUES (
      OLD.product_id,
      OLD.tag_id,
      'DELETE',
      auth.uid(),
      'product_tag_links delete'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create the triggers
CREATE TRIGGER audit_listings_product_images
  AFTER UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_product_images_changes();

CREATE TRIGGER audit_product_attribute_values_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.product_attribute_values
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_product_attribute_changes();

CREATE TRIGGER audit_product_tag_links_changes
  AFTER INSERT OR DELETE ON public.product_tag_links
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_product_tag_changes();