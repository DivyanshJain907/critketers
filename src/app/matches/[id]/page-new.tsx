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

interface Ball {
  id: string;
  ballNumber: number;
  overNumber: number;
  runs: number;
  ballType: string;
}

interface Over {
  id: string;
  overNumber: number;
  legalBalls: number;
  illegalBalls: number;
  runs: number;
}

interface Innings {
  id: string;
  inningsNumber: number;
  teamId: string;
  totalRuns: number;
  totalBalls: number;
  overs: Over[];
  balls: Ball[];
}

interface Match {
  id: string;
  name: string;
  teamAId: string;
  teamBId: string;
  oversLimit: number;
  status: string;
  teamA: Team;
  teamB: Team;
  innings: Innings[];
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInnings, setSelectedInnings] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [strikerPlayerId, setStrikerPlayerId] = useState('');
  const [bowlerId, setBowlerId] = useState('');

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/matches/${matchId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Match not found');
      const data = await response.json();
      setMatch(data);
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const startInnings = async (teamId: string) => {
    if (!match) return;
    
    const team = match.teamA.id === teamId ? match.teamA : match.teamB;
    const inningsNumber = match.innings.length + 1;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/matches/${matchId}/innings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          teamId,
          inningsNumber,
          openingBatsmanId: team.players[0]?.id,
          openingBowlerId: team.players[1]?.id,
        }),
      });

      if (response.ok) {
        const newInnings = await response.json();
        setMatch({
          ...match,
          innings: [...match.innings, newInnings],
        });
        setStrikerPlayerId('');
        setBowlerId('');
        setSelectedInnings(match.innings.length);
      }
    } catch (error) {
      console.error('Error starting innings:', error);
      setError('Failed to start innings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordBall = async (runs: number) => {
    if (!match || !match.innings[selectedInnings]) return;
    if (!strikerPlayerId || !bowlerId) {
      setError('Select striker and bowler first');
      return;
    }

    setIsSaving(true);
    const innings = match.innings[selectedInnings];
    const ballNumber = ((innings.totalBalls % 6) + 1);
    const overNumber = Math.floor(innings.totalBalls / 6);

    try {
      const payload = {
        ballNumber,
        overNumber,
        strikerPlayerId,
        nonStrikerPlayerId: null,
        bowlerId,
        runs,
        ballType: 'LEGAL',
      };
      console.log('Sending ball data:', payload);
      
      const response = await fetch(
        `/api/matches/${matchId}/innings/${innings.id}/balls`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log('Response:', { status: response.status, data });
      
      if (response.ok) {
        setError('');
        const updatedInnings = {
          ...innings,
          totalRuns: innings.totalRuns + runs,
          totalBalls: innings.totalBalls + 1,
          balls: [...(innings.balls || []), data],
        };
        
        const updatedInningsList = [...match.innings];
        updatedInningsList[selectedInnings] = updatedInnings;
        
        setMatch({
          ...match,
          innings: updatedInningsList,
        });
      } else {
        setError(data.error || 'Failed to record ball');
      }
    } catch (error) {
      console.error('Error recording ball:', error);
      setError('Error recording ball: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordExtra = async (extraType: string) => {
    if (!match || !match.innings[selectedInnings]) return;
    if (!bowlerId) {
      setError('Select bowler first');
      return;
    }

    setIsSaving(true);
    const innings = match.innings[selectedInnings];

    try {
      const response = await fetch(
        `/api/matches/${matchId}/innings/${innings.id}/extras`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extraType,
            bowlerId,
            runs: extraType === 'WIDE' || extraType === 'NO_BALL' ? 1 : 0,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        const updatedInnings = {
          ...innings,
          totalRuns: innings.totalRuns + (extraType === 'WIDE' || extraType === 'NO_BALL' ? 1 : 0),
          totalBalls: innings.totalBalls + 1,
        };
        
        const updatedInningsList = [...match.innings];
        updatedInningsList[selectedInnings] = updatedInnings;
        
        setMatch({
          ...match,
          innings: updatedInningsList,
        });
      } else {
        setError(data.error || 'Failed to record extra');
      }
    } catch (error) {
      console.error('Error recording extra:', error);
      setError('Error recording extra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/matches" className="text-blue-100 hover:text-white text-sm mb-2 inline-block">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{match?.name || 'Match'}</h1>
          <p className="text-blue-100 text-sm">Status: {match?.status}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-800 dark:text-red-200 px-4 py-3 mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!match ? (
          <div className="text-center text-gray-600">Match not found</div>
        ) : match.innings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Start the Match</h2>
            <div className="space-y-3">
              <button
                onClick={() => startInnings(match.teamA.id)}
                disabled={isSaving}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-xl transition-colors"
              >
                {isSaving ? '⏳ Starting...' : `▶ Start ${match.teamA.name} Innings`}
              </button>
              <button
                onClick={() => startInnings(match.teamB.id)}
                disabled={isSaving}
                className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-xl transition-colors"
              >
                {isSaving ? '⏳ Starting...' : `▶ Start ${match.teamB.name} Innings`}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Innings Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
              {match.innings.map((inning, idx) => (
                <button
                  key={inning.id}
                  onClick={() => setSelectedInnings(idx)}
                  className={`px-4 py-3 font-semibold transition-colors ${
                    selectedInnings === idx
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Innings {inning.inningsNumber}
                </button>
              ))}
            </div>

            {/* Main Score Display */}
            {match.innings[selectedInnings] && (
              <>
                <div className="text-center mb-8">
                  <div className="text-7xl font-bold text-blue-600 dark:text-blue-400">
                    {match.innings[selectedInnings].totalRuns}
                  </div>
                  <div className="text-3xl text-gray-600 dark:text-gray-400 mt-2">
                    {Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6} ({match.innings[selectedInnings].totalBalls} balls)
                  </div>
                </div>

                {/* Player Selection Row */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase">Striker</label>
                    <select
                      value={strikerPlayerId}
                      onChange={(e) => setStrikerPlayerId(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Striker</option>
                      {match.teamA.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase">Bowler</label>
                    <select
                      value={bowlerId}
                      onChange={(e) => setBowlerId(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Bowler</option>
                      {match.teamB.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Run Buttons - Large and Prominent */}
                <div className="mb-8">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[0, 1, 2].map((run) => (
                      <button
                        key={run}
                        onClick={() => handleRecordBall(run)}
                        disabled={isSaving}
                        className="py-6 px-4 rounded-lg font-bold text-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-all active:scale-95"
                      >
                        {run}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 4, 6].map((run) => (
                      <button
                        key={run}
                        onClick={() => handleRecordBall(run)}
                        disabled={isSaving}
                        className="py-6 px-4 rounded-lg font-bold text-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-all active:scale-95"
                      >
                        {run}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions - Horizontal Row */}
                <div className="grid grid-cols-2 gap-2 mb-8">
                  <button
                    onClick={() => handleRecordExtra('WIDE')}
                    disabled={isSaving}
                    className="py-3 px-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                  >
                    🔴 Wide
                  </button>
                  <button
                    onClick={() => handleRecordExtra('NO_BALL')}
                    disabled={isSaving}
                    className="py-3 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                  >
                    🟠 No Ball
                  </button>
                  <button
                    onClick={() => handleRecordExtra('BYE')}
                    disabled={isSaving}
                    className="py-3 px-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                  >
                    🟣 Bye
                  </button>
                  <button
                    onClick={() => handleRecordExtra('LEG_BYE')}
                    disabled={isSaving}
                    className="py-3 px-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                  >
                    🟡 Leg Bye
                  </button>
                </div>

                {/* Wicket Button - Full Width */}
                <button className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg mb-8 transition-colors">
                  🚪 Wicket
                </button>

                {/* Ball History - Compact */}
                {match.innings[selectedInnings].balls && match.innings[selectedInnings].balls.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">Recent Deliveries</h3>
                    <div className="space-y-2">
                      {[...match.innings[selectedInnings].balls].reverse().slice(0, 10).map((ball) => (
                        <div
                          key={ball.id}
                          className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            Over {ball.overNumber}.{ball.ballNumber}
                          </span>
                          <span className="text-lg font-bold text-blue-600">{ball.runs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
