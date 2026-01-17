'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UmpireDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const matchesRes = await fetch('/api/matches');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Simple Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏏 Cricket Scoring</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{userName}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/matches"
            className="p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition text-center"
          >
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-bold text-lg">View/Create Matches</div>
            <div className="text-sm text-blue-100 mt-1">{notStartedMatches.length} Not Started</div>
          </Link>
          <Link
            href="/teams"
            className="p-6 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition text-center"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold text-lg">Manage Teams</div>
            <div className="text-sm text-green-100 mt-1">Create & View Teams</div>
          </Link>
        </div>

        {/* Ongoing Matches */}
        {ongoingMatches.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">📊 Live Matches</h2>
            <div className="space-y-3">
              {ongoingMatches.map((match: any) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{match.teamA?.name} vs {match.teamB?.name}</div>
                      <div className="text-sm text-gray-300">Tap to score</div>
                    </div>
                    <div className="text-green-400 font-bold">LIVE</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {ongoingMatches.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-8 shadow-lg text-center">
            <div className="text-5xl mb-4">🏏</div>
            <p className="text-white text-lg">No live matches</p>
            <p className="text-gray-400 text-sm mt-2">Create or start a match to begin scoring</p>
          </div>
        )}
      </main>
    </div>
  );
}
