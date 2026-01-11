import { getTeamsCollection, getPlayersCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// GET /api/teams/[id] - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamsCollection = await getTeamsCollection();
    const playersCollection = await getPlayersCollection();

    const team = await teamsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const players = await playersCollection
      .find({ teamId: id })
      .toArray();

    const teamWithPlayers = {
      ...team,
      id: team._id?.toString(),
      players: players.map((p) => ({
        ...p,
        id: p._id?.toString(),
      })),
    };

    return NextResponse.json(teamWithPlayers);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamsCollection = await getTeamsCollection();

    const result = await teamsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
