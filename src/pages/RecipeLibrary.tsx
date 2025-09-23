import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Search, Filter, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  category: string;
  country: string;
  image_url?: string;
  created_at: string;
  is_favorited?: boolean;
}

export default function RecipeLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = ['simple', 'baking', 'traditional', 'dessert', 'appetizer', 'main course'];
  const countries = ['Korean', 'Thai', 'Malaysian', 'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese'];

  useEffect(() => {
    fetchRecipes();
  }, [user]);

  useEffect(() => {
    filterRecipes();
  }, [searchTerm, categoryFilter, countryFilter, recipes]);

  const fetchRecipes = async () => {
    try {
      let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (user) {
        // Check which recipes are favorited by the current user
        const { data: favorites } = await supabase
          .from('favorites')
          .select('recipe_id')
          .eq('user_id', user.id);

        const favoritedIds = new Set(favorites?.map(f => f.recipe_id) || []);
        
        const recipesWithFavorites = data?.map(recipe => ({
          ...recipe,
          is_favorited: favoritedIds.has(recipe.id)
        })) || [];

        setRecipes(recipesWithFavorites);
      } else {
        setRecipes(data || []);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Error",
        description: "Failed to load recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === categoryFilter);
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.country === countryFilter);
    }

    setFilteredRecipes(filtered);
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to favorite recipes",
        variant: "destructive",
      });
      return;
    }

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    try {
      if (recipe.is_favorited) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            recipe_id: recipeId
          });
      }

      // Update local state
      setRecipes(prev => prev.map(r =>
        r.id === recipeId ? { ...r, is_favorited: !r.is_favorited } : r
      ));

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
        <div className="text-center">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Recipe Library</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-muted-foreground mb-6">
          Showing {filteredRecipes.length} of {recipes.length} recipes
        </p>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/recipe/${recipe.id}`)}>
            <CardHeader className="p-0">
              <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                {recipe.image_url ? (
                  <img 
                    src={recipe.image_url} 
                    alt={recipe.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    <Users className="h-12 w-12" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(recipe.id);
                  }}
                  className="p-1 h-auto"
                >
                  <Heart 
                    className={`h-5 w-5 ${
                      recipe.is_favorited 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`}
                  />
                </Button>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary">{recipe.category}</Badge>
                <Badge variant="outline">{recipe.country}</Badge>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.steps.length} steps</span>
                </div>
                <div>
                  <span className="font-medium">Ingredients: </span>
                  <span>{recipe.ingredients.slice(0, 3).join(', ')}</span>
                  {recipe.ingredients.length > 3 && (
                    <span> +{recipe.ingredients.length - 3} more</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No recipes found matching your criteria.</div>
          <Button variant="outline">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}