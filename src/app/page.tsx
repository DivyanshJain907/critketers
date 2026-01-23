'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  _id: string;
  teamA: { name: string };
  teamB: { name: string };
  venue: string;
  matchType: string;
  innings: any[];
  createdAt: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [previousMatches, setPreviousMatches] = useState<Match[]>([]);
  const [totalPreviousMatches, setTotalPreviousMatches] = useState(0);
  const [liveMatchesPage, setLiveMatchesPage] = useState(0);
  const matchesPerPage = 2;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    if (token) {
      // Redirect to appropriate dashboard based on role
      if (role === 'UMPIRE') {
        router.push('/dashboard/umpire');
      } else if (role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // Fetch matches from API
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        const data = await response.json();
        
        console.log('Fetched matches:', data); // Debug log
        
        if (Array.isArray(data)) {
          // Separate live and completed matches
          const live = data.filter((match: Match) => match.innings && match.innings.length > 0 && match.innings.length < 2);
          const previous = data.filter((match: Match) => match.innings && match.innings.length >= 2);
          
          console.log('Live matches:', live); // Debug log
          console.log('Previous matches:', previous); // Debug log
          
          setLiveMatches(live); // Show all live matches with pagination
          setTotalPreviousMatches(previous.length); // Store total count
          setPreviousMatches(previous.slice(0, 5)); // Show first 5 previous matches
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>;
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
        
        {/* <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-600 rounded-full opacity-10 blur-3xl animate-pulse animation-delay-4000"></div> */}
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 flex justify-between items-center h-full">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="CricKeters" className="h-32 w-32 object-contain -my-4" />
            <div>
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">CricKeters</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">LIVE MATCH SCORES</p>
            </div>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/login" className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50">
              🔐 Empire Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Live Matches Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-black mb-8 text-white">🔴 Live Matches</h2>
          {liveMatches.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveMatches.slice(liveMatchesPage * matchesPerPage, (liveMatchesPage + 1) * matchesPerPage).map((match) => (
                  <div key={match._id} className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 group hover:border-green-400/80 transition-all">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-linear-to-r from-green-600 to-emerald-600 rounded-bl-lg text-xs font-bold">
                      LIVE
                    </div>
                    <div className="relative z-10">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-white mb-2">{match.teamA.name} vs {match.teamB.name}</h3>
                        <p className="text-sm text-slate-400">{match.matchType} • {match.venue}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">{match.teamA.name}</p>
                          <p className="text-3xl font-bold text-cyan-400">
                            {match.innings[0]?.totalRuns || 0}
                            {match.innings[0]?.wickets?.length > 0 ? `/${match.innings[0].wickets.length}` : ''}
                          </p>
                          <p className="text-xs text-slate-400">in {Math.floor(match.innings[0]?.totalBalls / 6)}.{match.innings[0]?.totalBalls % 6} overs</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">{match.teamB.name}</p>
                          <p className="text-3xl font-bold text-blue-400">
                            {match.innings[1]?.totalRuns || 0}
                            {match.innings[1]?.wickets?.length > 0 ? `/${match.innings[1].wickets.length}` : ''}
                          </p>
                          <p className="text-xs text-slate-400">in {Math.floor(match.innings[1]?.totalBalls / 6)}.{match.innings[1]?.totalBalls % 6} overs</p>
                        </div>
                      </div>
                      <Link href={`/matches/${match._id}/live-score`} className="w-full py-2 px-4 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:from-green-500 hover:to-emerald-500 transition">
                        View Live Score →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {liveMatches.length > matchesPerPage && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setLiveMatchesPage(prev => Math.max(0, prev - 1))}
                    disabled={liveMatchesPage === 0}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-slate-400 font-semibold">
                    {liveMatchesPage + 1} of {Math.ceil(liveMatches.length / matchesPerPage)}
                  </span>
                  
                  <button
                    onClick={() => setLiveMatchesPage(prev => Math.min(Math.ceil(liveMatches.length / matchesPerPage) - 1, prev + 1))}
                    disabled={liveMatchesPage >= Math.ceil(liveMatches.length / matchesPerPage) - 1}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
              <p className="text-slate-400">No live matches at the moment</p>
            </div>
          )}
        </section>

        {/* Previous Matches Section */}
        <section>
          <h2 className="text-4xl font-black mb-8 text-white">📊 Previous Matches</h2>
          {previousMatches.length > 0 ? (
            <>
              <div className="space-y-4">
                {previousMatches.map((match) => (
                  <div key={match._id} className="relative overflow-hidden rounded-xl border border-slate-700 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-6 hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => router.push(`/matches/${match._id}/live-score`)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{match.teamA.name} vs {match.teamB.name}</h4>
                        <p className="text-xs text-slate-400">{match.matchType} • {new Date(match.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-400">{match.innings[0]?.totalRuns || 0}</p>
                        <p className="text-xs text-slate-400">{match.teamA.name} Innings</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{match.innings[1]?.totalRuns || 0}</p>
                        <p className="text-xs text-slate-400">{match.teamB.name} Innings</p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                          match.innings[0]?.totalRuns > match.innings[1]?.totalRuns
                            ? 'bg-green-600/20 border border-green-500/50 text-green-300'
                            : 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                        }`}>
                          {match.innings[0]?.totalRuns > match.innings[1]?.totalRuns ? `${match.teamA.name} Won` : `${match.teamB.name} Won`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              {totalPreviousMatches > 5 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => router.push('/matches')}
                    className="px-8 py-3 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50"
                  >
                    View All Previous Matches ({totalPreviousMatches}) →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
              <p className="text-slate-400">No previous matches yet</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950/50 backdrop-blur-md mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">&copy; 2026 CricKeters. All rights reserved.</p>
            <div className="flex space-x-6 text-slate-500 text-sm">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
