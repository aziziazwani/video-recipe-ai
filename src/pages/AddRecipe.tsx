import React, { useState } from 'react';
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
  const [extracting, setExtracting] = useState(false);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  
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

  const extractFromVideo = async () => {
    if (!formData.videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a video URL first",
        variant: "destructive",
      });
      return;
    }

    // Check if URL is from supported platforms
    const isValidUrl = formData.videoUrl.includes('tiktok.com') || 
                      formData.videoUrl.includes('youtube.com') || 
                      formData.videoUrl.includes('youtu.be') || 
                      formData.videoUrl.includes('instagram.com');

    if (!isValidUrl) {
      toast({
        title: "Unsupported URL",
        description: "Please use TikTok, YouTube, or Instagram video URLs",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    
    // Simulate AI extraction process for now
    // In a real implementation, this would call an AI service
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        title: "AI-Extracted Recipe from Video",
        category: "simple",
        country: "Korean",
        ingredients: [
          "2 eggs",
          "1 cup rice",
          "2 tbsp soy sauce",
          "1 onion, diced",
          "2 cloves garlic, minced"
        ],
        steps: [
          "Heat oil in a pan over medium heat",
          "Add diced onion and cook until translucent",
          "Add minced garlic and cook for 1 minute",
          "Add rice and stir to combine",
          "Push rice to one side, scramble eggs on the other side",
          "Mix everything together and add soy sauce",
          "Cook for 2-3 minutes and serve hot"
        ]
      }));
      
      toast({
        title: "Recipe Extracted!",
        description: "AI has successfully extracted the recipe from the video. Please review and edit as needed.",
      });
      setExtracting(false);
    }, 3000);
  };

  const sendRecipeLink = async () => {
    if (!formData.videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a video URL first",
        variant: "destructive",
      });
      return;
    }

    setSendingWebhook(true);
    
    try {
      console.log('Sending recipe link to webhook:', formData.videoUrl);
      
      const { data, error } = await supabase.functions.invoke('send-recipe-link', {
        body: { recipeUrl: formData.videoUrl }
      });

      if (error) {
        console.error('Webhook error:', error);
        throw error;
      }

      console.log('Webhook response:', data);
      
      toast({
        title: "Success!",
        description: "Recipe link sent successfully to your n8n workflow",
      });
      
    } catch (error) {
      console.error('Error sending recipe link:', error);
      toast({
        title: "Error",
        description: "Failed to send recipe link to webhook",
        variant: "destructive",
      });
    } finally {
      setSendingWebhook(false);
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
          created_by: user.id
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
              <Label htmlFor="videoUrl">Video URL (Optional)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="videoUrl"
                    placeholder="Paste TikTok, YouTube, or Instagram video URL"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  onClick={extractFromVideo}
                  disabled={!formData.videoUrl || extracting}
                  variant="outline"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    'Extract Recipe'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={sendRecipeLink}
                  disabled={!formData.videoUrl || sendingWebhook}
                  variant="secondary"
                >
                  {sendingWebhook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Submit Recipe'
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Our AI will analyze the video and extract the recipe automatically
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
                <Button type="button" onClick={addIngredient} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
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
                <Button type="button" onClick={addStep} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
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