import { getTeamsCollection, getPlayersCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/teams - Get all teams
export async function GET(request: NextRequest) {
  try {
    const teamsCollection = await getTeamsCollection();
    const playersCollection = await getPlayersCollection();

    // Get user role and ID from request headers
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
        // Token invalid or expired, continue as VIEWER
      }
    }

    // Build query filter
    let query: any = {};
    if (userRole === 'UMPIRE' && userId) {
      // Umpires can only see their own teams
      query.umpireId = userId;
    }
    // ADMINs see all teams (no filter)

    const teams = await teamsCollection.find(query).toArray();

    // Get players for each team
    const teamsWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const players = await playersCollection
          .find({ teamId: team._id?.toString() })
          .toArray();
        return {
          ...team,
          id: team._id?.toString(),
          players: players.map((p) => ({
            ...p,
            id: p._id?.toString(),
            teamId: p.teamId,
          })),
        };
      })
    );

    return NextResponse.json(teamsWithPlayers);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    // Get umpire ID from auth token
    const authHeader = request.headers.get('authorization');
    let umpireId = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        if (decoded.role === 'UMPIRE' || decoded.role === 'ADMIN') {
          umpireId = decoded.userId;
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, shortCode } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const teamsCollection = await getTeamsCollection();

    // Check if team name already exists
    const existingTeam = await teamsCollection.findOne({ name });
    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name already exists" },
        { status: 400 }
      );
    }

    const result = await teamsCollection.insertOne({
      name,
      shortCode: shortCode || name.substring(0, 3).toUpperCase(),
      umpireId, // Store the umpire who created this team
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const team = {
      id: result.insertedId.toString(),
      name,
      shortCode: shortCode || name.substring(0, 3).toUpperCase(),
      umpireId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
