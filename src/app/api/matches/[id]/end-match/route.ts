import {
  getMatchesCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/matches/[id]/end-match - Forcefully end a match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { comment } = body;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userId = null;
    let userRole = null;

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
      userRole = decoded.role;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only Umpire and Admin can end matches
    if (userRole !== 'UMPIRE' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only umpires and admins can end matches" }, { status: 403 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid match ID format" }, { status: 400 });
    }

    const matchesCollection = await getMatchesCollection();

    // Update match status to COMPLETED
    const result = await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'COMPLETED',
          endedBy: userRole,
          endComment: comment || 'Match ended by ' + userRole,
          endedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Fetch updated match
    const updatedMatch = await matchesCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: "Match ended successfully",
      match: updatedMatch,
    }, { status: 200 });
  } catch (error) {
    console.error("Error ending match:", error);
    return NextResponse.json({ error: "Failed to end match" }, { status: 500 });
  }
}
