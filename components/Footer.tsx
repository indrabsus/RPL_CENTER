'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on root monitor page to keep TV / Laptop dashboard 100% zero-scroll
  if (pathname === '/') {
    return null;
  }

  return (
    <footer className="w-full border-t border-slate-200 bg-slate-100/90 mt-auto py-8 text-slate-600 text-xs">
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo SMK Sangkuriang 1 Cimahi"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="flex flex-col gap-0.5 text-left">
            <p className="font-semibold text-slate-800">
              Pusat Data RPL (RPL Center)
            </p>
            <p className="text-slate-500">
              SMK Sangkuriang 1 Cimahi &bull; Jurusan Rekayasa Perangkat Lunak
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-1">
          <p className="font-medium text-slate-700">
            Created by <span className="text-blue-600 font-semibold">Indra Batara, S.Pd., Gr.</span>
          </p>
          <div className="flex items-center justify-center md:justify-end gap-2 text-[11px] text-slate-500">
            <span>&copy; {currentYear} Sarpras Sakuci</span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live zakola_id
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
