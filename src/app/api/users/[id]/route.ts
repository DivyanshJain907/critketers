import { getUsersCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// PUT /api/users/[id] - Update user role (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['ADMIN', 'UMPIRE'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN or UMPIRE" },
        { status: 400 }
      );
    }

    // Check access control - admin only
    let userRole = 'VIEWER';
    let userId = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        userRole = decoded.role;
        userId = decoded.userId;
      } catch (error) {
        // Token invalid
      }
    }

    // Only admins can update roles
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: "You do not have access to this resource" },
        { status: 403 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const usersCollection = await getUsersCollection();

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      id: updatedUser?._id?.toString(),
      name: updatedUser?.name,
      email: updatedUser?.email,
      role: updatedUser?.role,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check access control - admin only
    let userRole = 'VIEWER';
    let userId = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        userRole = decoded.role;
        userId = decoded.userId;
      } catch (error) {
        // Token invalid
      }
    }

    // Only admins can delete users
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: "You do not have access to this resource" },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const usersCollection = await getUsersCollection();

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
