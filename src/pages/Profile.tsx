import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Heart, Edit, Save, X, Settings, Book } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  username: string;
  email: string;
}

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  category: string;
  country: string;
  created_at: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    email: user?.email || ''
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    username: '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFavoriteRecipes();
      fetchMyRecipes();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData = {
          username: data.username || user.email?.split('@')[0] || '',
          email: data.email || user.email || ''
        };
        setProfile(profileData);
        setEditedProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchFavoriteRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          recipe_id,
          recipes (
            id,
            title,
            ingredients,
            steps,
            category,
            country,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const recipes = data?.map(fav => fav.recipes).filter(Boolean) as Recipe[] || [];
      setFavoriteRecipes(recipes);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
    }
  };

  const fetchMyRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMyRecipes(data || []);
    } catch (error) {
      console.error('Error fetching my recipes:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedProfile.username,
          email: editedProfile.email
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditMode(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const removeFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (error) throw error;

      setFavoriteRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      toast({
        title: "Removed from favorites",
        description: "Recipe removed from your favorites",
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please sign in to view your profile.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your recipes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editedProfile.username}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={updateProfile} disabled={loading} size="sm" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditedProfile(profile);
                    }}
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <p className="font-medium">{profile.username || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <Button onClick={() => setEditMode(true)} variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}

            <Separator />
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Account Actions</div>
              <Button onClick={handleSignOut} variant="destructive" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favorites ({favoriteRecipes.length})
              </TabsTrigger>
              <TabsTrigger value="my-recipes" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                My Recipes ({myRecipes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="mt-6">
              <div className="space-y-4">
                {favoriteRecipes.length > 0 ? (
                  favoriteRecipes.map((recipe) => (
                    <Card key={recipe.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{recipe.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{recipe.category}</Badge>
                            <Badge variant="outline">{recipe.country}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFavorite(recipe.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Ingredients: </span>
                          {recipe.ingredients.slice(0, 3).join(', ')}
                          {recipe.ingredients.length > 3 && (
                            <span> +{recipe.ingredients.length - 3} more</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {recipe.steps.length} steps • Added {new Date(recipe.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start exploring recipes and save your favorites here
                      </p>
                      <Button onClick={() => navigate('/recipes')}>
                        Browse Recipes
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my-recipes" className="mt-6">
              <div className="space-y-4">
                {myRecipes.length > 0 ? (
                  myRecipes.map((recipe) => (
                    <Card key={recipe.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{recipe.title}</h3>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{recipe.category}</Badge>
                            <Badge variant="outline">{recipe.country}</Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Ingredients: </span>
                          {recipe.ingredients.slice(0, 3).join(', ')}
                          {recipe.ingredients.length > 3 && (
                            <span> +{recipe.ingredients.length - 3} more</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {recipe.steps.length} steps • Created {new Date(recipe.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No recipes created yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start creating recipes by adding video links or manual entries
                      </p>
                      <Button onClick={() => navigate('/add-recipe')}>
                        Add Recipe
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}