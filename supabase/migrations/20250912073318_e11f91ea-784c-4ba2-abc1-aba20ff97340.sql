-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recipes table
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  steps TEXT[] NOT NULL,
  category TEXT,
  country TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table for user recipe favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Create webhook_submissions table to track recipe link submissions
CREATE TABLE public.webhook_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_url TEXT NOT NULL,
  webhook_response TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for recipes
CREATE POLICY "Anyone can view recipes" 
  ON public.recipes FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own recipes" 
  ON public.recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" 
  ON public.recipes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" 
  ON public.recipes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for favorites
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
  ON public.favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
  ON public.favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for webhook_submissions
CREATE POLICY "Users can view their own webhook submissions" 
  ON public.webhook_submissions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook submissions" 
  ON public.webhook_submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook submissions" 
  ON public.webhook_submissions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_submissions_updated_at
  BEFORE UPDATE ON public.webhook_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();