"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Package, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(allOrders.reverse());
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const updatedOrders = allOrders.map((order: any) => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    loadOrders();
    toast.success(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}`);
  };

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filter);

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Pending Orders",
      value: orders.filter(o => o.status === "Confirmed").length,
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Completed Today",
      value: orders.filter(o => o.status === "Completed").length,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: `₹${orders.reduce((sum, o) => sum + o.total, 0)}`,
      icon: DollarSign,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage orders and shop operations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All Orders
          </Button>
          <Button 
            variant={filter === "confirmed" ? "default" : "outline"}
            onClick={() => setFilter("confirmed")}
          >
            Confirmed
          </Button>
          <Button 
            variant={filter === "preparing" ? "default" : "outline"}
            onClick={() => setFilter("preparing")}
          >
            Preparing
          </Button>
          <Button 
            variant={filter === "ready" ? "default" : "outline"}
            onClick={() => setFilter("ready")}
          >
            Ready
          </Button>
          <Button 
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Management</CardTitle>
            <CardDescription>View and manage all customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-xl">#{order.tokenNumber}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === "Completed" ? "bg-green-100 text-green-800" :
                            order.status === "Ready" ? "bg-blue-100 text-blue-800" :
                            order.status === "Preparing" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Customer: {order.customerName} ({order.customerEmail})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl">₹{order.total}</p>
                        <p className="text-sm text-muted-foreground">{order.items?.length || 0} items</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4 p-3 bg-muted/50 rounded">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm py-1">
                          {item.quantity}x {item.name} - ₹{item.price * item.quantity}
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.status === "Confirmed" && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, "Preparing")}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === "Preparing" && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, "Ready")}
                        >
                          Mark as Ready
                        </Button>
                      )}
                      {order.status === "Ready" && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, "Completed")}
                        >
                          Complete Order
                        </Button>
                      )}
                      {order.status !== "Completed" && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, "Cancelled")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
