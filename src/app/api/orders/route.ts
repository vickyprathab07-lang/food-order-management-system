import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single order fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const order = await db.select()
        .from(orders)
        .where(eq(orders.id, parseInt(id)))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json({ 
          error: 'Order not found',
          code: "ORDER_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(order[0], { status: 200 });
    }

    // List orders with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const customerId = searchParams.get('customerId');

    let query = db.select().from(orders);
    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(like(orders.tokenNumber, `%${search}%`));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    // Filter by paymentStatus
    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    // Filter by customerId
    if (customerId && !isNaN(parseInt(customerId))) {
      conditions.push(eq(orders.customerId, parseInt(customerId)));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerId, 
      tokenNumber, 
      subtotal, 
      discount = 0, 
      finalAmount, 
      status = 'Order Received', 
      deliveryMode, 
      paymentStatus = 'Pending', 
      estimatedReadyTime 
    } = body;

    // Validate required fields
    if (!tokenNumber || tokenNumber.trim() === '') {
      return NextResponse.json({ 
        error: "Token number is required",
        code: "MISSING_TOKEN_NUMBER" 
      }, { status: 400 });
    }

    if (!subtotal || typeof subtotal !== 'number' || subtotal <= 0) {
      return NextResponse.json({ 
        error: "Valid positive subtotal is required",
        code: "INVALID_SUBTOTAL" 
      }, { status: 400 });
    }

    if (!finalAmount || typeof finalAmount !== 'number' || finalAmount <= 0) {
      return NextResponse.json({ 
        error: "Valid positive final amount is required",
        code: "INVALID_FINAL_AMOUNT" 
      }, { status: 400 });
    }

    if (!deliveryMode || deliveryMode.trim() === '') {
      return NextResponse.json({ 
        error: "Delivery mode is required",
        code: "MISSING_DELIVERY_MODE" 
      }, { status: 400 });
    }

    // Validate discount
    if (typeof discount !== 'number' || discount < 0) {
      return NextResponse.json({ 
        error: "Discount must be a non-negative number",
        code: "INVALID_DISCOUNT" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      tokenNumber: tokenNumber.trim(),
      subtotal,
      discount,
      finalAmount,
      status: status || 'Order Received',
      deliveryMode: deliveryMode.trim(),
      paymentStatus: paymentStatus || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (customerId !== undefined && customerId !== null) {
      if (typeof customerId !== 'number' || customerId <= 0) {
        return NextResponse.json({ 
          error: "Customer ID must be a positive number",
          code: "INVALID_CUSTOMER_ID" 
        }, { status: 400 });
      }
      insertData.customerId = customerId;
    }

    if (estimatedReadyTime) {
      insertData.estimatedReadyTime = estimatedReadyTime;
    }

    // Insert into database
    try {
      const newOrder = await db.insert(orders)
        .values(insertData)
        .returning();

      return NextResponse.json(newOrder[0], { status: 201 });
    } catch (dbError: any) {
      // Handle unique constraint violation for tokenNumber
      if (dbError.message && dbError.message.includes('UNIQUE')) {
        return NextResponse.json({ 
          error: "Token number already exists",
          code: "DUPLICATE_TOKEN_NUMBER" 
        }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      customerId, 
      status, 
      deliveryMode, 
      paymentStatus, 
      estimatedReadyTime, 
      discount, 
      finalAmount 
    } = body;

    // Check if order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: "ORDER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (customerId !== undefined) {
      if (customerId !== null && (typeof customerId !== 'number' || customerId <= 0)) {
        return NextResponse.json({ 
          error: "Customer ID must be a positive number or null",
          code: "INVALID_CUSTOMER_ID" 
        }, { status: 400 });
      }
      updateData.customerId = customerId;
    }

    if (status !== undefined) {
      if (!status || status.trim() === '') {
        return NextResponse.json({ 
          error: "Status cannot be empty",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updateData.status = status.trim();
    }

    if (deliveryMode !== undefined) {
      if (!deliveryMode || deliveryMode.trim() === '') {
        return NextResponse.json({ 
          error: "Delivery mode cannot be empty",
          code: "INVALID_DELIVERY_MODE" 
        }, { status: 400 });
      }
      updateData.deliveryMode = deliveryMode.trim();
    }

    if (paymentStatus !== undefined) {
      if (!paymentStatus || paymentStatus.trim() === '') {
        return NextResponse.json({ 
          error: "Payment status cannot be empty",
          code: "INVALID_PAYMENT_STATUS" 
        }, { status: 400 });
      }
      updateData.paymentStatus = paymentStatus.trim();
    }

    if (estimatedReadyTime !== undefined) {
      updateData.estimatedReadyTime = estimatedReadyTime;
    }

    if (discount !== undefined) {
      if (typeof discount !== 'number' || discount < 0) {
        return NextResponse.json({ 
          error: "Discount must be a non-negative number",
          code: "INVALID_DISCOUNT" 
        }, { status: 400 });
      }
      updateData.discount = discount;
    }

    if (finalAmount !== undefined) {
      if (typeof finalAmount !== 'number' || finalAmount <= 0) {
        return NextResponse.json({ 
          error: "Final amount must be a positive number",
          code: "INVALID_FINAL_AMOUNT" 
        }, { status: 400 });
      }
      updateData.finalAmount = finalAmount;
    }

    // Update order
    const updated = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: "ORDER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete order
    const deleted = await db.delete(orders)
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Order deleted successfully',
      order: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}