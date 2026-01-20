'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ teams: 0, matches: 0, players: 0 });
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System maintenance is in progress. Please check back soon.');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUserName(name || 'Admin');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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

        {/* Admin Features */}
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
