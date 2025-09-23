import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, Users, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  category: string;
  country: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  is_favorited?: boolean;
}

export default function RecipeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id, user]);

  const fetchRecipe = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data && user) {
        // Check if recipe is favorited by current user
        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', id)
          .single();

        setRecipe({
          ...data,
          is_favorited: !!favoriteData
        });
      } else {
        setRecipe(data);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast({
        title: "Error",
        description: "Failed to load recipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !recipe) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to favorite recipes",
        variant: "destructive",
      });
      return;
    }

    try {
      if (recipe.is_favorited) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipe.id);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            recipe_id: recipe.id
          });
      }

      setRecipe(prev => prev ? { ...prev, is_favorited: !prev.is_favorited } : null);

      toast({
        title: recipe.is_favorited ? "Removed from favorites" : "Added to favorites",
        description: recipe.is_favorited 
          ? `${recipe.title} removed from your favorites` 
          : `${recipe.title} added to your favorites`,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading recipe...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Recipe not found.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Recipe Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">{recipe.title}</CardTitle>
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary">{recipe.category}</Badge>
                <Badge variant="outline">{recipe.country}</Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.steps.length} steps</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.ingredients.length} ingredients</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              className="p-2"
            >
              <Heart 
                className={`h-6 w-6 ${
                  recipe.is_favorited 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        {recipe.image_url && (
          <CardContent className="p-0">
            <div className="h-64 bg-muted rounded-b-lg overflow-hidden">
              <img 
                src={recipe.image_url} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Info */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Created on {new Date(recipe.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}