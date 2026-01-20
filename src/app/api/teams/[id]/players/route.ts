import {
  getTeamsCollection,
  getPlayersCollection,
  getBattingStatsCollection,
  getBowlingStatsCollection,
  getFieldingStatsCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/teams/[id]/players - Get players of a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamsCollection = await getTeamsCollection();
    const playersCollection = await getPlayersCollection();

    // Verify team exists and check ownership
    const team = await teamsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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

    // Check if umpire is accessing their own team
    if (userRole === 'UMPIRE' && team.umpireId !== userId) {
      return NextResponse.json(
        { error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    const players = await playersCollection
      .find({ teamId: id })
      .toArray();

    return NextResponse.json(
      players.map((p) => ({
        ...p,
        id: p._id?.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/players - Add a player to a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, jerseyNo, role } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }

    const teamsCollection = await getTeamsCollection();
    const playersCollection = await getPlayersCollection();

    // Verify team exists
    const team = await teamsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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

    // Check if umpire is adding to their own team
    if (userRole === 'UMPIRE' && team.umpireId !== userId) {
      return NextResponse.json(
        { error: "You do not have access to add players to this team" },
        { status: 403 }
      );
    }

    // Check for duplicate jersey number only if provided
    if (jerseyNo !== null && jerseyNo !== undefined) {
      const parsedJerseyNo = parseInt(jerseyNo);
      const existingPlayer = await playersCollection.findOne({
        teamId: id,
        jerseyNo: parsedJerseyNo,
      });
      if (existingPlayer) {
        return NextResponse.json(
          {
            error: "Player with this jersey number already exists in team",
          },
          { status: 400 }
        );
      }
    }

    const playerResult = await playersCollection.insertOne({
      name,
      jerseyNo: jerseyNo ? parseInt(jerseyNo) : null,
      role,
      teamId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const player = {
      id: playerResult.insertedId.toString(),
      name,
      jerseyNo: jerseyNo ? parseInt(jerseyNo) : null,
      role,
      teamId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create batting and bowling stats records
    const battingStatsCollection = await getBattingStatsCollection();
    await battingStatsCollection.insertOne({
      playerId: playerResult.insertedId.toString(),
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const bowlingStatsCollection = await getBowlingStatsCollection();
    await bowlingStatsCollection.insertOne({
      playerId: playerResult.insertedId.toString(),
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fieldingStatsCollection = await getFieldingStatsCollection();
    await fieldingStatsCollection.insertOne({
      playerId: playerResult.insertedId.toString(),
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error: any) {
    console.error("Error adding player:", error);
    return NextResponse.json(
      { error: "Failed to add player" },
      { status: 500 }
    );
  }
}
