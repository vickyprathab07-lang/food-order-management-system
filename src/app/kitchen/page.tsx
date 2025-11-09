"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, CheckCircle, ChefHat } from "lucide-react";
import { toast } from "sonner";

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000); // Refresh every 3 seconds
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const activeOrders = allOrders.filter((order: any) => 
      order.status === "Confirmed" || order.status === "Preparing"
    );
    setOrders(activeOrders.reverse());
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const updatedOrders = allOrders.map((order: any) => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    loadOrders();
    toast.success(`Order updated to ${newStatus}`);
  };

  const getElapsedTime = (createdAt: string) => {
    const diff = currentTime.getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const confirmedOrders = orders.filter(o => o.status === "Confirmed");
  const preparingOrders = orders.filter(o => o.status === "Preparing");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Kitchen Display</h1>
                <p className="text-sm text-muted-foreground">Live order tracking</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</p>
              <p className="text-sm text-muted-foreground">
                {confirmedOrders.length} Pending • {preparingOrders.length} Preparing
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Confirmed Orders - To Be Started */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Orders ({confirmedOrders.length})
            </h2>
            <div className="space-y-4">
              {confirmedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending orders</p>
                  </CardContent>
                </Card>
              ) : (
                confirmedOrders.map((order) => (
                  <Card key={order.id} className="border-yellow-200 bg-yellow-50/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-3xl font-bold">
                          #{order.tokenNumber}
                        </CardTitle>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Waiting</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {getElapsedTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium text-lg">{item.name}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => updateOrderStatus(order.id, "Preparing")}
                      >
                        <ChefHat className="h-5 w-5 mr-2" />
                        Start Preparing
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Preparing Orders - In Progress */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-blue-600" />
              Preparing ({preparingOrders.length})
            </h2>
            <div className="space-y-4">
              {preparingOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders in preparation</p>
                  </CardContent>
                </Card>
              ) : (
                preparingOrders.map((order) => (
                  <Card key={order.id} className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-3xl font-bold">
                          #{order.tokenNumber}
                        </CardTitle>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">In Progress</p>
                          <p className="text-lg font-bold text-blue-600">
                            {getElapsedTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium text-lg">{item.name}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        variant="default"
                        onClick={() => updateOrderStatus(order.id, "Ready")}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Mark as Ready
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
