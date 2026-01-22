import { 
  getUsersCollection, 
  getMatchesCollection, 
  getTeamsCollection,
  getInningsCollection,
  getBallsCollection,
  getWicketsCollection,
  getExtrasCollection,
  getPlayersCollection
} from "@/lib/mongodb";
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

    // Get the user to check their role
    const userToDelete = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If deleting an UMPIRE, cascade delete all their data
    if (userToDelete.role === 'UMPIRE') {
      const userId = new ObjectId(id);
      const umpireId = id;

      // Get all collections
      const matchesCollection = await getMatchesCollection();
      const teamsCollection = await getTeamsCollection();
      const inningsCollection = await getInningsCollection();
      const ballsCollection = await getBallsCollection();
      const wicketsCollection = await getWicketsCollection();
      const extrasCollection = await getExtrasCollection();
      const playersCollection = await getPlayersCollection();

      // Get all matches and teams owned by this umpire
      const matches = await matchesCollection.find({ umpireId }).toArray();
      const teams = await teamsCollection.find({ umpireId }).toArray();

      const matchIds = matches.map(m => m._id);
      const teamIds = teams.map(t => t._id);

      // Get all innings for these matches
      const innings = await inningsCollection.find({ matchId: { $in: matchIds } }).toArray();
      const inningsIds = innings.map(i => i._id);

      // Delete in order of dependencies
      // 1. Delete all balls for these innings
      if (inningsIds.length > 0) {
        await ballsCollection.deleteMany({ inningsId: { $in: inningsIds } });
      }

      // 2. Delete all wickets for these innings
      if (inningsIds.length > 0) {
        await wicketsCollection.deleteMany({ inningsId: { $in: inningsIds } });
      }

      // 3. Delete all extras for these innings
      if (inningsIds.length > 0) {
        await extrasCollection.deleteMany({ inningsId: { $in: inningsIds } });
      }

      // 4. Delete all innings for these matches
      if (matchIds.length > 0) {
        await inningsCollection.deleteMany({ matchId: { $in: matchIds } });
      }

      // 5. Delete all players for these teams
      if (teamIds.length > 0) {
        await playersCollection.deleteMany({ teamId: { $in: teamIds } });
      }

      // 6. Delete all matches
      if (matchIds.length > 0) {
        await matchesCollection.deleteMany({ _id: { $in: matchIds } });
      }

      // 7. Delete all teams
      if (teamIds.length > 0) {
        await teamsCollection.deleteMany({ _id: { $in: teamIds } });
      }
    }

    // Delete the user
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "User and all associated data deleted successfully",
      dataDeleted: userToDelete.role === 'UMPIRE'
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
