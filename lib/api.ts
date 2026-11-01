/**
 * Sarpras API Client & Types
 * Connects directly to sakuci_express backend at https://exs.sakuci.id/sarpras
 */

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('smksangkuriang1cimahi.sch.id')) {
    return 'https://eks.smksangkuriang1cimahi.sch.id/sarpras';
  }
  return 'https://exs.sakuci.id/sarpras';
}

export const API_BASE_URL = 'https://exs.sakuci.id/sarpras';

export interface ActiveLoan {
  id: number;
  kode_peminjaman: string;
  nama_siswa: string;
  nisn: string | null;
  kelas: string;
  jumlah: number;
  kebutuhan: string;
  kondisi_pinjam: string;
  waktu_pinjam: string;
  waktu_pinjam_formatted: string;
  durasi_sekarang: string;
}

export interface BarangItem {
  id: number;
  kode_barang: string;
  nama_barang: string;
  kategori: 'Laptop' | 'PC Workshop' | 'Ruangan Workshop RPL' | 'Peralatan' | string;
  spesifikasi: string | null;
  jumlah_total: number;
  jumlah_tersedia: number;
  satuan: string;
  status: 'tersedia' | 'dipinjam' | 'perbaikan' | 'rusak';
  kondisi_terakhir: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  active_loan?: ActiveLoan | null;
  active_loans?: ActiveLoan[];
  peminjam?: any;
  peminjam_list?: any[];
  unit_dipinjam?: number;
}

export interface SarprasStats {
  total: number;
  tersedia: number;
  dipinjam: number;
  rusak: number;
}

export interface SarprasStatsPeralatan {
  total_jenis: number;
  total_unit: number;
  tersedia_unit: number;
  dipinjam_unit: number;
}

export interface BarangResponseData {
  today_loans_count?: number;
  stats: SarprasStats;
  stats_laptop: SarprasStats;
  stats_pc: SarprasStats;
  stats_peralatan: SarprasStatsPeralatan;
  barang: BarangItem[];
  kategori_list: string[];
}

export interface SiswaPPDB {
  id_siswa: string;
  nama_lengkap: string;
  nisn: string;
  kelas: string;
  tingkat: string;
  nama_kelas: string;
  has_active_pinjam: boolean;
  active_kode_barang: string | null;
  active_nama_barang: string | null;
}

export interface RiwayatItem {
  id: number;
  kode_peminjaman: string;
  id_siswa: string;
  nama_siswa: string;
  nisn: string | null;
  kelas: string;
  barang_id: number;
  kode_barang: string;
  nama_barang: string;
  kategori?: string;
  jumlah: number;
  satuan?: string;
  kebutuhan: string;
  kondisi_pinjam: string;
  waktu_pinjam: string;
  waktu_pinjam_format?: string;
  waktu_pinjam_formatted: string;
  waktu_kembali: string | null;
  waktu_kembali_format?: string | null;
  waktu_kembali_formatted: string | null;
  kondisi_kembali: string | null;
  catatan_kembali: string | null;
  status: 'dipinjam' | 'dikembalikan' | 'dibatalkan';
  durasi: string;
  barang?: {
    id: number;
    kategori: string;
    satuan: string;
  };
}

export interface RiwayatResponseData {
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  today_count?: number;
  riwayat: RiwayatItem[];
}

// ==========================================
// API CLIENT CALLS
// ==========================================

export async function fetchBarang(): Promise<BarangResponseData> {
  const res = await fetch(`${getApiBaseUrl()}/barang?_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengambil data barang');
  return json.data;
}

export async function searchSiswa(q: string): Promise<SiswaPPDB[]> {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(`${getApiBaseUrl()}/siswa?q=${encodeURIComponent(q.trim())}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mencari data siswa');
  return json.data?.siswa || [];
}

export async function verifyKioskPIN(pin: string): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/verify-kiosk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const json = await res.json();
  return !!json.success;
}

export async function verifyAdminPIN(pin: string): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/verify-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const json = await res.json();
  return !!json.success;
}

export interface PinjamPayload {
  barang_id: number;
  id_siswa?: string;
  nama_siswa: string;
  nisn?: string;
  kelas: string;
  jumlah?: number;
  kebutuhan: string;
  kondisi_pinjam?: string;
  catatan_pinjam?: string;
}

export async function pinjamBarang(payload: PinjamPayload) {
  const res = await fetch(`${getApiBaseUrl()}/pinjam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memproses peminjaman');
  return json.data;
}

export interface KembaliPayload {
  peminjaman_id?: number;
  barang_id?: number;
  kondisi_kembali?: string;
  catatan_kembali?: string;
}

export async function kembaliBarang(payload: KembaliPayload) {
  const res = await fetch(`${getApiBaseUrl()}/kembali`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memproses pengembalian');
  return json.data;
}

export async function fetchRiwayat(params?: {
  page?: number;
  limit?: number;
  periode?: string;
  status?: string;
  kategori?: string;
  q?: string;
}): Promise<RiwayatResponseData> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  searchParams.set('periode', params?.periode || 'hari_ini');
  if (params?.status && params.status !== 'semua') searchParams.set('status', params.status);
  if (params?.kategori && params.kategori !== 'semua') searchParams.set('kategori', params.kategori);
  if (params?.q) searchParams.set('q', params.q);

  const res = await fetch(`${getApiBaseUrl()}/riwayat?${searchParams.toString()}&_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat riwayat');
  return json.data;
}

export async function submitAdminAction(payload: {
  pin_admin?: string;
  pin?: string;
  action: string;
  [key: string]: any;
}) {
  const pinValue = payload.pin_admin || payload.pin;
  const res = await fetch(`${getApiBaseUrl()}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      pin: pinValue,
      pin_admin: pinValue,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Aksi admin gagal');
  return json;
}

export interface NetworkTraffic {
  upload_bps: number;
  download_bps: number;
  upload_fmt: string;
  download_fmt: string;
}

export interface InterfaceTrafficItem {
  name: string;
  role: string;
  rx_bps: number;
  tx_bps: number;
  rx_fmt: string;
  tx_fmt: string;
  rx_pps: number;
  tx_pps: number;
  status?: 'online' | 'offline';
  status_label?: string;
  total_download?: string;
  total_upload?: string;
}

export interface NetworkInterfaceCard {
  interface_name: string;
  status: 'online' | 'offline';
  status_label: string;
  download_bps: number;
  upload_bps: number;
  download_fmt: string;
  upload_fmt: string;
  total_download: string;
  total_upload: string;
  total_download_bytes: number;
  total_upload_bytes: number;
  device_online: number;
  rx_pps?: number;
  tx_pps?: number;
}

export interface NetworkUsage {
  upload_bytes: number;
  download_bytes: number;
  upload_fmt: string;
  download_fmt: string;
  total_fmt: string;
}

export interface NetworkGroupStats {
  traffic: NetworkTraffic;
  usage: NetworkUsage;
  max_limit: string;
}

export interface NetworkStatsData {
  success: boolean;
  timestamp: string;
  router: {
    identity: string;
    model: string;
    version: string;
    cpu_load: string;
    uptime: string;
    free_memory: string;
  };
  users: {
    guru_online: number;
    siswa_online: number;
    total_online: number;
  };
  interfaces?: {
    siswa?: NetworkInterfaceCard;
    guru?: NetworkInterfaceCard;
    ether1_indibiz?: InterfaceTrafficItem;
    ether2_difusi?: InterfaceTrafficItem;
  };
  bandwidth: {
    total: NetworkGroupStats;
    siswa: NetworkGroupStats;
    guru: NetworkGroupStats;
  };
}

export async function fetchNetworkStats(): Promise<NetworkStatsData> {
  const res = await fetch(`${getApiBaseUrl()}/network-stats?_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat statistik jaringan');
  return json;
}

export async function syncGoogleSheet(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/sync-sheet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal sinkronisasi ke Spreadsheet');
  return json;
}

// ==========================================
// PUSAT DATA RPL (KELAS 10, 11, 12)
// ==========================================

export interface RplSiswaItem {
  id_siswa: string;
  nama_lengkap: string;
  nisn: string;
  jenkel: string;
  tingkat: string;
  nama_kelas: string;
  no_hp: string;
  alamat: string;
  status: string;
}

export interface RplAbsenItem {
  id_absen: string;
  id_siswa: string;
  nama_lengkap: string;
  nisn: string;
  tingkat: string;
  nama_kelas: string;
  status_label: string;
  kode_status: string;
  tanggal: string;
  created_at: string;
}

export interface RplAbsenSummary {
  total_tercatat: number;
  hadir: number;
  sakit: number;
  izin: number;
  dispen: number;
  alfa: number;
}

export interface RplSummaryData {
  total_siswa: number;
  kelas_10: number;
  kelas_11: number;
  kelas_12: number;
  classes: Array<{
    tingkat: string;
    nama_kelas: string;
    total: number;
  }>;
}

export async function fetchRplSiswa(params?: {
  tingkat?: string;
  kelas?: string;
  q?: string;
}): Promise<{ total: number; data: RplSiswaItem[] }> {
  const query = new URLSearchParams();
  if (params?.tingkat && params.tingkat !== 'all') query.set('tingkat', params.tingkat);
  if (params?.kelas && params.kelas !== 'all') query.set('kelas', params.kelas);
  if (params?.q) query.set('q', params.q);

  const res = await fetch(`${getApiBaseUrl()}/rpl/siswa?${query.toString()}&_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data siswa RPL');
  return { total: json.total, data: json.data || [] };
}

export async function fetchRplAbsen(params?: {
  tingkat?: string;
  kelas?: string;
  tanggal?: string;
}): Promise<{
  total: number;
  summary: RplAbsenSummary;
  data: RplAbsenItem[];
}> {
  const query = new URLSearchParams();
  if (params?.tingkat && params.tingkat !== 'all') query.set('tingkat', params.tingkat);
  if (params?.kelas && params.kelas !== 'all') query.set('kelas', params.kelas);
  if (params?.tanggal) query.set('tanggal', params.tanggal);

  const res = await fetch(`${getApiBaseUrl()}/rpl/absen?${query.toString()}&_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data absensi RPL');
  return {
    total: json.total,
    summary: json.summary || { total_tercatat: 0, hadir: 0, sakit: 0, izin: 0, dispen: 0, alfa: 0 },
    data: json.data || [],
  };
}

export async function fetchRplSummary(): Promise<RplSummaryData> {
  const res = await fetch(`${getApiBaseUrl()}/rpl/summary?_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat ringkasan RPL');
  return json.data;
}

// ==========================================
// FITUR SISWA ABSEN KELAS (3 SISWA PER KELAS BERGANTIAN)
// ==========================================

export type SiswaAbsenStatus = 'tanpa_keterangan' | 'sakit' | 'izin' | 'dispen' | 'terlambat' | 'hadir';

export interface SiswaAbsenRosterStudent {
  id_siswa: string;
  nama_lengkap: string;
  nisn: string;
  jenkel: string;
  tingkat: string;
  nama_kelas: string;
  status: SiswaAbsenStatus;
  nama_petugas?: string | null;
  catatan?: string;
}

export interface SiswaAbsenRecord {
  id_siswa_absen: number;
  id_siswa: string;
  nisn: string;
  nama_siswa: string;
  tingkat: string;
  nama_kelas: string;
  tanggal: string;
  status: SiswaAbsenStatus;
  nama_petugas: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiswaAbsenSummary {
  total_tidak_hadir: number;
  tanpa_keterangan: number;
  sakit: number;
  izin: number;
  dispen: number;
  terlambat: number;
}

export interface SiswaAbsenPinItem {
  id: number;
  tingkat: string;
  nama_kelas: string;
  pin: string;
  petugas_list: string | null;
  updated_at: string;
}

export async function verifySiswaAbsenPin(payload: {
  tingkat: string;
  nama_kelas: string;
  pin: string;
}): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/siswa-absen/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'PIN Kelas tidak sah');
  return true;
}

export async function fetchSiswaAbsenRoster(params: {
  tingkat: string;
  nama_kelas: string;
  tanggal?: string;
}): Promise<{
  tanggal: string;
  tingkat: string;
  nama_kelas: string;
  total_siswa: number;
  data: SiswaAbsenRosterStudent[];
}> {
  const query = new URLSearchParams();
  query.set('tingkat', params.tingkat);
  query.set('nama_kelas', params.nama_kelas);
  if (params.tanggal) query.set('tanggal', params.tanggal);

  const res = await fetch(`${getApiBaseUrl()}/siswa-absen/roster?${query.toString()}&_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar siswa kelas');
  return json;
}

export async function saveSiswaAbsen(payload: {
  tingkat: string;
  nama_kelas: string;
  pin: string;
  tanggal: string;
  nama_petugas: string;
  entries: Array<{
    id_siswa: string;
    nisn?: string;
    nama_siswa: string;
    status: SiswaAbsenStatus;
    catatan?: string;
  }>;
}): Promise<{ success: boolean; message: string; savedCount: number; clearedCount: number }> {
  const res = await fetch(`${getApiBaseUrl()}/siswa-absen/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyimpan absensi');
  return json;
}

export async function fetchSiswaAbsenList(params?: {
  tingkat?: string;
  nama_kelas?: string;
  tanggal?: string;
  status?: string;
}): Promise<{
  total: number;
  summary: SiswaAbsenSummary;
  data: SiswaAbsenRecord[];
}> {
  const query = new URLSearchParams();
  if (params?.tingkat && params.tingkat !== 'all') query.set('tingkat', params.tingkat);
  if (params?.nama_kelas && params.nama_kelas !== 'all') query.set('nama_kelas', params.nama_kelas);
  if (params?.tanggal) query.set('tanggal', params.tanggal);
  if (params?.status && params.status !== 'all') query.set('status', params.status);

  const res = await fetch(`${getApiBaseUrl()}/siswa-absen/list?${query.toString()}&_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat rekap absen siswa');
  return {
    total: json.total || 0,
    summary: json.summary || {
      total_tidak_hadir: 0,
      tanpa_keterangan: 0,
      sakit: 0,
      izin: 0,
      dispen: 0,
      terlambat: 0,
    },
    data: json.data || [],
  };
}

export async function fetchSiswaAbsenPinList(): Promise<SiswaAbsenPinItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/siswa-absen/pin-list?_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar PIN kelas');
  return json.data || [];
}

// ==========================================
// TIMELINE & DOKUMENTASI & ROLE VERIFICATION
// ==========================================

export interface RplTimelineItem {
  id: number;
  nama_kegiatan: string;
  tanggal: string | null;
  status?: 'belum_dimulai' | 'sedang_berlangsung' | 'selesai';
  selesai: number;
  kategori: string;
  keterangan: string | null;
  kelas?: '10' | '11' | '12' | 'all' | string;
  updated_at: string;
}

export interface RplDokumentasiItem {
  id: number;
  judul: string;
  deskripsi: string | null;
  foto_url: string;
  foto?: string;
  tanggal: string | null;
  urutan: number;
  updated_at: string;
}

export async function verifyRole(credentials: string | { username?: string; password?: string; pin?: string }): Promise<{
  success: boolean;
  role: 'admin' | 'sarpras';
  username?: string;
  pin?: string;
  message: string;
}> {
  const payload = typeof credentials === 'string' ? { pin: credentials } : credentials;
  const res = await fetch(`${getApiBaseUrl()}/verify-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Verifikasi login gagal');
  return json;
}

export async function fetchTimeline(): Promise<RplTimelineItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/timeline?_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat timeline');
  return json.data || [];
}

export async function submitTimelineAction(payload: {
  pin: string;
  action: 'add' | 'toggle_selesai' | 'update' | 'delete' | string;
  [key: string]: any;
}): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/timeline/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Aksi timeline gagal');
  return json;
}

export async function fetchDokumentasi(): Promise<RplDokumentasiItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/dokumentasi?_t=${Date.now()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat dokumentasi');
  return json.data || [];
}

export async function submitDokumentasiAction(payload: {
  pin: string;
  action: 'add' | 'update' | 'delete' | string;
  [key: string]: any;
}): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/kegiatan/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `Gagal memproses dokumentasi (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) msg = parsed.message;
    } catch {}
    throw new Error(msg);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Aksi dokumentasi gagal');
  return json;
}

export async function uploadKegiatanPhoto(formData: FormData): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/kegiatan/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `Gagal mengunggah foto (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) msg = parsed.message;
    } catch {}
    throw new Error(msg);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengunggah foto kegiatan');
  return json;
}






