'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Trophy, Activity, AlertCircle } from 'lucide-react';

interface StatItem {
  appName: string;
  totalTimeMs: number;
}

interface StatsResponse {
  success: boolean;
  data: StatItem[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
        const res = await fetch(`${serverUrl}/api/stats?timeZone=${timeZone}`);

        if (!res.ok) throw new Error('Failed to fetch stats');

        const json: StatsResponse = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          throw new Error('API returned failure');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helpers
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const totalTimeMs = stats.reduce((acc, curr) => acc + curr.totalTimeMs, 0);
  const topApp = stats.length > 0 ? stats[0] : null;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-400 gap-2"><AlertCircle /> {error}</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Time Tracker Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">Overview of your digital activity today.</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Time</p>
                <p className="text-2xl font-bold">{formatTime(totalTimeMs)}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Top App</p>
                <p className="text-2xl font-bold truncate max-w-[150px]">{topApp?.appName || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Active Apps</p>
                <p className="text-2xl font-bold">{stats.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-6">Usage by App</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="appName"
                  type="category"
                  width={150}
                  tick={{ fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | undefined) => [formatTime(value || 0), 'Time']}
                  cursor={{ fill: '#ffffff10' }}
                />
                <Bar dataKey="totalTimeMs" radius={[0, 4, 4, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
