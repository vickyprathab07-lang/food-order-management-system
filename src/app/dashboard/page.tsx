"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Package, Receipt, User, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function CustomerDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const customerData = localStorage.getItem("customer");
    if (!customerData) {
      router.push("/login");
      return;
    }
    setCustomer(JSON.parse(customerData));

    // Load orders
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const customerOrders = allOrders.filter((order: any) => order.customerEmail === JSON.parse(customerData).email);
    setOrders(customerOrders.reverse().slice(0, 5)); // Latest 5 orders
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (!customer) return null;

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Active Orders",
      value: orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled").length,
      icon: ShoppingBag,
      color: "text-green-600"
    },
    {
      title: "Total Spent",
      value: `₹${orders.reduce((sum, o) => sum + o.total, 0)}`,
      icon: Receipt,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Customer Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {customer.name}!</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Button asChild>
                  <Link href="/menu">Browse Menu</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">#{order.tokenNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "Completed" ? "bg-green-100 text-green-800" :
                          order.status === "Ready" ? "bg-blue-100 text-blue-800" :
                          order.status === "Preparing" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{order.total}</p>
                      <Button variant="link" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{customer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
