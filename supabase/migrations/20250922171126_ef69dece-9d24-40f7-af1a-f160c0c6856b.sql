-- Create streams table
CREATE TABLE public.streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT DEFAULT '2',
  timezone TEXT DEFAULT 'Europe/London',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('live', 'scheduled', 'ended')),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  category TEXT NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Create policies for streams
CREATE POLICY "Streams are viewable by everyone" 
ON public.streams 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own streams" 
ON public.streams 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own streams" 
ON public.streams 
FOR UPDATE 
USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own streams" 
ON public.streams 
FOR DELETE 
USING (auth.uid() = seller_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_streams_updated_at
BEFORE UPDATE ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_streams_seller_id ON public.streams(seller_id);
CREATE INDEX idx_streams_status ON public.streams(status);
CREATE INDEX idx_streams_start_time ON public.streams(start_time);