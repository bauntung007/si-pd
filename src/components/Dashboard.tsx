import { Laporan, User, JenisKegiatan } from '../types';
import { FileText, CheckCircle2, RefreshCw, AlertCircle, PlusCircle, ArrowRight, TrendingUp, Calendar, MapPin, User as UserIcon } from 'lucide-react';

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
  // Filtration based on credentials: User sees only own or where they are a team member (pelaksana), Admin/Verif/Validator sees all
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

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#131a31] to-[#0e111d] border border-[#232b47] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-mono text-[10px] font-bold tracking-wide uppercase border border-amber-500/10">
              Sistem Basis Data Perjalanan Dinas
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, <span className="text-amber-500">{currentUser.nama}</span>!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Anda masuk sebagai <span className="text-indigo-300 font-semibold uppercase">{currentUser.role === 'admin' ? 'admin / validator' : currentUser.role === 'verifikator' ? 'user / verifikator' : currentUser.role}</span>. Gunakan sistem penulisan template LPD otomatis untuk mempercepat administrasi BPHL Wilayah XI Banjarbaru.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Laporan Baru
            </button>
            <button
              onClick={() => onNavigate('laporan')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-white font-bold rounded-xl text-xs transition-all border border-slate-700"
            >
              Lihat Daftar Laporan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Subtle decorative background circles */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Info Notice about Simulation Mode */}
      <div className="p-4 bg-[#141b30] border border-blue-900/30 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-3">
        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-amber-400">Petunjuk Simulasi Alur Verifikasi & Validasi:</span> Untuk menguji siklus hidup laporan secara lengkap, Anda dapat membuat laporan sebagai staf, lalu beralih peran ke <span className="font-semibold text-slate-100">Isma Chairani / Nunung Khusnul (Verifikator)</span> untuk memverifikasi laporan (mengubah status menjadi Terverifikasi), kemudian beralih peran ke <span className="font-semibold text-slate-100">Busran (Admin/Validator) atau Wahyu Nurhidayat (Validator)</span> untuk memberikan pengesahan final, lalu mengunduh cetakan berkas formal berKop Surat resmi yang sudah tertanda tangan digital.
        </div>
      </div>

      {/* Overview Stats Bento-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#101426] border border-[#1e233d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2b335a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">Total Dokumen</span>
            <div className="p-1.5 bg-slate-800 rounded-lg text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalReportsNum}</span>
            <span className="text-[10px] text-slate-400 block mt-1">LPD terunggah</span>
          </div>
        </div>

        <div className="bg-[#101426] border border-[#1e233d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2b335a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">Draft</span>
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{draftReports.length}</span>
            <span className="text-[10px] text-indigo-400 block mt-1">Belum diajukan</span>
          </div>
        </div>

        <div className="bg-[#101426] border border-[#1e233d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2b335a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">Menunggu Verif</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 animate-pulse">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{submittedReports.length}</span>
            <span className="text-[10px] text-amber-500/80 block mt-1">Diajukan staf</span>
          </div>
        </div>

        <div className="bg-[#101426] border border-[#1e233d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2b335a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">Menunggu Validasi</span>
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">{verifiedReports.length}</span>
            <span className="text-[10px] text-blue-500/80 block mt-1">Terverifikasi</span>
          </div>
        </div>

        <div className="bg-[#101426] border border-[#1e233d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2b335a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">Disetujui</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{approvedReports.length}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-1">Selesai disahkan</span>
          </div>
        </div>

        <div className="bg-[#101426] border border-[#1e233d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2b335a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">Revisi/Tolak</span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400">{revisionReports.length}</span>
            <span className="text-[10px] text-purple-400 block mt-1">Butuh perbaikan</span>
          </div>
        </div>
      </div>

      {/* Visual Graphical Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Statistics by Travel Program Type */}
        <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-5 shadow-md lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 font-mono tracking-tight uppercase border-b border-[#22293f] pb-2.5">
            Grafik Penugasan Berdasarkan Jenis Kegiatan
          </h3>
          <div className="space-y-4 pt-1.5">
            {statsByActivity.map((stat, i) => {
              const percentage = totalReportsNum > 0 ? (stat.count / totalReportsNum) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200 line-clamp-1">{stat.nama}</span>
                    <span className="font-bold text-amber-500 font-mono">{stat.count} LPD</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Travelers Summary (Only visible easily on full view, simulated nicely) */}
        <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-5 shadow-md lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 font-mono tracking-tight uppercase border-b border-[#22293f] pb-2.5">
            Statistik Dinas per Personil
          </h3>
          <div className="divide-y divide-[#1e233d] max-h-[290px] overflow-y-auto">
            {statsByUser.map((userStat, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs first:pt-1">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200">{userStat.nama}</span>
                  <span className="text-[10px] text-slate-400 capitalize italic">
                    {userStat.role === 'admin' ? 'admin / validator' : userStat.role === 'verifikator' ? 'user / verifikator' : userStat.role}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 bg-amber-400/5 px-2 py-1 rounded">
                    {userStat.count} LPD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Travel Logs Reports Area */}
      <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#22293f] pb-2.5">
          <h3 className="text-xs font-bold text-slate-300 font-mono tracking-tight uppercase">
            Laporan Tugas Terbaru
          </h3>
          <button
            onClick={() => onNavigate('laporan')}
            className="text-[11px] text-amber-500 hover:text-amber-400 font-bold transition-all focus:outline-none"
          >
            Lihat semua LPD →
          </button>
        </div>

        {accessibleReports.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada laporan perjalanan dinas yang diajukan. Sisipkan laporan pertama Anda!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e233d] text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2 px-3">No. Surat Tugas</th>
                  <th className="py-2 px-3">Jenis Kegiatan</th>
                  <th className="py-2 px-3">Tempat Tujuan</th>
                  <th className="py-2 px-3">Waktu Pelaksanaan</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181d33]">
                {accessibleReports.slice(0, 5).map((lpd) => {
                  const programName = jenisKegiatanList.find(jk => jk.id === lpd.jenis_kegiatan_id)?.nama_kegiatan || 'Lainnya';
                  return (
                    <tr key={lpd.id} className="hover:bg-slate-800/20 transition-all font-sans">
                      <td className="py-3 px-3 font-semibold text-slate-200 font-mono text-[11px] whitespace-nowrap">
                        {lpd.nomor_surat_tugas || <span className="text-slate-500 italic">No. Surat Kosong</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {programName}
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-[180px] truncate">
                        {lpd.tempat_kegiatan}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        <span className="text-[10px] font-mono">
                          {new Date(lpd.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} s.d.{' '}
                          {new Date(lpd.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(lpd.status)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectLaporan(lpd)}
                          className="px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/20 text-amber-400 rounded text-[10px] font-bold tracking-wide transition-all"
                        >
                          Buka Detail
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
