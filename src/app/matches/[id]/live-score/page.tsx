"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Player {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface Ball {
  id?: string;
  ballNumber?: number;
  overNumber?: number;
  strikerPlayerId: string;
  bowlerId: string;
  runs: number;
  ballType?: string;
}

interface Wicket {
  id?: string;
  playerOutId: string;
  bowlerId: string;
  fielderId?: string;
  wicketType: string;
}

interface Innings {
  id: string;
  inningsNumber: number;
  teamId: string;
  totalRuns: number;
  totalBalls: number;
  totalWickets: number;
  openingBatsmanId?: string;
  nonStrikerBatsmanId?: string;
  openingBowlerId?: string;
  balls?: Ball[];
  wickets?: Wicket[];
}

interface Match {
  _id: string;
  name: string;
  teamAId: string;
  teamBId: string;
  oversLimit: number;
  status: string;
  teamA: Team;
  teamB: Team;
  innings: Innings[];
}

export default function LiveScorePage() {
  const params = useParams();
  const matchId = params?.id as string;
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInnings, setSelectedInnings] = useState(0);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [fireworks, setFireworks] = useState<
    { x: number; y: number; id: string }[]
  >([]);
  const prevMatchRef = useRef<Match | null>(null);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
      // Refresh match data every 3 seconds for real-time updates
      const interval = setInterval(fetchMatch, 3000);
      return () => clearInterval(interval);
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/matches/${matchId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Match not found");
      const data = await response.json();

      // Check for changes and highlight them
      if (prevMatchRef.current && data.innings[selectedInnings]) {
        const prevInnings = prevMatchRef.current.innings[selectedInnings];
        const currInnings = data.innings[selectedInnings];

        // Check for 4s and 6s
        if (prevInnings.balls && currInnings.balls) {
          const newBalls = currInnings.balls.slice(prevInnings.balls.length);
          newBalls.forEach((ball: any) => {
            if (ball.runs === 4 || ball.runs === 6) {
              const id = Math.random().toString();
              setFireworks((prev) => [
                ...prev,
                { x: Math.random() * 100, y: Math.random() * 100, id },
              ]);
              setTimeout(() => {
                setFireworks((prev) => prev.filter((f) => f.id !== id));
              }, 1500);
            }
          });
        }

        if (prevInnings.totalRuns !== currInnings.totalRuns) {
          setHighlightedField("runs");
          setTimeout(() => setHighlightedField(null), 2000);
        }
        if (prevInnings.totalWickets !== currInnings.totalWickets) {
          setHighlightedField("wickets");
          setTimeout(() => setHighlightedField(null), 2000);
        }
        if (prevInnings.totalBalls !== currInnings.totalBalls) {
          setHighlightedField("overs");
          setTimeout(() => setHighlightedField(null), 2000);
        }
      }

      prevMatchRef.current = data;
      setMatch(data);
    } catch (err) {
      console.error("Error fetching match:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-white mb-4">Match not found</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const firstInnings = match.innings?.[0];
  const secondInnings = match.innings?.[1];
  const batingTeam =
    firstInnings?.teamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam =
    firstInnings?.teamId === match.teamA.id ? match.teamB : match.teamA;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background */}
      <div>
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="30"
              y="30"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="15" cy="15" r="1.5" fill="#06b6d4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Header */}
      <header className="z-10 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 h-16 sm:h-24 overflow-hidden sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-0 flex justify-between items-center h-full">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-400">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Innings Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-8 border-b border-slate-700 overflow-x-auto">
          {match.innings?.map((inning, index) => (
            <button
              key={index}
              onClick={() => setSelectedInnings(index)}
              className={`pb-2 sm:pb-3 px-2 sm:px-4 font-semibold transition-all text-xs sm:text-base whitespace-nowrap ${
                selectedInnings === index
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {inning.inningsNumber}.{" "}
              {inning.teamId === match.teamA.id
                ? match.teamA.name
                : match.teamB.name}
            </button>
          ))}
        </div>

        {/* Score Display */}
        {match.innings[selectedInnings] && (
          <div className="space-y-8">
            {/* Main Score Card - FIRST */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg sm:rounded-xl border border-cyan-500/30 p-4 sm:p-8">
              <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-6">
                {/* Total Runs */}
                <div
                  className={`bg-slate-800/50 rounded-lg p-3 sm:p-6 text-center transition-all duration-500 ${
                    highlightedField === "runs"
                      ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/50 scale-105"
                      : ""
                  }`}
                >
                  <p className="text-xs text-slate-400 mb-1 sm:mb-2">
                    Total Runs
                  </p>
                  <p className="text-3xl sm:text-5xl font-black text-cyan-400">
                    {match.innings[selectedInnings].totalRuns}
                  </p>
                </div>

                {/* Wickets */}
                <div
                  className={`bg-slate-800/50 rounded-lg p-3 sm:p-6 text-center transition-all duration-500 ${
                    highlightedField === "wickets"
                      ? "ring-2 ring-red-400 shadow-lg shadow-red-400/50 scale-105"
                      : ""
                  }`}
                >
                  <p className="text-xs text-slate-400 mb-1 sm:mb-2">Wickets</p>
                  <p className="text-3xl sm:text-5xl font-black text-red-400">
                    {match.innings[selectedInnings].totalWickets}
                  </p>
                </div>

                {/* Overs */}
                <div
                  className={`bg-slate-800/50 rounded-lg p-3 sm:p-6 text-center transition-all duration-500 ${
                    highlightedField === "overs"
                      ? "ring-2 ring-blue-400 shadow-lg shadow-blue-400/50 scale-105"
                      : ""
                  }`}
                >
                  <p className="text-xs text-slate-400 mb-1 sm:mb-2">Overs</p>
                  <p className="text-3xl sm:text-5xl font-black text-blue-400">
                    {Math.floor(match.innings[selectedInnings].totalBalls / 6)}.
                    {match.innings[selectedInnings].totalBalls % 6}
                  </p>
                </div>
              </div>
            </div>
            {/* Runs Per Ball Visualization */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-lg sm:rounded-xl border border-purple-500/30 p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-purple-300 mb-4">
                Runs Per Ball (Over-wise)
              </h3>
              <div className="space-y-4">
                {match.innings[selectedInnings].balls &&
                match.innings[selectedInnings].balls.length > 0 ? (
                  (() => {
                    // Group balls by over number
                    const ballsByOver: { [key: number]: any[] } = {};
                    match.innings[selectedInnings].balls.forEach(
                      (ball: any) => {
                        const overNum = ball.overNumber || 0;
                        if (!ballsByOver[overNum]) {
                          ballsByOver[overNum] = [];
                        }
                        ballsByOver[overNum].push(ball);
                      },
                    );

                    // Sort overs and render
                    return Object.keys(ballsByOver)
                      .map(Number)
                      .sort((a, b) => a - b)
                      .map((overNum) => (
                        <div key={overNum}>
                          <p className="text-xs sm:text-sm font-bold text-purple-300 mb-2">
                            Over {overNum + 1}
                          </p>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {ballsByOver[overNum].map(
                              (ball: any, ballIndex: number) => {
                                let bgColor = "bg-gray-600";
                                let textColor = "text-white";

                                if (ball.runs === 0) {
                                  bgColor = "bg-gray-600";
                                } else if (ball.runs === 1 || ball.runs === 3) {
                                  bgColor = "bg-green-600";
                                } else if (ball.runs === 2) {
                                  bgColor = "bg-blue-600";
                                } else if (ball.runs === 4) {
                                  bgColor = "bg-blue-700";
                                  textColor = "text-blue-300 font-bold";
                                } else if (ball.runs === 6) {
                                  bgColor = "bg-purple-700";
                                  textColor = "text-purple-300 font-bold";
                                }

                                return (
                                  <div
                                    key={ballIndex}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${bgColor} ${textColor}`}
                                  >
                                    {ball.runs}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      ));
                  })()
                ) : (
                  <p className="text-slate-400 text-sm">
                    No balls recorded yet
                  </p>
                )}
              </div>
            </div>
            {/* Teams Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {/* Batting Team */}
              <div className="bg-linear-to-br from-blue-900/40 to-blue-800/30 rounded-lg sm:rounded-xl border border-blue-500/50 p-3 sm:p-6">
                <p className="text-xs text-blue-400 font-semibold mb-1 sm:mb-2 uppercase">
                  Batting Team
                </p>
                <p className="text-xl sm:text-3xl font-black text-white mb-1">
                  {match.innings[selectedInnings].teamId === match.teamA.id
                    ? match.teamA.name
                    : match.teamB.name}
                </p>
                <p className="text-xs sm:text-sm text-blue-300">
                  {match.innings[selectedInnings].totalRuns}/
                  {match.innings[selectedInnings].totalWickets} (
                  {Math.floor(match.innings[selectedInnings].totalBalls / 6)}.
                  {match.innings[selectedInnings].totalBalls % 6})
                </p>
              </div>

              {/* Bowling Team */}
              <div className="bg-linear-to-br from-green-900/40 to-green-800/30 rounded-lg sm:rounded-xl border border-green-500/50 p-3 sm:p-6">
                <p className="text-xs text-green-400 font-semibold mb-1 sm:mb-2 uppercase">
                  Bowling Team
                </p>
                <p className="text-xl sm:text-3xl font-black text-white mb-1">
                  {match.innings[selectedInnings].teamId === match.teamA.id
                    ? match.teamB.name
                    : match.teamA.name}
                </p>
                <p className="text-xs sm:text-sm text-green-300">
                  Limit: {match.oversLimit} overs
                </p>
              </div>
            </div>
            {/* Player Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {/* Striker */}
              <div className="bg-linear-to-br from-cyan-900/30 to-cyan-800/20 rounded-lg sm:rounded-xl border border-cyan-500/50 p-3 sm:p-6">
                <p className="text-xs text-cyan-400 font-semibold mb-2 sm:mb-3 uppercase">
                  Striker
                </p>
                <p className="text-lg sm:text-2xl font-bold text-white truncate">
                  {match.innings[selectedInnings].openingBatsmanId
                    ? match.innings[selectedInnings].teamId === match.teamA.id
                      ? match.teamA.players?.find(
                          (p) =>
                            p.id ===
                            match.innings[selectedInnings].openingBatsmanId,
                        )?.name || "Player"
                      : match.teamB.players?.find(
                          (p) =>
                            p.id ===
                            match.innings[selectedInnings].openingBatsmanId,
                        )?.name || "Player"
                    : "TBD"}
                </p>
              </div>

              {/* Non-Striker */}
              <div className="bg-linear-to-br from-blue-900/30 to-blue-800/20 rounded-lg sm:rounded-xl border border-blue-500/50 p-3 sm:p-6">
                <p className="text-xs text-blue-400 font-semibold mb-2 sm:mb-3 uppercase">
                  Non-Striker
                </p>
                <p className="text-lg sm:text-2xl font-bold text-white truncate">
                  {match.innings[selectedInnings].nonStrikerBatsmanId
                    ? match.innings[selectedInnings].teamId === match.teamA.id
                      ? match.teamA.players?.find(
                          (p) =>
                            p.id ===
                            match.innings[selectedInnings].nonStrikerBatsmanId,
                        )?.name || "Player"
                      : match.teamB.players?.find(
                          (p) =>
                            p.id ===
                            match.innings[selectedInnings].nonStrikerBatsmanId,
                        )?.name || "Player"
                    : "TBD"}
                </p>
              </div>

              {/* Bowler */}
              <div className="bg-linear-to-br from-red-900/30 to-red-800/20 rounded-lg sm:rounded-xl border border-red-500/50 p-3 sm:p-6">
                <p className="text-xs text-red-400 font-semibold mb-2 sm:mb-3 uppercase">
                  Bowler
                </p>
                <p className="text-lg sm:text-2xl font-bold text-white truncate">
                  {match.innings[selectedInnings].openingBowlerId
                    ? match.innings[selectedInnings].teamId === match.teamA.id
                      ? match.teamB.players?.find(
                          (p) =>
                            p.id ===
                            match.innings[selectedInnings].openingBowlerId,
                        )?.name || "Player"
                      : match.teamA.players?.find(
                          (p) =>
                            p.id ===
                            match.innings[selectedInnings].openingBowlerId,
                        )?.name || "Player"
                    : "TBD"}
                </p>
              </div>
            </div>
            {/* Player Statistics */}
            <div className="space-y-4 sm:space-y-8">
              {/* Batsmen Stats */}
              <div className="bg-linear-to-br from-cyan-900/20 to-blue-900/20 rounded-lg sm:rounded-xl border border-cyan-500/30 p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-cyan-300 mb-3 sm:mb-4">
                  Batting Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-400 font-semibold">
                          Player
                        </th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-400 font-semibold">
                          Runs
                        </th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-400 font-semibold">
                          Balls
                        </th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-400 font-semibold">
                          4s
                        </th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-400 font-semibold">
                          6s
                        </th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-400 font-semibold">
                          SR
                        </th>
                        <th className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-400 font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const battingTeamId =
                          match.innings[selectedInnings].teamId;
                        const battingTeam =
                          battingTeamId === match.teamA.id
                            ? match.teamA
                            : match.teamB;
                        const innings = match.innings[selectedInnings];

                        // Compute player stats
                        const playerStats: {
                          [key: string]: {
                            runs: number;
                            balls: number;
                            fours: number;
                            sixes: number;
                            isOut: boolean;
                          };
                        } = {};

                        if (innings.balls && innings.balls.length > 0) {
                          innings.balls.forEach((ball: any) => {
                            const strikerId = ball.strikerPlayerId;
                            if (!playerStats[strikerId]) {
                              playerStats[strikerId] = {
                                runs: 0,
                                balls: 0,
                                fours: 0,
                                sixes: 0,
                                isOut: false,
                              };
                            }
                            playerStats[strikerId].runs += ball.runs || 0;
                            playerStats[strikerId].balls += 1;
                            if (ball.runs === 4)
                              playerStats[strikerId].fours += 1;
                            if (ball.runs === 6)
                              playerStats[strikerId].sixes += 1;
                          });
                        }

                        if (innings.wickets && innings.wickets.length > 0) {
                          innings.wickets.forEach((wicket: any) => {
                            if (playerStats[wicket.playerOutId]) {
                              playerStats[wicket.playerOutId].isOut = true;
                            }
                          });
                        }

                        return battingTeam.players?.map((player) => {
                          const stats = playerStats[player.id] || {
                            runs: 0,
                            balls: 0,
                            fours: 0,
                            sixes: 0,
                            isOut: false,
                          };
                          const strikeRate =
                            stats.balls > 0
                              ? ((stats.runs / stats.balls) * 100).toFixed(2)
                              : "0.00";

                          return (
                            <tr
                              key={player.id}
                              className="border-b border-slate-800 hover:bg-slate-800/30"
                            >
                              <td className="py-2 sm:py-3 px-2 sm:px-4 text-white font-medium text-xs sm:text-sm truncate">
                                {player.name}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-1 sm:px-4 text-cyan-300 font-bold text-sm sm:text-lg">
                                {stats.runs}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-300 text-xs sm:text-sm">
                                {stats.balls}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-1 sm:px-4 text-slate-300 text-xs sm:text-sm">
                                {stats.fours}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-1 sm:px-4 text-yellow-300 font-semibold text-xs sm:text-sm">
                                {stats.sixes}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-1 sm:px-4 text-orange-300 font-semibold text-xs sm:text-sm">
                                {strikeRate}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-1 sm:px-4">
                                {stats.isOut ? (
                                  <span className="text-red-400 font-semibold text-xs">
                                    OUT
                                  </span>
                                ) : stats.balls > 0 ? (
                                  <span className="text-green-400 font-semibold text-xs">
                                    Not Out
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowlers Stats */}
              <div className="bg-linear-to-br from-emerald-900/20 to-teal-900/20 rounded-lg sm:rounded-xl border border-emerald-500/30 p-3 sm:p-6">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-300 mb-3 sm:mb-4">
                  Bowling Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-slate-400 font-semibold">
                          Player
                        </th>
                        <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-slate-400 font-semibold">
                          Overs
                        </th>
                        <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-slate-400 font-semibold">
                          Runs
                        </th>
                        <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-slate-400 font-semibold">
                          Wickets
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const battingTeamId =
                          match.innings[selectedInnings].teamId;
                        const bowlingTeamId =
                          battingTeamId === match.teamA.id
                            ? match.teamB.id
                            : match.teamA.id;
                        const bowlingTeam =
                          bowlingTeamId === match.teamA.id
                            ? match.teamA
                            : match.teamB;
                        const innings = match.innings[selectedInnings];

                        // Compute bowler stats
                        const bowlerStats: {
                          [key: string]: {
                            runs: number;
                            balls: number;
                            wickets: number;
                            maidens: number;
                            overs: Set<number>;
                          };
                        } = {};

                        if (innings.balls && innings.balls.length > 0) {
                          innings.balls.forEach((ball: any) => {
                            const bowlerId = ball.bowlerId;
                            if (!bowlerStats[bowlerId]) {
                              bowlerStats[bowlerId] = {
                                runs: 0,
                                balls: 0,
                                wickets: 0,
                                maidens: 0,
                                overs: new Set(),
                              };
                            }
                            bowlerStats[bowlerId].runs += ball.runs || 0;
                            bowlerStats[bowlerId].balls += 1;
                            bowlerStats[bowlerId].overs.add(
                              ball.overNumber || 0,
                            );
                          });

                          // Mark maidens (overs with 0 runs)
                          Object.keys(bowlerStats).forEach((bowlerId) => {
                            const bowlerBalls = (innings.balls || []).filter(
                              (b: any) => b.bowlerId === bowlerId,
                            );
                            let currentOver = -1;
                            let currentOverRuns = 0;

                            bowlerBalls.forEach((ball: any) => {
                              if (ball.overNumber !== currentOver) {
                                if (currentOver >= 0 && currentOverRuns === 0) {
                                  bowlerStats[bowlerId].maidens += 1;
                                }
                                currentOver = ball.overNumber;
                                currentOverRuns = 0;
                              }
                              currentOverRuns += ball.runs || 0;
                            });

                            if (currentOverRuns === 0 && currentOver >= 0) {
                              bowlerStats[bowlerId].maidens += 1;
                            }
                          });
                        }

                        if (innings.wickets && innings.wickets.length > 0) {
                          innings.wickets.forEach((wicket: any) => {
                            if (bowlerStats[wicket.bowlerId]) {
                              bowlerStats[wicket.bowlerId].wickets += 1;
                            }
                          });
                        }

                        return bowlingTeam.players?.map((player) => {
                          const stats = bowlerStats[player.id] || {
                            runs: 0,
                            balls: 0,
                            wickets: 0,
                            maidens: 0,
                            overs: new Set(),
                          };

                          // Calculate overs properly (overs.balls format)
                          const totalBallsBowled = stats.balls;
                          const completedOvers = Math.floor(
                            totalBallsBowled / 6,
                          );
                          const remainingBalls = totalBallsBowled % 6;
                          const oversDisplay =
                            totalBallsBowled > 0
                              ? `${completedOvers}.${remainingBalls}`
                              : "-";

                          const economy =
                            stats.balls > 0
                              ? ((stats.runs / (stats.balls / 6)) * 1).toFixed(
                                  2,
                                )
                              : "0.00";

                          return (
                            <tr
                              key={player.id}
                              className="border-b border-slate-800 hover:bg-slate-800/30"
                            >
                              <td className="py-2 sm:py-3 px-2 sm:px-4 text-white font-medium text-xs sm:text-sm truncate">
                                {player.name}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-slate-300 text-xs sm:text-sm">
                                {oversDisplay}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-red-300 font-bold text-sm sm:text-lg">
                                {stats.runs}
                              </td>
                              <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-green-300 font-bold text-sm sm:text-lg">
                                {stats.wickets}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Match Status */}
            {match.innings.length >= 2 && (
              <div className="bg-linear-to-r from-green-900/30 to-emerald-900/30 rounded-lg sm:rounded-xl border border-green-500/50 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-green-300 mb-3 sm:mb-4">
                  Match Result
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {match.innings[0].totalRuns}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                      {match.teamA.name}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {match.innings[1]?.totalRuns || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                      {match.teamB.name}
                    </p>
                  </div>
                </div>
                <p className="text-center text-green-300 mt-3 sm:mt-4 font-semibold text-sm sm:text-base">
                  {match.innings[0].totalRuns >
                  (match.innings[1]?.totalRuns || 0)
                    ? `${match.teamA.name} Won!`
                    : `${match.teamB.name} Won!`}
                </p>
              </div>
            )}
            {/* Fireworks Animation */}
            {fireworks.map((firework) => (
              <div
                key={firework.id}
                className="fixed pointer-events-none"
                style={{
                  left: `${firework.x}%`,
                  top: `${firework.y}%`,
                }}
              >
                <style>{`
                  @keyframes burst {
                    0% {
                      opacity: 1;
                      transform: translate(0, 0) scale(1);
                    }
                    100% {
                      opacity: 0;
                      transform: translate(${Math.cos(Math.random() * Math.PI * 2) * 100}px, ${Math.sin(Math.random() * Math.PI * 2) * 100}px) scale(0);
                    }
                  }
                  .firework-particle {
                    animation: burst 1.5s ease-out forwards;
                  }
                `}</style>
                <div className="text-3xl animate-bounce">
                  <span className="inline-block firework-particle">🔥</span>
                  <span className="inline-block firework-particle ml-2">
                    ✨
                  </span>
                  <span className="inline-block firework-particle ml-2">
                    🎆
                  </span>
                </div>
              </div>
            ))}{" "}
          </div>
        )}

        {/* Auto Refresh Indicator */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-xs text-slate-500">
            Updates automatically every 3 seconds
          </p>
        </div>
      </main>
    </div>
  );
}
