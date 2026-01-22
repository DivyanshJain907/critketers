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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🏏 CricKeters</h1>
            <p className="text-purple-100">Admin Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Welcome, <strong>{userName}</strong></p>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-600">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Teams</p>
            <h3 className="text-4xl font-bold text-gray-900">{stats.teams}</h3>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 border-t-4 border-green-600">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Players</p>
            <h3 className="text-4xl font-bold text-gray-900">{stats.players}</h3>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 border-t-4 border-orange-600">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Matches</p>
            <h3 className="text-4xl font-bold text-gray-900">{stats.matches}</h3>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => {
              setShowUserManagement(!showUserManagement);
              if (!showUserManagement && users.length === 0) {
                fetchUsers();
              }
            }}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer border-l-4 border-red-600"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">👤 Manage Users</h3>
            <p className="text-gray-600">View and manage all users in the system</p>
            <span className="text-red-600 font-bold mt-4 inline-block">Manage Users →</span>
          </button>

          <Link href="/teams">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer border-l-4 border-blue-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">👥 Manage Teams</h3>
              <p className="text-gray-600">View and manage all teams in the system</p>
              <span className="text-blue-600 font-bold mt-4 inline-block">Manage Teams →</span>
            </div>
          </Link>

          <Link href="/matches">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer border-l-4 border-purple-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🏏 Manage Matches</h3>
              <p className="text-gray-600">View and manage all matches in the system</p>
              <span className="text-blue-600 font-bold mt-4 inline-block">Manage Matches →</span>
            </div>
          </Link>
        </div>

        {/* User Management Section */}
        {showUserManagement && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 border-l-4 border-red-600">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">👤 User Management</h2>
            <button
              onClick={() => setShowUserManagement(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>

          {usersLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">⏳ Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created At</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'ADMIN' ? '🔧 ADMIN' : '👨‍⚖️ UMPIRE'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {user.id !== adminId ? (
                          <div className="flex gap-2 justify-center">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded hover:border-blue-500 text-sm font-semibold bg-white cursor-pointer"
                            >
                              <option value="UMPIRE">👨‍⚖️ UMPIRE</option>
                              <option value="ADMIN">🔧 ADMIN</option>
                            </select>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center items-center">
                            <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">{user.role}</span>
                            <span className="text-gray-500 text-sm">(You)</span>
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

        {/* Admin Features */}
        {!showUserManagement && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Admin Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">System Monitoring</h4>
              <p className="text-gray-600 text-sm">Monitor all users and system activity</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">User Management</h4>
              <p className="text-gray-600 text-sm">Manage user roles and permissions</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Database Management</h4>
              <p className="text-gray-600 text-sm">View and manage all data</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">System Settings</h4>
              <p className="text-gray-600 text-sm">Configure system-wide settings</p>
            </div>
          </div>
        </div>
        )}

        {/* Maintenance Mode */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔧 Maintenance Mode</h2>
              <p className="text-gray-600">Enable or disable maintenance mode for all users</p>
            </div>
            <div className={`px-6 py-3 rounded-lg font-bold text-white ${maintenanceMode ? 'bg-red-600' : 'bg-green-600'}`}>
              {maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Maintenance Message</label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              rows={4}
              placeholder="Enter maintenance message..."
            />
          </div>

          <button
            onClick={toggleMaintenanceMode}
            disabled={maintenanceLoading}
            className={`px-6 py-3 rounded-lg font-bold text-white transition ${
              maintenanceLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : maintenanceMode
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {maintenanceLoading ? '⏳ Updating...' : maintenanceMode ? '✓ Disable Maintenance Mode' : '✗ Enable Maintenance Mode'}
          </button>

          {maintenanceMode && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
              <p className="font-semibold mb-2">⚠️ Maintenance Mode is Currently Active</p>
              <p className="text-sm">
                All users except admins will see the maintenance page. When you disable it, users will be able to access the application again.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
