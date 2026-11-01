'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Compact single-line footer on root monitor page
  if (pathname === '/') {
    return (
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#080c14]/90 py-1.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0 select-none transition-colors duration-200">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Pusat Data RPL</span> &ndash; <span className="text-blue-600 dark:text-emerald-400 font-semibold drop-shadow-2xs dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">Indra Batara, S.Pd., Gr.</span>
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-[#080c14] mt-auto py-8 text-slate-600 dark:text-slate-400 text-xs transition-colors duration-200">
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo SMK Sangkuriang 1 Cimahi"
            className="w-10 h-10 object-contain shrink-0 drop-shadow-2xs dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
          />
          <div className="flex flex-col gap-0.5 text-left">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Pusat Data RPL (RPL Center)
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              SMK Sangkuriang 1 Cimahi &bull; Jurusan Rekayasa Perangkat Lunak
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-1">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Created by <span className="text-blue-600 dark:text-emerald-400 font-semibold">Indra Batara, S.Pd., Gr.</span>
          </p>
          <div className="flex items-center justify-center md:justify-end gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>&copy; {currentYear} Sarpras Sakuci</span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              Live zakola_id
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
