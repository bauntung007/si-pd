import React, { useState, useEffect } from 'react';
import { User, Laporan, TelaahanStaf } from '../types';
import { LocalDB, OFFICIAL_KOP_SURAT } from '../lib/db';
import { getApiHeaders } from '../lib/utils';

import { 
  FileText, Plus, Wand2, Printer, Save, Trash2, 
  ArrowLeft, Calendar, MapPin, User as UserIcon, 
  Check, CheckSquare, Square, AlertTriangle, RefreshCw
} from 'lucide-react';

// Helper to format any text block into a sequential numbered list (1., 2., 3., etc.)
function formatAsNumberedList(text: string): string {
  if (!text) return '';
  
  // Split into lines/paragraphs, keeping track of separate ideas
  const lines = text.split(/\n+/);
  const cleanPoints: string[] = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Strip existing bullet prefixes (like -, *, •, ·) or number prefixes (like 1., 1), etc.)
    const cleanedLine = line
      .replace(/^[\s-*•··]+/g, '') // Strip standard bullets
      .replace(/^\d+[\s.)-]+\s*/, '') // Strip numbers like "1.", "1)", "1 - "
      .trim();
      
    if (cleanedLine) {
      cleanPoints.push(cleanedLine);
    }
  }
  
  // Format with sequential numbers
  return cleanPoints
    .map((point, index) => `${index + 1}. ${point}`)
    .join('\n');
}

// Helper to strip redundant "Telaahan Staf Tentang" or "TELAAHAN STAF TENTANG" from the beginning of titles
function cleanJudulTelaahan(judul: string): string {
  if (!judul) return '';
  // Case-insensitive regex to match "Telaahan Staf Tentang" or "TELAAHAN STAF TENTANG" at the beginning of the string, optionally followed by space
  return judul.replace(/^(telaahan\s+staf\s+tentang\s*)/gi, '').trim();
}

interface TelaahanStafPanelProps {
  laporanList: Laporan[];
  allUsers: User[];
  currentUser: User;
  onShowToast: (msg: string) => void;
}

export default function TelaahanStafPanel({ 
  laporanList, 
  allUsers, 
  currentUser,
  onShowToast 
}: TelaahanStafPanelProps) {
  // State for loaded list
  const [telaahanList, setTelaahanList] = useState<TelaahanStaf[]>(() => 
    LocalDB.get<TelaahanStaf[]>('telaahan_staf', [])
  );

  // Auto-cleanup orphaned Telaahan Staf on mount to keep database integrity
  useEffect(() => {
    const rawList = LocalDB.get<TelaahanStaf[]>('telaahan_staf', []);
    const originalCount = rawList.length;
    const cleaned = rawList.filter(ts => laporanList.some(l => l.id === ts.laporan_id));
    const orphansDeleted = originalCount - cleaned.length;
    
    if (orphansDeleted > 0) {
      setTelaahanList(cleaned);
      LocalDB.set('telaahan_staf', cleaned);
      onShowToast(`Sistem mendeteksi dan menghapus ${orphansDeleted} draf Telaahan Staf yang tidak terhubung dengan Laporan Perjalanan Dinas.`);
    }
  }, [laporanList, onShowToast]);
  
  // Navigation states
  const [activeView, setActiveView] = useState<'list' | 'form' | 'print'>('list');
  const [selectedTS, setSelectedTS] = useState<TelaahanStaf | null>(null);
  const [listSubTab, setListSubTab] = useState<'telaahan' | 'laporan'>('telaahan');
  
  // Form states for new/edit
  const [selectedLPDId, setSelectedLPDId] = useState<string>('');
  const [judul, setJudul] = useState<string>('');
  const [persoalan, setPersoalan] = useState<string>('');
  const [praanggapan, setPraanggapan] = useState<string>('');
  const [fakta, setFakta] = useState<string>('');
  const [analisis, setAnalisis] = useState<string>('');
  const [kesimpulan, setKesimpulan] = useState<string>('');
  const [saran, setSaran] = useState<string>('');
  const [tanggalTelaahan, setTanggalTelaahan] = useState<string>('');
  const [selectedPenyusunIds, setSelectedPenyusunIds] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Filter lists based on role and team-based access rules (creator or listed pelaksana)
  const accessibleLPDList = currentUser.role === 'user'
    ? laporanList.filter(l => l.user_id === currentUser.id || l.pelaksana_ids.includes(currentUser.id))
    : laporanList;

  const accessibleTSList = currentUser.role === 'user'
    ? telaahanList.filter(ts => {
        const associatedLPD = laporanList.find(l => l.id === ts.laporan_id);
        if (!associatedLPD) return false;
        return associatedLPD.user_id === currentUser.id || associatedLPD.pelaksana_ids.includes(currentUser.id);
      })
    : telaahanList;

  // Helper to sync with DB
  const saveTelaahanList = (newList: TelaahanStaf[]) => {
    setTelaahanList(newList);
    LocalDB.set('telaahan_staf', newList);
  };

  // Get selected LPD details
  const currentLPD = laporanList.find(l => l.id === selectedLPDId);

  // Handle selecting an LPD in form
  const handleLPDChange = (lpdId: string) => {
    setSelectedLPDId(lpdId);
    const lpd = laporanList.find(l => l.id === lpdId);
    if (!lpd) return;

    // Set default penyusun (pre-select all team members who ran the travel mission)
    if (lpd.pelaksana_ids && lpd.pelaksana_ids.length > 0) {
      setSelectedPenyusunIds([...lpd.pelaksana_ids]);
    } else {
      setSelectedPenyusunIds([lpd.user_id]);
    }

    // Set default date: dd+1 after verified date or start date
    let refDate = new Date();
    if (lpd.verified_at) {
      refDate = new Date(lpd.verified_at);
    } else if (lpd.tanggal_selesai) {
      refDate = new Date(lpd.tanggal_selesai);
    }
    const dayAfter = new Date(refDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const year = dayAfter.getFullYear();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = months[dayAfter.getMonth()];
    const dateStr = `Banjarbaru, ${dayAfter.getDate()} ${month} ${year}`;
    setTanggalTelaahan(dateStr);

    // Clear previous AI fields until generated
    setJudul('');
    setPersoalan('');
    setPraanggapan('');
    setFakta('');
    setAnalisis('');
    setKesimpulan('');
    setSaran('');
  };

  // Call API to generate Telaahan Staf
  const handleGenerateAI = async () => {
    if (!selectedLPDId) {
      onShowToast('Pilih Laporan Perjalanan Dinas terlebih dahulu!');
      return;
    }
    const lpd = laporanList.find(l => l.id === selectedLPDId);
    if (!lpd) return;

    setIsGenerating(true);
    onShowToast('Sedang membuat Telaahan Staf melalui AI...');

    try {
      const response = await fetch('/api/generate-telaahan', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({

          nomor_surat_tugas: lpd.nomor_surat_tugas,
          tanggal_surat_tugas: lpd.tanggal_surat_tugas,
          tempat_kegiatan: lpd.tempat_kegiatan,
          tanggal_mulai: lpd.tanggal_mulai,
          tanggal_selesai: lpd.tanggal_selesai,
          sasaran_kegiatan: lpd.sasaran_kegiatan,
          maksud_tujuan: lpd.maksud_tujuan,
          hasil_poin_penting: lpd.hasil_poin_penting,
          kesimpulan: lpd.kesimpulan,
          saran: lpd.saran,
          pelaku_usaha_nama: lpd.pelaku_usaha_id ? allUsers.find(u => u.id === lpd.pelaku_usaha_id)?.nama : ''
        })
      });

      if (!response.ok) {
        throw new Error(`Gagal memanggil API generate: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Respons dari server bukan berformat JSON.');
      }

      const data = await response.json();
      
      setJudul(cleanJudulTelaahan(data.judul || ''));
      setPersoalan(data.persoalan || '');
      setPraanggapan(data.praanggapan || '');
      setFakta(data.fakta || '');
      setAnalisis(data.analisis || '');
      setKesimpulan(formatAsNumberedList(data.kesimpulan || ''));
      setSaran(formatAsNumberedList(data.saran || ''));
      
      onShowToast(data.simulated 
        ? 'Telaahan Staf digenerate (Mode Simulasi Offline).' 
        : 'Telaahan Staf sukses dibuat dengan Gemini AI!'
      );
    } catch (err) {
      console.error(err);
      onShowToast('Gagal menghasilkan Telaahan Staf. Menggunakan draf simulasi...');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle penyusun list
  const togglePenyusun = (userId: string) => {
    if (selectedPenyusunIds.includes(userId)) {
      if (selectedPenyusunIds.length > 1) {
        setSelectedPenyusunIds(selectedPenyusunIds.filter(id => id !== userId));
      } else {
        onShowToast('Minimal harus ada 1 orang penyusun!');
      }
    } else {
      setSelectedPenyusunIds([...selectedPenyusunIds, userId]);
    }
  };

  // Save new or updated Telaahan Staf
  const handleSave = () => {
    if (!selectedLPDId) {
      onShowToast('Pilih Laporan Perjalanan Dinas!');
      return;
    }
    if (!judul || !persoalan || !kesimpulan) {
      onShowToast('Pastikan Anda sudah menggenerate atau mengisi konten Telaahan Staf!');
      return;
    }

    const isEdit = !!selectedTS;
    const tsId = isEdit ? selectedTS!.id : 'ts-' + Date.now();

    const newTS: TelaahanStaf = {
      id: tsId,
      laporan_id: selectedLPDId,
      judul,
      persoalan,
      praanggapan,
      fakta,
      analisis,
      kesimpulan,
      saran,
      tanggal_telaahan: tanggalTelaahan,
      penyusun_ids: selectedPenyusunIds,
      created_at: isEdit ? selectedTS!.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedList: TelaahanStaf[];
    if (isEdit) {
      updatedList = telaahanList.map(ts => ts.id === tsId ? newTS : ts);
      onShowToast('Telaahan Staf berhasil diperbarui!');
    } else {
      updatedList = [newTS, ...telaahanList];
      onShowToast('Telaahan Staf berhasil disimpan!');
    }

    saveTelaahanList(updatedList);
    setActiveView('list');
    setSelectedTS(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedLPDId('');
    setJudul('');
    setPersoalan('');
    setPraanggapan('');
    setFakta('');
    setAnalisis('');
    setKesimpulan('');
    setSaran('');
    setTanggalTelaahan('');
    setSelectedPenyusunIds([]);
    setSelectedTS(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus Telaahan Staf ini?')) {
      const filtered = telaahanList.filter(ts => ts.id !== id);
      saveTelaahanList(filtered);
      onShowToast('Telaahan Staf berhasil dihapus!');
    }
  };

  const startCreate = () => {
    resetForm();
    // Auto select first eligible LPD that has findings or is verified if possible
    const withFindings = accessibleLPDList.filter(l => l.hasil_poin_penting && l.hasil_poin_penting.trim().length > 0);
    if (withFindings.length > 0) {
      handleLPDChange(withFindings[0].id);
    } else if (accessibleLPDList.length > 0) {
      handleLPDChange(accessibleLPDList[0].id);
    }
    setActiveView('form');
  };

  const startEdit = (ts: TelaahanStaf) => {
    setSelectedTS(ts);
    setSelectedLPDId(ts.laporan_id);
    setJudul(ts.judul);
    setPersoalan(ts.persoalan);
    setPraanggapan(ts.praanggapan);
    setFakta(ts.fakta);
    setAnalisis(ts.analisis);
    setKesimpulan(ts.kesimpulan);
    setSaran(ts.saran);
    setTanggalTelaahan(ts.tanggal_telaahan);
    setSelectedPenyusunIds(ts.penyusun_ids);
    setActiveView('form');
  };

  const startPrint = (ts: TelaahanStaf) => {
    setSelectedTS(ts);
    setActiveView('print');
    // Give state a moment to render then call print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6" id="telaahan-staf-container">
      
      {/* 1. LIST VIEW */}
      {activeView === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Daftar Telaahan Staf
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kajian staf fungsional untuk tindak lanjut temuan penting / ketidaksesuaian lapangan.
              </p>
            </div>
            
            <button
              onClick={startCreate}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-xs tracking-wider transition-all shadow shadow-amber-500/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              BUAT TELAAHAN BARU
            </button>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex border-b border-slate-800/80 gap-1">
            <button
              onClick={() => setListSubTab('telaahan')}
              className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
                listSubTab === 'telaahan'
                  ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar Dokumen ({accessibleTSList.length})
            </button>
            <button
              onClick={() => setListSubTab('laporan')}
              className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
                listSubTab === 'laporan'
                  ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Status Telaahan LPD ({accessibleLPDList.length})
            </button>
          </div>

          {listSubTab === 'telaahan' ? (
            accessibleTSList.length === 0 ? (
              <div className="bg-[#121624] border border-slate-800/80 rounded-xl p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-800/50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <p className="text-sm font-semibold text-slate-200">Belum ada Telaahan Staf</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Apabila terdapat temuan penting lapangan atau ketidaksesuaian dalam Laporan Perjalanan Dinas, silakan klik tombol di atas untuk membuat Telaahan Staf resmi bertenaga AI.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {accessibleTSList.map((ts) => {
                  const lpd = laporanList.find(l => l.id === ts.laporan_id);
                  const firstPenyusun = allUsers.find(u => u.id === ts.penyusun_ids[0]);
                  
                  return (
                    <div 
                      key={ts.id}
                      onClick={() => startEdit(ts)}
                      className="bg-[#121624] border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-xl transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-mono px-2 py-0.5 rounded shrink-0">TS-AI</span>
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                            {cleanJudulTelaahan(ts.judul) || 'Telaahan Staf (Tanpa Judul)'}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            ST: <span className="font-mono text-slate-300">{lpd?.nomor_surat_tugas || 'N/A'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {lpd?.tempat_kegiatan || 'Lokasi N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                            Penyusun: <span className="text-slate-300">{firstPenyusun?.nama || 'N/A'}{ts.penyusun_ids.length > 1 ? ` (+${ts.penyusun_ids.length - 1} orang)` : ''}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); startPrint(ts); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 hover:border-amber-500 rounded-lg text-amber-400 transition-all cursor-pointer text-xs font-semibold shadow-sm"
                          title="Cetak PDF / A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak PDF</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(ts.id, e)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="bg-[#121624] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">No. Surat Tugas</th>
                      <th className="p-4">Lokasi & Kegiatan</th>
                      <th className="p-4">Tanggal Tugas</th>
                      <th className="p-4">Tim Pelaksana</th>
                      <th className="p-4 text-center">Status Telaahan</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {accessibleLPDList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          Tidak ditemukan Laporan Perjalanan Dinas.
                        </td>
                      </tr>
                    ) : (
                      accessibleLPDList.map((lpd) => {
                        const existingTS = telaahanList.find(t => t.laporan_id === lpd.id);
                        const hasTS = !!existingTS;
                        
                        // Collect all pelaksana names
                        const pelaksanaNames = lpd.pelaksana_ids?.map(pid => {
                          return allUsers.find(u => u.id === pid)?.nama || '';
                        }).filter(Boolean).join(', ') || allUsers.find(u => u.id === lpd.user_id)?.nama || 'N/A';

                        return (
                          <tr key={lpd.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="p-4 font-mono font-medium text-slate-200 max-w-[180px] truncate">
                              {lpd.nomor_surat_tugas}
                            </td>
                            <td className="p-4 font-medium text-slate-300 max-w-[200px] truncate" title={lpd.tempat_kegiatan}>
                              {lpd.tempat_kegiatan}
                            </td>
                            <td className="p-4 text-slate-400">
                              {lpd.tanggal_mulai} s.d {lpd.tanggal_selesai}
                            </td>
                            <td className="p-4 text-slate-400 max-w-[180px] truncate" title={pelaksanaNames}>
                              {pelaksanaNames}
                            </td>
                            <td className="p-4 text-center">
                              {hasTS ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  Selesai
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/20">
                                  <AlertTriangle className="w-3 h-3 animate-pulse" />
                                  Belum Dibuat
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {hasTS ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => startEdit(existingTS)}
                                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 text-indigo-400 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                                    title="Buka draf Telaahan Staf yang sudah dibuat"
                                  >
                                    Buka Draf
                                  </button>
                                  <button
                                    onClick={() => startPrint(existingTS)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                    title="Cetak Langsung"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    resetForm();
                                    handleLPDChange(lpd.id);
                                    setActiveView('form');
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                                >
                                  Buat Telaahan
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. FORM VIEW */}
      {activeView === 'form' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveView('list')}
              className="p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {selectedTS ? 'Edit Telaahan Staf' : 'Buat Telaahan Staf Baru'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih LPD, kemudian biarkan AI menyusun naskah telaahan dinas secara lengkap.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LPD Context & Settings Block */}
            <div className="lg:col-span-1 space-y-5">
              <div className="bg-[#121624] border border-slate-800/80 p-5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-amber-500 tracking-wider uppercase">1. Referensi Kegiatan</h3>
                
                {/* Select LPD */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Pilih Laporan Perjalanan Dinas (LPD)</label>
                  <select
                    disabled={!!selectedTS}
                    value={selectedLPDId}
                    onChange={(e) => handleLPDChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-60"
                  >
                    <option value="">-- Pilih LPD --</option>
                    {accessibleLPDList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nomor_surat_tugas} - {l.tempat_kegiatan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected LPD Brief Summary */}
                {currentLPD ? (
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/40 space-y-2 text-xs text-slate-300">
                    <p className="font-semibold text-amber-500/80">Rangkuman LPD:</p>
                    <div className="space-y-1 text-[11px] leading-relaxed">
                      <p><strong className="text-slate-400">Tujuan:</strong> {currentLPD.tempat_kegiatan}</p>
                      <p><strong className="text-slate-400">Waktu:</strong> {currentLPD.tanggal_mulai} s.d {currentLPD.tanggal_selesai}</p>
                      <p className="text-justify line-clamp-3">
                        <strong className="text-slate-400">Temuan Lapangan:</strong> {currentLPD.hasil_poin_penting || '(Tidak ada)'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-amber-500/80 text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Silakan pilih LPD di atas untuk memuat data referensi.</span>
                  </div>
                )}
              </div>

              {/* Signature Settings Block */}
              {currentLPD && (
                <div className="bg-[#121624] border border-slate-800/80 p-5 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-amber-500 tracking-wider uppercase">2. Tanda Tangan</h3>

                  {/* Place Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Tempat & Tanggal Telaahan</label>
                    <input
                      type="text"
                      value={tanggalTelaahan}
                      onChange={(e) => setTanggalTelaahan(e.target.value)}
                      placeholder="Banjarbaru, 18 Juni 2026"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Checklist Penyusun */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block">Checklist Penyusun (Tim Pelaksana)</label>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {allUsers
                        .filter(u => currentLPD.pelaksana_ids?.includes(u.id) || u.id === currentLPD.user_id)
                        .map(user => {
                          const isSelected = selectedPenyusunIds.includes(user.id);
                          return (
                            <button
                              key={user.id}
                              onClick={() => togglePenyusun(user.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="truncate">
                                <p className="font-semibold truncate">{user.nama}</p>
                                <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{user.nip}</p>
                              </div>
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-500 shrink-0 ml-2" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Telaahan Main Document Content Editor */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#121624] border border-slate-800/80 p-5 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-amber-500 tracking-wider uppercase">3. Naskah Telaahan Staf</h3>
                  
                  {currentLPD && (
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px] tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      {judul ? 'RE-GENERATE DENGAN AI' : 'GENERATE DENGAN AI'}
                    </button>
                  )}
                </div>

                {!selectedLPDId ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Silakan pilih Laporan Perjalanan Dinas di panel kiri terlebih dahulu.
                  </div>
                ) : isGenerating ? (
                  <div className="p-12 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                    <div>
                      <p className="text-xs text-slate-200 font-semibold">Sedang merancang Telaahan Staf...</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Gemini AI sedang meninjau temuan lapangan dan mensintesis naskah dinas resmi.
                      </p>
                    </div>
                  </div>
                ) : !judul ? (
                  <div className="p-12 text-center space-y-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    <Wand2 className="w-8 h-8 text-indigo-400 mx-auto" />
                    <div className="max-w-sm mx-auto">
                      <p className="text-xs text-slate-300 font-semibold">Draf Naskah Masih Kosong</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Klik tombol <strong className="text-indigo-400">GENERATE DENGAN AI</strong> di kanan atas untuk menghasilkan rancangan telaahan staf kementerian secara otomatis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* TENTANG */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">TENTANG (JUDUL)</label>
                      <textarea
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 font-semibold"
                        rows={2}
                      />
                    </div>

                    {/* PERSOALAN */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">A. PERSOALAN</label>
                      <textarea
                        value={persoalan}
                        onChange={(e) => setPersoalan(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                        rows={4}
                      />
                    </div>

                    {/* PRAANGGAPAN */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">B. PRAANGGAPAN</label>
                      <textarea
                        value={praanggapan}
                        onChange={(e) => setPraanggapan(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                        rows={4}
                      />
                    </div>

                    {/* FAKTA */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">C. FAKTA YANG MEMPENGARUHI</label>
                      <textarea
                        value={fakta}
                        onChange={(e) => setFakta(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                        rows={4}
                      />
                    </div>

                    {/* ANALISIS */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">D. ANALISIS</label>
                      <textarea
                        value={analisis}
                        onChange={(e) => setAnalisis(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                        rows={5}
                      />
                    </div>

                    {/* KESIMPULAN */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">E. KESIMPULAN</label>
                      <textarea
                        value={kesimpulan}
                        onChange={(e) => setKesimpulan(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                        rows={4}
                      />
                    </div>

                    {/* SARAN */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-semibold">F. SARAN / REKOMENDASI</label>
                      <textarea
                        value={saran}
                        onChange={(e) => setSaran(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {judul && !isGenerating && (
                <div className="flex justify-end gap-3 flex-wrap">
                  <button
                    onClick={() => { resetForm(); setActiveView('list'); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs tracking-wider transition-all cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => {
                      const tempTS: TelaahanStaf = {
                        id: selectedTS?.id || 'temp-ts',
                        laporan_id: selectedLPDId,
                        judul,
                        persoalan,
                        praanggapan,
                        fakta,
                        analisis,
                        kesimpulan,
                        saran,
                        tanggal_telaahan: tanggalTelaahan,
                        penyusun_ids: selectedPenyusunIds,
                        created_at: selectedTS?.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      };
                      startPrint(tempTS);
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs tracking-wider transition-all shadow shadow-indigo-500/10 cursor-pointer"
                    title="Cetak draf naskah ini ke PDF"
                  >
                    <Printer className="w-4 h-4" />
                    CETAK PDF
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs tracking-wider transition-all shadow shadow-amber-500/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    SIMPAN TELAAHAN STAF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRINT VIEW (A4 STYLED CONTAINER WITH RAW DINAS HEADINGS) */}
      {activeView === 'print' && selectedTS && (
        <div className="bg-white text-black p-0 mx-auto print-page font-serif leading-relaxed text-sm" id="ts-print-document">
          <div className="no-print fixed top-4 right-4 flex items-center gap-2 z-50">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak ke PDF
            </button>
            <button 
              onClick={() => setActiveView('list')}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-lg text-xs shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembalilah ke Aplikasi
            </button>
          </div>

          {/* Letterhead (Kop Surat) */}
          <div className="flex items-center border-b-[3px] border-black pb-4 mb-6">
            <div className="w-16 h-16 shrink-0 mr-4 flex items-center justify-center">
              <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Simulated classic Ministry circular shield symbol */}
                <circle cx="50" cy="50" r="45" stroke="black" strokeWidth="2" fill="none" />
                <path d="M50 15 L50 85 M15 50 L85 50" stroke="black" strokeWidth="1" />
                <path d="M50 15 C30 35 30 65 50 85 C70 65 70 35 50 15 Z" stroke="black" strokeWidth="1.5" fill="none" />
                <text x="50" y="52" fontSize="10" fontWeight="bold" textAnchor="middle" fill="black">RI</text>
              </svg>
            </div>
            <div className="text-center flex-1">
              <h2 className="font-bold text-sm tracking-widest leading-normal">
                {OFFICIAL_KOP_SURAT.kementerian}
              </h2>
              <h3 className="font-bold text-xs tracking-wider leading-tight">
                {OFFICIAL_KOP_SURAT.dirjen}
              </h3>
              <h1 className="font-bold text-sm tracking-wide leading-snug">
                {OFFICIAL_KOP_SURAT.balai}
              </h1>
              <p className="text-[10px] leading-normal font-sans italic mt-1 font-normal">
                {OFFICIAL_KOP_SURAT.alamat}
              </p>
              <p className="text-[10px] leading-normal font-sans font-semibold">
                {OFFICIAL_KOP_SURAT.kota_pos}
              </p>
            </div>
          </div>

          {/* Main Title Block */}
          <div className="text-center space-y-1 mb-8">
            <h1 className="font-bold text-lg underline tracking-widest uppercase">TELAAHAN STAF</h1>
            <div className="flex justify-center text-sm">
              <span className="font-bold uppercase tracking-wider">TENTANG</span>
            </div>
            <p className="font-bold text-sm text-center max-w-2xl mx-auto uppercase tracking-wide leading-relaxed">
              {cleanJudulTelaahan(selectedTS.judul)}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-6 text-justify leading-relaxed text-sm pr-2 pl-2">
            
            {/* Section A */}
            <div className="space-y-1">
              <h4 className="font-bold">A. Persoalan</h4>
              <p className="pl-4 whitespace-pre-line text-slate-900">{selectedTS.persoalan}</p>
            </div>

            {/* Section B */}
            <div className="space-y-1">
              <h4 className="font-bold">B. Praanggapan</h4>
              <p className="pl-4 whitespace-pre-line text-slate-900">{selectedTS.praanggapan}</p>
            </div>

            {/* Section C */}
            <div className="space-y-1">
              <h4 className="font-bold">C. Fakta yang Mempengaruhi</h4>
              <p className="pl-4 whitespace-pre-line text-slate-900">{selectedTS.fakta}</p>
            </div>

            {/* Section D */}
            <div className="space-y-1">
              <h4 className="font-bold">D. Analisis</h4>
              <p className="pl-4 whitespace-pre-line text-slate-900">{selectedTS.analisis}</p>
            </div>

            {/* Section E */}
            <div className="space-y-1">
              <h4 className="font-bold">E. Kesimpulan</h4>
              <p className="pl-4 whitespace-pre-line text-slate-900">{selectedTS.kesimpulan}</p>
            </div>

            {/* Section F */}
            <div className="space-y-1">
              <h4 className="font-bold">F. Saran / Rekomendasi</h4>
              <p className="pl-4 whitespace-pre-line text-slate-900">{selectedTS.saran}</p>
            </div>

          </div>

          {/* Signature Block */}
          <div className="mt-12 flex justify-end pr-10">
            <div className="text-left space-y-2 text-sm w-72">
              <p className="mb-1">
                {selectedTS.tanggal_telaahan && !selectedTS.tanggal_telaahan.startsWith('Banjarbaru,')
                  ? `Banjarbaru, ${selectedTS.tanggal_telaahan}`
                  : selectedTS.tanggal_telaahan}
              </p>
              <p className="font-bold mb-4">Penyusun Telaahan Staf,</p>
              
              <div className="space-y-8">
                {selectedTS.penyusun_ids.map((userId, index) => {
                  const user = allUsers.find(u => u.id === userId);
                  if (!user) return null;
                  const qrText = `Nama: ${user.nama}\nNIP: ${user.nip || '-'}\nPangkat: ${user.pangkat || '-'}\nJabatan: ${user.jabatan || '-'}`;
                  return (
                    <div key={user.id} className="pt-2 relative mt-4 flex flex-col items-start">
                      <span className="text-[10px] text-gray-400 italic font-sans font-normal mb-1 block">
                        {selectedTS.penyusun_ids.length > 1 ? `Tanda Tangan Pelaksana ${index + 1}` : 'Tanda Tangan'}
                      </span>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrText)}`} 
                        alt={`QR Code ${user.nama}`}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 mb-2 border border-slate-300 p-0.5 bg-white shadow-sm shrink-0 print:border-slate-500"
                      />
                      <p className="font-bold">
                        {selectedTS.penyusun_ids.length > 1 ? `${index + 1}. ` : ''}
                        <span className="underline">{user.nama}</span>
                      </p>
                      {user.pangkat && user.pangkat !== '-' && (
                        <p className="text-xs text-gray-700 leading-tight">
                          {user.pangkat}
                        </p>
                      )}
                      <p className="text-xs">NIP. {user.nip}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Native Print Styles */}
      <style>{`
        @media print {
          /* Hide all screen layout elements, sidebar, header, navigation, and Toast notifications */
          body * {
            visibility: hidden !important;
          }
          /* Ensure the print document and all its children are printed cleanly */
          #ts-print-document, #ts-print-document * {
            visibility: visible !important;
          }
          #ts-print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          /* Ensure crisp contrast for ink and laser printouts */
          #ts-print-document p, 
          #ts-print-document h1, 
          #ts-print-document h2, 
          #ts-print-document h3, 
          #ts-print-document h4, 
          #ts-print-document span {
            color: black !important;
          }
          .print-page {
            font-family: 'Times New Roman', Georgia, serif !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
    </div>
  );
}
