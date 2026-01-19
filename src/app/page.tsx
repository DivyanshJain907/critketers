'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-600 rounded-full opacity-10 blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🏏</div>
            <div>
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">CricKeters</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">PROFESSIONAL MATCH RECORDING</p>
            </div>
          </div>
          <nav className="flex items-center space-x-6">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors border border-slate-700 rounded-lg hover:border-slate-500">
                  Login
                </Link>
                <Link href="/signup" className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50">
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userRole');
                  setIsLoggedIn(false);
                }}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center mb-20">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded-full">
            <p className="text-sm font-semibold text-blue-300">✨ Enterprise-Grade Cricket Scoring Platform</p>
          </div>
          <h2 className="text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Professional Cricket</span>
            <br />
            <span className="text-slate-200">Match Recording System</span>
          </h2>
          <p className="text-xl lg:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Enterprise-level real-time match recording platform designed for umpires. 
            <span className="text-slate-300 font-semibold"> Precise • Fast • Reliable</span>
          </p>
          
          {!isLoggedIn ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 text-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-slate-800/50 text-white font-bold rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all text-lg"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 text-lg"
            >
              Access Dashboard
            </Link>
          )}
          <p className="text-sm text-slate-500 mt-4">No credit card required • Instant setup</p>
        </div>

        {/* Features Grid - Premium Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="group relative p-8 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/50 transition-all hover:bg-slate-900/80 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-cyan-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Team Management</h3>
              <p className="text-slate-400 leading-relaxed">Create unlimited teams, manage players with detailed profiles, and organize squads with precision</p>
              <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold">
                Learn more →
              </div>
            </div>
          </div>

          <div className="group relative p-8 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 transition-all hover:bg-slate-900/80 hover:shadow-lg hover:shadow-cyan-500/10">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-600/10 to-blue-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Live Scoring</h3>
              <p className="text-slate-400 leading-relaxed">Record deliveries in real-time with +/- controls, animations, and instant score updates</p>
              <div className="mt-4 flex items-center text-cyan-400 text-sm font-semibold">
                Learn more →
              </div>
            </div>
          </div>

          <div className="group relative p-8 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/50 transition-all hover:bg-slate-900/80 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-indigo-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Advanced Analytics</h3>
              <p className="text-slate-400 leading-relaxed">Auto-calculated statistics, player performance tracking, and comprehensive match reports</p>
              <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold">
                Learn more →
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 mb-20 py-12 border-y border-slate-800">
          <div className="text-center">
            <div className="text-4xl font-black text-transparent bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text mb-2">1M+</div>
            <p className="text-slate-400 text-sm">Deliveries Recorded</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-transparent bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text mb-2">10K+</div>
            <p className="text-slate-400 text-sm">Active Users</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-transparent bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text mb-2">99.9%</div>
            <p className="text-slate-400 text-sm">Uptime SLA</p>
          </div>
        </div>

        {/* User Roles - Premium Cards */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-black mb-4">Role-Based Access Control</h3>
            <p className="text-slate-400 text-lg">Tailored dashboards for every user type</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Umpire Card */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-8 group hover:border-blue-500/50 transition-all">
              <div className="absolute top-0 left-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-4">👨‍⚖️</div>
                <h4 className="text-2xl font-bold mb-4 text-slate-100">Umpire</h4>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Create & manage teams</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Add players to squad</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Record live matches</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Full match control</span>
                  </li>
                </ul>
                <button className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg font-semibold transition-colors text-sm">
                  Learn More
                </button>
              </div>
            </div>

            {/* Admin Card */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-8 group hover:border-cyan-500/50 transition-all ring-1 ring-slate-700">
              <div className="absolute top-0 left-0 w-40 h-40 bg-cyan-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform"></div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-linear-to-r from-yellow-600 to-orange-600 rounded-full text-xs font-bold">
                ENTERPRISE
              </div>
              <div className="relative z-10">
                <div className="text-5xl mb-4">🔧</div>
                <h4 className="text-2xl font-bold mb-4 text-slate-100">Admin</h4>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-cyan-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">All umpire features</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">System management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">User administration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Platform settings</span>
                  </li>
                </ul>
                <button className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 rounded-lg font-semibold transition-colors text-sm">
                  Learn More
                </button>
              </div>
            </div>

            {/* Viewer Card */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-8 group hover:border-green-500/50 transition-all">
              <div className="absolute top-0 left-0 w-40 h-40 bg-green-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-4">👁️</div>
                <h4 className="text-2xl font-bold mb-4 text-slate-100">Viewer</h4>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">View live scores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Watch statistics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">Match history</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 font-bold mr-3">✓</span>
                    <span className="text-slate-300 text-sm">No login needed</span>
                  </li>
                </ul>
                <Link
                  href="/matches"
                  className="w-full block text-center py-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg font-semibold transition-colors text-sm"
                >
                  Watch Matches Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-cyan-600/20 opacity-50"></div>
          <div className="relative z-10 text-center">
            <h3 className="text-4xl font-bold mb-4">Ready to Transform Your Cricket Scoring?</h3>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">Join thousands of umpires and administrators who trust CricKeters for professional match recording</p>
            {!isLoggedIn && (
              <Link
                href="/signup"
                className="inline-block px-10 py-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 text-lg"
              >
                Start Your Free Trial Today
              </Link>
            )}
          </div>
        </div>
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
