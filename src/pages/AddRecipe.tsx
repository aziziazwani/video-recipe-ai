import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Link, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AddRecipe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    country: '',
    videoUrl: '',
    ingredients: [''],
    steps: [''],
  });

  const categories = ['simple', 'baking', 'traditional', 'dessert', 'appetizer', 'main course'];
  const countries = ['Korean', 'Thai', 'Malaysian', 'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'American', 'French'];

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step)
    }));
  };

  // Auto-send video URL to webhook with debounce
  useEffect(() => {
    if (!formData.videoUrl) return;

    const timeoutId = setTimeout(() => {
      processVideoUrl(formData.videoUrl);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [formData.videoUrl]);

  const processVideoUrl = async (videoUrl: string) => {
    // Check if URL is valid
    const isValidUrl = videoUrl.includes('tiktok.com') || 
                      videoUrl.includes('youtube.com') || 
                      videoUrl.includes('youtu.be') || 
                      videoUrl.includes('instagram.com');

    if (!isValidUrl) {
      return; // Silently ignore invalid URLs
    }

    setProcessingVideo(true);
    
    try {
      console.log('Processing video URL:', videoUrl);
      
      const { data, error } = await supabase.functions.invoke('send-recipe-link', {
        body: { recipeUrl: videoUrl }
      });

      if (error) {
        console.error('Webhook error:', error);
        throw error;
      }

      console.log('Webhook response:', data);
      
      // Parse and auto-fill form data from webhook response
      if (data && data.response) {
        parseWebhookResponse(data.response);
      }
      
    } catch (error) {
      console.error('Error processing video URL:', error);
      toast({
        title: "Processing Error",
        description: "Failed to extract recipe from video URL",
        variant: "destructive",
      });
    } finally {
      setProcessingVideo(false);
    }
  };

  const parseWebhookResponse = (response: any) => {
    try {
      // Handle nested structure where recipe data is in 'output' field
      let recipeData = response;
      if (response.output) {
        recipeData = typeof response.output === 'string' ? JSON.parse(response.output) : response.output;
      } else {
        recipeData = typeof response === 'string' ? JSON.parse(response) : response;
      }
      
      // Extract recipe data from the response (handle capitalized keys)
      const { Title, Ingredients, Steps, title, category, country, ingredients, steps } = recipeData;
      
      // Use capitalized keys first, fallback to lowercase
      const recipeTitle = Title || title;
      const recipeIngredients = Ingredients || ingredients;
      const recipeSteps = Steps || steps;
      
      if (recipeTitle || recipeIngredients || recipeSteps) {
        setFormData(prev => ({
          ...prev,
          title: recipeTitle || prev.title,
          category: category || prev.category,
          country: country || prev.country,
          ingredients: Array.isArray(recipeIngredients) && recipeIngredients.length > 0 ? recipeIngredients : prev.ingredients,
          steps: Array.isArray(recipeSteps) && recipeSteps.length > 0 ? recipeSteps : prev.steps,
        }));
        
        setIsAutoFilled(true);
        
        toast({
          title: "Recipe Extracted!",
          description: "Recipe data has been automatically filled from the video",
        });
      }
    } catch (parseError) {
      console.error('Error parsing webhook response:', parseError);
      // If parsing fails, just show the raw response
      toast({
        title: "Recipe Processing",
        description: "Video processed, please check the response below",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add recipes",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const validIngredients = formData.ingredients.filter(ing => ing.trim() !== '');
    const validSteps = formData.steps.filter(step => step.trim() !== '');

    if (validIngredients.length === 0 || validSteps.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one ingredient and one step",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('recipes')
        .insert({
          title: formData.title,
          ingredients: validIngredients,
          steps: validSteps,
          category: formData.category,
          country: formData.country,
          video_url: formData.videoUrl || null,
          link: formData.videoUrl || null,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Recipe added successfully",
      });

      navigate('/recipes');
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: "Error",
        description: "Failed to add recipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please sign in to add recipes.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video URL Input */}
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="videoUrl"
                  placeholder="Paste TikTok, YouTube, or Instagram video URL - recipe will auto-extract"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="pl-10 pr-10"
                />
                {processingVideo && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {formData.videoUrl && !processingVideo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        videoUrl: '',
                        title: '',
                        ingredients: [''],
                        steps: ['']
                      }));
                      setIsAutoFilled(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Paste a video URL and the recipe will be automatically extracted
              </p>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter recipe title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredients *</Label>
                {!isAutoFilled && (
                  <Button type="button" onClick={addIngredient} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ingredient
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Enter ingredient"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                    />
                    {formData.ingredients.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        size="sm"
                        variant="outline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Steps *</Label>
                {!isAutoFilled && (
                  <Button type="button" onClick={addStep} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">Step {index + 1}</Label>
                      <Textarea
                        placeholder="Describe this step"
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        rows={2}
                      />
                    </div>
                    {formData.steps.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeStep(index)}
                        size="sm"
                        variant="outline"
                        className="mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Adding Recipe...' : 'Add Recipe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}