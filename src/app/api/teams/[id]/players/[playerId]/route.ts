import { getPlayersCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// DELETE /api/teams/[id]/players/[playerId] - Delete a player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const playersCollection = await getPlayersCollection();

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
