import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-none bg-[#1a1a1a] border border-[#3c3c3c] ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="h-10 bg-[#0d0d0d] rounded-none border border-[#3c3c3c] w-full animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-[#1a1a1a] rounded-none border border-[#262626] p-4 flex items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-8 h-8 rounded-none bg-[#262626] shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3.5 bg-[#262626] rounded-none w-3/4" />
              <div className="h-2.5 bg-[#0d0d0d] rounded-none w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-[#262626] rounded-none w-1/5 hidden sm:block" />
          <div className="h-6 bg-[#262626] rounded-none w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-[#1a1a1a] rounded-none border border-[#3c3c3c] space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[#262626] rounded-none w-1/3" />
        <div className="w-10 h-10 rounded-none bg-[#262626]" />
      </div>
      <div className="h-8 bg-[#262626] rounded-none w-1/2" />
      <div className="h-3 bg-[#0d0d0d] rounded-none w-2/3" />
    </div>
  );
}

