import { getUsersCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check access control - admin only
    let userRole = 'VIEWER';

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        userRole = decoded.role;
      } catch (error) {
        // Token invalid
      }
    }

    // Only admins can access user list
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: "You do not have access to this resource" },
        { status: 403 }
      );
    }

    const usersCollection = await getUsersCollection();

    const users = await usersCollection
      .find({})
      .project({ password: 0 }) // Don't return passwords
      .toArray();

    return NextResponse.json(
      users.map((user) => ({
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
