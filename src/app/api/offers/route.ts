import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { eq, like, or, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single offer by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          },
          { status: 400 }
        );
      }

      const offer = await db.select()
        .from(offers)
        .where(eq(offers.id, parseInt(id)))
        .limit(1);

      if (offer.length === 0) {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(offer[0], { status: 200 });
    }

    // List all offers with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const activeFilter = searchParams.get('active');

    let query = db.select().from(offers);

    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(offers.title, `%${search}%`),
          like(offers.description, `%${search}%`)
        )
      );
    }

    // Active filter (current date is between validFrom and validUntil)
    if (activeFilter === 'true') {
      const now = new Date().toISOString();
      conditions.push(
        and(
          lte(offers.validFrom, now),
          gte(offers.validUntil, now)
        )
      );
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
    const { title, description, discountPercent, validFrom, validUntil } = body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { 
          error: "Title is required and cannot be empty",
          code: "MISSING_REQUIRED_FIELD" 
        },
        { status: 400 }
      );
    }

    if (discountPercent === undefined || discountPercent === null) {
      return NextResponse.json(
        { 
          error: "Discount percent is required",
          code: "MISSING_REQUIRED_FIELD" 
        },
        { status: 400 }
      );
    }

    if (!validFrom) {
      return NextResponse.json(
        { 
          error: "Valid from date is required",
          code: "MISSING_REQUIRED_FIELD" 
        },
        { status: 400 }
      );
    }

    if (!validUntil) {
      return NextResponse.json(
        { 
          error: "Valid until date is required",
          code: "MISSING_REQUIRED_FIELD" 
        },
        { status: 400 }
      );
    }

    // Validate discount percent
    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return NextResponse.json(
        { 
          error: "Discount percent must be a number between 0 and 100",
          code: "INVALID_DISCOUNT_PERCENT" 
        },
        { status: 400 }
      );
    }

    // Validate ISO timestamps
    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validUntil);

    if (isNaN(validFromDate.getTime())) {
      return NextResponse.json(
        { 
          error: "Valid from must be a valid ISO timestamp",
          code: "INVALID_DATE_FORMAT" 
        },
        { status: 400 }
      );
    }

    if (isNaN(validUntilDate.getTime())) {
      return NextResponse.json(
        { 
          error: "Valid until must be a valid ISO timestamp",
          code: "INVALID_DATE_FORMAT" 
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData = {
      title: title.trim(),
      description: description ? description.trim() : null,
      discountPercent: discount,
      validFrom: validFromDate.toISOString(),
      validUntil: validUntilDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    const newOffer = await db.insert(offers)
      .values(insertData)
      .returning();

    return NextResponse.json(newOffer[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Check if offer exists
    const existingOffer = await db.select()
      .from(offers)
      .where(eq(offers.id, parseInt(id)))
      .limit(1);

    if (existingOffer.length === 0) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, discountPercent, validFrom, validUntil } = body;

    // Prepare update data
    const updateData: any = {};

    // Validate and add title if provided
    if (title !== undefined) {
      if (title.trim() === '') {
        return NextResponse.json(
          { 
            error: "Title cannot be empty",
            code: "INVALID_TITLE" 
          },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    // Add description if provided
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    // Validate and add discountPercent if provided
    if (discountPercent !== undefined) {
      const discount = parseFloat(discountPercent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return NextResponse.json(
          { 
            error: "Discount percent must be a number between 0 and 100",
            code: "INVALID_DISCOUNT_PERCENT" 
          },
          { status: 400 }
        );
      }
      updateData.discountPercent = discount;
    }

    // Validate and add validFrom if provided
    if (validFrom !== undefined) {
      const validFromDate = new Date(validFrom);
      if (isNaN(validFromDate.getTime())) {
        return NextResponse.json(
          { 
            error: "Valid from must be a valid ISO timestamp",
            code: "INVALID_DATE_FORMAT" 
          },
          { status: 400 }
        );
      }
      updateData.validFrom = validFromDate.toISOString();
    }

    // Validate and add validUntil if provided
    if (validUntil !== undefined) {
      const validUntilDate = new Date(validUntil);
      if (isNaN(validUntilDate.getTime())) {
        return NextResponse.json(
          { 
            error: "Valid until must be a valid ISO timestamp",
            code: "INVALID_DATE_FORMAT" 
          },
          { status: 400 }
        );
      }
      updateData.validUntil = validUntilDate.toISOString();
    }

    // Update the offer
    const updated = await db.update(offers)
      .set(updateData)
      .where(eq(offers.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Check if offer exists
    const existingOffer = await db.select()
      .from(offers)
      .where(eq(offers.id, parseInt(id)))
      .limit(1);

    if (existingOffer.length === 0) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Delete the offer
    const deleted = await db.delete(offers)
      .where(eq(offers.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Offer deleted successfully',
        offer: deleted[0]
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