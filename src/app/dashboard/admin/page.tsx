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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="bg-linear-to-r from-red-600 via-pink-600 to-red-700 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-3xl md:text-4xl">🔧</div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Admin Panel</h1>
              <p className="text-xs md:text-sm text-red-100">Manage system & users</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs md:text-sm text-red-100">Welcome, <strong>{userName}</strong></p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 md:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-xs md:text-base transition duration-300 shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-linear-to-br from-blue-500/20 to-cyan-500/10 border border-cyan-400/30 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <p className="text-cyan-300 text-xs md:text-sm font-semibold mb-2">Total Teams</p>
            <h3 className="text-4xl md:text-5xl font-bold text-cyan-400">{stats.teams}</h3>
            <p className="text-cyan-400/70 text-xs md:text-sm mt-2">Teams created</p>
          </div>
          <div className="bg-linear-to-br from-green-500/20 to-emerald-500/10 border border-green-400/30 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <p className="text-green-300 text-xs md:text-sm font-semibold mb-2">Total Players</p>
            <h3 className="text-4xl md:text-5xl font-bold text-green-400">{stats.players}</h3>
            <p className="text-green-400/70 text-xs md:text-sm mt-2">Players registered</p>
          </div>
          <div className="bg-linear-to-br from-orange-500/20 to-red-500/10 border border-orange-400/30 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <p className="text-orange-300 text-xs md:text-sm font-semibold mb-2">Total Matches</p>
            <h3 className="text-4xl md:text-5xl font-bold text-orange-400">{stats.matches}</h3>
            <p className="text-orange-400/70 text-xs md:text-sm mt-2">Matches created</p>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <button
            onClick={() => {
              setShowUserManagement(!showUserManagement);
              if (!showUserManagement && users.length === 0) {
                fetchUsers();
              }
            }}
            className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-red-400/20 shadow-xl hover:shadow-2xl hover:border-red-400/50 transition-all duration-300 h-full cursor-pointer transform hover:scale-105"
          >
            <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-linear-to-r from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 transition duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-white">👤 Manage Users</h3>
                <div className="text-3xl">👨‍💼</div>
              </div>
              <p className="text-red-300/70 mb-4">View, edit roles & delete users</p>
              <span className="text-red-400 font-bold group-hover:text-red-300 transition flex items-center gap-1">
                {showUserManagement ? 'Hide Users' : 'Show Users'} <span className="group-hover:translate-x-1 transition">→</span>
              </span>
            </div>
          </button>

          <Link href="/teams">
            <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-blue-400/20 shadow-xl hover:shadow-2xl hover:border-blue-400/50 transition-all duration-300 h-full cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-linear-to-r from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition duration-300"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white">👥 Manage Teams</h3>
                  <div className="text-3xl">🏏</div>
                </div>
                <p className="text-blue-300/70 mb-4">View & manage all teams</p>
                <span className="text-blue-400 font-bold group-hover:text-blue-300 transition flex items-center gap-1">
                  Go to Teams <span className="group-hover:translate-x-1 transition">→</span>
                </span>
              </div>
            </div>
          </Link>

          <Link href="/matches">
            <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-purple-400/20 shadow-xl hover:shadow-2xl hover:border-purple-400/50 transition-all duration-300 h-full cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-linear-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition duration-300"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white">🏏 Manage Matches</h3>
                  <div className="text-3xl">🎯</div>
                </div>
                <p className="text-purple-300/70 mb-4">View & manage all matches</p>
                <span className="text-purple-400 font-bold group-hover:text-purple-300 transition flex items-center gap-1">
                  Go to Matches <span className="group-hover:translate-x-1 transition">→</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* User Management Section */}
        {showUserManagement && (
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 mb-8 border border-red-400/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              👤 User Management
            </h2>
            <button
              onClick={() => setShowUserManagement(false)}
              className="px-3 md:px-4 py-2 bg-linear-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold text-xs md:text-base transition duration-300 shadow-lg"
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
                  <tr className="border-b border-cyan-400/20">
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-cyan-300">Name</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-cyan-300">Email</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-cyan-300">Role</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-cyan-300">Created</th>
                    <th className="px-4 md:px-6 py-3 text-center text-xs md:text-sm font-semibold text-cyan-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-cyan-400/10 hover:bg-cyan-500/5 transition">
                      <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-white">{user.name}</td>
                      <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-cyan-300/70">{user.email}</td>
                      <td className="px-4 md:px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' 
                            ? 'bg-red-500/20 border border-red-400/50 text-red-300' 
                            : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'
                        }`}>
                          {user.role === 'ADMIN' ? '🔧 ADMIN' : '👨‍⚖️ UMPIRE'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-cyan-300/70">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-center">
                        {user.id !== adminId ? (
                          <div className="flex gap-2 justify-center flex-wrap">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="px-2 py-1 bg-slate-700/50 border border-cyan-500/30 rounded text-xs md:text-sm font-semibold text-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition cursor-pointer"
                            >
                              <option value="UMPIRE">👨‍⚖️ UMPIRE</option>
                              <option value="ADMIN">🔧 ADMIN</option>
                            </select>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="px-3 py-1 bg-red-600/80 hover:bg-red-700 text-white rounded text-xs md:text-sm font-semibold transition"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center items-center text-xs md:text-sm">
                            <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 rounded font-semibold">{user.role}</span>
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
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 mb-8 border border-cyan-400/20 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            🎯 Quick Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-cyan-500/10 border border-cyan-400/30 p-4 rounded-lg">
              <p className="text-cyan-300 text-xs font-semibold mb-2">Total Users</p>
              <h4 className="text-2xl md:text-3xl font-bold text-cyan-400">{users.length}</h4>
            </div>
            <div className="bg-blue-500/10 border border-blue-400/30 p-4 rounded-lg">
              <p className="text-blue-300 text-xs font-semibold mb-2">Admins</p>
              <h4 className="text-2xl md:text-3xl font-bold text-blue-400">{users.filter(u => u.role === 'ADMIN').length}</h4>
            </div>
            <div className="bg-purple-500/10 border border-purple-400/30 p-4 rounded-lg">
              <p className="text-purple-300 text-xs font-semibold mb-2">Umpires</p>
              <h4 className="text-2xl md:text-3xl font-bold text-purple-400">{users.filter(u => u.role === 'UMPIRE').length}</h4>
            </div>
            <div className="bg-pink-500/10 border border-pink-400/30 p-4 rounded-lg">
              <p className="text-pink-300 text-xs font-semibold mb-2">Active</p>
              <h4 className="text-2xl md:text-3xl font-bold text-pink-400">{users.length}</h4>
            </div>
          </div>
        </div>
        )}

        {/* Maintenance Mode */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl p-6 md:p-8 border border-yellow-400/20 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                🔧 Maintenance Mode
              </h2>
              <p className="text-yellow-300/70 text-sm md:text-base">Enable or disable maintenance mode for all users</p>
            </div>
            <div className={`px-6 py-3 rounded-lg font-bold text-white text-sm md:text-base ${maintenanceMode ? 'bg-red-600/80' : 'bg-green-600/80'}`}>
              {maintenanceMode ? '🔴 ACTIVE' : '🟢 INACTIVE'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-yellow-300 mb-2">Maintenance Message</label>
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
            className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white transition text-sm md:text-base ${
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
            <div className="mt-6 bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 p-4 rounded-lg">
              <p className="font-semibold mb-2">⚠️ Maintenance Mode is Currently Active</p>
              <p className="text-xs md:text-sm">
                All users except admins will see the maintenance page. When you disable it, users will be able to access the application again.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
