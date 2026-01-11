'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ViewerDashboard() {
  const [userName, setUserName] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No login required - viewers can access without authentication
    const name = localStorage.getItem('userName');
    setUserName(name || 'Guest Viewer');
    fetchData();
  }, []);

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
    window.location.href = '/matches'; // Redirect to public matches page
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🏏 CricKeters</h1>
            <p className="text-green-100">Viewer Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-green-100">Welcome, <strong>{userName}</strong></p>
            <button
              onClick={handleLogout}
              className="mt-2 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-bold text-blue-900 mb-2">👁️ Viewer Mode</h2>
          <p className="text-blue-800">You have read-only access to view live scores and match statistics. To record matches, please contact an administrator to upgrade your account.</p>
        </div>

        {/* Live Matches */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔴 Live Matches</h2>
          {loading ? (
            <p className="text-gray-600">Loading matches...</p>
          ) : matches.filter((m: any) => m.status === 'LIVE').length === 0 ? (
            <p className="text-gray-600">No live matches at the moment</p>
          ) : (
            <div className="space-y-4">
              {matches
                .filter((m: any) => m.status === 'LIVE')
                .map((match: any) => (
                  <div key={match.id} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900">{match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}</h3>
                        <p className="text-sm text-gray-600">{match.format} • Format: {match.overs} overs</p>
                      </div>
                      <span className="text-red-600 font-bold animate-pulse">● LIVE</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* All Matches */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 All Matches ({matches.length})</h2>
          {loading ? (
            <p className="text-gray-600">Loading matches...</p>
          ) : matches.length === 0 ? (
            <p className="text-gray-600">No matches available</p>
          ) : (
            <div className="space-y-4">
              {matches.map((match: any) => (
                <div key={match.id} className="bg-gray-50 p-4 rounded-lg hover:bg-blue-50 transition border-l-4 border-blue-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}</h3>
                      <p className="text-sm text-gray-600">
                        {match.format} • Status: <span className="font-semibold">{match.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {match.innings?.length > 0 && `Innings: ${match.innings.length}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
