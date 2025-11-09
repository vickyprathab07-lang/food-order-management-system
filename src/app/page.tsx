import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ShoppingBag, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Mad Rascal Canteen</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/menu">
              <Button variant="ghost">Menu</Button>
            </Link>
            <Link href="/login">
              <Button variant="default">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-4">Delicious Food, Delivered Fast</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Order your favorite meals online and get them fresh and hot. Track your order in real-time!
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/menu">
            <Button size="lg" className="text-lg px-8">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Order Now
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Sign Up
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Get your food delivered in 30 minutes or less
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Easy Ordering</h3>
              <p className="text-muted-foreground">
                Simple and intuitive ordering process with live tracking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Special Offers</h3>
              <p className="text-muted-foreground">
                Exclusive deals and discounts for our valued customers
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-16 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Browse our menu and place your order in just a few clicks
          </p>
          <Link href="/menu">
            <Button size="lg" className="text-lg px-8">
              View Menu
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Mad Rascal Canteen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}