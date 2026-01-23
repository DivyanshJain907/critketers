'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  jerseyNo?: number;
  role: string;
}

interface Team {
  id: string;
  name: string;
  shortCode?: string;
  players: Player[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params?.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJerseyNo, setNewPlayerJerseyNo] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('BATSMAN');

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/teams/${teamId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    // Check if player with same name already exists
    if (team?.players?.some((p) => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      alert(`Player "${newPlayerName}" already exists in this team!`);
      return;
    }

    setIsAddingPlayer(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPlayerName,
          jerseyNo: newPlayerJerseyNo ? parseInt(newPlayerJerseyNo) : null,
          role: newPlayerRole,
        }),
      });

      if (response.ok) {
        const newPlayer = await response.json();
        // Optimistically update local state instead of refetching
        if (team) {
          setTeam({
            ...team,
            players: [...(team.players || []), newPlayer],
          });
        }
        setNewPlayerName('');
        setNewPlayerJerseyNo('');
        setNewPlayerRole('BATSMAN');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error adding player:', response.status, errorData);
        alert(`Error: ${errorData.error || 'Failed to add player'}`);
      }
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        // Optimistically update local state
        if (team) {
          setTeam({
            ...team,
            players: team.players.filter((p) => p.id !== playerId),
          });
        }
      }
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-300 text-lg">Loading team details...</div>
      </div>
    );
  }
  if (!team) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-lg">❌ Team not found</div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'BATSMAN':
        return 'from-blue-600 to-blue-800 text-blue-100';
      case 'BOWLER':
        return 'from-red-600 to-red-800 text-red-100';
      case 'ALL_ROUNDER':
        return 'from-purple-600 to-purple-800 text-purple-100';
      case 'WICKET_KEEPER':
        return 'from-emerald-600 to-emerald-800 text-emerald-100';
      default:
        return 'from-gray-600 to-gray-800 text-gray-100';
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'BATSMAN':
        return '🏏';
      case 'BOWLER':
        return '🎯';
      case 'ALL_ROUNDER':
        return '⭐';
      case 'WICKET_KEEPER':
        return '🧤';
      default:
        return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="pointer-events-none">
        {/* Dot Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="30" y="30" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.5" fill="#06b6d4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
      </div>

      {/* Header */}
      <header className="z-50 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 h-24 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 flex justify-between items-center h-full">
          <div className="flex items-center space-x-3">
            <Link href="/teams" className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50">
              ← Back
            </Link>
            <img src="/logo.png" alt="CricKeters" className="h-32 w-32 object-contain -my-4" />
            <div>
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{team.name}</h1>
              {team.shortCode && <p className="text-xs text-slate-400 font-semibold tracking-widest">Code: {team.shortCode}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Add Player Form */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8">
            <h2 className="text-3xl font-bold text-white mb-8">➕ Add New Player</h2>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-cyan-300 mb-3">Player Name</label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="e.g., Virat Kohli"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-3">Jersey No</label>
                  <input
                    type="number"
                    value={newPlayerJerseyNo}
                    onChange={(e) => setNewPlayerJerseyNo(e.target.value)}
                    placeholder="e.g., 18"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isAddingPlayer}
                    className={`w-full font-bold py-3 px-4 rounded-lg transition-all shadow-lg ${
                      isAddingPlayer
                        ? 'bg-slate-600 cursor-not-allowed text-slate-300'
                        : 'bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white hover:shadow-cyan-500/50'
                    }`}
                  >
                    {isAddingPlayer ? '⏳ Adding...' : '✓ Add Player'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Players List */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-cyan-400">👥</span> Squad Members
          </h2>
          {team.players && team.players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.players.map((player) => (
                <div
                  key={player.id}
                  className="group relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">
                          {player.jerseyNo && <span className="text-cyan-400">#{player.jerseyNo} </span>}
                          {player.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="ml-2 p-2 rounded-lg transition-all bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 font-bold"
                        title="Delete player"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-cyan-300 text-lg">No players added yet. Add your first player above!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
