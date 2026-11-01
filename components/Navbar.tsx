'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Menu, X, ChevronDown, GraduationCap, Wifi, ShieldAlert, ArrowRight, Laptop, Monitor, Clock, Sun, Moon } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-emerald-500/20 bg-white/95 dark:bg-[#090d15]/95 backdrop-blur-md shadow-2xs dark:shadow-[0_4px_25px_rgba(0,0,0,0.5)] relative transition-colors duration-200">
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

                  {/* 3 Grade Columns / Blocks */}
                  <div className="py-2 space-y-2">
                    {/* Kelas 10 */}
                    <div className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Kelas 10 RPL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/data-siswa?tingkat=10"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors border border-indigo-100 dark:border-indigo-500/30"
                        >
                          Data Siswa
                        </Link>
                        <Link
                          href="/absen?tingkat=10"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-teal-50 dark:bg-emerald-950/80 text-teal-700 dark:text-emerald-300 hover:bg-teal-100 dark:hover:bg-emerald-900/80 transition-colors border border-teal-100 dark:border-emerald-500/30"
                        >
                          Absen
                        </Link>
                      </div>
                    </div>

                    {/* Kelas 11 */}
                    <div className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Kelas 11 RPL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/data-siswa?tingkat=11"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors border border-emerald-100 dark:border-emerald-500/30"
                        >
                          Data Siswa
                        </Link>
                        <Link
                          href="/absen?tingkat=11"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 transition-colors border border-teal-100 dark:border-teal-500/30"
                        >
                          Absen
                        </Link>
                      </div>
                    </div>

                    {/* Kelas 12 */}
                    <div className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Kelas 12 RPL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/data-siswa?tingkat=12"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors border border-purple-100 dark:border-purple-500/30"
                        >
                          Data Siswa
                        </Link>
                        <Link
                          href="/absen?tingkat=12"
                          onClick={() => setDropdownOpen(false)}
                          className="flex-1 px-2.5 py-1 text-center rounded-lg text-xs font-semibold bg-teal-50 dark:bg-emerald-950/80 text-teal-700 dark:text-emerald-300 hover:bg-teal-100 dark:hover:bg-emerald-900/80 transition-colors border border-teal-100 dark:border-emerald-500/30"
                        >
                          Absen
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Semua Angkatan */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <Link
                      href="/data-siswa?tingkat=all"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-emerald-400 font-semibold"
                    >
                      Semua Siswa
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <Link
                      href="/absen?tingkat=all"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-emerald-400 font-semibold"
                    >
                      Semua Absen
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
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2 space-y-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Kelas 10 RPL</span>
              <div className="flex gap-2">
                <Link
                  href="/data-siswa?tingkat=10"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white dark:bg-indigo-950/80 border border-slate-200 dark:border-indigo-500/30 rounded text-xs font-semibold text-indigo-700 dark:text-indigo-300"
                >
                  Data Siswa
                </Link>
                <Link
                  href="/absen?tingkat=10"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white dark:bg-teal-950/80 border border-slate-200 dark:border-teal-500/30 rounded text-xs font-semibold text-teal-700 dark:text-teal-300"
                >
                  Absen
                </Link>
              </div>
            </div>

            {/* Kelas 11 */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2 space-y-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Kelas 11 RPL</span>
              <div className="flex gap-2">
                <Link
                  href="/data-siswa?tingkat=11"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-500/30 rounded text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  Data Siswa
                </Link>
                <Link
                  href="/absen?tingkat=11"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white dark:bg-teal-950/80 border border-slate-200 dark:border-teal-500/30 rounded text-xs font-semibold text-teal-700 dark:text-teal-300"
                >
                  Absen
                </Link>
              </div>
            </div>

            {/* Kelas 12 */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2 space-y-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Kelas 12 RPL</span>
              <div className="flex gap-2">
                <Link
                  href="/data-siswa?tingkat=12"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white dark:bg-purple-950/80 border border-slate-200 dark:border-purple-500/30 rounded text-xs font-semibold text-purple-700 dark:text-purple-300"
                >
                  Data Siswa
                </Link>
                <Link
                  href="/absen?tingkat=12"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1 text-center bg-white dark:bg-teal-950/80 border border-slate-200 dark:border-teal-500/30 rounded text-xs font-semibold text-teal-700 dark:text-teal-300"
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
