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
            <img src="/logo.png" alt="CricKeters" className="h-32 w-32 object-contain -my-4" />
            <div>
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Matches</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">CREATE & MANAGE MATCHES</p>
            </div>
          </div>
          {isLoggedIn && (
            <Link
              href={`/dashboard/${userRole?.toLowerCase()}`}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              Dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Guest Access Info */}
        {!isLoggedIn && (
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 mb-12">
            <p className="text-cyan-300 text-base">
              👁️ <span className="font-semibold">Viewing as guest</span> • No login required to view matches
            </p>
          </div>
        )}

        {/* Create Match Button - Only for Empire/Admin */}
        {(userRole === 'UMPIRE' || userRole === 'ADMIN') && (
          <section className="mb-12">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
            >
              {showCreateForm ? '✕ Cancel' : '+ Create New Match'}
            </button>
          </section>
        )}

        {/* Create Match Form */}
        {showCreateForm && (userRole === 'UMPIRE' || userRole === 'ADMIN') && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8">
              <h2 className="text-3xl font-bold text-white mb-8">🎯 Create New Match</h2>
              <form onSubmit={handleCreateMatch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-cyan-300 mb-3">Match Name (Optional)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Championship Final"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-cyan-300 mb-3">Overs Limit</label>
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
                    <label className="block text-sm font-bold text-cyan-300 mb-3">Team A</label>
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
                    <label className="block text-sm font-bold text-cyan-300 mb-3">Team B</label>
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
                  className="w-full bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/50"
                >
                  Create Match
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Matches List */}
        <section>
          <h2 className="text-4xl font-black text-white mb-8">📋 All Matches</h2>
          {loading ? (
            <div className="text-center text-slate-400 py-16 text-lg">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-16 text-center">
              <div className="text-7xl mb-4">🏟️</div>
              <p className="text-slate-400 text-lg">No matches yet. Create your first match above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="group relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 hover:border-cyan-400/80 transition-all cursor-pointer">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-cyan-300 text-sm font-bold mb-2">{match.name || 'Match'}</p>
                          <h3 className="text-2xl font-bold text-white">
                            <span className="text-cyan-400">{match.teamA?.name || 'Team A'}</span> vs <span className="text-green-400">{match.teamB?.name || 'Team B'}</span>
                          </h3>
                        </div>
                        <span className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          match.status === 'NOT_STARTED' ? 'bg-gray-500/30 text-gray-300' :
                          match.status === 'ONGOING' || match.status === 'LIVE' ? 'bg-green-500/30 text-green-300 animate-pulse' :
                          match.status === 'COMPLETED' ? 'bg-blue-500/30 text-blue-300' :
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {match.status === 'LIVE' || match.status === 'ONGOING' ? '🔴 ' : ''}{match.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-6 text-sm text-slate-400 mb-4">
                        <span>⏱️ {match.oversLimit} Overs</span>
                        <span>📅 {new Date(match.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-cyan-400 font-bold group-hover:text-cyan-300 transition flex items-center gap-1">
                        View Details <span className="group-hover:translate-x-1 transition">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
