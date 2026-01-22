'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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
  strikerPlayerId?: string;
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
  const router = useRouter();
  const matchId = params?.id as string;
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [selectedInnings, setSelectedInnings] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [strikerPlayerId, setStrikerPlayerId] = useState('');
  const [nonStrikerPlayerId, setNonStrikerPlayerId] = useState('');
  const [bowlerId, setBowlerId] = useState('');
  const [currentRuns, setCurrentRuns] = useState(0);
  const [ballAnimations, setBallAnimations] = useState<AnimatedBall[]>([]);
  const [lastBallTime, setLastBallTime] = useState(0);
  const [showWicketForm, setShowWicketForm] = useState(false);
  const [showBowlerChangeForm, setShowBowlerChangeForm] = useState(false);
  const [wicketForm, setWicketForm] = useState({
    playerOutId: '',
    wicketType: 'BOWLED',
    fielderId: '',
  });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'UMPIRE') {
      router.push('/login?redirect=' + window.location.pathname);
      return;
    }
    
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (matchId && authorized) {
      fetchMatch();
    }
  }, [matchId, authorized]);

  const fetchMatch = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have access to this match');
          return;
        }
        throw new Error('Match not found');
      }
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
          fetchMatch().then(() => {
            // After fetching, check if we need to swap striker/non-striker
            const newBalls = match.innings[selectedInnings].totalBalls + 1;
            const newOverNumber = Math.floor(newBalls / 6);
            const previousOverNumber = Math.floor(innings.totalBalls / 6);
            
            // Check if this was the last ball of the over (6th ball)
            const ballsInCurrentOver = innings.totalBalls % 6;
            const isLastBallOfOver = ballsInCurrentOver === 5; // 6th ball is index 5
            
            // Determine if over completed
            const overCompleted = newOverNumber > previousOverNumber;
            
            // During an over: If 1 run taken AND NOT on the last ball, they swap
            if (currentRuns === 1 && !isLastBallOfOver) {
              setStrikerPlayerId(nonStrikerPlayerId);
              setNonStrikerPlayerId(strikerPlayerId);
            }
            
            // At end of over: Swap UNLESS the last ball had 1 run
            if (overCompleted && !(currentRuns === 1)) {
              setStrikerPlayerId(nonStrikerPlayerId);
              setNonStrikerPlayerId(strikerPlayerId);
            }
            
            // Show bowler change popup when over completes
            if (overCompleted) {
              setShowBowlerChangeForm(true);
            }
          });
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
    if (!strikerPlayerId) {
      setError('Select striker first');
      return;
    }
    if (!bowlerId) {
      setError('Select bowler first');
      return;
    }
    if (!wicketForm.wicketType) {
      setError('Select wicket type');
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
            playerOutId: strikerPlayerId,
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
        setStrikerPlayerId(''); // Clear striker since they're now out
        
        // Refetch to get the updated data with longer delay to ensure DB updates are complete
        setTimeout(async () => {
          await fetchMatch();
          // Check if all batsmen are out after data is fetched
          await checkAndStartNextInningsIfAllOut();
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

  const isInningsComplete = (inn: Innings, battingTeam: Team) => {
    const allOut = (inn.wickets || []).length >= battingTeam.players.length - 1;
    const oversDone = inn.totalBalls >= (match?.oversLimit ?? 0) * 6;
    return allOut || oversDone;
  };

  const computeResult = () => {
    if (!match || match.innings.length < 2) return null;

    const teamAScore = match.innings
      .filter((inn) => inn.teamId === match.teamA.id)
      .reduce((sum, inn) => sum + (inn.totalRuns || 0), 0);
    const teamBScore = match.innings
      .filter((inn) => inn.teamId === match.teamB.id)
      .reduce((sum, inn) => sum + (inn.totalRuns || 0), 0);

    if (teamAScore === teamBScore) {
      return { text: 'Match Tied', winner: null, margin: 0 };
    }

    if (teamAScore > teamBScore) {
      return {
        text: `${match.teamA.name} won by ${teamAScore - teamBScore} runs`,
        winner: match.teamA.name,
        margin: teamAScore - teamBScore,
      };
    }

    return {
      text: `${match.teamB.name} won by ${teamBScore - teamAScore} runs`,
      winner: match.teamB.name,
      margin: teamBScore - teamAScore,
    };
  };

  const getPlayerName = (playerId: string) => {
    if (!match) return playerId;
    const pA = match.teamA.players.find((p) => p.id === playerId);
    if (pA) return pA.name;
    const pB = match.teamB.players.find((p) => p.id === playerId);
    return pB ? pB.name : playerId;
  };

  const computeBattingStats = () => {
    if (!match) return [] as { playerId: string; runs: number }[];
    const totals: Record<string, number> = {};
    match.innings.forEach((inn) => {
      (inn.balls || []).forEach((b) => {
        // Only legal balls count toward batter runs (runs already include off-bat)
        if (!b.strikerPlayerId) return;
        totals[b.strikerPlayerId] = (totals[b.strikerPlayerId] || 0) + (b.runs || 0);
      });
    });
    return Object.entries(totals)
      .map(([playerId, runs]) => ({ playerId, runs }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);
  };

  const computeBowlingStats = () => {
    if (!match) return [] as { playerId: string; wickets: number }[];
    const totals: Record<string, number> = {};
    match.innings.forEach((inn) => {
      (inn.wickets || []).forEach((w) => {
        totals[w.bowlerId] = (totals[w.bowlerId] || 0) + 1;
      });
    });
    return Object.entries(totals)
      .map(([playerId, wickets]) => ({ playerId, wickets }))
      .sort((a, b) => b.wickets - a.wickets)
      .slice(0, 5);
  };

  const checkAndStartNextInningsIfAllOut = async () => {
    // Fetch the latest match data to check current state
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/matches/${matchId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const updatedMatch = await response.json();
      
      if (!updatedMatch || !updatedMatch.innings[selectedInnings]) return;

      const currentInnings = updatedMatch.innings[selectedInnings];
      const batingTeam = updatedMatch.teamA.id === currentInnings.teamId ? updatedMatch.teamA : updatedMatch.teamB;
      const fieldingTeam = updatedMatch.teamA.id === currentInnings.teamId ? updatedMatch.teamB : updatedMatch.teamA;
      
      // Get all out players
      const outPlayers = (currentInnings.wickets || []).map((w: any) => w.playerOutId);
      
      // Check if all batsmen are out (all players minus 1 are out - at least 1 must bat)
      const allOut = outPlayers.length >= batingTeam.players.length - 1;
      
      console.log(`Checking all-out: Out=${outPlayers.length}, Total=${batingTeam.players.length}, AllOut=${allOut}, Innings=${updatedMatch.innings.length}`);
      
      if (allOut && updatedMatch.innings.length < 2) {
        // All out and no second innings yet - start the other team's innings
        console.log('All batsmen out! Starting next innings for', fieldingTeam.name);
        
        // Pick default opener/bowler (next batting team opener, previous batting team bowler)
        const openingBatsmanId = fieldingTeam.players[0]?.id || '';
        const openingBowlerId = batingTeam.players[0]?.id || '';

        if (!openingBatsmanId || !openingBowlerId) {
          console.error('Cannot auto-start innings: missing opener or bowler');
          return;
        }

        // Start the innings
        const inningsResponse = await fetch(`/api/matches/${matchId}/innings`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            teamId: fieldingTeam.id,
            inningsNumber: 2,
            openingBatsmanId,
            openingBowlerId,
          }),
        });

        if (inningsResponse.ok) {
          console.log('Successfully started innings for', fieldingTeam.name);
          
          // Refetch match data after starting innings
          const freshResponse = await fetch(`/api/matches/${matchId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const freshMatch = await freshResponse.json();
          
          // Update match state and switch to the new innings
          setMatch(freshMatch);
          // Switch to the newly created innings (last in list)
          setSelectedInnings(Math.max(0, (freshMatch.innings?.length || 1) - 1));
          setStrikerPlayerId('');
          setBowlerId('');
          setCurrentRuns(0);
        } else {
          const error = await inningsResponse.json();
          console.error('Failed to start innings:', error);
        }
      }
    } catch (error) {
      console.error('Error checking all-out status:', error);
    }
  };

  const matchComplete = (() => {
    if (!match || match.innings.length < 2) return false;
    const secondInnings = match.innings[1];
    const battingTeam = match.teamA.id === secondInnings.teamId ? match.teamA : match.teamB;
    return isInningsComplete(secondInnings, battingTeam);
  })();

  useEffect(() => {
    if (!matchComplete || !match || match.status === 'COMPLETED') return;

    const markComplete = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/matches/${matchId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: 'COMPLETED' }),
        });

        if (res.ok) {
          const updated = await res.json();
          setMatch((prev) => (prev ? { ...prev, status: updated.status } : updated));
        }
      } catch (error) {
        console.error('Failed to mark match as complete:', error);
      }
    };

    markComplete();
  }, [matchComplete, matchId, match?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-linear-to-r from-blue-600 via-cyan-500 to-teal-500 text-white shadow-2xl px-3 py-3 sm:px-4 sm:py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/matches" className="hover:opacity-80 transition text-sm md:text-base font-semibold">← Back</Link>
          <h1 className="text-sm md:text-lg font-bold truncate text-center flex-1 mx-2">🏏 {match?.teamA?.name} vs {match?.teamB?.name}</h1>
          <div className="w-12 md:w-16"></div>
        </div>
      </nav>

      <main className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 max-w-3xl mx-auto">
        {error && (
          <div className="bg-red-900/30 text-red-200 p-3 sm:p-4 rounded-lg mb-4 border border-red-700/50 text-xs sm:text-sm">
            ⚠️ {error}
          </div>
        )}

        {!match ? (
          <div className="text-center text-gray-400 py-12">⏳ Loading match data...</div>
        ) : matchComplete ? (
          <div className="relative overflow-hidden bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-cyan-400/20">
            {/* Firecracker/confetti layers */}
            <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70 animate-pulse" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 25%), radial-gradient(circle at 80% 30%, rgba(255,0,128,0.15), transparent 30%), radial-gradient(circle at 40% 70%, rgba(0,200,255,0.15), transparent 25%), radial-gradient(circle at 70% 80%, rgba(255,200,0,0.15), transparent 20%)' }} />
            <div className="absolute inset-0 pointer-events-none animate-[spin_22s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, rgba(255,0,128,0.12), rgba(0,200,255,0.12), rgba(0,255,128,0.12), rgba(255,200,0,0.12), rgba(255,0,128,0.12))' }} />
            <div className="relative z-10">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-green-500 text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg">
                  🏁 Match Complete
                </div>
              </div>

              {(() => {
                const result = computeResult();
                if (!result) return null;
                const teamAScore = match.innings.filter(i => i.teamId === match.teamA.id).reduce((s, i) => s + (i.totalRuns || 0), 0);
                const teamBScore = match.innings.filter(i => i.teamId === match.teamB.id).reduce((s, i) => s + (i.totalRuns || 0), 0);
                const topBatters = computeBattingStats();
                const topBowlers = computeBowlingStats();

                return (
                  <div className="space-y-6">
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 shadow-inner">
                      <p className="text-green-300 font-bold text-lg mb-1">{result.text}</p>
                      <p className="text-slate-200 text-sm">Manhattan finish! 🚀</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-white">
                      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 shadow">
                        <p className="font-bold flex items-center gap-2">{match.teamA.name}</p>
                        <p className="text-cyan-300 text-2xl font-extrabold">{teamAScore}</p>
                        <p className="text-xs text-slate-300">Runs</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 shadow">
                        <p className="font-bold flex items-center gap-2">{match.teamB.name}</p>
                        <p className="text-cyan-300 text-2xl font-extrabold">{teamBScore}</p>
                        <p className="text-xs text-slate-300">Runs</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700 shadow">
                        <p className="text-white font-bold mb-2">Top Batters</p>
                        <div className="space-y-2 text-sm">
                          {topBatters.map((p, idx) => (
                            <div key={p.playerId} className="flex items-center justify-between bg-slate-900/60 rounded px-3 py-2">
                              <div className="flex items-center gap-2 text-slate-100">
                                <span className="text-cyan-300 font-bold">#{idx + 1}</span>
                                <span>{getPlayerName(p.playerId)}</span>
                              </div>
                              <span className="text-cyan-200 font-bold">{p.runs} runs</span>
                            </div>
                          ))}
                          {topBatters.length === 0 && <p className="text-slate-400 text-xs">No batting data</p>}
                        </div>
                      </div>
                      <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700 shadow">
                        <p className="text-white font-bold mb-2">Top Bowlers</p>
                        <div className="space-y-2 text-sm">
                          {topBowlers.map((p, idx) => (
                            <div key={p.playerId} className="flex items-center justify-between bg-slate-900/60 rounded px-3 py-2">
                              <div className="flex items-center gap-2 text-slate-100">
                                <span className="text-amber-300 font-bold">#{idx + 1}</span>
                                <span>{getPlayerName(p.playerId)}</span>
                              </div>
                              <span className="text-amber-200 font-bold">{p.wickets} wkts</span>
                            </div>
                          ))}
                          {topBowlers.length === 0 && <p className="text-slate-400 text-xs">No bowling data</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : match.innings.length === 0 ? (
          <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 text-center border border-cyan-400/20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">🎯 Start Innings</h2>
            <p className="text-gray-300 mb-6 text-xs md:text-sm">Select which team will bat first</p>
            <div className="space-y-3">
              <button
                onClick={() => startInnings(match.teamA.id)}
                disabled={isSaving}
                className="w-full py-3 md:py-4 px-4 md:px-6 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-sm md:text-base transition shadow-lg"
              >
                {isSaving ? '⏳ Starting...' : `▶ ${match.teamA.name} Innings`}
              </button>
              <button
                onClick={() => startInnings(match.teamB.id)}
                disabled={isSaving}
                className="w-full py-3 md:py-4 px-4 md:px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-sm md:text-base transition shadow-lg"
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
                <div className="bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl shadow-2xl p-4 md:p-5 mb-6 border border-red-500/50 font-mono text-xs md:text-sm">
                  <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
                    {/* Runs & Balls */}
                    <div className="font-bold text-lg md:text-2xl bg-slate-900/40 px-3 py-2 rounded-lg">
                      {match.innings[selectedInnings].totalRuns}D-{Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6}
                    </div>
                    
                    {/* Over Display */}
                    <div className="font-bold text-sm md:text-base bg-slate-900/40 px-3 py-2 rounded-lg">
                      {Math.floor(match.innings[selectedInnings].totalBalls / 6)}.{match.innings[selectedInnings].totalBalls % 6}
                    </div>

                    {/* Status Indicator */}
                    {(() => {
                      const currentInnings = match.innings[selectedInnings];
                      const batingTeam = match.teamA.id === currentInnings.teamId ? match.teamA : match.teamB;
                      const outPlayers = (currentInnings.wickets || []).map((w: any) => w.playerOutId);
                      const allOut = outPlayers.length >= batingTeam.players.length - 1;
                      
                      return (
                        <div className={`${allOut ? 'bg-red-600' : 'bg-green-500'} text-slate-900 px-3 py-1 rounded-lg font-bold text-xs md:text-sm`}>
                          {allOut ? 'ALL OUT' : 'LIVE'}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Manual start next innings if auto-start failed */}
                {(() => {
                  const inningsCount = match.innings.length;
                  const currentInnings = match.innings[selectedInnings];
                  const battingTeam = match.teamA.id === currentInnings.teamId ? match.teamA : match.teamB;
                  const fieldingTeam = match.teamA.id === currentInnings.teamId ? match.teamB : match.teamA;
                  const outPlayers = (currentInnings.wickets || []).map((w: any) => w.playerOutId);
                  const allOut = outPlayers.length >= battingTeam.players.length - 1;
                  const nextInningsAvailable = inningsCount < 2 && allOut;

                  if (!nextInningsAvailable) return null;

                  return (
                    <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-4 md:p-5 mb-4 border border-yellow-400/30 shadow-lg">
                      <p className="text-yellow-300 text-sm md:text-base font-bold mb-2">⚠️ All batsmen out</p>
                      <p className="text-gray-300 text-xs md:text-sm mb-3">Start {fieldingTeam.name} innings now.</p>
                      <button
                        onClick={() => startInnings(fieldingTeam.id)}
                        disabled={isSaving}
                        className="w-full py-3 md:py-4 px-4 md:px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-sm md:text-base transition shadow-lg"
                      >
                        {isSaving ? '⏳ Starting...' : `▶ Start ${fieldingTeam.name} Innings`}
                      </button>
                    </div>
                  );
                })()}

                {/* Player Selection */}
                <div className="mb-4">
                  <p className="text-white text-xs md:text-sm font-bold mb-3">🏏 Batsman & Bowler</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-gray-300 text-xs mb-1">Striker</p>
                      <select
                        value={strikerPlayerId}
                        onChange={(e) => setStrikerPlayerId(e.target.value)}
                        className="w-full px-3 py-2 md:py-3 bg-slate-800 border border-cyan-400/40 text-white rounded-lg focus:outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400/50 text-xs md:text-sm hover:border-cyan-400/60 transition"
                      >
                        <option value="">🏏 Striker</option>
                    {match.innings[selectedInnings].teamId && match.teamA.id === match.innings[selectedInnings].teamId
                      ? match.teamA.players.map((p) => {
                          // Check if this player has been given out
                          const isOut = (match.innings[selectedInnings].wickets || []).some(
                            (w: any) => w.playerOutId === p.id
                          );
                          // Don't show out players or the non-striker
                          if (isOut || p.id === nonStrikerPlayerId) return null;
                          return (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          );
                        })
                      : match.teamB.players.map((p) => {
                          // Check if this player has been given out
                          const isOut = (match.innings[selectedInnings].wickets || []).some(
                            (w: any) => w.playerOutId === p.id
                          );
                          // Don't show out players or the non-striker
                          if (isOut || p.id === nonStrikerPlayerId) return null;
                          return (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          );
                        })
                    }
                  </select>
                    </div>
                    <div>
                      <p className="text-gray-300 text-xs mb-1">Non-Striker</p>
                      <select
                        value={nonStrikerPlayerId}
                        onChange={(e) => setNonStrikerPlayerId(e.target.value)}
                        className="w-full px-3 py-2 md:py-3 bg-slate-800 border border-blue-400/40 text-white rounded-lg focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 text-xs md:text-sm hover:border-blue-400/60 transition"
                      >
                        <option value="">👥 Non-Striker</option>
                    {match.innings[selectedInnings].teamId && match.teamA.id === match.innings[selectedInnings].teamId
                      ? match.teamA.players.map((p) => {
                          // Check if this player has been given out
                          const isOut = (match.innings[selectedInnings].wickets || []).some(
                            (w: any) => w.playerOutId === p.id
                          );
                          // Don't show out players or the striker
                          if (isOut || p.id === strikerPlayerId) return null;
                          return (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          );
                        })
                      : match.teamB.players.map((p) => {
                          // Check if this player has been given out
                          const isOut = (match.innings[selectedInnings].wickets || []).some(
                            (w: any) => w.playerOutId === p.id
                          );
                          // Don't show out players or the striker
                          if (isOut || p.id === strikerPlayerId) return null;
                          return (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          );
                        })
                    }
                  </select>
                    </div>
                    <div>
                      <p className="text-gray-300 text-xs mb-1">Bowler</p>
                      <select
                        value={bowlerId}
                        onChange={(e) => setBowlerId(e.target.value)}
                        className="w-full px-3 py-2 md:py-3 bg-slate-800 border border-emerald-400/40 text-white rounded-lg focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-400/50 text-xs md:text-sm hover:border-emerald-400/60 transition"
                      >
                        <option value="">⚾ Bowler</option>
                        {match.innings[selectedInnings].teamId && match.teamA.id === match.innings[selectedInnings].teamId
                          ? match.teamB.players.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))
                          : match.teamA.players.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))
                        }
                      </select>
                    </div>
                  </div>
                </div>

                {/* Large Runs Display - Clickable to Complete Ball */}
                {(() => {
                  const innings = match?.innings[selectedInnings];
                  const maxBalls = (match?.oversLimit ?? 0) * 6;
                  const isOverLimitReached: boolean = innings ? innings.totalBalls >= maxBalls : false;
                  
                  return (
                    <div>
                      <button
                        onClick={handleCompleteBall}
                        disabled={isSaving || isOverLimitReached}
                        className="w-full bg-linear-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-2xl p-6 md:p-8 mb-4 text-center shadow-2xl border border-cyan-400/20 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 active:shadow-lg"
                      >
                        <p className="text-xs md:text-sm font-semibold mb-2 opacity-90">TAP TO COMPLETE BALL</p>
                        <h3 className="text-6xl md:text-7xl font-bold">{currentRuns}</h3>
                      </button>
                      {isOverLimitReached && (
                        <div className="text-center mb-4">
                          <p className="text-red-400 font-bold mb-3 text-sm md:text-base">
                            ⚠️ Over limit ({match.oversLimit} overs) reached!
                          </p>
                          {match.innings[selectedInnings]?.teamId === match.teamA.id && match.innings.length === 1 && (
                            <button
                              onClick={() => startInnings(match.teamB.id)}
                              disabled={isSaving}
                              className="w-full py-3 md:py-4 px-4 md:px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-sm md:text-base transition shadow-lg"
                            >
                              {isSaving ? '⏳ Starting...' : `▶ Start ${match.teamB.name} Innings`}
                            </button>
                          )}
                          {match.innings[selectedInnings]?.teamId === match.teamB.id && match.innings.length === 2 && (
                            <p className="text-yellow-400 font-semibold text-sm md:text-base">✅ Match Complete!</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Scoring Buttons - 0, 1, 2, 4, 6 */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { runs: 0, gradient: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-400/20', label: '0' },
                    { runs: 1, gradient: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-400/20', label: '1' },
                    { runs: 2, gradient: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-400/20', label: '2' },
                    { runs: 4, gradient: 'from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 border-slate-300/30', label: '4' },
                    { runs: 6, gradient: 'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border-amber-300/30', label: '6' },
                  ].map((btn) => (
                    <button
                      key={btn.runs}
                      onClick={() => handleAddRuns(btn.runs)}
                      className={`bg-linear-to-br ${btn.gradient} text-white font-bold py-3 md:py-5 rounded-xl text-sm md:text-xl transition shadow-lg border`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Undo Button Only */}
                <div className="mb-4">
                  <button
                    onClick={() => handleAddRuns(-1)}
                    className="w-full bg-linear-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 md:py-4 rounded-xl transition text-sm md:text-base shadow-lg border border-red-400/20"
                  >
                    ➖ Undo
                  </button>
                </div>

                {/* Special Balls - Minimal */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => handleRecordExtra('WIDE')}
                    disabled={isSaving}
                    className="bg-linear-to-br from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 md:py-4 rounded-lg text-xs md:text-sm transition shadow-lg"
                  >
                    Wide
                  </button>
                  <button
                    onClick={() => handleRecordExtra('NO_BALL')}
                    disabled={isSaving}
                    className="bg-linear-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 md:py-4 rounded-lg text-xs md:text-sm transition shadow-lg"
                  >
                    No Ball
                  </button>
                  <button
                    onClick={() => handleRecordExtra('BYE')}
                    disabled={isSaving}
                    className="bg-linear-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 md:py-4 rounded-lg text-xs md:text-sm transition shadow-lg"
                  >
                    Bye
                  </button>
                  <button
                    onClick={() => handleRecordExtra('LEG_BYE')}
                    disabled={isSaving}
                    className="bg-linear-to-br from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 md:py-4 rounded-lg text-xs md:text-sm transition shadow-lg"
                  >
                    Leg Bye
                  </button>
                </div>

                {/* Wicket - Simple Button */}
                <button 
                  onClick={() => {
                    setShowWicketForm(true);
                    setWicketForm({ playerOutId: strikerPlayerId, wicketType: 'BOWLED', fielderId: '' });
                  }}
                  disabled={isSaving || !bowlerId}
                  className="w-full bg-linear-to-br from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 md:py-4 rounded-xl text-sm md:text-base mb-4 transition shadow-lg border border-red-400/20"
                >
                  🎯 Wicket
                </button>

                {/* Wicket Form Modal */}
                {showWicketForm && match.innings[selectedInnings] && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 md:p-4">
                    <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-red-400/40 max-w-md w-full shadow-2xl">
                      <h3 className="text-white text-lg md:text-xl font-bold mb-4">🎯 Record Wicket</h3>
                      
                      {/* Player Out - Auto-filled with current striker */}
                      <div className="mb-4">
                        <label className="text-white text-xs md:text-sm font-bold mb-2 block">Player Out</label>
                        <div className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600">
                          {strikerPlayerId ? (
                            <>
                              {match.teamA.id === match.innings[selectedInnings].teamId
                                ? match.teamA.players.find((p: any) => p.id === strikerPlayerId)?.name
                                : match.teamB.players.find((p: any) => p.id === strikerPlayerId)?.name
                              }
                              <input 
                                type="hidden" 
                                value={strikerPlayerId}
                                onChange={(e) => setWicketForm({ ...wicketForm, playerOutId: e.target.value })}
                              />
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">Select striker first</span>
                          )}
                        </div>
                      </div>

                      {/* Wicket Type Selection */}
                      <div className="mb-4">
                        <label className="text-white text-xs md:text-sm font-bold mb-2 block">Wicket Type</label>
                        <select
                          value={wicketForm.wicketType}
                          onChange={(e) => setWicketForm({ ...wicketForm, wicketType: e.target.value })}
                          className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:outline-none focus:border-red-400 text-xs md:text-sm"
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
                          <label className="text-white text-xs md:text-sm font-bold mb-2 block">Fielder</label>
                          <select
                            value={wicketForm.fielderId}
                            onChange={(e) => setWicketForm({ ...wicketForm, fielderId: e.target.value })}
                            className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:outline-none focus:border-red-400 text-xs md:text-sm"
                          >
                            <option value="">Select fielder</option>
                            {match.innings[selectedInnings].teamId && match.teamB.id === match.innings[selectedInnings].teamId
                              ? match.teamA.players.map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))
                              : match.teamB.players.map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))
                            }
                          </select>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleRecordWicket}
                          disabled={isSaving || !wicketForm.playerOutId}
                          className="flex-1 bg-linear-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 rounded-lg transition text-sm md:text-base shadow-lg"
                        >
                          Record Wicket
                        </button>
                        <button
                          onClick={() => {
                            setShowWicketForm(false);
                            setWicketForm({ playerOutId: '', wicketType: 'BOWLED', fielderId: '' });
                          }}
                          disabled={isSaving}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition text-sm md:text-base shadow-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bowler Change Popup - When Over Ends */}
                {showBowlerChangeForm && match.innings[selectedInnings] && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 md:p-4">
                    <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-amber-400/40 max-w-md w-full shadow-2xl">
                      <h3 className="text-white text-lg md:text-xl font-bold mb-2">✅ Over Completed!</h3>
                      <p className="text-gray-300 text-sm md:text-base mb-4">Select the next bowler to start the new over</p>
                      
                      <div className="mb-4">
                        <label className="text-white text-xs md:text-sm font-bold mb-2 block">⚾ New Bowler</label>
                        <select
                          value={bowlerId}
                          onChange={(e) => setBowlerId(e.target.value)}
                          className="w-full bg-slate-700 text-white rounded-lg p-3 border border-emerald-400/40 focus:outline-none focus:border-emerald-300 text-xs md:text-sm"
                        >
                          <option value="">Select bowler</option>
                          {match.innings[selectedInnings].teamId && match.teamA.id === match.innings[selectedInnings].teamId
                            ? match.teamB.players.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))
                            : match.teamA.players.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))
                          }
                        </select>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            if (bowlerId) {
                              setShowBowlerChangeForm(false);
                            } else {
                              setError('Please select a bowler');
                            }
                          }}
                          className="flex-1 bg-linear-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-lg transition text-sm md:text-base shadow-lg"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Balls - Over Wise Display */}
                {match.innings && match.innings[selectedInnings] && match.innings[selectedInnings].balls && match.innings[selectedInnings].balls.length > 0 ? (
                  <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-4 md:p-5 mb-4 border border-cyan-400/20 shadow-lg">
                    <p className="text-white text-xs md:text-sm font-bold mb-3">📊 Last Balls (Over Wise)</p>
                    <div className="space-y-2">
                      {(() => {
                        // Group balls by over - only count legal balls for over number
                        const ballsByOver: Record<number, any[]> = {};
                        let currentOverNum = 0;
                        let legalBallsInOver = 0;

                        // First, add all balls in chronological order
                        match.innings[selectedInnings].balls.forEach((ball: any) => {
                          // Use overNumber from ball if available
                          let overNum: number;
                          if (typeof ball.overNumber === 'number') {
                            overNum = ball.overNumber;
                            if (overNum > currentOverNum) {
                              currentOverNum = overNum;
                              legalBallsInOver = 1;
                            } else {
                              legalBallsInOver++;
                            }
                          } else {
                            if (legalBallsInOver >= 6) {
                              currentOverNum++;
                              legalBallsInOver = 1;
                            } else {
                              legalBallsInOver++;
                            }
                            overNum = currentOverNum;
                          }
                          
                          if (!ballsByOver[overNum]) ballsByOver[overNum] = [];
                          ballsByOver[overNum].push({ 
                            ...ball, 
                            isExtra: false, 
                            isWicket: false,
                            timestamp: ball.createdAt || new Date().toISOString()
                          });
                        });

                        // Add extras in chronological order within their overs
                        (match.innings[selectedInnings].extras || []).forEach((extra: any) => {
                          let overNum = 0;
                          if (extra.overId && match.innings[selectedInnings].overs) {
                            const over = match.innings[selectedInnings].overs.find((o: any) => o.id === extra.overId);
                            if (over) overNum = over.overNumber;
                          }
                          if (!ballsByOver[overNum]) ballsByOver[overNum] = [];
                          ballsByOver[overNum].push({ 
                            ...extra, 
                            isExtra: true, 
                            isWicket: false,
                            timestamp: extra.createdAt || new Date().toISOString()
                          });
                        });

                        // Add wickets by merging with their associated balls
                        (match.innings[selectedInnings].wickets || []).forEach((wicket: any) => {
                          const ball = match.innings[selectedInnings].balls.find((b: any) => b.id === wicket.ballId);
                          if (ball) {
                            let overNum: number;
                            if (typeof ball.overNumber === 'number') {
                              overNum = ball.overNumber;
                            } else {
                              overNum = Math.floor(match.innings[selectedInnings].balls.indexOf(ball) / 6);
                            }
                            
                            // Find and merge wicket with the ball in ballsByOver
                            const ballIndex = ballsByOver[overNum]?.findIndex((d: any) => d.id === wicket.ballId);
                            if (ballIndex !== undefined && ballIndex >= 0 && ballsByOver[overNum]) {
                              // Merge wicket info into the ball
                              ballsByOver[overNum][ballIndex] = {
                                ...ballsByOver[overNum][ballIndex],
                                ...wicket,
                                isWicket: true,
                                isExtra: false,
                                timestamp: wicket.createdAt || ballsByOver[overNum][ballIndex].timestamp
                              };
                            } else if (!ballsByOver[overNum]) {
                              ballsByOver[overNum] = [];
                              ballsByOver[overNum].push({ 
                                ...wicket, 
                                isWicket: true, 
                                isExtra: false,
                                timestamp: wicket.createdAt || new Date().toISOString()
                              });
                            }
                          }
                        });

                        // Sort deliveries within each over by timestamp to maintain chronological order
                        Object.keys(ballsByOver).forEach((overNumStr: string) => {
                          const overNum = parseInt(overNumStr);
                          ballsByOver[overNum].sort((a: any, b: any) => {
                            const timeA = new Date(a.timestamp).getTime();
                            const timeB = new Date(b.timestamp).getTime();
                            return timeA - timeB;
                          });
                        });

                        // Sort overs and render
                        return Object.keys(ballsByOver)
                          .map(Number)
                          .sort((a, b) => a - b)
                          .map((overNum) => (
                            <div key={overNum} className="bg-slate-800/60 rounded-lg p-3 border border-cyan-400/10">
                              <p className="text-cyan-400 text-xs font-bold mb-2">Over {overNum}</p>
                              <div className="flex gap-1 flex-wrap">
                                {ballsByOver[overNum].map((delivery: any, didx: number) => {
                                  let displayValue: string | number = delivery.runs || 0;
                                  let bgColor = "bg-blue-600";
                                  let tooltip = `Ball ${delivery.ballNumber || didx + 1}: ${delivery.runs || 0} runs`;
                                  
                                  if (delivery.isWicket) {
                                    // Show wicket marker only; do not append runs
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
                                      className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md hover:opacity-80 transition border border-white/20`}
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
                ) : (
                  <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-4 md:p-5 mb-4 border border-slate-700/50 text-center shadow-lg">
                    <p className="text-gray-400 text-xs md:text-sm">📭 No balls recorded yet</p>
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
