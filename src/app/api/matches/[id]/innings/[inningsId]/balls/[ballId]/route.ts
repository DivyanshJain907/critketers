import {
  getInningsCollection,
  getBallsCollection,
  getMatchesCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// DELETE /api/matches/[id]/innings/[inningsId]/balls/[ballId] - Delete a ball
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; inningsId: string; ballId: string }> },
) {
  try {
    const { id, inningsId, ballId } = await params;

    if (!ballId) {
      return NextResponse.json(
        { error: "Ball ID is required" },
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
          { error: "Only umpires can delete balls" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const ballsCollection = await getBallsCollection();
    const inningsCollection = await getInningsCollection();
    const matchesCollection = await getMatchesCollection();

    // Get the ball to delete
    const ball = await ballsCollection.findOne({
      _id: new ObjectId(ballId),
      inningsId,
    });

    if (!ball) {
      return NextResponse.json({ error: "Ball not found" }, { status: 404 });
    }

    // Delete the ball
    await ballsCollection.deleteOne({ _id: new ObjectId(ballId) });

    // Update innings totals
    const runsDecrement = ball.runs || 0;
    await inningsCollection.updateOne(
      { _id: new ObjectId(inningsId) },
      {
        $inc: {
          totalRuns: -runsDecrement,
          totalBalls: -1,
          totalWickets: 0,
        },
        $set: { updatedAt: new Date() },
      },
    );

    // Update match updated timestamp
    await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { updatedAt: new Date() } },
    );

    return NextResponse.json(
      { message: "Ball deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting ball:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete ball",
      },
      { status: 500 },
    );
  }
}
