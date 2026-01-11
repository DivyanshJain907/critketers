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

interface AnimatedBall {
  ballNumber: number;
  runs: number;
}

interface Over {
  id: string;
  overNumber: number;
  legalBalls: number;
  illegalBalls: number;
  runs: number;
}

interface Extra {
  id: string;
  extraType: string;
  runs: number;
  overId?: string;
}

interface Wicket {
  id: string;
  ballId: string;
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
  overs: Over[];
  balls: Ball[];
  extras?: Extra[];
  wickets?: Wicket[];
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
  const [currentRuns, setCurrentRuns] = useState(0);
  const [ballAnimations, setBallAnimations] = useState<AnimatedBall[]>([]);
  const [lastBallTime, setLastBallTime] = useState(0);
  const [showWicketForm, setShowWicketForm] = useState(false);
  const [wicketForm, setWicketForm] = useState({
    playerOutId: '',
    wicketType: 'BOWLED',
    fielderId: '',
  });

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setError('');
      const response = await fetch(`/api/matches/${matchId}`);
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
      const response = await fetch(`/api/matches/${matchId}/innings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setCurrentRuns(0);
        setSelectedInnings(match.innings.length);
      }
    } catch (error) {
      console.error('Error starting innings:', error);
      setError('Failed to start innings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRuns = (runs: number) => {
    setCurrentRuns((prev) => Math.max(0, prev + runs));
  };

  const handleCompleteBall = async () => {
    if (!match || !match.innings[selectedInnings]) return;
    if (!strikerPlayerId || !bowlerId) {
      setError('Select striker and bowler first');
      return;
    }
    
    // Prevent duplicate clicks within 1 second
    const now = Date.now();
    if (now - lastBallTime < 1000) {
      setError('Wait a moment before completing another ball');
      return;
    }
    setLastBallTime(now);

    setIsSaving(true);
    const innings = match.innings[selectedInnings];
    const overNumber = Math.floor(innings.totalBalls / 6);
    
    // Get non-striker (any other player from batting team)
    const nonStrikerId = match.teamA.players.find(p => p.id !== strikerPlayerId)?.id || '';

    try {
      const payload = {
        overNumber,
        strikerPlayerId,
        nonStrikerPlayerId: nonStrikerId,
        bowlerId,
        runs: currentRuns,
        ballType: 'LEGAL',
      };
      
      const response = await fetch(
        `/api/matches/${matchId}/innings/${innings.id}/balls`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        
        // Add to ball animations
        const newAnimatedBall: AnimatedBall = {
          ballNumber: data.ballNumber,
          runs: currentRuns,
        };
        setBallAnimations((prev) => [newAnimatedBall, ...prev.slice(0, 9)]);
        
        // Refetch the entire match data to ensure all overs and balls are properly synced
        // This ensures smooth over transitions and accurate ball grouping
        setTimeout(() => {
          fetchMatch();
        }, 300);
        
        setCurrentRuns(0);
      } else {
        console.error('Ball recording error:', data);
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
    
    // Calculate the current over number based on balls already in innings
    const currentBallCount = innings.totalBalls || 0;
    const currentOverNumber = Math.floor(currentBallCount / 6);

    try {
      // Find or determine the overId for this over
      let overId = null;
      if (innings.overs && innings.overs.length > 0) {
        const over = innings.overs.find((o: any) => o.overNumber === currentOverNumber);
        if (over) {
          overId = over.id;
        }
      }

      const response = await fetch(
        `/api/matches/${matchId}/innings/${innings.id}/extras`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extraType,
            bowlerId,
            runs: 0,
            overId,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        // Refetch to get the updated data with extras
        setTimeout(() => {
          fetchMatch();
        }, 300);
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

  const handleRecordWicket = async () => {
    if (!match || !match.innings[selectedInnings]) return;
    if (!bowlerId) {
      setError('Select bowler first');
      return;
    }
    if (!wicketForm.playerOutId) {
      setError('Select player out');
      return;
    }

    setIsSaving(true);
    const innings = match.innings[selectedInnings];
    
    // Get the last ball recorded in this innings
    let lastBall = innings.balls && innings.balls.length > 0 
      ? innings.balls[innings.balls.length - 1]
      : null;

    // If no ball exists, create one automatically (wicket counts as a ball)
    if (!lastBall) {
      if (!strikerPlayerId) {
        setError('Select striker first');
        setIsSaving(false);
        return;
      }

      try {
        const overNumber = Math.floor(innings.totalBalls / 6);
        const nonStrikerId = match.teamA.players.find(p => p.id !== strikerPlayerId)?.id || '';

        // Create a ball for the wicket
        const ballPayload = {
          overNumber,
          strikerPlayerId,
          nonStrikerPlayerId: nonStrikerId,
          bowlerId,
          runs: 0,
          ballType: 'LEGAL',
        };
        
        const ballResponse = await fetch(
          `/api/matches/${matchId}/innings/${innings.id}/balls`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ballPayload),
          }
        );

        const ballData = await ballResponse.json();
        if (!ballResponse.ok) {
          setError(ballData.error || 'Failed to create ball for wicket');
          setIsSaving(false);
          return;
        }

        lastBall = ballData;
      } catch (error) {
        setError('Error creating ball: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setIsSaving(false);
        return;
      }
    }

    try {
      if (!lastBall) {
        setError('Failed to create or retrieve ball');
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        `/api/matches/${matchId}/innings/${innings.id}/wickets`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ballId: lastBall.id,
            playerOutId: wicketForm.playerOutId,
            bowlerId,
            fielderId: wicketForm.fielderId || null,
            wicketType: wicketForm.wicketType,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        setShowWicketForm(false);
        setWicketForm({ playerOutId: '', wicketType: 'BOWLED', fielderId: '' });
        
        // Refetch to get the updated data with longer delay to ensure DB updates are complete
        setTimeout(() => {
          fetchMatch();
        }, 500);
      } else {
        setError(data.error || 'Failed to record wicket');
      }
    } catch (error) {
      console.error('Error recording wicket:', error);
      setError('Error recording wicket: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Premium Dark Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl border-b border-blue-500">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link href="/matches" className="text-blue-100 hover:text-white mb-3 inline-block text-sm font-medium transition">
            ← Back to Matches
          </Link>
          <h1 className="text-3xl font-bold">
            🏏 {match?.teamA?.name || 'Team A'} vs {match?.teamB?.name || 'Team B'}
          </h1>
          <p className="text-blue-100 mt-1">Live Match Scoring</p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-900/30 text-red-200 p-3 rounded-lg mb-4 border border-red-700/50 text-sm">
            ⚠️ {error}
          </div>
        )}

        {!match ? (
          <div className="text-center text-gray-400">Match not found</div>
        ) : match.innings.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl p-8 text-center border border-slate-700">
            <h2 className="text-3xl font-bold text-white mb-2">🎯 Start Innings</h2>
            <p className="text-gray-400 mb-6 text-sm">Select which team will bat first</p>
            <div className="space-y-3">
              <button
                onClick={() => startInnings(match.teamA.id)}
                disabled={isSaving}
                className="w-full py-4 px-6 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-bold text-base transition"
              >
                {isSaving ? '⏳ Starting...' : `▶ ${match.teamA.name} Innings`}
              </button>
              <button
                onClick={() => startInnings(match.teamB.id)}
                disabled={isSaving}
                className="w-full py-4 px-6 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-bold text-base transition"
              >
                {isSaving ? '⏳ Starting...' : `▶ ${match.teamB.name} Innings`}
              </button>
            </div>
          </div>
        ) : (
          <>
            {match.innings[selectedInnings] && (
              <>
                {/* BROADCAST-STYLE SCOREBOARD */}
                <div className="bg-gradient-to-r from-red-600 via-slate-900 to-slate-900 text-white rounded-lg shadow-2xl p-4 mb-6 border border-red-600/50 font-mono text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Runs & Balls */}
                    <div className="font-bold text-lg">
                      {match.innings[selectedInnings].totalRuns}D-{Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6}
                    </div>
                    
                    {/* Over Display */}
                    <div className="font-bold text-sm">
                      {Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6}
                    </div>

                    {/* Status Indicator */}
                    <div className="bg-green-500 text-slate-900 px-2 py-1 rounded font-bold text-xs">
                      LIVE
                    </div>
                  </div>
                </div>

                {/* Player Selection */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    value={strikerPlayerId}
                    onChange={(e) => setStrikerPlayerId(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">⚾ Striker</option>
                    {match.teamA.players.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={bowlerId}
                    onChange={(e) => setBowlerId(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-green-500 text-sm"
                  >
                    <option value="">🎯 Bowler</option>
                    {match.teamB.players.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Large Runs Display - Clickable to Complete Ball */}
                <button
                  onClick={handleCompleteBall}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl p-8 mb-4 text-center shadow-2xl transition transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <p className="text-xs font-semibold mb-2 opacity-90">TAP TO COMPLETE BALL</p>
                  <h3 className="text-7xl font-bold">{currentRuns}</h3>
                </button>

                {/* Scoring Buttons - Minimal */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[0, 1, 2].map((runs) => (
                    <button
                      key={runs}
                      onClick={() => handleAddRuns(runs)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-lg text-3xl transition"
                    >
                      {runs}
                    </button>
                  ))}
                </div>

                {/* Undo Button Only */}
                <div className="mb-4">
                  <button
                    onClick={() => handleAddRuns(-1)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition text-sm"
                  >
                    ➖ Undo
                  </button>
                </div>

                {/* Special Balls - Minimal */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => handleRecordExtra('WIDE')}
                    disabled={isSaving}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg text-xs transition"
                  >
                    Wide
                  </button>
                  <button
                    onClick={() => handleRecordExtra('NO_BALL')}
                    disabled={isSaving}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg text-xs transition"
                  >
                    No Ball
                  </button>
                  <button
                    onClick={() => handleRecordExtra('BYE')}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg text-xs transition"
                  >
                    Bye
                  </button>
                  <button
                    onClick={() => handleRecordExtra('LEG_BYE')}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg text-xs transition"
                  >
                    Leg Bye
                  </button>
                </div>

                {/* Wicket - Simple Button */}
                <button 
                  onClick={() => setShowWicketForm(true)}
                  disabled={isSaving || !bowlerId}
                  className="w-full bg-red-700 hover:bg-red-800 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg text-sm mb-4 transition"
                >
                  🎯 Wicket
                </button>

                {/* Wicket Form Modal */}
                {showWicketForm && match.innings[selectedInnings] && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-lg p-6 border border-red-600 max-w-md w-full">
                      <h3 className="text-white text-lg font-bold mb-4">Record Wicket</h3>
                      
                      {/* Player Out Selection */}
                      <div className="mb-4">
                        <label className="text-white text-sm font-bold mb-2 block">Player Out</label>
                        <select
                          value={wicketForm.playerOutId}
                          onChange={(e) => setWicketForm({ ...wicketForm, playerOutId: e.target.value })}
                          className="w-full bg-slate-800 text-white rounded p-2 border border-slate-700"
                        >
                          <option value="">Select player</option>
                          {match.innings[selectedInnings].teamId && match.teamA.id === match.innings[selectedInnings].teamId
                            ? match.teamA.players.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))
                            : match.teamB.players.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))
                          }
                        </select>
                      </div>

                      {/* Wicket Type Selection */}
                      <div className="mb-4">
                        <label className="text-white text-sm font-bold mb-2 block">Wicket Type</label>
                        <select
                          value={wicketForm.wicketType}
                          onChange={(e) => setWicketForm({ ...wicketForm, wicketType: e.target.value })}
                          className="w-full bg-slate-800 text-white rounded p-2 border border-slate-700"
                        >
                          <option value="BOWLED">Bowled</option>
                          <option value="LBW">LBW</option>
                          <option value="CAUGHT">Caught</option>
                          <option value="STUMPED">Stumped</option>
                          <option value="RUN_OUT">Run Out</option>
                          <option value="HIT_WICKET">Hit Wicket</option>
                          <option value="OBSTRUCTING_FIELD">Obstructing Field</option>
                        </select>
                      </div>

                      {/* Fielder Selection (for caught/run out) */}
                      {['CAUGHT', 'STUMPED', 'RUN_OUT'].includes(wicketForm.wicketType) && (
                        <div className="mb-4">
                          <label className="text-white text-sm font-bold mb-2 block">Fielder</label>
                          <select
                            value={wicketForm.fielderId}
                            onChange={(e) => setWicketForm({ ...wicketForm, fielderId: e.target.value })}
                            className="w-full bg-slate-800 text-white rounded p-2 border border-slate-700"
                          >
                            <option value="">Select fielder</option>
                            {match.teamA.id === bowlerId || match.teamA.players.some(p => p.id === bowlerId)
                              ? match.teamA.players.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))
                              : match.teamB.players.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))
                            }
                          </select>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleRecordWicket}
                          disabled={isSaving || !wicketForm.playerOutId}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-bold py-2 rounded transition"
                        >
                          Record Wicket
                        </button>
                        <button
                          onClick={() => {
                            setShowWicketForm(false);
                            setWicketForm({ playerOutId: '', wicketType: 'BOWLED', fielderId: '' });
                          }}
                          disabled={isSaving}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white font-bold py-2 rounded transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Balls - Over Wise Display */}
                {match.innings[selectedInnings].balls && match.innings[selectedInnings].balls.length > 0 && (
                  <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-700">
                    <p className="text-white text-xs font-bold mb-3">Last Balls (Over Wise)</p>
                    <div className="space-y-2">
                      {(() => {
                        // Group balls by over
                        const ballsByOver: Record<number, any[]> = {};
                        match.innings[selectedInnings].balls.forEach((ball: any, idx: number) => {
                          let overNum: number;
                          if (ball.over && typeof ball.over.overNumber === 'number') {
                            overNum = ball.over.overNumber;
                          } else if (typeof ball.overNumber === 'number') {
                            overNum = ball.overNumber;
                          } else {
                            overNum = Math.floor(idx / 6);
                          }
                          
                          if (!ballsByOver[overNum]) ballsByOver[overNum] = [];
                          ballsByOver[overNum].push({ ...ball, isExtra: false, isWicket: false });
                        });

                        // Add extras to their corresponding overs
                        (match.innings[selectedInnings].extras || []).forEach((extra: any) => {
                          let overNum = 0;
                          if (extra.overId && match.innings[selectedInnings].overs) {
                            const over = match.innings[selectedInnings].overs.find((o: any) => o.id === extra.overId);
                            if (over) overNum = over.overNumber;
                          }
                          if (!ballsByOver[overNum]) ballsByOver[overNum] = [];
                          ballsByOver[overNum].push({ ...extra, isExtra: true, isWicket: false });
                        });

                        // Add wickets to their corresponding overs (by finding the ball they're associated with)
                        (match.innings[selectedInnings].wickets || []).forEach((wicket: any) => {
                          const ball = match.innings[selectedInnings].balls.find((b: any) => b.id === wicket.ballId);
                          if (ball) {
                            let overNum: number;
                            if (typeof ball.overNumber === 'number') {
                              overNum = ball.overNumber;
                            } else {
                              overNum = Math.floor(match.innings[selectedInnings].balls.indexOf(ball) / 6);
                            }
                            if (!ballsByOver[overNum]) ballsByOver[overNum] = [];
                            ballsByOver[overNum].push({ ...wicket, isWicket: true, isExtra: false });
                          }
                        });

                        // Sort overs and render
                        return Object.keys(ballsByOver)
                          .map(Number)
                          .sort((a, b) => a - b)
                          .map((overNum) => (
                            <div key={overNum} className="bg-slate-800 rounded p-2">
                              <p className="text-cyan-400 text-xs font-bold mb-2">Over {overNum}</p>
                              <div className="flex gap-1 flex-wrap">
                                {ballsByOver[overNum].map((delivery: any, didx: number) => {
                                  let displayValue: string | number = delivery.runs || 0;
                                  let bgColor = "bg-blue-600";
                                  let tooltip = `Ball ${delivery.ballNumber || didx + 1}: ${delivery.runs || 0} runs`;
                                  
                                  if (delivery.isWicket) {
                                    displayValue = 'w';
                                    bgColor = "bg-red-700";
                                    tooltip = `Wicket - ${delivery.wicketType}`;
                                  } else if (delivery.isExtra) {
                                    if (delivery.extraType === 'WIDE') {
                                      displayValue = 'wd';
                                      bgColor = "bg-yellow-600";
                                      tooltip = 'Wide';
                                    } else if (delivery.extraType === 'NO_BALL') {
                                      displayValue = 'nb';
                                      bgColor = "bg-orange-600";
                                      tooltip = 'No Ball';
                                    } else if (delivery.extraType === 'BYE') {
                                      displayValue = 'b';
                                      bgColor = "bg-purple-600";
                                      tooltip = 'Bye';
                                    } else if (delivery.extraType === 'LEG_BYE') {
                                      displayValue = 'lb';
                                      bgColor = "bg-pink-600";
                                      tooltip = 'Leg Bye';
                                    }
                                  } else if (delivery.ballType) {
                                    if (delivery.ballType === 'WIDE') {
                                      displayValue = 'wd';
                                      bgColor = "bg-yellow-600";
                                      tooltip = 'Wide';
                                    } else if (delivery.ballType === 'NO_BALL') {
                                      displayValue = 'nb';
                                      bgColor = "bg-orange-600";
                                      tooltip = 'No Ball';
                                    } else if (delivery.ballType === 'BYE') {
                                      displayValue = 'b';
                                      bgColor = "bg-purple-600";
                                      tooltip = 'Bye';
                                    } else if (delivery.ballType === 'LEG_BYE') {
                                      displayValue = 'lb';
                                      bgColor = "bg-pink-600";
                                      tooltip = 'Leg Bye';
                                    }
                                  }
                                  
                                  return (
                                    <div
                                      key={didx}
                                      className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xs shadow-md hover:opacity-80 transition`}
                                      title={tooltip}
                                    >
                                      {displayValue}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        @keyframes ballBounce {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-30px);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
