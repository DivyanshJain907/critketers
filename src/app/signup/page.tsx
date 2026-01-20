'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRole = 'UMPIRE' | 'ADMIN';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');
  const [role, setRole] = useState<UserRole>('UMPIRE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKeyInfo, setShowKeyInfo] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, registrationKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
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
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
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
      <header className="relative z-10 border-b border-slate-800 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
            <div className="text-4xl">🏏</div>
            <div>
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">CricKeters</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">LIVE MATCH SCORES</p>
            </div>
          </Link>
          <Link href="/" className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50">
            ← Back Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🏏</div>
            <h2 className="text-4xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
              Create Account
            </h2>
            <p className="text-slate-400 text-sm">Join CricKeters to get started</p>
          </div>

          {/* Signup Card */}
          <div className="bg-linear-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-cyan-500/30 backdrop-blur-sm p-8 shadow-2xl">

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Select Your Role</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition" style={{ borderColor: role === 'UMPIRE' ? '#06B6D4' : '#334155', backgroundColor: role === 'UMPIRE' ? 'rgba(6, 182, 212, 0.05)' : 'transparent' }}>
                  <input
                    type="radio"
                    value="UMPIRE"
                    checked={role === 'UMPIRE'}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-4 h-4 text-cyan-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-slate-100">
                      👨‍⚖️ Umpire - Record matches and manage teams
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Requires registration key</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition" style={{ borderColor: role === 'ADMIN' ? '#06B6D4' : '#334155', backgroundColor: role === 'ADMIN' ? 'rgba(6, 182, 212, 0.05)' : 'transparent' }}>
                  <input
                    type="radio"
                    value="ADMIN"
                    checked={role === 'ADMIN'}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-4 h-4 text-cyan-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-slate-100">
                      🔧 Admin - Full system access
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Requires registration key</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Registration Key - Required for all roles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-300">Registration Key</label>
                <button
                  type="button"
                  onClick={() => setShowKeyInfo(!showKeyInfo)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                  {showKeyInfo ? 'Hide' : 'Need a key?'}
                </button>
              </div>
              {showKeyInfo && (
                <div className="bg-cyan-900/20 border border-cyan-500/30 text-cyan-300 px-3 py-2 rounded-lg mb-3 text-xs">
                  <p>🔐 Your registration key is confidential and provided by administrators. It grants access to privileged roles.</p>
                </div>
              )}
              <input
                type="password"
                value={registrationKey}
                onChange={(e) => setRegistrationKey(e.target.value)}
                required={true}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-500 transition"
                placeholder="Enter your registration key..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-bold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? '🔄 Creating Account...' : '✨ Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-sm text-center mb-3">
              Already have an account?
            </p>
            <Link href="/login" className="w-full block text-center px-4 py-3 bg-slate-800/50 border border-slate-700 text-cyan-400 rounded-lg font-semibold hover:bg-slate-700/50 hover:border-cyan-500 transition">
              Sign In →
            </Link>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-slate-400 hover:text-cyan-400 text-sm transition">
              ← Back to Home
            </Link>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
