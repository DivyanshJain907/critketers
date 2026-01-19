'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRole = 'UMPIRE' | 'ADMIN' | 'VIEWER';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
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
      } else if (data.role === 'VIEWER') {
        router.push('/dashboard/viewer');
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
    if (newRole === 'VIEWER') {
      setRegistrationKey('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">🏏</h1>
          <h2 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">CricKeters</h2>
          <p className="text-slate-400">Create Your Professional Account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-xl shadow-2xl p-8 border border-slate-800">
          <h3 className="text-2xl font-bold text-white mb-6">Sign Up</h3>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-700 bg-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-700 bg-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-700 bg-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Select Your Role</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition" style={{ borderColor: role === 'VIEWER' ? '#06B6D4' : '#334155' }}>
                  <input
                    type="radio"
                    value="VIEWER"
                    checked={role === 'VIEWER'}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-slate-100">
                      👁️ Viewer - Watch matches and stats
                    </span>
                    <p className="text-xs text-slate-400 mt-1">No registration key required</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition" style={{ borderColor: role === 'UMPIRE' ? '#06B6D4' : '#334155' }}>
                  <input
                    type="radio"
                    value="UMPIRE"
                    checked={role === 'UMPIRE'}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-slate-100">
                      👨‍⚖️ Umpire - Record matches and manage teams
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Requires registration key</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition" style={{ borderColor: role === 'ADMIN' ? '#06B6D4' : '#334155' }}>
                  <input
                    type="radio"
                    value="ADMIN"
                    checked={role === 'ADMIN'}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-4 h-4 text-blue-600"
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

            {/* Registration Key - Only for Umpire and Admin */}
            {role !== 'VIEWER' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">Registration Key</label>
                  <button
                    type="button"
                    onClick={() => setShowKeyInfo(!showKeyInfo)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    {showKeyInfo ? 'Hide' : 'Need a key?'}
                  </button>
                </div>
                {showKeyInfo && (
                  <div className="bg-blue-900/30 border border-blue-600/50 text-blue-300 px-3 py-2 rounded-lg mb-3 text-xs">
                    <p>🔐 Your registration key is confidential and provided by administrators. It grants access to privileged roles.</p>
                  </div>
                )}
                <input
                  type="password"
                  value={registrationKey}
                  onChange={(e) => setRegistrationKey(e.target.value)}
                  required={true}
                  className="w-full px-4 py-2 border border-slate-700 bg-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your registration key..."
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition">
              Sign In
            </Link>
          </p>

          {/* Back Link */}
          <p className="mt-4 text-center">
            <Link href="/" className="text-slate-400 hover:text-slate-300 transition text-sm">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
