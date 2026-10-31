'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import { fetchRplSiswa, fetchRplSummary, RplSiswaItem, RplSummaryData } from '@/lib/api';

export default function DataSiswaPage() {
  const [activeTingkat, setActiveTingkat] = useState<string>('all'); // 'all', '10', '11', '12'
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<RplSiswaItem[]>([]);
  const [summary, setSummary] = useState<RplSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check URL parameters on mount (?tingkat=10, 11, 12)
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
    loadSummary();
  }, []);

  // Reload students when filter changes
  useEffect(() => {
    loadStudents();
  }, [activeTingkat, selectedClass]);

  const loadSummary = async () => {
    try {
      const data = await fetchRplSummary();
      setSummary(data);
    } catch (err: any) {
      console.warn('Gagal memuat ringkasan:', err.message);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRplSiswa({
        tingkat: activeTingkat !== 'all' ? activeTingkat : undefined,
        kelas: selectedClass !== 'all' ? selectedClass : undefined,
      });
      setStudents(res.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  // Available classes for current selected tingkat
  const availableClasses = useMemo(() => {
    if (!summary?.classes) return [];
    if (activeTingkat === 'all') {
      return summary.classes;
    }
    return summary.classes.filter((c) => String(c.tingkat) === String(activeTingkat));
  }, [summary, activeTingkat]);

  // Client search filter
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.nama_kelas && s.nama_kelas.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Pusat Data Jurusan RPL SMK Sangkuriang 1 Cimahi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Master Siswa RPL
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Database siswa aktif Tahun Ajaran 2026/2027 terintegrasi langsung dengan Zakola
          </p>
        </div>

        <button
          onClick={() => {
            loadSummary();
            loadStudents();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs self-start md:self-auto disabled:opacity-50"
          title="Muat ulang data siswa"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* KPI Stats Tabs: Total, Kelas 10, Kelas 11, Kelas 12 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* All RPL */}
        <button
          onClick={() => {
            setActiveTingkat('all');
            setSelectedClass('all');
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            activeTingkat === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTingkat === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
              Semua Angkatan
            </span>
            <Users className={`w-4 h-4 ${activeTingkat === 'all' ? 'text-blue-200' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 leading-none">
            {summary ? summary.total_siswa : '359'}
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
            Total Siswa RPL Aktif
          </div>
        </button>

        {/* Kelas 10 */}
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
          <div className="text-2xl sm:text-3xl font-black mt-2 leading-none">
            {summary ? summary.kelas_10 : '88'}
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === '10' ? 'text-indigo-100' : 'text-slate-500'}`}>
            Tingkat X (PPLG 1 - 3)
          </div>
        </button>

        {/* Kelas 11 */}
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
          <div className="text-2xl sm:text-3xl font-black mt-2 leading-none">
            {summary ? summary.kelas_11 : '140'}
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === '11' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Tingkat XI (PPLG 1 - 4)
          </div>
        </button>

        {/* Kelas 12 */}
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
          <div className="text-2xl sm:text-3xl font-black mt-2 leading-none">
            {summary ? summary.kelas_12 : '131'}
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${activeTingkat === '12' ? 'text-purple-100' : 'text-slate-500'}`}>
            Tingkat XII (PPLG 1 - 4)
          </div>
        </button>
      </div>

      {/* Main Roster Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Sub-Filters: Class Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
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
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.tingkat} {c.nama_kelas}
                  <span className="ml-1.5 opacity-75 text-[10px]">({c.total})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa / NISN..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Memuat data siswa RPL dari database...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Tidak ada data siswa yang cocok dengan filter atau kata kunci.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-3">NISN</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3 text-center">L/P</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredStudents.map((st, idx) => (
                  <tr key={st.id_siswa} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {st.nama_lengkap}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-xs font-semibold">
                      {st.nisn}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {st.tingkat} {st.nama_kelas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          st.jenkel?.toLowerCase() === 'l'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.jenkel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktif</span>
                      </span>
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
            Menampilkan <span className="font-bold text-slate-700">{filteredStudents.length}</span> siswa aktif terdaftar
          </div>
          <div>Tahun Ajaran 2026/2027 • Database Zakola</div>
        </div>
      </div>
    </div>
  );
}
