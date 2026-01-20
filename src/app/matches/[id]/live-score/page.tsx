'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Player {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface Innings {
  id: string;
  inningsNumber: number;
  teamId: string;
  totalRuns: number;
  totalBalls: number;
  totalWickets: number;
  openingBatsmanId?: string;
  openingBowlerId?: string;
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
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/matches/${matchId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Match not found');
      const data = await response.json();
      setMatch(data);
    } catch (err) {
      console.error('Error fetching match:', err);
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
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const firstInnings = match.innings?.[0];
  const secondInnings = match.innings?.[1];
  const batingTeam = firstInnings?.teamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = firstInnings?.teamId === match.teamA.id ? match.teamB : match.teamA;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background */}
      <div>
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="30" y="30" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.5" fill="#06b6d4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
      </div>

      {/* Header */}
      <header className="z-10 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-3">
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              ← Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-green-400">LIVE</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white">
            🏏 {match.teamA.name} vs {match.teamB.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Match Status: {match.status}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Innings Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {match.innings?.map((inning, index) => (
            <button
              key={index}
              onClick={() => setSelectedInnings(index)}
              className={`pb-3 px-4 font-semibold transition-all ${
                selectedInnings === index
                  ? 'border-b-2 border-cyan-400 text-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {inning.inningsNumber}. {inning.teamId === match.teamA.id ? match.teamA.name : match.teamB.name}
            </button>
          ))}
        </div>

        {/* Score Display */}
        {match.innings[selectedInnings] && (
          <div className="space-y-8">
            {/* Teams Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batting Team */}
              <div className="bg-linear-to-br from-blue-900/40 to-blue-800/30 rounded-xl border border-blue-500/50 p-6">
                <p className="text-xs text-blue-400 font-semibold mb-2 uppercase">🏏 Batting Team</p>
                <p className="text-3xl font-black text-white mb-1">
                  {match.innings[selectedInnings].teamId === match.teamA.id ? match.teamA.name : match.teamB.name}
                </p>
                <p className="text-sm text-blue-300">
                  {match.innings[selectedInnings].totalRuns}/{match.innings[selectedInnings].totalWickets} ({Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6})
                </p>
              </div>

              {/* Bowling Team */}
              <div className="bg-linear-to-br from-green-900/40 to-green-800/30 rounded-xl border border-green-500/50 p-6">
                <p className="text-xs text-green-400 font-semibold mb-2 uppercase">🎯 Bowling Team</p>
                <p className="text-3xl font-black text-white mb-1">
                  {match.innings[selectedInnings].teamId === match.teamA.id ? match.teamB.name : match.teamA.name}
                </p>
                <p className="text-sm text-green-300">
                  Limit: {match.oversLimit} overs
                </p>
              </div>
            </div>

            {/* Player Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Striker */}
              <div className="bg-linear-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl border border-cyan-500/50 p-6">
                <p className="text-xs text-cyan-400 font-semibold mb-3 uppercase">🏏 Striker (Batter)</p>
                <p className="text-2xl font-bold text-white">
                  {match.innings[selectedInnings].openingBatsmanId
                    ? match.innings[selectedInnings].teamId === match.teamA.id
                      ? match.teamA.players?.find(p => p.id === match.innings[selectedInnings].openingBatsmanId)?.name || 'Player'
                      : match.teamB.players?.find(p => p.id === match.innings[selectedInnings].openingBatsmanId)?.name || 'Player'
                    : 'TBD'
                  }
                </p>
              </div>

              {/* Bowler */}
              <div className="bg-linear-to-br from-red-900/30 to-red-800/20 rounded-xl border border-red-500/50 p-6">
                <p className="text-xs text-red-400 font-semibold mb-3 uppercase">🎯 Bowler</p>
                <p className="text-2xl font-bold text-white">
                  {match.innings[selectedInnings].openingBowlerId
                    ? match.innings[selectedInnings].teamId === match.teamA.id
                      ? match.teamB.players?.find(p => p.id === match.innings[selectedInnings].openingBowlerId)?.name || 'Player'
                      : match.teamA.players?.find(p => p.id === match.innings[selectedInnings].openingBowlerId)?.name || 'Player'
                    : 'TBD'
                  }
                </p>
              </div>
            </div>

            {/* Main Score Card */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-xl border border-cyan-500/30 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Runs */}
                <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">Total Runs</p>
                  <p className="text-5xl font-black text-cyan-400">
                    {match.innings[selectedInnings].totalRuns}
                  </p>
                </div>

                {/* Wickets */}
                <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">Wickets</p>
                  <p className="text-5xl font-black text-red-400">
                    {match.innings[selectedInnings].totalWickets}
                  </p>
                </div>

                {/* Overs */}
                <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">Overs</p>
                  <p className="text-5xl font-black text-blue-400">
                    {Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6}
                  </p>
                </div>
              </div>

              {/* Match Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">BATTING</p>
                  <p className="text-xl font-bold text-white">
                    {match.innings[selectedInnings].teamId === match.teamA.id ? match.teamA.name : match.teamB.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {match.innings[selectedInnings].totalRuns}/{match.innings[selectedInnings].totalWickets} ({Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6})
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">BOWLING</p>
                  <p className="text-xl font-bold text-white">
                    {match.innings[selectedInnings].teamId === match.teamA.id ? match.teamB.name : match.teamA.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Limit: {match.oversLimit} overs
                  </p>
                </div>
              </div>
            </div>

            {/* Match Status */}
            {match.innings.length >= 2 && (
              <div className="bg-linear-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-500/50 p-6">
                <h3 className="text-lg font-bold text-green-300 mb-3">Match Result</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{match.innings[0].totalRuns}</p>
                    <p className="text-sm text-slate-400">{match.teamA.name} Innings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{match.innings[1]?.totalRuns || 0}</p>
                    <p className="text-sm text-slate-400">{match.teamB.name} Innings</p>
                  </div>
                </div>
                <p className="text-center text-green-300 mt-4 font-semibold">
                  {match.innings[0].totalRuns > (match.innings[1]?.totalRuns || 0)
                    ? `🎉 ${match.teamA.name} Won!`
                    : `🎉 ${match.teamB.name} Won!`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auto Refresh Indicator */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            ⟳ Updates automatically every 3 seconds
          </p>
        </div>
      </main>
    </div>
  );
}
