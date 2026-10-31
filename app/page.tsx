'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Laptop,
  Monitor,
  Wrench,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  AlertCircle,
  Layers,
  Calendar,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  LogOut,
  ListTodo,
  Wifi,
  Activity,
  Check,
  Building2,
  Users,
  UploadCloud
} from 'lucide-react';
import {
  fetchBarang,
  BarangResponseData,
  BarangItem,
  fetchTimeline,
  submitTimelineAction,
  fetchDokumentasi,
  submitDokumentasiAction,
  uploadKegiatanPhoto,
  verifyRole,
  RplTimelineItem,
  RplDokumentasiItem,
} from '@/lib/api';

function formatTimelineDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      return `${d} ${months[m - 1] || parts[1]} ${y}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

export default function PublicMonitorPage() {
  const [data, setData] = useState<BarangResponseData | null>(null);
  const [timelineList, setTimelineList] = useState<RplTimelineItem[]>([]);
  const [dokumentasiList, setDokumentasiList] = useState<RplDokumentasiItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Laptop');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tersedia' | 'dipinjam'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live Realtime Clock for Monitor TV
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

  // Dual-Role Auth State: 'admin' | 'sarpras' | null
  const [authRole, setAuthRole] = useState<'admin' | 'sarpras' | null>(null);
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPin, setAuthPin] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Timeline Admin Modal State
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const [timelineForm, setTimelineForm] = useState<{
    id?: number;
    nama_kegiatan: string;
    tanggal: string;
    kategori: string;
    keterangan: string;
    status: 'belum_dimulai' | 'sedang_berlangsung' | 'selesai';
  }>({
    nama_kegiatan: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Kejuruan',
    keterangan: '',
    status: 'belum_dimulai',
  });

  // Dokumentasi / Kegiatan Admin Upload Modal State
  const [showDokumentasiModal, setShowDokumentasiModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [dokForm, setDokForm] = useState<{
    id?: number;
    judul: string;
    deskripsi: string;
    foto_url: string;
    tanggal: string;
  }>({
    judul: '',
    deskripsi: '',
    foto_url: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // Custom categories dynamically from data
  const customCategories = useMemo(() => {
    if (!data?.barang) return [];
    const standard = ['Laptop', 'PC Workshop', 'Ruangan Workshop RPL', 'Peralatan'];
    const cats = new Set<string>();
    data.barang.forEach((b) => {
      const k = b.kategori && String(b.kategori).trim();
      if (k && !standard.includes(k)) {
        cats.add(k);
      }
    });
    return Array.from(cats);
  }, [data]);

  // Load saved session on mount
  useEffect(() => {
    const savedRole = (sessionStorage.getItem('sarpras_auth_role') || sessionStorage.getItem('monitor_auth_role')) as 'admin' | 'sarpras' | null;
    const savedUsername = sessionStorage.getItem('sarpras_auth_username') || sessionStorage.getItem('monitor_auth_username') || '';
    const savedPin = sessionStorage.getItem('sarpras_auth_pin') || sessionStorage.getItem('monitor_auth_pin');
    if (savedRole && savedPin) {
      setAuthRole(savedRole);
      setAuthUsername(savedUsername);
      setAuthPin(savedPin);
    }
    loadData();
    loadTimelineData();
    loadDokumentasiData();
  }, []);

  // Carousel auto-play (5 detik)
  useEffect(() => {
    if (dokumentasiList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dokumentasiList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [dokumentasiList.length]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetchBarang();
      setData(res);
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Gagal memuat status sarpras');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadTimelineData = async () => {
    try {
      const list = await fetchTimeline();
      setTimelineList(list);
    } catch (err: any) {
      console.warn('Gagal memuat timeline:', err.message);
    }
  };

  const loadDokumentasiData = async () => {
    try {
      const list = await fetchDokumentasi();
      setDokumentasiList(list);
    } catch (err: any) {
      console.warn('Gagal memuat dokumentasi:', err.message);
    }
  };

  // Login Handler (Username & Password)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Username dan password wajib diisi');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyRole({
        username: loginUsername.trim(),
        password: loginPassword.trim(),
      });
      const activePin = res.pin || (res.role === 'admin' ? '987654' : '654321');
      setAuthRole(res.role);
      setAuthUsername(res.username || loginUsername.trim());
      setAuthPin(activePin);

      // Shared cross-app session
      sessionStorage.setItem('sarpras_auth_role', res.role);
      sessionStorage.setItem('sarpras_auth_username', res.username || loginUsername.trim());
      sessionStorage.setItem('sarpras_auth_pin', activePin);
      sessionStorage.setItem('monitor_auth_role', res.role);
      sessionStorage.setItem('monitor_auth_username', res.username || loginUsername.trim());
      sessionStorage.setItem('monitor_auth_pin', activePin);
      sessionStorage.setItem('kiosk_unlocked_sakuci', 'true');
      if (res.role === 'admin') {
        sessionStorage.setItem('admin_unlocked_sakuci', 'true');
        sessionStorage.setItem('admin_pin_sakuci', activePin);
      } else {
        sessionStorage.removeItem('admin_unlocked_sakuci');
        sessionStorage.removeItem('admin_pin_sakuci');
      }

      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Username atau password salah!');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogoutRole = () => {
    setAuthRole(null);
    setAuthUsername('');
    setAuthPin('');
    sessionStorage.removeItem('sarpras_auth_role');
    sessionStorage.removeItem('sarpras_auth_username');
    sessionStorage.removeItem('sarpras_auth_pin');
    sessionStorage.removeItem('monitor_auth_role');
    sessionStorage.removeItem('monitor_auth_username');
    sessionStorage.removeItem('monitor_auth_pin');
    sessionStorage.removeItem('kiosk_unlocked_sakuci');
    sessionStorage.removeItem('admin_unlocked_sakuci');
    sessionStorage.removeItem('admin_pin_sakuci');
  };

  // Timeline Action Handlers (Admin Only)
  const handleToggleTimelineSelesai = async (id: number) => {
    if (authRole !== 'admin') {
      setShowLoginModal(true);
      return;
    }
    try {
      await submitTimelineAction({
        pin: authPin,
        action: 'toggle_selesai',
        id,
      });
      loadTimelineData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authRole !== 'admin') return;

    try {
      await submitTimelineAction({
        pin: authPin,
        action: timelineForm.id ? 'update' : 'add',
        ...timelineForm,
      });
      setShowTimelineModal(false);
      setTimelineForm({
        nama_kegiatan: '',
        tanggal: new Date().toISOString().split('T')[0],
        kategori: 'Kejuruan',
        keterangan: '',
        status: 'belum_dimulai',
      });
      loadTimelineData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTimeline = async (id: number) => {
    if (authRole !== 'admin') return;
    if (!confirm('Hapus kegiatan ini dari Timeline RPL?')) return;
    try {
      await submitTimelineAction({
        pin: authPin,
        action: 'delete',
        id,
      });
      loadTimelineData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // File Selection Handler for Foto Kegiatan
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (!dokForm.judul) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setDokForm((prev) => ({ ...prev, judul: cleanName }));
      }
    }
  };

  // Upload Foto ke Folder /kegiatan/ dan Simpan ke Tabel kegiatan (Admin Only)
  const handleSaveDokumentasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authRole !== 'admin') return;

    if (!selectedFile && !dokForm.foto_url) {
      alert('Pilih file gambar foto kegiatan terlebih dahulu!');
      return;
    }

    setUploadingPhoto(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('pin', authPin);
        formData.append('judul', dokForm.judul);
        formData.append('deskripsi', dokForm.deskripsi || '');
        formData.append('tanggal', dokForm.tanggal);
        formData.append('foto', selectedFile);

        await uploadKegiatanPhoto(formData);
      } else {
        await submitDokumentasiAction({
          pin: authPin,
          action: 'add',
          judul: dokForm.judul,
          deskripsi: dokForm.deskripsi || '',
          tanggal: dokForm.tanggal,
          foto: dokForm.foto_url,
        });
      }

      setShowDokumentasiModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setDokForm({
        judul: '',
        deskripsi: '',
        foto_url: '',
        tanggal: new Date().toISOString().split('T')[0],
      });
      loadDokumentasiData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan foto kegiatan');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteDokumentasi = async (id: number) => {
    if (authRole !== 'admin') return;
    if (!confirm('Hapus foto ini dari galeri kegiatan RPL?')) return;
    try {
      await submitDokumentasiAction({
        pin: authPin,
        action: 'delete',
        id,
      });
      loadDokumentasiData();
      if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Total items currently in use across categories
  const totalSedangDigunakan = useMemo(() => {
    if (!data) return 0;
    const std =
      (data.stats_laptop?.dipinjam ?? 0) +
      (data.stats_pc?.dipinjam ?? 0) +
      (data.stats_peralatan?.dipinjam_unit ?? 0);
    let custom = 0;
    if (data.barang) {
      const standard = ['Laptop', 'PC Workshop', 'Ruangan Workshop RPL', 'Peralatan'];
      data.barang.forEach((b) => {
        if (b.kategori && !standard.includes(b.kategori)) {
          custom += b.unit_dipinjam ?? (b.status === 'dipinjam' ? 1 : 0);
        }
      });
    }
    return std + custom;
  }, [data]);

  // Filtered items for Sarpras Barang Column
  const filteredItems = useMemo(() => {
    if (!data?.barang) return [];
    return data.barang.filter((item) => {
      if (activeTab === 'Laptop') {
        if (item.kategori !== 'Laptop' && !item.kode_barang.toUpperCase().startsWith('RPL'))
          return false;
      } else if (activeTab === 'Ruangan Workshop RPL' || activeTab === 'PC Workshop') {
        if (
          item.kategori !== 'PC Workshop' &&
          item.kategori !== 'Ruangan Workshop RPL' &&
          !item.kode_barang.toUpperCase().startsWith('PC')
        )
          return false;
      } else if (activeTab === 'Peralatan') {
        if (item.kategori !== 'Peralatan') return false;
      } else {
        if (item.kategori !== activeTab) return false;
      }

      if (statusFilter !== 'all') {
        if (item.kategori === 'Peralatan' || customCategories.includes(item.kategori)) {
          if (statusFilter === 'tersedia' && item.jumlah_tersedia <= 0) return false;
          if (statusFilter === 'dipinjam' && (item.unit_dipinjam ?? 0) <= 0) return false;
        } else {
          if (item.status !== statusFilter) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama_barang.toLowerCase().includes(q);
        const matchCode = item.kode_barang.toLowerCase().includes(q);
        const matchSpecs = item.spesifikasi ? item.spesifikasi.toLowerCase().includes(q) : false;
        const loans: any[] =
          item.active_loans && item.active_loans.length > 0
            ? item.active_loans
            : item.peminjam_list && item.peminjam_list.length > 0
            ? item.peminjam_list
            : item.active_loan
            ? [item.active_loan]
            : item.peminjam
            ? [item.peminjam]
            : [];
        const matchBorrower = loans.some((l: any) =>
          (l.nama_siswa || '').toLowerCase().includes(q)
        );
        return matchName || matchCode || matchSpecs || matchBorrower;
      }
      return true;
    });
  }, [data, activeTab, statusFilter, searchQuery, customCategories]);

  // Timeline completion counter
  const timelineCompletedCount = timelineList.filter(
    (t) => t.status === 'selesai' || t.selesai === 1
  ).length;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 lg:h-[calc(100vh-76px)] overflow-hidden">
      {/* ============================================================ */}
      {/* 12-GRID 2-COLUMN DASHBOARD LAYOUT                            */}
      {/* KOLOM 1: 3 Grid  -> Dokumentasi RPL & Timeline RPL          */}
      {/* KOLOM 2: 9 Grid  -> Peminjaman Alat & Barang RPL             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 h-full">

        {/* ========================================================== */}
        {/* KOLOM 1: 3 GRID (Dokumentasi RPL & Timeline RPL)           */}
        {/* ========================================================== */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          
          {/* Card 1A: Dokumentasi Kegiatan RPL (TAMPIL ASLI TANPA GEPENG) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-3 flex flex-col shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                    Dokumentasi RPL
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    Galeri kegiatan Lab PPLG
                  </p>
                </div>
              </div>

              {authRole === 'admin' && (
                <button
                  onClick={() => {
                    setDokForm({
                      judul: '',
                      deskripsi: '',
                      foto_url: '',
                      tanggal: new Date().toISOString().split('T')[0],
                    });
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setShowDokumentasiModal(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer shadow-2xs shrink-0"
                  title="Upload Foto Kegiatan"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              )}
            </div>

            {/* Carousel Frame - Gambar Asli Tanpa Gepeng (object-contain dengan ambient fill) */}
            {dokumentasiList.length === 0 ? (
              <div className="h-44 sm:h-52 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                <ImageIcon className="w-7 h-7 mb-1.5 opacity-50" />
                <span>Belum ada foto kegiatan.</span>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group h-48 sm:h-52 lg:h-[210px] flex items-center justify-center shrink-0">
                {/* Ambient blurred backdrop from the photo */}
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-125 pointer-events-none transition-all duration-700"
                  style={{
                    backgroundImage: `url(${
                      dokumentasiList[currentSlide]?.foto_url ||
                      dokumentasiList[currentSlide]?.foto ||
                      '/pc.jpg'
                    })`,
                  }}
                />

                {/* Foto Tampil Sesuai Dimensi Aslinya (object-contain, TIDAK GEPENG) */}
                <img
                  src={
                    dokumentasiList[currentSlide]?.foto_url ||
                    dokumentasiList[currentSlide]?.foto ||
                    '/pc.jpg'
                  }
                  alt={dokumentasiList[currentSlide]?.judul || 'Dokumentasi'}
                  className="relative z-10 max-h-full max-w-full object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
                />

                {/* Gradient Text Overlay at the bottom */}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent flex flex-col justify-end p-2.5 pt-6 pointer-events-none">
                  <span className="text-[9px] font-mono text-purple-300 font-bold mb-0.5">
                    {dokumentasiList[currentSlide]?.tanggal || 'Dokumentasi RPL'}
                  </span>
                  <h3 className="text-white font-bold text-xs leading-tight line-clamp-1">
                    {dokumentasiList[currentSlide]?.judul}
                  </h3>
                  {dokumentasiList[currentSlide]?.deskripsi && (
                    <p className="text-slate-300 text-[10px] mt-0.5 line-clamp-1 leading-relaxed">
                      {dokumentasiList[currentSlide]?.deskripsi}
                    </p>
                  )}
                </div>

                {/* Admin Delete Action */}
                {authRole === 'admin' && (
                  <button
                    onClick={() => handleDeleteDokumentasi(dokumentasiList[currentSlide].id)}
                    className="absolute top-2 right-2 z-30 p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white text-xs transition-colors cursor-pointer shadow-md"
                    title="Hapus foto ini dari kegiatan"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

                {/* Navigation Arrows */}
                {dokumentasiList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide(
                          (prev) => (prev - 1 + dokumentasiList.length) % dokumentasiList.length
                        )
                      }
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide((prev) => (prev + 1) % dokumentasiList.length)
                      }
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* Dots */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1">
                  {dokumentasiList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentSlide === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 1B: Timeline RPL (Super Compact To-Do List) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                      Timeline RPL
                    </h2>
                    <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60 shrink-0">
                      {timelineCompletedCount}/{timelineList.length}
                    </span>
                  </div>
                </div>
              </div>

              {authRole === 'admin' && (
                <button
                  onClick={() => {
                    setTimelineForm({
                      nama_kegiatan: '',
                      tanggal: new Date().toISOString().split('T')[0],
                      kategori: 'Kejuruan',
                      keterangan: '',
                      status: 'belum_dimulai',
                    });
                    setShowTimelineModal(true);
                  }}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer shadow-2xs shrink-0"
                  title="Tambah kegiatan agenda"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah</span>
                </button>
              )}
            </div>

            {/* Scrollable Detailed Timeline items */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
              {timelineList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada agenda kegiatan.
                </div>
              ) : (
                timelineList.map((item) => {
                  const itemStatus =
                    item.status || (item.selesai === 1 ? 'selesai' : 'belum_dimulai');
                  const isDone = itemStatus === 'selesai';

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl transition-all border group ${
                        isDone
                          ? 'opacity-70 bg-slate-50/70 border-slate-200/60'
                          : itemStatus === 'sedang_berlangsung'
                          ? 'bg-blue-50/30 border-blue-200 shadow-2xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        {/* Left: Disabled Checkbox + Content */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Disabled Checkbox Indicator for Public Monitor */}
                          <div
                            className="text-slate-400 shrink-0 select-none pt-0.5 cursor-not-allowed"
                            title="Monitor Mode (Non-aktif / Hanya Baca)"
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>

                          {/* Info Detail */}
                          <div className="min-w-0 flex-1">
                            {/* Tanggal & Kategori */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                                {formatTimelineDate(item.tanggal)}
                              </span>
                              <span
                                className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                  item.kategori === 'Ujian'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : item.kategori === 'Industri'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : item.kategori === 'Kejuruan'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {item.kategori}
                              </span>
                            </div>

                            {/* Judul Kegiatan */}
                            <h4
                              className={`font-bold text-xs leading-snug mt-1 ${
                                isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-900'
                              }`}
                            >
                              {item.nama_kegiatan}
                            </h4>

                            {/* Deskripsi / Keterangan Kegiatan */}
                            {item.keterangan ? (
                              <p
                                className={`text-[11px] leading-relaxed mt-0.5 ${
                                  isDone ? 'text-slate-400 line-through' : 'text-slate-600'
                                }`}
                              >
                                {item.keterangan}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Right: Status Pill & Admin Actions */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {itemStatus === 'selesai' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shrink-0 shadow-2xs whitespace-nowrap">
                              <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                              Selesai
                            </span>
                          ) : itemStatus === 'sedang_berlangsung' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/90 shrink-0 shadow-2xs whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              Sedang Berlangsung
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              Belum Dimulai
                            </span>
                          )}

                          {/* Admin Actions */}
                          {authRole === 'admin' && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setTimelineForm({
                                    id: item.id,
                                    nama_kegiatan: item.nama_kegiatan,
                                    tanggal: item.tanggal,
                                    kategori: item.kategori,
                                    keterangan: item.keterangan || '',
                                    status: itemStatus,
                                  });
                                  setShowTimelineModal(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Edit Kegiatan"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTimeline(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Hapus Kegiatan"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ========================================================== */}
        {/* KOLOM 2: 9 GRID (Peminjaman Alat & Barang RPL)             */}
        {/* ========================================================== */}
        <div className="lg:col-span-9 flex flex-col gap-3 h-full overflow-hidden">

          {/* Card 2A: Waktu Realtime Lab, Status KPI & Akun Login Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-3 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Realtime Clock & Date Widget */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-950 text-white px-3.5 py-2 flex items-center gap-3 shadow-xs">
                <div className="flex flex-col">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Waktu Realtime Lab
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white leading-none mt-0.5">
                    {currentTime || '--:--:-- WIB'}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold">Hari &amp; Tanggal</span>
                <span className="text-xs font-bold text-slate-800">{currentDate || '-'}</span>
              </div>
            </div>

            {/* Quick KPI Stats & Role Access */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
              <div className="hidden lg:flex items-center gap-2">
                {/* KPI Laptop */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Laptop className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Laptop</span>
                    <span className="font-mono text-xs font-black text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {data ? `${data.stats_laptop.tersedia}/${data.stats_laptop.total}` : '-/-'}
                    </span>
                  </div>
                </div>

                {/* KPI PC Lab */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Monitor className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">PC Lab</span>
                    <span className="font-mono text-xs font-black text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {data ? `${data.stats_pc.tersedia}/${data.stats_pc.total}` : '-/-'}
                    </span>
                  </div>
                </div>

                {/* KPI Alat */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Alat</span>
                    <span className="font-mono text-xs font-black text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {data ? `${data.stats_peralatan?.tersedia_unit ?? 0}` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sedang Dipinjam */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-50/80 border border-purple-200/70 shadow-2xs">
                <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Clock className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-purple-700">Dipinjam</span>
                  <span className="font-mono text-xs font-black text-purple-950 bg-white px-1.5 py-0.5 rounded border border-purple-200 shadow-2xs">
                    {totalSedangDigunakan} <span className="text-[9px] font-semibold text-purple-600">Unit</span>
                  </span>
                </div>
              </div>

              {/* Login / Role Controller */}
              {authRole ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border truncate ${
                      authRole === 'admin'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{authUsername ? `${authUsername} (${authRole === 'admin' ? 'Admin' : 'Sarpras'})` : authRole}</span>
                  </span>

                  <button
                    onClick={handleLogoutRole}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Keluar dari role"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Login Akun</span>
                </button>
              )}

              <Link
                href="/kiosk"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <span>Admin Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2B: Peminjaman Alat & Barang RPL Siap Dipinjam (9 Grid Space) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Header with Search and Category Filter */}
            <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                      Peminjaman Alat &amp; Barang RPL
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Monitoring sarpras lab &amp; status peminjaman aktif
                    </p>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                  {(['all', 'tersedia', 'dipinjam'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer capitalize ${
                        statusFilter === st
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {st === 'all' ? 'Semua' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category tabs & Search bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  {['Laptop', 'Ruangan Workshop RPL', 'Peralatan', ...customCategories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeTab === cat
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'Ruangan Workshop RPL' ? 'PC Lab' : cat}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative min-w-[180px] sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama perangkat / peminjam..."
                    className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Items Grid (Dalam 9 Grid, muat 4 kolom laptop / 3-4 kolom PC) */}
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {loading ? (
                <div className="py-20 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">Memuat sarpras RPL...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Tidak ada barang yang cocok dengan filter atau kata kunci.
                </div>
              ) : (activeTab === 'Laptop' || activeTab === 'Ruangan Workshop RPL') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredItems.map((item) => (
                    <ItemMonitorCardAdapted key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {filteredItems.map((item) => (
                    <PeralatanCompactListItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* MODAL: LOGIN USERNAME & PASSWORD (ADMIN & SARPRAS ZAKOLA_ID) */}
      {/* ============================================================ */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Login Akses Sistem</h3>
              <p className="text-xs text-slate-500">
                Masuk dengan akun role <strong>Admin</strong> atau <strong>Sarpras</strong>
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Username:</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Contoh: petugas atau admin"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password:</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                  {loginError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {verifying ? 'Memeriksa...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH/EDIT TIMELINE (ROLE ADMIN ONLY)                */}
      {/* ============================================================ */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {timelineForm.id ? 'Edit Kegiatan Timeline' : 'Tambah Kegiatan ke Timeline RPL'}
            </h3>

            <form onSubmit={handleSaveTimeline} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Kegiatan:</label>
                <input
                  type="text"
                  value={timelineForm.nama_kegiatan}
                  onChange={(e) =>
                    setTimelineForm({ ...timelineForm, nama_kegiatan: e.target.value })
                  }
                  required
                  placeholder="Contoh: Pra-UKK & Simulasi Pemrograman"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Kegiatan:</label>
                  <input
                    type="date"
                    value={timelineForm.tanggal}
                    onChange={(e) =>
                      setTimelineForm({ ...timelineForm, tanggal: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori:</label>
                  <select
                    value={timelineForm.kategori}
                    onChange={(e) =>
                      setTimelineForm({ ...timelineForm, kategori: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Kejuruan">Kejuruan</option>
                    <option value="Industri">Industri</option>
                    <option value="Pelatihan">Pelatihan</option>
                    <option value="Ujian">Ujian</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Kegiatan:</label>
                <select
                  value={timelineForm.status}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      status: e.target.value as 'belum_dimulai' | 'sedang_berlangsung' | 'selesai',
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="belum_dimulai">⏳ Belum Dimulai</option>
                  <option value="sedang_berlangsung">🔵 Sedang Berlangsung</option>
                  <option value="selesai">✅ Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Keterangan / Detail:</label>
                <textarea
                  value={timelineForm.keterangan}
                  onChange={(e) =>
                    setTimelineForm({ ...timelineForm, keterangan: e.target.value })
                  }
                  placeholder="Deskripsi singkat kegiatan to-do..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: UPLOAD FOTO KEGIATAN KE /kegiatan/ & TABEL kegiatan   */}
      {/* ============================================================ */}
      {showDokumentasiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Unggah Foto Kegiatan RPL
                </h3>
                <p className="text-xs text-slate-500">
                  Foto tersimpan di folder <code>/kegiatan/</code> &amp; database <code>kegiatan</code>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDokumentasiModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDokumentasi} className="space-y-3.5 text-xs">
              {/* File Upload Dropzone */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Pilih File Foto Gambar:
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-3 text-center transition-colors cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-contain border border-slate-200 shadow-2xs"
                      />
                      <span className="text-[11px] text-purple-700 font-bold block">
                        Klik untuk mengganti foto ({selectedFile?.name})
                      </span>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1">
                      <UploadCloud className="w-8 h-8 text-purple-600 mx-auto" />
                      <p className="font-bold text-slate-800 text-xs">
                        Klik atau Tarik Foto Gambar ke Sini
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Format JPG, PNG, WEBP, GIF (maks 15MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Judul Kegiatan:</label>
                <input
                  type="text"
                  value={dokForm.judul}
                  onChange={(e) => setDokForm({ ...dokForm, judul: e.target.value })}
                  required
                  placeholder="Contoh: Praktik Pemrograman Lab PPLG"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tanggal Kegiatan:</label>
                <input
                  type="date"
                  value={dokForm.tanggal}
                  onChange={(e) => setDokForm({ ...dokForm, tanggal: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Kegiatan:</label>
                <textarea
                  value={dokForm.deskripsi}
                  onChange={(e) => setDokForm({ ...dokForm, deskripsi: e.target.value })}
                  placeholder="Keterangan singkat momen dokumentasi kegiatan..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDokumentasiModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto}
                  className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {uploadingPhoto ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah Foto...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Unggah ke Kegiatan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ADAPTED CARD FOR LAPTOP & PC MONITOR
// Tampilan jelas, proporsional, dan mengisi ruang
// ==========================================
function ItemMonitorCardAdapted({ item }: { item: BarangItem }) {
  const isAvailable = item.status === 'tersedia';
  const isLaptop = item.kategori === 'Laptop' || item.kode_barang.toUpperCase().startsWith('RPL');

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
        isAvailable
          ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
          : 'bg-blue-50/20 border-blue-200 shadow-2xs'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
              {item.kode_barang}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {isLaptop ? 'Laptop RPL' : 'PC Lab'}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAvailable ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
              }`}
            />
            {isAvailable ? 'Tersedia' : 'Sedang Dipakai'}
          </span>
        </div>

        {/* Prominent Photo Area (Jelas, besar, dan proporsional) */}
        <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center justify-center p-2 mb-2.5 overflow-hidden group-hover:border-slate-200 transition-colors">
          <img
            src={isLaptop ? '/laptop.png' : '/pc.jpg'}
            alt={item.nama_barang}
            className={`w-full h-full ${
              isLaptop ? 'object-contain' : 'object-cover rounded-lg'
            } transition-transform duration-300 group-hover:scale-105`}
          />
        </div>

        {/* Title and Specs */}
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate">
            {item.nama_barang}
          </h4>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {item.spesifikasi || (isLaptop ? 'Unit Laptop Praktikum RPL' : 'Workstation Lab RPL')}
          </p>
        </div>

        {/* Borrower details if borrowed */}
        {!isAvailable && item.active_loan && (
          <div className="mt-2.5 p-2 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="truncate flex items-center gap-1.5">
                <User className="w-3 h-3 text-blue-600 shrink-0" />
                {item.active_loan.nama_siswa}
              </span>
              <span className="font-mono text-blue-600 text-[10px]">
                {item.active_loan.durasi_sekarang}
              </span>
            </div>
            <div className="text-slate-600 flex justify-between text-[10px]">
              <span>Kelas: <strong>{item.active_loan.kelas}</strong></span>
              <span className="italic truncate max-w-[130px]">
                &ldquo;{item.active_loan.kebutuhan}&rdquo;
              </span>
            </div>
          </div>
        )}
      </div>

      {isAvailable && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
          <span className="text-slate-400 font-normal">Kondisi: Siap Pakai</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready di Lab
          </span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPACT ITEM LIST FOR PERALATAN, ATK & CUSTOM CATEGORIES
// Tampilan tanpa gambar: ringkas, rapi, dengan status stok
// ==========================================
function PeralatanCompactListItem({ item }: { item: BarangItem }) {
  const isAvailable = item.jumlah_tersedia > 0;
  const isAllBorrowed = item.jumlah_tersedia === 0 && item.jumlah_total > 0;
  const isATK = item.kategori?.toUpperCase().includes('ATK');

  return (
    <div
      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        isAllBorrowed
          ? 'bg-rose-50/30 border-rose-200'
          : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
            isATK
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {isATK ? (
            <Layers className="w-4.5 h-4.5 text-blue-600" />
          ) : (
            <Wrench className="w-4.5 h-4.5 text-amber-600" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {item.kode_barang}
            </span>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{item.nama_barang}</h4>
          </div>
          {item.spesifikasi && (
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.spesifikasi}</p>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-xs sm:text-sm font-bold text-slate-900">
          <span className={`${isAvailable ? 'text-emerald-600' : 'text-rose-600'} font-extrabold`}>
            {item.jumlah_tersedia}
          </span>{' '}
          /{' '}
          {item.jumlah_total} {item.satuan}
        </div>
        <span className="text-[10px] text-slate-400">
          {isAvailable ? 'Tersedia' : 'Semua Dipinjam'}
        </span>
      </div>
    </div>
  );
}
