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
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Modern Header */}
      <header className="bg-linear-to-r from-blue-600 via-cyan-500 to-teal-500 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-3xl md:text-4xl">🏏</div>
            <h1 className="text-xl md:text-3xl font-bold">Cricket Scoring</h1>
          </div>

          {/* Profile Circle Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center hover:bg-blue-100 transition duration-300 shadow-lg hover:shadow-xl"
              title={userName}
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold text-sm">{userName}</p>
                  <p className="text-xs text-gray-500">👤 Empire</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold text-sm transition"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Welcome back, {userName}! 👋</h2>
          <p className="text-cyan-300 text-sm md:text-lg">Follow the steps to get started</p>
        </div>

        {/* Step-wise Flow */}
        <div className="mb-12">
          <div className="space-y-4">
            {/* Step 1: Create Teams */}
            <div className={`rounded-xl md:rounded-2xl p-6 md:p-8 border-2 transition-all ${
              teams.length === 0
                ? 'bg-linear-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-lg'
                : 'bg-linear-to-br from-green-500/20 to-emerald-500/20 border-green-400/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`text-4xl flex items-center justify-center w-16 h-16 rounded-lg ${
                    teams.length === 0
                      ? 'bg-yellow-500/30'
                      : 'bg-green-500/30'
                  }`}>
                    {teams.length === 0 ? '1️⃣' : '✅'}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Step 1: Create Teams</h3>
                    <p className="text-cyan-200 text-sm md:text-base">
                      {teams.length === 0
                        ? 'Create teams before you can start matches'
                        : `Great! You have ${teams.length} team${teams.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <Link
                  href="/teams"
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition duration-300 transform hover:scale-105"
                >
                  {teams.length === 0 ? 'Create Teams' : 'Manage Teams'}
                </Link>
              </div>
            </div>

            {/* Step 2: Create Matches */}
            <div className={`rounded-xl md:rounded-2xl p-6 md:p-8 border-2 transition-all ${
              teams.length === 0
                ? 'bg-slate-700/50 border-slate-600/50 opacity-60'
                : matches.length === 0
                ? 'bg-linear-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/50 shadow-lg'
                : 'bg-linear-to-br from-green-500/20 to-emerald-500/20 border-green-400/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`text-4xl flex items-center justify-center w-16 h-16 rounded-lg ${
                    teams.length === 0
                      ? 'bg-gray-500/30'
                      : matches.length === 0
                      ? 'bg-blue-500/30'
                      : 'bg-green-500/30'
                  }`}>
                    {teams.length === 0 ? '🔒' : matches.length === 0 ? '2️⃣' : '✅'}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Step 2: Create Matches</h3>
                    <p className="text-cyan-200 text-sm md:text-base">
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
                  className={`px-6 py-3 font-bold rounded-lg transition duration-300 transform ${
                    teams.length === 0
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                  }`}
                >
                  {matches.length === 0 ? 'Create Matches' : 'Manage Matches'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Show when both teams and matches exist */}
        {teams.length > 0 && matches.length > 0 && (
          <>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">📊 Stats Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
              <div className="bg-linear-to-br from-blue-500 to-blue-700 rounded-lg md:rounded-xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition">
                <div className="flex flex-col">
                  <p className="text-blue-100 text-xs md:text-sm font-semibold">Total Matches</p>
                  <p className="text-2xl md:text-4xl font-bold text-white mt-2">{totalMatches}</p>
                </div>
              </div>

              <div className="bg-linear-to-br from-cyan-500 to-cyan-700 rounded-lg md:rounded-xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition">
                <div className="flex flex-col">
                  <p className="text-cyan-100 text-xs md:text-sm font-semibold">Not Started</p>
                  <p className="text-2xl md:text-4xl font-bold text-white mt-2">{notStartedMatches.length}</p>
                </div>
              </div>

              <div className="bg-linear-to-br from-green-500 to-green-700 rounded-lg md:rounded-xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition">
                <div className="flex flex-col">
                  <p className="text-green-100 text-xs md:text-sm font-semibold">Ongoing</p>
                  <p className="text-2xl md:text-4xl font-bold text-white mt-2">{ongoingMatches.length}</p>
                </div>
              </div>

              <div className="bg-linear-to-br from-purple-500 to-purple-700 rounded-lg md:rounded-xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition">
                <div className="flex flex-col">
                  <p className="text-purple-100 text-xs md:text-sm font-semibold">Completed</p>
                  <p className="text-2xl md:text-4xl font-bold text-white mt-2">{completedMatches}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        {teams.length > 0 && matches.length > 0 && (
          <>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">⚡ Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
              <Link
                href="/matches"
                className="group relative bg-linear-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:scale-105 border border-blue-400/20"
              >
                <div className="flex flex-col">
                  <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition">🎯</div>
                  <h4 className="font-bold text-lg md:text-2xl mb-2">Matches</h4>
                  <p className="text-blue-100 text-xs md:text-sm">Create new or view existing matches</p>
                </div>
              </Link>

              <Link
                href="/teams"
                className="group relative bg-linear-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:scale-105 border border-emerald-400/20"
              >
                <div className="flex flex-col">
                  <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition">👥</div>
                  <h4 className="font-bold text-lg md:text-2xl mb-2">Teams</h4>
                  <p className="text-emerald-100 text-xs md:text-sm">Manage and create teams for matches</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
