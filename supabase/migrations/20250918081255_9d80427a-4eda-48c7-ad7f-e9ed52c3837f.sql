-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix function search path security issue by dropping triggers first
DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
DROP TRIGGER IF EXISTS update_webhook_submissions_updated_at ON public.webhook_submissions;

-- Now drop and recreate the function with proper search path
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the triggers
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_submissions_updated_at
BEFORE UPDATE ON public.webhook_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();