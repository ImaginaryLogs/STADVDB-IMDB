"use client";

import {
  PopularActors,
  PopularGenres,
  RatingVotesCorrelation,
  RatioProfessionsCrewMember,
  SuccessGenreDecade,
  TopOscarByCategory,
} from "@/lib/queries";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

interface DashboardStats {
  totalMovies: number;
  totalPersons: number;
  totalAwards: number;
  avgRating: number;
  // EDA - Roll-up
  popularActors: PopularActors[];
  genreDistribution: PopularGenres[];
  crewProfessionRatio: RatioProfessionsCrewMember[];
  // Charts
  bestFilmGenre: PopularGenres[];
  actorGenrePopularity: {
    actor: string;
    genre: string;
    movieCount: number;
    avgRating: number;
  }[];
  genreSuccessTrend?: {
    year: number;
    successCount: number;
    avgRating: number;
  }[];
  // Stats
  correlationRatingsVotes: RatingVotesCorrelation[];
  topOscarAwards: TopOscarByCategory[];
  // Actor Profile
  actorProfile?: {
    actor: string;
    totalMovies: number;
    avgRating: number;
    totalVotes: number;
    topGenres: { genre: string; count: number; avgRating: number }[];
    recentMovies: {
      title: string;
      year: number;
      genre: string;
      rating: number;
      votes: number;
    }[];
  };
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

const getEmptyData = (): DashboardStats => ({
  totalMovies: 0,
  totalPersons: 0,
  totalAwards: 0,
  avgRating: 0,
  popularActors: [],
  genreDistribution: [],
  crewProfessionRatio: [],
  bestFilmGenre: [],
  actorGenrePopularity: [],
  correlationRatingsVotes: [],
  topOscarAwards: [],
});

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(getEmptyData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [formGenre, setFormGenre] = useState("Action");
  const [formDecade, setFormDecade] = useState("2010");
  const [formAfterYear, setFormAfterYear] = useState("2020");
  const [trendLoading, setTrendLoading] = useState(false);

  // Best Film Genre decade state
  const [bestGenreDecade, setBestGenreDecade] = useState("2010");
  const [bestGenreLoading, setBestGenreLoading] = useState(false);

  // Actor search state
  const [actorName, setActorName] = useState("");
  const [actorSearchLoading, setActorSearchLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all initial dashboard data
  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [
        popularActorsRes,
        popularGenresRes,
        crewProfessionsRes,
        correlationRes,
        oscarAwardsRes,
      ] = await Promise.all([
        fetch("/api/get-popular-actors"),
        fetch("/api/get-popular-genres"),
        fetch("/api/get-ratio-crew-professions"),
        fetch("/api/get-correlation-rating-votes"),
        fetch("/api/get-top-oscar-awards"),
      ]);

      const [
        popularActorsData,
        popularGenresData,
        crewProfessionsData,
        correlationData,
        oscarAwardsData,
      ] = await Promise.all([
        popularActorsRes.json(),
        popularGenresRes.json(),
        crewProfessionsRes.json(),
        correlationRes.json(),
        oscarAwardsRes.json(),
      ]);

      setStats((prev) => ({
        ...prev,
        popularActors: popularActorsData || [],
        genreDistribution: popularGenresData || [],
        crewProfessionRatio: crewProfessionsData || [],
        correlationRatingsVotes: correlationData.data || [],
        topOscarAwards: oscarAwardsData || [],
      }));
    } catch (err: any) {
      console.error("Dashboard data fetch error:", err);
      throw err;
    }
  };

  // Fetch genre success by decade
  const fetchGenreSuccessByDecade = async (decade: string) => {
    try {
      const res = await fetch("/api/post-genre-decade-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decade }),
      });

      if (!res.ok) throw new Error("Failed to fetch genre success");
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error("Genre success fetch error:", err);
      throw err;
    }
  };

  // Fetch movie genre success trend
  const fetchMovieGenreTrend = async (
    genre: string,
    range_before: string,
    range_after: string
  ) => {
    try {
      const res = await fetch("/api/post-movie-genre-decade-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, range_before, range_after }),
      });

      if (!res.ok) throw new Error("Failed to fetch movie trend");
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error("Movie trend fetch error:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const initializeDashboard = async () => {
      setLoading(true);
      try {
        // Fetch main dashboard data
        await fetchDashboardData();

        // Fetch initial best genre data for 2010s
        const bestGenreData = await fetchGenreSuccessByDecade("2010");
        setStats((prev) => ({ ...prev, bestFilmGenre: bestGenreData }));

        // Fetch initial trend data for Action in 2010s
        const trendData = await fetchMovieGenreTrend("Action", "2010", "2020");
        setStats((prev) => ({ ...prev, genreSuccessTrend: trendData }));

        setError(null);
        setErrorDetails(null);
      } catch (err: any) {
        console.error("API error:", err);
        setError("Failed to load data from database");
        setErrorDetails(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [mounted]);

  const handleTrendSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setTrendLoading(true);
    try {
      const trendData = await fetchMovieGenreTrend(
        formGenre,
        formDecade,
        formAfterYear
      );
      setStats((prev) => ({ ...prev, genreSuccessTrend: trendData }));

      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setTrendLoading(false);
    }
  };

  const handleBestGenreDecadeChange = async (decade: string) => {
    setBestGenreDecade(decade);
    setBestGenreLoading(true);
    try {
      const bestGenreData = await fetchGenreSuccessByDecade(decade);
      setStats((prev) => ({ ...prev, bestFilmGenre: bestGenreData }));
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setBestGenreLoading(false);
    }
  };

  const handleActorSearch = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!actorName.trim()) return;

    setActorSearchLoading(true);
    try {
      const res = await fetch("/api/post-popular-movies-of-actor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: actorName }),
      });

      if (!res.ok) throw new Error("Actor search failed");
      const data = await res.json();

      setStats((prev) => ({
        ...prev,
        actorProfile: {
          actor: actorName,
          totalMovies: data.length,
          avgRating:
            data.reduce((sum: number, m: any) => sum + m.rating, 0) /
              data.length || 0,
          totalVotes: data.reduce((sum: number, m: any) => sum + m.votes, 0),
          topGenres: [],
          recentMovies: data,
        },
      }));
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setActorSearchLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading IMDb Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 max-w-2xl">
          <h2 className="text-white text-2xl font-bold mb-4">
            ⚠️ Error Loading Data
          </h2>
          <p className="text-red-200 mb-4">{error}</p>
          {errorDetails && (
            <details className="text-red-300 text-sm">
              <summary className="cursor-pointer mb-2">Show Details</summary>
              <pre className="bg-black/30 p-4 rounded overflow-auto">
                {errorDetails}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          📊 IMDb Analytics Dashboard
        </h1>

        {/* EDA Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📈</span>
            EDA - Exploratory Data Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Popular Actors Tables (Roll-up) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🌟
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Popular Actors
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Roll-up by movie count
                  </p>
                </div>
              </div>
              {stats.popularActors.length > 0 ? (
                <div className="space-y-3">
                  {stats.popularActors.map((actor, index) => (
                    <div
                      key={actor.actor_rank}
                      className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-700/50 dark:to-pink-900/20 rounded-xl"
                    >
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-white">
                          {actor.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {actor.total_titles} movies
                        </div>
                      </div>
                      <div className="text-xl font-bold text-pink-600">
                        ⭐ {actor.avg_rating ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No data available
                </p>
              )}
            </div>

            {/* Popular Genres Tables (Roll-up) - INCREASED HEIGHT */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎬
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Popular Genres
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Roll-up by volume
                  </p>
                </div>
              </div>
              {stats.genreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats.genreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(100, 100, 100, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No data available
                </p>
              )}
            </div>

            {/* Popular Movies of GIVEN Actor (Roll-up, Slice) - TABLE FORMAT */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎭
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Popular Movies of Actor
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Roll-up, Slice by actor
                  </p>
                </div>
              </div>

              <form onSubmit={handleActorSearch} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={actorName}
                    onChange={(e) => setActorName(e.target.value)}
                    placeholder="Enter actor name..."
                    className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={actorSearchLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actorSearchLoading ? "..." : "Search"}
                  </button>
                </div>
              </form>

              {stats.actorProfile ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-blue-900/20 rounded-xl mb-3">
                    <div className="font-bold text-gray-800 dark:text-white mb-1">
                      🎬 {stats.actorProfile.actor}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {stats.actorProfile.totalMovies} movies • ⭐{" "}
                      {stats.actorProfile.avgRating.toFixed(1)}
                    </div>
                  </div>

                  {/* TABLE FORMAT */}
                  <div className="overflow-auto max-h-[280px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left p-2 font-semibold text-gray-700 dark:text-gray-300">
                            Movie
                          </th>
                          <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">
                            Year
                          </th>
                          <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">
                            Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.actorProfile.recentMovies
                          .slice(0, 10)
                          .map((movie, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td className="p-2 text-gray-800 dark:text-white font-medium">
                                {movie.title}
                              </td>
                              <td className="text-center p-2 text-gray-600 dark:text-gray-400">
                                {movie.year}
                              </td>
                              <td className="text-center p-2 font-semibold text-blue-600 dark:text-blue-400">
                                ⭐ {movie.rating.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8 text-sm">
                  Search for an actor above
                </p>
              )}
            </div>
            {/* Top Oscar Awards */}
            <div className="overflow-x-auto rounded-2xl shadow bg-white">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left">Award Class</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Total Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topOscarAwards.map((item, i) => (
                    <tr
                      key={i}
                      className={`border-t hover:bg-gray-50 transition ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">{item.award_class}</td>
                      <td className="px-4 py-3">{item.canonical_category}</td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                        {item.total_wins}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Charts - Visualizations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Best Film Genre (Roll-up) WITH DECADE INPUT */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎭
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Best Film Genres
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Slice - Success by decade
                  </p>
                </div>
              </div>

              {/* Decade Selector */}
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Select Decade
                </label>
                <select
                  value={bestGenreDecade}
                  onChange={(e) => handleBestGenreDecadeChange(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={bestGenreLoading}
                >
                  {["1980", "1990", "2000", "2010", "2020"].map((decade) => (
                    <option key={decade} value={decade}>
                      {decade}s
                    </option>
                  ))}
                </select>
              </div>

              {bestGenreLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : stats.bestFilmGenre.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.bestFilmGenre}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="genre"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      angle={-20}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(100, 100, 100, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="avgRating"
                      fill="#10B981"
                      name="Avg Rating"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="successRate"
                      fill="#3B82F6"
                      name="Success Rate %"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No data available
                </p>
              )}
            </div>

            {/* Crew Profession Ratio (Roll-up Pie) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🥧
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Professions
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Roll-up pie chart
                  </p>
                </div>
              </div>
              {stats.crewProfessionRatio.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.crewProfessionRatio}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ profession, count }) =>
                        `${profession} ${count}%`
                      }
                      outerRadius={90}
                      dataKey="percentage"
                    >
                      {stats.crewProfessionRatio.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No data available
                </p>
              )}
            </div>

            {/* Successful Movies by Genre (Dice) - LINE CHART */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    📈
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Successful Movies
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Dice - by genre & decade
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleTrendSubmit}
                className="flex flex-wrap items-end gap-2 mb-4"
              >
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Genre
                  </label>
                  <input
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value)}
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Action"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Year Before
                  </label>
                  <select
                    value={formDecade}
                    onChange={(e) => setFormDecade(e.target.value)}
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {["1980", "1990", "2000", "2010", "2020"].map((decade) => (
                      <option key={decade} value={decade}>
                        {decade}s
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Year After
                  </label>
                  <select
                    value={formAfterYear}
                    onChange={(e) => setFormAfterYear(e.target.value)}
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {["1980", "1990", "2000", "2010", "2020"].map((decade) => (
                      <option key={decade} value={decade}>
                        {decade}s
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  disabled={trendLoading}
                >
                  {trendLoading ? "..." : "Go"}
                </button>
              </form>

              {trendLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : stats.genreSuccessTrend &&
                stats.genreSuccessTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.genreSuccessTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      stroke="#6b7280"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#10B981"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#3B82F6"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(100, 100, 100, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="successCount"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      name="Success Count"
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgRating"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      name="Avg Rating"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm space-y-2">
                  <p>No data for this combination.</p>
                  <p className="text-xs">
                    Try: Genre: "Action" or "Drama", Decade: "2010"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📐</span>
            Stats - Statistical Tests
          </h2>

          <div className="grid grid-cols-1 gap-8">
            {/* Correlation Test (Roll-up) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    📊
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Correlation Test
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Roll-up - Ratings vs Votes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pearson r
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.correlationRatingsVotes[0].pearson_r || "N/A"}
                  </p>
                </div>
              </div>
              {stats.correlationRatingsVotes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      dataKey="votes"
                      name="Votes"
                      tick={{ fill: "#6b7280" }}
                    />
                    <YAxis
                      type="number"
                      dataKey="rating"
                      name="Rating"
                      tick={{ fill: "#6b7280" }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                      }}
                    />
                    <Scatter
                      name="Movies"
                      data={stats.correlationRatingsVotes}
                      fill="#3B82F6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-sm py-6 border-t border-gray-700">
        <p>
          📊 IMDb Analytics Dashboard • Built with Next.js & Recharts • MySQL
          Database
        </p>
        <p className="text-xs mt-2 text-gray-500">
          Roan Cedric Campo • STADVDB Project
        </p>
      </div>
    </div>
  );
}
