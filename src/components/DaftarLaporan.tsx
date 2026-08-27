import { useState } from 'react';
import { Laporan, User, JenisKegiatan } from '../types';
import { Search, Filter, Calendar, MapPin, User as UserIcon, Plus, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { sortPelaksanaDinas } from '../lib/utils';

interface DaftarLaporanProps {
  laporanList: Laporan[];
  allUsers: User[];
  jenisKegiatanList: JenisKegiatan[];
  currentUser: User;
  onSelectLaporan: (laporan: Laporan) => void;
  onCreateNew: () => void;
  onDeleteLaporan?: (id: string) => void;
}

export default function DaftarLaporan({
  laporanList,
  allUsers,
  jenisKegiatanList,
  currentUser,
  onSelectLaporan,
  onCreateNew,
  onDeleteLaporan,
}: DaftarLaporanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Filter based on user role permission rules (creator or team member / pelaksana)
  const accessibleReports = currentUser.role === 'user'
    ? laporanList.filter(l => l.user_id === currentUser.id || l.pelaksana_ids.includes(currentUser.id))
    : laporanList;

  // Apply filters and searches
  const filteredReports = accessibleReports.filter((lpd) => {
    const matchesSearch = 
      (lpd.nomor_surat_tugas?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lpd.tempat_kegiatan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      lpd.pelaksana_ids.some(id => 
        allUsers.find(u => u.id === id)?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      allUsers.find(u => u.id === lpd.user_id)?.nama?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lpd.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const getProgramName = (id: string) => {
    return jenisKegiatanList.find(jk => jk.id === id)?.nama_kegiatan || 'Lainnya';
  };

  const getOwnerName = (id: string) => {
    return allUsers.find(u => u.id === id)?.nama || 'Staf';
  };

  const getPelaksanaNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return 'Tidak ada';
    const users = ids.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    const sortedUsers = sortPelaksanaDinas(users);
    const names = sortedUsers.map(u => u.nama);
    if (names.length === 0) return 'Staf';
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} dan ${names.length - 2} lainnya`;
  };

  const getStatusBadge = (status: Laporan['status']) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Disetujui ✓</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">Menunggu Verif</span>;
      case 'verified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">Terverifikasi</span>;
      case 'revision':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Perlu Revisi</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">Ditolak</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">Draft</span>;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Menunggu Verifikasi' },
    { value: 'verified', label: 'Terverifikasi (Menunggu Validasi)' },
    { value: 'approved', label: 'Disetujui / Selesai' },
    { value: 'revision', label: 'Perlu Revisi' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Title Header */}
      <div className="border-b border-[#22293f] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Daftar Dokumen LPD</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {currentUser.role === 'user' ? 'Koleksi dokumen perjalanan dinas pribadi Anda' : 'Seluruh dokumen perjalanan dinas BPHL XI'}
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg hover:shadow-amber-500/5 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          LPD Baru
        </button>
      </div>

      {/* Modern Search and Filters Row */}
      <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-inner">
        
        {/* Search */}
        <div className="relative flex-1 text-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan tempat, nomor surat tugas, atau staf..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>

      </div>

      {/* Grid listing */}
      {filteredReports.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-[#101426] border border-[#1e233d] rounded-2xl">
          Tidak ditemukan dokumen LPD yang cocok dengan filter pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((lpd) => {
            const programName = getProgramName(lpd.jenis_kegiatan_id);
            const authorName = getOwnerName(lpd.user_id);
            return (
              <div 
                key={lpd.id}
                className="bg-[#101426] border border-[#1e233d] hover:border-[#2b335a] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-2.5 border-b border-[#22293f] pb-2">
                    <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      {programName}
                    </span>
                    {getStatusBadge(lpd.status)}
                  </div>

                  {/* Travel details overview text */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-mono font-medium truncate">
                      ST: {lpd.nomor_surat_tugas || <span className="italic text-slate-600">[Belum diisi]</span>}
                    </p>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      Pelaksana: <span className="text-slate-200 font-semibold">{getPelaksanaNames(lpd.pelaksana_ids)}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-400 font-sans">
                    <div className="flex items-start gap-1.5 leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{lpd.tempat_kegiatan}</span>
                    </div>
                    <div className="flex items-center gap-1.5 leading-none">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono text-[10px]">
                        {new Date(lpd.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} s.d.{' '}
                        {new Date(lpd.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center bg-[#101426]">
                  <span className="text-[9px] text-slate-500 font-mono">
                    Diinput: {new Date(lpd.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {currentUser.role === 'admin' && onDeleteLaporan && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLaporan(lpd.id);
                        }}
                        title="Hapus LPD (Admin)"
                        className="p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded transition-all focus:outline-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectLaporan(lpd)}
                      className="px-3 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/20 text-amber-500 hover:text-amber-400 text-[11px] font-bold tracking-wide rounded transition-all focus:outline-none cursor-pointer"
                    >
                      Buka Laporan
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
