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

  // 图表计算
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
      {/* 头部 */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Coins size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white/90">Token 用量</h2>
        </div>

        {/* 年月选择器 */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
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
            className={`p-1 rounded transition-colors ${
              canNext ? 'hover:bg-white/[0.06] text-white/40 hover:text-white/70' : 'text-white/10 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-white/20 text-xs">加载失败</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatCard
                icon={<Zap size={12} className="text-amber-400" />}
                label="总用量"
                value={formatTokens(data.total)}
                color="amber"
              />
              <StatCard
                icon={<MessageSquare size={12} className="text-blue-400" />}
                label="输入"
                value={formatTokens(data.total_prompt)}
                color="blue"
              />
              <StatCard
                icon={<TrendingUp size={12} className="text-emerald-400" />}
                label="输出"
                value={formatTokens(data.total_completion)}
                color="emerald"
              />
            </div>

            {/* SVG柱状图 */}
            {chartData && chartData.active.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-white/30">每日用量趋势</span>
                  <span className="text-[10px] text-white/20">{chartData.active.length}天</span>
                </div>
                <div className="overflow-x-auto">
                  <svg
                    width={chartData.svgWidth}
                    height="120"
                    viewBox={`0 0 ${chartData.svgWidth} 120`}
                    className="block"
                  >
                    {/* 网格线 */}
                    {[0, 25, 50, 75, 100].map((pct) => {
                      const y = 110 - (pct / 100) * 100;
                      return (
                        <g key={pct}>
                          <line x1="0" y1={y} x2={chartData.svgWidth} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                          <text x="0" y={y - 3} fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="start">
                            {formatTokens(Math.round(chartData.maxVal * pct / 100))}
                          </text>
                        </g>
                      );
                    })}

                    {/* 柱状条 */}
                    {chartData.active.map((d, i) => {
                      const x = i * (chartData.barWidth + 2) + 40;
                      const height = d.total_tokens > 0 ? Math.max(2, (d.total_tokens / chartData.maxVal) * 100) : 0;
                      const y = 110 - height;
                      const day = parseInt(d.date.split('-')[2], 10);

                      return (
                        <g key={d.date}>
                          <title>{d.date}: {formatTokens(d.total_tokens)} tokens (输入: {formatTokens(d.prompt_tokens)}, 输出: {formatTokens(d.completion_tokens)})</title>
                          <rect
                            x={x}
                            y={y}
                            width={chartData.barWidth}
                            height={height}
                            rx="1.5"
                            fill="url(#barGrad)"
                            opacity="0.85"
                          />
                          {/* 每5天或首尾显示日期 */}
                          {(day === 1 || day % 5 === 0 || i === chartData.active.length - 1) && (
                            <text x={x + chartData.barWidth / 2} y="118" fill="rgba(255,255,255,0.2)" fontSize="7" textAnchor="middle">
                              {day}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}

            {/* 无数据 */}
            {(!chartData || chartData.active.length === 0) && (
              <div className="text-center py-6 text-white/15 text-xs">
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
  color: 'amber' | 'blue' | 'emerald';
}) {
  const borders = {
    amber: 'border-amber-500/15',
    blue: 'border-blue-500/15',
    emerald: 'border-emerald-500/15',
  };
  return (
    <div className={`bg-white/[0.02] border ${borders[color]} rounded-lg p-2.5 text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-xs font-semibold text-white/80">{value}</p>
      <p className="text-[10px] text-white/25">{label}</p>
    </div>
  );
}