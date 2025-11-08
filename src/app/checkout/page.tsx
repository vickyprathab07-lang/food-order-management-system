"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<string>("Pickup");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Guest customer form
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  useEffect(() => {
    // Load cart
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Load customer
    const savedCustomer = localStorage.getItem("customer");
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeFromCart = (itemId: number) => {
    const newCart = cart.filter((item) => item.id !== itemId);
    updateCart(newCart);
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId: number, delta: number) => {
    const newCart = cart.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    updateCart(newCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0; // Can apply offers here
  const finalAmount = subtotal - discount;

  const generateTokenNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `TKN${timestamp}${random}`;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate customer info
    if (!customer && (!guestName || !guestPhone)) {
      toast.error("Please enter your name and phone number");
      return;
    }

    setIsProcessing(true);

    try {
      const tokenNumber = generateTokenNumber();
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const estimatedReadyTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

      // Create order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer?.id,
          tokenNumber,
          subtotal,
          discount,
          finalAmount,
          status: "Order Received",
          deliveryMode,
          paymentStatus: paymentMode === "Cash" ? "Pending" : "Paid",
          estimatedReadyTime,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const order = await orderResponse.json();

      // Create order items
      const orderItemsPromises = cart.map((item) =>
        fetch("/api/order-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
          }),
        })
      );

      await Promise.all(orderItemsPromises);

      // Create payment
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          transactionId,
          paymentMode,
          amountPaid: finalAmount,
          paymentStatus: paymentMode === "Cash" ? "Pending" : "Completed",
        }),
      });

      // Clear cart
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));

      toast.success(`Order placed! Token: ${tokenNumber}`);
      router.push(`/order-status/${order.id}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Cart is Empty</CardTitle>
                <CardDescription>Add some delicious items to your cart!</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => router.push("/menu")}>Browse Menu</Button>
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
          <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} × {item.quantity}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <p className="font-bold">₹{item.price * item.quantity}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer ? (
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {customer.name}</p>
                      <p><strong>Phone:</strong> {customer.phone}</p>
                      <p><strong>Email:</strong> {customer.email}</p>
                      {deliveryMode === "Delivery" && (
                        <p><strong>Address:</strong> {customer.address}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="guestName">Name *</Label>
                        <Input
                          id="guestName"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestPhone">Phone *</Label>
                        <Input
                          id="guestPhone"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      {deliveryMode === "Delivery" && (
                        <div>
                          <Label htmlFor="guestAddress">Delivery Address</Label>
                          <Input
                            id="guestAddress"
                            value={guestAddress}
                            onChange={(e) => setGuestAddress(e.target.value)}
                            placeholder="Enter delivery address"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery & Payment */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery & Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Delivery Mode</Label>
                    <RadioGroup value={deliveryMode} onValueChange={setDeliveryMode}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pickup" id="pickup" />
                        <Label htmlFor="pickup">Pickup</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Delivery" id="delivery" />
                        <Label htmlFor="delivery">Delivery</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block">Payment Method</Label>
                    <RadioGroup value={paymentMode} onValueChange={setPaymentMode}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Cash" id="cash" />
                        <Label htmlFor="cash">Cash on {deliveryMode}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Card" id="card" />
                        <Label htmlFor="card">Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UPI" id="upi" />
                        <Label htmlFor="upi">UPI</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Total */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold text-green-600">
                      -₹{discount.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
