'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Building2,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  fetchSiswaAbsenList,
  fetchSiswaAbsenPinList,
  fetchRplSummary,
  SiswaAbsenRecord,
  SiswaAbsenSummary,
  SiswaAbsenPinItem,
  RplSummaryData
} from '@/lib/api';

export default function AbsenPage() {
  const [activeTingkat, setActiveTingkat] = useState<string>('all'); // 'all', '10', '11', '12'
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<SiswaAbsenRecord[]>([]);
  const [summary, setSummary] = useState<SiswaAbsenSummary>({
    total_tidak_hadir: 0,
    tanpa_keterangan: 0,
    sakit: 0,
    izin: 0,
    dispen: 0,
    terlambat: 0,
  });
  const [rplSummary, setRplSummary] = useState<RplSummaryData | null>(null);
  const [pinList, setPinList] = useState<SiswaAbsenPinItem[]>([]);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tingkat');
      if (t && ['10', '11', '12', 'all'].includes(t)) {
        setActiveTingkat(t);
      }
      const k = params.get('kelas');
      if (k) setSelectedClass(k);
    }
    loadRplSummary();
  }, []);

  useEffect(() => {
    loadAbsenData();
  }, [activeTingkat, selectedClass, selectedStatus, selectedDate]);

  const loadRplSummary = async () => {
    try {
      const data = await fetchRplSummary();
      setRplSummary(data);
    } catch (err: any) {
      console.warn('Gagal memuat info kelas:', err.message);
    }
  };

  const loadPinList = async () => {
    try {
      const pins = await fetchSiswaAbsenPinList();
      setPinList(pins);
      setShowPinModal(true);
    } catch (err: any) {
      alert('Gagal memuat list PIN: ' + err.message);
    }
  };

  const loadAbsenData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSiswaAbsenList({
        tingkat: activeTingkat !== 'all' ? activeTingkat : undefined,
        nama_kelas: selectedClass !== 'all' ? selectedClass : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        tanggal: selectedDate ? selectedDate : undefined,
      });
      setRecords(res.data);
      setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data presensi');
    } finally {
      setLoading(false);
    }
  };

  // Available classes for current selected tingkat
  const availableClasses = useMemo(() => {
    if (!rplSummary?.classes) return [];
    if (activeTingkat === 'all') {
      return rplSummary.classes;
    }
    return rplSummary.classes.filter((c) => String(c.tingkat) === String(activeTingkat));
  }, [rplSummary, activeTingkat]);

  // Client search filter
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.nama_siswa.toLowerCase().includes(q) ||
        (r.nisn && r.nisn.toLowerCase().includes(q)) ||
        (r.nama_kelas && r.nama_kelas.toLowerCase().includes(q)) ||
        (r.nama_petugas && r.nama_petugas.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tanpa_keterangan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Tanpa Keterangan</span>
          </span>
        );
      case 'sakit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Sakit</span>
          </span>
        );
      case 'izin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Izin</span>
          </span>
        );
      case 'dispen':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Dispen</span>
          </span>
        );
      case 'terlambat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Terlambat</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Rekap Presensi Siswa RPL SMK Sangkuriang 1 Cimahi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Absensi Siswa
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Data absensi bersumber dari tabel <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700 font-mono text-xs">siswa_absen</code> yang diinput oleh perwakilan siswa tiap kelas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Link to Siswa Absen Form */}
          <Link
            href="/siswa-absen"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Input Absen Kelas</span>
          </Link>

          {/* Button View PIN Kelas */}
          <button
            onClick={loadPinList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Daftar PIN Kelas untuk dibagikan ke siswa"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Daftar PIN Kelas</span>
          </button>

          <button
            onClick={loadAbsenData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Segarkan presensi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Tingkat Tabs (Semua, Kelas 10, Kelas 11, Kelas 12) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => {
            setActiveTingkat('all');
            setSelectedClass('all');
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            activeTingkat === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTingkat === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
              Semua Angkatan
            </span>
            <Building2 className={`w-4 h-4 ${activeTingkat === 'all' ? 'text-slate-300' : 'text-slate-400'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-2 leading-none">
            {rplSummary?.total_siswa || '359'} Siswa
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Kelas 10, 11, &amp; 12
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTingkat('10');
            setSelectedClass('all');
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            activeTingkat === '10'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTingkat === '10' ? 'text-indigo-100' : 'text-indigo-600'}`}>
              Kelas 10 RPL
            </span>
            <GraduationCap className={`w-4 h-4 ${activeTingkat === '10' ? 'text-indigo-200' : 'text-indigo-400'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-2 leading-none">
            {rplSummary?.kelas_10 || '88'} Siswa
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === '10' ? 'text-indigo-100' : 'text-slate-500'}`}>
            Tingkat X PPLG
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTingkat('11');
            setSelectedClass('all');
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            activeTingkat === '11'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTingkat === '11' ? 'text-emerald-100' : 'text-emerald-600'}`}>
              Kelas 11 RPL
            </span>
            <GraduationCap className={`w-4 h-4 ${activeTingkat === '11' ? 'text-emerald-200' : 'text-emerald-400'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-2 leading-none">
            {rplSummary?.kelas_11 || '140'} Siswa
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === '11' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Tingkat XI PPLG
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTingkat('12');
            setSelectedClass('all');
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            activeTingkat === '12'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTingkat === '12' ? 'text-purple-100' : 'text-purple-600'}`}>
              Kelas 12 RPL
            </span>
            <GraduationCap className={`w-4 h-4 ${activeTingkat === '12' ? 'text-purple-200' : 'text-purple-400'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black mt-2 leading-none">
            {rplSummary?.kelas_12 || '131'} Siswa
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === '12' ? 'text-purple-100' : 'text-slate-500'}`}>
            Tingkat XII PPLG
          </div>
        </button>
      </div>

      {/* KPI Cards: 5 Status (Tanpa Keterangan, Sakit, Izin, Dispen, Terlambat) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase ${selectedStatus === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Total Tercatat
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{summary.total_tidak_hadir}</div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'tanpa_keterangan' ? 'all' : 'tanpa_keterangan')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'tanpa_keterangan'
              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
              : 'bg-white border-rose-200 text-rose-700 bg-rose-50/20 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase ${selectedStatus === 'tanpa_keterangan' ? 'text-rose-100' : 'text-rose-700'}`}>
            Alfa (Tanpa Ket.)
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{summary.tanpa_keterangan}</div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'sakit' ? 'all' : 'sakit')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'sakit'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-white border-amber-200 text-amber-700 bg-amber-50/20 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase ${selectedStatus === 'sakit' ? 'text-amber-100' : 'text-amber-700'}`}>
            Sakit
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{summary.sakit}</div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'izin' ? 'all' : 'izin')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'izin'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white border-blue-200 text-blue-700 bg-blue-50/20 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase ${selectedStatus === 'izin' ? 'text-blue-100' : 'text-blue-700'}`}>
            Izin
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{summary.izin}</div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'dispen' ? 'all' : 'dispen')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'dispen'
              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
              : 'bg-white border-purple-200 text-purple-700 bg-purple-50/20 hover:border-purple-300 shadow-2xs'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase ${selectedStatus === 'dispen' ? 'text-purple-100' : 'text-purple-700'}`}>
            Dispen
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{summary.dispen}</div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'terlambat' ? 'all' : 'terlambat')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'terlambat'
              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
              : 'bg-white border-orange-200 text-orange-700 bg-orange-50/20 hover:border-orange-300 shadow-2xs'
          }`}
        >
          <div className={`text-[10px] font-bold uppercase ${selectedStatus === 'terlambat' ? 'text-orange-100' : 'text-orange-700'}`}>
            Terlambat
          </div>
          <div className="text-xl sm:text-2xl font-black mt-0.5">{summary.terlambat}</div>
        </button>
      </div>

      {/* Main Roster Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Sub-Filters: Class Filter, Date & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Class Select Pill Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedClass('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedClass === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kelas
            </button>
            {availableClasses.map((c) => {
              const isClassSelected =
                (activeTingkat === 'all' || activeTingkat === c.tingkat) &&
                selectedClass === c.nama_kelas &&
                (activeTingkat !== 'all' ? true : activeTingkat === c.tingkat);

              const isActive = activeTingkat === c.tingkat && selectedClass === c.nama_kelas;

              return (
                <button
                  key={`${c.tingkat}-${c.nama_kelas}`}
                  onClick={() => {
                    setActiveTingkat(c.tingkat);
                    setSelectedClass(c.nama_kelas);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.tingkat} {c.nama_kelas}
                </button>
              );
            })}
          </div>

          {/* Date Picker & Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-3 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                title="Filter tanggal presensi"
              />
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
              >
                Reset Tgl
              </button>
            )}

            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / NISN / petugas..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Memuat data absensi siswa...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-slate-500 font-medium text-sm">
              Belum ada data ketidakhadiran (Semua siswa hadir normal atau belum ada input).
            </p>
            <Link
              href="/siswa-absen"
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-bold underline"
            >
              <span>Buka Form Input Absen Siswa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3">NISN</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Petugas Pengabsen</th>
                  <th className="py-3 px-3 text-center">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredRecords.map((rec, idx) => (
                  <tr key={rec.id_siswa_absen} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-xs font-semibold whitespace-nowrap">
                      {rec.tanggal}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.nama_siswa}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-xs font-semibold">
                      {rec.nisn || '-'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                        {rec.tingkat} {rec.nama_kelas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                      {rec.nama_petugas || '-'}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 text-xs">
                      {rec.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-700">{filteredRecords.length}</span> catatan siswa tidak hadir normal
          </div>
          <div>Tabel Database: <code className="font-mono text-teal-600">siswa_absen</code></div>
        </div>
      </div>

      {/* Modal Daftar PIN Kelas */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <span>Daftar PIN Kelas RPL (Untuk Siswa Petugas)</span>
              </h3>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Berikut adalah daftar PIN untuk tiap kelas yang dapat dibagikan kepada 3 orang siswa perwakilan yang bertugas mengabsen di menu <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700 font-mono text-xs">/siswa-absen</code>:
            </p>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3 text-center">PIN Kelas</th>
                    <th className="py-2.5 px-3">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pinList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        Kelas {p.tingkat} {p.nama_kelas}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-teal-700 tracking-wider">
                        {p.pin}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `PIN Absen Kelas ${p.tingkat} ${p.nama_kelas}: ${p.pin}\nLink: https://rpl.sakuci.id/siswa-absen`
                            );
                            alert(`PIN untuk ${p.tingkat} ${p.nama_kelas} berhasil disalin ke clipboard!`);
                          }}
                          className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 underline cursor-pointer"
                        >
                          Salin Info
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
