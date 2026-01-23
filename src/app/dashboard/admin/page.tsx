'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [stats, setStats] = useState({ teams: 0, matches: 0, players: 0 });
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System maintenance is in progress. Please check back soon.');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUserName(name || 'Admin');
    setAdminId(userId || '');
    fetchData();
    fetchUsers();
    fetchMaintenanceStatus();
  }, [router]);

  const fetchData = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/matches'),
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        const totalPlayers = teamsData.reduce((sum: number, team: any) => sum + (team.players?.length || 0), 0);
        setStats((prev) => ({
          ...prev,
          teams: teamsData.length,
          players: totalPlayers,
        }));
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setStats((prev) => ({
          ...prev,
          matches: matchesData.length,
        }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      setMaintenanceMode(data.isEnabled || false);
      setMaintenanceMessage(data.message || 'System maintenance is in progress. Please check back soon.');
    } catch (err) {
      console.error('Error fetching maintenance status:', err);
    }
  };

  const toggleMaintenanceMode = async () => {
    setMaintenanceLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isEnabled: !maintenanceMode,
          message: maintenanceMessage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMaintenanceMode(data.isEnabled);
        alert(`Maintenance mode ${data.isEnabled ? 'enabled' : 'disabled'} successfully!`);
      } else {
        alert('Error updating maintenance mode: ' + data.error);
      }
    } catch (err) {
      console.error('Error toggling maintenance mode:', err);
      alert('Error updating maintenance mode');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const usersData = await res.json();
        setUsers(usersData);
      } else {
        alert('Error fetching users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      alert('Error fetching users');
    } finally {
      setUsersLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`User role updated to ${data.role}`);
        // Update local state
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: data.role } : u)));
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to update user role'));
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Error updating user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (res.ok) {
        alert('User deleted successfully');
        // Update local state
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to delete user'));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error deleting user');
    }
  };

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
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Admin Panel</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">SYSTEM MANAGEMENT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-semibold">Welcome</p>
              <p className="text-sm font-bold text-white"><strong>{userName}</strong></p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              � Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <section className="mb-12">
          <h2 className="text-4xl font-black mb-8 text-white">📊 System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-cyan-400/80 transition-all">
              <div className="relative z-10">
                <p className="text-cyan-300 text-sm font-semibold mb-2">Total Teams</p>
                <h3 className="text-5xl font-bold text-cyan-400 mb-2">{stats.teams}</h3>
                <p className="text-slate-400">Teams created</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-green-400/80 transition-all">
              <div className="relative z-10">
                <p className="text-green-300 text-sm font-semibold mb-2">Total Players</p>
                <h3 className="text-5xl font-bold text-green-400 mb-2">{stats.players}</h3>
                <p className="text-slate-400">Players registered</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-blue-400/80 transition-all">
              <div className="relative z-10">
                <p className="text-blue-300 text-sm font-semibold mb-2">Total Matches</p>
                <h3 className="text-5xl font-bold text-blue-400 mb-2">{stats.matches}</h3>
                <p className="text-slate-400">Matches created</p>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Controls */}
        <section className="mb-12">
          <h2 className="text-4xl font-black mb-8 text-white">⚙️ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => {
                setShowUserManagement(!showUserManagement);
                if (!showUserManagement && users.length === 0) {
                  fetchUsers();
                }
              }}
              className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-cyan-400/80 transition-all cursor-pointer"
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">👤 Manage Users</h3>
                </div>
                <p className="text-slate-400 mb-4">View, edit roles & delete users</p>
                <span className="text-cyan-400 font-bold group-hover:text-cyan-300 transition flex items-center gap-1">
                  {showUserManagement ? 'Hide Users' : 'Show Users'} <span className="group-hover:translate-x-1 transition">→</span>
                </span>
              </div>
            </button>

            <Link href="/teams">
              <div className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-green-400/80 transition-all cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">👥 Manage Teams</h3>
                  </div>
                  <p className="text-slate-400 mb-4">View & manage all teams</p>
                  <span className="text-green-400 font-bold group-hover:text-green-300 transition flex items-center gap-1">
                    Go to Teams <span className="group-hover:translate-x-1 transition">→</span>
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/matches">
              <div className="relative overflow-hidden rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 group hover:border-blue-400/80 transition-all cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">🎯 Manage Matches</h3>
                  </div>
                  <p className="text-slate-400 mb-4">View & manage all matches</p>
                  <span className="text-blue-400 font-bold group-hover:text-blue-300 transition flex items-center gap-1">
                    Go to Matches <span className="group-hover:translate-x-1 transition">→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* User Management Section */}
        {showUserManagement && (
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">👤 User Management</h2>
            <button
              onClick={() => setShowUserManagement(false)}
              className="px-6 py-2.5 bg-linear-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              Close
            </button>
          </div>

          {usersLoading ? (
            <div className="text-center py-12">
              <p className="text-cyan-300 text-lg">⏳ Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-cyan-300 text-lg">👤 No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/30">
                    <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Created</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-cyan-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition">
                      <td className="px-6 py-4 text-sm text-white">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-cyan-300/70">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'ADMIN' 
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' 
                            : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'
                        }`}>
                          {user.role === 'ADMIN' ? '🔧 ADMIN' : '👨‍⚖️ EMPIRE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-cyan-300/70">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.id !== adminId ? (
                          <div className="flex gap-2 justify-center flex-wrap">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="px-3 py-1.5 bg-slate-700/50 border border-cyan-500/30 rounded font-semibold text-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition cursor-pointer text-xs"
                            >
                              <option value="UMPIRE">👨‍⚖️ EMPIRE</option>
                              <option value="ADMIN">🔧 ADMIN</option>
                            </select>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="px-4 py-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded font-semibold transition text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center items-center text-xs">
                            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 rounded font-semibold">{user.role}</span>
                            <span className="text-cyan-300/70">(You)</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Admin Features - Hidden when user management is open */}
        {!showUserManagement && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">🎯 User Statistics</h2>
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-cyan-300 text-sm font-semibold mb-2">Total Users</p>
                <h4 className="text-4xl font-bold text-cyan-400">{users.length}</h4>
              </div>
              <div className="text-center">
                <p className="text-blue-300 text-sm font-semibold mb-2">Admins</p>
                <h4 className="text-4xl font-bold text-blue-400">{users.filter(u => u.role === 'ADMIN').length}</h4>
              </div>
              <div className="text-center">
                <p className="text-green-300 text-sm font-semibold mb-2">Empires</p>
                <h4 className="text-4xl font-bold text-green-400">{users.filter(u => u.role === 'UMPIRE').length}</h4>
              </div>
              <div className="text-center">
                <p className="text-emerald-300 text-sm font-semibold mb-2">Active</p>
                <h4 className="text-4xl font-bold text-emerald-400">{users.length}</h4>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Maintenance Mode */}
        <section>
          <div className="relative overflow-hidden rounded-xl border border-yellow-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">🔧 Maintenance Mode</h2>
                <p className="text-yellow-300/70">Enable or disable maintenance mode for all users</p>
              </div>
              <div className={`px-6 py-3 rounded-lg font-bold text-white text-sm whitespace-nowrap ${maintenanceMode ? 'bg-red-600/80' : 'bg-green-600/80'}`}>
                {maintenanceMode ? '🔴 ACTIVE' : '🟢 INACTIVE'}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-yellow-300 mb-3">Maintenance Message</label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-yellow-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition text-sm"
                rows={4}
                placeholder="Enter maintenance message..."
              />
            </div>

            <button
              onClick={toggleMaintenanceMode}
              disabled={maintenanceLoading}
              className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold text-white transition ${
                maintenanceLoading
                  ? 'bg-gray-600/50 cursor-not-allowed'
                  : maintenanceMode
                  ? 'bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  : 'bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
            >
              {maintenanceLoading ? '⏳ Updating...' : maintenanceMode ? '✓ Disable Maintenance Mode' : '✗ Enable Maintenance Mode'}
            </button>

            {maintenanceMode && (
              <div className="mt-6 bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 p-6 rounded-lg">
                <p className="font-bold mb-2">⚠️ Maintenance Mode is Currently Active</p>
                <p className="text-sm">
                  All users except admins will see the maintenance page. When you disable it, users will be able to access the application again.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
