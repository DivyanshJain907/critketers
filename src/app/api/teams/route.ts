import { getTeamsCollection, getPlayersCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET /api/teams - Get all teams
export async function GET() {
  try {
    const teamsCollection = await getTeamsCollection();
    const playersCollection = await getPlayersCollection();

    const teams = await teamsCollection.find({}).toArray();

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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const team = {
      id: result.insertedId.toString(),
      name,
      shortCode: shortCode || name.substring(0, 3).toUpperCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
