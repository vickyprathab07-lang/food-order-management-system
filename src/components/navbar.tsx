"use client";

import Link from "next/link";
import { ShoppingCart, User, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    // Check if customer is logged in
    const customer = localStorage.getItem("customer");
    if (customer) {
      const customerData = JSON.parse(customer);
      setCustomerName(customerData.name);
    }

    // Get cart count
    const cart = localStorage.getItem("cart");
    if (cart) {
      const cartItems = JSON.parse(cart);
      const count = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    }

    // Listen for cart updates
    const handleStorageChange = () => {
      const cart = localStorage.getItem("cart");
      if (cart) {
        const cartItems = JSON.parse(cart);
        const count = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    setCustomerName(null);
    window.location.href = "/";
  };

  return (
    <nav className="border-b bg-white dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Mad Rascal Canteen</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/menu">
              <Button variant="ghost">Menu</Button>
            </Link>

            <Link href="/checkout" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {customerName ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Hi, {customerName}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}