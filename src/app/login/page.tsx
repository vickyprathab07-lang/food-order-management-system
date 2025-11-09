"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, ChefHat, Shield } from "lucide-react";
import { toast } from "sonner";

// Predefined credentials for kitchen and admin
const KITCHEN_PASSWORD = "kitchen123";
const ADMIN_PASSWORD = "admin123";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "kitchen" | "admin">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Handle Kitchen Login
      if (role === "kitchen") {
        if (password === KITCHEN_PASSWORD) {
          const kitchenUser = {
            id: "kitchen",
            name: "Kitchen Staff",
            email: "kitchen@quickbite.com",
            role: "kitchen"
          };
          localStorage.setItem("customer", JSON.stringify(kitchenUser));
          toast.success("Welcome to Kitchen Dashboard!");
          router.push("/kitchen");
        } else {
          toast.error("Invalid kitchen password");
          setIsLoading(false);
        }
        return;
      }

      // Handle Admin Login
      if (role === "admin") {
        if (password === ADMIN_PASSWORD) {
          const adminUser = {
            id: "admin",
            name: "Admin",
            email: "admin@quickbite.com",
            role: "admin"
          };
          localStorage.setItem("customer", JSON.stringify(adminUser));
          toast.success("Welcome to Admin Dashboard!");
          router.push("/admin");
        } else {
          toast.error("Invalid admin password");
          setIsLoading(false);
        }
        return;
      }

      // Handle Customer Login
      const existingCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
      const customer = existingCustomers.find((c: any) => c.email === email);

      if (!customer) {
        toast.error("Account not found. Please sign up first.");
        setIsLoading(false);
        return;
      }

      if (customer.password !== password) {
        toast.error("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Store logged-in customer
      localStorage.setItem("customer", JSON.stringify({ ...customer, role: "customer" }));
      
      toast.success("Welcome back!");
      router.push("/menu");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {role === "kitchen" ? (
              <ChefHat className="h-12 w-12 text-primary" />
            ) : role === "admin" ? (
              <Shield className="h-12 w-12 text-primary" />
            ) : (
              <ShoppingBag className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {role === "kitchen" ? "Kitchen Login" : role === "admin" ? "Admin Login" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {role === "kitchen" 
              ? "Enter kitchen password to access dashboard" 
              : role === "admin"
              ? "Enter admin password to access dashboard"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label>Login As</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={role === "customer" ? "default" : "outline"}
                  onClick={() => setRole("customer")}
                  className="w-full"
                >
                  Customer
                </Button>
                <Button
                  type="button"
                  variant={role === "kitchen" ? "default" : "outline"}
                  onClick={() => setRole("kitchen")}
                  className="w-full"
                >
                  Kitchen
                </Button>
                <Button
                  type="button"
                  variant={role === "admin" ? "default" : "outline"}
                  onClick={() => setRole("admin")}
                  className="w-full"
                >
                  Admin
                </Button>
              </div>
            </div>

            {/* Email field only for customers */}
            {role === "customer" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                {role === "customer" ? "Password" : `${role.charAt(0).toUpperCase() + role.slice(1)} Password`}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
              />
              {role === "kitchen" && (
                <p className="text-xs text-muted-foreground">Hint: kitchen123</p>
              )}
              {role === "admin" && (
                <p className="text-xs text-muted-foreground">Hint: admin123</p>
              )}
            </div>

            {role === "customer" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            {role === "customer" && (
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up here
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}