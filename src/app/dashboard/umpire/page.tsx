'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UmpireDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'matches'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (!token || role !== 'UMPIRE') {
      router.push('/login');
      return;
    }

    setUserName(name || 'Umpire');
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/matches'),
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
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

  const ongoingMatches = matches.filter((m: any) => m.status === 'ONGOING');
  const notStartedMatches = matches.filter((m: any) => m.status === 'NOT_STARTED');
  const completedMatches = matches.filter((m: any) => m.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <span className="text-4xl">👨‍⚖️</span>
                <span>Umpire Control Center</span>
              </h1>
              <p className="text-blue-100 mt-2">Manage teams, create & record matches</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">Signed in as</p>
              <p className="text-xl font-bold text-white mb-3">{userName}</p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{teams.length}</div>
            <p className="text-blue-100 text-sm mt-2">Teams Created</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{ongoingMatches.length}</div>
            <p className="text-green-100 text-sm mt-2">Ongoing Matches</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{notStartedMatches.length}</div>
            <p className="text-orange-100 text-sm mt-2">Scheduled Matches</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{completedMatches.length}</div>
            <p className="text-purple-100 text-sm mt-2">Completed Matches</p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/teams">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl p-8 text-white shadow-xl transition-all transform hover:scale-105 cursor-pointer border border-blue-500/30">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold mb-2">Team Formation</h3>
              <p className="text-blue-100">Create teams and manage player rosters for your matches</p>
              <span className="text-blue-200 font-semibold mt-4 inline-block">Manage Teams →</span>
            </div>
          </Link>

          <Link href="/matches">
            <div className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl p-8 text-white shadow-xl transition-all transform hover:scale-105 cursor-pointer border border-green-500/30">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-2">Start Scoring</h3>
              <p className="text-green-100">Create a new match and start recording live balls in real-time</p>
              <span className="text-green-200 font-semibold mt-4 inline-block">Create Match →</span>
            </div>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'teams'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            👥 Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'matches'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            🏏 Matches ({matches.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Ongoing Matches */}
            {ongoingMatches.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                  <span>🔴 Live Now</span>
                </h3>
                <div className="space-y-3">
                  {ongoingMatches.map((match: any) => (
                    <Link key={match.id} href={`/matches/${match.id}`}>
                      <div className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 p-4 rounded-lg cursor-pointer transition-all transform hover:scale-102 border-l-4 border-green-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-bold">{match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}</h4>
                            <p className="text-green-300 text-sm">Status: ONGOING • {match.oversLimit} overs</p>
                          </div>
                          <span className="text-green-400 font-bold animate-pulse">Record →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Matches */}
            {notStartedMatches.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-orange-400 mb-6 flex items-center gap-2">
                  <span>📅 Scheduled</span>
                </h3>
                <div className="space-y-3">
                  {notStartedMatches.slice(0, 5).map((match: any) => (
                    <Link key={match.id} href={`/matches/${match.id}`}>
                      <div className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 p-4 rounded-lg cursor-pointer transition-all border-l-4 border-orange-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-bold">{match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}</h4>
                            <p className="text-orange-300 text-sm">Ready to start • {match.oversLimit} overs</p>
                          </div>
                          <span className="text-orange-400 font-bold">Start →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">My Teams</h2>
              <Link href="/teams" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                + Create Team
              </Link>
            </div>
            {loading ? (
              <p className="text-slate-300 text-center py-8">Loading teams...</p>
            ) : teams.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-12 border border-slate-700 text-center">
                <p className="text-slate-300 text-lg mb-4">No teams created yet</p>
                <Link href="/teams" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                  Create Your First Team
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team: any) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-blue-500 rounded-lg p-6 transition-all transform hover:scale-105 cursor-pointer">
                      <h3 className="font-bold text-xl text-white mb-2">{team.name}</h3>
                      <p className="text-slate-300 text-sm">👥 {team.players?.length || 0} players</p>
                      <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold">
                        View Team →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">All Matches</h2>
              <Link href="/matches" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
                + New Match
              </Link>
            </div>

            {loading ? (
              <p className="text-slate-300 text-center py-8">Loading matches...</p>
            ) : matches.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-12 border border-slate-700 text-center">
                <p className="text-slate-300 text-lg mb-4">No matches created yet</p>
                <Link href="/matches" className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
                  Create Your First Match
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ongoing */}
                {ongoingMatches.length > 0 && (
                  <div>
                    <h3 className="text-green-400 font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      🔴 Ongoing ({ongoingMatches.length})
                    </h3>
                    <div className="space-y-3">
                      {ongoingMatches.map((match: any) => (
                        <Link key={match.id} href={`/matches/${match.id}`}>
                          <div className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border-l-4 border-green-500 rounded-lg p-4 cursor-pointer transition-all">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-white font-bold">{match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}</h4>
                                <p className="text-green-300 text-sm">Live now • {match.oversLimit} overs</p>
                              </div>
                              <span className="text-green-400 font-bold">Record →</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Started */}
                {notStartedMatches.length > 0 && (
                  <div>
                    <h3 className="text-orange-400 font-bold text-lg mb-4">📅 Scheduled ({notStartedMatches.length})</h3>
                    <div className="space-y-3">
                      {notStartedMatches.map((match: any) => (
                        <Link key={match.id} href={`/matches/${match.id}`}>
                          <div className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border-l-4 border-orange-500 rounded-lg p-4 cursor-pointer transition-all">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-white font-bold">{match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}</h4>
                                <p className="text-orange-300 text-sm">Ready to start • {match.oversLimit} overs</p>
                              </div>
                              <span className="text-orange-400 font-bold">Start →</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed */}
                {completedMatches.length > 0 && (
                  <div>
                    <h3 className="text-blue-400 font-bold text-lg mb-4">✅ Completed ({completedMatches.length})</h3>
                    <div className="space-y-3">
                      {completedMatches.slice(0, 10).map((match: any) => (
                        <Link key={match.id} href={`/matches/${match.id}`}>
                          <div className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border-l-4 border-blue-500 rounded-lg p-4 cursor-pointer transition-all">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-white font-bold">{match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}</h4>
                                <p className="text-blue-300 text-sm">Completed • {match.oversLimit} overs</p>
                              </div>
                              <span className="text-blue-400 font-bold">View →</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
