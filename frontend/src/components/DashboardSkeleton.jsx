import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-indigo-800/90 to-slate-900/90 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="w-32 h-5 rounded-full bg-indigo-500/40 border border-indigo-400/30" />
          <div className="w-56 h-7 rounded-xl bg-white/20" />
          <div className="w-72 h-4 rounded-lg bg-indigo-200/20" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-28 h-8 rounded-xl bg-white/10" />
          <div className="w-24 h-8 rounded-xl bg-white/10" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-24 h-3.5 rounded bg-slate-200" />
              <div className="w-9 h-9 rounded-xl bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-7 rounded-lg bg-slate-200" />
              <div className="w-32 h-3 rounded bg-slate-150 bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Visual Charts Skeleton (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1.5">
                <div className="w-40 h-4 rounded bg-slate-200" />
                <div className="w-56 h-3 rounded bg-slate-100" />
              </div>
              <div className="w-6 h-6 rounded bg-slate-200" />
            </div>
            <div className="h-64 w-full bg-slate-50/70 rounded-xl flex items-end justify-between p-6 gap-3">
              {[40, 70, 55, 85, 60, 90, 45].map((h, idx) => (
                <div
                  key={idx}
                  className="w-full bg-slate-200/70 rounded-t-lg transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((sec) => (
          <div key={sec} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="w-44 h-4 rounded bg-slate-200" />
              <div className="w-16 h-3 rounded bg-indigo-100" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-3 rounded-xl bg-slate-50 border border-slate-150/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="w-32 h-3.5 rounded bg-slate-200" />
                      <div className="w-24 h-2.5 rounded bg-slate-150 bg-slate-100" />
                    </div>
                  </div>
                  <div className="w-14 h-5 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Leadership Team Skeleton */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-1.5">
            <div className="w-52 h-4 rounded bg-slate-200" />
            <div className="w-72 h-3 rounded bg-slate-100" />
          </div>
          <div className="w-24 h-6 rounded-full bg-amber-100/60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col items-center text-center space-y-3.5">
              <div className="w-20 h-4 rounded-full bg-slate-200" />
              <div className="w-32 h-32 rounded-full bg-slate-200" />
              <div className="space-y-1.5 w-full flex flex-col items-center">
                <div className="w-28 h-4 rounded bg-slate-200" />
                <div className="w-20 h-3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
