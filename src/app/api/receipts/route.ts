import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { receipts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single receipt by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const receipt = await db.select()
        .from(receipts)
        .where(eq(receipts.id, parseInt(id)))
        .limit(1);

      if (receipt.length === 0) {
        return NextResponse.json({ 
          error: 'Receipt not found',
          code: "RECEIPT_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(receipt[0], { status: 200 });
    }

    // List receipts with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const orderId = searchParams.get('orderId');

    let query = db.select().from(receipts);

    // Filter by orderId if provided
    if (orderId) {
      const orderIdInt = parseInt(orderId);
      if (!isNaN(orderIdInt)) {
        query = query.where(eq(receipts.orderId, orderIdInt));
      }
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptData, orderId } = body;

    // Validate required fields
    if (!receiptData) {
      return NextResponse.json({ 
        error: "Receipt data is required",
        code: "MISSING_RECEIPT_DATA" 
      }, { status: 400 });
    }

    // Validate receiptData is not empty after trimming
    const trimmedReceiptData = receiptData.trim();
    if (trimmedReceiptData.length === 0) {
      return NextResponse.json({ 
        error: "Receipt data must not be empty",
        code: "EMPTY_RECEIPT_DATA" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      receiptData: trimmedReceiptData,
      createdAt: new Date().toISOString()
    };

    // Add orderId if provided and valid
    if (orderId !== undefined && orderId !== null) {
      const orderIdInt = parseInt(orderId);
      if (!isNaN(orderIdInt)) {
        insertData.orderId = orderIdInt;
      }
    }

    const newReceipt = await db.insert(receipts)
      .values(insertData)
      .returning();

    return NextResponse.json(newReceipt[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const receiptId = parseInt(id);

    // Check if receipt exists
    const existingReceipt = await db.select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (existingReceipt.length === 0) {
      return NextResponse.json({ 
        error: 'Receipt not found',
        code: "RECEIPT_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { receiptData, orderId } = body;

    // Prepare update data
    const updateData: any = {};

    // Update receiptData if provided
    if (receiptData !== undefined) {
      const trimmedReceiptData = receiptData.trim();
      if (trimmedReceiptData.length === 0) {
        return NextResponse.json({ 
          error: "Receipt data must not be empty",
          code: "EMPTY_RECEIPT_DATA" 
        }, { status: 400 });
      }
      updateData.receiptData = trimmedReceiptData;
    }

    // Update orderId if provided
    if (orderId !== undefined) {
      if (orderId === null) {
        updateData.orderId = null;
      } else {
        const orderIdInt = parseInt(orderId);
        if (!isNaN(orderIdInt)) {
          updateData.orderId = orderIdInt;
        }
      }
    }

    // Perform update
    const updated = await db.update(receipts)
      .set(updateData)
      .where(eq(receipts.id, receiptId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const receiptId = parseInt(id);

    // Check if receipt exists
    const existingReceipt = await db.select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (existingReceipt.length === 0) {
      return NextResponse.json({ 
        error: 'Receipt not found',
        code: "RECEIPT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete receipt
    const deleted = await db.delete(receipts)
      .where(eq(receipts.id, receiptId))
      .returning();

    return NextResponse.json({ 
      message: 'Receipt deleted successfully',
      receipt: deleted[0]
    }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}