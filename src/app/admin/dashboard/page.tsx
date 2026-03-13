'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface DayPoint {
  date: string;
  count: number;
}

interface AdminStats {
  users: {
    total: number;
    todayActive: number;
    growth: DayPoint[];
    dailyActive: DayPoint[];
  };
}

// --------------- AreaChart component ---------------
const CHART_W = 560;
const CHART_H = 120;
const TICK_IDXS = [0, 5, 10, 15, 20, 25, 29] as const;

function formatDay(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDayLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function AreaChart({
  title,
  data,
  stroke,
  stopColor,
  gradId,
}: {
  title: string;
  data: DayPoint[];
  stroke: string;
  stopColor: string;
  gradId: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const last = data.length - 1;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const activeIndex = hoveredIndex ?? Math.max(last, 0);

  const pts = data.map((d, i) => ({
    x: last > 0 ? (i / last) * CHART_W : 0,
    y: CHART_H - (d.count / maxVal) * (CHART_H * 0.88),
    v: d.count,
    date: d.date,
  }));

  const activePoint = pts[activeIndex];
  const tooltipWidth = 130;
  const tooltipX = Math.min(
    Math.max((activePoint?.x ?? 0) - tooltipWidth / 2, 8),
    CHART_W - tooltipWidth - 8
  );

  const linePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPoints = [
    `0,${CHART_H}`,
    ...pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `${CHART_W},${CHART_H}`,
  ].join(' ');

  const tickLabels = TICK_IDXS.filter((i) => i <= last).map((i) =>
    data[i]?.date ? formatDay(data[i].date) : ''
  );

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Showing
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {data[0]?.date ? formatDayLong(data[0].date) : 'No data'}
            <span className="mx-2 text-slate-500">to</span>
            {data[last]?.date ? formatDayLong(data[last].date) : 'No data'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Hovered Point
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {activePoint?.date ? formatDayLong(activePoint.date) : 'No data'}
          </p>
          <p className="text-xs text-slate-400">
            {activePoint?.v ?? 0} {title}
          </p>
        </div>
      </div>

      <div className="relative rounded-3xl border border-white/8 bg-black/10 p-4">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="h-40 w-full"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stopColor} stopOpacity="0.38" />
              <stop offset="88%" stopColor={stopColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {([0.25, 0.5, 0.75] as const).map((t) => (
            <line
              key={t}
              x1="0"
              y1={(CHART_H * (1 - t)).toFixed(1)}
              x2={CHART_W}
              y2={(CHART_H * (1 - t)).toFixed(1)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}

          {activePoint ? (
            <>
              <line
                x1={activePoint.x.toFixed(1)}
                y1="0"
                x2={activePoint.x.toFixed(1)}
                y2={CHART_H}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <g transform={`translate(${tooltipX.toFixed(1)} 4)`}>
                <rect
                  x="0"
                  y="0"
                  width={tooltipWidth}
                  height="42"
                  rx="12"
                  fill="rgba(2,6,23,0.94)"
                  stroke="rgba(255,255,255,0.10)"
                />
                <text x="10" y="16" fill="rgba(148,163,184,1)" fontSize="8" letterSpacing="1.4">
                  {title.toUpperCase()}
                </text>
                <text x="10" y="28" fill="white" fontSize="10" fontWeight="600">
                  {activePoint.date ? formatDay(activePoint.date) : 'No data'}
                </text>
                <text x="10" y="38" fill="rgba(203,213,225,1)" fontSize="9">
                  {activePoint.v} users
                </text>
              </g>
            </>
          ) : null}

          <polygon points={areaPoints} fill={`url(#${gradId})`} />

          <polyline
            points={linePoints}
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pts.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r="10"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onFocus={() => setHoveredIndex(i)}
              />
              <circle
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r={i === activeIndex ? '5' : '3'}
                fill={stroke}
                opacity={p.v > 0 || i === activeIndex ? '0.95' : '0.35'}
              />
              {i === activeIndex ? (
                <circle
                  cx={p.x.toFixed(1)}
                  cy={p.y.toFixed(1)}
                  r="9"
                  fill="transparent"
                  stroke={stroke}
                  strokeOpacity="0.28"
                  strokeWidth="2"
                />
              ) : null}
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-7 gap-2 text-[10px] text-slate-500">
        {tickLabels.map((label, i) => (
          <span key={i} className="text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// --------------- Main page ---------------
export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStats({
            users: {
              total: data.users.regular ?? 0,
              todayActive: data.users.todayActive ?? 0,
              growth: data.users.growth ?? [],
              dailyActive: data.users.dailyActive ?? [],
            },
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
      </div>
    );
  }

  const growth = stats?.users.growth ?? [];
  const dailyActive = stats?.users.dailyActive ?? [];
  const totalRegular = stats?.users.total ?? 0;
  const newThisMonth = growth.reduce((sum, d) => sum + d.count, 0);
  const todayActive = stats?.users.todayActive ?? 0;

  const emptyDays: DayPoint[] = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
    count: 0,
  }));

  const growthData = growth.length > 0 ? growth : emptyDays;
  const activeData = dailyActive.length > 0 ? dailyActive : emptyDays;

  const statCards = [
    {
      title: 'Total Users',
      value: totalRegular,
      note: 'Admins excluded',
      icon: Users,
      iconBg: 'from-indigo-500 via-violet-500 to-fuchsia-500',
      glow: 'shadow-violet-500/20',
    },
    {
      title: 'New This Month',
      value: newThisMonth,
      note: '30-day registrations',
      icon: TrendingUp,
      iconBg: 'from-sky-500 to-cyan-400',
      glow: 'shadow-sky-500/20',
    },
    {
      title: 'Active Today',
      value: todayActive,
      note: 'Users who signed in today',
      icon: Activity,
      iconBg: 'from-emerald-500 to-teal-400',
      glow: 'shadow-emerald-500/20',
    },
    {
      title: 'Avg Daily Active',
      value: (() => {
        const activeDays = dailyActive.filter((d) => d.count > 0).length;
        if (activeDays === 0) return 0;
        return Math.round(dailyActive.reduce((s, d) => s + d.count, 0) / activeDays);
      })(),
      note: '30-day average daily sign-ins',
      icon: UserCheck,
      iconBg: 'from-violet-500 to-fuchsia-500',
      glow: 'shadow-violet-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">User Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          30-day growth and sign-in activity — admin accounts are excluded from all metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.title}
            className={`relative overflow-hidden rounded-3xl border border-white/12 bg-slate-900/58 p-5 shadow-xl ${s.glow} backdrop-blur-2xl`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                {s.title}
              </p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br ${s.iconBg} shadow-lg`}
              >
                <s.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">{s.value.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-400">{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-4xl border border-white/12 bg-slate-900/58 p-6 shadow-2xl shadow-black/15 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-300/55 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
              New Registrations
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">User Growth — Last 30 Days</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Daily new non-admin signups over the past month
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            New users / day
          </div>
        </div>
        <AreaChart
          title="new users"
          data={growthData}
          stroke="#38bdf8"
          stopColor="#38bdf8"
          gradId="growthFill"
        />
      </div>

      <div className="relative overflow-hidden rounded-4xl border border-white/12 bg-slate-900/58 p-6 shadow-2xl shadow-black/15 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-fuchsia-400/55 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
              Engagement
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Daily Active Users — Last 30 Days
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Distinct non-admin users who signed in on each day
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
            Active users / day
          </div>
        </div>
        <AreaChart
          title="active users"
          data={activeData}
          stroke="#d946ef"
          stopColor="#d946ef"
          gradId="activeFill"
        />
      </div>
    </div>
  );
}
