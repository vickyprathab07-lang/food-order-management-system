import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single shop fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const shop = await db.select()
        .from(shops)
        .where(eq(shops.id, parseInt(id)))
        .limit(1);

      if (shop.length === 0) {
        return NextResponse.json({ 
          error: 'Shop not found',
          code: "SHOP_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(shop[0], { status: 200 });
    }

    // List shops with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(shops);

    if (search) {
      query = query.where(
        or(
          like(shops.name, `%${search}%`),
          like(shops.address, `%${search}%`),
          like(shops.email, `%${search}%`)
        )
      );
    }

    const results = await query.limit(limit).offset(offset);

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
    const { name, address, contact, email } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: "Name is required and cannot be empty",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!address || !address.trim()) {
      return NextResponse.json({ 
        error: "Address is required and cannot be empty",
        code: "MISSING_ADDRESS" 
      }, { status: 400 });
    }

    if (!contact || !contact.trim()) {
      return NextResponse.json({ 
        error: "Contact is required and cannot be empty",
        code: "MISSING_CONTACT" 
      }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ 
        error: "Email is required and cannot be empty",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedAddress = address.trim();
    const sanitizedContact = contact.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    // Create shop with auto-generated fields
    const newShop = await db.insert(shops)
      .values({
        name: sanitizedName,
        address: sanitizedAddress,
        contact: sanitizedContact,
        email: sanitizedEmail,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newShop[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, address, contact, email } = body;

    // Check if shop exists
    const existingShop = await db.select()
      .from(shops)
      .where(eq(shops.id, parseInt(id)))
      .limit(1);

    if (existingShop.length === 0) {
      return NextResponse.json({ 
        error: 'Shop not found',
        code: "SHOP_NOT_FOUND" 
      }, { status: 404 });
    }

    // Prepare update data (only include provided fields)
    const updateData: {
      name?: string;
      address?: string;
      contact?: string;
      email?: string;
    } = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    if (address !== undefined) {
      const trimmedAddress = address.trim();
      if (!trimmedAddress) {
        return NextResponse.json({ 
          error: "Address cannot be empty",
          code: "INVALID_ADDRESS" 
        }, { status: 400 });
      }
      updateData.address = trimmedAddress;
    }

    if (contact !== undefined) {
      const trimmedContact = contact.trim();
      if (!trimmedContact) {
        return NextResponse.json({ 
          error: "Contact cannot be empty",
          code: "INVALID_CONTACT" 
        }, { status: 400 });
      }
      updateData.contact = trimmedContact;
    }

    if (email !== undefined) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return NextResponse.json({ 
          error: "Email cannot be empty",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
      updateData.email = trimmedEmail.toLowerCase();
    }

    // Update shop
    const updatedShop = await db.update(shops)
      .set(updateData)
      .where(eq(shops.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedShop[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if shop exists
    const existingShop = await db.select()
      .from(shops)
      .where(eq(shops.id, parseInt(id)))
      .limit(1);

    if (existingShop.length === 0) {
      return NextResponse.json({ 
        error: 'Shop not found',
        code: "SHOP_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete shop
    const deletedShop = await db.delete(shops)
      .where(eq(shops.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Shop deleted successfully',
      shop: deletedShop[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}