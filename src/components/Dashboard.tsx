import { Laporan, User, JenisKegiatan } from '../types';
import { FileText, CheckCircle2, RefreshCw, AlertCircle, PlusCircle, ArrowRight, TrendingUp } from 'lucide-react';

interface DashboardProps {
  laporanList: Laporan[];
  currentUser: User;
  allUsers: User[];
  jenisKegiatanList: JenisKegiatan[];
  onNavigate: (page: string) => void;
  onSelectLaporan: (laporan: Laporan) => void;
  onCreateNew: () => void;
}

export default function Dashboard({
  laporanList,
  currentUser,
  allUsers,
  jenisKegiatanList,
  onNavigate,
  onSelectLaporan,
  onCreateNew,
}: DashboardProps) {
  // Filtration based on credentials
  const accessibleReports = currentUser.role === 'user'
    ? laporanList.filter(l => l.user_id === currentUser.id || l.pelaksana_ids.includes(currentUser.id))
    : laporanList;

  const totalReportsNum = accessibleReports.length;
  const approvedReports = accessibleReports.filter(l => l.status === 'approved');
  const submittedReports = accessibleReports.filter(l => l.status === 'submitted');
  const verifiedReports = accessibleReports.filter(l => l.status === 'verified');
  const revisionReports = accessibleReports.filter(l => l.status === 'revision' || l.status === 'rejected');
  const draftReports = accessibleReports.filter(l => l.status === 'draft');

  // Count by Jenis Kegiatan
  const statsByActivity = jenisKegiatanList.map(jk => {
    const count = accessibleReports.filter(l => l.jenis_kegiatan_id === jk.id).length;
    return {
      nama: jk.nama_kegiatan,
      count
    };
  }).sort((a, b) => b.count - a.count);

  // Count by User
  const statsByUser = allUsers.map(u => {
    const count = laporanList.filter(l => l.user_id === u.id || l.pelaksana_ids.includes(u.id)).length;
    return {
      nama: u.nama,
      role: u.role,
      count
    };
  }).sort((a, b) => b.count - a.count);

  const getStatusBadge = (status: Laporan['status']) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest bg-[#0fa336]/10 text-[#0fa336] border border-[#0fa336]/30 font-mono">DISETUJUI ✓</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest bg-[#0066b1]/10 text-[#0066b1] border border-[#0066b1]/40 font-mono">MENUNGGU VERIF</span>;
      case 'verified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest bg-[#1c69d4]/10 text-[#1c69d4] border border-[#1c69d4]/40 font-mono font-bold">TERVERIFIKASI</span>;
      case 'revision':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest bg-[#f4b400]/10 text-[#f4b400] border border-[#f4b400]/30 font-mono">PERLU REVISI</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/40 font-mono">DITOLAK</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest bg-[#262626] text-[#bbbbbb] border border-[#3c3c3c] font-mono">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      
      {/* BMW Executive Cockpit Banner */}
      <div className="relative overflow-hidden bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 sm:p-8 shadow-2xl">
        <div className="m-stripe-bg h-1 w-full -mt-6 -mx-6 sm:-mt-8 sm:-mx-8 mb-6" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#0d0d0d] text-white rounded-none font-mono text-[10px] font-bold tracking-widest uppercase border border-[#3c3c3c]">
              <span className="w-1.5 h-1.5 bg-[#1c69d4]"></span>
              EXECUTIVE COCKPIT • BPHL XI
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase font-sans">
              SELAMAT DATANG, <span className="text-[#1c69d4]">{currentUser.nama}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#bbbbbb] font-light leading-relaxed">
              Otorisasi Aktif: <span className="text-white font-mono font-bold uppercase bg-[#0d0d0d] px-2 py-0.5 border border-[#3c3c3c]">{currentUser.role === 'admin' ? 'ADMIN / VALIDATOR' : currentUser.role === 'verifikator' ? 'VERIFIKATOR' : currentUser.role}</span>. Kelola dan verifikasi laporan perjalanan dinas dengan standar presisi engineered.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onCreateNew}
              className="bmw-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-xs cursor-pointer shadow-xl"
            >
              <PlusCircle className="w-4 h-4 text-[#1c69d4]" />
              BUAT LAPORAN BARU
            </button>
            <button
              onClick={() => onNavigate('laporan')}
              className="bmw-btn-outline inline-flex items-center justify-center gap-2 px-5 py-3 text-xs cursor-pointer"
            >
              DAFTAR LAPORAN
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Notice about Simulation Mode */}
      <div className="p-4 bg-[#0d0d0d] rounded-none text-xs text-[#bbbbbb] font-light leading-relaxed flex items-start gap-3 border border-[#3c3c3c]">
        <div className="p-2 bg-[#1a1a1a] border border-[#3c3c3c] text-[#1c69d4] shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white font-mono uppercase tracking-wider block mb-0.5">PETUNJUK SIMULASI ALUR VERIFIKASI & VALIDASI:</span>
          Untuk menguji siklus hidup laporan secara lengkap, Anda dapat membuat laporan sebagai staf, lalu beralih peran ke <span className="font-bold text-white">Isma Chairani / Nunung Khusnul (Verifikator)</span> untuk verifikasi, kemudian beralih peran ke <span className="font-bold text-white">Busran / Wahyu Nurhidayat (Validator)</span> untuk mengesahkan dan mencetak dokumen formal berKop Surat resmi.
        </div>
      </div>

      {/* BMW Spec-Cell Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bmw-spec-cell flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#7e7e7e] font-mono tracking-widest uppercase">TOTAL DOKUMEN</span>
            <FileText className="w-4 h-4 text-[#1c69d4]" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white font-sans tracking-tight">{totalReportsNum}</span>
            <span className="text-[9px] text-[#7e7e7e] font-mono uppercase block mt-1">LPD Terunggah</span>
          </div>
        </div>

        <div className="bmw-spec-cell flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#7e7e7e] font-mono tracking-widest uppercase">DRAFT</span>
            <FileText className="w-4 h-4 text-[#bbbbbb]" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white font-sans tracking-tight">{draftReports.length}</span>
            <span className="text-[9px] text-[#7e7e7e] font-mono uppercase block mt-1">Belum Diajukan</span>
          </div>
        </div>

        <div className="bmw-spec-cell flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#7e7e7e] font-mono tracking-widest uppercase">MENUNGGU VERIF</span>
            <RefreshCw className="w-4 h-4 text-[#0066b1]" />
          </div>
          <div>
            <span className="text-3xl font-bold text-[#0066b1] font-sans tracking-tight">{submittedReports.length}</span>
            <span className="text-[9px] text-[#0066b1] font-mono uppercase block mt-1">Diajukan Staf</span>
          </div>
        </div>

        <div className="bmw-spec-cell flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#7e7e7e] font-mono tracking-widest uppercase">MENUNGGU VALIDASI</span>
            <RefreshCw className="w-4 h-4 text-[#1c69d4]" />
          </div>
          <div>
            <span className="text-3xl font-bold text-[#1c69d4] font-sans tracking-tight">{verifiedReports.length}</span>
            <span className="text-[9px] text-[#1c69d4] font-mono uppercase block mt-1">Terverifikasi</span>
          </div>
        </div>

        <div className="bmw-spec-cell flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#7e7e7e] font-mono tracking-widest uppercase">DISETUJUI</span>
            <CheckCircle2 className="w-4 h-4 text-[#0fa336]" />
          </div>
          <div>
            <span className="text-3xl font-bold text-[#0fa336] font-sans tracking-tight">{approvedReports.length}</span>
            <span className="text-[9px] text-[#0fa336] font-mono uppercase block mt-1">Selesai Disahkan</span>
          </div>
        </div>

        <div className="bmw-spec-cell flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#7e7e7e] font-mono tracking-widest uppercase">REVISI / TOLAK</span>
            <AlertCircle className="w-4 h-4 text-[#e22718]" />
          </div>
          <div>
            <span className="text-3xl font-bold text-[#e22718] font-sans tracking-tight">{revisionReports.length}</span>
            <span className="text-[9px] text-[#e22718] font-mono uppercase block mt-1">Butuh Perbaikan</span>
          </div>
        </div>
      </div>

      {/* Visual Graphical Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Statistics by Travel Program Type */}
        <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h3 className="text-xs font-bold text-white font-mono tracking-widest uppercase">
              DISTRIBUSI JENIS KEGIATAN
            </h3>
            <span className="text-[10px] font-mono text-[#7e7e7e]">M-PERFORMANCE</span>
          </div>
          <div className="space-y-4 pt-1">
            {statsByActivity.map((stat, i) => {
              const percentage = totalReportsNum > 0 ? (stat.count / totalReportsNum) * 100 : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-bold text-white line-clamp-1 uppercase">{stat.nama}</span>
                    <span className="font-bold text-[#1c69d4] font-mono">{stat.count} LPD</span>
                  </div>
                  <div className="w-full bg-[#0d0d0d] rounded-none h-2 border border-[#262626] overflow-hidden">
                    <div
                      className="m-stripe-bg h-2 rounded-none transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Travelers Summary */}
        <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h3 className="text-xs font-bold text-white font-mono tracking-widest uppercase">
              STATISTIK DINAS PER PERSONIL
            </h3>
            <span className="text-[10px] font-mono text-[#7e7e7e]">BPHL XI</span>
          </div>
          <div className="divide-y divide-[#262626] max-h-[300px] overflow-y-auto pr-1">
            {statsByUser.map((userStat, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs first:pt-1">
                <div className="flex flex-col">
                  <span className="font-bold text-white uppercase">{userStat.nama}</span>
                  <span className="text-[10px] text-[#7e7e7e] font-mono uppercase">
                    {userStat.role === 'admin' ? 'ADMIN/VAL' : userStat.role === 'verifikator' ? 'VERIFIKATOR' : userStat.role}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white bg-[#0d0d0d] border border-[#3c3c3c] px-2.5 py-1 text-[11px]">
                    {userStat.count} LPD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Travel Logs Reports Area */}
      <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <h3 className="text-xs font-bold text-white font-mono tracking-widest uppercase">
            LAPORAN PERJALANAN DINAS TERBARU
          </h3>
          <button
            onClick={() => onNavigate('laporan')}
            className="text-xs text-white hover:text-[#1c69d4] font-bold font-mono uppercase tracking-widest transition-all focus:outline-none"
          >
            LIHAT SEMUA LPD →
          </button>
        </div>

        {accessibleReports.length === 0 ? (
          <div className="py-8 text-center text-[#7e7e7e] text-xs font-light">
            Belum ada laporan perjalanan dinas yang diajukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0d0d0d] text-[#bbbbbb] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">NO. SURAT TUGAS</th>
                  <th className="py-3 px-4">JENIS KEGIATAN</th>
                  <th className="py-3 px-4">TEMPAT TUJUAN</th>
                  <th className="py-3 px-4">WAKTU PELAKSANAAN</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {accessibleReports.slice(0, 5).map((lpd) => {
                  const programName = jenisKegiatanList.find(jk => jk.id === lpd.jenis_kegiatan_id)?.nama_kegiatan || 'Lainnya';
                  return (
                    <tr key={lpd.id} className="hover:bg-[#262626]/50 transition-all">
                      <td className="py-3.5 px-4 font-bold text-white font-mono text-xs whitespace-nowrap">
                        {lpd.nomor_surat_tugas || <span className="text-[#7e7e7e] font-light">KOSONG</span>}
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        {programName}
                      </td>
                      <td className="py-3.5 px-4 text-[#bbbbbb] max-w-[200px] truncate font-light">
                        {lpd.tempat_kegiatan}
                      </td>
                      <td className="py-3.5 px-4 text-[#bbbbbb] whitespace-nowrap">
                        <span className="text-[11px] font-mono">
                          {new Date(lpd.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} -{' '}
                          {new Date(lpd.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(lpd.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectLaporan(lpd)}
                          className="px-3 py-1.5 bg-[#0d0d0d] hover:bg-white hover:text-black border border-[#3c3c3c] text-white rounded-none text-[10px] font-bold font-mono tracking-widest uppercase transition-all"
                        >
                          DETAIL
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

