'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Menu, X, ChevronDown, GraduationCap, Wifi, ShieldAlert } from 'lucide-react';
import { fetchNetworkStats, NetworkStatsData } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/kiosk');
  const isKartu = pathname?.startsWith('/kartu-kontrol');
  const isDataSiswa = pathname?.startsWith('/data-siswa');
  const isAbsen = pathname?.startsWith('/absen') || pathname?.startsWith('/siswa-absen');
  const isDataRpl = isDataSiswa || isAbsen;
  const isMonitor = pathname === '/' || (!isAdmin && !isKartu && !isDataRpl);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Network Status State: [Internet Siswa o] [Internet Guru o]
  const [networkStats, setNetworkStats] = useState<{
    siswaOnline: boolean;
    guruOnline: boolean;
  }>({
    siswaOnline: true,
    guruOnline: true,
  });

  // Polling network stats for navbar badges
  useEffect(() => {
    let isMounted = true;
    const loadNet = async () => {
      try {
        const net = await fetchNetworkStats();
        if (!isMounted || !net) return;
        const siswaStatus =
          net.interfaces?.siswa?.status || net.interfaces?.ether2_difusi?.status || 'online';
        const guruStatus =
          net.interfaces?.guru?.status || net.interfaces?.ether1_indibiz?.status || 'online';

        setNetworkStats({
          siswaOnline: siswaStatus !== 'offline',
          guruOnline: guruStatus !== 'offline',
        });
      } catch (e) {
        // Keep previous or default
      }
    };

    loadNet();
    const interval = setInterval(loadNet, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sarpras refresh listener
  useEffect(() => {
    const handleStatus = (e: any) => {
      if (typeof e.detail?.refreshing === 'boolean') {
        setIsRefreshing(e.detail.refreshing);
      }
    };
    window.addEventListener('sarpras-refresh-status', handleStatus);
    return () => window.removeEventListener('sarpras-refresh-status', handleStatus);
  }, []);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('sarpras-refresh'));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="w-full max-w-[1850px] mx-auto px-2.5 sm:px-4 lg:px-6 h-13 sm:h-14 flex items-center justify-between">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              PUSAT DATA RPL
            </span>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider mt-0.5">
              SMK SANGKURIANG 1 CIMAHI
            </span>
          </div>
        </Link>

        {/* Center/Right: Network Badges [Internet Siswa o] [Internet Guru o] */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Internet Siswa */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs ${
              networkStats.siswaOnline
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : 'bg-rose-50/70 border-rose-200 text-rose-800'
            }`}
            title={`Internet Siswa: ${networkStats.siswaOnline ? 'Online (Normal)' : 'Offline (Gangguan)'}`}
          >
            <span>Internet Siswa</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                networkStats.siswaOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>

          {/* Internet Guru */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs ${
              networkStats.guruOnline
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : 'bg-rose-50/70 border-rose-200 text-rose-800'
            }`}
            title={`Internet Guru: ${networkStats.guruOnline ? 'Online (Normal)' : 'Offline (Gangguan)'}`}
          >
            <span>Internet Guru</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                networkStats.guruOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-2xs mr-1"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span>Refresh</span>
          </button>

          <nav className="flex items-center text-xs font-bold tracking-wide">
            {/* 1. MONITOR */}
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isMonitor
                  ? 'text-blue-600 bg-blue-50 font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              MONITOR
            </Link>

            <span className="text-slate-300 font-light mx-1 select-none">|</span>

            {/* 2. DATA RPL (Dropdown: Kelas 10, 11, 12 -> Data Siswa, Absen) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isDataRpl
                    ? 'text-teal-700 bg-teal-50 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>DATA RPL</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Box */}
              {dropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Pusat Data &amp; Presensi RPL
                  </div>

                  {/* 3 Grade Columns / Blocks */}
                  <div className="py-2 space-y-2">
                    {/* Kelas 10 */}
                    <div className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Kelas 10 RPL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/data-siswa?tingkat=10"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                          Data Siswa
                        </Link>
                        <Link
                          href="/absen?tingkat=10"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-100"
                        >
                          Absen
                        </Link>
                      </div>
                    </div>

                    {/* Kelas 11 */}
                    <div className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Kelas 11 RPL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/data-siswa?tingkat=11"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100"
                        >
                          Data Siswa
                        </Link>
                        <Link
                          href="/absen?tingkat=11"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-100"
                        >
                          Absen
                        </Link>
                      </div>
                    </div>

                    {/* Kelas 12 */}
                    <div className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          <span>Kelas 12 RPL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/data-siswa?tingkat=12"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100"
                        >
                          Data Siswa
                        </Link>
                        <Link
                          href="/absen?tingkat=12"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-100"
                        >
                          Absen
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Semua Angkatan */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href="/data-siswa?tingkat=all"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Semua Siswa
                    </Link>
                    <span className="text-slate-300">|</span>
                    <Link
                      href="/absen?tingkat=all"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Semua Absen
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300 font-light mx-1 select-none">|</span>

            {/* 4. KARTU KONTROL */}
            <Link
              href="/kartu-kontrol"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isKartu
                  ? 'text-indigo-600 bg-indigo-50 font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              KARTU KONTROL
            </Link>
          </nav>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile compact network dots */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700">
            <span>S:</span>
            <span
              className={`w-2 h-2 rounded-full ${
                networkStats.siswaOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="ml-0.5">G:</span>
            <span
              className={`w-2 h-2 rounded-full ${
                networkStats.guruOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </div>

          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg">
          {/* Network status in mobile drawer */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <span className="text-slate-600">Status Jaringan:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]">
                <span>Siswa</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    networkStats.siswaOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span>Guru</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    networkStats.guruOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
            </div>
          </div>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              isMonitor ? 'text-blue-600 bg-blue-50 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            MONITOR
          </Link>

          {/* Accordion: DATA RPL */}
          <div className="border border-slate-200 rounded-xl p-2.5 space-y-2">
            <div className="text-[11px] font-black uppercase text-slate-400 px-1">
              DATA RPL
            </div>

            {/* Kelas 10 */}
            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
              <span className="text-xs font-bold text-slate-800">Kelas 10 RPL</span>
              <div className="flex gap-2">
                <Link
                  href="/data-siswa?tingkat=10"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700"
                >
                  Data Siswa
                </Link>
                <Link
                  href="/absen?tingkat=10"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white border border-slate-200 rounded text-xs font-semibold text-teal-700"
                >
                  Absen
                </Link>
              </div>
            </div>

            {/* Kelas 11 */}
            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
              <span className="text-xs font-bold text-slate-800">Kelas 11 RPL</span>
              <div className="flex gap-2">
                <Link
                  href="/data-siswa?tingkat=11"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700"
                >
                  Data Siswa
                </Link>
                <Link
                  href="/absen?tingkat=11"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white border border-slate-200 rounded text-xs font-semibold text-teal-700"
                >
                  Absen
                </Link>
              </div>
            </div>

            {/* Kelas 12 */}
            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
              <span className="text-xs font-bold text-slate-800">Kelas 12 RPL</span>
              <div className="flex gap-2">
                <Link
                  href="/data-siswa?tingkat=12"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700"
                >
                  Data Siswa
                </Link>
                <Link
                  href="/absen?tingkat=12"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white border border-slate-200 rounded text-xs font-semibold text-teal-700"
                >
                  Absen
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/kartu-kontrol"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              isKartu ? 'text-indigo-600 bg-indigo-50 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            KARTU KONTROL
          </Link>
        </div>
      )}
    </header>
  );
}
