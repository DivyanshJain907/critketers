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
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/matches', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/teams', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
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
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Modern Header */}
      <header className="bg-linear-to-r from-blue-600 via-cyan-500 to-teal-500 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-3xl md:text-4xl">🏏</div>
            <h1 className="text-xl md:text-3xl font-bold">Matches</h1>
          </div>
          {isLoggedIn && (
            <Link
              href={`/dashboard/${userRole?.toLowerCase()}`}
              className="px-3 md:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-xs md:text-base transition duration-300 shadow-lg"
            >
              Dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Guest Access Info */}
        {!isLoggedIn && (
          <div className="bg-linear-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 rounded-xl md:rounded-2xl p-4 md:p-6 mb-8">
            <p className="text-cyan-300 text-sm md:text-base">
              👁️ <span className="font-semibold">Viewing as guest</span> • No login required to view matches
            </p>
          </div>
        )}

        {/* Create Match Button - Only for Empire/Admin */}
        {(userRole === 'UMPIRE' || userRole === 'ADMIN') && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {showCreateForm ? '✕ Cancel' : '+ Create New Match'}
            </button>
          </div>
        )}

        {/* Create Match Form */}
        {showCreateForm && (userRole === 'UMPIRE' || userRole === 'ADMIN') && (
          <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl border border-cyan-400/20 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              🎯 Create New Match
            </h2>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">Match Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Championship Final"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">Overs Limit</label>
                  <input
                    type="number"
                    value={formData.oversLimit}
                    onChange={(e) => setFormData({ ...formData, oversLimit: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">Team A</label>
                  <select
                    value={formData.teamAId}
                    onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    required
                  >
                    <option value="">Select Team A</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-2">Team B</label>
                  <select
                    value={formData.teamBId}
                    onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
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
                className="w-full bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg"
              >
                Create Match
              </button>
            </form>
          </div>
        )}

        {/* Matches List */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            📋 All Matches
          </h2>
          {loading ? (
            <div className="text-center text-cyan-300 py-12 text-lg">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-8 md:p-12 text-center border border-cyan-400/20 shadow-xl">
              <div className="text-6xl mb-4">🏟️</div>
              <p className="text-cyan-300 text-lg">No matches yet. Create your first match above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-cyan-400/20 shadow-xl hover:shadow-2xl hover:border-cyan-400/50 transition-all duration-300 h-full cursor-pointer transform hover:scale-105">
                    <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-linear-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition duration-300"></div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-cyan-300 text-sm font-semibold mb-1">{match.name || 'Match'}</p>
                          <h3 className="text-xl md:text-2xl font-bold text-white">
                            <span className="text-cyan-400">{match.teamA?.name || 'Team A'}</span> vs <span className="text-emerald-400">{match.teamB?.name || 'Team B'}</span>
                          </h3>
                        </div>
                        <span className={`px-4 py-2 rounded-lg font-bold text-sm md:text-base whitespace-nowrap ml-4 ${
                          match.status === 'NOT_STARTED' ? 'bg-gray-500/30 text-gray-300' :
                          match.status === 'ONGOING' || match.status === 'LIVE' ? 'bg-green-500/30 text-green-300 animate-pulse' :
                          match.status === 'COMPLETED' ? 'bg-blue-500/30 text-blue-300' :
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {match.status === 'LIVE' || match.status === 'ONGOING' ? '🔴 ' : ''}{match.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-cyan-200">
                        <span>⏱️ {match.oversLimit} Overs</span>
                        <span>📅 {new Date(match.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-cyan-400 font-bold group-hover:text-cyan-300 transition flex items-center gap-1 mt-3">
                        View Details <span className="group-hover:translate-x-1 transition">→</span>
                      </span>
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
