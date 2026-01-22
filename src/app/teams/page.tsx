'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  shortCode?: string;
  players: any[];
  createdAt: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCode, setNewTeamCode] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeamName,
          shortCode: newTeamCode || undefined,
        }),
      });

      if (response.ok) {
        setNewTeamName('');
        setNewTeamCode('');
        fetchTeams();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex justify-between items-center">
          <Link
            href="/dashboard/umpire"
            className="px-3 md:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-xs md:text-base transition duration-300 shadow-lg"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-3xl md:text-4xl">👥</div>
            <h1 className="text-xl md:text-3xl font-bold">Team Management</h1>
          </div>
          <Link
            href="/matches"
            className="px-3 md:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-xs md:text-base transition duration-300 shadow-lg"
          >
            Matches →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Create Team Form */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl border border-cyan-400/20 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            🏗️ Create New Team
          </h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-cyan-300 mb-2">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Mumbai Tigers"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-300 mb-2">Short Code</label>
                <input
                  type="text"
                  value={newTeamCode}
                  onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
                  placeholder="e.g., MT"
                  maxLength={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Team
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Teams List */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            📋 Your Teams
          </h2>
          {loading ? (
            <div className="text-center text-cyan-300 py-12 text-lg">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-8 md:p-12 text-center border border-cyan-400/20 shadow-xl">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-cyan-300 text-lg">No teams yet. Create your first team above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-cyan-400/20 shadow-xl hover:shadow-2xl hover:border-cyan-400/50 transition-all duration-300 h-full cursor-pointer transform hover:scale-105">
                    <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition duration-300"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl md:text-2xl font-bold text-white">
                          {team.name}
                          {team.shortCode && <span className="text-sm text-cyan-400 ml-2">({team.shortCode})</span>}
                        </h3>
                        <div className="text-3xl">🏏</div>
                      </div>
                      <p className="text-cyan-300 mb-3">
                        👥 <strong>{team.players?.length || 0}</strong> players
                      </p>
                      <span className="text-cyan-400 font-bold group-hover:text-cyan-300 transition flex items-center gap-1">
                        View Team <span className="group-hover:translate-x-1 transition">→</span>
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
