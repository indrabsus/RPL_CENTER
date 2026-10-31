'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Layers, 
  RefreshCw,
  ChevronRight,
  Sparkles,
  Info,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_STUDENTS_DATA } from '@/lib/studentsData';

interface StageProgress {
  tka: 'acc' | 'revisi' | 'blank' | string;
  verif_dokumen: 'acc' | 'revisi' | 'blank' | string;
  pra_ukk: 'acc' | 'revisi' | 'blank' | string;
  prep_ukk: 'acc' | 'revisi' | 'blank' | string;
  ukk: 'acc' | 'revisi' | 'blank' | string;
  pkl: 'acc' | 'revisi' | 'blank' | string;
  uji_laporan_pkl: 'acc' | 'revisi' | 'blank' | string;
  saj: 'acc' | 'revisi' | 'blank' | string;
}

interface StudentControl {
  rowNumber: number;
  noUrut?: number;
  nisn?: string;
  nama: string;
  kelas: string;
  stages: StageProgress;
}

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwmm490dSJgeUisr4iWEIn8fgmiyQO74XJZM0dOJFbT76qPLCvUD31UP8o6OfbcHpnmOg/exec';

export default function KartuKontrolPage() {
  const [students, setStudents] = useState<StudentControl[]>(INITIAL_STUDENTS_DATA as StudentControl[]);
  const [selectedStudent, setSelectedStudent] = useState<StudentControl>(INITIAL_STUDENTS_DATA[0] as StudentControl);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [gasUrl, setGasUrl] = useState<string>(DEFAULT_GAS_URL);
  const [showGasModal, setShowGasModal] = useState<boolean>(false);

  // Force Light Mode on Kartu Kontrol page unconditionally
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      try {
        const saved = localStorage.getItem('rpl_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    };
  }, []);

  // Load GAS URL from localStorage if configured
  useEffect(() => {
    const savedUrl = localStorage.getItem('KARTU_KONTROL_GAS_URL') || DEFAULT_GAS_URL;
    setGasUrl(savedUrl);
    if (savedUrl) {
      fetchLiveGasData(savedUrl);
    }
  }, []);

  const fetchLiveGasData = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    try {
      setLoading(true);
      const endpoint = url.includes('?') ? `${url}&action=getJsonData` : `${url}?action=getJsonData`;
      const res = await fetch(endpoint, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.students) && json.students.length > 0) {
        setStudents(json.students);
        setSelectedStudent(json.students[0]);
      }
    } catch (err) {
      console.warn('Gagal memuat data dari GAS URL, menggunakan dataset spreadsheet lokal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGasUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('KARTU_KONTROL_GAS_URL', gasUrl.trim());
    setShowGasModal(false);
    if (gasUrl.trim()) {
      fetchLiveGasData(gasUrl.trim());
    }
  };

  // Extract unique classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.kelas && s.kelas.trim()) set.add(s.kelas.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'all' || s.kelas === selectedClass;
      const matchSearch =
        searchQuery.trim() === '' ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.noUrut && String(s.noUrut).includes(searchQuery));
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, searchQuery]);

  // Overall Statistics matching spreadsheet reality
  const stats = useMemo(() => {
    const total = students.length;
    const totalVerifAcc = students.filter((s) => s.stages?.verif_dokumen === 'acc').length;
    const totalRevisi = students.filter((s) => s.stages?.verif_dokumen === 'revisi').length;
    const totalBelumVerif = students.filter((s) => s.stages?.verif_dokumen === 'blank').length;
    return { total, totalVerifAcc, totalRevisi, totalBelumVerif };
  }, [students]);

  // Render paraf or cap
  const renderParaf = (status?: string) => {
    if (status === 'acc') {
      return (
        <div className="flex items-center justify-center w-full h-full p-0.5">
          <img
            src="/cap_rpl.png"
            alt="Cap ACC"
            className="w-18 h-18 sm:w-20 sm:h-20 object-contain select-none"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>
      );
    } else if (status === 'revisi') {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="border-2 border-dashed border-red-600 text-red-700 font-extrabold text-xs sm:text-sm tracking-wider px-2.5 py-1 rounded-sm uppercase -rotate-6 select-none bg-red-50/60 shadow-2xs">
            REVISI
          </div>
        </div>
      );
    }
    // Kalau belum diperiksa, kosongkan saja
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Data Langsung dari Google Spreadsheet</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kartu Kontrol Progres Akademik &amp; Kompetensi
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Monitoring kelulusan tahapan UKK, PKL, TKA &amp; SAJ Siswa Kelas 12 RPL SMK Sangkuriang 1 Cimahi
          </p>
        </div>

        {/* Action Button: Konfigurasi Spreadsheet GAS */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setShowGasModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Pengaturan Integrasi Google Spreadsheet"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sumber Data Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Siswa di Spreadsheet</div>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-2xs flex items-center gap-3.5 bg-linear-to-br from-emerald-50/20 to-transparent">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 leading-tight">
              {stats.totalVerifAcc}
            </div>
            <div className="text-xs text-emerald-700 font-medium">ACC Verifikasi Dokumen</div>
          </div>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-2xs flex items-center gap-3.5 bg-linear-to-br from-amber-50/20 to-transparent">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 leading-tight">
              {stats.totalRevisi}
            </div>
            <div className="text-xs text-amber-700 font-medium">Revisi Verifikasi Dokumen</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center gap-3.5 bg-linear-to-br from-slate-50 to-transparent">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-700 leading-tight">
              {stats.totalBelumVerif}
            </div>
            <div className="text-xs text-slate-500 font-medium">Belum Diperiksa</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Filter & Student Roster List */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Daftar Siswa ({filteredStudents.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Pilih untuk melihat kartu</span>
          </div>

          {/* Filter Kelas & Pencarian */}
          <div className="space-y-2.5">
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="all">Semua Kelas ({students.length} Siswa)</option>
                {classesList.map((c) => {
                  const countClass = students.filter((s) => s.kelas === c).length;
                  return (
                    <option key={c} value={c}>
                      {c} ({countClass} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Student Scrollable List */}
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada siswa yang sesuai pencarian.
              </div>
            ) : (
              filteredStudents.map((st, idx) => {
                const isSelected = selectedStudent.nama === st.nama && selectedStudent.rowNumber === st.rowNumber;
                return (
                  <button
                    key={`${st.rowNumber}-${st.nama}`}
                    onClick={() => setSelectedStudent(st)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl my-1 transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm truncate">
                          {st.nama}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {st.kelas}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 ml-2">
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected
                            ? 'text-indigo-600 translate-x-0.5'
                            : 'text-slate-300 group-hover:text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: The Exact Official A4 Kartu Kontrol Sheet */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="kartu-kontrol-sheet w-full max-w-[800px] bg-white border border-slate-300 rounded-lg shadow-xl p-6 sm:p-10 font-serif text-black relative select-none">
            {/* Header with School Logo & Titles */}
            <div className="flex items-center relative pb-3 border-b-2 border-black">
              <img
                src="/logo.png"
                alt="Logo SMK Sangkuriang 1 Cimahi"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain absolute left-0 top-1/2 -translate-y-1/2"
              />
              <div className="w-full text-center pl-16 pr-2 sm:pl-20 sm:pr-0">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight uppercase leading-snug">
                  YAYASAN PENDIDIKAN SANGKURIANG CIMAHI
                  <br />
                  SMK SANGKURIANG 1 CIMAHI
                </h1>
                <h2 className="text-xs sm:text-sm md:text-base font-extrabold uppercase mt-1 tracking-wide text-black">
                  KARTU KONTROL PROGRES AKADEMIK &amp; KOMPETENSI
                </h2>
                <h3 className="text-[11px] sm:text-xs font-semibold text-slate-800 mt-0.5">
                  Kompetensi Keahlian: Rekayasa Perangkat Lunak (RPL)
                </h3>
              </div>
            </div>

            {/* Student Identification Bar */}
            <div className="mt-4 mb-4 text-xs sm:text-sm font-sans space-y-1.5 border-b border-slate-200 pb-3">
              <div className="flex items-baseline">
                <span className="w-28 sm:w-32 font-semibold text-slate-700">Nama Siswa</span>
                <span className="w-4 text-center">:</span>
                <span className="font-extrabold text-slate-900 uppercase tracking-wide">
                  {selectedStudent.nama}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 sm:w-32 font-semibold text-slate-700">Kelas</span>
                <span className="w-4 text-center">:</span>
                <span className="font-bold text-slate-800">{selectedStudent.kelas}</span>
              </div>
            </div>

            {/* 8 Stages Two-Column Official Grid */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-center text-xs sm:text-sm font-bold">
                    <th className="border border-black p-2 w-[8%]">No</th>
                    <th className="border border-black p-2 w-[27%]">Tahapan Kegiatan</th>
                    <th className="border border-black p-2 w-[15%]">Paraf &amp; Cap</th>
                    <th className="border border-black p-2 w-[8%]">No</th>
                    <th className="border border-black p-2 w-[27%]">Tahapan Kegiatan</th>
                    <th className="border border-black p-2 w-[15%]">Paraf &amp; Cap</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {/* Row 1: TKA vs UKK */}
                  <tr className="border-b border-black">
                    <td className="border border-black text-center font-bold">1</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      TKA
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Tes Kemampuan Akademik)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.tka)}
                    </td>

                    <td className="border border-black text-center font-bold">5</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      UKK
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Uji Kompetensi Keahlian)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.ukk)}
                    </td>
                  </tr>

                  {/* Row 2: Verifikasi Dokumen UKK vs PKL */}
                  <tr className="border-b border-black">
                    <td className="border border-black text-center font-bold">2</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      Verifikasi Dokumen UKK
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Pemeriksaan Portofolio &amp; Berkas)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle bg-slate-50/30">
                      {renderParaf(selectedStudent.stages?.verif_dokumen)}
                    </td>

                    <td className="border border-black text-center font-bold">6</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      PKL
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Praktik Kerja Lapangan)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.pkl)}
                    </td>
                  </tr>

                  {/* Row 3: Preparation UKK vs Uji Laporan PKL */}
                  <tr className="border-b border-black">
                    <td className="border border-black text-center font-bold">3</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      Preparation UKK
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Kesiapan Teknis &amp; Workshop)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.prep_ukk)}
                    </td>

                    <td className="border border-black text-center font-bold">7</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      Uji Laporan PKL
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Sidang Presentasi Industri)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.uji_laporan_pkl)}
                    </td>
                  </tr>

                  {/* Row 4: Pra UKK vs SAJ */}
                  <tr>
                    <td className="border border-black text-center font-bold">4</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      Pra UKK
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Simulasi Uji Kejuruan)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.pra_ukk)}
                    </td>

                    <td className="border border-black text-center font-bold">8</td>
                    <td className="border border-black p-2.5 font-bold leading-tight">
                      SAJ
                      <span className="block text-[10px] font-normal text-slate-600 mt-0.5">
                        (Sumatif Akhir Jenjang)
                      </span>
                    </td>
                    <td className="border border-black p-1 text-center h-22 sm:h-24 align-middle">
                      {renderParaf(selectedStudent.stages?.saj)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Signature Section */}
            <div className="mt-8 flex justify-end font-sans">
              <div className="text-center w-64 text-xs sm:text-sm">
                <div>Cimahi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="mt-1 font-semibold">Mengetahui,</div>
                <div className="text-slate-700">Kepala Program Keahlian RPL</div>
                <div className="h-18"></div>
                <div className="font-extrabold underline text-slate-900 tracking-wide">
                  Indra Batara, S.Pd., Gr.
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">NUPTK. 0550769670130102</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal: Google Apps Script Web App Integration */}
      {showGasModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Sync Google Spreadsheet</span>
              </h3>
              <button
                onClick={() => setShowGasModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Aplikasi ini membaca progres siswa dari Spreadsheet ID{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">
                1yavW4vvGpLbGVg4S_U0krsHAscBZ7JSk_XPZzD7LEh0
              </code>{' '}
              pada tab GID <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">1558767801</code>.
              Jika Anda telah men-deploy Google Apps Script sebagai Web App, masukkan URL-nya di bawah ini untuk sinkronisasi otomatis secara langsung.
            </p>

            <form onSubmit={handleSaveGasUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGasModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Menghubungkan...' : 'Simpan &amp; Sinkron'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
