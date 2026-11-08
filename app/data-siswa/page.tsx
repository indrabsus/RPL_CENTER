'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Calendar,
  XCircle,
  HelpCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ChevronRight,
  Printer,
  X,
  FileText,
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  Edit3,
  Check
} from 'lucide-react';
import {
  fetchRplSiswa,
  fetchRplSummary,
  RplSiswaItem,
  RplSummaryData,
  fetchGuruList,
  fetchWaliKelas,
  saveWaliKelas,
  changeSiswaUsername,
  resetSiswaPassword,
  verifyRole,
  GuruItem,
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

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export default function DataSiswaPage() {
  const [activeTingkat, setActiveTingkat] = useState<string>('all'); // 'all', '10', '11', '12'
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<RplSiswaItem[]>([]);
  const [summary, setSummary] = useState<RplSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Print PDF Modal States
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printClass, setPrintClass] = useState<string>(''); // e.g. "10-PPLG 1"
  const [printStartDate, setPrintStartDate] = useState<string>('');
  const [printEndDate, setPrintEndDate] = useState<string>('');
  const [printValidationError, setPrintValidationError] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState<boolean>(false);
  const [printStudents, setPrintStudents] = useState<RplSiswaItem[]>([]);
  const [printExecuted, setPrintExecuted] = useState<boolean>(false);

  // Wali Kelas States (from Zakola DB)
  const [waliKelasMapping, setWaliKelasMapping] = useState<Record<string, string>>({});
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [showWaliModal, setShowWaliModal] = useState<boolean>(false);
  const [loadingGuru, setLoadingGuru] = useState<boolean>(false);
  const [savingWali, setSavingWali] = useState<boolean>(false);
  const [waliSaveStatus, setWaliSaveStatus] = useState<string | null>(null);

  // Auth State (Admin / Petugas)
  const [authRole, setAuthRole] = useState<'admin' | 'sarpras' | null>(null);
  const [authUsername, setAuthUsername] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('petugas');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Student Account Management States
  const [editingStudent, setEditingStudent] = useState<RplSiswaItem | null>(null);
  const [newUsernameInput, setNewUsernameInput] = useState<string>('');
  const [changeUsernameError, setChangeUsernameError] = useState<string | null>(null);
  const [changeUsernameLoading, setChangeUsernameLoading] = useState<boolean>(false);

  const [resetConfirmStudent, setResetConfirmStudent] = useState<RplSiswaItem | null>(null);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAuthorized = authRole === 'admin' || authRole === 'sarpras';

  // Check URL parameters & Auth session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = (sessionStorage.getItem('sarpras_auth_role') || sessionStorage.getItem('monitor_auth_role')) as 'admin' | 'sarpras' | null;
      const savedUser = sessionStorage.getItem('sarpras_auth_username') || sessionStorage.getItem('monitor_auth_username') || '';
      if (savedRole) {
        setAuthRole(savedRole);
        setAuthUsername(savedUser);
      }

      const params = new URLSearchParams(window.location.search);
      const t = params.get('tingkat');
      if (t && ['10', '11', '12', 'all'].includes(t)) {
        setActiveTingkat(t);
      }
      const k = params.get('kelas');
      if (k) setSelectedClass(k);
    }
    loadSummary();
    loadWaliKelas();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await verifyRole({
        username: loginUsername.trim(),
        password: loginPassword.trim(),
      });
      setAuthRole(res.role);
      setAuthUsername(res.username || (res.role === 'admin' ? 'admin' : 'petugas'));
      sessionStorage.setItem('sarpras_auth_role', res.role);
      sessionStorage.setItem('sarpras_auth_username', res.username || (res.role === 'admin' ? 'admin' : 'petugas'));
      if (res.pin) sessionStorage.setItem('sarpras_auth_pin', res.pin);
      setShowLoginModal(false);
      setToastMessage({ type: 'success', text: `Berhasil masuk sebagai ${res.username || res.role} (${res.role === 'admin' ? 'Administrator' : 'Petugas Sarpras'})` });
      setTimeout(() => setToastMessage(null), 4000);
      loadStudents();
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal, periksa kredensial Anda');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthRole(null);
    setAuthUsername('');
    sessionStorage.removeItem('sarpras_auth_role');
    sessionStorage.removeItem('sarpras_auth_username');
    sessionStorage.removeItem('sarpras_auth_pin');
    sessionStorage.removeItem('monitor_auth_role');
    sessionStorage.removeItem('monitor_auth_username');
    sessionStorage.removeItem('monitor_auth_pin');
    setToastMessage({ type: 'success', text: 'Berhasil keluar' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenChangeUsername = (st: RplSiswaItem) => {
    setEditingStudent(st);
    setNewUsernameInput(st.username || '');
    setChangeUsernameError(null);
  };

  const handleSubmitChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const clean = newUsernameInput.trim().toLowerCase();
    if (!clean) {
      setChangeUsernameError('Username tidak boleh kosong!');
      return;
    }
    if (clean.length < 3) {
      setChangeUsernameError('Username minimal 3 karakter!');
      return;
    }
    setChangeUsernameLoading(true);
    setChangeUsernameError(null);
    try {
      await changeSiswaUsername({
        id_siswa: editingStudent.id_siswa,
        new_username: clean,
      });
      // Update student list state
      setStudents((prev) =>
        prev.map((s) => (s.id_siswa === editingStudent.id_siswa ? { ...s, username: clean } : s))
      );
      setToastMessage({ type: 'success', text: `Username ${editingStudent.nama_lengkap} berhasil diubah menjadi '${clean}'` });
      setTimeout(() => setToastMessage(null), 4000);
      setEditingStudent(null);
    } catch (err: any) {
      setChangeUsernameError(err.message || 'Gagal mengubah username');
    } finally {
      setChangeUsernameLoading(false);
    }
  };

  const handleOpenResetPassword = (st: RplSiswaItem) => {
    setResetConfirmStudent(st);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetConfirmStudent) return;
    setResetLoading(true);
    try {
      await resetSiswaPassword({ id_siswa: resetConfirmStudent.id_siswa });
      setStudents((prev) =>
        prev.map((s) => (s.id_siswa === resetConfirmStudent.id_siswa ? { ...s, is_default_password: true } : s))
      );
      setToastMessage({ type: 'success', text: `Password ${resetConfirmStudent.nama_lengkap} berhasil di-reset ke default: 123456` });
      setTimeout(() => setToastMessage(null), 4000);
      setResetConfirmStudent(null);
    } catch (err: any) {
      alert(err.message || 'Gagal mereset password');
    } finally {
      setResetLoading(false);
    }
  };

  const loadWaliKelas = async () => {
    try {
      const mapping = await fetchWaliKelas();
      setWaliKelasMapping(mapping);
    } catch (e) {
      console.warn('Gagal memuat wali kelas:', e);
    }
  };

  const handleOpenWaliModal = async () => {
    setShowWaliModal(true);
    setWaliSaveStatus(null);
    if (guruList.length === 0) {
      setLoadingGuru(true);
      try {
        const teachers = await fetchGuruList();
        setGuruList(teachers);
      } catch (err: any) {
        console.warn('Gagal memuat list guru:', err.message);
      } finally {
        setLoadingGuru(false);
      }
    }
  };

  const handleSaveWaliKelas = async () => {
    setSavingWali(true);
    setWaliSaveStatus(null);
    try {
      await saveWaliKelas(waliKelasMapping);
      setWaliSaveStatus('success');
      setTimeout(() => {
        setShowWaliModal(false);
        setWaliSaveStatus(null);
      }, 1000);
    } catch (err: any) {
      setWaliSaveStatus(err.message || 'Gagal menyimpan wali kelas');
    } finally {
      setSavingWali(false);
    }
  };

  // Reload students when filter changes
  useEffect(() => {
    loadStudents();
  }, [activeTingkat, selectedClass, startDate, endDate]);

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
        start_date: startDate || undefined,
        end_date: endDate || undefined,
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

  // Total Absensi Counters in current filtered view
  const absenTotals = useMemo(() => {
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let terlambat = 0;
    let dispen = 0;

    filteredStudents.forEach((s) => {
      sakit += Number(s.sakit || 0);
      izin += Number(s.izin || 0);
      alfa += Number(s.alfa || 0);
      terlambat += Number(s.terlambat || 0);
      dispen += Number(s.dispen || 0);
    });

    return { sakit, izin, alfa, terlambat, dispen, total: sakit + izin + alfa + terlambat + dispen };
  }, [filteredStudents]);

  // Print Totals for printable document
  const printTotals = useMemo(() => {
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let terlambat = 0;
    let dispen = 0;

    printStudents.forEach((s) => {
      sakit += Number(s.sakit || 0);
      izin += Number(s.izin || 0);
      alfa += Number(s.alfa || 0);
      terlambat += Number(s.terlambat || 0);
      dispen += Number(s.dispen || 0);
    });

    return { sakit, izin, alfa, terlambat, dispen, grandTotal: sakit + izin + alfa + terlambat + dispen };
  }, [printStudents]);

  const handleResetDate = () => {
    setStartDate('');
    setEndDate('');
  };

  // Open Print Modal with prefilled values
  const handleOpenPrintModal = () => {
    setPrintValidationError(null);
    if (activeTingkat !== 'all' && selectedClass !== 'all') {
      setPrintClass(`${activeTingkat}-${selectedClass}`);
    } else {
      setPrintClass('');
    }
    setPrintStartDate(startDate || '');
    setPrintEndDate(endDate || '');
    setShowPrintModal(true);
  };

  // Execute Print with validation
  const handleExecutePrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrintValidationError(null);

    // 1. Validation: Class must be selected
    if (!printClass || printClass === '' || printClass === 'all') {
      setPrintValidationError('Pilih salah satu kelas terlebih dahulu sebelum mencetak.');
      return;
    }

    // 2. Validation: Date Range must be selected
    if (!printStartDate) {
      setPrintValidationError('Tentukan Tanggal Mulai presensi.');
      return;
    }
    if (!printEndDate) {
      setPrintValidationError('Tentukan Tanggal Akhir presensi.');
      return;
    }
    if (printStartDate > printEndDate) {
      setPrintValidationError('Tanggal Mulai tidak boleh lebih besar dari Tanggal Akhir.');
      return;
    }

    setIsPreparingPrint(true);
    try {
      const [t, k] = printClass.split('-');
      const res = await fetchRplSiswa({
        tingkat: t,
        kelas: k,
        start_date: printStartDate,
        end_date: printEndDate,
      });

      setPrintStudents(res.data);
      setShowPrintModal(false);
      setPrintExecuted(true);

      // Trigger native browser print
      setTimeout(() => {
        window.print();
        setIsPreparingPrint(false);
      }, 400);
    } catch (err: any) {
      setPrintValidationError(err.message || 'Gagal menyiapkan data cetak.');
      setIsPreparingPrint(false);
    }
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. SCREEN VIEW (Hidden when printing)                        */}
      {/* ============================================================ */}
      <div className="w-full space-y-6 screen-only print-hide print:hidden" data-print="hide">
        {/* Top Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Pusat Data Jurusan RPL SMK Sangkuriang 1 Cimahi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Data Siswa &amp; Rekap Kehadiran
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Database siswa terintegrasi log absensi kelas harian dengan filter rentang tanggal &amp; cetak PDF resmi
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* User Session Badge / Login Button */}
            {isAuthorized ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[100px]">{authUsername || (authRole === 'admin' ? 'admin' : 'petugas')}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200/70 text-emerald-900 rounded font-bold uppercase">
                  {authRole === 'admin' ? 'Admin' : 'Petugas'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setShowLoginModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Login sebagai Admin atau Petugas untuk kelola username & reset password"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Login Petugas / Admin</span>
              </button>
            )}

            {/* Button Atur Wali Kelas */}
            <button
              onClick={handleOpenWaliModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Atur Nama Wali Kelas dari Database Guru Zakola"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
              <span>Atur Wali Kelas</span>
            </button>

            {/* Button Cetak PDF */}
            <button
              onClick={handleOpenPrintModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Cetak laporan PDF data siswa & rekap presensi"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cetak PDF</span>
            </button>

            <Link
              href="/absen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Monitoring Absensi</span>
            </Link>

            <button
              onClick={() => {
                loadSummary();
                loadStudents();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Muat ulang data siswa"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Tabs: Total Siswa, Kelas 10, Kelas 11, Kelas 12 */}
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

        {/* Attendance Summary Strip in Selected Range */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs bg-amber-50/20">
            <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Total Sakit</span>
            </div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{absenTotals.sakit}</div>
          </div>

          <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-2xs bg-blue-50/20">
            <div className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Total Izin</span>
            </div>
            <div className="text-xl font-black text-blue-700 mt-0.5">{absenTotals.izin}</div>
          </div>

          <div className="bg-white border border-rose-200 rounded-xl p-3 shadow-2xs bg-rose-50/20">
            <div className="text-[10px] font-bold text-rose-700 uppercase flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Total Alpa</span>
            </div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{absenTotals.alfa}</div>
          </div>

          <div className="bg-white border border-orange-200 rounded-xl p-3 shadow-2xs bg-orange-50/20">
            <div className="text-[10px] font-bold text-orange-700 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Total Terlambat</span>
            </div>
            <div className="text-xl font-black text-orange-700 mt-0.5">{absenTotals.terlambat}</div>
          </div>

          <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-2xs bg-purple-50/20">
            <div className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Total Dispen</span>
            </div>
            <div className="text-xl font-black text-purple-700 mt-0.5">{absenTotals.dispen}</div>
          </div>
        </div>

        {/* Main Roster Container */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          {/* Filters: Class Pills, Date Range Filter & Search */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
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

            {/* Date Range Filter & Search Box */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-500 font-semibold text-[11px]">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
                    title="Tanggal mulai filter"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-500 font-semibold text-[11px]">Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
                    title="Tanggal akhir filter"
                  />
                </div>

                {(startDate || endDate) && (
                  <button
                    onClick={handleResetDate}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer shadow-2xs transition-all"
                    title="Hapus filter rentang tanggal"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus Filter Tanggal</span>
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px] sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Memuat data siswa &amp; rekap absensi...</p>
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
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-3 w-14 text-center">L/P</th>
                    {isAuthorized && (
                      <>
                        <th className="py-3 px-3 w-40 text-left text-indigo-700">Username</th>
                        <th className="py-3 px-3 w-36 text-center text-amber-700">Reset Password</th>
                      </>
                    )}
                    <th className="py-3 px-3 w-20 text-center text-amber-700">Sakit</th>
                    <th className="py-3 px-3 w-20 text-center text-blue-700">Izin</th>
                    <th className="py-3 px-3 w-20 text-center text-rose-700">Alpa</th>
                    <th className="py-3 px-3 w-24 text-center text-orange-700">Terlambat</th>
                    <th className="py-3 px-3 w-20 text-center text-purple-700">Dispen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredStudents.map((st, idx) => (
                    <tr key={st.id_siswa} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {st.nama_lengkap}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Kelas {st.tingkat} {st.nama_kelas}
                        </div>
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

                      {/* Kolom Tambahan: Username & Ganti Username */}
                      {isAuthorized && (
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200/90 rounded-lg px-2 py-1 max-w-[170px]">
                            <span
                              className="font-mono text-xs font-bold text-slate-800 truncate"
                              title={st.username || 'Belum ada username'}
                            >
                              {st.username || <span className="text-slate-400 font-sans italic text-[11px]">Belum dibuat</span>}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenChangeUsername(st)}
                              className="p-1 rounded-md hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 transition-colors cursor-pointer shrink-0"
                              title={`Ganti username untuk ${st.nama_lengkap}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Kolom Tambahan: Reset Password */}
                      {isAuthorized && (
                        <td className="py-3 px-3 text-center">
                          {st.is_default_password ? (
                            <button
                              disabled
                              type="button"
                              className="inline-flex items-center justify-center gap-1 w-full max-w-[140px] px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none opacity-80"
                              title="Password masih default (123456). Tombol dinonaktifkan."
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">Default (123456)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenResetPassword(st)}
                              className="inline-flex items-center justify-center gap-1 w-full max-w-[140px] px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-95"
                              title="Password telah diubah siswa. Klik untuk reset ke 123456"
                            >
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Reset Password</span>
                            </button>
                          )}
                        </td>
                      )}
                      {/* Sakit */}
                      <td className="py-3 px-3 text-center font-bold">
                        {st.sakit > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                            {st.sakit}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </td>
                      {/* Izin */}
                      <td className="py-3 px-3 text-center font-bold">
                        {st.izin > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                            {st.izin}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </td>
                      {/* Alpa */}
                      <td className="py-3 px-3 text-center font-bold">
                        {st.alfa > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                            {st.alfa}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </td>
                      {/* Terlambat */}
                      <td className="py-3 px-3 text-center font-bold">
                        {st.terlambat > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-200">
                            {st.terlambat}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </td>
                      {/* Dispen */}
                      <td className="py-3 px-3 text-center font-bold">
                        {st.dispen > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                            {st.dispen}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
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
              Menampilkan <span className="font-bold text-slate-700">{filteredStudents.length}</span> siswa
              {startDate || endDate ? (
                <span className="ml-1 text-slate-600">
                  (Rentang Tanggal: {startDate || 'Awal'} s.d. {endDate || 'Hari Ini'})
                </span>
              ) : (
                <span className="ml-1 text-slate-400">(Semua Waktu)</span>
              )}
            </div>
            <div>Sumber: Database Zakola &amp; Presensi Kelas RPL</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MODAL CETAK PDF (PILIH KELAS & DATE RANGE WAJIB)          */}
      {/* ============================================================ */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 screen-only print-hide print:hidden animate-in fade-in-0 duration-150" data-print="hide">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Cetak Dokumen PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rekapitulasi Presensi &amp; Data Siswa Resmi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePrint} className="space-y-4">
              {/* Form Input: Pilih Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Pilih Kelas yang Dicetak: <span className="text-rose-600">*</span>
                </label>
                <select
                  value={printClass}
                  onChange={(e) => setPrintClass(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Pilih Salah Satu Kelas --</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={`${c.tingkat}-${c.kelas}`} value={`${c.tingkat}-${c.kelas}`}>
                      Kelas {c.tingkat} {c.kelas}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format cetak resmi wajib mencetak per kelas.
                </span>
              </div>

              {/* Form Input: Rentang Tanggal (Date Range) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Rentang Tanggal Presensi: <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tanggal Mulai:
                    </span>
                    <input
                      type="date"
                      value={printStartDate}
                      onChange={(e) => setPrintStartDate(e.target.value)}
                      required
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tanggal Akhir:
                    </span>
                    <input
                      type="date"
                      value={printEndDate}
                      onChange={(e) => setPrintEndDate(e.target.value)}
                      required
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Validation Alert */}
              {printValidationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{printValidationError}</span>
                </div>
              )}

              {/* Notice Box Kop Surat */}
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Laporan akan dicetak dengan <strong>Kop Resmi</strong> berlogo <strong>Yayasan Pendidikan Dayang Sumbi Jaya Lestari - SMK Sangkuriang 1 Cimahi</strong> dan kolom tanda tangan resmi.
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPreparingPrint}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isPreparingPrint ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyiapkan Data...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak PDF Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2B. MODAL PENGATURAN WALI KELAS (DATABASE GURU ZAKOLA)       */}
      {/* ============================================================ */}
      {showWaliModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 screen-only print-hide print:hidden animate-in fade-in-0 duration-150" data-print="hide">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Pengaturan Wali Kelas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih nama guru resmi dari Database Zakola untuk setiap kelas RPL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowWaliModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingGuru ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-7 h-7 text-amber-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Mengambil daftar nama guru dari Database Zakola...
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CLASS_OPTIONS.map((c) => {
                    const key = `${c.tingkat}-${c.kelas}`;
                    const currentVal = waliKelasMapping[key] || '';

                    return (
                      <div key={key} className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">
                            Kelas {c.tingkat} {c.kelas}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            Wali Kelas
                          </span>
                        </div>
                        <select
                          value={currentVal}
                          onChange={(e) => {
                            setWaliKelasMapping({
                              ...waliKelasMapping,
                              [key]: e.target.value,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                        >
                          <option value="">-- Kosongkan (Tanda Tangan Manual) --</option>
                          {guruList.map((g) => (
                            <option key={g.id} value={g.nama_lengkap}>
                              {g.nama_lengkap}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {waliSaveStatus === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in-0 duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pengaturan wali kelas berhasil disimpan ke sistem!</span>
              </div>
            )}

            {waliSaveStatus && waliSaveStatus !== 'success' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold animate-in fade-in-0 duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{waliSaveStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Tersimpan di tabel sarpras_pengaturan Zakola
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWaliModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveWaliKelas}
                  disabled={savingWali || loadingGuru}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {savingWali ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simpan Wali Kelas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2.1 MODAL: GANTI USERNAME SISWA                              */}
      {/* ============================================================ */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ganti Username Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur username akun Zakola siswa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Siswa */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{editingStudent.nama_lengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Kelas:</span>
                <span className="font-semibold text-slate-800">Kelas {editingStudent.tingkat} {editingStudent.nama_kelas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Username Sekarang:</span>
                <span className="font-mono font-bold text-indigo-700">{editingStudent.username || '(Belum diset)'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitChangeUsername} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Username Baru: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="contoh: 392destrija"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Hanya huruf kecil, angka, titik, atau underscore (minimal 3 karakter). Jika username sudah dipakai, sistem akan menolak.
                </span>
              </div>

              {changeUsernameError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{changeUsernameError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changeUsernameLoading || !newUsernameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {changeUsernameLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Username</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2.2 MODAL: KONFIRMASI RESET PASSWORD SISWA                   */}
      {/* ============================================================ */}
      {resetConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Konfirmasi Reset Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kembalikan password ke default
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResetConfirmStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">
                Apakah Anda yakin ingin me-reset password akun siswa berikut?
              </p>
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 space-y-1 font-sans">
                <div>Nama: <strong>{resetConfirmStudent.nama_lengkap}</strong></div>
                <div>Kelas: <strong>Kelas {resetConfirmStudent.tingkat} {resetConfirmStudent.nama_kelas}</strong></div>
                <div>Username: <strong className="font-mono">{resetConfirmStudent.username || '-'}</strong></div>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Password akan dikembalikan menjadi default: <strong>123456</strong>. Setelah berhasil di-reset, tombol pada baris siswa ini akan otomatis dinonaktifkan (disabled).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetConfirmStudent(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={resetLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {resetLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Ya, Reset ke 123456</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2.3 MODAL: LOGIN ADMIN / PETUGAS                             */}
      {/* ============================================================ */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Login Petugas / Admin
                  </h3>
                  <p className="text-xs text-slate-500">
                    Akses kelola username &amp; reset password siswa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Akun: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Contoh: petugas atau admin"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password akun"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Masuk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold animate-in fade-in-0 slide-in-from-bottom-2 duration-150 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-rose-600 text-white border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. OFFICIAL PRINTABLE DOCUMENT (A4 LANDSCAPE 1 HALAMAN UTUH)  */}
      {/* ============================================================ */}
      <div id="printable-document" className="hidden print:block w-full text-black bg-white text-[9.5px] leading-tight">
        {/* KOP SURAT RESMI */}
        <div className="flex items-center gap-4 pb-2 border-b-2 border-black">
          <img
            src="/logo-sangkuriang.png"
            alt="Logo SMK Sangkuriang 1 Cimahi"
            className="w-16 h-16 object-contain shrink-0"
          />
          <div className="text-center flex-1">
            <div className="text-[12px] font-bold tracking-wider uppercase text-black leading-tight">
              YAYASAN PENDIDIKAN DAYANG SUMBI JAYA LESTARI
            </div>
            <div className="text-[16px] font-black tracking-wide uppercase text-black leading-tight mt-0.5">
              SMK SANGKURIANG 1 CIMAHI
            </div>
            <div className="text-[10.5px] font-bold text-black uppercase tracking-tight leading-tight mt-0.5">
              KONSENTRASI KEAHLIAN: PENGEMBANGAN PERANGKAT LUNAK DAN GIM (PPLG / RPL)
            </div>
            <div className="text-[9px] text-gray-700 leading-tight mt-0.5">
              Jl. Sangkuriang No. 76 Cimahi 40511 • Telp/Fax: (022) 6652280 • Website: smksangkuriang1cimahi.sch.id
            </div>
          </div>
        </div>
        <div className="border-b border-black mt-[1.5px] mb-2.5"></div>

        {/* JUDUL DOKUMEN & IDENTITAS */}
        <div className="text-center mb-2.5">
          <h2 className="text-[12px] font-black uppercase tracking-wider underline leading-none">
            DAFTAR REKAPITULASI PRESENSI &amp; DATA SISWA
          </h2>
          <div className="text-[9.5px] font-semibold text-black mt-1 flex items-center justify-center gap-4">
            <span>Kelas: <strong>{printClass ? printClass.replace('-', ' ') : '-'}</strong></span>
            <span>•</span>
            <span>Periode: <strong>{formatIndoDate(printStartDate)} s.d. {formatIndoDate(printEndDate)}</strong></span>
            <span>•</span>
            <span>Tahun Ajaran: <strong>2026/2027</strong></span>
          </div>
        </div>

        {/* TABEL DATA SISWA & LOG PRESENSI DUA KOLOM (LANDSCAPE) */}
        {(() => {
          const col1 = printStudents.slice(0, 18);
          const col2 = printStudents.slice(18, 36);

          const renderSubTable = (studentsList: typeof printStudents, startOffset: number) => (
            <table className="w-full text-[9.5px] border border-black border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-black text-center font-bold">
                  <th className="border border-black py-1 px-1 w-6 text-center">No</th>
                  <th className="border border-black py-1 px-1.5 text-left">Nama Siswa</th>
                  <th className="border border-black py-1 px-1 w-5 text-center">L/P</th>
                  <th className="border border-black py-1 px-1 w-5 text-center">S</th>
                  <th className="border border-black py-1 px-1 w-5 text-center">I</th>
                  <th className="border border-black py-1 px-1 w-5 text-center">A</th>
                  <th className="border border-black py-1 px-1 w-5 text-center">T</th>
                  <th className="border border-black py-1 px-1 w-5 text-center">D</th>
                  <th className="border border-black py-1 px-1 w-6 text-center bg-gray-50">Tot</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-black py-4 text-center text-gray-400 italic">
                      Tidak ada data siswa
                    </td>
                  </tr>
                ) : (
                  studentsList.map((st, idx) => {
                    const rowNumber = startOffset + idx + 1;
                    const totalRow =
                      Number(st.sakit || 0) +
                      Number(st.izin || 0) +
                      Number(st.alfa || 0) +
                      Number(st.terlambat || 0) +
                      Number(st.dispen || 0);

                    return (
                      <tr key={st.id_siswa} className="border-b border-gray-300">
                        <td className="border border-black py-[2.5px] px-1 text-center font-mono font-medium">
                          {rowNumber}
                        </td>
                        <td className="border border-black py-[2.5px] px-1.5 font-semibold text-black uppercase truncate max-w-[135px]">
                          {st.nama_lengkap}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center uppercase font-medium">
                          {st.jenkel}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center font-medium">
                          {st.sakit || 0}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center font-medium">
                          {st.izin || 0}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center font-bold text-red-700">
                          {st.alfa || 0}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center font-medium">
                          {st.terlambat || 0}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center font-medium">
                          {st.dispen || 0}
                        </td>
                        <td className="border border-black py-[2.5px] px-1 text-center font-black bg-gray-50">
                          {totalRow}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          );

          return (
            <div>
              <div className="grid grid-cols-2 gap-3 items-start">
                <div>{renderSubTable(col1, 0)}</div>
                <div>{renderSubTable(col2, 18)}</div>
              </div>

              {/* BARIS RINGKASAN TOTAL KELAS */}
              <div className="mt-2 py-1 px-3 bg-gray-100 border border-black flex items-center justify-between text-[9.5px] font-bold">
                <span className="uppercase tracking-wide">
                  REKAP TOTAL SATU KELAS ({printStudents.length} Siswa):
                </span>
                <div className="flex items-center gap-4">
                  <span>Sakit: <strong className="font-black">{printTotals.sakit}</strong></span>
                  <span>Izin: <strong className="font-black">{printTotals.izin}</strong></span>
                  <span className="text-red-700">Alpa: <strong className="font-black">{printTotals.alfa}</strong></span>
                  <span>Terlambat: <strong className="font-black">{printTotals.terlambat}</strong></span>
                  <span>Dispen: <strong className="font-black">{printTotals.dispen}</strong></span>
                  <span className="bg-white px-2 py-0.5 border border-black rounded">
                    Total Ketidakhadiran: <strong className="font-black">{printTotals.grandTotal}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2 SPASI KE TANDA TANGAN (MT-7) */}
        <div className="mt-7 flex justify-between items-start text-[10px] break-inside-avoid">
          <div className="text-left w-64 relative">
            <div>Mengetahui,</div>
            <div className="font-semibold">Kepala Program Keahlian RPL</div>
            <div className="relative h-14 flex items-center">
              {/* Tanda Tangan Kepala Program Keahlian RPL */}
              <img
                src="/ttd-kajur.png"
                alt="Tanda Tangan Kepala Program Keahlian RPL"
                className="relative z-10 h-16 w-auto object-contain -my-1 ml-1 pointer-events-none"
              />
              {/* Cap Stempel Resmi Jurusan RPL: Di sebelah kanan menimpa setengah tanda tangan */}
              <img
                src="/stempel-rpl.png"
                alt="Cap Stempel Resmi Jurusan RPL"
                className="absolute left-6 -top-2.5 w-20 h-20 object-contain -rotate-6 opacity-90 pointer-events-none mix-blend-multiply"
              />
            </div>
            <div className="font-bold underline relative z-10">INDRA BATARA, S.Pd., Gr.</div>
          </div>

          <div className="text-[8px] text-gray-500 italic max-w-xs text-center self-end mb-1">
            * Keterangan: S = Sakit, I = Izin, A = Alpa, T = Terlambat, D = Dispensasi.<br />
            Dicetak otomatis dari Sistem RPL Center SMK Sangkuriang 1 Cimahi.
          </div>

          <div className="text-left w-64">
            <div>Cimahi, {formatIndoDate(new Date().toISOString().split('T')[0])}</div>
            <div className="font-semibold">Wali Kelas {printClass ? printClass.replace('-', ' ') : '-'}</div>
            <div className="h-14"></div>
            <div className="font-bold underline">
              {waliKelasMapping[printClass] || '( ............................................ )'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
