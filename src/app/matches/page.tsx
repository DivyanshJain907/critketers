'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  shortCode?: string;
}

interface Match {
  id: string;
  name: string;
  status: string;
  teamA: Team;
  teamB: Team;
  oversLimit: number;
  createdAt: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    teamAId: '',
    teamBId: '',
    oversLimit: '20',
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    setIsLoggedIn(!!token);
    setUserRole(role || null);

    Promise.all([fetchMatches(), fetchTeams()]).finally(() => setLoading(false));
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamAId || !formData.teamBId || formData.teamAId === formData.teamBId) return;

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || undefined,
          teamAId: formData.teamAId,
          teamBId: formData.teamBId,
          oversLimit: parseInt(formData.oversLimit),
        }),
      });

      if (response.ok) {
        setFormData({ name: '', teamAId: '', teamBId: '', oversLimit: '20' });
        setShowCreateForm(false);
        fetchMatches();
      }
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
      case 'UPCOMING':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'ONGOING':
      case 'LIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Public Access Banner */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 text-center">
          <p className="text-sm md:text-base font-semibold">
            👁️ Watching as a guest • No login required to view matches
          </p>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2">← Back Home</Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏏 Live Matches</h1>
          </div>
          {isLoggedIn && (
            <div className="text-right">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Role: <span className="font-semibold">{userRole}</span></p>
              <Link href={`/dashboard/${userRole?.toLowerCase()}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                Go to Dashboard →
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Match Button - Only for Umpire/Admin */}
        {(userRole === 'UMPIRE' || userRole === 'ADMIN') && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Match'}
            </button>
          </div>
        )}

        {/* Create Match Form */}
        {showCreateForm && (userRole === 'UMPIRE' || userRole === 'ADMIN') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Match</h2>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Match Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Championship Final"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overs Limit</label>
                  <input
                    type="number"
                    value={formData.oversLimit}
                    onChange={(e) => setFormData({ ...formData, oversLimit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team A</label>
                  <select
                    value={formData.teamAId}
                    onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Team A</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team B</label>
                  <select
                    value={formData.teamBId}
                    onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Team B</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} disabled={team.id === formData.teamAId}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Create Match
              </button>
            </form>
          </div>
        )}

        {/* Matches List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Matches</h2>
          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
          ) : matches.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
              No matches yet. Create your first match above!
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{match.name || 'Match'}</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                        </h3>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                        {match.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Overs: {match.oversLimit}</span>
                      <span>Created: {new Date(match.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
