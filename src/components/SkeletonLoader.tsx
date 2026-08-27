import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-800/60 border border-slate-700/30 ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="h-10 bg-slate-800/80 rounded-xl border border-slate-700/50 w-full animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-slate-900/60 rounded-xl border border-slate-800/60 p-4 flex items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3.5 bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-slate-800 rounded w-1/5 hidden sm:block" />
          <div className="h-6 bg-slate-800 rounded-full w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-[#141b30] rounded-2xl border border-[#232b47] space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="w-10 h-10 rounded-xl bg-slate-800" />
      </div>
      <div className="h-8 bg-slate-800 rounded w-1/2" />
      <div className="h-3 bg-slate-800/60 rounded w-2/3" />
    </div>
  );
}
