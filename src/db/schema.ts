import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Shops table
export const shops = sqliteTable('shops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address').notNull(),
  contact: text('contact').notNull(),
  email: text('email').notNull(),
  createdAt: text('created_at').notNull(),
});

// Customers table
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: text('created_at').notNull(),
});

// Menu Items table
export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: real('price').notNull(),
  availability: integer('availability', { mode: 'boolean' }).notNull().default(true),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
});

// Offers table
export const offers = sqliteTable('offers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  discountPercent: real('discount_percent').notNull(),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until').notNull(),
  createdAt: text('created_at').notNull(),
});

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  tokenNumber: text('token_number').notNull().unique(),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').notNull().default(0),
  finalAmount: real('final_amount').notNull(),
  status: text('status').notNull().default('Order Received'),
  deliveryMode: text('delivery_mode').notNull(),
  paymentStatus: text('payment_status').notNull().default('Pending'),
  estimatedReadyTime: text('estimated_ready_time'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Order Items table
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  menuItemId: integer('menu_item_id').references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  createdAt: text('created_at').notNull(),
});

// Payments table
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  transactionId: text('transaction_id').notNull().unique(),
  paymentMode: text('payment_mode').notNull(),
  amountPaid: real('amount_paid').notNull(),
  paymentStatus: text('payment_status').notNull(),
  createdAt: text('created_at').notNull(),
});

// Receipts table
export const receipts = sqliteTable('receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  receiptData: text('receipt_data').notNull(),
  createdAt: text('created_at').notNull(),
});