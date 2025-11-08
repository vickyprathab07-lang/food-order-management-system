import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single payment by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const payment = await db.select()
        .from(payments)
        .where(eq(payments.id, parseInt(id)))
        .limit(1);

      if (payment.length === 0) {
        return NextResponse.json({ 
          error: 'Payment not found',
          code: "PAYMENT_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(payment[0], { status: 200 });
    }

    // List payments with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const orderId = searchParams.get('orderId');
    const paymentStatus = searchParams.get('paymentStatus');
    const paymentMode = searchParams.get('paymentMode');

    let query = db.select().from(payments);

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(like(payments.transactionId, `%${search}%`));
    }

    if (orderId && !isNaN(parseInt(orderId))) {
      conditions.push(eq(payments.orderId, parseInt(orderId)));
    }

    if (paymentStatus) {
      conditions.push(eq(payments.paymentStatus, paymentStatus));
    }

    if (paymentMode) {
      conditions.push(eq(payments.paymentMode, paymentMode));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, paymentMode, amountPaid, paymentStatus, orderId } = body;

    // Validate required fields
    if (!transactionId || transactionId.trim() === '') {
      return NextResponse.json({ 
        error: "Transaction ID is required and cannot be empty",
        code: "MISSING_TRANSACTION_ID" 
      }, { status: 400 });
    }

    if (!paymentMode || paymentMode.trim() === '') {
      return NextResponse.json({ 
        error: "Payment mode is required",
        code: "MISSING_PAYMENT_MODE" 
      }, { status: 400 });
    }

    if (amountPaid === undefined || amountPaid === null) {
      return NextResponse.json({ 
        error: "Amount paid is required",
        code: "MISSING_AMOUNT_PAID" 
      }, { status: 400 });
    }

    if (typeof amountPaid !== 'number' || amountPaid <= 0) {
      return NextResponse.json({ 
        error: "Amount paid must be a positive number",
        code: "INVALID_AMOUNT_PAID" 
      }, { status: 400 });
    }

    if (!paymentStatus || paymentStatus.trim() === '') {
      return NextResponse.json({ 
        error: "Payment status is required",
        code: "MISSING_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      transactionId: transactionId.trim(),
      paymentMode: paymentMode.trim(),
      amountPaid,
      paymentStatus: paymentStatus.trim(),
      createdAt: new Date().toISOString()
    };

    // Add optional orderId if provided
    if (orderId !== undefined && orderId !== null) {
      if (typeof orderId !== 'number' || isNaN(orderId)) {
        return NextResponse.json({ 
          error: "Order ID must be a valid number",
          code: "INVALID_ORDER_ID" 
        }, { status: 400 });
      }
      insertData.orderId = orderId;
    }

    // Insert payment
    try {
      const newPayment = await db.insert(payments)
        .values(insertData)
        .returning();

      return NextResponse.json(newPayment[0], { status: 201 });
    } catch (dbError) {
      // Handle unique constraint violation for transactionId
      if (dbError.message && dbError.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ 
          error: "Transaction ID already exists",
          code: "DUPLICATE_TRANSACTION_ID" 
        }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
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
    const { orderId, paymentMode, paymentStatus } = body;

    // Check if payment exists
    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.id, parseInt(id)))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json({ 
        error: 'Payment not found',
        code: "PAYMENT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (orderId !== undefined) {
      if (orderId === null) {
        updateData.orderId = null;
      } else if (typeof orderId === 'number' && !isNaN(orderId)) {
        updateData.orderId = orderId;
      } else {
        return NextResponse.json({ 
          error: "Order ID must be a valid number or null",
          code: "INVALID_ORDER_ID" 
        }, { status: 400 });
      }
    }

    if (paymentMode !== undefined && paymentMode !== null) {
      if (paymentMode.trim() === '') {
        return NextResponse.json({ 
          error: "Payment mode cannot be empty",
          code: "INVALID_PAYMENT_MODE" 
        }, { status: 400 });
      }
      updateData.paymentMode = paymentMode.trim();
    }

    if (paymentStatus !== undefined && paymentStatus !== null) {
      if (paymentStatus.trim() === '') {
        return NextResponse.json({ 
          error: "Payment status cannot be empty",
          code: "INVALID_PAYMENT_STATUS" 
        }, { status: 400 });
      }
      updateData.paymentStatus = paymentStatus.trim();
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATE_FIELDS" 
      }, { status: 400 });
    }

    // Update payment
    const updated = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
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

    // Check if payment exists
    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.id, parseInt(id)))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json({ 
        error: 'Payment not found',
        code: "PAYMENT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete payment
    const deleted = await db.delete(payments)
      .where(eq(payments.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Payment deleted successfully',
      payment: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}