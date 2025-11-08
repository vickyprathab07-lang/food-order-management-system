"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Minus, ShoppingCart, Tag } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  availability: boolean;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface Offer {
  id: number;
  title: string;
  description: string | null;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu items and offers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [menuResponse, offersResponse] = await Promise.all([
          fetch("/api/menu-items?limit=100&availability=true"),
          fetch("/api/offers?active=true&limit=10")
        ]);

        if (!menuResponse.ok) {
          throw new Error("Failed to fetch menu items");
        }

        if (!offersResponse.ok) {
          throw new Error("Failed to fetch offers");
        }

        const menuData = await menuResponse.json();
        const offersData = await offersResponse.json();

        setMenuItems(menuData);
        setOffers(offersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to load menu data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Add to cart
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      const newCart = cart.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      updateCart(newCart);
      toast.success(`Added another ${item.name} to cart`);
    } else {
      const newCart = [...cart, { ...item, quantity: 1 }];
      updateCart(newCart);
      toast.success(`${item.name} added to cart`);
    }
  };

  // Remove from cart
  const removeFromCart = (itemId: number) => {
    const existingItem = cart.find((cartItem) => cartItem.id === itemId);

    if (existingItem && existingItem.quantity > 1) {
      const newCart = cart.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
      updateCart(newCart);
    } else {
      const newCart = cart.filter((cartItem) => cartItem.id !== itemId);
      updateCart(newCart);
      toast.success("Item removed from cart");
    }
  };

  // Get item quantity in cart
  const getItemQuantity = (itemId: number) => {
    const item = cart.find((cartItem) => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  // Get unique categories
  const categories = ["All", ...new Set(menuItems.map((item) => item.category))];

  // Filter menu items by category
  const filteredItems = selectedCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />
                ))}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error Loading Menu</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Our Menu</h1>
              <p className="mt-2 text-muted-foreground">
                Explore our delicious selection of dishes
              </p>
            </div>

            {/* Active Offers */}
            {offers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Active Offers</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {offers.map((offer) => (
                    <Card key={offer.id} className="border-primary bg-primary/5">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Tag className="h-5 w-5 text-primary" />
                          <Badge variant="default">{offer.discountPercent}% OFF</Badge>
                        </div>
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        {offer.description && (
                          <CardDescription>{offer.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Valid until {new Date(offer.validUntil).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Categories</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="flex-shrink-0"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No items found in this category
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      {item.imageUrl && (
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl">{item.name}</CardTitle>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                        {item.description && (
                          <CardDescription className="line-clamp-2">
                            {item.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-foreground">
                          ₹{item.price}
                        </p>
                      </CardContent>
                      <CardFooter className="flex items-center justify-between">
                        {quantity > 0 ? (
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full gap-2"
                            onClick={() => addToCart(item)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}