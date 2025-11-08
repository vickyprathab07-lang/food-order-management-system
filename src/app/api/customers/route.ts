import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single customer by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, parseInt(id)))
        .limit(1);

      if (customer.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(customer[0], { status: 200 });
    }

    // List customers with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(customers);

    if (search) {
      query = query.where(
        or(
          like(customers.name, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
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
    const { name, email, phone, address, latitude, longitude } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must not be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required and must not be empty', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return NextResponse.json(
        { error: 'Phone is required and must not be empty', code: 'MISSING_PHONE' },
        { status: 400 }
      );
    }

    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json(
        { error: 'Address is required and must not be empty', code: 'MISSING_ADDRESS' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      createdAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (latitude !== undefined && latitude !== null) {
      insertData.latitude = parseFloat(latitude);
    }

    if (longitude !== undefined && longitude !== null) {
      insertData.longitude = parseFloat(longitude);
    }

    // Insert customer
    const newCustomer = await db
      .insert(customers)
      .values(insertData)
      .returning();

    return NextResponse.json(newCustomer[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation for email
    if ((error as Error).message.includes('UNIQUE') || (error as Error).message.includes('unique')) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      );
    }

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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, latitude, longitude } = body;

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must not be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        return NextResponse.json(
          { error: 'Email must not be empty', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.trim() === '') {
        return NextResponse.json(
          { error: 'Phone must not be empty', code: 'INVALID_PHONE' },
          { status: 400 }
        );
      }
      updateData.phone = phone.trim();
    }

    if (address !== undefined) {
      if (typeof address !== 'string' || address.trim() === '') {
        return NextResponse.json(
          { error: 'Address must not be empty', code: 'INVALID_ADDRESS' },
          { status: 400 }
        );
      }
      updateData.address = address.trim();
    }

    if (latitude !== undefined) {
      updateData.latitude = latitude !== null ? parseFloat(latitude) : null;
    }

    if (longitude !== undefined) {
      updateData.longitude = longitude !== null ? parseFloat(longitude) : null;
    }

    // Only update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingCustomer[0], { status: 200 });
    }

    // Update customer
    const updated = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);

    // Handle unique constraint violation for email
    if ((error as Error).message.includes('UNIQUE') || (error as Error).message.includes('unique')) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      );
    }

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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete customer
    const deleted = await db
      .delete(customers)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Customer deleted successfully',
        customer: deleted[0]
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