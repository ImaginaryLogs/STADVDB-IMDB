"use client";

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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface DashboardStats {
  totalMovies: number;
  totalPersons: number;
  totalAwards: number;
  avgRating: number;
  genreDistribution: { name: string; value: number }[];
  ratingsTrend: { year: number; avgRating: number; count: number }[];
  topRatedMovies: { title: string; rating: number; votes: number }[];
  awardsByCategory: { category: string; count: number }[];
  popularActors: { name: string; movieCount: number; avgRating: number }[];
  successfulCrewMembers: { name: string; successRate: number; totalMovies: number }[];
  bestFilmGenre: { genre: string; avgRating: number; count: number; successRate: number }[];
  ratioActorProfession: { profession: string; count: number; percentage: number }[];
  popularityActorGenre: { genre: string; actorCount: number; avgRating: number }[];
  correlationRatingsVotes: { rating: number; votes: number; title: string }[];
  chiSquareTest: { genre: string; awardWinners: number; nonWinners: number; chiSquare: number }[];
  arima: { year: number; actual: number; predicted: number }[];
  independenceTest: { category: string; male: number; female: number; pValue: number }[];
  hypothesisTesting: { genre: string; avgRating: number; sampleSize: number; tStat: number; pValue: number }[];
  actorSuccessByYear: { actor: string; year: number; avgRating: number; movieCount: number }[];
  crewProfessionRatio: { profession: string; count: number; percentage: number }[];
  actorGenrePopularity: { actor: string; genre: string; movieCount: number; avgRating: number }[];
  pearsonCorrelation?: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const getEmptyData = (): DashboardStats => ({
  totalMovies: 0,
  totalPersons: 0,
  totalAwards: 0,
  avgRating: 0,
  genreDistribution: [],
  ratingsTrend: [],
  topRatedMovies: [],
  awardsByCategory: [],
  popularActors: [],
  successfulCrewMembers: [],
  bestFilmGenre: [],
  ratioActorProfession: [],
  popularityActorGenre: [],
  correlationRatingsVotes: [],
  chiSquareTest: [],
  arima: [],
  independenceTest: [],
  hypothesisTesting: [],
  actorSuccessByYear: [],
  crewProfessionRatio: [],
  actorGenrePopularity: [],
});

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(getEmptyData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "testing">("overview");
  const [selectedActor, setSelectedActor] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch('/api')
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.details || data.error || 'API error');
        }
        return data;
      })
      .then(data => {
        if (data.error) throw new Error(data.details || data.error);
        setStats(data);
        
        // Set default selected actor from the data
        if (data.actorSuccessByYear && data.actorSuccessByYear.length > 0) {
          setSelectedActor(data.actorSuccessByYear[0].actor);
        }
        
        setError(null);
        setErrorDetails(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('API error:', err);
        setError('Failed to load data from CSV files');
        setErrorDetails(err.message || 'Unknown error');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading IMDb Analytics...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Parsing CSV data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border-l-8 border-red-500">
            <div className="flex items-center mb-4">
              <svg className="w-12 h-12 text-red-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Error Loading Data</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            {errorDetails && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <p className="font-mono text-sm text-red-800 dark:text-red-200">{errorDetails}</p>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>Ensure sample_data folder exists in project root</li>
                <li>Verify all required CSV files are present</li>
                <li>Check terminal logs for detailed error messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter actor success data by selected actor
  const actorSuccessData = stats.actorSuccessByYear.filter(d => d.actor === selectedActor);
  const actorGenreData = stats.actorGenrePopularity.filter(d => d.actor === selectedActor);
  const uniqueActors = [...new Set(stats.actorSuccessByYear.map(d => d.actor))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                IMDb Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📊 Statistical analysis powered by CSV data • {stats.totalMovies.toLocaleString()} movies analyzed
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Correlation</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.pearsonCorrelation?.toFixed(3) || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 p-2">
          <div className="flex gap-2">
            {[
              { id: "overview", label: "📈 Overview", icon: "📈" },
              { id: "charts", label: "📊 Visualizations", icon: "📊" },
              { id: "testing", label: "🧪 Statistical Tests", icon: "🧪" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-xl mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Movies", value: stats.totalMovies, icon: "🎬", color: "from-blue-500 to-blue-600" },
                { label: "Total Persons", value: stats.totalPersons, icon: "👥", color: "from-green-500 to-green-600" },
                { label: "Total Awards", value: stats.totalAwards, icon: "🏆", color: "from-yellow-500 to-yellow-600" },
                { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: "⭐", color: "from-purple-500 to-purple-600" },
              ].map((metric, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-200">
                  <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                    {metric.icon}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{metric.label}</div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</div>
                </div>
              ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Successful Crew Members */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    👨‍💼
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Top Crew Members</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Based on ratings & votes</p>
                  </div>
                </div>
                {stats.successfulCrewMembers.length > 0 ? (
                  <div className="space-y-4">
                    {stats.successfulCrewMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-white">{member.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{member.totalMovies} movies</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-500">{member.successRate.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">success rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No data available</p>
                )}
              </div>

              {/* Popular Genres */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    🎭
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Genre Distribution</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Most popular genres</p>
                  </div>
                </div>
                {stats.genreDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.genreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-center py-8">No data available</p>
                )}
              </div>

              {/* Popular Actors */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    🌟
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Popular Actors</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">By movie count & ratings</p>
                  </div>
                </div>
                {stats.popularActors.length > 0 ? (
                  <div className="space-y-3">
                    {stats.popularActors.map((actor, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-blue-900/20 rounded-xl border-l-4 border-yellow-500">
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-white">{actor.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{actor.movieCount} movies</div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-yellow-500 mr-1">⭐</span>
                          <span className="text-xl font-bold text-gray-800 dark:text-white">{actor.avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No data available</p>
                )}
              </div>

              {/* Best Film Genre */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    🏆
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Best Film Genres</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Past decade performance</p>
                  </div>
                </div>
                {stats.bestFilmGenre.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.bestFilmGenre} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="genre" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="avgRating" fill="#10B981" name="Avg Rating" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-center py-8">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Actor Success Line Graph */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    📈
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Actor Success Timeline</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Performance over years</p>
                  </div>
                </div>
              </div>
              {uniqueActors.length > 0 ? (
                <>
                  <select 
                    value={selectedActor} 
                    onChange={(e) => setSelectedActor(e.target.value)}
                    className="w-full mb-4 p-3 border-2 border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {uniqueActors.map(actor => (
                      <option key={actor} value={actor}>{actor}</option>
                    ))}
                  </select>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={actorSuccessData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#6b7280' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="avgRating" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} name="Avg Rating" />
                      <Line yAxisId="right" type="monotone" dataKey="movieCount" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} name="Movie Count" />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Ratings Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  📊
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ratings Trend</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Year-over-year analysis</p>
                </div>
              </div>
              {stats.ratingsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.ratingsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="avgRating" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} name="Avg Rating" />
                    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} name="Movie Count" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Awards by Category */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🏅
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Awards Distribution</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">By category</p>
                </div>
              </div>
              {stats.awardsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.awardsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" angle={-20} textAnchor="end" height={100} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Crew Profession Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🥧
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Crew Professions</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Distribution ratio</p>
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
                      label={({ profession, percentage }) => `${profession} ${percentage.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {stats.crewProfessionRatio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Genre Distribution Pie */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎬
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Genre Breakdown</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Percentage distribution</p>
                </div>
              </div>
              {stats.genreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.genreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.genreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Actor Genre Popularity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎭
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Actor Genre Popularity</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Genre preference by actor</p>
                </div>
              </div>
              {actorGenreData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={actorGenreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="genre" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#6b7280' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="movieCount" fill="#3B82F6" name="Movie Count" radius={[8, 8, 0, 0]} />
                    <Bar yAxisId="right" dataKey="avgRating" fill="#10B981" name="Avg Rating" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Scatter Plot */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  ⚡
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ratings vs Votes</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Correlation analysis</p>
                </div>
              </div>
              {stats.correlationRatingsVotes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" dataKey="votes" name="Votes" tick={{ fill: '#6b7280' }} />
                    <YAxis type="number" dataKey="rating" name="Rating" tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Scatter name="Movies" data={stats.correlationRatingsVotes} fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Radar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎯
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Genre Popularity Radar</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Multi-dimensional view</p>
                </div>
              </div>
              {stats.popularityActorGenre.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={stats.popularityActorGenre}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="genre" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: '#6b7280' }} />
                    <Radar name="Actor Count" dataKey="actorCount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === "testing" && (
          <div className="space-y-8">
            {/* Correlation Test */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-xl mr-3">
                    📊
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pearson Correlation Test</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ratings vs Votes correlation</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Correlation Coefficient</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.pearsonCorrelation?.toFixed(4) || 'N/A'}
                  </p>
                </div>
              </div>
              {stats.correlationRatingsVotes.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" dataKey="votes" name="Number of Votes" tick={{ fill: '#6b7280' }} />
                    <YAxis type="number" dataKey="rating" name="Average Rating" tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend />
                    <Scatter name="Movies" data={stats.correlationRatingsVotes} fill="#3B82F6" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Chi-Square Test */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🧪
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chi-Square Test</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Genre vs Award Winners (Independence Test)</p>
                </div>
              </div>
              {stats.chiSquareTest.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Genre</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Winners</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Non-Winners</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">χ²</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.chiSquareTest.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 font-semibold text-gray-800 dark:text-white">{row.genre}</td>
                          <td className="text-right p-4 text-gray-600 dark:text-gray-300">{row.awardWinners}</td>
                          <td className="text-right p-4 text-gray-600 dark:text-gray-300">{row.nonWinners}</td>
                          <td className="text-right p-4 font-mono text-gray-800 dark:text-white">{row.chiSquare.toFixed(2)}</td>
                          <td className="text-right p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${row.chiSquare > 3.841 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                              {row.chiSquare > 3.841 ? "✓ Significant" : "○ Not Significant"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* ARIMA Forecasting */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  📈
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Time Series Forecasting (ARIMA)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Predicted vs actual movie releases</p>
                </div>
              </div>
              {stats.arima.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={stats.arima}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} name="Actual" dot={{ r: 6 }} />
                    <Line type="monotone" dataKey="predicted" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" name="Predicted" dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Independence Test */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🔬
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Independence Test</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gender vs Award Category (Chi-Square)</p>
                </div>
              </div>
              {stats.independenceTest.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Male</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Female</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">P-Value</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.independenceTest.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 font-semibold text-gray-800 dark:text-white">{row.category}</td>
                          <td className="text-right p-4 text-gray-600 dark:text-gray-300">{row.male}</td>
                          <td className="text-right p-4 text-gray-600 dark:text-gray-300">{row.female}</td>
                          <td className="text-right p-4 font-mono text-gray-800 dark:text-white">{row.pValue.toFixed(4)}</td>
                          <td className="text-right p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${row.pValue < 0.05 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                              {row.pValue < 0.05 ? "✗ Dependent" : "✓ Independent"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Hypothesis Testing */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-xl mr-3">
                  🎓
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hypothesis Testing (T-Test)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Genre ratings vs population mean</p>
                </div>
              </div>
              {stats.hypothesisTesting.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Genre</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Avg Rating</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Sample Size</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">T-Statistic</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">P-Value</th>
                        <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.hypothesisTesting.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 font-semibold text-gray-800 dark:text-white">{row.genre}</td>
                          <td className="text-right p-4 text-gray-600 dark:text-gray-300">{row.avgRating.toFixed(2)}</td>
                          <td className="text-right p-4 text-gray-600 dark:text-gray-300">{row.sampleSize.toLocaleString()}</td>
                          <td className="text-right p-4 font-mono text-gray-800 dark:text-white">{row.tStat.toFixed(2)}</td>
                          <td className="text-right p-4 font-mono text-gray-800 dark:text-white">{row.pValue.toFixed(4)}</td>
                          <td className="text-right p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${row.pValue < 0.05 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                              {row.pValue < 0.05 ? "✓ Significant" : "○ Not Significant"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            📊 IMDb Statistical Analysis Dashboard • Built with Next.js & Recharts • Data from CSV files
          </p>
        </div>
      </div>
    </div>
  );
}
