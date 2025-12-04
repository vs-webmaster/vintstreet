-- Add reported/flagged fields to messages table
ALTER TABLE public.messages 
ADD COLUMN reported_by uuid REFERENCES auth.users(id),
ADD COLUMN reported_at timestamp with time zone,
ADD COLUMN report_reason text,
ADD COLUMN is_flagged boolean DEFAULT false;

-- Add index for efficient flagged message queries
CREATE INDEX idx_messages_flagged ON public.messages(is_flagged, created_at DESC) WHERE is_flagged = true;

-- Update RLS policies to allow reporting
CREATE POLICY "Users can report messages they're involved in"
ON public.messages
FOR UPDATE
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));