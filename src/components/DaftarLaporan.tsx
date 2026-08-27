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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold font-mono tracking-wider uppercase bg-[#0fa336]/10 text-[#0fa336] border border-[#0fa336]/30">DISETUJUI ✓</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold font-mono tracking-wider uppercase bg-[#0066b1]/10 text-[#0066b1] border border-[#0066b1]/30">MENUNGGU VERIF</span>;
      case 'verified':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold font-mono tracking-wider uppercase bg-[#1c69d4]/10 text-[#1c69d4] border border-[#1c69d4]/30">TERVERIFIKASI</span>;
      case 'revision':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold font-mono tracking-wider uppercase bg-[#f4b400]/10 text-[#f4b400] border border-[#f4b400]/30">PERLU REVISI</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold font-mono tracking-wider uppercase bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/30">DITOLAK</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold font-mono tracking-wider uppercase bg-[#0d0d0d] text-[#bbbbbb] border border-[#3c3c3c]">DRAFT</span>;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'SEMUA STATUS' },
    { value: 'draft', label: 'DRAFT' },
    { value: 'submitted', label: 'MENUNGGU VERIFIKASI' },
    { value: 'verified', label: 'TERVERIFIKASI (MENUNGGU VALIDASI)' },
    { value: 'approved', label: 'DISETUJUI / SELESAI' },
    { value: 'revision', label: 'PERLU REVISI' },
    { value: 'rejected', label: 'DITOLAK' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Title Header */}
      <div className="border-b border-[#3c3c3c] pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-sans tracking-wide">
            DAFTAR DOKUMEN LPD
          </h2>
          <p className="text-xs text-[#bbbbbb] font-mono mt-1 font-light">
            {currentUser.role === 'user' ? 'Koleksi dokumen perjalanan dinas pribadi Anda' : 'Seluruh dokumen perjalanan dinas BPHL XI Banjarbaru'}
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="bmw-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4 text-[#1c69d4]" />
          LPD BARU
        </button>
      </div>

      {/* Modern Search and Filters Row */}
      <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-2xl">
        
        {/* Search */}
        <div className="relative flex-1 text-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-[#7e7e7e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tempat, nomor surat tugas, atau staf pelaksana..."
            className="bmw-input w-full pl-9 pr-3 py-2 text-white placeholder:text-[#7e7e7e] font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bmw-input py-2 text-white cursor-pointer font-mono font-bold text-xs"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white">{opt.label}</option>
            ))}
          </select>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bmw-input py-2 text-white cursor-pointer font-mono font-bold text-xs"
          >
            <option value="newest" className="bg-[#1a1a1a] text-white">URUTKAN: TERBARU</option>
            <option value="oldest" className="bg-[#1a1a1a] text-white">URUTKAN: TERLAMA</option>
          </select>
        </div>

      </div>

      {/* Grid listing */}
      {filteredReports.length === 0 ? (
        <div className="py-16 text-center text-[#7e7e7e] text-xs font-light bg-[#1a1a1a] border border-[#3c3c3c] rounded-none">
          Tidak ditemukan dokumen LPD yang cocok dengan filter pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReports.map((lpd) => {
            const programName = getProgramName(lpd.jenis_kegiatan_id);
            return (
              <div 
                key={lpd.id}
                className="bg-[#1a1a1a] border border-[#3c3c3c] hover:border-[#1c69d4] rounded-none p-5 flex flex-col justify-between shadow-xl transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#262626] pb-2.5">
                    <span className="text-[10px] font-bold text-white bg-[#0d0d0d] border border-[#3c3c3c] px-2.5 py-0.5 font-mono uppercase tracking-widest">
                      {programName}
                    </span>
                    {getStatusBadge(lpd.status)}
                  </div>

                  {/* Travel details overview text */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-white font-mono font-bold truncate">
                      ST: {lpd.nomor_surat_tugas || <span className="italic text-[#7e7e7e] font-light">[Belum Diisi]</span>}
                    </p>
                    <div className="text-xs text-[#bbbbbb] font-light flex items-center gap-1.5 pt-0.5">
                      <UserIcon className="w-3.5 h-3.5 text-[#1c69d4]" />
                      Pelaksana: <span className="text-white font-semibold">{getPelaksanaNames(lpd.pelaksana_ids)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#bbbbbb] font-sans pt-1">
                    <div className="flex items-start gap-2 leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-[#7e7e7e] shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-white font-medium">{lpd.tempat_kegiatan}</span>
                    </div>
                    <div className="flex items-center gap-2 leading-none">
                      <Calendar className="w-3.5 h-3.5 text-[#7e7e7e] shrink-0" />
                      <span className="font-mono text-[10px] text-[#bbbbbb]">
                        {new Date(lpd.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} s.d.{' '}
                        {new Date(lpd.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 flex justify-between items-center border-t border-[#262626]">
                  <span className="text-[9px] text-[#7e7e7e] font-mono uppercase">
                    INPUT: {new Date(lpd.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {currentUser.role === 'admin' && onDeleteLaporan && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLaporan(lpd.id);
                        }}
                        title="Hapus LPD (Admin)"
                        className="p-1.5 bg-[#e22718]/10 border border-[#e22718]/30 text-[#e22718] hover:bg-[#e22718] hover:text-white rounded-none transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectLaporan(lpd)}
                      className="px-3.5 py-1.5 bg-[#0d0d0d] hover:bg-white hover:text-black border border-[#3c3c3c] text-white text-[10px] font-bold font-mono tracking-widest uppercase transition-all cursor-pointer"
                    >
                      BUKA DOKUMEN
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

