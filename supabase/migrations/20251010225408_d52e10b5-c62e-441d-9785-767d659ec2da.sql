-- Add UPDATE policy for founders_list so users can update their preferences
CREATE POLICY "Users can update their own entry by email"
ON public.founders_list
FOR UPDATE
USING (true)
WITH CHECK (true);