import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { menuItems } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single menu item by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const menuItem = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, parseInt(id)))
        .limit(1);

      if (menuItem.length === 0) {
        return NextResponse.json(
          { error: 'Menu item not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(menuItem[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const availability = searchParams.get('availability');

    let query = db.select().from(menuItems);

    // Build conditions array
    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(
        or(
          like(menuItems.name, `%${search}%`),
          like(menuItems.category, `%${search}%`),
          like(menuItems.description, `%${search}%`)
        )
      );
    }

    // Category filter
    if (category) {
      conditions.push(eq(menuItems.category, category));
    }

    // Availability filter
    if (availability !== null && availability !== undefined) {
      const isAvailable = availability === 'true' || availability === '1';
      conditions.push(eq(menuItems.availability, isAvailable));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price, availability, description, imageUrl } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must not be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required and must not be empty', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Price is required', code: 'MISSING_PRICE' },
        { status: 400 }
      );
    }

    // Validate price is a positive number
    const parsedPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults
    const insertData = {
      name: name.trim(),
      category: category.trim(),
      price: parsedPrice,
      availability: availability !== undefined ? Boolean(availability) : true,
      description: description ? description.trim() : null,
      imageUrl: imageUrl ? imageUrl.trim() : null,
      createdAt: new Date().toISOString()
    };

    const newMenuItem = await db
      .insert(menuItems)
      .values(insertData)
      .returning();

    return NextResponse.json(newMenuItem[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingMenuItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .limit(1);

    if (existingMenuItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, category, price, availability, description, imageUrl } = body;

    // Prepare update data
    const updateData: any = {};

    // Validate and add fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must not be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        return NextResponse.json(
          { error: 'Category must not be empty', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
      updateData.category = category.trim();
    }

    if (price !== undefined) {
      const parsedPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
      updateData.price = parsedPrice;
    }

    if (availability !== undefined) {
      updateData.availability = Boolean(availability);
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    }

    // Update the menu item
    const updatedMenuItem = await db
      .update(menuItems)
      .set(updateData)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMenuItem[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingMenuItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .limit(1);

    if (existingMenuItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the menu item
    const deletedMenuItem = await db
      .delete(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Menu item deleted successfully',
        deletedMenuItem: deletedMenuItem[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}