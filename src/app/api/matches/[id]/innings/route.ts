import {
  getMatchesCollection,
  getInningsCollection,
  getPlayersCollection,
  getBattingStatsCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/matches/[id]/innings - Start a new innings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamId, inningsNumber, openingBatsmanId, openingBowlerId } = body;

    if (!teamId || !openingBatsmanId || !openingBowlerId) {
      return NextResponse.json(
        { error: "Team ID, opening batsman, and opening bowler are required" },
        { status: 400 }
      );
    }

    const matchesCollection = await getMatchesCollection();
    const inningsCollection = await getInningsCollection();
    const playersCollection = await getPlayersCollection();
    const battingStatsCollection = await getBattingStatsCollection();

    // Verify match exists
    const match = await matchesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check access control for umpires
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
        // Token invalid, continue as VIEWER
      }
    }

    // Check if umpire is accessing their own match
    if (userRole === 'UMPIRE' && match.umpireId !== userId) {
      return NextResponse.json(
        { error: "You do not have access to this match" },
        { status: 403 }
      );
    }

    // Check if innings already exists
    const inningsNum = inningsNumber || 1;
    const existingInnings = await inningsCollection.findOne({
      matchId: id,
      inningsNumber: inningsNum,
    });

    if (existingInnings) {
      return NextResponse.json(
        { error: "Innings already exists for this match" },
        { status: 400 }
      );
    }

    // Update match status to ONGOING when innings starts
    await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "ONGOING", updatedAt: new Date() } }
    );

    const result = await inningsCollection.insertOne({
      matchId: id,
      teamId,
      inningsNumber: inningsNum,
      openingBatsmanId,
      openingBowlerId,
      status: "ONGOING",
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Initialize batting stats for team players
    const teamPlayers = await playersCollection
      .find({ teamId })
      .toArray();

    for (const player of teamPlayers) {
      const existingStats = await battingStatsCollection.findOne({
        playerId: player._id?.toString(),
      });
      if (!existingStats) {
        await battingStatsCollection.insertOne({
          playerId: player._id?.toString(),
          inningsId: result.insertedId.toString(),
          ballsFaced: 0,
          runs: 0,
          fours: 0,
          sixes: 0,
        });
      }
    }

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        matchId: id,
        teamId,
        inningsNumber: inningsNum,
        openingBatsmanId,
        openingBowlerId,
        status: "ONGOING",
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error starting innings:", error);
    return NextResponse.json(
      { error: "Failed to start innings" },
      { status: 500 }
    );
  }
}

// GET /api/matches/[id]/innings - Get all innings for a match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inningsCollection = await getInningsCollection();
    const matchesCollection = await getMatchesCollection();

    // Verify match exists
    const match = await matchesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check access control for umpires
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
        // Token invalid, continue as VIEWER
      }
    }

    // Check if umpire is accessing their own match
    if (userRole === 'UMPIRE' && match.umpireId !== userId) {
      return NextResponse.json(
        { error: "You do not have access to this match" },
        { status: 403 }
      );
    }

    const innings = await inningsCollection
      .find({ matchId: id })
      .sort({ inningsNumber: 1 })
      .toArray();

    return NextResponse.json(
      innings.map((inning) => ({
        ...inning,
        id: inning._id?.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching innings:", error);
    return NextResponse.json(
      { error: "Failed to fetch innings" },
      { status: 500 }
    );
  }
}
