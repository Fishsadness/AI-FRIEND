import { useState, useEffect, useMemo } from 'react';
import { Coins, ChevronLeft, ChevronRight, TrendingUp, Zap, MessageSquare } from 'lucide-react';
import { api } from '../../api';
import type { TokenUsageMonth } from '../../types';
import Dropdown from '../ui/Dropdown';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const YEAR_OPTIONS = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: `${y}年` }));
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

export default function TokenPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<TokenUsageMonth | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getTokenUsage(year, month)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const canNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (!canNext) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const canNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const chartData = useMemo(() => {
    if (!data?.daily) return null;
    const active = data.daily.filter(d => d.total_tokens > 0);
    if (active.length === 0) return null;
    const maxVal = Math.max(...active.map(d => d.total_tokens));
    const barWidth = Math.max(4, Math.min(10, (280 - 40) / active.length - 2));
    return { active, maxVal, barWidth, svgWidth: active.length * (barWidth + 2) + 40 };
  }, [data]);

  const formatTokens = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-earth-200 dark:border-earth-800">
        <div className="flex items-center gap-2 mb-3">
          <Coins size={16} className="text-warm-400" />
          <h2 className="text-sm font-serif font-semibold text-earth-700 dark:text-earth-200">Token 用量</h2>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 rounded-full hover:bg-earth-100 dark:hover:bg-earth-700 text-earth-400 dark:text-earth-500 hover:text-earth-600 dark:hover:text-earth-300 transition-colors duration-300">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Dropdown
              value={year}
              options={YEAR_OPTIONS}
              onChange={(v) => setYear(Number(v))}
              className="w-[80px]"
            />
            <Dropdown
              value={month}
              options={MONTH_OPTIONS}
              onChange={(v) => setMonth(Number(v))}
              className="w-[72px]"
            />
          </div>
          <button
            onClick={nextMonth}
            disabled={!canNext}
            className={`p-1 rounded-full transition-colors duration-300 ${
              canNext ? 'hover:bg-earth-100 dark:hover:bg-earth-700 text-earth-400 dark:text-earth-500 hover:text-earth-600 dark:hover:text-earth-300' : 'text-earth-200 dark:text-earth-700 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-warm-400/30 border-t-warm-400 rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-earth-300 dark:text-earth-600 text-xs">加载失败</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatCard
                icon={<Zap size={12} className="text-warm-400" />}
                label="总用量"
                value={formatTokens(data.total)}
                color="warm"
              />
              <StatCard
                icon={<MessageSquare size={12} className="text-sage-400" />}
                label="输入"
                value={formatTokens(data.total_prompt)}
                color="sage"
              />
              <StatCard
                icon={<TrendingUp size={12} className="text-earth-400" />}
                label="输出"
                value={formatTokens(data.total_completion)}
                color="earth"
              />
            </div>

            {chartData && chartData.active.length > 0 && (
              <div className="bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-earth-400 dark:text-earth-500">每日用量趋势</span>
                  <span className="text-[10px] text-earth-300 dark:text-earth-600">{chartData.active.length}天</span>
                </div>
                <div className="overflow-x-auto">
                  <svg
                    width={chartData.svgWidth}
                    height="120"
                    viewBox={`0 0 ${chartData.svgWidth} 120`}
                    className="block"
                  >
                    {[0, 25, 50, 75, 100].map((pct) => {
                      const y = 110 - (pct / 100) * 100;
                      return (
                        <g key={pct}>
                          <line x1="0" y1={y} x2={chartData.svgWidth} y2={y} stroke="rgba(92,64,51,0.06)" strokeWidth="0.5" className="dark:stroke-earth-700" />
                          <text x="0" y={y - 3} fill="rgba(92,64,51,0.25)" fontSize="8" textAnchor="start" className="dark:fill-earth-500">
                            {formatTokens(Math.round(chartData.maxVal * pct / 100))}
                          </text>
                        </g>
                      );
                    })}

                    {chartData.active.map((d, i) => {
                      const x = i * (chartData.barWidth + 2) + 40;
                      const height = d.total_tokens > 0 ? Math.max(2, (d.total_tokens / chartData.maxVal) * 100) : 0;
                      const y = 110 - height;
                      const day = parseInt(d.date.split('-')[2], 10);

                      return (
                        <g key={d.date}>
                          <title>{d.date}: {formatTokens(d.total_tokens)} tokens</title>
                          <rect
                            x={x}
                            y={y}
                            width={chartData.barWidth}
                            height={height}
                            rx="2"
                            fill="url(#barGrad)"
                            opacity="0.85"
                          />
                          {(day === 1 || day % 5 === 0 || i === chartData.active.length - 1) && (
                            <text x={x + chartData.barWidth / 2} y="118" fill="rgba(92,64,51,0.25)" fontSize="7" textAnchor="middle" className="dark:fill-earth-500">
                              {day}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4a373" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#8b9d77" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}

            {(!chartData || chartData.active.length === 0) && (
              <div className="text-center py-6 text-earth-300 dark:text-earth-600 text-xs">
                该月暂无使用数据
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'warm' | 'sage' | 'earth';
}) {
  const borders = {
    warm: 'border-warm-200 dark:border-warm-500/15',
    sage: 'border-sage-200 dark:border-sage-500/15',
    earth: 'border-earth-200 dark:border-earth-500/15',
  };
  return (
    <div className={`bg-white dark:bg-earth-800 border ${borders[color]} rounded-organic p-2.5 text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-xs font-serif font-semibold text-earth-700 dark:text-earth-200">{value}</p>
      <p className="text-[10px] text-earth-400 dark:text-earth-500">{label}</p>
    </div>
  );
}