'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  UploadCloud,
  Pin,
  Paperclip,
  Bookmark,
  BookOpen,
  Tag,
  Filter,
  X,
  Play,
  Pause
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
  fetchNetworkStats,
} from '@/lib/api';

function formatTimelineDate(dateStr?: string | null) {
  if (
    !dateStr ||
    dateStr === 'belum_ditentukan' ||
    dateStr === '0000-00-00' ||
    dateStr === 'null' ||
    dateStr.toLowerCase().includes('belum') ||
    dateStr === '-' ||
    dateStr === 'TBD'
  ) {
    return 'Belum ditentukan';
  }
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (isNaN(m) || isNaN(d)) return 'Belum ditentukan';
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

function getItemClasses(item: RplTimelineItem): ('10' | '11' | '12')[] | 'all' {
  const rawKelas = (item as any).kelas;
  if (rawKelas) {
    if (rawKelas === 'all') return 'all';
    const parts = String(rawKelas).split(',').map((s) => s.trim());
    const valid = parts.filter((p): p is '10' | '11' | '12' =>
      ['10', '11', '12'].includes(p)
    );
    if (valid.length === 0 || valid.length === 3) return 'all';
    return valid;
  }
  // Fallback to text parsing for legacy items
  const text = `${item.nama_kegiatan} ${item.keterangan || ''}`.toLowerCase();
  const detected: ('10' | '11' | '12')[] = [];
  if (
    text.includes('kelas 10') ||
    text.includes('kelas x ') ||
    text.includes('kelas x-') ||
    text.includes('[kelas 10]')
  )
    detected.push('10');
  if (
    text.includes('kelas 11') ||
    text.includes('kelas xi ') ||
    text.includes('kelas xi-') ||
    text.includes('[kelas 11]')
  )
    detected.push('11');
  if (
    text.includes('kelas 12') ||
    text.includes('kelas xii ') ||
    text.includes('kelas xii-') ||
    text.includes('[kelas 12]') ||
    text.includes('ukk') ||
    text.includes('tka')
  )
    detected.push('12');
  if (detected.length === 0 || detected.length === 3) return 'all';
  return detected;
}

function getFotoUrl(url?: string | null): string {
  if (!url) return '/pc.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/kegiatan/')) {
    return `https://sarpras.sakuci.id${url}`;
  }
  return url;
}

const STICKY_PALETTES = [
  {
    name: 'yellow',
    bg: 'bg-[#fef9c3] dark:bg-[#38311a]',
    border: 'border-[#fde047] dark:border-[#6e5d26]',
    text: 'text-amber-950 dark:text-amber-100',
    title: 'text-amber-950 dark:text-amber-100',
    desc: 'text-amber-900/85 dark:text-amber-200/80',
    dateBadge: 'bg-amber-200/70 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700/60',
    pinColor: 'text-amber-600 dark:text-amber-400',
    washiRotate: 'rotate-[-1.5deg]',
  },
  {
    name: 'pink',
    bg: 'bg-[#ffe4e6] dark:bg-[#381a24]',
    border: 'border-[#fecdd3] dark:border-[#6e2d3f]',
    text: 'text-rose-950 dark:text-rose-100',
    title: 'text-rose-950 dark:text-rose-100',
    desc: 'text-rose-900/85 dark:text-rose-200/80',
    dateBadge: 'bg-rose-200/70 text-rose-900 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700/60',
    pinColor: 'text-rose-500 dark:text-rose-400',
    washiRotate: 'rotate-[1.2deg]',
  },
  {
    name: 'mint',
    bg: 'bg-[#dcfce7] dark:bg-[#153324]',
    border: 'border-[#bbf7d0] dark:border-[#24523b]',
    text: 'text-emerald-950 dark:text-emerald-100',
    title: 'text-emerald-950 dark:text-emerald-100',
    desc: 'text-emerald-900/85 dark:text-emerald-200/80',
    dateBadge: 'bg-emerald-200/70 text-emerald-900 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700/60',
    pinColor: 'text-emerald-600 dark:text-emerald-400',
    washiRotate: 'rotate-[-0.8deg]',
  },
  {
    name: 'sky',
    bg: 'bg-[#e0f2fe] dark:bg-[#132a3c]',
    border: 'border-[#bae6fd] dark:border-[#1e4463]',
    text: 'text-sky-950 dark:text-sky-100',
    title: 'text-sky-950 dark:text-sky-100',
    desc: 'text-sky-900/85 dark:text-sky-200/80',
    dateBadge: 'bg-sky-200/70 text-sky-900 border-sky-300 dark:bg-sky-900/60 dark:text-sky-200 dark:border-sky-700/60',
    pinColor: 'text-sky-600 dark:text-sky-400',
    washiRotate: 'rotate-[1.5deg]',
  },
  {
    name: 'purple',
    bg: 'bg-[#f3e8ff] dark:bg-[#2b183d]',
    border: 'border-[#e9d5ff] dark:border-[#522b75]',
    text: 'text-purple-950 dark:text-purple-100',
    title: 'text-purple-950 dark:text-purple-100',
    desc: 'text-purple-900/85 dark:text-purple-200/80',
    dateBadge: 'bg-purple-200/70 text-purple-900 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700/60',
    pinColor: 'text-purple-500 dark:text-purple-400',
    washiRotate: 'rotate-[-1.2deg]',
  },
  {
    name: 'peach',
    bg: 'bg-[#ffedd5] dark:bg-[#382115]',
    border: 'border-[#fed7aa] dark:border-[#6e3921]',
    text: 'text-orange-950 dark:text-orange-100',
    title: 'text-orange-950 dark:text-orange-100',
    desc: 'text-orange-900/85 dark:text-orange-200/80',
    dateBadge: 'bg-orange-200/70 text-orange-900 border-orange-300 dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-700/60',
    pinColor: 'text-orange-600 dark:text-orange-400',
    washiRotate: 'rotate-[0.9deg]',
  },
];

const STICKY_ROTATIONS = [
  '-rotate-[0.8deg]',
  'rotate-[1deg]',
  '-rotate-[0.5deg]',
  'rotate-[0.7deg]',
  '-rotate-[1.2deg]',
  'rotate-[0.5deg]',
];

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

  // Ensure desktop dashboard stays strictly 1 page without window scrolling
  useEffect(() => {
    document.body.classList.add('lg:overflow-hidden');
    return () => {
      document.body.classList.remove('lg:overflow-hidden');
    };
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

  // Timeline Admin Modal & Class Filter State
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const [timelineClassFilter, setTimelineClassFilter] = useState<'all' | '10' | '11' | '12'>('all');
  const [timelineForm, setTimelineForm] = useState<{
    id?: number;
    nama_kegiatan: string;
    tanggal: string;
    isDateTBD: boolean;
    kategori: string;
    keterangan: string;
    status: 'belum_dimulai' | 'sedang_berlangsung' | 'selesai';
    selectedClasses: ('10' | '11' | '12')[];
  }>({
    nama_kegiatan: '',
    tanggal: new Date().toISOString().split('T')[0],
    isDateTBD: false,
    kategori: 'Kejuruan',
    keterangan: '',
    status: 'belum_dimulai',
    selectedClasses: ['10', '11', '12'],
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

  // Horizontal photo reel infinite marquee stream
  const [isPhotoPaused, setIsPhotoPaused] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<RplDokumentasiItem | null>(null);

  // Duplikat foto agar animasi CSS berjalan mengalir terus looping tanpa jeda / putus
  const marqueePhotos = useMemo(() => {
    if (!dokumentasiList || dokumentasiList.length === 0) return [];
    if (dokumentasiList.length < 5) {
      return [...dokumentasiList, ...dokumentasiList, ...dokumentasiList, ...dokumentasiList];
    }
    return [...dokumentasiList, ...dokumentasiList];
  }, [dokumentasiList]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetchBarang();
      setData(res);
      // Sinkronkan ke Navbar secara otomatis
      if (typeof window !== 'undefined') {
        const totalDipinjam = (res.barang || [])
          .filter((b) => b.status === 'dipinjam')
          .reduce((acc, b) => acc + (b.unit_dipinjam || 1), 0);
        window.dispatchEvent(
          new CustomEvent('sarpras-stats-update', {
            detail: {
              laptopTotal: res.stats_laptop?.total ?? 0,
              laptopTersedia: res.stats_laptop?.tersedia ?? 0,
              pcTotal: res.stats_pc?.total ?? 0,
              pcTersedia: res.stats_pc?.tersedia ?? 0,
              totalDipinjam,
            },
          })
        );
      }
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
      const isTBD = timelineForm.isDateTBD || !timelineForm.tanggal;
      const finalTanggal = isTBD ? null : timelineForm.tanggal;

      const finalKelas =
        timelineForm.selectedClasses.length === 3 || timelineForm.selectedClasses.length === 0
          ? 'all'
          : [...timelineForm.selectedClasses].sort().join(',');

      await submitTimelineAction({
        pin: authPin,
        action: timelineForm.id ? 'update' : 'add',
        ...timelineForm,
        tanggal: finalTanggal,
        keterangan: timelineForm.keterangan || '',
        kelas: finalKelas,
      });
      setShowTimelineModal(false);
      setTimelineForm({
        nama_kegiatan: '',
        tanggal: new Date().toISOString().split('T')[0],
        isDateTBD: false,
        kategori: 'Kejuruan',
        keterangan: '',
        status: 'belum_dimulai',
        selectedClasses: ['10', '11', '12'],
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

  // Timeline filtered by Class
  const filteredTimelineList = useMemo(() => {
    return timelineList.filter((item) => {
      if (timelineClassFilter === 'all') return true;
      const classes = getItemClasses(item);
      if (classes === 'all') return true;
      return classes.includes(timelineClassFilter);
    });
  }, [timelineList, timelineClassFilter]);

  // Timeline completion counter (for current filter)
  const timelineCompletedCount = filteredTimelineList.filter(
    (t) => t.status === 'selesai' || t.selesai === 1
  ).length;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 lg:h-[calc(100vh-100px)] max-h-[calc(100vh-100px)] overflow-hidden">
      {/* ============================================================ */}
      {/* 12-GRID 2-COLUMN DASHBOARD LAYOUT                            */}
      {/* KOLOM 1: 3 Grid  -> Catatan Agenda RPL (Full Height)         */}
      {/* KOLOM 2: 9 Grid  -> Status, Foto Kegiatan, & Peminjaman      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 h-full max-h-full overflow-hidden">

        {/* ========================================================== */}
        {/* KOLOM 1: 3 GRID (Catatan Agenda RPL - Full Height)         */}
        {/* ========================================================== */}
        <div className="lg:col-span-3 flex flex-col h-full max-h-full min-h-0 overflow-hidden">
          {/* Card 1: Timeline RPL (Buku Catatan Agenda & Sticky Notes Lucu) */}
          <div className="relative notebook-paper border-2 border-amber-300/70 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col max-h-full group/notebook">
            {/* Spiral Ring Binding at top edge */}
            <div className="h-4 bg-amber-100/80 dark:bg-slate-800/90 border-b border-amber-200/70 dark:border-slate-700/70 flex items-center justify-around px-2 shrink-0 overflow-hidden select-none">
              {[...Array(14)].map((_, i) => (
                <span
                  key={i}
                  className="w-2.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600 bg-gradient-to-b from-slate-200 via-white to-slate-300 dark:from-slate-700 dark:via-slate-500 dark:to-slate-800 shadow-2xs -mt-1"
                />
              ))}
            </div>

            {/* Notebook Header */}
            <div className="px-3 py-2 border-b border-amber-200/60 dark:border-slate-700/60 flex items-center justify-between shrink-0 bg-white/75 dark:bg-slate-900/65 backdrop-blur-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 rotate-[-4deg]">
                  📓
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-extrabold text-amber-950 dark:text-amber-100 text-xs sm:text-sm leading-tight tracking-tight">
                      Catatan Agenda RPL
                    </h2>
                    <span className="text-[9px] font-black bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded-full border border-amber-300/70 dark:border-amber-700 shrink-0">
                      {timelineCompletedCount}/{filteredTimelineList.length}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-amber-800/80 dark:text-amber-300/70 font-medium truncate">
                    Sticky Notes Agenda Kegiatan RPL
                  </p>
                </div>
              </div>

              {authRole === 'admin' && (
                <button
                  onClick={() => {
                    setTimelineForm({
                      nama_kegiatan: '',
                      tanggal: new Date().toISOString().split('T')[0],
                      isDateTBD: false,
                      kategori: 'Kejuruan',
                      keterangan: '',
                      status: 'belum_dimulai',
                      selectedClasses:
                        timelineClassFilter === 'all'
                          ? ['10', '11', '12']
                          : [timelineClassFilter],
                    });
                    setShowTimelineModal(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-[10.5px] cursor-pointer shadow-xs transition-transform active:scale-95 shrink-0"
                  title="Tambah sticky note kegiatan"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Note</span>
                </button>
              )}
            </div>

            {/* Class Filter Tabs: Semua, Kelas 10, Kelas 11, Kelas 12 */}
            <div className="px-3 py-1.5 border-b border-amber-200/50 dark:border-slate-700/50 bg-amber-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-1 shrink-0 select-none">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: '10', label: 'Kelas 10' },
                  { id: '11', label: 'Kelas 11' },
                  { id: '12', label: 'Kelas 12' },
                ].map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setTimelineClassFilter(cls.id as any)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      timelineClassFilter === cls.id
                        ? 'bg-amber-400 text-amber-950 font-black shadow-2xs scale-105'
                        : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
              <span className="text-[9.5px] font-bold text-amber-900/70 dark:text-amber-300/70 shrink-0">
                {filteredTimelineList.length} Catatan
              </span>
            </div>

            {/* Scrollable Sticky Notes Area (with classic red notebook margin line) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 min-h-0 border-l-[3px] border-rose-400/40 dark:border-rose-500/25 ml-2.5 pl-2.5">
              {filteredTimelineList.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center text-amber-800/60 dark:text-amber-300/50 text-xs">
                  <span className="text-3xl mb-1.5">📝</span>
                  <p className="font-bold">Belum ada sticky note.</p>
                  <p className="text-[10px] mt-0.5">
                    {timelineClassFilter === 'all'
                      ? 'Catatan agenda kegiatan RPL akan tampil di sini.'
                      : `Belum ada agenda khusus untuk Kelas ${timelineClassFilter}.`}
                  </p>
                </div>
              ) : (
                filteredTimelineList.map((item, idx) => {
                  const itemStatus =
                    item.status || (item.selesai === 1 ? 'selesai' : 'belum_dimulai');
                  const isDone = itemStatus === 'selesai';
                  const palette = STICKY_PALETTES[idx % STICKY_PALETTES.length];
                  const rotation = STICKY_ROTATIONS[idx % STICKY_ROTATIONS.length];
                  const isDateTBD =
                    !item.tanggal ||
                    item.tanggal === 'belum_ditentukan' ||
                    item.tanggal === '0000-00-00' ||
                    item.tanggal.toLowerCase().includes('belum');

                  return (
                    <div
                      key={item.id}
                      className={`relative p-3 rounded-xl border transition-all duration-200 sticky-fold-shadow group/note ${palette.bg} ${palette.border} ${rotation} hover:rotate-0 hover:scale-[1.015] hover:z-20`}
                    >
                      {/* Washi Tape Strip at top center */}
                      <div className={`washi-tape absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-[1px] pointer-events-none z-10 ${palette.washiRotate}`} />

                      <div className="flex items-start justify-between gap-2">
                        {/* Left: Pushpin / Checkbox + Content */}
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          {/* Pushpin / Checkbox Indicator */}
                          <div
                            className="shrink-0 select-none pt-0.5 cursor-not-allowed"
                            title="Monitor Mode (Hanya Baca)"
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                            ) : (
                              <Pin className={`w-3.5 h-3.5 ${palette.pinColor} -rotate-45 drop-shadow-2xs`} />
                            )}
                          </div>

                          {/* Info Detail */}
                          <div className="min-w-0 flex-1">
                            {/* Tanggal & Kategori & Kelas Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Tanggal Badge */}
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                  isDateTBD
                                    ? 'bg-amber-100/90 text-amber-900 border-amber-300/90 dark:bg-amber-900/60 dark:text-amber-200'
                                    : palette.dateBadge
                                }`}
                              >
                                <Calendar className="w-2.5 h-2.5 shrink-0" />
                                {formatTimelineDate(item.tanggal)}
                              </span>

                              {/* Kelas Badge(s) */}
                              {(() => {
                                const classes = getItemClasses(item);
                                if (classes === 'all') {
                                  return (
                                    <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                                      Semua Kelas
                                    </span>
                                  );
                                }
                                return classes.map((c) => (
                                  <span
                                    key={c}
                                    className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700"
                                  >
                                    Kelas {c}
                                  </span>
                                ));
                              })()}

                              {/* Kategori Badge */}
                              <span
                                className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 ${palette.text}`}
                              >
                                {item.kategori}
                              </span>
                            </div>

                            {/* Judul Kegiatan */}
                            <h4
                              className={`font-bold text-xs leading-snug mt-1.5 ${palette.title} ${
                                isDone ? 'line-through opacity-70 font-medium' : ''
                              }`}
                            >
                              {item.nama_kegiatan}
                            </h4>

                            {/* Deskripsi / Keterangan Kegiatan */}
                            {item.keterangan ? (
                              <p
                                className={`text-[11px] leading-relaxed mt-1 ${palette.desc} ${
                                  isDone ? 'line-through opacity-60' : ''
                                }`}
                              >
                                {item.keterangan}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Right: Status Stamp/Badge & Admin Actions */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {itemStatus === 'selesai' ? (
                            <span className="stamp-selesai px-1.5 py-0.5 text-[9px] shrink-0 flex items-center gap-0.5 select-none shadow-2xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" /> SELESAI
                            </span>
                          ) : itemStatus === 'sedang_berlangsung' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-blue-500 text-white shrink-0 shadow-2xs select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Sedang Jalan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 shrink-0 select-none">
                              <Clock className="w-2.5 h-2.5 opacity-70" />
                              Agenda
                            </span>
                          )}

                          {/* Admin Actions */}
                          {authRole === 'admin' && (
                            <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  const isTBD =
                                    !item.tanggal ||
                                    item.tanggal === 'belum_ditentukan' ||
                                    item.tanggal === '0000-00-00' ||
                                    item.tanggal.toLowerCase().includes('belum');
                                  const classes = getItemClasses(item);
                                  setTimelineForm({
                                    id: item.id,
                                    nama_kegiatan: item.nama_kegiatan,
                                    tanggal: isTBD || !item.tanggal ? '' : item.tanggal,
                                    isDateTBD: isTBD,
                                    kategori: item.kategori,
                                    keterangan: item.keterangan || '',
                                    status: itemStatus,
                                    selectedClasses:
                                      classes === 'all' ? ['10', '11', '12'] : classes,
                                  });
                                  setShowTimelineModal(true);
                                }}
                                className="p-1 rounded bg-white/70 dark:bg-black/30 hover:bg-white text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs"
                                title="Edit Catatan"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTimeline(item.id)}
                                className="p-1 rounded bg-white/70 dark:bg-black/30 hover:bg-white text-slate-700 dark:text-slate-200 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                                title="Hapus Catatan"
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
        {/* KOLOM 2: 9 GRID (Dokumentasi RPL & Peminjaman Alat Barang) */}
        {/* ========================================================== */}
        <div className="lg:col-span-9 flex flex-col gap-2.5 h-full max-h-full min-h-0 overflow-hidden">

          {/* Card 2: Dokumentasi Kegiatan RPL (Berjajar Horizontal Bergerak Sendiri) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-2 sm:p-2.5 shrink-0 flex flex-col gap-1.5 overflow-hidden">
            {/* Header Dokumentasi */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="font-bold text-slate-900 text-xs leading-tight truncate">
                    Dokumentasi Kegiatan RPL
                  </h2>
                  <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/70 shrink-0">
                    {dokumentasiList.length} Foto
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {dokumentasiList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsPhotoPaused((prev) => !prev)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-colors ${
                      isPhotoPaused
                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                    title={isPhotoPaused ? 'Lanjutkan Animasi Berjalan' : 'Jeda Animasi'}
                  >
                    {isPhotoPaused ? (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Play</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                )}

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
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer shadow-2xs shrink-0"
                    title="Upload Foto Kegiatan"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Continuous Flowing Marquee Strip (Menyesuaikan Natural Portrait & Landscape) */}
            {dokumentasiList.length === 0 ? (
              <div className="h-28 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                <span>Belum ada foto kegiatan.</span>
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-900/95 py-1"
                onMouseEnter={() => setIsPhotoPaused(true)}
                onMouseLeave={() => setIsPhotoPaused(false)}
              >
                {/* Edge fade gradient mask left */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none" />
                {/* Edge fade gradient mask right */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none" />

                {/* Infinite Marquee Reel */}
                <div
                  className={`animate-marquee-flow flex items-center gap-2.5 select-none ${
                    isPhotoPaused ? 'marquee-paused' : ''
                  }`}
                  style={{
                    animationDuration: `${Math.max(28, marqueePhotos.length * 4)}s`,
                  }}
                >
                  {marqueePhotos.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => setPreviewPhoto(item)}
                      className="h-28 sm:h-32 shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xs group/foto relative cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:border-purple-400 hover:shadow-lg"
                      title={`${item.judul} (Klik untuk perbesar)`}
                    >
                      {/* Natural Ratio: Portrait or Landscape */}
                      <img
                        src={getFotoUrl(item.foto_url || item.foto)}
                        alt={item.judul}
                        loading="lazy"
                        className="h-full w-auto max-w-none object-cover block"
                      />

                      {/* Gradient Overlay at Bottom */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent p-1.5 pt-4 pointer-events-none">
                        <div className="text-[8.5px] font-mono text-purple-300 font-bold mb-0.5 truncate">
                          {item.tanggal || 'Dokumentasi'}
                        </div>
                        <p className="text-white font-bold text-[10.5px] leading-tight line-clamp-1 drop-shadow-xs">
                          {item.judul}
                        </p>
                      </div>

                      {/* Admin Delete Action */}
                      {authRole === 'admin' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDokumentasi(item.id);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/85 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs opacity-0 group-hover/foto:opacity-100"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2C: Peminjaman Alat & Barang RPL Siap Dipinjam (Bawahnya Foto) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col max-h-full">
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
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>{timelineForm.id ? '📝 Edit Sticky Note Agenda' : '📌 Tempel Sticky Note Baru'}</span>
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

              {/* Target Kelas / Tingkat (Multi-Select) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">Target Kelas / Tingkat:</label>
                  <span className="text-[10.5px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {timelineForm.selectedClasses.length === 3 || timelineForm.selectedClasses.length === 0
                      ? 'Semua Kelas (10, 11, 12)'
                      : `Kelas ${[...timelineForm.selectedClasses].sort().join(' & ')}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineForm({
                        ...timelineForm,
                        selectedClasses: ['10', '11', '12'],
                      });
                    }}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                      timelineForm.selectedClasses.length === 3 || timelineForm.selectedClasses.length === 0
                        ? 'bg-amber-400 border-amber-500 text-amber-950 font-black shadow-2xs ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Semua</span>
                    {(timelineForm.selectedClasses.length === 3 || timelineForm.selectedClasses.length === 0) && (
                      <Check className="w-3 h-3 stroke-[3]" />
                    )}
                  </button>

                  {(['10', '11', '12'] as const).map((cls) => {
                    const isAll =
                      timelineForm.selectedClasses.length === 3 ||
                      timelineForm.selectedClasses.length === 0;
                    const isSelected = !isAll && timelineForm.selectedClasses.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => {
                          const current = timelineForm.selectedClasses;
                          let next: ('10' | '11' | '12')[];
                          if (current.length === 3 || current.length === 0) {
                            // If currently Semua, clicking one selects only that one
                            next = [cls];
                          } else if (current.includes(cls)) {
                            // Deselect cls
                            next = current.filter((c) => c !== cls);
                            if (next.length === 0) next = ['10', '11', '12'];
                          } else {
                            // Add cls
                            next = [...current, cls];
                          }
                          setTimelineForm({
                            ...timelineForm,
                            selectedClasses: next,
                          });
                        }}
                        className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-amber-400 border-amber-500 text-amber-950 font-black shadow-2xs ring-1 ring-amber-500'
                            : isAll
                            ? 'bg-amber-100/70 border-amber-300/80 text-amber-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>Kelas {cls}</span>
                        {(isSelected || isAll) && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  *Klik untuk memilih lebih dari 1 kelas (misal Kelas 10 &amp; 11).
                </p>
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Tanggal Kegiatan:</label>
                    <label className="flex items-center gap-1 text-[11px] text-amber-900 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={timelineForm.isDateTBD}
                        onChange={(e) =>
                          setTimelineForm({
                            ...timelineForm,
                            isDateTBD: e.target.checked,
                            tanggal: e.target.checked
                              ? ''
                              : (timelineForm.tanggal || new Date().toISOString().split('T')[0]),
                          })
                        }
                        className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                      <span>Belum ditentukan</span>
                    </label>
                  </div>
                  {timelineForm.isDateTBD ? (
                    <div className="w-full px-3 py-2 bg-amber-50 border border-dashed border-amber-300 rounded-lg text-amber-900 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Belum ditentukan (Tentatif)</span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={timelineForm.tanggal}
                      onChange={(e) =>
                        setTimelineForm({ ...timelineForm, tanggal: e.target.value })
                      }
                      required={!timelineForm.isDateTBD}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  )}
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

      {/* ============================================================ */}
      {/* MODAL: PREVIEW FOTO KEGIATAN LIGHTBOX                        */}
      {/* ============================================================ */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-950/80 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-md"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/60 p-3 min-h-0">
              <img
                src={getFotoUrl(previewPhoto.foto_url || previewPhoto.foto)}
                alt={previewPhoto.judul}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-1 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{previewPhoto.tanggal || 'Dokumentasi RPL'}</span>
              </div>
              <h3 className="font-bold text-base text-white">{previewPhoto.judul}</h3>
              {previewPhoto.deskripsi && (
                <p className="text-slate-300 text-xs leading-relaxed">{previewPhoto.deskripsi}</p>
              )}
            </div>
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
