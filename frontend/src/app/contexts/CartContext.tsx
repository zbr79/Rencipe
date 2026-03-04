"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface CartRecipe {
  _id: string;
  id?: string;
  title: string;
  description: string;
  servings: number;
  image?: string;
  ingredients: Array<{
    name: string;
    quantity: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    image?: string;
  }>;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
}

interface CartContextType {
  cartRecipes: CartRecipe[];
  loading: boolean;
  error: string | null;
  fetchCart: (userId: string) => Promise<void>;
  addToCart: (userId: string, recipeId: string) => Promise<void>;
  removeFromCart: (userId: string, recipeId: string) => Promise<void>;
  clearCart: (userId: string) => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartRecipes, setCartRecipes] = useState<CartRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async (userId: string) => {
    if (!userId) {
      setCartRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/carts?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      const data = await response.json();
      setCartRecipes(data.cart.recipes || []);
    } catch (err: any) {
      console.error("Error fetching cart:", err);
      setError(err.message);
      setCartRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (userId: string, recipeId: string) => {
    try {
      const response = await fetch(`/api/carts/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      const data = await response.json();
      setCartRecipes(data.cart.recipes || []);
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      setError(err.message);
    }
  };

  const removeFromCart = async (userId: string, recipeId: string) => {
    try {
      const response = await fetch(`/api/carts/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from cart");
      }

      const data = await response.json();
      setCartRecipes(data.cart.recipes || []);
    } catch (err: any) {
      console.error("Error removing from cart:", err);
      setError(err.message);
    }
  };

  const clearCart = async (userId: string) => {
    try {
      const response = await fetch(`/api/carts/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }

      const data = await response.json();
      setCartRecipes(data.cart.recipes || []);
    } catch (err: any) {
      console.error("Error clearing cart:", err);
      setError(err.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartRecipes,
        loading,
        error,
        fetchCart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount: cartRecipes.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
