import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const orderItem = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, parseInt(id)))
        .limit(1);

      if (orderItem.length === 0) {
        return NextResponse.json(
          { error: 'Order item not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(orderItem[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const orderIdParam = searchParams.get('orderId');
    const menuItemIdParam = searchParams.get('menuItemId');

    let query = db.select().from(orderItems);

    // Build filter conditions
    const conditions = [];
    if (orderIdParam && !isNaN(parseInt(orderIdParam))) {
      conditions.push(eq(orderItems.orderId, parseInt(orderIdParam)));
    }
    if (menuItemIdParam && !isNaN(parseInt(menuItemIdParam))) {
      conditions.push(eq(orderItems.menuItemId, parseInt(menuItemIdParam)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, menuItemId, quantity, price } = body;

    // Validate required fields
    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Quantity is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Price is required', code: 'MISSING_PRICE' },
        { status: 400 }
      );
    }

    // Validate quantity is positive integer
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    // Validate price is positive number
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    // Validate optional foreign keys if provided
    if (orderId !== undefined && orderId !== null && (!Number.isInteger(orderId) || orderId <= 0)) {
      return NextResponse.json(
        { error: 'Order ID must be a positive integer', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    if (menuItemId !== undefined && menuItemId !== null && (!Number.isInteger(menuItemId) || menuItemId <= 0)) {
      return NextResponse.json(
        { error: 'Menu item ID must be a positive integer', code: 'INVALID_MENU_ITEM_ID' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      quantity,
      price,
      createdAt: new Date().toISOString(),
    };

    if (orderId !== undefined && orderId !== null) {
      insertData.orderId = orderId;
    }

    if (menuItemId !== undefined && menuItemId !== null) {
      insertData.menuItemId = menuItemId;
    }

    const newOrderItem = await db
      .insert(orderItems)
      .values(insertData)
      .returning();

    return NextResponse.json(newOrderItem[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Order item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { orderId, menuItemId, quantity, price } = body;

    // Validate quantity if provided
    if (quantity !== undefined && quantity !== null) {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be a positive integer', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
    }

    // Validate price if provided
    if (price !== undefined && price !== null) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    // Validate optional foreign keys if provided
    if (orderId !== undefined && orderId !== null && (!Number.isInteger(orderId) || orderId <= 0)) {
      return NextResponse.json(
        { error: 'Order ID must be a positive integer', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    if (menuItemId !== undefined && menuItemId !== null && (!Number.isInteger(menuItemId) || menuItemId <= 0)) {
      return NextResponse.json(
        { error: 'Menu item ID must be a positive integer', code: 'INVALID_MENU_ITEM_ID' },
        { status: 400 }
      );
    }

    // Prepare update data with only provided fields
    const updateData: any = {};

    if (orderId !== undefined) {
      updateData.orderId = orderId;
    }

    if (menuItemId !== undefined) {
      updateData.menuItemId = menuItemId;
    }

    if (quantity !== undefined && quantity !== null) {
      updateData.quantity = quantity;
    }

    if (price !== undefined && price !== null) {
      updateData.price = price;
    }

    const updated = await db
      .update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Order item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Order item deleted successfully',
        orderItem: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}