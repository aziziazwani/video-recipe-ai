import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ChefHat, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RecipeSuggestion {
  title: string;
  ingredients: string[];
  steps: string[];
  category: string;
  country: string;
}

export default function Chatboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim().toLowerCase())) {
      setIngredients(prev => [...prev, inputValue.trim().toLowerCase()]);
      setInputValue('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(prev => prev.filter(ing => ing !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const getSuggestions = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "No ingredients",
        description: "Please add some ingredients first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Simulate AI processing for demo purposes
    // In a real app, this would call an AI service
    setTimeout(() => {
      const mockSuggestions: RecipeSuggestion[] = [
        {
          title: "Simple Fried Rice",
          ingredients: ingredients.filter(ing => ['egg', 'rice', 'soy sauce', 'garlic', 'onion'].includes(ing)),
          steps: [
            "Heat oil in a wok or large pan",
            "Scramble the eggs and set aside",
            "Sauté garlic and onion until fragrant",
            "Add rice and mix well",
            "Add soy sauce and scrambled eggs",
            "Stir-fry for 2-3 minutes and serve"
          ],
          category: "simple",
          country: "Asian"
        },
        {
          title: "Quick Veggie Stir Fry",
          ingredients: ingredients.filter(ing => ['garlic', 'onion', 'soy sauce', 'chili'].includes(ing)),
          steps: [
            "Heat oil in a pan",
            "Add garlic and chili",
            "Add onion and any vegetables you have",
            "Stir-fry for 3-4 minutes",
            "Add soy sauce to taste",
            "Serve immediately"
          ],
          category: "simple", 
          country: "Asian"
        }
      ].filter(recipe => recipe.ingredients.length > 0);

      setSuggestions(mockSuggestions);
      setLoading(false);

      if (mockSuggestions.length === 0) {
        toast({
          title: "No recipes found",
          description: "Try adding more common ingredients like egg, rice, onion, garlic, etc.",
        });
      } else {
        toast({
          title: "Recipes found!",
          description: `Found ${mockSuggestions.length} recipe${mockSuggestions.length > 1 ? 's' : ''} you can make`,
        });
      }
    }, 2000);
  };

  const clearAll = () => {
    setIngredients([]);
    setSuggestions([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">AI Chatboard</h1>
        <p className="text-muted-foreground">
          Tell us what ingredients you have, and we'll suggest recipes you can make right now!
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            What's in your kitchen?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type an ingredient (e.g., egg, rice, chicken)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addIngredient} disabled={!inputValue.trim()}>
              Add
            </Button>
          </div>

          {ingredients.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={getSuggestions} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding recipes...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Get Recipe Suggestions
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Recipe Suggestions</h2>
          <div className="grid gap-6">
            {suggestions.map((recipe, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{recipe.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{recipe.category}</Badge>
                      <Badge variant="outline">{recipe.country}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ingredients you have:</h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Steps:</h4>
                    <ol className="space-y-1">
                      {recipe.steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{idx + 1}.</span> {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {ingredients.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to cook?</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding ingredients you have available in your kitchen
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['egg', 'rice', 'chicken', 'onion', 'garlic', 'soy sauce', 'tomato', 'cheese'].map((ingredient) => (
                <Button
                  key={ingredient}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIngredients(prev => [...prev, ingredient]);
                  }}
                >
                  + {ingredient}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}