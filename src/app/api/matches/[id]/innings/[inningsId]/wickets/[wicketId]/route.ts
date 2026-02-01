import {
  getInningsCollection,
  getWicketsCollection,
  getBowlingStatsCollection,
  getMatchesCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// DELETE /api/matches/[id]/innings/[inningsId]/wickets/[wicketId] - Delete a wicket
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; inningsId: string; wicketId: string }> },
) {
  try {
    const { id, inningsId, wicketId } = await params;

    if (!wicketId) {
      return NextResponse.json(
        { error: "Wicket ID is required" },
        { status: 400 },
      );
    }

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
      if (decoded.role !== "UMPIRE" && decoded.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only umpires can delete wickets" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const wicketsCollection = await getWicketsCollection();
    const inningsCollection = await getInningsCollection();
    const matchesCollection = await getMatchesCollection();
    const bowlingStatsCollection = await getBowlingStatsCollection();

    // Get the wicket to delete
    const wicket = await wicketsCollection.findOne({
      _id: new ObjectId(wicketId),
      inningsId,
    });

    if (!wicket) {
      return NextResponse.json({ error: "Wicket not found" }, { status: 404 });
    }

    // Delete the wicket
    await wicketsCollection.deleteOne({ _id: new ObjectId(wicketId) });

    // Update innings: decrement wicket count
    await inningsCollection.updateOne(
      { _id: new ObjectId(inningsId) },
      {
        $inc: {
          totalWickets: -1,
        },
        $set: { updatedAt: new Date() },
      },
    );

    // Update bowling stats: decrement wickets for the bowler
    if (wicket.bowlerId) {
      await bowlingStatsCollection.updateOne(
        { playerId: wicket.bowlerId },
        { $inc: { wickets: -1 } },
      );
    }

    // Update match updated timestamp
    await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { updatedAt: new Date() } },
    );

    return NextResponse.json(
      { message: "Wicket deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting wicket:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete wicket",
      },
      { status: 500 },
    );
  }
}
