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
      <header className="z-50 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="CricKeters" className="h-10 sm:h-14 w-10 sm:w-14 object-contain" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">Admin</h1>
              <p className="text-xs text-slate-400 font-semibold">Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-16">
        {/* Stats Overview */}
        <section className="mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black mb-6 sm:mb-10 text-white">Overview</h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-8">
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10 group hover:border-cyan-400/80 transition-all">
              <div className="relative z-10">
                <p className="text-cyan-300 text-sm sm:text-base font-semibold mb-3">Teams</p>
                <h3 className="text-3xl sm:text-5xl font-bold text-cyan-400">{stats.teams}</h3>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10 group hover:border-green-400/80 transition-all">
              <div className="relative z-10">
                <p className="text-green-300 text-sm sm:text-base font-semibold mb-3">Players</p>
                <h3 className="text-3xl sm:text-5xl font-bold text-green-400">{stats.players}</h3>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10 group hover:border-blue-400/80 transition-all">
              <div className="relative z-10">
                <p className="text-blue-300 text-sm sm:text-base font-semibold mb-3">Matches</p>
                <h3 className="text-3xl sm:text-5xl font-bold text-blue-400">{stats.matches}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Controls */}
        <section className="mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black mb-6 sm:mb-10 text-white">Actions</h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-8">
            <button
              onClick={() => {
                setShowUserManagement(!showUserManagement);
                if (!showUserManagement && users.length === 0) {
                  fetchUsers();
                }
              }}
              className="relative overflow-hidden rounded-lg sm:rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10 group hover:border-cyan-400/80 transition-all cursor-pointer text-left"
            >
              <div className="relative z-10">
                <h3 className="text-base sm:text-2xl font-bold text-white mb-2">Users</h3>
                <span className="text-cyan-400 font-bold text-sm sm:text-base group-hover:text-cyan-300 transition">
                  {showUserManagement ? 'Hide' : 'Show'} →
                </span>
              </div>
            </button>

            <Link href="/teams">
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10 group hover:border-green-400/80 transition-all cursor-pointer text-left">
                <div className="relative z-10">
                  <h3 className="text-base sm:text-2xl font-bold text-white mb-2">Teams</h3>
                  <span className="text-green-400 font-bold text-sm sm:text-base group-hover:text-green-300 transition">
                    Go →
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/matches">
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10 group hover:border-blue-400/80 transition-all cursor-pointer text-left">
                <div className="relative z-10">
                  <h3 className="text-base sm:text-2xl font-bold text-white mb-2">Matches</h3>
                  <span className="text-blue-400 font-bold text-sm sm:text-base group-hover:text-blue-300 transition">
                    Go →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* User Management Section */}
        {showUserManagement && (
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-4 sm:p-10 mb-10 sm:mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-10">
            <h2 className="text-lg sm:text-3xl font-bold text-white">User Management</h2>
            <button
              onClick={() => setShowUserManagement(false)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-linear-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded text-xs sm:text-base font-semibold transition-all shadow-lg"
            >
              Close
            </button>
          </div>

          {usersLoading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-cyan-300 text-sm sm:text-lg">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-cyan-300 text-sm sm:text-lg">No users found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-0 sm:overflow-x-auto">
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/30">
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-cyan-300">Name</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-cyan-300">Email</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-cyan-300">Role</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold text-cyan-300">Created</th>
                      <th className="px-4 py-3 text-center text-xs sm:text-sm font-bold text-cyan-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition">
                        <td className="px-4 py-3 text-xs sm:text-sm text-white">{user.name}</td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-cyan-300/70">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                            user.role === 'ADMIN' 
                              ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' 
                              : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'
                          }`}>
                            {user.role === 'ADMIN' ? 'ADMIN' : 'UMPIRE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-cyan-300/70">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {user.id !== adminId ? (
                            <div className="flex gap-2 justify-center flex-wrap">
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-700/50 border border-cyan-500/30 rounded font-semibold text-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition cursor-pointer text-xs"
                              >
                                <option value="UMPIRE">UMPIRE</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="px-2 sm:px-4 py-1 sm:py-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded font-semibold transition text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center items-center text-xs">
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
              
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="border border-cyan-500/30 bg-slate-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-cyan-300 font-semibold">Name</p>
                        <p className="text-sm text-white truncate">{user.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        user.role === 'ADMIN' 
                          ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' 
                          : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-cyan-300 font-semibold">Email</p>
                      <p className="text-xs text-cyan-300/70 truncate">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-cyan-300 font-semibold mb-1">Created</p>
                      <p className="text-xs text-cyan-300/70">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    {user.id !== adminId ? (
                      <div className="flex gap-2 pt-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-700/50 border border-cyan-500/30 rounded text-xs font-semibold text-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition cursor-pointer"
                        >
                          <option value="UMPIRE">UMPIRE</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-3 py-1 bg-red-600/80 hover:bg-red-700 text-white rounded text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-cyan-300/70 pt-2">
                        Current admin (You)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Admin Features - Hidden when user management is open */}
        {!showUserManagement && (
        <section className="mb-10 sm:mb-16">
          <h2 className="text-lg sm:text-3xl font-bold text-white mb-4 sm:mb-8">User Statistics</h2>
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-5 sm:p-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-8">
              <div className="text-center">
                <p className="text-cyan-300 text-xs sm:text-sm font-semibold mb-1">Total Users</p>
                <h4 className="text-2xl sm:text-4xl font-bold text-cyan-400">{users.length}</h4>
              </div>
              <div className="text-center">
                <p className="text-blue-300 text-xs sm:text-sm font-semibold mb-1">Admins</p>
                <h4 className="text-2xl sm:text-4xl font-bold text-blue-400">{users.filter(u => u.role === 'ADMIN').length}</h4>
              </div>
              <div className="text-center">
                <p className="text-green-300 text-xs sm:text-sm font-semibold mb-1">Umpires</p>
                <h4 className="text-2xl sm:text-4xl font-bold text-green-400">{users.filter(u => u.role === 'UMPIRE').length}</h4>
              </div>
              <div className="text-center">
                <p className="text-emerald-300 text-xs sm:text-sm font-semibold mb-1">Active</p>
                <h4 className="text-2xl sm:text-4xl font-bold text-emerald-400">{users.length}</h4>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Maintenance Mode */}
        <section className="mt-10 sm:mt-16">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6\">
            <div>
              <h2 className="text-lg sm:text-3xl font-bold text-white mb-1">Maintenance</h2>

            </div>
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border-2 ${maintenanceMode ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'}`}>
              {maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-yellow-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-4 sm:p-10">
            <div className="mb-3 sm:mb-6">
              <label className="block text-xs sm:text-sm font-bold text-yellow-300 mb-2">Message</label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full px-2 sm:px-4 py-2 sm:py-3 bg-slate-700/50 border border-yellow-500/30 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition text-xs sm:text-sm"
                rows={2}
                placeholder="Maintenance message..."
              />
            </div>

            <button
              onClick={toggleMaintenanceMode}
              disabled={maintenanceLoading}
              className={`w-full px-3 sm:px-8 py-2 sm:py-3 rounded text-xs sm:text-base font-bold text-white transition ${
                maintenanceLoading
                  ? 'bg-gray-600/50 cursor-not-allowed'
                  : maintenanceMode
                  ? 'bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  : 'bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
            >
              {maintenanceLoading ? 'Updating...' : maintenanceMode ? 'Disable' : 'Enable'}
            </button>

            {maintenanceMode && (
              <div className="mt-3 sm:mt-6 bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 p-2 sm:p-6 rounded text-xs sm:text-sm">
                <p className="font-bold mb-1">Maintenance Mode Active</p>
                <p className="hidden sm:block">
                  All users except admins will see the maintenance page.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
