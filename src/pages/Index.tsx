import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, Library, Plus, MessageSquare, Star, Sparkles } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Plus,
      title: "Add Recipes",
      description: "Extract recipes from TikTok, YouTube, or Instagram videos using AI",
      to: "/add-recipe"
    },
    {
      icon: Library,
      title: "Recipe Library",
      description: "Browse and search through our collection of recipes",
      to: "/recipes"
    },
    {
      icon: MessageSquare,
      title: "AI Chatboard",
      description: "Get recipe suggestions based on ingredients you have",
      to: "/chatboard"
    },
    {
      icon: Star,
      title: "Favorites",
      description: "Save and organize your favorite recipes",
      to: "/profile"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <ChefHat className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              RecipifAI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Transform cooking videos into structured recipes with the power of AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <NavLink to="/add-recipe">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Recipe
                  </Button>
                </NavLink>
              ) : (
                <NavLink to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get Started Free
                  </Button>
                </NavLink>
              )}
              <NavLink to="/recipes">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Library className="h-5 w-5 mr-2" />
                  Explore Recipes
                </Button>
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to discover, create, and organize amazing recipes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <NavLink key={index} to={feature.to}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform any cooking video into a structured recipe in just a few clicks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Paste Video Link",
                description: "Copy any TikTok, YouTube, or Instagram cooking video URL"
              },
              {
                step: "2",
                title: "AI Analysis",
                description: "Our AI watches and extracts ingredients and cooking steps"
              },
              {
                step: "3",
                title: "Structured Recipe",
                description: "Get a clean, organized recipe ready to cook with"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to revolutionize your cooking?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of home cooks who are already using RecipifAI
          </p>
          {!user && (
            <NavLink to="/auth">
              <Button size="lg" variant="secondary">
                <Sparkles className="h-5 w-5 mr-2" />
                Start Cooking Smarter
              </Button>
            </NavLink>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
