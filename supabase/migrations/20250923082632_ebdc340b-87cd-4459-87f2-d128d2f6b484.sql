-- Create scheduled_show_products table to link shows with their products
CREATE TABLE IF NOT EXISTS public.scheduled_show_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for scheduled_show_products
ALTER TABLE public.scheduled_show_products ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_show_products
CREATE POLICY "Sellers can view their show products" 
ON public.scheduled_show_products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.streams 
    WHERE streams.id = show_id 
    AND streams.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can insert their show products" 
ON public.scheduled_show_products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.streams 
    WHERE streams.id = show_id 
    AND streams.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can update their show products" 
ON public.scheduled_show_products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.streams 
    WHERE streams.id = show_id 
    AND streams.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can delete their show products" 
ON public.scheduled_show_products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.streams 
    WHERE streams.id = show_id 
    AND streams.seller_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_show_products_updated_at
BEFORE UPDATE ON public.scheduled_show_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();