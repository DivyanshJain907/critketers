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
      const response = await fetch(`/api/teams/${teamId}`);
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

    setIsAddingPlayer(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
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

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!team) return <div className="text-center py-12">Team not found</div>;

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'BATSMAN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'BOWLER':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ALL_ROUNDER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'WICKET_KEEPER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/teams" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2">← Back to Teams</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Player Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Player</h2>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Player Name</label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="e.g., Virat Kohli"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAddingPlayer}
                  className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
                    isAddingPlayer
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isAddingPlayer ? '⏳ Adding...' : 'Add Player'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Players List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Squad ({team.players?.length || 0} Players)</h2>
          {team.players && team.players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.players.map((player) => (
                <div key={player.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h3>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
              No players added yet. Add players above!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
