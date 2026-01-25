"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  shortCode?: string;
  players: any[];
  createdAt: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCode, setNewTeamCode] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);

    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/teams", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeamName,
          shortCode: newTeamCode || undefined,
        }),
      });

      if (response.ok) {
        setNewTeamName("");
        setNewTeamCode("");
        fetchTeams();
      }
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleDeleteTeam = async (e: React.MouseEvent, teamId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this team? All players in this team will also be deleted. This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTeams();
      } else {
        alert("Failed to delete team");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Error deleting team");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="pointer-events-none">
        {/* Dot Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="30"
              y="30"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="15" cy="15" r="1.5" fill="#06b6d4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Header */}
      <header className="z-50 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-0 flex justify-between items-center sm:h-24">
          <Link
            href="/dashboard/umpire"
            className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/logo.png"
              alt="CricKeters"
              className="h-12 w-12 sm:h-20 sm:w-20 lg:h-32 lg:w-32 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Team Management
              </h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">
                CREATE & MANAGE TEAMS
              </p>
            </div>
          </div>
          <Link
            href="/matches"
            className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
          >
            Matches →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Create Team Form */}
        <section className="mb-8 sm:mb-12">
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
              🏗️ Create New Team
            </h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 sm:mb-3">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Mumbai Tigers"
                    className="w-full px-3 sm:px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 sm:mb-3">
                    Short Code
                  </label>
                  <input
                    type="text"
                    value={newTeamCode}
                    onChange={(e) =>
                      setNewTeamCode(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., MT"
                    maxLength={3}
                    className="w-full px-3 sm:px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-3 sm:px-4 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 text-sm sm:text-base"
                  >
                    ✓ Create Team
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Teams List */}
        <section>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-8">
            📋 Your Teams
          </h2>
          {loading ? (
            <div className="text-center text-slate-400 py-12 sm:py-16 text-base sm:text-lg">
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-8 sm:p-16 text-center">
              <div className="text-5xl sm:text-7xl mb-4">📭</div>
              <p className="text-slate-400 text-base sm:text-lg">
                No teams yet. Create your first team above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <div className="group relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-4 sm:p-8 hover:border-cyan-400/80 transition-all cursor-pointer">
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg sm:text-2xl font-bold text-white">
                            {team.name}
                            {team.shortCode && (
                              <span className="text-xs sm:text-sm text-cyan-400 ml-2">
                                ({team.shortCode})
                              </span>
                            )}
                          </h3>
                        </div>
                        {isLoggedIn && (
                          <button
                            onClick={(e) => handleDeleteTeam(e, team.id)}
                            className="px-2 sm:px-3 py-2 bg-red-600/30 text-red-400 hover:bg-red-600/50 rounded-lg font-bold text-sm transition-all"
                            title="Delete team"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="text-cyan-300 mb-4 text-sm sm:text-base">
                        👥 <strong>{team.players?.length || 0}</strong> players
                      </p>
                      <span className="text-cyan-400 font-bold group-hover:text-cyan-300 transition flex items-center gap-1 text-sm sm:text-base">
                        View Team{" "}
                        <span className="group-hover:translate-x-1 transition">
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
