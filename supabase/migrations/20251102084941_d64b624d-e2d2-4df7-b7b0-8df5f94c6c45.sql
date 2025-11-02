-- Create requests table for storing API request comparisons
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  body JSONB,
  prod_response JSONB,
  prep_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  diff_status TEXT CHECK (diff_status IN ('identical', 'different', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_duration_ms INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access (since this is a developer tool)
CREATE POLICY "Allow public access to requests"
ON public.requests
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_diff_status ON public.requests(diff_status);
CREATE INDEX idx_requests_created_at ON public.requests(created_at DESC);
CREATE INDEX idx_requests_endpoint ON public.requests(endpoint);

-- Enable realtime for the requests table
ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;