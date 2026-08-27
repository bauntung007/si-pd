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
      <div className="border-b border-[#3c3c3c] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider font-sans">VERIFIKASI & VALIDASI PERJALANAN DINAS</h2>
          <p className="text-xs text-[#7e7e7e] font-mono mt-0.5 uppercase tracking-wide">
            SIKLUS LPD: DRAFT ➔ DIAJUKAN STAF ➔ DIVERIFIKASI (TU) ➔ DISAHKAN (KEPALA BALAI)
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none text-xs font-mono">
          <span className="text-[#7e7e7e] uppercase">USER:</span>
          <span className="text-white font-bold">{currentUser.nama}</span>
          <span className="text-[9px] bg-[#0d0d0d] text-white border border-[#3c3c3c] font-bold px-1.5 py-0.5 uppercase">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Role Banner Info */}
      <div className="p-4 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none flex items-start gap-3.5 shadow-2xl">
        <div className="p-2 bg-[#0d0d0d] border border-[#3c3c3c] text-[#1c69d4] shrink-0 rounded-none">
          <UserIcon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
            PANDUAN PERAN: <span className="text-[#1c69d4]">{currentUser.role === 'admin' ? 'ADMIN & VALIDATOR' : currentUser.role.toUpperCase()}</span>
          </h4>
          <p className="text-xs text-[#bbbbbb] font-light leading-relaxed">
            {currentUser.role === 'verifikator' && (
              <span>Anda bertindak sebagai <strong>Verifikator TU</strong>. Tugas Anda adalah melakukan verifikasi teknis dokumen yang diajukan staf. Jika sesuai, pilih <strong>"VERIFIKASI LPD"</strong> untuk meneruskan laporan ke Kepala Balai.</span>
            )}
            {currentUser.role === 'validator' && (
              <span>Anda bertindak sebagai <strong>Validator / Kepala Balai</strong>. Tugas Anda adalah memeriksa laporan yang telah diverifikasi TU, lalu memberikan pengesahan tanda tangan elektronik akhir dengan memilih <strong>"SAHKAN & SETUJUI"</strong>.</span>
            )}
            {currentUser.role === 'admin' && (
              <span>Anda bertindak sebagai <strong>Admin / Validator</strong>. Anda memiliki kewenangan penuh untuk verifikasi teknis awal maupun pengesahan final.</span>
            )}
            {currentUser.role === 'user' && (
              <span className="text-[#e22718]">Peringatan: Sebagai peran <strong>User</strong>, Anda hanya dapat memantau status laporan Anda.</span>
            )}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#3c3c3c] gap-2">
        <button
          onClick={() => {
            setActiveTab('pending_verif');
            setSelectedReportId(null);
          }}
          className={`px-5 py-3 text-xs font-bold tracking-widest uppercase font-mono transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending_verif'
              ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
              : 'border-transparent text-[#7e7e7e] hover:text-white hover:bg-[#0d0d0d]'
          }`}
        >
          <span>1. MENUNGGU VERIFIKASI</span>
          <span className={`px-2 py-0.5 text-[9px] font-mono border rounded-none ${
            pendingVerifReports.length > 0 
              ? 'bg-[#0066b1]/20 border-[#0066b1] text-white font-bold' 
              : 'bg-[#0d0d0d] border-[#262626] text-[#7e7e7e]'
          }`}>
            {pendingVerifReports.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pending_val');
            setSelectedReportId(null);
          }}
          className={`px-5 py-3 text-xs font-bold tracking-widest uppercase font-mono transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending_val'
              ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
              : 'border-transparent text-[#7e7e7e] hover:text-white hover:bg-[#0d0d0d]'
          }`}
        >
          <span>2. MENUNGGU VALIDASI (KEPALA BALAI)</span>
          <span className={`px-2 py-0.5 text-[9px] font-mono border rounded-none ${
            pendingValReports.length > 0 
              ? 'bg-[#1c69d4]/20 border-[#1c69d4] text-white font-bold' 
              : 'bg-[#0d0d0d] border-[#262626] text-[#7e7e7e]'
          }`}>
            {pendingValReports.length}
          </span>
        </button>
      </div>

      {/* Active Reports List Container */}
      {activeReports.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-12 text-center text-[#7e7e7e] text-xs flex flex-col items-center justify-center space-y-3 font-mono">
          <FileCheck2 className="w-10 h-10 text-[#3c3c3c]" />
          <span className="font-bold text-white uppercase tracking-wider">
            {activeTab === 'pending_verif' 
              ? 'TIDAK ADA DOKUMEN LPD YANG MENUNGGU VERIFIKASI.'
              : 'SEMUA DOKUMEN LPD TELAH TUNTAS DISAHKAN.'}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeReports.map((lpd) => {
            const isSelected = selectedReportId === lpd.id;
            return (
              <div 
                key={lpd.id}
                className={`bg-[#1a1a1a] border rounded-none overflow-hidden transition-all duration-200 shadow-2xl ${
                  isSelected 
                    ? 'border-[#1c69d4]'
                    : 'border-[#3c3c3c] hover:border-white'
                }`}
              >
                {/* Header overview card */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626]">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-white font-mono uppercase bg-[#0d0d0d] border border-[#3c3c3c] px-2.5 py-0.5">
                        {getProgramName(lpd.jenis_kegiatan_id)}
                      </span>
                      <span className="text-[10px] font-bold text-[#bbbbbb] font-mono">
                        ST: {lpd.nomor_surat_tugas || '[KOSONG]'}
                      </span>
                      {lpd.status === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white font-mono bg-[#1c69d4]/20 px-2 py-0.5 border border-[#1c69d4] uppercase">
                          <BadgeCheck className="w-3.5 h-3.5 text-[#1c69d4]" />
                          TERVERIFIKASI TU
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans uppercase">
                      <UserIcon className="w-4 h-4 text-[#7e7e7e] shrink-0" />
                      STAF PELAKSANA: <span className="text-white">{getOwnerName(lpd.user_id)}</span>
                    </h3>

                    {/* Meta details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#bbbbbb] text-[11px] font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#7e7e7e]" />
                        {lpd.tempat_kegiatan}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#7e7e7e]" />
                        {new Date(lpd.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} s.d.{' '}
                        {new Date(lpd.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Display verification notes if available */}
                    {activeTab === 'pending_val' && lpd.catatan_verifikator && (
                      <div className="mt-2 text-xs bg-[#0d0d0d] border border-[#3c3c3c] rounded-none p-2.5 text-[#bbbbbb]">
                        <span className="font-bold text-[9px] text-white font-mono block uppercase tracking-wider">CATATAN VERIFIKASI TU:</span>
                        <p className="italic font-light">"{lpd.catatan_verifikator}"</p>
                      </div>
                    )}
                  </div>

                  {/* Buttons controls */}
                  <div className="flex gap-2 shrink-0 items-center">
                    <button
                      onClick={() => onSelectLaporan(lpd)}
                      className="bmw-btn-outline px-3 py-1.5 text-xs font-mono uppercase cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      PRATINJAU
                    </button>
                    {!isSelected && (
                      <button
                        onClick={() => {
                          setSelectedReportId(lpd.id);
                          setCatatan('');
                          setErrorText('');
                        }}
                        className="bmw-btn-primary px-4 py-1.5 text-xs font-mono uppercase cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#1c69d4]" />
                        {activeTab === 'pending_verif' ? 'VERIFIKASI' : 'VALIDASI'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Verification Actions sub-form */}
                {isSelected && (
                  <div className="p-5 bg-[#0d0d0d] border-t border-[#262626] space-y-4 animate-in slide-in-from-top duration-200">
                    {!canProcessActiveTab ? (
                      /* Permission Error Warning */
                      <div className="p-3 bg-[#e22718]/10 border border-[#e22718]/30 rounded-none text-xs text-[#e22718] flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block uppercase font-mono tracking-widest">AKSES DITOLAK</span>
                          <p className="font-mono text-[10px]">
                            {activeTab === 'pending_verif' 
                              ? 'Hanya peran Verifikator TU atau Admin yang diizinkan memproses verifikasi tahap awal.'
                              : 'Hanya peran Validator / Kepala Balai atau Admin yang diizinkan melakukan pengesahan/validasi akhir.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Standard Action Inputs */
                      <>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                            TULIS CATATAN / FEEDBACK PENGESAHAN:
                          </label>
                          <textarea
                            value={catatan}
                            onChange={(e) => {
                              setCatatan(e.target.value);
                              setErrorText('');
                            }}
                            placeholder={
                              activeTab === 'pending_verif'
                                ? "Contoh: Laporan lengkap, dokumen sesuai, diteruskan ke Kepala Balai."
                                : "Contoh: Laporan disahkan secara resmi."
                            }
                            rows={3}
                            className="bmw-input w-full font-sans text-xs"
                          />
                          {errorText && (
                            <p className="text-[10px] text-[#e22718] font-mono flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errorText}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <button
                            onClick={() => setSelectedReportId(null)}
                            className="bmw-btn-outline px-3 py-1.5 text-xs font-mono uppercase cursor-pointer"
                          >
                            BATAL
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(lpd.id, 'revision')}
                              className="px-4 py-1.5 bg-[#f4b400]/10 border border-[#f4b400]/40 text-[#f4b400] hover:bg-[#f4b400] hover:text-black font-mono font-bold uppercase text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              MINTA REVISI
                            </button>
                            <button
                              onClick={() => handleAction(lpd.id, 'rejected')}
                              className="px-4 py-1.5 bg-[#e22718]/10 border border-[#e22718]/40 text-[#e22718] hover:bg-[#e22718] hover:text-white font-mono font-bold uppercase text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              TOLAK LAPORAN
                            </button>

                            {activeTab === 'pending_verif' ? (
                              <button
                                onClick={() => handleAction(lpd.id, 'verified')}
                                className="bmw-btn-primary px-5 py-1.5 text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-[#1c69d4]" />
                                VERIFIKASI LPD
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(lpd.id, 'approved')}
                                className="bmw-btn-primary px-5 py-1.5 text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-[#0fa336]" />
                                SAHKAN & SETUJUI
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

