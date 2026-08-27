import { useState } from 'react';
import { Laporan, User, JenisKegiatan } from '../types';
import { Check, Edit3, XCircle, RefreshCw, AlertCircle, Eye, Calendar, MapPin, User as UserIcon, FileCheck2, ShieldAlert, BadgeCheck } from 'lucide-react';

interface VerifikasiPanelProps {
  laporanList: Laporan[];
  allUsers: User[];
  jenisKegiatanList: JenisKegiatan[];
  currentUser: User;
  onVerify: (id: string, status: Laporan['status'], notes: string) => void;
  onSelectLaporan: (laporan: Laporan) => void;
}

export default function VerifikasiPanel({
  laporanList,
  allUsers,
  jenisKegiatanList,
  currentUser,
  onVerify,
  onSelectLaporan,
}: VerifikasiPanelProps) {
  // Filter reports based on their verification workflow stage
  const pendingVerifReports = laporanList.filter(l => l.status === 'submitted');
  const pendingValReports = laporanList.filter(l => l.status === 'verified');

  // Determine default tab based on user's role
  const [activeTab, setActiveTab] = useState<'pending_verif' | 'pending_val'>(() => {
    if (currentUser.role === 'validator') return 'pending_val';
    return 'pending_verif';
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [errorText, setErrorText] = useState('');

  // Determine if current user can process reports in the active tab
  const canProcessActiveTab = 
    (activeTab === 'pending_verif' && (currentUser.role === 'verifikator' || currentUser.role === 'admin')) ||
    (activeTab === 'pending_val' && (currentUser.role === 'validator' || currentUser.role === 'admin'));

  const activeReports = activeTab === 'pending_verif' ? pendingVerifReports : pendingValReports;

  const handleAction = (id: string, actionStatus: Laporan['status']) => {
    if ((actionStatus === 'revision' || actionStatus === 'rejected') && !catatan.trim()) {
      setErrorText('Anda wajib memberikan catatan perbaikan jika menolak atau meminta revisi laporan.');
      return;
    }
    setErrorText('');
    onVerify(id, actionStatus, catatan);
    setSelectedReportId(null);
    setCatatan('');
  };

  const getProgramName = (id: string) => {
    return jenisKegiatanList.find(jk => jk.id === id)?.nama_kegiatan || 'Lainnya';
  };

  const getOwnerName = (id: string) => {
    return allUsers.find(u => u.id === id)?.nama || 'Staf';
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Overview Header */}
      <div className="border-b border-[#22293f] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Verifikasi & Validasi Perjalanan Dinas</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Siklus LPD: Draft ➔ Diajukan Staf ➔ Diverifikasi (Verifikator) ➔ Disahkan (Validator)
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-[#2b3353] rounded-xl text-xs font-mono">
          <span className="text-slate-400">User Aktif:</span>
          <span className="text-amber-400 font-bold">{currentUser.nama}</span>
          <span className="text-[10px] bg-amber-400/10 text-amber-500 font-bold px-1.5 py-0.2 rounded capitalize">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Role Banner Info */}
      <div className="p-4 bg-[#101426] border border-[#1e233d] rounded-2xl flex items-start gap-3.5">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
          <UserIcon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono">
            Panduan Peran Anda: <span className="text-amber-400">{currentUser.role === 'admin' ? 'Admin & Validator' : currentUser.role}</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {currentUser.role === 'verifikator' && (
              <span>Anda bertindak sebagai <strong>Verifikator</strong>. Tugas Anda adalah melakukan verifikasi teknis dan koreksi awal dokumen yang diajukan staf. Jika sesuai, pilih <strong>"Verifikasi LPD"</strong> untuk meneruskan laporan ke validator (Kepala Balai/Kaur TU).</span>
            )}
            {currentUser.role === 'validator' && (
              <span>Anda bertindak sebagai <strong>Validator / Kepala Balai</strong>. Tugas Anda adalah memeriksa laporan yang telah diverifikasi oleh Verifikator, lalu memberikan pengesahan tanda tangan elektronik akhir dengan memilih <strong>"Sahkan & Setujui"</strong>.</span>
            )}
            {currentUser.role === 'admin' && (
              <span>Anda bertindak sebagai <strong>Admin / Validator</strong>. Anda memiliki kewenangan penuh untuk melakukan verifikasi awal (sebagai verifikator) maupun melakukan pengesahan final (sebagai validator).</span>
            )}
            {currentUser.role === 'user' && (
              <span className="text-red-400">Peringatan: Sebagai peran <strong>User</strong> biasa, Anda hanya diizinkan untuk melihat, tetapi tidak dapat melakukan verifikasi atau pengesahan laporan.</span>
            )}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1b2137] gap-2">
        <button
          onClick={() => {
            setActiveTab('pending_verif');
            setSelectedReportId(null);
          }}
          className={`px-4 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending_verif'
              ? 'border-amber-500 text-amber-400 font-extrabold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <span>1. Menunggu Verifikasi</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            pendingVerifReports.length > 0 
              ? 'bg-amber-500/20 text-amber-400 font-bold' 
              : 'bg-slate-800 text-slate-500'
          }`}>
            {pendingVerifReports.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pending_val');
            setSelectedReportId(null);
          }}
          className={`px-4 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending_val'
              ? 'border-blue-500 text-blue-400 font-extrabold bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <span>2. Menunggu Validasi (Kepala Balai)</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            pendingValReports.length > 0 
              ? 'bg-blue-500/20 text-blue-400 font-bold animate-pulse' 
              : 'bg-slate-800 text-slate-500'
          }`}>
            {pendingValReports.length}
          </span>
        </button>
      </div>

      {/* Active Reports List Container */}
      {activeReports.length === 0 ? (
        <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
          <FileCheck2 className="w-10 h-10 text-slate-600" />
          <span className="font-medium">
            {activeTab === 'pending_verif' 
              ? 'Bagus! Tidak ada dokumen LPD baru yang menunggu verifikasi.'
              : 'Bagus! Semua dokumen LPD telah tuntas disahkan dan divalidasi.'}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeReports.map((lpd) => {
            const isSelected = selectedReportId === lpd.id;
            return (
              <div 
                key={lpd.id}
                className={`bg-[#101426] border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
                  isSelected 
                    ? activeTab === 'pending_verif' ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-blue-500/50 ring-1 ring-blue-500/20'
                    : 'border-[#1e233d] hover:border-[#2b335a]'
                }`}
              >
                {/* Header overview card */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#181d33]">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase bg-indigo-500/10 px-2 py-0.5 rounded">
                        {getProgramName(lpd.jenis_kegiatan_id)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        ST: {lpd.nomor_surat_tugas || '[Kosong]'}
                      </span>
                      {lpd.status === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                          Telah Diverifikasi TU
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      Oleh: <span className="text-amber-400">{getOwnerName(lpd.user_id)}</span>
                    </h3>

                    {/* Meta details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[11px] font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {lpd.tempat_kegiatan}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(lpd.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} s.d.{' '}
                        {new Date(lpd.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Display verification notes if available (for Validator view) */}
                    {activeTab === 'pending_val' && lpd.catatan_verifikator && (
                      <div className="mt-2 text-xs bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2.5 text-slate-300">
                        <span className="font-bold text-[10px] text-indigo-400 font-mono block uppercase">Catatan Verifikasi TU:</span>
                        <p className="italic">"{lpd.catatan_verifikator}"</p>
                      </div>
                    )}
                  </div>

                  {/* Buttons controls */}
                  <div className="flex gap-2 shrink-0 items-center">
                    <button
                      onClick={() => onSelectLaporan(lpd)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer focus:outline-none"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Pratinjau
                    </button>
                    {!isSelected && (
                      <button
                        onClick={() => {
                          setSelectedReportId(lpd.id);
                          setCatatan('');
                          setErrorText('');
                        }}
                        className={`px-3 py-1.5 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer focus:outline-none transition-all ${
                          activeTab === 'pending_verif'
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {activeTab === 'pending_verif' ? 'Verifikasi' : 'Validasi'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Verification Actions sub-form */}
                {isSelected && (
                  <div className="p-5 bg-slate-900/40 border-t border-[#1e233d] space-y-4 animate-in slide-in-from-top duration-200">
                    {!canProcessActiveTab ? (
                      /* Permission Error Warning */
                      <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block uppercase font-mono tracking-wide">Akses Ditolak</span>
                          <p>
                            {activeTab === 'pending_verif' 
                              ? 'Hanya pengguna dengan peran Verifikator (Isma Chairani / Nunung Khusnul) atau Admin (Busran) yang diizinkan memproses verifikasi tahap awal.'
                              : 'Hanya pengguna dengan peran Validator / Kepala Balai (Wahyu Nurhidayat) atau Admin (Busran) yang diizinkan melakukan pengesahan/validasi akhir.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Standard Action Inputs */
                      <>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                            Tulis Catatan / Feedback Pengesahan:
                          </label>
                          <textarea
                            value={catatan}
                            onChange={(e) => {
                              setCatatan(e.target.value);
                              setErrorText('');
                            }}
                            placeholder={
                              activeTab === 'pending_verif'
                                ? "Contoh: Laporan lengkap, dokumen sesuai, diteruskan ke Kepala Balai. ATAU berikan instruksi perbaikan: Tambahkan nomor registrasi SLK PT Wijaya."
                                : "Contoh: Laporan disahkan. ATAU berikan instruksi perbaikan akhir: Lampiran foto belum jelas."
                            }
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                          />
                          {errorText && (
                            <p className="text-[10px] text-red-500 font-mono flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errorText}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <button
                            onClick={() => setSelectedReportId(null)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Batal
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(lpd.id, 'revision')}
                              className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Minta Revisi
                            </button>
                            <button
                              onClick={() => handleAction(lpd.id, 'rejected')}
                              className="px-3.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Tolak Laporan
                            </button>

                            {activeTab === 'pending_verif' ? (
                              <button
                                onClick={() => handleAction(lpd.id, 'verified')}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-blue-950/20"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Verifikasi LPD
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(lpd.id, 'approved')}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-950/20"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Sahkan & Setujui LPD
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
