'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import api from '@/services/api';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Normal:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Normal' },
  Mild:     { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-400',  label: 'Mild' },
  Moderate: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Moderate' },
  Critical: { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Critical' },
};

const TREND_ICON: Record<string, string> = {
  Increasing: '↑',
  Decreasing: '↓',
  Stable:     '→',
};
const TREND_COLOR: Record<string, string> = {
  Increasing: 'text-rose-500',
  Decreasing: 'text-emerald-500',
  Stable:     'text-[#6B7280]',
};

const PIE_COLORS: Record<string, string> = {
  Normal: '#10B981', Mild: '#FBBF24', Moderate: '#F59E0B', Critical: '#EF4444'
};

const BIOMARKER_COLORS = [
  '#4F6F6F', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#EF4444'
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function PatientAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const id = user?.id || user?._id;
    if (!authLoading && id) {
      api.get(`/analytics/${id}`)
        .then(res => {
          setData(res.data);
          const categories = Object.keys(res.data.categoryTrends || {});
          if (categories.length > 0) setSelectedCategory(categories[0]);
        })
        .catch(() => setError('Failed to load analytics. Please try again.'))
        .finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-[#8FB9A8] border-t-[#4F6F6F] rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="text-4xl">⚠️</div>
      <p className="text-rose-600 font-bold">{error}</p>
    </div>
  );

  if (!data || data.totalReports === 0) return (
    <div className="bg-white py-24 rounded-3xl border border-dashed border-[#E2E8F0] text-center">
      <div className="w-20 h-20 bg-[#F6F7F5] rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📊</div>
      <h3 className="text-xl font-black text-[#2C3E3E]">No Reports Yet</h3>
      <p className="text-[#6B7280] font-medium mt-2 max-w-sm mx-auto">
        Upload your lab reports to unlock health analytics, biomarker trends, and risk analysis.
      </p>
      <Link href="/dashboard/patient"
        className="inline-flex items-center gap-2 mt-6 bg-[#4F6F6F] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2C3E3E] transition-all">
        Upload a Report
      </Link>
    </div>
  );

  const { totalReports, categoryTrends, healthTips } = data;

  // Trend chart data for selected category
  const trendEntries: any[] = (categoryTrends[selectedCategory] || []).map((e: any) => ({
    ...e,
    label: new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));
  const categoryColor = BIOMARKER_COLORS[Object.keys(categoryTrends).indexOf(selectedCategory) % BIOMARKER_COLORS.length];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex items-center gap-5 bg-white p-8 rounded-[32px] border border-[#E2E8F0] shadow-sm">
        <Link href="/dashboard/patient"
          className="w-12 h-12 flex items-center justify-center bg-[#F6F7F5] border border-[#E2E8F0] rounded-2xl text-[#4F6F6F] hover:bg-[#E2E8F0] transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-[#2C3E3E] tracking-tight">Health Analysis</h1>
          <p className="text-[#6B7280] font-medium">Tracking {Object.keys(categoryTrends).length} categories across {totalReports} reports.</p>
        </div>
      </div>

      {/* Main Graph Section */}
      <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl font-black text-[#2C3E3E]">Visual Trend</h3>
            <p className="text-sm text-[#6B7280] font-medium mt-1">
              Select a category to view your health progression.
            </p>
          </div>
          {/* Category selector */}
          <div className="relative">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-[#F6F7F5] border border-[#E2E8F0] text-[#2C3E3E] text-xs font-black py-3 pl-5 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FB9A8] transition-all cursor-pointer hover:bg-[#E2E8F0]"
            >
              {Object.keys(categoryTrends).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4F6F6F]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {trendEntries.length >= 2 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendEntries}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={categoryColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={categoryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 700, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{ background: '#2C3E3E', border: 'none', borderRadius: 16, color: 'white', padding: '12px 16px' }}
                itemStyle={{ color: 'white', fontWeight: 900 }}
                labelStyle={{ color: '#8FB9A8', marginBottom: '4px', fontWeight: 700 }}
                formatter={(val: any) => ['', 'Trend Point']}
              />
              <Area type="monotone" dataKey="score" stroke={categoryColor} strokeWidth={4}
                fill="url(#trendGrad)" dot={{ r: 6, fill: categoryColor, strokeWidth: 0 }} 
                activeDot={{ r: 8, fill: 'white', strokeWidth: 4, stroke: categoryColor }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-[#F6F7F5] rounded-[32px] border border-dashed border-[#E2E8F0]">
            <div className="text-4xl mb-4">📈</div>
            <p className="font-black text-[#2C3E3E]">More data needed</p>
            <p className="text-sm text-[#6B7280] font-medium max-w-xs mx-auto">Upload at least 2 reports in this category to visualize your health trend.</p>
          </div>
        )}
      </div>

      {/* Health Tips Section */}
      <div className="bg-[#4F6F6F] rounded-[40px] p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-32 -mr-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">💡</div>
            <h3 className="text-2xl font-black tracking-tight">Personalized Health Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {healthTips?.map((tip: string, idx: number) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 hover:bg-white/15 transition-all group">
                <div className="flex gap-4">
                  <span className="text-[#8FB9A8] font-black text-lg">0{idx + 1}</span>
                  <p className="text-sm font-medium leading-relaxed text-white/90 group-hover:text-white transition-colors">{tip}</p>
                </div>
              </div>
            ))}
          </div>

          {!healthTips?.length && (
            <p className="text-white/60 font-medium italic">General health tips will appear here as your reports are analyzed.</p>
          )}
        </div>
      </div>

    </div>
  );
}
