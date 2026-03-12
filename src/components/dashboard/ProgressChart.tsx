import React, { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { API_URL } from '../../config';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export interface IActivity {
  _id: string;
  name: string;
  calories: number;
  active: number;
}

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  gradientId: string;
}

const allSeries: SeriesConfig[] = [
  { key: 'calories', label: 'Consumidas', color: '#8b5cf6', gradientId: 'colorCalories' },
  { key: 'active', label: 'Quemadas', color: '#22d3ee', gradientId: 'colorActive' },
  { key: 'protein', label: 'Proteína', color: '#f59e0b', gradientId: 'colorProtein' },
  { key: 'sleep', label: 'Sueño', color: '#10b981', gradientId: 'colorSleep' },
];

export const ProgressChart: React.FC<{ refreshKey?: number }> = ({ refreshKey = 0 }) => {
  const { user } = useAuth();
  const [data, setData] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Esta Semana');
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(['calories', 'active']));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/activity`, {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        });
        if (response.ok) {
          const jsonData = await response.json();
          setData(jsonData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user, refreshKey]);

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // Always keep at least 1
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getDisplayData = () => {
    const base = (() => {
      switch (filter) {
        case 'Semana Pasada':
          return data.map(d => ({ ...d, calories: d.calories * 0.85, active: d.active * 0.75 }));
        case 'Este Mes':
          return data.map(d => ({ ...d, calories: d.calories * 4.2, active: d.active * 3.8 }));
        default:
          return data;
      }
    })();

    // Add simulated protein and sleep data for demo
    return base.map((d: any) => ({
      ...d,
      protein: Math.round(80 + Math.random() * 70 + (d.active || 0) * 0.05),
      sleep: +(6 + Math.random() * 2.5).toFixed(1),
    }));
  };

  const displayData = getDisplayData();

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Resumen de Actividad</h3>
          <p className="text-sm text-slate-400">Datos {filter.toLowerCase()}</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="Esta Semana">Esta Semana</option>
          <option value="Semana Pasada">Semana Pasada</option>
          <option value="Este Mes">Este Mes</option>
        </select>
      </div>

      {/* Series Toggle Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allSeries.map(s => (
          <button
            key={s.key}
            onClick={() => toggleSeries(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${visibleSeries.has(s.key)
                ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                : 'bg-transparent border-slate-700/50 text-slate-500 hover:text-slate-300'
              }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: visibleSeries.has(s.key) ? s.color : '#475569' }} />
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        </div>
      ) : (

        <div className="flex-1 w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {allSeries.map(s => (
                  <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(51, 65, 85, 0.5)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#e2e8f0', fontSize: '14px' }}
              />
              {allSeries.filter(s => visibleSeries.has(s.key)).map(s => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${s.gradientId})`}
                  activeDot={{ r: 5, strokeWidth: 0, fill: s.color }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
