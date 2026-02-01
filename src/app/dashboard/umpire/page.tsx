"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UmpireDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName");

    if (!token || role !== "UMPIRE") {
      router.push("/login");
      return;
    }

    setUserName(name || "Umpire");
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const [matchesRes, teamsRes] = await Promise.all([
        fetch("/api/matches", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleDeleteMatch = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this match? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the match from the local state
        setMatches(matches.filter((m) => m._id !== matchId));
        alert("Match deleted successfully");
      } else {
        alert("Failed to delete match");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Error deleting match");
    }
  };

  const totalMatches = matches.length;
  const completedMatches = matches.filter(
    (m: any) => m.status === "COMPLETED",
  ).length;
  const ongoingMatches = matches.filter((m: any) => m.status === "ONGOING");
  const notStartedMatches = matches.filter(
    (m: any) => m.status === "NOT_STARTED",
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-0 flex justify-between items-center sm:h-24">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src="/logo.png"
              alt="CricKeters"
              className="h-20 w-20 sm:h-32 sm:w-32 object-contain sm:-my-4"
            />
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Cricket Scoring
              </h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest">
                UMPIRE CONTROL
              </p>
            </div>
          </div>

          {/* Profile Circle Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 text-white font-bold flex items-center justify-center hover:from-blue-400 hover:to-cyan-400 transition duration-300 shadow-lg hover:shadow-cyan-500/50"
              title={userName}
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 text-white rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="font-semibold text-sm">{userName}</p>
                  <p className="text-xs text-slate-400">👨‍⚖️ Umpire</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-700 text-red-400 hover:text-red-300 font-semibold text-sm transition"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Ongoing Matches Section - Moved to Top */}
        {ongoingMatches.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              🔴 Live Matches
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ongoingMatches.map((match: any) => (
                <Link
                  key={match._id}
                  href={`/matches/${match._id}/live-score`}
                  className="relative overflow-hidden rounded-lg border-2 border-green-500/50 bg-linear-to-br from-slate-900 to-slate-800 hover:border-green-400 active:border-green-300 transition-all group"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>

                  {/* Live Badge - Top Right */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-green-300">
                      LIVE
                    </span>
                  </div>

                  <div className="relative z-10 p-4">
                    {/* Match Name */}
                    {match.name && (
                      <p className="text-xs text-slate-400 mb-2 font-semibold">
                        {match.name}
                      </p>
                    )}

                    {/* Team Names */}
                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 leading-tight">
                      {match.teamA?.name}{" "}
                      <span className="text-slate-400 text-sm">vs</span>{" "}
                      {match.teamB?.name}
                    </h3>

                    {/* Match Details Compact */}
                    <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                      <span>⚾ {match.oversLimit} Overs</span>
                      {match.matchType && <span>• {match.matchType}</span>}
                    </div>

                    {/* Quick Innings Summary - Show Team Scores */}
                    {match.innings && match.innings.length > 0 && (
                      <div className="space-y-1.5 mb-4 pb-4 border-t border-slate-700">
                        {match.innings.map((inning: any) => {
                          const teamName =
                            inning.inningsNumber === 1
                              ? match.teamA?.name
                              : match.teamB?.name;
                          return (
                            <div
                              key={inning.inningsNumber}
                              className="text-xs text-slate-300 flex justify-between items-center"
                            >
                              <span className="font-semibold text-white">
                                {teamName}
                              </span>
                              <span
                                className={
                                  inning.status === "COMPLETED"
                                    ? "text-blue-400"
                                    : "text-yellow-400"
                                }
                              >
                                {inning.totalRuns}R in{" "}
                                {Math.floor(inning.totalBalls / 6)}.
                                {inning.totalBalls % 6}O
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* View and Delete Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => window.location.href = `/matches/${match._id}/live-score`}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        View Live
                        <span>→</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteMatch(match._id, e)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm rounded-lg transition-all"
                        title="Delete match"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Step-wise Flow - Only show if teams or matches don't exist */}
        {(teams.length === 0 || matches.length === 0) && (
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              🚀 Getting Started
            </h2>
            <div className="space-y-4">
              {/* Step 1: Create Teams */}
              <div
                className={`relative overflow-hidden rounded-xl border-2 p-5 sm:p-8 transition-all ${
                  teams.length === 0
                    ? "border-yellow-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70"
                    : "border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8">
                  <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                    <div
                      className={`text-4xl sm:text-6xl flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-lg shrink-0 ${
                        teams.length === 0
                          ? "bg-yellow-500/20"
                          : "bg-green-500/20"
                      }`}
                    >
                      {teams.length === 0 ? "1️⃣" : "✅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                        Step 1: Create Teams
                      </h3>
                      <p className="text-sm sm:text-base text-slate-400">
                        {teams.length === 0
                          ? "Create teams before you can start matches"
                          : `Great! You have ${teams.length} team${teams.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/teams"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-yellow-500/50 shrink-0 text-center text-sm sm:text-base"
                  >
                    {teams.length === 0 ? "Create Teams" : "Manage Teams"}
                  </Link>
                </div>
              </div>

              {/* Step 2: Create Matches */}
              <div
                className={`relative overflow-hidden rounded-xl border-2 p-5 sm:p-8 transition-all ${
                  teams.length === 0
                    ? "border-slate-600/50 bg-linear-to-br from-slate-900/50 to-slate-800/30 opacity-60"
                    : matches.length === 0
                      ? "border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70"
                      : "border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8">
                  <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                    <div
                      className={`text-4xl sm:text-6xl flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-lg shrink-0 ${
                        teams.length === 0
                          ? "bg-slate-600/20"
                          : matches.length === 0
                            ? "bg-blue-500/20"
                            : "bg-green-500/20"
                      }`}
                    >
                      {teams.length === 0
                        ? "🔒"
                        : matches.length === 0
                          ? "2️⃣"
                          : "✅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                        Step 2: Create Matches
                      </h3>
                      <p className="text-sm sm:text-base text-slate-400">
                        {teams.length === 0
                          ? "Create teams first to create matches"
                          : matches.length === 0
                            ? "Create matches between your teams"
                            : `Great! You have ${matches.length} match${matches.length !== 1 ? "es" : ""}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (teams.length > 0) {
                        router.push("/matches");
                      }
                    }}
                    disabled={teams.length === 0}
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 font-bold rounded-lg transition-all shrink-0 text-sm sm:text-base ${
                      teams.length === 0
                        ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                        : "bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/50"
                    }`}
                  >
                    {matches.length === 0 ? "Create Matches" : "Manage Matches"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Cards - Show when both teams and matches exist */}
        {teams.length > 0 && matches.length > 0 && (
          <>
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
                📊 Stats Overview
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8 group hover:border-cyan-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-cyan-300 text-xs sm:text-sm font-semibold mb-2">
                      Total Matches
                    </p>
                    <h3 className="text-3xl sm:text-5xl font-bold text-cyan-400">
                      {totalMatches}
                    </h3>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-yellow-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8 group hover:border-yellow-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-2">
                      Not Started
                    </p>
                    <h3 className="text-3xl sm:text-5xl font-bold text-yellow-400">
                      {notStartedMatches.length}
                    </h3>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8 group hover:border-green-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-green-300 text-xs sm:text-sm font-semibold mb-2">
                      Ongoing
                    </p>
                    <h3 className="text-3xl sm:text-5xl font-bold text-green-400">
                      {ongoingMatches.length}
                    </h3>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8 group hover:border-blue-400/80 transition-all">
                  <div className="relative z-10">
                    <p className="text-blue-300 text-xs sm:text-sm font-semibold mb-2">
                      Completed
                    </p>
                    <h3 className="text-3xl sm:text-5xl font-bold text-blue-400">
                      {completedMatches}
                    </h3>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Quick Actions */}
        {teams.length > 0 && matches.length > 0 && (
          <>
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <Link
                  href="/matches"
                  className="relative overflow-hidden rounded-xl border border-blue-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8 group hover:border-blue-400/80 transition-all cursor-pointer"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white">
                        🎯 Matches
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-slate-400 mb-4">
                      Create new or view existing matches
                    </p>
                    <span className="text-blue-400 font-bold group-hover:text-blue-300 transition flex items-center gap-1 text-sm sm:text-base">
                      Go to Matches{" "}
                      <span className="group-hover:translate-x-1 transition">
                        →
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/teams"
                  className="relative overflow-hidden rounded-xl border border-green-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8 group hover:border-green-400/80 transition-all cursor-pointer"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white">
                        👥 Teams
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-slate-400 mb-4">
                      Manage and create teams for matches
                    </p>
                    <span className="text-green-400 font-bold group-hover:text-green-300 transition flex items-center gap-1 text-sm sm:text-base">
                      Go to Teams{" "}
                      <span className="group-hover:translate-x-1 transition">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
