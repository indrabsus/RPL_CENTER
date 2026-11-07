'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Menu, X, ChevronDown, GraduationCap, Wifi, ShieldAlert, ArrowRight, Laptop, Monitor, Clock, Sun, Moon, UserCheck } from 'lucide-react';
import { fetchNetworkStats, fetchBarang, NetworkStatsData } from '@/lib/api';

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

  // Network Stats Fetcher (Throttled & Visibility-Aware)
  useEffect(() => {
    let isMounted = true;
    let lastFetched = 0;

    const loadNet = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = Date.now();
      if (now - lastFetched < 30000) return;
      try {
        const net = await fetchNetworkStats();
        if (!isMounted || !net) return;
        lastFetched = Date.now();
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
    const interval = setInterval(loadNet, 45000);
    const onVisChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && Date.now() - lastFetched > 45000) {
        loadNet();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisChange);
    }
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisChange);
      }
    };
  }, []);

  // Realtime Live Clock & Date
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Barang Stats (Laptop, PC Lab, Dipinjam)
  const [barangStats, setBarangStats] = useState<{
    laptopTotal: number;
    laptopTersedia: number;
    pcTotal: number;
    pcTersedia: number;
    totalDipinjam: number;
  } | null>(null);

  // Listen to stats update events from page.tsx or fetch directly (Throttled & Visibility-Aware)
  useEffect(() => {
    let isMounted = true;
    let lastFetched = 0;
    const loadBarang = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = Date.now();
      if (now - lastFetched < 30000) return;
      try {
        const res = await fetchBarang();
        if (!isMounted || !res) return;
        lastFetched = Date.now();
        const totalDipinjam = (res.barang || [])
          .filter((b) => b.status === 'dipinjam')
          .reduce((acc, b) => acc + (b.unit_dipinjam || 1), 0);
        setBarangStats({
          laptopTotal: res.stats_laptop?.total ?? 0,
          laptopTersedia: res.stats_laptop?.tersedia ?? 0,
          pcTotal: res.stats_pc?.total ?? 0,
          pcTersedia: res.stats_pc?.tersedia ?? 0,
          totalDipinjam,
        });
      } catch (e) {}
    };

    loadBarang();
    const handleStats = (e: any) => {
      if (e.detail) {
        setBarangStats(e.detail);
      }
    };
    window.addEventListener('sarpras-stats-update', handleStats);
    const interval = setInterval(loadBarang, 60000);
    const onVisChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && Date.now() - lastFetched > 60000) {
        loadBarang();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisChange);
    }
    return () => {
      isMounted = false;
      window.removeEventListener('sarpras-stats-update', handleStats);
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisChange);
      }
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

  // Theme State: Dark Mode (Gaming Green + Senada Notes) <-> Light Mode (Pastel Notes)
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rpl_theme');
      const shouldBeDark = saved === 'light' ? false : true;
      setIsDark(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('rpl_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('rpl_theme', 'light');
      }
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-emerald-500/20 bg-white/95 dark:bg-[#090d15]/95 backdrop-blur-md shadow-2xs dark:shadow-[0_4px_25px_rgba(0,0,0,0.5)] relative transition-colors duration-200 print:hidden">
      {/* Glowing Gaming Green Accent Line at top (Dark Mode only) */}
      <div className="hidden dark:block h-[2px] w-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

      <div className="w-full max-w-[1850px] mx-auto px-2.5 sm:px-4 lg:px-6 h-13 sm:h-14 flex items-center justify-between gap-2.5">
        {/* Left Side: Brand Logo + Waktu Realtime + Stats Laptop/PC + Internet (Disembunyikan di HP) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight leading-none group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                PUSAT DATA RPL
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-emerald-400 font-semibold tracking-wider mt-0.5">
                SMK SANGKURIANG 1 CIMAHI
              </span>
            </div>
          </Link>

          {/* 1. Card Waktu Realtime Lab (sebelah logo Pusat Data RPL, disembunyikan di HP / layar kecil) */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-950 dark:bg-[#0b101b] text-white px-2.5 sm:px-3 py-1 border border-slate-800 dark:border-emerald-500/30 shrink-0 select-none shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[8.5px] text-emerald-400 font-bold uppercase tracking-wider">
                  Waktu Realtime Lab
                </span>
                <span className="text-slate-600 text-[8.5px]">•</span>
                <span className="text-[9.5px] text-slate-300 font-medium truncate max-w-[125px]">
                  {currentDate || '-'}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black font-mono tracking-tight text-white leading-tight mt-0.5">
                {currentTime || '--:--:-- WIB'}
              </div>
            </div>
          </div>

          {/* 2. Card Laptop, PC Lab yang dipinjam (ke NAVBAR, disembunyikan di HP) */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#0b101b] border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-x divide-slate-200 dark:divide-slate-800 shrink-0">
            {/* Laptop */}
            <div className="flex items-center gap-1.5 pr-1" title="Laptop Tersedia / Total">
              <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Laptop className="w-3 h-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Laptop</span>
                <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                  {barangStats ? `${barangStats.laptopTersedia}/${barangStats.laptopTotal}` : '-/-'}
                </span>
              </div>
            </div>

            {/* PC Lab */}
            <div className="flex items-center gap-1.5 px-2" title="PC Lab Tersedia / Total">
              <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Monitor className="w-3 h-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">PC Lab</span>
                <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                  {barangStats ? `${barangStats.pcTersedia}/${barangStats.pcTotal}` : '-/-'}
                </span>
              </div>
            </div>

            {/* Dipinjam */}
            <div className="flex items-center gap-1.5 pl-2" title="Total Unit Sedang Dipinjam">
              <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-3 h-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[8.5px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Dipinjam</span>
                <span className="font-mono text-xs font-black text-amber-900 dark:text-amber-300">
                  {barangStats ? `${barangStats.totalDipinjam}` : '-'} <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400/80">Unit</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Card Status Internet Guru & Siswa (ke NAVBAR, disembunyikan di HP) */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#0b101b] border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-x divide-slate-200 dark:divide-slate-800 shrink-0">
            {/* Internet Siswa */}
            <div className="flex items-center gap-1.5 pr-1" title="Status Jaringan Siswa">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${networkStats.siswaOnline ? 'bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'}`}>
                <Wifi className="w-3 h-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Siswa</span>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${networkStats.siswaOnline ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]' : 'bg-rose-500'}`} />
                  <span className={`text-[10.5px] font-bold ${networkStats.siswaOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {networkStats.siswaOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Internet Guru */}
            <div className="flex items-center gap-1.5 pl-2" title="Status Jaringan Guru">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${networkStats.guruOnline ? 'bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'}`}>
                <Wifi className="w-3 h-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Guru</span>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${networkStats.guruOnline ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]' : 'bg-rose-500'}`} />
                  <span className={`text-[10.5px] font-bold ${networkStats.guruOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {networkStats.guruOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] hover:bg-white dark:hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Muat ulang data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Theme Toggle Button (Dark Gaming <-> Light Pastel) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] hover:bg-white dark:hover:border-emerald-500/40 text-slate-700 dark:text-emerald-400 shadow-2xs transition-all cursor-pointer mr-1"
            title={isDark ? 'Ganti ke Mode Terang (Pastel Notes)' : 'Ganti ke Mode Gelap (Gaming Green)'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-emerald-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          <nav className="flex items-center text-xs font-bold tracking-wide">
            {/* 1. MONITOR */}
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isMonitor
                  ? 'text-blue-600 dark:text-emerald-400 bg-blue-50 dark:bg-emerald-950/60 font-black border border-blue-200 dark:border-emerald-500/40 shadow-2xs dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              MONITOR
            </Link>

            <span className="text-slate-300 dark:text-slate-700 font-light mx-1 select-none">|</span>

            {/* 2. DATA RPL (Dropdown: Kelas 10, 11, 12 -> Data Siswa, Absen) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isDataRpl
                    ? 'text-teal-700 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 font-black border border-teal-200 dark:border-emerald-500/40 shadow-2xs dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Pusat Data &amp; Presensi RPL
                  </div>

                  {/* 3 Grade Items: Kelas 10, Kelas 11, Kelas 12 */}
                  <div className="py-2 space-y-1.5">
                    {/* Kelas 10 */}
                    <Link
                      href="/data-siswa?tingkat=10"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                          10
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            Kelas 10 RPL
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            10 PPLG 1, 2, 3
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-0.5">
                        Buka &rarr;
                      </span>
                    </Link>

                    {/* Kelas 11 */}
                    <Link
                      href="/data-siswa?tingkat=11"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                          11
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            Kelas 11 RPL
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            11 PPLG 1, 2, 3, 4
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-0.5">
                        Buka &rarr;
                      </span>
                    </Link>

                    {/* Kelas 12 */}
                    <Link
                      href="/data-siswa?tingkat=12"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-50/80 dark:hover:bg-purple-950/50 border border-transparent hover:border-purple-100 dark:hover:border-purple-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                          12
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            Kelas 12 RPL
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            12 PPLG 1, 2, 3, 4
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-0.5">
                        Buka &rarr;
                      </span>
                    </Link>
                  </div>

                  {/* Logo Absen di Bawah Kelas 12 */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href="/absen"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-linear-to-r from-teal-500/10 via-emerald-500/5 to-transparent hover:from-teal-500/20 border border-teal-200/80 dark:border-emerald-500/30 transition-all group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                            <span>Absen Siswa RPL</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Live
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Monitoring &amp; Input Presensi Kelas
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-teal-600 dark:text-emerald-400">&rarr;</span>
                    </Link>
                  </div>

                  {/* Bottom: Semua Angkatan */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <Link
                      href="/data-siswa?tingkat=all"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-emerald-400 font-semibold"
                    >
                      Semua Siswa (Angkatan 10-12)
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300 dark:text-slate-700 font-light mx-1 select-none">|</span>

            {/* 4. KARTU KONTROL */}
            <Link
              href="/kartu-kontrol"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isKartu
                  ? 'text-indigo-600 dark:text-emerald-400 bg-indigo-50 dark:bg-emerald-950/60 font-black border border-indigo-200 dark:border-emerald-500/40 shadow-2xs dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              KARTU KONTROL
            </Link>
          </nav>

          <span className="text-slate-300 dark:text-slate-700 font-light mx-0.5 select-none">|</span>

          {/* Admin Panel -> on the far right */}
          <Link
            href="/kiosk"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-950 text-xs font-black transition-all shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0 ml-1"
          >
            <span>Admin Panel</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-950 stroke-[2.5]" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Mobile Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] text-slate-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Mobile Refresh Button */}
          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] text-slate-700 dark:text-slate-300 disabled:opacity-50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900"
            title="Refresh"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d15] px-4 py-3 space-y-2 shadow-lg dark:shadow-2xl">
          {/* Network status in mobile drawer */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#0b101b] rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Status Jaringan:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                <span>Siswa</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    networkStats.siswaOnline ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                <span>Guru</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    networkStats.guruOnline ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
              </span>
            </div>
          </div>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              isMonitor
                ? 'text-blue-600 dark:text-emerald-400 bg-blue-50 dark:bg-emerald-950/60 font-black border border-blue-200 dark:border-emerald-500/40'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            MONITOR
          </Link>

          {/* Accordion: DATA RPL */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-2 bg-slate-50/50 dark:bg-[#0b101b]">
            <div className="text-[11px] font-black uppercase text-slate-400 px-1">
              DATA RPL
            </div>

            {/* Kelas 10 */}
            <Link
              href="/data-siswa?tingkat=10"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center">10</span>
                <span>Kelas 10 RPL</span>
              </div>
              <span className="text-slate-400 text-[11px]">&rarr;</span>
            </Link>

            {/* Kelas 11 */}
            <Link
              href="/data-siswa?tingkat=11"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">11</span>
                <span>Kelas 11 RPL</span>
              </div>
              <span className="text-slate-400 text-[11px]">&rarr;</span>
            </Link>

            {/* Kelas 12 */}
            <Link
              href="/data-siswa?tingkat=12"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center">12</span>
                <span>Kelas 12 RPL</span>
              </div>
              <span className="text-slate-400 text-[11px]">&rarr;</span>
            </Link>

            {/* Logo Absen di Bawah Kelas 12 */}
            <Link
              href="/absen"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50 dark:bg-emerald-950/60 border border-teal-200 dark:border-emerald-500/30 text-xs font-black text-teal-800 dark:text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-600 text-white flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span>Absen Siswa RPL</span>
              </div>
              <span className="text-teal-600 dark:text-emerald-400 text-xs">&rarr;</span>
            </Link>
          </div>

          <Link
            href="/kartu-kontrol"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              isKartu
                ? 'text-indigo-600 dark:text-emerald-400 bg-indigo-50 dark:bg-emerald-950/60 font-black border border-indigo-200 dark:border-emerald-500/40'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            KARTU KONTROL
          </Link>

          <Link
            href="/kiosk"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white dark:text-slate-950 text-xs font-black shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          >
            <span>Admin Panel</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      )}
    </header>
  );
}
