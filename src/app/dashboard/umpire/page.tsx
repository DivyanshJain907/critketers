'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UmpireDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (!token || role !== 'UMPIRE') {
      router.push('/login');
      return;
    }

    setUserName(name || 'Empire');
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const [matchesRes, teamsRes] = await Promise.all([
        fetch('/api/matches', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const totalMatches = matches.length;
  const completedMatches = matches.filter((m: any) => m.status === 'COMPLETED').length;
  const ongoingMatches = matches.filter((m: any) => m.status === 'ONGOING');
  const notStartedMatches = matches.filter((m: any) => m.status === 'NOT_STARTED');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Cricket Scoring</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">EMPIRE CONTROL</p>
            </div>
          </div>

          {/* Profile Circle Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 text-white font-bold flex items-center justify-center hover:from-blue-400 hover:to-cyan-400 transition duration-300 shadow-lg hover:shadow-cyan-500/50"
              title={userName}
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 text-white rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="font-semibold text-sm">{userName}</p>
                  <p className="text-xs text-slate-400">👨‍⚖️ Empire</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-red-400 hover:text-red-300 font-semibold text-sm transition"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <section className="mb-12">
          <h2 className="text-4xl font-black text-white mb-2">Welcome back, {userName}! 👋</h2>
          <p className="text-slate-400 text-lg">Follow the steps to get started</p>
        </section>

        {/* Step-wise Flow */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">🚀 Getting Started</h2>
          <div className="space-y-4">
            {/* Step 1: Create Teams */}
            <div className={`relative overflow-hidden rounded-xl border-2 p-8 transition-all ${
              teams.length === 0
                ? 'border-yellow-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70'
                : 'border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70'
            }`}>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className={`text-6xl flex items-center justify-center w-20 h-20 rounded-lg shrink-0 ${
                    teams.length === 0
                      ? 'bg-yellow-500/20'
                      : 'bg-green-500/20'
                  }`}>
                    {teams.length === 0 ? '1️⃣' : '✅'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Step 1: Create Teams</h3>
                    <p className="text-slate-400">
                      {teams.length === 0
                        ? 'Create teams before you can start matches'
                        : `Great! You have ${teams.length} team${teams.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <Link
                  href="/teams"
                  className="px-8 py-3 bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-yellow-500/50 shrink-0"
                >
                  {teams.length === 0 ? 'Create Teams' : 'Manage Teams'}
                </Link>
              </div>
            </div>

            {/* Step 2: Create Matches */}
            <div className={`relative overflow-hidden rounded-xl border-2 p-8 transition-all ${
              teams.length === 0
                ? 'border-slate-600/50 bg-linear-to-br from-slate-900/50 to-slate-800/30 opacity-60'
                : matches.length === 0
                ? 'border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70'
                : 'border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70'
            }`}>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className={`text-6xl flex items-center justify-center w-20 h-20 rounded-lg shrink-0 ${
                    teams.length === 0
                      ? 'bg-slate-600/20'
                      : matches.length === 0
                      ? 'bg-blue-500/20'
                      : 'bg-green-500/20'
                  }`}>
                    {teams.length === 0 ? '🔒' : matches.length === 0 ? '2️⃣' : '✅'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Step 2: Create Matches</h3>
                    <p className="text-slate-400">
                      {teams.length === 0
                        ? 'Create teams first to create matches'
                        : matches.length === 0
                        ? 'Create matches between your teams'
                        : `Great! You have ${matches.length} match${matches.length !== 1 ? 'es' : ''}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (teams.length > 0) {
                      router.push('/matches');
                    }
                  }}
                  disabled={teams.length === 0}
                  className={`px-8 py-3 font-bold rounded-lg transition-all shrink-0 ${
                    teams.length === 0
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/50'
                  }`}
                >
                  {matches.length === 0 ? 'Create Matches' : 'Manage Matches'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards - Show when both teams and matches exist */}
        {teams.length > 0 && matches.length > 0 && (
          <>
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8">📊 Stats Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-cyan-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-cyan-300 text-sm font-semibold mb-2">Total Matches</p>
                    <h3 className="text-5xl font-bold text-cyan-400">{totalMatches}</h3>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-yellow-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-yellow-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-yellow-300 text-sm font-semibold mb-2">Not Started</p>
                    <h3 className="text-5xl font-bold text-yellow-400">{notStartedMatches.length}</h3>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-green-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-green-300 text-sm font-semibold mb-2">Ongoing</p>
                    <h3 className="text-5xl font-bold text-green-400">{ongoingMatches.length}</h3>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-blue-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-blue-300 text-sm font-semibold mb-2">Completed</p>
                    <h3 className="text-5xl font-bold text-blue-400">{completedMatches}</h3>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Quick Actions */}
        {teams.length > 0 && matches.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-white mb-8">⚡ Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link
                href="/matches"
                className="relative overflow-hidden rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-blue-400/80 transition-all cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-3xl font-bold text-white">🎯 Matches</h3>
                  </div>
                  <p className="text-slate-400 mb-4">Create new or view existing matches</p>
                  <span className="text-blue-400 font-bold group-hover:text-blue-300 transition flex items-center gap-1">
                    Go to Matches <span className="group-hover:translate-x-1 transition">→</span>
                  </span>
                </div>
              </Link>

              <Link
                href="/teams"
                className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-green-400/80 transition-all cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-3xl font-bold text-white">👥 Teams</h3>
                  </div>
                  <p className="text-slate-400 mb-4">Manage and create teams for matches</p>
                  <span className="text-green-400 font-bold group-hover:text-green-300 transition flex items-center gap-1">
                    Go to Teams <span className="group-hover:translate-x-1 transition">→</span>
                  </span>
                </div>
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
