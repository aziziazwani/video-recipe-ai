import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, Home, Library, Plus, MessageSquare, User, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/recipes', label: 'Recipe Library', icon: Library },
    { to: '/add-recipe', label: 'Add Recipe', icon: Plus },
    { to: '/chatboard', label: 'Chatboard', icon: MessageSquare },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <NavLink to="/" className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">RecipifAI</span>
          </NavLink>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <NavLink to="/auth">
                <Button>Sign In</Button>
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}