'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  XCircle,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Search,
  Save,
  LogOut,
  Calendar,
  Building2,
  Users,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  verifySiswaAbsenPin,
  fetchSiswaAbsenRoster,
  saveSiswaAbsen,
  SiswaAbsenRosterStudent,
  SiswaAbsenStatus
} from '@/lib/api';

const CLASS_OPTIONS = [
  { tingkat: '10', kelas: 'PPLG 1', label: '10 PPLG 1' },
  { tingkat: '10', kelas: 'PPLG 2', label: '10 PPLG 2' },
  { tingkat: '10', kelas: 'PPLG 3', label: '10 PPLG 3' },
  { tingkat: '11', kelas: 'PPLG 1', label: '11 PPLG 1' },
  { tingkat: '11', kelas: 'PPLG 2', label: '11 PPLG 2' },
  { tingkat: '11', kelas: 'PPLG 3', label: '11 PPLG 3' },
  { tingkat: '11', kelas: 'PPLG 4', label: '11 PPLG 4' },
  { tingkat: '12', kelas: 'PPLG 1', label: '12 PPLG 1' },
  { tingkat: '12', kelas: 'PPLG 2', label: '12 PPLG 2' },
  { tingkat: '12', kelas: 'PPLG 3', label: '12 PPLG 3' },
  { tingkat: '12', kelas: 'PPLG 4', label: '12 PPLG 4' },
];

export default function SiswaAbsenPage() {
  // Session State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('petugas');
  const [password, setPassword] = useState<string>('');
  const [isGlobalPetugas, setIsGlobalPetugas] = useState<boolean>(true);
  const [selectedTingkat, setSelectedTingkat] = useState<string>('10');
  const [selectedKelas, setSelectedKelas] = useState<string>('PPLG 1');
  const [namaPetugas, setNamaPetugas] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Absen Form State
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<SiswaAbsenRosterStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Check saved session in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('SISWA_ABSEN_SESSION');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.username || (parsed.tingkat && parsed.nama_kelas)) {
          if (parsed.username) setUsername(parsed.username);
          if (parsed.password) setPassword(parsed.password);
          if (parsed.isGlobalPetugas !== undefined) setIsGlobalPetugas(parsed.isGlobalPetugas);
          if (parsed.tingkat) setSelectedTingkat(parsed.tingkat);
          if (parsed.nama_kelas) setSelectedKelas(parsed.nama_kelas);
          if (parsed.namaPetugas) setNamaPetugas(parsed.namaPetugas);
          setIsUnlocked(true);
          loadRosterData(parsed.tingkat || '10', parsed.nama_kelas || 'PPLG 1', tanggal);
        }
      } catch (e) {
        localStorage.removeItem('SISWA_ABSEN_SESSION');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!username.trim()) {
      setAuthError('Masukkan username akun petugas');
      return;
    }
    if (!password.trim()) {
      setAuthError('Masukkan password akun petugas');
      return;
    }
    if (!namaPetugas.trim()) {
      setAuthError('Masukkan nama Anda selaku petugas absen');
      return;
    }

    setVerifying(true);
    try {
      const authRes = await verifySiswaAbsenPin({
        username: username.trim(),
        password: password.trim(),
        tingkat: selectedTingkat,
        nama_kelas: selectedKelas,
      });

      // Save session
      localStorage.setItem(
        'SISWA_ABSEN_SESSION',
        JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          isGlobalPetugas: !!authRes.isGlobalPetugas,
          tingkat: selectedTingkat,
          nama_kelas: selectedKelas,
          namaPetugas: namaPetugas.trim(),
        })
      );

      setIsGlobalPetugas(!!authRes.isGlobalPetugas);
      setIsUnlocked(true);
      await loadRosterData(selectedTingkat, selectedKelas, tanggal);
    } catch (err: any) {
      setAuthError(err.message || 'Login petugas gagal. Periksa username dan password.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectClass = (newTingkat: string, newKelas: string) => {
    setSelectedTingkat(newTingkat);
    setSelectedKelas(newKelas);
    // Persist current selected class to session
    const saved = localStorage.getItem('SISWA_ABSEN_SESSION');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.tingkat = newTingkat;
        parsed.nama_kelas = newKelas;
        localStorage.setItem('SISWA_ABSEN_SESSION', JSON.stringify(parsed));
      } catch (e) {}
    }
    loadRosterData(newTingkat, newKelas, tanggal);
  };

  const handleLogout = () => {
    localStorage.removeItem('SISWA_ABSEN_SESSION');
    setIsUnlocked(false);
    setPassword('');
    setRoster([]);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  const loadRosterData = async (tingkat: string, kelas: string, tgl: string) => {
    setLoadingRoster(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      const res = await fetchSiswaAbsenRoster({
        tingkat,
        nama_kelas: kelas,
        tanggal: tgl,
      });
      setRoster(res.data);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Gagal memuat roster siswa');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleStatusChange = (id_siswa: string, newStatus: SiswaAbsenStatus) => {
    setRoster((prev) =>
      prev.map((s) => (s.id_siswa === id_siswa ? { ...s, status: newStatus } : s))
    );
  };

  const handleCatatanChange = (id_siswa: string, note: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.id_siswa === id_siswa ? { ...s, catatan: note } : s))
    );
  };

  const handleSaveAbsen = async () => {
    setSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      const entries = roster.map((s) => ({
        id_siswa: s.id_siswa,
        nisn: s.nisn,
        nama_siswa: s.nama_lengkap,
        status: s.status,
        catatan: s.catatan || '',
      }));

      const res = await saveSiswaAbsen({
        tingkat: selectedTingkat,
        nama_kelas: selectedKelas,
        pin: password.trim() || '654321',
        username: username.trim() || 'petugas',
        isGlobalPetugas: true,
        tanggal,
        nama_petugas: namaPetugas.trim(),
        entries,
      });

      setSaveSuccessMsg(res.message);
      // Auto reload roster to refresh
      await loadRosterData(selectedTingkat, selectedKelas, tanggal);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  // Filtered roster for search
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase().trim();
    return roster.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  }, [roster, searchQuery]);

  // Status counters
  const counters = useMemo(() => {
    let hadir = 0;
    let alfa = 0;
    let sakit = 0;
    let izin = 0;
    let dispen = 0;
    let terlambat = 0;

    roster.forEach((s) => {
      if (s.status === 'tanpa_keterangan') alfa++;
      else if (s.status === 'sakit') sakit++;
      else if (s.status === 'izin') izin++;
      else if (s.status === 'dispen') dispen++;
      else if (s.status === 'terlambat') terlambat++;
      else hadir++;
    });

    return { total: roster.length, hadir, alfa, sakit, izin, dispen, terlambat };
  }, [roster]);

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Presensi Mandiri Siswa RPL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Input Absensi Siswa Kelas
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Sistem pengabsenan kelas oleh akun petugas presensi RPL untuk seluruh rombel
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/absen"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <span>Lihat Rekap Absensi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {!isUnlocked ? (
        /* ============================================================ */
        /* LOGIN / AKUN PETUGAS GATE                                    */
        /* ============================================================ */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-teal-50 border border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Login Petugas Absen Kelas
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gunakan akun petugas untuk mengabsen semua kelas RPL / PPLG.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Akun Petugas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username Akun:
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username (petugas)"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Akun Petugas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun petugas"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal"
                />
              </div>
            </div>

            {/* Nama Petugas Absen Hari Ini */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Petugas Siswa (Yang Mengabsen Hari Ini):
              </label>
              <input
                type="text"
                value={namaPetugas}
                onChange={(e) => setNamaPetugas(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Tingkat & Rombel Awal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Kelas yang Ingin Diabsen Pertama:
              </label>
              <select
                value={`${selectedTingkat}-${selectedKelas}`}
                onChange={(e) => {
                  const [t, k] = e.target.value.split('-');
                  setSelectedTingkat(t);
                  setSelectedKelas(k);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={`${c.tingkat}-${c.kelas}`} value={`${c.tingkat}-${c.kelas}`}>
                    Kelas {c.tingkat} {c.kelas}
                  </option>
                ))}
              </select>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Masuk & Buka Absen Kelas</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Satu akun petugas dapat mengabsen seluruh kelas 10, 11, dan 12 RPL/PPLG.
            </span>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* ABSEN INPUT WORKSPACE                                        */
        /* ============================================================ */
        <div className="space-y-5">
          {/* Active Session Info Bar */}
          <div className="bg-white border border-teal-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-teal-50/40 via-white to-transparent">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                {selectedTingkat}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Class switcher dropdown */}
                  <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                    <span className="text-xs text-teal-700 font-bold hidden sm:inline">Kelas:</span>
                    <select
                      value={`${selectedTingkat}-${selectedKelas}`}
                      onChange={(e) => {
                        const [t, k] = e.target.value.split('-');
                        handleSelectClass(t, k);
                      }}
                      className="bg-transparent font-black text-sm sm:text-base text-slate-900 focus:outline-none cursor-pointer"
                      title="Ganti kelas yang sedang diabsen"
                    >
                      {CLASS_OPTIONS.map((c) => (
                        <option key={`${c.tingkat}-${c.kelas}`} value={`${c.tingkat}-${c.kelas}`}>
                          Kelas {c.tingkat} {c.kelas}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Petugas Aktif</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                  <span>Petugas: <strong className="text-slate-700">{namaPetugas}</strong></span>
                  <span>•</span>
                  <span>Akun: <strong className="text-slate-700">@{username}</strong></span>
                  <span>•</span>
                  <span>Total Siswa: <strong className="text-slate-700">{roster.length}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              {/* Date Input */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => {
                    setTanggal(e.target.value);
                    loadRosterData(selectedTingkat, selectedKelas, e.target.value);
                  }}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer shadow-2xs"
                title="Keluar dari akun petugas"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Quick Stats of Marked Attendance */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Hadir Normal</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{counters.hadir}</div>
            </div>
            <div className="bg-white border border-rose-200 rounded-xl p-3 shadow-2xs bg-rose-50/20">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Alfa (Tanpa Ket.)</div>
              <div className="text-xl font-black text-rose-700 mt-0.5">{counters.alfa}</div>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs bg-amber-50/20">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Sakit</div>
              <div className="text-xl font-black text-amber-700 mt-0.5">{counters.sakit}</div>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-2xs bg-blue-50/20">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Izin</div>
              <div className="text-xl font-black text-blue-700 mt-0.5">{counters.izin}</div>
            </div>
            <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-2xs bg-purple-50/20">
              <div className="text-[10px] font-bold text-purple-700 uppercase">Dispen</div>
              <div className="text-xl font-black text-purple-700 mt-0.5">{counters.dispen}</div>
            </div>
            <div className="bg-white border border-orange-200 rounded-xl p-3 shadow-2xs bg-orange-50/20">
              <div className="text-[10px] font-bold text-orange-700 uppercase">Terlambat</div>
              <div className="text-xl font-black text-orange-700 mt-0.5">{counters.terlambat}</div>
            </div>
          </div>

          {/* Alert Messages */}
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <Link href="/absen" className="underline font-bold text-emerald-900 ml-3">
                Lihat di Rekap Absen →
              </Link>
            </div>
          )}

          {saveErrorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* Student Roster Table Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Daftar Siswa ({filteredRoster.length})
                </span>
                <span className="text-[11px] text-slate-400 hidden xs:inline">
                  • Cukup tandai siswa yang tidak hadir biasa
                </span>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px] sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama teman sekelas..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {loadingRoster ? (
              <div className="py-20 text-center space-y-2">
                <RefreshCw className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Memuat daftar siswa kelas...</p>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-xs">
                Tidak ada nama siswa yang cocok dengan pencarian.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRoster.map((st, idx) => {
                  const currentStatus = st.status || 'hadir';
                  const isNotNormal = currentStatus !== 'hadir';

                  return (
                    <div
                      key={st.id_siswa}
                      className={`p-3 rounded-xl transition-all my-1 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isNotNormal ? 'bg-amber-50/40 border border-amber-200/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Left: Info Siswa */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isNotNormal ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {st.nama_lengkap}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>NISN: {st.nisn}</span>
                            <span>•</span>
                            <span className="uppercase">{st.jenkel === 'l' ? 'Laki-laki' : 'Perempuan'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Pill Selector */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Hadir (Default) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id_siswa, 'hadir')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'hadir'
                              ? 'bg-slate-800 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Hadir
                        </button>

                        {/* Alfa / Tanpa Keterangan */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id_siswa, 'tanpa_keterangan')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'tanpa_keterangan'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          Alfa
                        </button>

                        {/* Sakit */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id_siswa, 'sakit')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'sakit'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          Sakit
                        </button>

                        {/* Izin */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id_siswa, 'izin')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'izin'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          Izin
                        </button>

                        {/* Dispen */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id_siswa, 'dispen')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'dispen'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          Dispen
                        </button>

                        {/* Terlambat */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id_siswa, 'terlambat')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'terlambat'
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                          }`}
                        >
                          Terlambat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Save Bar (Sticky on Mobile/Desktop) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                Siswa tidak hadir tercatat: <strong className="text-slate-900">{roster.length - counters.hadir}</strong> dari {roster.length} siswa.
              </div>

              <button
                type="button"
                onClick={handleSaveAbsen}
                disabled={saving || loadingRoster}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Absensi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Absensi Kelas Hari Ini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
