import {
  getInningsCollection,
  getBallsCollection,
  getWicketsCollection,
  getBowlingStatsCollection,
  getPlayersCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// POST /api/matches/[id]/innings/[inningsId]/wickets - Record a wicket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inningsId: string }> }
) {
  try {
    const { id, inningsId } = await params;
    const body = await request.json();
    const { ballId, playerOutId, bowlerId, fielderId, wicketType } = body;

    if (!ballId || !playerOutId || !bowlerId || !wicketType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const inningsCollection = await getInningsCollection();
    const ballsCollection = await getBallsCollection();
    const wicketsCollection = await getWicketsCollection();
    const bowlingStatsCollection = await getBowlingStatsCollection();

    // Verify ball exists
    const ball = await ballsCollection.findOne({
      _id: new ObjectId(ballId),
    });
    if (!ball) {
      return NextResponse.json({ error: "Ball not found" }, { status: 404 });
    }

    // Create wicket record
    const result = await wicketsCollection.insertOne({
      inningsId,
      ballId,
      playerOutId,
      bowlerId,
      fielderId: fielderId || null,
      wicketType,
      createdAt: new Date(),
    });

    // Update ball to mark as wicket
    await ballsCollection.updateOne(
      { _id: new ObjectId(ballId) },
      { $set: { isWicket: true } }
    );

    // Update innings wicket count
    await inningsCollection.updateOne(
      { _id: new ObjectId(inningsId) },
      { $inc: { totalWickets: 1 } }
    );

    // Update bowling stats for bowler
    const existingBowlingStats = await bowlingStatsCollection.findOne({
      playerId: bowlerId,
    });

    if (existingBowlingStats) {
      await bowlingStatsCollection.updateOne(
        { playerId: bowlerId },
        { $inc: { wickets: 1 } }
      );
    } else {
      await bowlingStatsCollection.insertOne({
        playerId: bowlerId,
        inningsId,
        wickets: 1,
        balls: 0,
        runs: 0,
      });
    }

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        inningsId,
        ballId,
        playerOutId,
        bowlerId,
        fielderId,
        wicketType,
        createdAt: new Date(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording wicket:", error);
    return NextResponse.json(
      { error: "Failed to record wicket" },
      { status: 500 }
    );
  }
}

// GET /api/matches/[id]/innings/[inningsId]/wickets - Get all wickets in innings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inningsId: string }> }
) {
  try {
    const { id, inningsId } = await params;
    const wicketsCollection = await getWicketsCollection();
    const playersCollection = await getPlayersCollection();
    const ballsCollection = await getBallsCollection();

    const wickets = await wicketsCollection
      .find({ inningsId })
      .toArray();

    // Populate player and ball info
    const wicketsWithDetails = await Promise.all(
      wickets.map(async (wicket) => {
        const playerOut = await playersCollection.findOne({
          _id: new ObjectId(wicket.playerOutId),
        });
        const bowler = await playersCollection.findOne({
          _id: new ObjectId(wicket.bowlerId),
        });
        const ballData = await ballsCollection.findOne({
          _id: new ObjectId(wicket.ballId),
        });

        return {
          ...wicket,
          id: wicket._id?.toString(),
          playerOut: playerOut
            ? { ...playerOut, id: playerOut._id?.toString() }
            : null,
          bowler: bowler ? { ...bowler, id: bowler._id?.toString() } : null,
          ball: ballData ? { ...ballData, id: ballData._id?.toString() } : null,
        };
      })
    );

    return NextResponse.json(wicketsWithDetails);
  } catch (error) {
    console.error("Error fetching wickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wickets" },
      { status: 500 }
    );
  }
}
