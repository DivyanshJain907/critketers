import { getMatchesCollection, getTeamsCollection, getInningsCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/matches - Get all matches
export async function GET(request: NextRequest) {
  try {
    const matchesCollection = await getMatchesCollection();
    const teamsCollection = await getTeamsCollection();
    const inningsCollection = await getInningsCollection();

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
      // Umpires can only see their own matches
      query.umpireId = userId;
    }
    // ADMINs see all matches (no filter)

    const matches = await matchesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate team information and innings
    const matchesWithDetails = await Promise.all(
      matches.map(async (match) => {
        const teamA = await teamsCollection.findOne({
          _id: new ObjectId(match.teamAId),
        });
        const teamB = await teamsCollection.findOne({
          _id: new ObjectId(match.teamBId),
        });

        // Fetch innings for this match
        const innings = await inningsCollection
          .find({ matchId: match._id.toString() })
          .sort({ inningNumber: 1 })
          .toArray();

        return {
          ...match,
          _id: match._id?.toString(),
          id: match._id?.toString(),
          teamA: teamA ? { ...teamA, id: teamA._id?.toString() } : null,
          teamB: teamB ? { ...teamB, id: teamB._id?.toString() } : null,
          innings: innings || [],
        };
      })
    );

    return NextResponse.json(matchesWithDetails);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// POST /api/matches - Create a new match
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
    const {
      name,
      teamAId,
      teamBId,
      tossWinnerId,
      tossDecision,
      oversLimit,
    } = body;

    if (!teamAId || !teamBId) {
      return NextResponse.json(
        { error: "Team A and Team B are required" },
        { status: 400 }
      );
    }

    if (teamAId === teamBId) {
      return NextResponse.json(
        { error: "Teams must be different" },
        { status: 400 }
      );
    }

    const matchesCollection = await getMatchesCollection();
    const teamsCollection = await getTeamsCollection();

    // Verify both teams exist
    const teamAObjId = new ObjectId(teamAId);
    const teamBObjId = new ObjectId(teamBId);

    const [teamA, teamB] = await Promise.all([
      teamsCollection.findOne({ _id: teamAObjId }),
      teamsCollection.findOne({ _id: teamBObjId }),
    ]);

    if (!teamA || !teamB) {
      return NextResponse.json(
        { error: "One or both teams not found" },
        { status: 404 }
      );
    }

    const result = await matchesCollection.insertOne({
      name: name || `${teamA.name} vs ${teamB.name}`,
      teamAId,
      teamBId,
      umpireId, // Store the umpire who created this match
      tossWinnerId: tossWinnerId || null,
      tossDecision: tossDecision || null,
      oversLimit: oversLimit || 20,
      status: "UPCOMING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const match = {
      id: result.insertedId.toString(),
      name: name || `${teamA.name} vs ${teamB.name}`,
      teamAId,
      teamBId,
      umpireId,
      tossWinnerId: tossWinnerId || null,
      tossDecision: tossDecision || null,
      oversLimit: oversLimit || 20,
      status: "UPCOMING",
      teamA: { ...teamA, id: teamA._id?.toString() },
      teamB: { ...teamB, id: teamB._id?.toString() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  }
}
