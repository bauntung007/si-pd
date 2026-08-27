import { useState } from 'react';
import { Laporan, User, JenisKegiatan, PelakuUsaha } from '../types';
import { ArrowLeft, Printer, Edit2, Calendar, MapPin, Users, FileText, CheckCircle2, AlertCircle, RefreshCw, Trash2, Download, History } from 'lucide-react';
import { sortRegulations, sortPelaksanaDinas } from '../lib/utils';
import { LocalDB, OFFICIAL_KOP_SURAT } from '../lib/db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// oklch to rgb converter function for html2canvas support
const convertOklchToRgbInString = (str: string): string => {
  if (typeof str !== 'string') return str;
  if (!str.includes('oklch') && !str.includes('oklab')) return str;
  
  let result = str;

  // 1. Convert oklch to rgb
  if (result.includes('oklch')) {
    result = result.replace(/oklch\(\s*([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)/g, (match, p1, p2, p3, p4) => {
      try {
        let l = parseFloat(p1);
        if (p1.endsWith('%')) l = parseFloat(p1) / 100;
        
        let c = parseFloat(p2);
        if (p2.endsWith('%')) c = parseFloat(p2) / 100;
        
        let h = parseFloat(p3);
        if (p3.endsWith('%')) h = (parseFloat(p3) / 100) * 360;

        let a = p4 ? parseFloat(p4) : 1;
        if (p4 && p4.endsWith('%')) a = parseFloat(p4) / 100;

        // Convert OKLCH to OKLAB
        const hRad = (h * Math.PI) / 180;
        const aLab = c * Math.cos(hRad);
        const bLab = c * Math.sin(hRad);

        // OKLAB to LMS
        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.291485548 * bLab;

        const l_cube = l_ * l_ * l_;
        const m_cube = m_ * m_ * m_;
        const s_cube = s_ * s_ * s_;

        // LMS to linear sRGB
        const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
        const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
        const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

        // Linear sRGB to sRGB gamma correction
        const f = (x: number) => (x >= 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x);

        const r = Math.max(0, Math.min(255, Math.round(f(r_lin) * 255)));
        const g = Math.max(0, Math.min(255, Math.round(f(g_lin) * 255)));
        const b = Math.max(0, Math.min(255, Math.round(f(b_lin) * 255)));

        return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
      } catch (e) {
        return 'rgb(120, 120, 120)';
      }
    });
  }

  // 2. Convert oklab to rgb
  if (result.includes('oklab')) {
    result = result.replace(/oklab\(\s*([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)(?:\s*\/\s*([+-]?[\d.]+%?))?\s*\)/g, (match, p1, p2, p3, p4) => {
      try {
        let l = parseFloat(p1);
        if (p1.endsWith('%')) l = parseFloat(p1) / 100;
        
        let aLab = parseFloat(p2);
        if (p2.endsWith('%')) aLab = parseFloat(p2) / 100;
        
        let bLab = parseFloat(p3);
        if (p3.endsWith('%')) bLab = parseFloat(p3) / 100;

        let a = p4 ? parseFloat(p4) : 1;
        if (p4 && p4.endsWith('%')) a = parseFloat(p4) / 100;

        // OKLAB to LMS
        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.291485548 * bLab;

        const l_cube = l_ * l_ * l_;
        const m_cube = m_ * m_ * m_;
        const s_cube = s_ * s_ * s_;

        // LMS to linear sRGB
        const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
        const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
        const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

        // Linear sRGB to sRGB gamma correction
        const f = (x: number) => (x >= 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x);

        const r = Math.max(0, Math.min(255, Math.round(f(r_lin) * 255)));
        const g = Math.max(0, Math.min(255, Math.round(f(g_lin) * 255)));
        const b = Math.max(0, Math.min(255, Math.round(f(b_lin) * 255)));

        return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
      } catch (e) {
        return 'rgb(120, 120, 120)';
      }
    });
  }

  return result;
};

interface LaporanDetailProps {
  laporan: Laporan;
  allUsers: User[];
  jenisKegiatanList: JenisKegiatan[];
  currentUser: User;
  onBack: () => void;
  onEdit: () => void;
  pelakuUsahaList: PelakuUsaha[];
  onDeleteLaporan?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function LaporanDetail({
  laporan,
  allUsers,
  jenisKegiatanList,
  currentUser,
  onBack,
  onEdit,
  pelakuUsahaList,
  onDeleteLaporan,
  onShowToast,
}: LaporanDetailProps) {
  const selectedProgram = jenisKegiatanList.find(jk => jk.id === laporan.jenis_kegiatan_id);
  const ownerUser = allUsers.find(u => u.id === laporan.user_id);
  const verifierUser = allUsers.find(u => u.id === laporan.verifikator_id);
  
  const pelaksanaList = sortPelaksanaDinas(allUsers.filter(u => laporan.pelaksana_ids.includes(u.id)));
  const kopSurat = LocalDB.get('kop_surat', OFFICIAL_KOP_SURAT);
  
  const pu = pelakuUsahaList.find(p => p.id === laporan.pelaku_usaha_id);
  let kabKota = '';
  if (pu) {
    const parts = pu.alamat.split(',');
    const regencyName = parts[0]?.trim() || '';
    const lowerRegency = regencyName.toLowerCase();
    let regencyLabel = 'Kabupaten';
    if (lowerRegency.startsWith('kota') || lowerRegency === 'banjarmasin' || lowerRegency === 'banjarbaru') {
      if (lowerRegency.startsWith('kota')) {
        regencyLabel = '';
      } else {
        regencyLabel = 'Kota';
      }
    }
    kabKota = regencyLabel ? `${regencyLabel} ${regencyName}` : regencyName;
  }

  const [signatureMode, setSignatureMode] = useState<'digital' | 'physical'>(
    laporan.status === 'approved' ? 'digital' : 'physical'
  );
  const [includeAttachments, setIncludeAttachments] = useState<boolean>(true);
  const [showBorder, setShowBorder] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  const formatIndonesianDate = (dateStr: string, abbreviateMonth = false) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: abbreviateMonth ? 'short' : 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Generate dynamic rules (Dasar Pelaksanaan) sorted by hierarchy and chronology
  let regulations: string[] = [];
  if (selectedProgram) {
    const rawRegulations = [
      `Surat Tugas Kepala BPHL Wilayah XI Banjarbaru Nomor: ${laporan.nomor_surat_tugas || '[Kosong]'} Tanggal ${formatIndonesianDate(laporan.tanggal_surat_tugas)}.`,
      ...selectedProgram.dasar_hukum
    ];
    regulations = sortRegulations(rawRegulations);
  }

  const triggerBrowserPrint = () => {
    window.print();
  };

  const exportToPDF = async () => {
    // Keep reference to style elements and their original texts
    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyles = styleElements.map(el => ({
      element: el,
      text: el.textContent || ''
    }));

    const originalGetComputedStyle = window.getComputedStyle;

    try {
      setIsGeneratingPDF(true);
      const element = document.getElementById('a4-official-printout');
      if (!element) {
        if (onShowToast) {
          onShowToast('Garis cetak dokumen LPD tidak ditemukan!');
        } else {
          console.warn('Garis cetak dokumen LPD tidak ditemukan!');
        }
        return;
      }

      // Temporarily clean OKLCH and OKLAB styles from style tags to prevent html2canvas parser crash
      for (const style of originalStyles) {
        if (style.text.includes('oklch') || style.text.includes('oklab')) {
          style.element.textContent = convertOklchToRgbInString(style.text);
        }
      }

      // Temporarily override window.getComputedStyle safely during the html2canvas generation
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(window, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                return convertOklchToRgbInString(val);
              };
            }
            // Fix "Illegal invocation" by passing target as the receiver to Reflect.get
            const value = Reflect.get(target, prop, target);
            if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab'))) {
              return convertOklchToRgbInString(value);
            }
            if (typeof value === 'function') {
              return value.bind(target);
            }
            return value;
          }
        });
      };

      // Pre-process step: Scroll to top to prevent shifted/blank canvas render on partially scrolled views
      const oldScrollY = window.scrollY;
      window.scrollTo(0, 0);

      // Add temporary class to optimize rendering if needed
      element.classList.add('pdf-render-active');

      // html2canvas rendering configurations
      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution to ensure pristine print vector text sharpness
        useCORS: true, // Allow external QR image components to render correctly
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794, // Standard A4 pixel size for consistency
      });

      // Cleanup class and restore scroll
      element.classList.remove('pdf-render-active');
      window.scrollTo(0, oldScrollY);

      const imgData = canvas.toDataURL('image/png');
      
      // Setup dynamic multi-page jsPDF configurations
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210; // A4 dimension Width (mm)
      const pdfPageHeight = 297; // A4 dimension Height (mm)
      const contentHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = contentHeight;
      let position = 0;

      // Append page 1
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, contentHeight, undefined, 'FAST');
      heightLeft -= pdfPageHeight;

      // Dynamic slicing logic for subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, contentHeight, undefined, 'FAST');
        heightLeft -= pdfPageHeight;
      }

      // Descriptive filename matching Indonesian legal document style
      const docDate = laporan.tanggal_mulai ? laporan.tanggal_mulai.replace(/-/g, '') : 'baru';
      const safeTitle = (laporan.maksud_tujuan || 'Laporan_Perjalanan_Dinas')
        .substring(0, 20)
        .replace(/[^a-zA-Z0-9]/g, '_');
      
      pdf.save(`LPD_BPHL_XI_${docDate}_${safeTitle}.pdf`);

    } catch (err) {
      console.error('Eror PDF Export:', err);
      if (onShowToast) {
        onShowToast('Gagal mengekspor berkas ke PDF secara otomatis. Gunakan alternatif tombol "Cetak Laporan".');
      }
    } finally {
      // Restore original getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;

      // Restore original style tag contents
      for (const style of originalStyles) {
        style.element.textContent = style.text;
      }
      setIsGeneratingPDF(false);
    }
  };

  const isEditable = (laporan.status === 'draft' || laporan.status === 'revision') && 
                     (laporan.user_id === currentUser.id);

  const getStatusLabelAndColor = () => {
    switch (laporan.status) {
      case 'approved':
        return { label: 'Disetujui', bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'submitted':
        return { label: 'Menunggu Verifikasi', bg: 'bg-amber-500/10 border-amber-500/25 text-amber-400', icon: <RefreshCw className="w-4 h-4 animate-spin" /> };
      case 'revision':
        return { label: 'Perlu Revisi', bg: 'bg-purple-500/10 border-purple-500/25 text-purple-400', icon: <AlertCircle className="w-4 h-4" /> };
      case 'rejected':
        return { label: 'Ditolak', bg: 'bg-red-500/10 border-red-500/25 text-red-500', icon: <AlertCircle className="w-4 h-4" /> };
      default:
        return { label: 'Draft', bg: 'bg-slate-500/10 border-slate-500/25 text-slate-300', icon: <FileText className="w-4 h-4 animate-pulse" /> };
    }
  };

  const statusStyle = getStatusLabelAndColor();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      
      {/* Action Buttons Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22293f] pb-4 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar LPD
        </button>

        <div className="flex flex-wrap gap-2.5">
          {isEditable && (
            <button
              onClick={onEdit}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/5 font-sans"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Ubah Laporan
            </button>
          )}
          <button
            onClick={exportToPDF}
            disabled={isGeneratingPDF}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer font-sans shadow-md ${
              isGeneratingPDF 
                ? 'bg-indigo-800 text-slate-300 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10'
            }`}
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Mengekstrak PDF...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Ekspor Unduh PDF
              </>
            )}
          </button>
          <button
            onClick={triggerBrowserPrint}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer font-sans shadow-md shadow-emerald-500/10"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Laporan
          </button>
          {currentUser.role === 'admin' && onDeleteLaporan && (
            <button
              onClick={() => onDeleteLaporan(laporan.id)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-red-500/5 font-sans"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus LPD (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Informative Warning Note for Non-Approved Status */}
      {laporan.status !== 'approved' && (
        <div className="p-4 bg-[#141b30] border border-amber-900/15 rounded-xl flex items-start gap-3 text-xs text-slate-300 leading-relaxed print:hidden">
          <div className="p-1 px-1.5 bg-amber-500/10 text-amber-500 font-bold font-mono rounded">!</div>
          <div>
            <span className="font-bold text-amber-400">Catatan Cetakan:</span> Dokumen ini berstatus <span className="font-semibold text-slate-50">{statusStyle.label}</span>. Cetakan kop surat resmi kementerian yang sah secara administratif biasanya membutuhkan verifikasi status <span className="text-emerald-400 font-bold">"Disetujui"</span> terlebih dahulu dari Kepala Balai.
          </div>
        </div>
      )}

      {/* PANEL RIWAYAT PERUBAHAN (CHANGE HISTORY PANEL) */}
      {laporan.riwayat_perubahan && laporan.riwayat_perubahan.length > 0 && (
        <div className="p-5 bg-[#0f1424] border border-[#1e294b] rounded-2xl space-y-4 print:hidden shadow-lg animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 border-b border-[#1e294b]/50 pb-2.5">
            <History className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Riwayat Perubahan Status (Log Aktivitas Verifikasi)
            </h4>
          </div>
          
          <div className="space-y-3">
            {laporan.riwayat_perubahan.map((riwayat, index) => {
              const getBadgeStyle = (status: string) => {
                switch (status) {
                  case 'approved': return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
                  case 'submitted': return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
                  case 'revision': return 'bg-purple-500/10 border-purple-500/25 text-purple-400';
                  case 'rejected': return 'bg-red-500/10 border-red-500/25 text-red-500';
                  case 'verified': return 'bg-blue-500/10 border-blue-500/25 text-blue-400';
                  default: return 'bg-slate-500/10 border-slate-500/25 text-slate-300';
                }
              };

              return (
                <div key={riwayat.id} className="flex gap-4 items-start relative">
                  {/* Timeline connecting line */}
                  {index < laporan.riwayat_perubahan!.length - 1 && (
                    <div className="absolute top-6 left-[11px] w-px h-full bg-[#1e294b]"></div>
                  )}
                  <div className="w-6 h-6 rounded-full bg-[#141b30] border border-[#1e294b] flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="flex-1 bg-[#141b30] border border-[#1e294b] rounded-xl p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-200 text-xs">{riwayat.user_nama}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(riwayat.timestamp).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })} WIB
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>Mengubah status dari</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold uppercase ${getBadgeStyle(riwayat.status_before)}`}>
                        {riwayat.status_before}
                      </span>
                      <span>menjadi</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold uppercase ${getBadgeStyle(riwayat.status_after)}`}>
                        {riwayat.status_after}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PANEL KONFIGURASI CETAKAN (PRINT CONFIGURATION PANEL) */}
      <div className="p-5 bg-[#0f1424] border border-[#1e294b] rounded-2xl space-y-4 print:hidden shadow-lg animate-in fade-in-50 duration-200">
        <div className="flex items-center gap-2 border-b border-[#1e294b]/50 pb-2.5">
          <Printer className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Pengaturan Cetakan Dokumen (LPD)
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mode Tanda Tangan */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
              Metode Penandatanganan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSignatureMode('digital')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  signatureMode === 'digital'
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                    : 'bg-[#141b30] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tanda Tangan QR (Digital)
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('physical')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  signatureMode === 'physical'
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                    : 'bg-[#141b30] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tanda Tangan Basah (Fisik)
              </button>
            </div>
          </div>

          {/* Include Photo Attachments */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
              Lampiran Foto Dokumentasi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIncludeAttachments(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  includeAttachments
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                    : 'bg-[#141b30] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sertakan Foto
              </button>
              <button
                type="button"
                onClick={() => setIncludeAttachments(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  !includeAttachments
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                    : 'bg-[#141b30] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sembunyikan Foto
              </button>
            </div>
          </div>

          {/* Page Border Guide for alignment or checking */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
              Garis Batas Halaman (Pratinjau)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowBorder(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  showBorder
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                    : 'bg-[#141b30] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tampilkan Garis
              </button>
              <button
                type="button"
                onClick={() => setShowBorder(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  !showBorder
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                    : 'bg-[#141b30] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tanpa Garis (Bersih)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#141b30] rounded-xl p-3 border border-slate-800/60 text-slate-400 text-xs flex items-start gap-2.5">
          <span className="text-indigo-400 font-bold shrink-0 mt-0.5 font-mono">i</span>
          <div className="leading-relaxed">
            {signatureMode === 'physical' ? (
              <span>
                <strong>Mode Tanda Tangan Basah:</strong> Tanda tangan QR digital disembunyikan. Digantikan dengan kolom tanda tangan kosong formal dengan nama lengkap & NIP Kepala Balai/Pelaksana, cocok untuk dicetak ke kertas lalu ditandatangani secara fisik menggunakan pena tinta.
              </span>
            ) : (
              <span>
                <strong>Mode Tanda Tangan QR:</strong> Menampilkan QR code dinas resmi. QR code ini merepresentasikan verifikasi sistem digital yang sah secara administratif untuk BPHL Wilayah XI Banjarbaru.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification Feedback displaying */}
      {laporan.catatan_verifikator && (
        <div className="p-4 bg-[#1f1530] border border-purple-900/30 rounded-xl space-y-1.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            <span className="text-[10px] font-bold tracking-wider text-purple-400 font-mono uppercase">
              Catatan Verifikasi Atas LPD Ini:
            </span>
          </div>
          <p className="text-xs text-purple-200 leading-relaxed font-sans font-medium italic">
            "{laporan.catatan_verifikator}"
          </p>
          <p className="text-[9px] text-slate-400 font-mono">
            Diverifikasi oleh: {verifierUser?.nama || 'Atasan'} pada {formatIndonesianDate(laporan.verified_at || '')}
          </p>
        </div>
      )}

      {/* SIMULATED OFFICIAL A4 GOVERNMENT MEMO SHEET */}
      <div 
        id="a4-official-printout"
        className={`bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-12 text-sm leading-relaxed max-w-[210mm] mx-auto min-h-[297mm] relative print:border-none print:shadow-none print:p-0 font-serif transition-all ${
          showBorder ? 'border-2 border-dashed border-indigo-500/40' : 'border border-slate-200'
        }`}
      >
        
        {/* OFFICIAL MINISTRY HEADER (KOP SURAT) */}
        <div className="border-b-4 border-double border-slate-950 pb-3 mb-6 flex items-center justify-between text-center gap-4 select-none">
          {/* Logo Left - High Fidelity Kementerian Kehutanan Seal */}
          <div className="w-20 shrink-0 flex flex-col justify-center items-center">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col justify-center items-center relative shadow-sm">
              <div className="absolute inset-0.5 rounded-full border border-dashed border-emerald-600/40"></div>
              {/* Styled Tree Symbol */}
              <svg className="w-8 h-8 text-emerald-800 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3a9 9 0 00-9 9h18a9 9 0 00-9-9zM8 12a4 4 0 008 0M12 7.5a4.5 4.5 0 000 9" />
              </svg>
              <span className="text-[7px] font-extrabold text-emerald-950 tracking-tighter uppercase leading-none z-10 mt-0.5 font-figtree">KEMENHUT</span>
              <span className="text-[5px] font-mono font-extrabold text-emerald-700 leading-none z-10 uppercase tracking-widest scale-90">RI</span>
            </div>
          </div>

          <div className="flex flex-col flex-1 text-center">
            <span className="font-figtree text-[14px] font-bold text-slate-950 leading-none mb-1 uppercase tracking-wide">
              {kopSurat.kementerian}
            </span>
            <span className="font-figtree text-[14px] font-semibold text-slate-800 leading-none mb-1.5 uppercase tracking-wide">
              {kopSurat.dirjen}
            </span>
            <span className="font-figtree text-[18px] font-black text-emerald-950 leading-tight mb-2 uppercase tracking-tight">
              {kopSurat.balai}
            </span>
            <span className="font-figtree text-[9px] text-slate-600 leading-normal font-medium max-w-lg mx-auto">
              {kopSurat.alamat}
            </span>
            <span className="font-figtree text-[11px] font-bold text-slate-900 mt-1 uppercase tracking-wider block">
              {kopSurat.kota_pos}
            </span>
          </div>
          
          {/* Logo Right - Kemenhut Logo from Backend Server */}
          <div className="w-20 shrink-0 hidden sm:flex flex-col items-center justify-center">
            <img 
              src="/api/kemenhut-logo.svg" 
              alt="Logo Kemenhut" 
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* MEMO TITLE */}
        <div className="text-center mb-6 space-y-1">
          <h4 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-slate-900 border-b-[2px] border-slate-900 inline-block px-4 font-sans leading-relaxed">
            LAPORAN HASIL PERJALANAN DINAS
          </h4>
          <p className="text-xs text-slate-700 font-sans tracking-tight font-bold">
            DALAM RANGKA {selectedProgram?.nama_kegiatan.toUpperCase() || 'KEGIATAN BPHL WILAYAH XI'}
          </p>
          <p className="text-[11px] text-slate-600 font-mono font-medium">
            Nomor Surat Tugas: {laporan.nomor_surat_tugas || <span className="text-red-500 italic">[Wajib Diisi]</span>}
          </p>
        </div>

        {/* REPORT CONTENT STRUCTURE (Official Ministry of Forestry Format) */}
        <div className="space-y-6 text-slate-800 font-sans text-xs sm:text-sm leading-relaxed">
          
          {/* 1. Pendahuluan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">1</span> 
              <span>PENDAHULUAN</span>
            </h5>
            <div className="pl-6 text-slate-700 leading-relaxed text-justify">
              Laporan ini disusun sebagai bentuk pertanggungjawaban terhadap pelaksanaan kegiatan {selectedProgram?.nama_kegiatan || '[Jenis Kegiatan]'} pada {pu?.nama || '[Pelaku Usaha]'} di {kabKota || '[Nama Kabupaten/Kota]'}, Provinsi Kalimantan Selatan berdasarkan Surat Tugas Kepala BPHL Wilayah XI Banjarbaru Nomor {laporan.nomor_surat_tugas || '[Nomor Surat Tugas]'} tanggal {formatIndonesianDate(laporan.tanggal_surat_tugas) || '[Tanggal Surat Tugas]'}.
            </div>
          </div>

          {/* 2. Dasar Pelaksanaan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">2</span> 
              <span>DASAR PELAKSANAAN</span>
            </h5>
            <ol className="list-decimal list-outside pl-11 space-y-1 text-slate-700">
              {regulations.map((reg, idx) => (
                <li key={idx} className="leading-relaxed">
                  {reg}
                </li>
              ))}
            </ol>
          </div>

          {/* 3. Waktu dan Tempat */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">3</span> 
              <span>WAKTU DAN TEMPAT</span>
            </h5>
            <div className="pl-6 space-y-1 text-slate-700">
              <p>
                <strong className="text-slate-900">Tempat Pelaksanaan :</strong> {laporan.tempat_kegiatan}
              </p>
              <p>
                <strong className="text-slate-900">Waktu Pelaksanaan :</strong>{' '}
                {formatIndonesianDate(laporan.tanggal_mulai)} s.d.{' '}
                {formatIndonesianDate(laporan.tanggal_selesai)} ({Math.round(
                  (new Date(laporan.tanggal_selesai).getTime() - new Date(laporan.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24)
                ) + 1} hari)
              </p>
            </div>
          </div>

          {/* 4. Sasaran Kegiatan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">4</span> 
              <span>SASARAN KEGIATAN</span>
            </h5>
            <p className="pl-6 text-slate-700 leading-relaxed text-justify">
              {laporan.sasaran_kegiatan || 'Sesuai arahan sasaran program kerja kementerian.'}
            </p>
          </div>

          {/* 5. Pelaksana Kegiatan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">5</span> 
              <span>PELAKSANA KEGIATAN</span>
            </h5>
            <div className="pl-6 pt-1">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="py-1.5 px-3 border-r border-slate-300 font-bold text-slate-900 w-8">No</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 font-bold text-slate-900">Nama Pelaksana</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 font-bold text-slate-900">NIP</th>
                    <th className="py-1.5 px-3 font-bold text-slate-900">Pangkat / Jabatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {pelaksanaList.map((pel, idx) => (
                    <tr key={pel.id}>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-medium">{idx + 1}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-bold">{pel.nama}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-mono text-[11px]">{pel.nip}</td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {pel.pangkat && pel.pangkat !== '-' ? `${pel.pangkat}${pel.golongan && pel.golongan !== '-' ? ` (${pel.golongan})` : ''} / ` : ''}{pel.jabatan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Maksud dan Tujuan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">6</span> 
              <span>MAKSUD DAN TUJUAN</span>
            </h5>
            <p className="pl-6 text-slate-700 leading-relaxed text-justify">
              {laporan.maksud_tujuan}
            </p>
          </div>

          {/* 7. Metode Pelaksanaan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">7</span> 
              <span>METODE PELAKSANAAN</span>
            </h5>
            <p className="pl-6 text-slate-700 leading-relaxed text-justify whitespace-pre-line">
              {laporan.metode_pelaksanaan || selectedProgram?.metode_pelaksanaan || 'Sesuai dengan standard prosedur operasi balai.'}
            </p>
          </div>

          {/* 8. Hasil Kegiatan / Pembahasan */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">8</span> 
              <span>HASIL KEGIATAN / PEMBAHASAN</span>
            </h5>
            <div className="pl-6 space-y-3 text-slate-700">
              {laporan.hasil_data_umum ? (
                <div className="space-y-2">
                  <div className="bg-slate-50 border-l-[3px] border-[#113a1a] p-3 text-xs leading-relaxed rounded-r text-justify">
                    <strong className="text-slate-900 block mb-1">A. Data Umum Obyek Kegiatan:</strong>
                    {laporan.hasil_data_umum}
                  </div>
                  {laporan.hasil_poin_penting && (
                    <div className="bg-slate-50 border-l-[3px] border-amber-500 p-3 text-xs leading-relaxed rounded-r text-justify">
                      <strong className="text-slate-900 block mb-1">B. Temuan Penting Kegiatan Lapangan:</strong>
                      <div className="whitespace-pre-line">{laporan.hasil_poin_penting}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="leading-relaxed text-justify whitespace-pre-wrap font-sans">
                  {laporan.hasil_kegiatan}
                </div>
              )}
            </div>
          </div>

          {/* 9. Kesimpulan */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">9</span> 
              <span>KESIMPULAN</span>
            </h5>
            <p className="pl-6 text-slate-700 leading-relaxed text-justify font-sans whitespace-pre-line">
              {laporan.kesimpulan}
            </p>
          </div>

          {/* 10. Rekomendasi / Saran */}
          <div className="space-y-1">
            <h5 className="font-extrabold text-slate-950 font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
              <span className="bg-slate-900 text-white w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] shrink-0">10</span> 
              <span>REKOMENDASI / SARAN TINDAK LANJUT</span>
            </h5>
            <p className="pl-6 text-slate-700 leading-relaxed text-justify font-sans whitespace-pre-line">
              {laporan.saran || 'Tidak ada rekomendasi khusus untuk penugasan dinas ini.'}
            </p>
          </div>

        </div>

        {/* OFFICIAL SIGNATURES SECTION */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-xs leading-tight font-sans">
          
          {/* Column 1: Supervisor / Verifier signature */}
          <div className="text-center space-y-4 flex flex-col items-center">
            <div className="space-y-1 text-slate-600">
              <p>Mengetahui & Mengesahkan,</p>
              <p className="font-bold text-slate-900">Kepala BPHL Wilayah XI,</p>
            </div>

            {signatureMode === 'digital' ? (
              laporan.status === 'approved' ? (
                <div className="flex flex-col items-center text-center relative pt-1 animate-in fade-in-30 duration-150">
                  {/* Simulated Stamp green mark over text */}
                  <div className="absolute -top-5 -right-5 w-16 h-8 border-2 border-emerald-500/30 text-emerald-500/50 rounded flex items-center justify-center text-[8px] font-mono font-bold tracking-wider transform rotate-12 select-none pointer-events-none">
                    APPROVED
                  </div>
                  
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      `Nama: ${verifierUser?.nama || 'Wahyu Dian, M.Sc.'}\nNIP: ${verifierUser?.nip || '19222222222200031000'}\nPangkat: ${verifierUser?.pangkat || '-'}\nJabatan: Kepala BPHL Wilayah XI`
                    )}`} 
                    alt="QR Code Kepala"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 mb-2 border border-slate-300 p-0.5 bg-white shadow-sm shrink-0 print:border-slate-500"
                  />

                  <p className="font-extrabold text-[#113a1a] underline">
                    {verifierUser?.nama || 'Wahyu Dian, M.Sc.'}
                  </p>
                  {verifierUser?.pangkat && verifierUser?.pangkat !== '-' && (
                    <p className="text-[10px] text-slate-600 leading-tight">
                      {verifierUser?.pangkat}
                    </p>
                  )}
                  <p className="font-mono text-[10px] text-slate-500">
                    NIP. {verifierUser?.nip || '19222222222200031000'}
                  </p>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center text-slate-400 italic text-[11px] font-sans border border-dashed border-slate-200 rounded p-1 w-36 mx-auto animate-in fade-in-30 duration-150">
                  Awaiting approval
                </div>
              )
            ) : (
              <div className="flex flex-col items-center text-center relative pt-1 animate-in fade-in-30 duration-150">
                <div className="h-16 w-32 flex items-end justify-center pb-2 relative select-none">
                  <div className="absolute inset-x-0 bottom-1 border-b border-dashed border-slate-300/60"></div>
                </div>

                <p className="font-extrabold text-slate-900 underline">
                  {verifierUser?.nama || 'Wahyu Dian, M.Sc.'}
                </p>
                <p className="text-[10px] text-slate-600 leading-tight">
                  {verifierUser?.pangkat || 'Pembina Tingkat I'}
                </p>
                <p className="font-mono text-[10px] text-slate-500">
                  NIP. {verifierUser?.nip || '19222222222200031000'}
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Center Digital validation QR Code replica */}
          <div className="flex flex-col items-center justify-center space-y-2 self-center text-center">
            <div className="w-16 h-16 border border-slate-300 p-1 flex items-center justify-center bg-slate-50">
              <div className="w-full h-full bg-slate-200 border border-slate-300 flex flex-wrap p-0.5 opacity-80">
                <div className="w-3 h-3 bg-slate-900 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-200 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-900 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-200 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-200 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-900 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-900 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-200 m-0.5"></div>
                <div className="w-3 h-3 bg-slate-900 m-0.5"></div>
              </div>
            </div>
            <span className="text-[8px] text-slate-500 font-bold font-mono tracking-tight text-center block">
              VALIDASI DIGITAL BPHL-XI
            </span>
          </div>

          {/* Column 3: Traveler signatures */}
          <div className="text-center space-y-4 flex flex-col items-center">
            <div className="space-y-1 text-slate-600">
              <p>Banjarbaru, {formatIndonesianDate(laporan.created_at || new Date().toISOString())}</p>
              <p className="font-bold text-slate-900">
                {pelaksanaList.length > 1 ? 'Tim Pelaksana Tugas:' : 'Pelaksana Tugas,'}
              </p>
            </div>
            
            <div className="space-y-6 w-full flex flex-col items-center">
              {pelaksanaList.length > 0 ? (
                pelaksanaList.map((user, idx) => {
                  const qrText = `Nama: ${user.nama}\nNIP: ${user.nip || '-'}\nPangkat: ${user.pangkat || '-'}\nJabatan: ${user.jabatan || '-'}`;
                  return (
                    <div key={user.id} className="flex flex-col items-center text-center">
                      {signatureMode === 'digital' ? (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrText)}`} 
                          alt={`QR Code ${user.nama}`}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 mb-2 border border-slate-300 p-0.5 bg-white shadow-sm shrink-0 print:border-slate-500"
                        />
                      ) : (
                        <div className="h-16 w-32 flex items-end justify-center pb-2 relative select-none">
                          <div className="absolute inset-x-0 bottom-1 border-b border-dashed border-slate-300/60"></div>
                        </div>
                      )}
                      <p className="font-extrabold text-slate-900 underline">
                        {pelaksanaList.length > 1 ? `${idx + 1}. ` : ''}{user.nama}
                      </p>
                      {user.pangkat && user.pangkat !== '-' && (
                        <p className="text-[10px] text-slate-600 leading-tight">
                          {user.pangkat}
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-slate-500">
                        NIP. {user.nip || '-'}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center text-center">
                  {signatureMode === 'digital' ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        `Nama: ${ownerUser?.nama || 'Iman Tochid, S.Hut.'}\nNIP: ${ownerUser?.nip || '199406072022031000'}\nPangkat: ${ownerUser?.pangkat || '-'}\nJabatan: ${ownerUser?.jabatan || '-'}`
                      )}`} 
                      alt="QR Code Pelaksana"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 mb-2 border border-slate-300 p-0.5 bg-white shadow-sm shrink-0 print:border-slate-500"
                    />
                  ) : (
                    <div className="h-16 w-32 flex items-end justify-center pb-2 relative select-none">
                      <div className="absolute inset-x-0 bottom-1 border-b border-dashed border-slate-300/60"></div>
                    </div>
                  )}
                  <p className="font-extrabold text-slate-900 underline">
                    {ownerUser?.nama || 'Iman Tochid, S.Hut.'}
                  </p>
                  {ownerUser?.pangkat && ownerUser?.pangkat !== '-' && (
                    <p className="text-[10px] text-slate-600 leading-tight">
                      {ownerUser?.pangkat}
                    </p>
                  )}
                  <p className="font-mono text-[10px] text-slate-500">
                    NIP. {ownerUser?.nip || '199406072022031000'}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ATTACHED DOKUMENTASI GALLERY INSIDE A4 - MOVED TO A SEPARATE PAGE AFTER SIGNATURES */}
        {laporan.lampiran.length > 0 && includeAttachments && (
          <div 
            className="mt-12 pt-8 border-t border-slate-200 break-before-page page-break-before-always"
            style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
          >
            <h5 className="font-bold text-slate-950 text-xs uppercase mb-3 font-mono tracking-tight">
              FOTO DOKUMENTASI KEGIATAN
            </h5>
            <div className="grid grid-cols-2 gap-4">
              {laporan.lampiran.map((lamp, idx) => (
                <div key={lamp.id} className="border border-slate-300 p-2 rounded bg-slate-50 text-center space-y-1">
                  {lamp.tipe === 'foto' ? (
                    <img 
                      src={lamp.dataUrl} 
                      alt={lamp.nama_file} 
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-cover rounded border border-slate-200" 
                    />
                  ) : (
                    <div className="w-full h-36 bg-slate-200 rounded flex items-center justify-center font-bold text-slate-500">
                      PDF DOKUMEN LAPORAN
                    </div>
                  )}
                  <p className="text-[10px] text-slate-600 font-mono truncate">{lamp.nama_file}</p>
                  <p className="text-[9px] text-slate-400">Lampiran Foto {idx + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
