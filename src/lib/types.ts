export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isOffer?: boolean;
  originalPrice?: number;
  discount?: number;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface Order {
  id: string;
  tokenNumber: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  paymentStatus: 'pending' | 'completed';
  paymentMethod: string;
  createdAt: string;
  estimatedTime?: number; // in minutes
  actualReadyTime?: string;
}

export interface Payment {
  orderId: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  timestamp: string;
}

export interface Receipt {
  orderId: string;
  tokenNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: string;
}
