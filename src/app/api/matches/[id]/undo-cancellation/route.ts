import {
  getMatchesCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/matches/[id]/undo-cancellation - Undo match cancellation (within 5 minutes)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Only Umpire and Admin can undo cancellation
    if (userRole !== 'UMPIRE' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only umpires and admins can undo match cancellation" }, { status: 403 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid match ID format" }, { status: 400 });
    }

    const matchesCollection = await getMatchesCollection();
    
    // Fetch the match
    const match = await matchesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if match is completed
    if (match.status !== 'COMPLETED') {
      return NextResponse.json({ error: "Match is not cancelled" }, { status: 400 });
    }

    // Check if undo is still available (within 5 minutes)
    if (!match.endedAt) {
      return NextResponse.json({ error: "Match cancellation timestamp not found" }, { status: 400 });
    }

    const endedAt = new Date(match.endedAt);
    const now = new Date();
    const minutesDiff = (now.getTime() - endedAt.getTime()) / (1000 * 60);

    if (minutesDiff > 5) {
      return NextResponse.json({ 
        error: `Undo is no longer available (${minutesDiff.toFixed(1)} minutes passed. Limited to 5 minutes)` 
      }, { status: 400 });
    }

    // Restore match to ONGOING status
    const result = await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'ONGOING',
        },
        $unset: {
          endedBy: "",
          endComment: "",
          endedAt: "",
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Fetch updated match
    const updatedMatch = await matchesCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: "Match cancellation undone successfully",
      match: updatedMatch,
    }, { status: 200 });
  } catch (error) {
    console.error("Error undoing match cancellation:", error);
    return NextResponse.json({ error: "Failed to undo match cancellation" }, { status: 500 });
  }
}
