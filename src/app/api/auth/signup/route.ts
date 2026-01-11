import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUsersCollection } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, registrationKey } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate registration keys for privileged roles
    if (role === 'UMPIRE') {
      const umpireKey = process.env.UMPIRE_REGISTRATION_KEY;
      if (!registrationKey || registrationKey !== umpireKey) {
        return NextResponse.json(
          { error: 'Invalid or missing Umpire registration key' },
          { status: 401 }
        );
      }
    } else if (role === 'ADMIN') {
      const adminKey = process.env.ADMIN_REGISTRATION_KEY;
      if (!registrationKey || registrationKey !== adminKey) {
        return NextResponse.json(
          { error: 'Invalid or missing Admin registration key' },
          { status: 401 }
        );
      }
    }
    // VIEWER role doesn't require a registration key

    const usersCollection = await getUsersCollection();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user in MongoDB
    const result = await usersCollection.insertOne({
      name,
      email,
      password, // In production, hash this!
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = result.insertedId.toString();

    // Create JWT token
    const token = jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      userId,
      name,
      email,
      role,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
