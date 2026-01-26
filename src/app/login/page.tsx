'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and role
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userName', data.name);

      // Redirect based on role
      if (data.role === 'UMPIRE') {
        router.push('/dashboard/umpire');
      } else if (data.role === 'ADMIN') {
        router.push('/dashboard/admin');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background */}
      <div>
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
      <header className="relative z-10 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 h-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-0 flex justify-between items-center gap-2 h-full">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition min-w-0">
            <img src="/logo.png" alt="CricKeters" className="h-32 w-32 object-contain -my-4" />
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">CricKeters</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">LIVE MATCH SCORES</p>
            </div>
          </Link>
          <Link href="/" className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 whitespace-nowrap">
            ← Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2 sm:mb-3">
              🔐 Umpire Login
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm px-2">Sign in to manage live cricket matches</p>
          </div>

          {/* Login Card */}
          <div className="bg-linear-to-br from-slate-900/80 to-slate-800/60 rounded-xl sm:rounded-2xl border border-cyan-500/30 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition text-sm"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition pr-12 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-300 hover:text-cyan-400 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10 10 0 016.06 6.06" />
                        <path d="M10.94 10.94a3 3 0 104.24 4.24" />
                        <path d="M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-sm sm:text-base"
              >
                {loading ? '🔄 Signing In...' : '🔐 Sign In'}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-xs sm:text-sm text-center mb-2 sm:mb-3">
                Don't have an account?
              </p>
              <Link href="/signup" className="w-full block text-center px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700 text-cyan-400 rounded-lg font-semibold hover:bg-slate-700/50 hover:border-cyan-500 transition text-xs sm:text-sm">
                Create Account →
              </Link>
            </div>
          </div>

          {/* Footer Info */}
          <p className="text-center text-slate-500 text-xs mt-6 sm:mt-8 px-2">
            Only umpires can access the scoring system
          </p>
        </div>
      </main>
    </div>
  );
}
