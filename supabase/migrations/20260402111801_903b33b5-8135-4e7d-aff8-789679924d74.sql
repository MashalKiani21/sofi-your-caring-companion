
CREATE TABLE public.navigation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_name TEXT NOT NULL,
  destination_address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.navigation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own navigation history"
  ON public.navigation_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own navigation history"
  ON public.navigation_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own navigation history"
  ON public.navigation_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
