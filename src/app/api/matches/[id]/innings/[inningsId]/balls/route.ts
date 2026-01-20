import {
  getInningsCollection,
  getOversCollection,
  getBallsCollection,
  getBattingStatsCollection,
  getMatchesCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/matches/[id]/innings/[inningsId]/balls - Record a new ball
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inningsId: string }> }
) {
  try {
    const { id, inningsId } = await params;
    const body = await request.json();
    console.log("Recording ball with data:", body);
    const {
      overNumber,
      strikerPlayerId,
      nonStrikerPlayerId,
      bowlerId,
      runs,
      ballType,
    } = body;

    if (
      overNumber === undefined ||
      !strikerPlayerId ||
      !bowlerId ||
      runs === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate runs (0-6 for legal balls)
    if (ballType === "LEGAL" && (runs < 0 || runs > 6)) {
      return NextResponse.json(
        { error: "Runs must be between 0 and 6 for legal balls" },
        { status: 400 }
      );
    }

    const inningsCollection = await getInningsCollection();
    const oversCollection = await getOversCollection();
    const ballsCollection = await getBallsCollection();
    const battingStatsCollection = await getBattingStatsCollection();
    const matchesCollection = await getMatchesCollection();

    // Fetch match to check oversLimit
    const match = await matchesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
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

    // Fetch current innings to check total balls
    const innings = await inningsCollection.findOne({
      _id: new ObjectId(inningsId),
    });

    if (!innings) {
      return NextResponse.json(
        { error: "Innings not found" },
        { status: 404 }
      );
    }

    // Check if adding this ball would exceed oversLimit
    const maxBalls = match.oversLimit * 6;
    if (innings.totalBalls >= maxBalls) {
      return NextResponse.json(
        { error: `Over limit reached. Maximum ${match.oversLimit} overs (${maxBalls} balls) allowed.` },
        { status: 400 }
      );
    }

    // Get or create over
    let over = await oversCollection.findOne({
      inningsId,
      overNumber,
    });

    if (!over) {
      const overResult = await oversCollection.insertOne({
        inningsId,
        overNumber,
        legalBalls: 0,
        illegalBalls: 0,
        runs: 0,
      });
      over = {
        _id: overResult.insertedId,
        inningsId,
        overNumber,
        legalBalls: 0,
        illegalBalls: 0,
        runs: 0,
      };
    }

    // Count existing balls in this over to determine next ballNumber
    const ballsInOver = await ballsCollection
      .find({ overId: over._id?.toString() })
      .toArray();
    const ballNumber = ballsInOver.length + 1;

    // Create ball
    const ballResult = await ballsCollection.insertOne({
      inningsId,
      overId: over._id?.toString(),
      ballNumber,
      strikerPlayerId,
      bowlerId,
      runs,
      ballType,
      nonStrikerPlayerId: nonStrikerPlayerId || null,
      isWicket: false,
      createdAt: new Date(),
    });

    // Update over stats
    const legalBalls = ballType === "LEGAL" ? 1 : 0;
    const illegalBalls = ballType !== "LEGAL" ? 1 : 0;

    await oversCollection.updateOne(
      { _id: over._id },
      {
        $inc: {
          legalBalls,
          illegalBalls,
          runs,
        },
      }
    );

    // Update innings stats
    await inningsCollection.updateOne(
      { _id: new ObjectId(inningsId) },
      {
        $inc: {
          totalRuns: runs,
          totalBalls: 1,
        },
      }
    );

    // Update batting stats for striker
    const existingStats = await battingStatsCollection.findOne({
      playerId: strikerPlayerId,
    });

    if (existingStats) {
      await battingStatsCollection.updateOne(
        { playerId: strikerPlayerId },
        {
          $inc: {
            ballsFaced: 1,
            runs,
            fours: runs === 4 ? 1 : 0,
            sixes: runs === 6 ? 1 : 0,
          },
        }
      );
    } else {
      await battingStatsCollection.insertOne({
        playerId: strikerPlayerId,
        inningsId,
        ballsFaced: 1,
        runs,
        fours: runs === 4 ? 1 : 0,
        sixes: runs === 6 ? 1 : 0,
      });
    }

    return NextResponse.json(
      {
        id: ballResult.insertedId.toString(),
        inningsId,
        overId: over._id?.toString(),
        ballNumber,
        strikerPlayerId,
        bowlerId,
        runs,
        ballType,
        nonStrikerPlayerId,
        isWicket: false,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error recording ball:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record ball" },
      { status: 500 }
    );
  }
}

// GET /api/matches/[id]/innings/[inningsId]/balls - Get all balls in innings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inningsId: string }> }
) {
  try {
    const { id, inningsId } = await params;
    const ballsCollection = await getBallsCollection();
    const oversCollection = await getOversCollection();

    const balls = await ballsCollection
      .find({ inningsId })
      .sort({ overId: 1, ballNumber: 1 })
      .toArray();

    // Populate over info
    const ballsWithOvers = await Promise.all(
      balls.map(async (ball) => {
        const over = await oversCollection.findOne({
          _id: new ObjectId(ball.overId),
        });
        return {
          ...ball,
          id: ball._id?.toString(),
          over: over ? { ...over, id: over._id?.toString() } : null,
        };
      })
    );

    return NextResponse.json(ballsWithOvers);
  } catch (error) {
    console.error("Error fetching balls:", error);
    return NextResponse.json(
      { error: "Failed to fetch balls" },
      { status: 500 }
    );
  }
}
