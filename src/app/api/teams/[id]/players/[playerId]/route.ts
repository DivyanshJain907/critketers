import { getPlayersCollection, getTeamsCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// DELETE /api/teams/[id]/players/[playerId] - Delete a player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const playersCollection = await getPlayersCollection();
    const teamsCollection = await getTeamsCollection();

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

    // Verify team exists and belongs to umpire
    const team = await teamsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if umpire is deleting from their own team
    if (userRole === 'UMPIRE' && team.umpireId !== userId) {
      return NextResponse.json(
        { error: "You do not have access to delete players from this team" },
        { status: 403 }
      );
    }

    // Verify player belongs to the team
    const player = await playersCollection.findOne({
      _id: new ObjectId(playerId),
    });

    if (!player || player.teamId !== id) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Delete player
    await playersCollection.deleteOne({
      _id: new ObjectId(playerId),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
