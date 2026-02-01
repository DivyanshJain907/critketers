import {
  getInningsCollection,
  getExtrasCollection,
  getMatchesCollection,
  getOversCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// DELETE /api/matches/[id]/innings/[inningsId]/extras/[extraId] - Delete an extra
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; inningsId: string; extraId: string }>;
  },
) {
  try {
    const { id, inningsId, extraId } = await params;

    if (!extraId) {
      return NextResponse.json(
        { error: "Extra ID is required" },
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
          { error: "Only umpires can delete extras" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const extrasCollection = await getExtrasCollection();
    const inningsCollection = await getInningsCollection();
    const matchesCollection = await getMatchesCollection();
    const oversCollection = await getOversCollection();

    // Get the extra to delete
    const extra = await extrasCollection.findOne({
      _id: new ObjectId(extraId),
      inningsId,
    });

    if (!extra) {
      return NextResponse.json({ error: "Extra not found" }, { status: 404 });
    }

    // Delete the extra
    await extrasCollection.deleteOne({ _id: new ObjectId(extraId) });

    // Bye and Leg Bye count as normal balls (decrement totalBalls)
    // Wide and No-Ball don't count as balls, only their runs are subtracted
    const isBallCountingExtra = extra.extraType === "BYE" || extra.extraType === "LEG_BYE";
    
    // Update innings totals (decrement runs)
    const runsDecrement = extra.runs || 0;
    const updateObj: any = {
      $inc: {
        totalRuns: -runsDecrement,
      },
      $set: { updatedAt: new Date() },
    };
    
    if (isBallCountingExtra) {
      updateObj.$inc.totalBalls = -1;
    }
    
    await inningsCollection.updateOne(
      { _id: new ObjectId(inningsId) },
      updateObj,
    );

    // Update over runs if applicable
    if (extra.overId) {
      const overUpdate: any = {
        $inc: {
          runs: -runsDecrement,
        },
      };
      if (isBallCountingExtra) {
        overUpdate.$inc.legalBalls = -1;
      }
      await oversCollection.updateOne(
        { _id: new ObjectId(extra.overId) },
        overUpdate,
      );
    }

    // Update match updated timestamp
    await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { updatedAt: new Date() } },
    );

    return NextResponse.json(
      { message: "Extra deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting extra:", error);
    return NextResponse.json(
      { error: "Failed to delete extra" },
      { status: 500 },
    );
  }
}
