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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-300 text-lg">Loading team details...</div>
      </div>
    );
  }
  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/teams" className="text-white/70 hover:text-white transition text-2xl">←</Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{team.name}</h1>
              {team.shortCode && <p className="text-cyan-100 text-sm">Code: {team.shortCode}</p>}
            </div>
          </div>
          <div className="text-3xl">🏏</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Add Player Form */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl border border-cyan-400/20 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            ➕ Add New Player
          </h2>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-cyan-300 mb-2">Player Name</label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="e.g., Virat Kohli"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAddingPlayer}
                  className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isAddingPlayer
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                  }`}
                >
                  {isAddingPlayer ? '⏳ Adding...' : '✓ Add'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Squad Stats */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl border border-cyan-400/20 mb-8">
          <p className="text-cyan-300 text-lg">
            👥 Total Players: <span className="text-white font-bold text-2xl">{team.players?.length || 0}</span>
          </p>
        </div>

        {/* Players List */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            🏏 Squad
          </h2>
          {team.players && team.players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {team.players.map((player) => (
                <div
                  key={player.id}
                  className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-cyan-400/20 shadow-xl hover:shadow-2xl hover:border-cyan-400/50 transition-all duration-300 h-full"
                >
                  <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition duration-300"></div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                          {player.jerseyNo && <span className="text-cyan-400">#{player.jerseyNo} </span>}
                          {player.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition duration-300 font-bold text-lg"
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
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-8 md:p-12 text-center border border-cyan-400/20 shadow-xl">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-cyan-300 text-lg">No players added yet. Add your first player above!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
