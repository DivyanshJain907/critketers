import {
  getMatchesCollection,
  getTeamsCollection,
  getInningsCollection,
  getPlayersCollection,
  getOversCollection,
  getBallsCollection,
  getExtrasCollection,
  getWicketsCollection,
} from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/matches/[id] - Get match by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchesCollection = await getMatchesCollection();
    const teamsCollection = await getTeamsCollection();
    const playersCollection = await getPlayersCollection();
    const inningsCollection = await getInningsCollection();
    const oversCollection = await getOversCollection();
    const ballsCollection = await getBallsCollection();
    const extrasCollection = await getExtrasCollection();
    const wicketsCollection = await getWicketsCollection();

    // Validate if id is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid match ID format" }, { status: 400 });
    }

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

    // Get teams with players
    const teamA = await teamsCollection.findOne({
      _id: new ObjectId(match.teamAId),
    });
    const teamB = await teamsCollection.findOne({
      _id: new ObjectId(match.teamBId),
    });

    const teamAPlayers = teamA
      ? await playersCollection.find({ teamId: teamA._id?.toString() }).toArray()
      : [];
    const teamBPlayers = teamB
      ? await playersCollection.find({ teamId: teamB._id?.toString() }).toArray()
      : [];

    // Get innings with complete data
    const innings = await inningsCollection
      .find({ matchId: id })
      .toArray();

    // Populate innings with overs, balls, and extras
    const populatedInnings = await Promise.all(
      innings.map(async (inning) => {
        const overs = await oversCollection
          .find({ inningsId: inning._id?.toString() })
          .toArray();
        
        const balls = await ballsCollection
          .find({ inningsId: inning._id?.toString() })
          .sort({ ballNumber: 1 })
          .toArray();

        const extras = await extrasCollection
          .find({ inningsId: inning._id?.toString() })
          .sort({ createdAt: 1 })
          .toArray();

        const wickets = await wicketsCollection
          .find({ inningsId: inning._id?.toString() })
          .sort({ createdAt: 1 })
          .toArray();

        return {
          ...inning,
          id: inning._id?.toString(),
          totalRuns: inning.totalRuns || 0,
          totalBalls: inning.totalBalls || 0,
          overs: overs.map((o) => ({
            ...o,
            id: o._id?.toString(),
          })),
          balls: balls.map((b) => ({
            ...b,
            id: b._id?.toString(),
          })),
          extras: extras.map((e) => ({
            ...e,
            id: e._id?.toString(),
          })),
          wickets: wickets.map((w) => ({
            ...w,
            id: w._id?.toString(),
          })),
        };
      })
    );

    return NextResponse.json({
      ...match,
      id: match._id?.toString(),
      teamA: teamA
        ? {
            ...teamA,
            id: teamA._id?.toString(),
            players: teamAPlayers.map((p) => ({
              ...p,
              id: p._id?.toString(),
            })),
          }
        : null,
      teamB: teamB
        ? {
            ...teamB,
            id: teamB._id?.toString(),
            players: teamBPlayers.map((p) => ({
              ...p,
              id: p._id?.toString(),
            })),
          }
        : null,
      innings: populatedInnings,
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

// PATCH /api/matches/[id] - Update match status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const matchesCollection = await getMatchesCollection();
    const teamsCollection = await getTeamsCollection();

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

    const result = await matchesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const updatedMatch = await matchesCollection.findOne({
      _id: new ObjectId(id),
    });

    const teamA = await teamsCollection.findOne({
      _id: new ObjectId(updatedMatch?.teamAId),
    });
    const teamB = await teamsCollection.findOne({
      _id: new ObjectId(updatedMatch?.teamBId),
    });

    return NextResponse.json({
      ...updatedMatch,
      id: updatedMatch?._id?.toString(),
      teamA: teamA ? { ...teamA, id: teamA._id?.toString() } : null,
      teamB: teamB ? { ...teamB, id: teamB._id?.toString() } : null,
    });
  } catch (error: any) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}
