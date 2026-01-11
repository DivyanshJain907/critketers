import {
  getInningsCollection,
  getOversCollection,
  getExtrasCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// POST /api/matches/[id]/innings/[inningsId]/extras - Record extras
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inningsId: string }> }
) {
  try {
    const { id, inningsId } = await params;
    const body = await request.json();
    const { extraType, runs, overId } = body;

    if (!extraType || runs === undefined) {
      return NextResponse.json(
        { error: "Extra type and runs are required" },
        { status: 400 }
      );
    }

    const inningsCollection = await getInningsCollection();
    const oversCollection = await getOversCollection();
    const extrasCollection = await getExtrasCollection();

    // Create extra record
    const result = await extrasCollection.insertOne({
      inningsId,
      extraType,
      runs,
      overId: overId || null,
      createdAt: new Date(),
    });

    // Update innings total runs only (don't increment totalBalls for extras)
    await inningsCollection.updateOne(
      { _id: new ObjectId(inningsId) },
      { $inc: { totalRuns: runs } }
    );

    // Update over runs if applicable
    if (overId) {
      await oversCollection.updateOne(
        { _id: new ObjectId(overId) },
        { $inc: { runs } }
      );
    }

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        inningsId,
        extraType,
        runs,
        overId,
        createdAt: new Date(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording extra:", error);
    return NextResponse.json(
      { error: "Failed to record extra" },
      { status: 500 }
    );
  }
}

// GET /api/matches/[id]/innings/[inningsId]/extras - Get all extras in innings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inningsId: string }> }
) {
  try {
    const { id, inningsId } = await params;
    const extrasCollection = await getExtrasCollection();
    const oversCollection = await getOversCollection();

    const extras = await extrasCollection
      .find({ inningsId })
      .sort({ createdAt: 1 })
      .toArray();

    // Populate over info
    const extrasWithOvers = await Promise.all(
      extras.map(async (extra) => {
        let over = null;
        if (extra.overId) {
          over = await oversCollection.findOne({
            _id: new ObjectId(extra.overId),
          });
        }
        return {
          ...extra,
          id: extra._id?.toString(),
          over: over ? { ...over, id: over._id?.toString() } : null,
        };
      })
    );

    return NextResponse.json(extrasWithOvers);
  } catch (error) {
    console.error("Error fetching extras:", error);
    return NextResponse.json(
      { error: "Failed to fetch extras" },
      { status: 500 }
    );
  }
}
