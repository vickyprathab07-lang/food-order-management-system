"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, ChefHat, Shield } from "lucide-react";
import { toast } from "sonner";

// Predefined credentials for kitchen and admin
const KITCHEN_PASSWORD = "kitchen123";
const ADMIN_PASSWORD = "admin123";

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "kitchen" | "admin">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Handle Kitchen Registration
      if (role === "kitchen") {
        if (password === KITCHEN_PASSWORD) {
          const kitchenUser = {
            id: "kitchen",
            name: "Kitchen Staff",
            email: "kitchen@madrascalcanteen.com",
            role: "kitchen"
          };
          localStorage.setItem("customer", JSON.stringify(kitchenUser));
          toast.success("Kitchen account verified!");
          router.push("/kitchen");
        } else {
          toast.error("Invalid kitchen password. Contact admin for correct password.");
          setIsLoading(false);
        }
        return;
      }

      // Handle Admin Registration
      if (role === "admin") {
        if (password === ADMIN_PASSWORD) {
          const adminUser = {
            id: "admin",
            name: "Admin",
            email: "admin@madrascalcanteen.com",
            role: "admin"
          };
          localStorage.setItem("customer", JSON.stringify(adminUser));
          toast.success("Admin account verified!");
          router.push("/admin");
        } else {
          toast.error("Invalid admin password. Contact system administrator.");
          setIsLoading(false);
        }
        return;
      }

      // Handle Customer Registration
      const existingCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
      const customerExists = existingCustomers.find((c: any) => c.email === email);

      if (customerExists) {
        toast.error("Email already registered. Please login.");
        setIsLoading(false);
        return;
      }

      // Create new customer
      const newCustomer = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role: "customer",
        createdAt: new Date().toISOString()
      };

      // Save to customers array
      existingCustomers.push(newCustomer);
      localStorage.setItem("customers", JSON.stringify(existingCustomers));

      // Auto-login
      localStorage.setItem("customer", JSON.stringify(newCustomer));

      toast.success("Account created successfully!");
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
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            {role === "kitchen" 
              ? "Enter kitchen password to access dashboard" 
              : role === "admin"
              ? "Enter admin password to access dashboard"
              : "Enter your details to get started with Mad Rascal Canteen"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label>Sign Up As</Label>
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

            {/* Name and Email only for customers */}
            {role === "customer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
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
              </>
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
                <p className="text-xs text-muted-foreground">Enter the kitchen staff password</p>
              )}
              {role === "admin" && (
                <p className="text-xs text-muted-foreground">Enter the admin password</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : role === "customer" ? "Create Account" : "Verify & Access"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}