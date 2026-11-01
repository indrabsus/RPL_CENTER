'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Laptop,
  Monitor,
  Wrench,
  History,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  User,
  Plus,
  RotateCcw,
  Minus,
  Check,
  X,
  RefreshCw,
  PenLine,
  Pencil,
  Trash2,
  Layers,
  SlidersHorizontal,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import {
  fetchBarang,
  searchSiswa,
  verifyRole,
  verifyKioskPIN,
  verifyAdminPIN,
  pinjamBarang,
  kembaliBarang,
  fetchRiwayat,
  submitAdminAction,
  syncGoogleSheet,
  BarangResponseData,
  BarangItem,
  SiswaPPDB,
  RiwayatItem,
} from '@/lib/api';

export default function KioskPage() {
  // Authentication states (zakola_id)
  const [authRole, setAuthRole] = useState<'admin' | 'sarpras' | null>(null);
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPin, setAuthPin] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [isKioskUnlocked, setIsKioskUnlocked] = useState<boolean>(false);
  const [kioskPinInput, setKioskPinInput] = useState<string>('');
  const [kioskPinError, setKioskPinError] = useState<string | null>(null);
  const [isVerifyingKiosk, setIsVerifyingKiosk] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('laptop');

  // Main data states
  const [data, setData] = useState<BarangResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [loanModalItem, setLoanModalItem] = useState<BarangItem | null>(null);
  const [returnModalItem, setReturnModalItem] = useState<BarangItem | null>(null);
  const [returnLoanId, setReturnLoanId] = useState<number | null>(null);

  // Borrower Selection Mode: 'siswa' (from database) OR 'manual' (for Guru / Tamu / Staff)
  const [borrowerType, setBorrowerType] = useState<'siswa' | 'manual'>('siswa');
  const [searchStudentInput, setSearchStudentInput] = useState<string>('');
  const [studentSearchResults, setStudentSearchResults] = useState<SiswaPPDB[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SiswaPPDB | null>(null);
  const [manualName, setManualName] = useState<string>('');
  const [manualRole, setManualRole] = useState<string>('');
  const [purposeInput, setPurposeInput] = useState<string>('');
  const [conditionInput, setConditionInput] = useState<string>('Normal (Tas, Charger dan Laptop)');
  const [equipmentQty, setEquipmentQty] = useState<number>(1);

  // Return modal inputs
  const [returnCondition, setReturnCondition] = useState<string>('Normal Lengkap (Tas, Charger dan Laptop)');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Riwayat Tab State
  const [riwayatList, setRiwayatList] = useState<RiwayatItem[]>([]);
  const [riwayatLoading, setRiwayatLoading] = useState<boolean>(false);
  const [riwayatPeriod, setRiwayatPeriod] = useState<string>('semua');
  const [riwayatCategory, setRiwayatCategory] = useState<string>('semua');
  const [riwayatStatus, setRiwayatStatus] = useState<string>('semua');
  const [riwayatSearch, setRiwayatSearch] = useState<string>('');
  const [riwayatTodayCount, setRiwayatTodayCount] = useState<number>(0);
  const [returnLoanDetails, setReturnLoanDetails] = useState<any>(null);

  // Peralatan Lab Tab State
  const [peralatanSearch, setPeralatanSearch] = useState<string>('');
  const [peralatanStatusFilter, setPeralatanStatusFilter] = useState<'all' | 'tersedia' | 'dipinjam'>('all');

  // Dynamic Custom Categories Tab State
  const [customSearch, setCustomSearch] = useState<string>('');
  const [customStatusFilter, setCustomStatusFilter] = useState<'all' | 'tersedia' | 'dipinjam'>('all');

  // Admin Tab State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminUsernameInput, setAdminUsernameInput] = useState<string>('admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [syncSheetStatus, setSyncSheetStatus] = useState<string | null>(null);

  // Admin Add Item Form
  const [newBarangCategory, setNewBarangCategory] = useState<string>('Laptop');
  const [isNewCustomCategory, setIsNewCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [newBarangKode, setNewBarangKode] = useState<string>('');
  const [newBarangNama, setNewBarangNama] = useState<string>('');
  const [newBarangJumlah, setNewBarangJumlah] = useState<number>(1);
  const [newBarangSatuan, setNewBarangSatuan] = useState<string>('Unit');
  const [newBarangSpecs, setNewBarangSpecs] = useState<string>('');
  const [newPinKiosk, setNewPinKiosk] = useState<string>('');
  const [newPinAdmin, setNewPinAdmin] = useState<string>('');

  // Admin Edit Item Modal
  const [editingBarang, setEditingBarang] = useState<BarangItem | null>(null);
  const [editKode, setEditKode] = useState<string>('');
  const [editNama, setEditNama] = useState<string>('');
  const [editKategori, setEditKategori] = useState<string>('Laptop');
  const [editIsCustomCategory, setEditIsCustomCategory] = useState<boolean>(false);
  const [editCustomCategoryName, setEditCustomCategoryName] = useState<string>('');
  const [editJumlahTotal, setEditJumlahTotal] = useState<number>(1);
  const [editSatuan, setEditSatuan] = useState<string>('Unit');
  const [editStatus, setEditStatus] = useState<'tersedia' | 'dipinjam' | 'perbaikan' | 'rusak'>('tersedia');
  const [editSpesifikasi, setEditSpesifikasi] = useState<string>('');
  const [editKondisi, setEditKondisi] = useState<string>('');

  // Check session storage on mount
  useEffect(() => {
    const savedRole = (sessionStorage.getItem('sarpras_auth_role') || sessionStorage.getItem('monitor_auth_role')) as 'admin' | 'sarpras' | null;
    const savedUsername = sessionStorage.getItem('sarpras_auth_username') || sessionStorage.getItem('monitor_auth_username') || '';
    const savedPin = sessionStorage.getItem('sarpras_auth_pin') || sessionStorage.getItem('monitor_auth_pin') || sessionStorage.getItem('admin_pin_sakuci') || '';

    if (savedRole) {
      setAuthRole(savedRole);
      setAuthUsername(savedUsername);
      setAuthPin(savedPin);
      setIsKioskUnlocked(true);
      if (savedRole === 'admin') {
        setIsAdminUnlocked(true);
        setAdminPinInput(savedPin);
      }
    } else {
      const savedKiosk = sessionStorage.getItem('kiosk_unlocked_sakuci');
      if (savedKiosk === 'true') {
        setIsKioskUnlocked(true);
      }
      const savedAdmin = sessionStorage.getItem('admin_unlocked_sakuci');
      const savedAdminPin = sessionStorage.getItem('admin_pin_sakuci');
      if (savedAdmin === 'true') {
        setIsAdminUnlocked(true);
      }
      if (savedAdminPin) {
        setAdminPinInput(savedAdminPin);
      }
    }
  }, []);

  // Show notification toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Load Inventory Data
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchBarang();
      setData(res);
      if (res.today_loans_count !== undefined) {
        setRiwayatTodayCount(res.today_loans_count);
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) showToast('error', err.message || 'Gagal memuat data inventaris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Load Riwayat when Tab is active
  const loadRiwayatData = async () => {
    setRiwayatLoading(true);
    try {
      const res = await fetchRiwayat({
        periode: riwayatPeriod,
        status: riwayatStatus,
        kategori: riwayatCategory,
        q: riwayatSearch,
      });
      setRiwayatList(res.riwayat);
      if (res.today_count !== undefined) {
        setRiwayatTodayCount(res.today_count);
      } else if (riwayatPeriod === 'hari_ini') {
        setRiwayatTodayCount(res.pagination.total);
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal memuat riwayat peminjaman');
    } finally {
      setRiwayatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'riwayat') {
      loadRiwayatData();
    }
  }, [activeTab, riwayatPeriod, riwayatStatus, riwayatCategory, riwayatSearch]);

  // Student Search Effect
  useEffect(() => {
    if (borrowerType === 'siswa' && searchStudentInput.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchSiswa(searchStudentInput);
          setStudentSearchResults(results);
        } catch (e) {
          console.error(e);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setStudentSearchResults([]);
    }
  }, [searchStudentInput, borrowerType]);

  // Unified Login Handler (Username & Password from zakola_id.users)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Username dan password wajib diisi');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await verifyRole({
        username: loginUsername.trim(),
        password: loginPassword.trim(),
      });
      const activePin = res.pin || (res.role === 'admin' ? '987654' : '654321');
      setAuthRole(res.role);
      setAuthUsername(res.username || loginUsername.trim());
      setAuthPin(activePin);
      setIsKioskUnlocked(true);

      if (res.role === 'admin') {
        setIsAdminUnlocked(true);
        setAdminPinInput(activePin);
      } else {
        setIsAdminUnlocked(false);
      }

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
      }

      setLoginUsername('');
      setLoginPassword('');
      showToast('success', `Berhasil masuk sebagai ${res.username} (${res.role === 'admin' ? 'Administrator' : 'Petugas Sarpras'})`);
    } catch (err: any) {
      setLoginError(err.message || 'Username atau password salah!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Lock Kiosk / Logout
  const handleLockKiosk = () => {
    setAuthRole(null);
    setAuthUsername('');
    setAuthPin('');
    setIsKioskUnlocked(false);
    setIsAdminUnlocked(false);
    setAdminPinInput('');
    sessionStorage.removeItem('sarpras_auth_role');
    sessionStorage.removeItem('sarpras_auth_username');
    sessionStorage.removeItem('sarpras_auth_pin');
    sessionStorage.removeItem('monitor_auth_role');
    sessionStorage.removeItem('monitor_auth_username');
    sessionStorage.removeItem('monitor_auth_pin');
    sessionStorage.removeItem('kiosk_unlocked_sakuci');
    sessionStorage.removeItem('admin_unlocked_sakuci');
    sessionStorage.removeItem('admin_pin_sakuci');
    showToast('success', 'Sesi telah keluar.');
  };

  // Admin Login Handler (Elevation in Admin Tab)
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) return;
    setActionLoading(true);
    setAdminPinError(null);
    try {
      const res = await verifyRole({
        username: adminUsernameInput.trim() || 'admin',
        password: adminPasswordInput.trim(),
      });
      if (res.role === 'admin') {
        const activePin = res.pin || '987654';
        setIsAdminUnlocked(true);
        setAuthRole('admin');
        setAuthUsername(res.username || adminUsernameInput.trim());
        setAuthPin(activePin);
        setAdminPinInput(activePin);
        sessionStorage.setItem('sarpras_auth_role', 'admin');
        sessionStorage.setItem('sarpras_auth_username', res.username || adminUsernameInput.trim());
        sessionStorage.setItem('sarpras_auth_pin', activePin);
        sessionStorage.setItem('monitor_auth_role', 'admin');
        sessionStorage.setItem('admin_unlocked_sakuci', 'true');
        sessionStorage.setItem('admin_pin_sakuci', activePin);
        setAdminPasswordInput('');
        showToast('success', 'Akses Menu Pengelola Administrator terbuka.');
      } else {
        setAdminPinError('Akun ini tidak memiliki hak akses Administrator.');
      }
    } catch (err: any) {
      setAdminPinError(err.message || 'Verifikasi login admin gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminUnlocked(false);
    setAdminPasswordInput('');
    sessionStorage.removeItem('admin_unlocked_sakuci');
    sessionStorage.removeItem('admin_pin_sakuci');
    showToast('success', 'Menu Pengelola telah ditutup.');
  };

  const handleSyncSpreadsheet = async () => {
    setIsSyncingSheet(true);
    setSyncSheetStatus(null);
    try {
      const res = await syncGoogleSheet();
      setSyncSheetStatus(res.message || 'Sinkronisasi ke Google Spreadsheet berhasil!');
      showToast('success', 'Google Spreadsheet berhasil disinkronkan!');
      setTimeout(() => setSyncSheetStatus(null), 6000);
    } catch (err: any) {
      showToast('error', 'Gagal sinkronisasi Spreadsheet: ' + (err.message || 'Error'));
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Open Loan Modal
  const openLoanModal = (item: BarangItem) => {
    setLoanModalItem(item);
    setBorrowerType('siswa');
    setSelectedStudent(null);
    setSearchStudentInput('');
    setManualName('');
    setManualRole('');
    setPurposeInput('');
    setEquipmentQty(1);

    const isPC = item.kategori === 'PC Workshop' || item.kategori === 'Ruangan Workshop RPL' || item.kode_barang.toUpperCase().startsWith('PC');
    if (isPC) {
      setConditionInput('Normal Workstation PC');
    } else if (item.kategori === 'Laptop') {
      setConditionInput('Normal (Tas, Charger dan Laptop)');
    } else {
      setConditionInput('Normal Baik');
    }
  };

  // Submit Loan
  const handlePinjamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanModalItem) return;

    let finalName = '';
    let finalClassOrRole = '';

    if (borrowerType === 'siswa') {
      if (!selectedStudent) {
        showToast('error', 'Silakan pilih siswa dari data pencarian database');
        return;
      }
      finalName = selectedStudent.nama_lengkap;
      finalClassOrRole = selectedStudent.kelas;
    } else {
      // Manual mode (Guru, Tamu, Staf)
      if (!manualName.trim()) {
        showToast('error', 'Nama peminjam (Guru/Tamu) wajib diisi');
        return;
      }
      finalName = manualName.trim();
      finalClassOrRole = manualRole.trim() || 'Guru / Pengajar';
    }

    if (!purposeInput.trim()) {
      showToast('error', 'Keperluan/kebutuhan peminjaman wajib diisi');
      return;
    }

    setActionLoading(true);
    try {
      await pinjamBarang({
        barang_id: loanModalItem.id,
        id_siswa: selectedStudent?.id_siswa,
        nama_siswa: finalName,
        nisn: selectedStudent?.nisn || undefined,
        kelas: finalClassOrRole,
        jumlah: (loanModalItem.kategori !== 'Laptop' && loanModalItem.kategori !== 'PC Workshop' && loanModalItem.jumlah_tersedia > 1) ? equipmentQty : 1,
        kebutuhan: purposeInput.trim(),
        kondisi_pinjam: conditionInput,
      });

      showToast('success', `Berhasil meminjam ${loanModalItem.nama_barang}!`);
      setLoanModalItem(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memproses peminjaman');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Return Modal
  const openReturnModal = (item: BarangItem, loanId?: number, directLoanDetails?: any) => {
    setReturnModalItem(item);
    setReturnLoanId(loanId || item.active_loan?.id || (item.active_loans && item.active_loans[0]?.id) || (item.peminjam_list && item.peminjam_list[0]?.peminjaman_id) || null);
    setReturnNotes('');

    if (directLoanDetails) {
      setReturnLoanDetails(directLoanDetails);
    } else {
      const loans: any[] = item.active_loans || item.peminjam_list || [];
      const matchedLoan = loanId ? loans.find((l: any) => (l.id === loanId || l.peminjaman_id === loanId)) : (item.active_loan || item.peminjam || (loans.length > 0 ? loans[0] : null));

      if (matchedLoan) {
        setReturnLoanDetails({
          id: matchedLoan.id || matchedLoan.peminjaman_id,
          kode_peminjaman: matchedLoan.kode_peminjaman,
          nama_siswa: matchedLoan.nama_siswa,
          nisn: matchedLoan.nisn || null,
          kelas: matchedLoan.kelas,
          jumlah: matchedLoan.jumlah || 1,
          kebutuhan: matchedLoan.kebutuhan,
          kondisi_pinjam: matchedLoan.kondisi_pinjam,
          waktu_pinjam: matchedLoan.waktu_pinjam,
          waktu_pinjam_formatted: matchedLoan.waktu_pinjam_formatted || matchedLoan.waktu_pinjam_format,
          durasi_sekarang: matchedLoan.durasi_sekarang || matchedLoan.durasi || '-',
        });
      } else {
        setReturnLoanDetails(null);
      }
    }

    const isPC = item.kategori === 'PC Workshop' || item.kategori === 'Ruangan Workshop RPL' || item.kode_barang.toUpperCase().startsWith('PC');
    if (isPC) {
      setReturnCondition('Normal Selesai Praktik');
    } else if (item.kategori === 'Laptop') {
      setReturnCondition('Normal Lengkap (Tas, Charger dan Laptop)');
    } else {
      setReturnCondition('Normal Lengkap');
    }
  };

  // Return directly from Riwayat tab
  const handleReturnFromRiwayat = (r: RiwayatItem) => {
    const found = data?.barang.find((b) => b.id === r.barang_id || b.kode_barang === r.kode_barang);
    const itemToReturn: BarangItem = found || {
      id: r.barang_id,
      kode_barang: r.kode_barang,
      nama_barang: r.nama_barang,
      kategori: r.kategori || 'Peralatan',
      spesifikasi: '',
      jumlah_total: r.jumlah,
      jumlah_tersedia: 0,
      satuan: r.satuan || 'Unit',
      status: 'dipinjam',
      kondisi_terakhir: r.kondisi_pinjam || 'Normal',
      catatan: null,
      created_at: '',
      updated_at: '',
    };

    openReturnModal(itemToReturn, r.id, {
      id: r.id,
      kode_peminjaman: r.kode_peminjaman,
      nama_siswa: r.nama_siswa,
      nisn: r.nisn,
      kelas: r.kelas,
      jumlah: r.jumlah,
      kebutuhan: r.kebutuhan,
      kondisi_pinjam: r.kondisi_pinjam,
      waktu_pinjam: r.waktu_pinjam,
      waktu_pinjam_formatted: r.waktu_pinjam_formatted || r.waktu_pinjam_format || r.waktu_pinjam,
      durasi_sekarang: r.durasi,
    });
  };

  // Submit Return
  const handleKembaliSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalItem) return;

    setActionLoading(true);
    try {
      await kembaliBarang({
        peminjaman_id: returnLoanId || undefined,
        barang_id: returnModalItem.id,
        kondisi_kembali: returnCondition,
        catatan_kembali: returnNotes.trim() || undefined,
      });

      showToast('success', `Pengembalian ${returnModalItem.nama_barang} berhasil dicatat.`);
      setReturnModalItem(null);
      await loadData();
      if (activeTab === 'riwayat') loadRiwayatData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengembalikan sarpras');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to get active admin PIN / authorization
  const getAdminPin = () => {
    if (authPin && authPin.trim()) return authPin.trim();
    if (adminPinInput && adminPinInput.trim()) return adminPinInput.trim();
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('sarpras_auth_pin') || sessionStorage.getItem('monitor_auth_pin') || sessionStorage.getItem('admin_pin_sakuci');
      if (saved && saved.trim()) return saved.trim();
    }
    return '987654';
  };

  // Admin Add Item
  const handleAdminTambahBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarangKode.trim() || !newBarangNama.trim()) {
      showToast('error', 'Kode dan nama sarpras wajib diisi');
      return;
    }

    const finalCategory = isNewCustomCategory ? customCategoryName.trim() : newBarangCategory;
    if (!finalCategory) {
      showToast('error', 'Kategori sarpras wajib diisi');
      return;
    }

    const currentPin = getAdminPin();
    if (!currentPin) {
      showToast('error', 'PIN Admin diperlukan untuk menambahkan sarpras.');
      return;
    }

    setActionLoading(true);
    try {
      await submitAdminAction({
        pin_admin: currentPin,
        action: 'tambah_barang',
        kode_barang: newBarangKode.trim().toUpperCase(),
        nama_barang: newBarangNama.trim(),
        kategori: finalCategory,
        spesifikasi: newBarangSpecs.trim(),
        jumlah_total: newBarangJumlah,
        satuan: newBarangSatuan,
      });

      sessionStorage.setItem('admin_pin_sakuci', currentPin);
      showToast('success', `Sarpras baru ${newBarangNama} berhasil ditambahkan ke zakola_id!`);
      setNewBarangKode('');
      setNewBarangNama('');
      setNewBarangSpecs('');
      setIsNewCustomCategory(false);
      setCustomCategoryName('');
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambah barang');
    } finally {
      setActionLoading(false);
    }
  };

  // Start Editing Item
  const handleStartEdit = (b: BarangItem) => {
    setEditingBarang(b);
    setEditKode(b.kode_barang);
    setEditNama(b.nama_barang);
    let kat = b.kategori;
    if (kat === 'Ruangan Workshop RPL') kat = 'PC Workshop';
    setEditKategori(kat);
    setEditIsCustomCategory(false);
    setEditCustomCategoryName('');
    setEditJumlahTotal(b.jumlah_total);
    setEditSatuan(b.satuan || 'Unit');
    setEditStatus(b.status || 'tersedia');
    setEditSpesifikasi(b.spesifikasi || '');
    setEditKondisi(b.kondisi_terakhir || '');
  };

  // Save Edited Item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;

    const finalCategory = editIsCustomCategory ? editCustomCategoryName.trim() : editKategori;
    if (!finalCategory) {
      showToast('error', 'Kategori sarpras wajib diisi');
      return;
    }

    const currentPin = getAdminPin();
    if (!currentPin) {
      showToast('error', 'PIN Admin diperlukan untuk menyimpan perubahan.');
      return;
    }

    setActionLoading(true);
    try {
      await submitAdminAction({
        pin_admin: currentPin,
        action: 'edit_barang',
        barang_id: editingBarang.id,
        kode_barang: editKode.trim().toUpperCase(),
        nama_barang: editNama.trim(),
        kategori: finalCategory,
        jumlah_total: editJumlahTotal,
        satuan: editSatuan.trim(),
        status: editStatus,
        spesifikasi: editSpesifikasi.trim(),
        kondisi_terakhir: editKondisi.trim(),
      });

      sessionStorage.setItem('admin_pin_sakuci', currentPin);
      showToast('success', `Perubahan data ${editNama} berhasil disimpan.`);
      setEditingBarang(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan perubahan barang');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Item
  const handleDeleteBarang = async (b: BarangItem) => {
    if (!confirm(`Hapus permanen ${b.kode_barang} (${b.nama_barang}) dari database zakola_id?`)) {
      return;
    }

    const currentPin = getAdminPin();
    if (!currentPin) {
      showToast('error', 'PIN Admin diperlukan.');
      return;
    }

    setActionLoading(true);
    try {
      await submitAdminAction({
        pin_admin: currentPin,
        action: 'hapus_barang',
        barang_id: b.id,
      });

      showToast('success', `Sarpras ${b.kode_barang} telah dihapus.`);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus barang');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Emergency Reset
  const handleAdminResetStatus = async (barangId: number, nama: string) => {
    if (!confirm(`Reset status ${nama} menjadi 'tersedia'? Peminjaman aktif terkait akan otomatis diselesaikan.`)) {
      return;
    }

    const currentPin = getAdminPin();
    if (!currentPin) {
      showToast('error', 'PIN Admin diperlukan.');
      return;
    }

    setActionLoading(true);
    try {
      await submitAdminAction({
        pin_admin: currentPin,
        action: 'reset_status',
        barang_id: barangId,
      });
      showToast('success', `Status ${nama} telah direset menjadi TERSEDIA.`);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal reset status');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Update PINs
  const handleAdminUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinKiosk && !newPinAdmin) {
      showToast('error', 'Masukkan setidaknya satu PIN baru');
      return;
    }

    const currentPin = getAdminPin();
    if (!currentPin) {
      showToast('error', 'PIN Admin diperlukan.');
      return;
    }

    setActionLoading(true);
    try {
      await submitAdminAction({
        pin_admin: currentPin,
        action: 'update_pin',
        pin_kiosk: newPinKiosk || undefined,
        pin_admin_baru: newPinAdmin || undefined,
      });
      showToast('success', 'PIN berhasil diperbarui di database.');
      if (newPinAdmin) {
        setAdminPinInput(newPinAdmin);
        sessionStorage.setItem('admin_pin_sakuci', newPinAdmin);
      }
      setNewPinKiosk('');
      setNewPinAdmin('');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal update PIN');
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamically compute custom categories from data
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

  // Categorized items: Normalized to match both database values ('PC Workshop') and labels ('Ruangan Workshop RPL')
  const laptops = useMemo(
    () => data?.barang.filter((b) => b.kategori === 'Laptop' || b.kode_barang.toUpperCase().startsWith('RPL')) || [],
    [data]
  );
  const pcWorkstations = useMemo(
    () =>
      data?.barang.filter(
        (b) =>
          b.kategori === 'PC Workshop' ||
          b.kategori === 'Ruangan Workshop RPL' ||
          b.kode_barang.toUpperCase().startsWith('PC')
      ) || [],
    [data]
  );
  const peralatanLab = useMemo(
    () =>
      data?.barang.filter(
        (b) =>
          b.kategori === 'Peralatan' ||
          (!b.kategori && !b.kode_barang.toUpperCase().startsWith('RPL') && !b.kode_barang.toUpperCase().startsWith('PC'))
      ) || [],
    [data]
  );

  const filteredPeralatanLab = useMemo(() => {
    return peralatanLab.filter((b) => {
      if (peralatanStatusFilter === 'tersedia' && b.jumlah_tersedia <= 0) return false;
      if (peralatanStatusFilter === 'dipinjam') {
        const borrowed = b.unit_dipinjam ?? Math.max(0, b.jumlah_total - b.jumlah_tersedia);
        if (borrowed <= 0) return false;
      }
      if (peralatanSearch.trim()) {
        const q = peralatanSearch.toLowerCase();
        const matchCode = b.kode_barang.toLowerCase().includes(q);
        const matchName = b.nama_barang.toLowerCase().includes(q);
        const matchSpecs = b.spesifikasi ? b.spesifikasi.toLowerCase().includes(q) : false;
        const loans: any[] = b.active_loans || b.peminjam_list || (b.active_loan ? [b.active_loan] : []);
        const matchBorrower = loans.some((l: any) => (l.nama_siswa || '').toLowerCase().includes(q));
        return matchCode || matchName || matchSpecs || matchBorrower;
      }
      return true;
    });
  }, [peralatanLab, peralatanSearch, peralatanStatusFilter]);

  // Dynamic custom category tab items
  const currentCategoryName = activeTab.startsWith('cat_') ? activeTab.replace('cat_', '') : '';
  const currentCategoryItems = useMemo(() => {
    if (!currentCategoryName || !data?.barang) return [];
    return data.barang.filter((b) => b.kategori === currentCategoryName);
  }, [data, currentCategoryName]);

  const filteredCurrentCategoryItems = useMemo(() => {
    return currentCategoryItems.filter((b) => {
      if (customStatusFilter === 'tersedia' && b.jumlah_tersedia <= 0) return false;
      if (customStatusFilter === 'dipinjam') {
        const borrowed = b.unit_dipinjam ?? Math.max(0, b.jumlah_total - b.jumlah_tersedia);
        if (borrowed <= 0) return false;
      }
      if (customSearch.trim()) {
        const q = customSearch.toLowerCase();
        const matchCode = b.kode_barang.toLowerCase().includes(q);
        const matchName = b.nama_barang.toLowerCase().includes(q);
        const matchSpecs = b.spesifikasi ? b.spesifikasi.toLowerCase().includes(q) : false;
        const loans: any[] = b.active_loans || b.peminjam_list || (b.active_loan ? [b.active_loan] : []);
        const matchBorrower = loans.some((l: any) => (l.nama_siswa || '').toLowerCase().includes(q));
        return matchCode || matchName || matchSpecs || matchBorrower;
      }
      return true;
    });
  }, [currentCategoryItems, customSearch, customStatusFilter]);

  // Filtered items for Admin Master Table
  const adminFilteredItems = useMemo(() => {
    if (!data?.barang) return [];
    return data.barang.filter((b) => {
      // Category filter
      if (adminCategoryFilter !== 'all') {
        if (adminCategoryFilter === 'Laptop') {
          if (b.kategori !== 'Laptop' && !b.kode_barang.toUpperCase().startsWith('RPL')) return false;
        } else if (adminCategoryFilter === 'PC Workshop') {
          if (
            b.kategori !== 'PC Workshop' &&
            b.kategori !== 'Ruangan Workshop RPL' &&
            !b.kode_barang.toUpperCase().startsWith('PC')
          )
            return false;
        } else if (adminCategoryFilter === 'Peralatan') {
          if (b.kategori !== 'Peralatan') return false;
        } else {
          if (b.kategori !== adminCategoryFilter) return false;
        }
      }

      // Search query
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.toLowerCase();
        return (
          b.kode_barang.toLowerCase().includes(q) ||
          b.nama_barang.toLowerCase().includes(q) ||
          (b.spesifikasi && b.spesifikasi.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data, adminCategoryFilter, adminSearchQuery]);

  // Filtered items for Riwayat Tab (Laptop, PC, Peralatan, Dynamic Custom, Semua)
  const filteredRiwayat = useMemo(() => {
    return riwayatList.filter((r) => {
      if (riwayatCategory === 'laptop') {
        return (
          r.kategori === 'Laptop' ||
          r.kode_barang.toUpperCase().startsWith('RPL') ||
          r.kode_peminjaman.toUpperCase().startsWith('PINJ')
        );
      }
      if (riwayatCategory === 'pc') {
        return (
          r.kategori === 'PC Workshop' ||
          r.kategori === 'Ruangan Workshop RPL' ||
          r.kode_barang.toUpperCase().startsWith('PC') ||
          r.kode_peminjaman.toUpperCase().startsWith('PCWS')
        );
      }
      if (riwayatCategory === 'peralatan') {
        return (
          r.kategori === 'Peralatan' ||
          r.kode_barang.toUpperCase().startsWith('ALAT') ||
          r.kode_peminjaman.toUpperCase().startsWith('ALAT')
        );
      }
      if (riwayatCategory !== 'semua') {
        return r.kategori === riwayatCategory;
      }
      return true;
    });
  }, [riwayatList, riwayatCategory]);

  // ==========================================
  // RENDER: LOGIN PORTAL (DATABASE zakola_id)
  // ==========================================
  if (!isKioskUnlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 p-2 flex items-center justify-center mx-auto shadow-xs">
            <img
              src="/logo.png"
              alt="Logo SMK Sangkuriang 1 Cimahi"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pusat Pengelola RPL
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              Login Akun Pengelola & Petugas Sarpras (<span className="font-semibold text-slate-800">Database zakola_id</span>)
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Contoh: admin / petugas / stafit"
                autoFocus
                className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Masukkan password akun"
                className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
              {loginError && (
                <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !loginUsername.trim() || !loginPassword.trim()}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Masuk ke Sistem Pengelola</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors flex items-center gap-1">
              &larr; Kembali ke Monitor Publik
            </Link>
            <span className="font-mono text-[11px]">Lab RPL SMK Sangkuriang 1 Cimahi</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: UNLOCKED KIOSK TERMINAL (LIGHT MODE)
  // ==========================================
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10'
              : 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-500/10'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Kiosk Header & Navigation Tabs */}
      <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Logo SMK Sangkuriang 1 Cimahi"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Terminal Operasional Lab RPL
              </h1>
              <p className="text-[11px] text-slate-500">Sesi Kios Aktif &bull; Klik sarpras untuk pinjam atau kembalikan</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-800">{authUsername || (authRole === 'admin' ? 'admin' : 'petugas')}</span>
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                authRole === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {authRole === 'admin' ? 'Admin' : 'Sarpras'}
              </span>
            </div>

            <button
              onClick={() => loadData(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLockKiosk}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Keluar dari sesi pengelola"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab('laptop')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'laptop'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Laptop RPL</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'laptop' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {laptops.filter((l) => l.status === 'tersedia').length}/{laptops.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pc')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Ruangan Workshop RPL (PC)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'pc' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {pcWorkstations.filter((p) => p.status === 'tersedia').length}/{pcWorkstations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('peralatan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'peralatan'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Peralatan Lab</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'peralatan' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {data?.stats_peralatan.tersedia_unit ?? 0} Unit
            </span>
          </button>

          {/* Dynamic Custom Category Tabs */}
          {customCategories.map((cat) => {
            const catItems = data?.barang.filter((b) => b.kategori === cat) || [];
            const readyUnits = catItems.reduce((acc, b) => acc + (b.jumlah_tersedia ?? (b.status === 'tersedia' ? 1 : 0)), 0);
            const totalUnits = catItems.reduce((acc, b) => acc + (b.jumlah_total ?? 1), 0);
            const isCatActive = activeTab === 'cat_' + cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveTab('cat_' + cat);
                  setCustomSearch('');
                  setCustomStatusFilter('all');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isCatActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {readyUnits}/{totalUnits} Unit
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Peminjaman</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${activeTab === 'riwayat' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              ({riwayatTodayCount || riwayatList.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Menu Pengelola</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LAPTOP RPL (PINJAM & KEMBALIKAN DALAM SATU TAB)    */}
      {/* ========================================================= */}
      {activeTab === 'laptop' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <p>
              Klik pada laptop yang <span className="text-emerald-700 font-semibold">Tersedia</span> untuk meminjam,
              atau klik laptop yang <span className="text-blue-700 font-semibold">Sedang Dipinjam</span> untuk mengembalikan.
            </p>
            <span className="font-mono text-slate-500 hidden sm:inline">8 Unit Laptop RPL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {laptops.map((laptop) => {
              const isReady = laptop.status === 'tersedia';
              return (
                <div
                  key={laptop.id}
                  onClick={() => (isReady ? openLoanModal(laptop) : openReturnModal(laptop))}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer select-none bg-white shadow-xs hover:shadow-sm ${
                    isReady
                      ? 'border-slate-200 hover:border-emerald-500/80'
                      : 'border-blue-200 bg-blue-50/20 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {laptop.kode_barang}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isReady
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isReady ? 'Siap Pinjam' : 'Sedang Dipinjam'}
                      </span>
                    </div>

                    <div className="relative w-full h-32 rounded-xl bg-slate-50 border border-slate-200 mb-3 flex items-center justify-center overflow-hidden p-2">
                      <img
                        src="/laptop.png"
                        alt={laptop.nama_barang}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                      {laptop.nama_barang}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {laptop.spesifikasi || 'Intel Core i5 / RAM 8GB / SSD 256GB - Tas, Charger & Laptop'}
                    </p>

                    {/* Active borrower summary */}
                    {!isReady && laptop.active_loan && (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <User className="w-3 h-3 text-blue-600" />
                          <span className="truncate">{laptop.active_loan.nama_siswa}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{laptop.active_loan.kelas}</span>
                          <span className="font-mono text-blue-600 font-semibold">{laptop.active_loan.durasi_sekarang}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                    {isReady ? (
                      <span className="text-emerald-700 flex items-center gap-1 group-hover:underline">
                        <Plus className="w-3.5 h-3.5" /> Klik untuk Pinjam
                      </span>
                    ) : (
                      <span className="text-blue-700 flex items-center gap-1 group-hover:underline">
                        <RotateCcw className="w-3.5 h-3.5" /> Klik untuk Kembalikan
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px] font-mono">&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RUANGAN WORKSHOP RPL (7 PC)                        */}
      {/* ========================================================= */}
      {activeTab === 'pc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <p>
              Workstation PC Ruangan Workshop RPL. Klik PC yang <span className="text-emerald-700 font-semibold">Tersedia</span> untuk langsung pakai,
              atau klik PC yang <span className="text-blue-700 font-semibold">Sedang Dipakai</span> untuk menyudahi.
            </p>
            <span className="font-mono text-slate-500 hidden sm:inline">
              {pcWorkstations.length} PC Workstation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pcWorkstations.map((pc) => {
              const isReady = pc.status === 'tersedia';
              return (
                <div
                  key={pc.id}
                  onClick={() => (isReady ? openLoanModal(pc) : openReturnModal(pc))}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer select-none bg-white shadow-xs hover:shadow-sm ${
                    isReady
                      ? 'border-slate-200 hover:border-emerald-500/80'
                      : 'border-blue-200 bg-blue-50/20 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {pc.kode_barang}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isReady
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isReady ? 'Kosong / Siap Pakai' : 'Sedang Dipakai'}
                      </span>
                    </div>

                    {/* PC Thumbnail */}
                    <div className="relative w-full h-32 rounded-xl bg-slate-50 border border-slate-200 mb-3 flex items-center justify-center overflow-hidden">
                      <img
                        src="/pc.jpg"
                        alt={pc.nama_barang}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Monitor className={`w-4 h-4 ${isReady ? 'text-emerald-600' : 'text-blue-600'}`} />
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                        {pc.nama_barang}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {pc.spesifikasi || 'PC Workstation Ruangan Workshop RPL'}
                    </p>

                    {!isReady && pc.active_loan && (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <User className="w-3 h-3 text-blue-600" />
                          <span className="truncate">{pc.active_loan.nama_siswa}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{pc.active_loan.kelas}</span>
                          <span className="font-mono text-blue-600 font-semibold">{pc.active_loan.durasi_sekarang}</span>
                        </div>
                        <p className="text-slate-500 italic line-clamp-1 border-t border-slate-200 pt-1">
                          &ldquo;{pc.active_loan.kebutuhan}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                    {isReady ? (
                      <span className="text-emerald-700 flex items-center gap-1 group-hover:underline">
                        <Plus className="w-3.5 h-3.5" /> Gunakan PC Ini
                      </span>
                    ) : (
                      <span className="text-blue-700 flex items-center gap-1 group-hover:underline">
                        <RotateCcw className="w-3.5 h-3.5" /> Sudahi Pemakaian
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px] font-mono">&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PERALATAN LAB DENGAN JUMLAH/STOK                   */}
      {/* ========================================================= */}
      {activeTab === 'peralatan' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPeralatanStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    peralatanStatusFilter === 'all'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({peralatanLab.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPeralatanStatusFilter('tersedia')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    peralatanStatusFilter === 'tersedia'
                      ? 'bg-white text-emerald-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tersedia ({peralatanLab.filter((p) => p.jumlah_tersedia > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setPeralatanStatusFilter('dipinjam')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    peralatanStatusFilter === 'dipinjam'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dipinjam ({peralatanLab.filter((p) => p.jumlah_tersedia < p.jumlah_total).length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={peralatanSearch}
                onChange={(e) => setPeralatanSearch(e.target.value)}
                placeholder="Cari nama alat, kode, spesifikasi..."
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* List View Peralatan Lab */}
          {filteredPeralatanLab.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-500">
              <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Peralatan tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPeralatanLab.map((item) => {
                const ready = item.jumlah_tersedia;
                const total = item.jumlah_total;
                const activeLoans: any[] = (item.active_loans && item.active_loans.length > 0)
                  ? item.active_loans
                  : (item.peminjam_list && item.peminjam_list.length > 0)
                  ? item.peminjam_list
                  : (item.active_loan ? [item.active_loan] : (item.peminjam ? [item.peminjam] : []));
                const isItemBorrowed = activeLoans.length > 0 || ready < total;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            {item.kode_barang}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              ready > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {ready > 0 ? `${ready} / ${total} ${item.satuan} Ready` : 'Habis (Semua Dipinjam)'}
                          </span>
                          {item.kondisi_terakhir && (
                            <span className="text-[11px] text-slate-500">
                              &bull; Kondisi: <span className="font-medium text-slate-700">{item.kondisi_terakhir}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {item.nama_barang}
                        </h3>
                        {item.spesifikasi && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {item.spesifikasi}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {isItemBorrowed && (
                          <button
                            type="button"
                            onClick={() => openReturnModal(item, activeLoans[0]?.id || activeLoans[0]?.peminjaman_id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-700 hover:border-blue-300 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openLoanModal(item)}
                          disabled={ready <= 0}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Pinjam Alat</span>
                        </button>
                      </div>
                    </div>

                    {isItemBorrowed && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-blue-800 text-[11px] flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> Sedang Dipinjam:
                          </span>
                          {activeLoans.map((loan: any) => {
                            const loanId = loan.id || loan.peminjaman_id;
                            const qty = loan.jumlah || 1;
                            return (
                              <span
                                key={loanId || loan.kode_peminjaman || Math.random()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-slate-800"
                              >
                                <span className="font-bold">{loan.nama_siswa}</span>
                                <span className="text-slate-500">({loan.kelas})</span>
                                <span className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200">
                                  {qty} {item.satuan}
                                </span>
                                <button
                                  type="button"
                                  title="Kembalikan unit ini"
                                  onClick={() => openReturnModal(item, loanId)}
                                  className="text-blue-600 hover:text-blue-800 font-bold ml-0.5 cursor-pointer"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 self-end sm:self-center shrink-0">
                          {total - ready} {item.satuan} di luar
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB DYNAMIC: KATEGORI BARU / CUSTOM (LIST VIEW NO THUMB)  */}
      {/* ========================================================= */}
      {activeTab.startsWith('cat_') && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    customStatusFilter === 'all'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({currentCategoryItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomStatusFilter('tersedia')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    customStatusFilter === 'tersedia'
                      ? 'bg-white text-emerald-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tersedia ({currentCategoryItems.filter((p) => p.jumlah_tersedia > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomStatusFilter('dipinjam')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    customStatusFilter === 'dipinjam'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dipinjam ({currentCategoryItems.filter((p) => p.jumlah_tersedia < p.jumlah_total).length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                placeholder={`Cari nama ${currentCategoryName}, kode, spek...`}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* List View Custom Category (Bentuk List Tanpa Thumbnail) */}
          {filteredCurrentCategoryItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-500">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Item {currentCategoryName} tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCurrentCategoryItems.map((item) => {
                const ready = item.jumlah_tersedia;
                const total = item.jumlah_total;
                const activeLoans: any[] = (item.active_loans && item.active_loans.length > 0)
                  ? item.active_loans
                  : (item.peminjam_list && item.peminjam_list.length > 0)
                  ? item.peminjam_list
                  : (item.active_loan ? [item.active_loan] : (item.peminjam ? [item.peminjam] : []));
                const isItemBorrowed = activeLoans.length > 0 || ready < total;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            {item.kode_barang}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              ready > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {ready > 0 ? `${ready} / ${total} ${item.satuan} Ready` : 'Habis (Semua Dipinjam)'}
                          </span>
                          {item.kondisi_terakhir && (
                            <span className="text-[11px] text-slate-500">
                              &bull; Kondisi: <span className="font-medium text-slate-700">{item.kondisi_terakhir}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {item.nama_barang}
                        </h3>
                        {item.spesifikasi && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {item.spesifikasi}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {isItemBorrowed && (
                          <button
                            type="button"
                            onClick={() => openReturnModal(item, activeLoans[0]?.id || activeLoans[0]?.peminjaman_id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-700 hover:border-blue-300 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openLoanModal(item)}
                          disabled={ready <= 0}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Pinjam Barang</span>
                        </button>
                      </div>
                    </div>

                    {isItemBorrowed && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-blue-800 text-[11px] flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> Sedang Dipinjam:
                          </span>
                          {activeLoans.map((loan: any) => {
                            const loanId = loan.id || loan.peminjaman_id;
                            const qty = loan.jumlah || 1;
                            return (
                              <span
                                key={loanId || loan.kode_peminjaman || Math.random()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-slate-800"
                              >
                                <span className="font-bold">{loan.nama_siswa}</span>
                                <span className="text-slate-500">({loan.kelas})</span>
                                <span className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200">
                                  {qty} {item.satuan}
                                </span>
                                <button
                                  type="button"
                                  title="Kembalikan unit ini"
                                  onClick={() => openReturnModal(item, loanId)}
                                  className="text-blue-600 hover:text-blue-800 font-bold ml-0.5 cursor-pointer"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 self-end sm:self-center shrink-0">
                          {total - ready} {item.satuan} di luar
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: RIWAYAT PEMINJAMAN                                 */}
      {/* ========================================================= */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Category Filter Pills: Laptop, PC, Peralatan, Semua */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">Kategori:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setRiwayatCategory('semua')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      riwayatCategory === 'semua'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiwayatCategory('laptop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      riwayatCategory === 'laptop'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Laptop className="w-3 h-3" />
                    <span>Laptop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiwayatCategory('pc')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      riwayatCategory === 'pc'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiwayatCategory('peralatan')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      riwayatCategory === 'peralatan'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Peralatan</span>
                  </button>
                  {customCategories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRiwayatCategory(c)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        riwayatCategory === c
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Periode Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">Periode:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {['hari_ini', 'semua', '7_hari', '30_hari'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setRiwayatPeriod(p)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        riwayatPeriod === p ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {p.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={riwayatSearch}
                onChange={(e) => setRiwayatSearch(e.target.value)}
                placeholder="Cari peminjam / barang..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Table / List */}
          {riwayatLoading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Memuat riwayat peminjaman...</p>
            </div>
          ) : filteredRiwayat.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-500">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Belum ada riwayat transaksi</p>
              <p className="text-xs text-slate-500 mt-1">Data peminjaman akan tercatat di sini secara otomatis.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRiwayat.map((r) => {
                const isReturned = r.status === 'dikembalikan';
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-blue-600">{r.kode_peminjaman}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isReturned
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="font-mono text-slate-500">{r.durasi}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                        <span>{r.nama_siswa}</span>
                        <span className="text-slate-500 font-normal">({r.kelas})</span>
                        <span className="text-slate-300 font-normal">&bull;</span>
                        <span className="text-slate-700">{r.nama_barang}</span>
                        {r.jumlah > 1 && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            x{r.jumlah}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-600 italic">Keperluan: &ldquo;{r.kebutuhan}&rdquo;</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      <div className="flex flex-col sm:items-end text-slate-500 text-[11px] gap-1">
                        <div>
                          <span className="text-slate-400">Pinjam: </span>
                          <span className="text-slate-700 font-semibold">
                            {r.waktu_pinjam_formatted || r.waktu_pinjam_format || r.waktu_pinjam || '-'}
                          </span>
                        </div>
                        {isReturned ? (
                          <div>
                            <span className="text-slate-400">Kembali: </span>
                            <span className="text-emerald-700 font-semibold">
                              {r.waktu_kembali_formatted || r.waktu_kembali_format || r.waktu_kembali || '-'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Belum Dikembalikan
                            </span>
                          </div>
                        )}
                      </div>

                      {!isReturned && (
                        <button
                          type="button"
                          onClick={() => handleReturnFromRiwayat(r)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Kembalikan</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MENU PENGELOLA (ADMIN - LENGKAP CRUD MASTER BARANG) */}
      {/* ========================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {!isAdminUnlocked ? (
            <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Akses Menu Pengelola (Administrator)</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Menu ini memerlukan hak akses Administrator zakola_id. Masukkan username dan password administrator.
                </p>
              </div>

              <form onSubmit={handleUnlockAdmin} className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Username Admin
                  </label>
                  <input
                    type="text"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="Contoh: admin / stafit"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Masukkan password akun admin"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                {adminPinError && (
                  <p className="text-xs text-rose-600 font-medium">{adminPinError}</p>
                )}
                <button
                  type="submit"
                  disabled={actionLoading || !adminPasswordInput}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs mt-2"
                >
                  {actionLoading ? 'Memeriksa Kredensial...' : 'Masuk sebagai Administrator'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Admin Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Mode Pengelola Lab (Database zakola_id)</h2>
                    <p className="text-xs text-slate-500">Kelola master data barang (Tambah, Edit, Hapus, Reset Status)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleSyncSpreadsheet}
                    disabled={isSyncingSheet}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all"
                    title="Kirim dan sinkronkan seluruh data ke Google Spreadsheet"
                  >
                    <FileSpreadsheet className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSheet ? 'Menyinkronkan...' : 'Sync Spreadsheet'}</span>
                  </button>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1swhqSk18TJv098Y9DcbglDhhUW6OoDkA-I8TOiicMR0/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all"
                    title="Buka Google Spreadsheet"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Sheet</span>
                  </a>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Sarpras Baru</span>
                  </button>
                  <button
                    onClick={handleCloseAdmin}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-all"
                  >
                    Tutup Admin
                  </button>
                </div>
              </div>

              {syncSheetStatus && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{syncSheetStatus}</span>
                  </div>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1swhqSk18TJv098Y9DcbglDhhUW6OoDkA-I8TOiicMR0/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold text-emerald-900"
                  >
                    Lihat Spreadsheet &rarr;
                  </a>
                </div>
              )}

              {/* SECTION: MASTER DATA BARANG (CRUD TABLE & CARDS) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Daftar Master Data Sarpras ({adminFilteredItems.length} Item)
                    </h3>
                  </div>

                  {/* Category Pills & Search */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                      <button
                        onClick={() => setAdminCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          adminCategoryFilter === 'all'
                            ? 'bg-white text-slate-900 font-semibold shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setAdminCategoryFilter('Laptop')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          adminCategoryFilter === 'Laptop'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Laptop
                      </button>
                      <button
                        onClick={() => setAdminCategoryFilter('PC Workshop')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          adminCategoryFilter === 'PC Workshop'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        PC Workshop
                      </button>
                      <button
                        onClick={() => setAdminCategoryFilter('Peralatan')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          adminCategoryFilter === 'Peralatan'
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Peralatan
                      </button>
                      {customCategories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setAdminCategoryFilter(c)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            adminCategoryFilter === c
                              ? 'bg-blue-600 text-white font-semibold shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        placeholder="Cari kode/nama..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-3">Kode</th>
                        <th className="py-3 px-3">Nama Barang</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-3">Ketersediaan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminFilteredItems.map((b) => {
                        const isPC = b.kategori === 'PC Workshop' || b.kategori === 'Ruangan Workshop RPL' || b.kode_barang.toUpperCase().startsWith('PC');
                        const isLaptop = b.kategori === 'Laptop' || b.kode_barang.toUpperCase().startsWith('RPL');

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                              {b.kode_barang}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                  {isLaptop && <img src="/laptop.png" alt="Laptop" className="w-full h-full object-contain" />}
                                  {isPC && <img src="/pc.jpg" alt="PC" className="w-full h-full object-cover" />}
                                  {!isLaptop && !isPC && <Wrench className="w-4 h-4 text-amber-600" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{b.nama_barang}</p>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">{b.spesifikasi || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  isLaptop
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : isPC
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {isPC ? 'PC Workshop' : b.kategori}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">
                                {b.jumlah_tersedia} / {b.jumlah_total}
                              </span>{' '}
                              <span className="text-slate-500 text-[11px]">{b.satuan}</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  b.status === 'tersedia'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : b.status === 'dipinjam'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleStartEdit(b)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                                  title="Edit data barang"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAdminResetStatus(b.id, b.nama_barang)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                                  title="Reset status jadi tersedia"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBarang(b)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                                  title="Hapus barang"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION: PENGATURAN PIN */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Ubah PIN Akses Sistem</span>
                </h3>
                <form onSubmit={handleAdminUpdatePin} className="space-y-3 text-xs max-w-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">PIN Kios Baru:</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={newPinKiosk}
                        onChange={(e) => setNewPinKiosk(e.target.value)}
                        placeholder="PIN baru..."
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">PIN Admin Baru:</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={newPinAdmin}
                        onChange={(e) => setNewPinAdmin(e.target.value)}
                        placeholder="PIN baru..."
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold cursor-pointer shadow-xs transition-all"
                  >
                    Simpan Perubahan PIN
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH BARANG BARU (ADMIN)                         */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Tambah Sarpras Baru ke Database</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminTambahBarang} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kategori Sarpras:</label>
                <select
                  value={isNewCustomCategory ? '__NEW__' : newBarangCategory}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsNewCustomCategory(true);
                    } else {
                      setIsNewCustomCategory(false);
                      setNewBarangCategory(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Laptop">Laptop RPL</option>
                  <option value="PC Workshop">Ruangan Workshop RPL (PC)</option>
                  <option value="Peralatan">Peralatan Lab</option>
                  {customCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__NEW__">+ Tambah Kategori Baru...</option>
                </select>
                {isNewCustomCategory && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Ketik nama kategori baru (misal: ATK, Bahan Praktik)..."
                      className="w-full p-2.5 rounded-xl bg-amber-50/50 border border-amber-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kode Barang:</label>
                  <input
                    type="text"
                    value={newBarangKode}
                    onChange={(e) => setNewBarangKode(e.target.value)}
                    placeholder="Contoh: RPL09 / PC08 / ALAT10"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jumlah Unit:</label>
                  <input
                    type="number"
                    min={1}
                    value={newBarangJumlah}
                    onChange={(e) => setNewBarangJumlah(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Nama Sarpras:</label>
                  <input
                    type="text"
                    value={newBarangNama}
                    onChange={(e) => setNewBarangNama(e.target.value)}
                    placeholder="Contoh: Laptop RPL 09 / Tang Crimping Pro"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Satuan:</label>
                  <input
                    type="text"
                    value={newBarangSatuan}
                    onChange={(e) => setNewBarangSatuan(e.target.value)}
                    placeholder="Unit / Pcs / Set"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Spesifikasi / Kelengkapan:</label>
                <textarea
                  rows={2}
                  value={newBarangSpecs}
                  onChange={(e) => setNewBarangSpecs(e.target.value)}
                  placeholder="Spesifikasi teknis, tas, charger, dus, kelengkapan..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Barang Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT DATA BARANG (ADMIN CRUD)                      */}
      {/* ========================================================= */}
      {editingBarang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Edit Master Barang
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{editingBarang.nama_barang}</h3>
              </div>
              <button
                onClick={() => setEditingBarang(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kode Barang:</label>
                  <input
                    type="text"
                    value={editKode}
                    onChange={(e) => setEditKode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori:</label>
                  <select
                    value={editIsCustomCategory ? '__NEW__' : editKategori}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setEditIsCustomCategory(true);
                      } else {
                        setEditIsCustomCategory(false);
                        setEditKategori(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Laptop">Laptop RPL</option>
                    <option value="PC Workshop">PC Workshop</option>
                    <option value="Peralatan">Peralatan Lab</option>
                    {customCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__NEW__">+ Tambah Kategori Baru...</option>
                  </select>
                  {editIsCustomCategory && (
                    <div className="mt-2 animate-in fade-in">
                      <input
                        type="text"
                        value={editCustomCategoryName}
                        onChange={(e) => setEditCustomCategoryName(e.target.value)}
                        placeholder="Ketik nama kategori baru..."
                        className="w-full p-2.5 rounded-xl bg-amber-50/50 border border-amber-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Barang:</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jumlah Total:</label>
                  <input
                    type="number"
                    min={1}
                    value={editJumlahTotal}
                    onChange={(e) => setEditJumlahTotal(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Satuan:</label>
                  <input
                    type="text"
                    value={editSatuan}
                    onChange={(e) => setEditSatuan(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status:</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="tersedia">Tersedia</option>
                    <option value="dipinjam">Dipinjam</option>
                    <option value="perbaikan">Perbaikan</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Spesifikasi / Kelengkapan:</label>
                <textarea
                  rows={2}
                  value={editSpesifikasi}
                  onChange={(e) => setEditSpesifikasi(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kondisi Terakhir:</label>
                <input
                  type="text"
                  value={editKondisi}
                  onChange={(e) => setEditKondisi(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingBarang(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PINJAM SARPRAS / WORKSTATION (EXCLUSIVE CHOICE)    */}
      {/* ========================================================= */}
      {loanModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header with real picture */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                {(loanModalItem.kategori === 'Laptop' || loanModalItem.kode_barang.toUpperCase().startsWith('RPL')) && (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img src="/laptop.png" alt="Laptop" className="w-full h-full object-contain" />
                  </div>
                )}
                {(loanModalItem.kategori === 'PC Workshop' || loanModalItem.kategori === 'Ruangan Workshop RPL' || loanModalItem.kode_barang.toUpperCase().startsWith('PC')) && (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                    <img src="/pc.jpg" alt="PC" className="w-full h-full object-cover" />
                  </div>
                )}
                {loanModalItem.kategori === 'Peralatan' && (
                  <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <Wrench className="w-6 h-6" />
                  </div>
                )}
                {!['Laptop', 'PC Workshop', 'Ruangan Workshop RPL', 'Peralatan'].includes(loanModalItem.kategori) && !loanModalItem.kode_barang.toUpperCase().startsWith('RPL') && !loanModalItem.kode_barang.toUpperCase().startsWith('PC') && (
                  <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {loanModalItem.kategori === 'PC Workshop' ? 'Ruangan Workshop RPL' : loanModalItem.kategori}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{loanModalItem.nama_barang}</h3>
                  <p className="text-xs text-slate-500 font-mono">{loanModalItem.kode_barang}</p>
                </div>
              </div>
              <button
                onClick={() => setLoanModalItem(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePinjamSubmit} className="space-y-4 text-xs">
              {/* MUTUALLY EXCLUSIVE BORROWER CHOICE: Data Siswa vs Manual (Guru/Tamu) */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-semibold">Tipe Peminjam:</label>
                <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setBorrowerType('siswa');
                      setManualName('');
                      setManualRole('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                      borrowerType === 'siswa'
                        ? 'bg-white text-blue-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Data Siswa (Database)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBorrowerType('manual');
                      setSelectedStudent(null);
                      setSearchStudentInput('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                      borrowerType === 'manual'
                        ? 'bg-white text-blue-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>Manual (Guru / Tamu / Staf)</span>
                  </button>
                </div>
              </div>

              {/* OPTION 1: DATA SISWA (Search & Autocomplete only) */}
              {borrowerType === 'siswa' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
                  <label className="block text-slate-700 font-medium">
                    Cari Siswa Peminjam (Nama / NISN):
                  </label>

                  {!selectedStudent ? (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchStudentInput}
                        onChange={(e) => setSearchStudentInput(e.target.value)}
                        placeholder="Ketik minimal 2 huruf nama siswa..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                      />

                      {/* Autocomplete Dropdown */}
                      {studentSearchResults.length > 0 && (
                        <div className="mt-1 p-1 rounded-xl bg-white border border-slate-200 max-h-44 overflow-y-auto space-y-1 shadow-lg">
                          {studentSearchResults.map((s) => (
                            <div
                              key={s.id_siswa}
                              onClick={() => {
                                setSelectedStudent(s);
                                setSearchStudentInput('');
                                setStudentSearchResults([]);
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-semibold text-slate-900">{s.nama_lengkap}</p>
                                <p className="text-[10px] text-slate-500">
                                  {s.kelas} &bull; NISN: {s.nisn}
                                </p>
                              </div>
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white border border-blue-200 flex items-center justify-between shadow-xs">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedStudent.nama_lengkap}</p>
                        <p className="text-[11px] text-slate-600">
                          Kelas: <span className="font-semibold text-blue-700">{selectedStudent.kelas}</span> &bull; NISN: {selectedStudent.nisn}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null);
                          setSearchStudentInput('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
                      >
                        Ganti Siswa
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* OPTION 2: MANUAL INPUT (For Guru, Tamu, Staf) */}
              {borrowerType === 'manual' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Nama Lengkap Guru / Tamu:
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Contoh: Budi Santoso, S.Kom / Penguji Eksternal"
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-medium">
                        Jabatan / Keterangan:
                      </label>
                      <span className="text-[10px] text-slate-400">Pilih cepat:</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      {['Guru RPL', 'Guru Mapel', 'Tamu / Penguji', 'Staf TU'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setManualRole(role)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] border transition-all cursor-pointer ${
                            manualRole === role
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={manualRole}
                      onChange={(e) => setManualRole(e.target.value)}
                      placeholder="Contoh: Guru Produktif RPL / Tamu Industri"
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Quantity Stepper for Peralatan & Multi-Stock Items */}
              {(loanModalItem.kategori === 'Peralatan' || loanModalItem.jumlah_tersedia > 1) && (
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-medium">
                    Jumlah yang Dipinjam (Maks: {loanModalItem.jumlah_tersedia} {loanModalItem.satuan}):
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEquipmentQty((prev) => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer border border-slate-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-base font-bold text-slate-900 min-w-8 text-center">
                      {equipmentQty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEquipmentQty((prev) => Math.min(loanModalItem.jumlah_tersedia, prev + 1))
                      }
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer border border-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-slate-500 text-xs">{loanModalItem.satuan}</span>
                  </div>
                </div>
              )}

              {/* Keperluan / Kebutuhan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-medium">Keperluan / Kebutuhan:</label>
                  <span className="text-[10px] text-slate-400">Pilih cepat:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Praktikum Lab RPL', 'Mengajar di Kelas', 'Ujian / Asesmen', 'Kegiatan Sekolah'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurposeInput(p)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] border transition-all cursor-pointer ${
                        purposeInput === p
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={purposeInput}
                  onChange={(e) => setPurposeInput(e.target.value)}
                  placeholder="Contoh: Praktik Pemrograman Web / Mengajar di Kelas"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              {/* Kondisi Pinjam (Only for Laptop or Peralatan, Hidden for Workshop PC) */}
              {!(loanModalItem.kategori === 'PC Workshop' || loanModalItem.kategori === 'Ruangan Workshop RPL' || loanModalItem.kode_barang.toUpperCase().startsWith('PC')) && (
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-medium">Kondisi Barang Saat Ini:</label>
                  <select
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xs"
                  >
                    <option value="Normal (Tas, Charger dan Laptop)">Normal Lengkap (Tas, Charger dan Laptop)</option>
                    <option value="Normal Lengkap">Normal Lengkap</option>
                    <option value="Normal Baik">Normal Baik</option>
                    <option value="Normal (Tanpa Charger)">Normal (Tanpa Charger)</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLoanModalItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Menyimpan...' : 'Konfirmasi Peminjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KEMBALIKAN SARPRAS / SUDAHI PC                     */}
      {/* ========================================================= */}
      {returnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                {(returnModalItem.kategori === 'Laptop' || returnModalItem.kode_barang.toUpperCase().startsWith('RPL')) && (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img src="/laptop.png" alt="Laptop" className="w-full h-full object-contain" />
                  </div>
                )}
                {(returnModalItem.kategori === 'PC Workshop' || returnModalItem.kategori === 'Ruangan Workshop RPL' || returnModalItem.kode_barang.toUpperCase().startsWith('PC')) && (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                    <img src="/pc.jpg" alt="PC" className="w-full h-full object-cover" />
                  </div>
                )}
                {returnModalItem.kategori === 'Peralatan' && (
                  <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <Wrench className="w-6 h-6" />
                  </div>
                )}
                {!['Laptop', 'PC Workshop', 'Ruangan Workshop RPL', 'Peralatan'].includes(returnModalItem.kategori) && !returnModalItem.kode_barang.toUpperCase().startsWith('RPL') && !returnModalItem.kode_barang.toUpperCase().startsWith('PC') && (
                  <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {returnModalItem.kategori === 'PC Workshop' || returnModalItem.kategori === 'Ruangan Workshop RPL' || returnModalItem.kode_barang.toUpperCase().startsWith('PC')
                      ? 'Sudahi Pemakaian PC'
                      : 'Pengembalian Sarpras'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{returnModalItem.nama_barang}</h3>
                  <p className="text-xs text-slate-500 font-mono">{returnModalItem.kode_barang}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalItem(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleKembaliSubmit} className="space-y-4 text-xs">
              {/* Borrower Info Card */}
              {(returnLoanDetails || returnModalItem.active_loan) && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                    <span>Data Peminjam:</span>
                    {(returnLoanDetails?.kode_peminjaman || returnModalItem.active_loan?.kode_peminjaman) && (
                      <span className="font-mono">
                        {returnLoanDetails?.kode_peminjaman || returnModalItem.active_loan?.kode_peminjaman}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 text-sm">
                    {returnLoanDetails?.nama_siswa || returnModalItem.active_loan?.nama_siswa}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Kelas/Jabatan: <span className="font-semibold text-slate-800">{returnLoanDetails?.kelas || returnModalItem.active_loan?.kelas}</span>
                    {returnLoanDetails?.jumlah && returnLoanDetails.jumlah > 1 && (
                      <span className="ml-2 font-mono font-bold text-blue-700">({returnLoanDetails.jumlah} {returnModalItem.satuan})</span>
                    )}
                    {' '}&bull; Durasi:{' '}
                    <span className="text-blue-700 font-mono font-semibold">
                      {returnLoanDetails?.durasi_sekarang || returnModalItem.active_loan?.durasi_sekarang || '-'}
                    </span>
                  </p>
                  {(returnLoanDetails?.kebutuhan || returnModalItem.active_loan?.kebutuhan) && (
                    <p className="text-slate-500 text-[11px] italic">
                      Keperluan: &ldquo;{returnLoanDetails?.kebutuhan || returnModalItem.active_loan?.kebutuhan}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Kondisi Pengembalian (Laptop & Peralatan only) */}
              {!(returnModalItem.kategori === 'PC Workshop' || returnModalItem.kategori === 'Ruangan Workshop RPL' || returnModalItem.kode_barang.toUpperCase().startsWith('PC')) && (
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-medium">Kondisi Pengembalian:</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xs"
                  >
                    <option value="Normal Lengkap (Tas, Charger dan Laptop)">
                      Normal Lengkap (Tas, Charger dan Laptop)
                    </option>
                    <option value="Normal Lengkap">Normal Lengkap</option>
                    <option value="Normal (Tanpa Charger)">Normal (Tanpa Charger)</option>
                    <option value="Ada Kendala / Kerusakan">Ada Kendala / Kerusakan</option>
                  </select>
                </div>
              )}

              {/* Catatan opsional */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-medium">Catatan (Opsional):</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Catatan tambahan saat pengembalian..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {actionLoading
                    ? 'Memproses...'
                    : (returnModalItem.kategori === 'PC Workshop' || returnModalItem.kategori === 'Ruangan Workshop RPL' || returnModalItem.kode_barang.toUpperCase().startsWith('PC'))
                    ? 'Sudahi Pemakaian'
                    : 'Kembalikan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
