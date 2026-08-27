import { useState, useEffect, ChangeEvent } from 'react';
import { Laporan, JenisKegiatan, User, Lampiran, PelakuUsaha } from '../types';
import { 
  Calendar, MapPin, Users, FileText, ArrowLeft, ArrowRight, Save, 
  Send, User as UserIcon, Plus, Trash2, HelpCircle, ImageIcon, CheckCircle, Image, Sparkles, Brain
} from 'lucide-react';
import { sortRegulations, sortPelaksana, sortPelaksanaDinas, getApiHeaders } from '../lib/utils';
import { uploadToSupabaseStorage, isSupabaseConfigured } from '../lib/supabase';

interface LaporanFormProps {
  jenisKegiatanList: JenisKegiatan[];
  allUsers: User[];
  currentUser: User;
  onSave: (laporan: Laporan) => void;
  onCancel: () => void;
  editingLaporan?: Laporan;
  pelakuUsahaList: PelakuUsaha[];
  onShowToast?: (msg: string) => void;
}

export default function LaporanForm({
  jenisKegiatanList,
  allUsers,
  currentUser,
  onSave,
  onCancel,
  editingLaporan,
  pelakuUsahaList,
  onShowToast,
}: LaporanFormProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [jenisKegiatanId, setJenisKegiatanId] = useState('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [tempat, setTempat] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [pelaksanaIds, setPelaksanaIds] = useState<string[]>([currentUser.id]);
  const [sasaran, setSasaran] = useState('');
  const [maksudTujuan, setMaksudTujuan] = useState('');
  
  // New template fields
  const [pelakuUsahaId, setPelakuUsahaId] = useState('');
  const [customPlaceholders, setCustomPlaceholders] = useState<Record<string, string>>({});
  const [metodePelaksanaan, setMetodePelaksanaan] = useState('');
  const [hasilDataUmum, setHasilDataUmum] = useState('');
  const [hasilPoinPenting, setHasilPoinPenting] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [hasil, setHasil] = useState('');
  const [kesimpulan, setKesimpulan] = useState('');
  const [saran, setSaran] = useState('');
  const [lampiranList, setLampiranList] = useState<Lampiran[]>([]);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper formatting for Indonesian dates in laws list representation
  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '[Tanggal]';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getPlaceholdersFromTemplates = (prog: JenisKegiatan) => {
    const regex = /\(([^)]+)\)/g;
    const found: string[] = [];
    
    const scan = (text: string) => {
      let match;
      // Reset regex index
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        const ph = match[1];
        // Skip default and specific database pre-filled placeholders
        const dbFields = [
          'pelaku_usaha', 'lokasi', 'jenis_usaha', 'slk_no', 'slk_tanggal',
          'sk_pbph_no', 'sk_pbph_tanggal', 'luas_areal', 'sk_rkuph_no', 'sk_rkuph_tanggal',
          'slk_masa_berlaku', 'slk_penerbit', 'rktph_tahun', 'sk_rktph_no', 'sk_rktph_tanggal',
          'luas_rktph', 'target_rktph_jenis', 'target_rktph_hhbk_jenis',
          'sk_pbphh_no', 'sk_pbphh_tanggal', 'kapasitas_produksi_jenis'
        ];
        if (!dbFields.includes(ph)) {
          if (!found.includes(ph)) {
            found.push(ph);
          }
        }
      }
    };

    if (prog.template_hasil_data_umum) scan(prog.template_hasil_data_umum);
    if (prog.template_hasil_poin_penting) scan(prog.template_hasil_poin_penting);

    return found;
  };

  const compileReportContent = (
    progId: string, 
    puId: string, 
    placeholders: Record<string, string>
  ) => {
    const selectedProgram = jenisKegiatanList.find(jk => jk.id === progId);
    if (!selectedProgram) return { dataUmum: '', poinPenting: '', full: '' };

    const selectedPu = pelakuUsahaList.find(pu => pu.id === puId);

    // 1. Data Umum
    let dataUmum = selectedProgram.template_hasil_data_umum || '';
    if (selectedPu) {
      dataUmum = dataUmum
        .replace(/\(pelaku_usaha\)/g, selectedPu.nama)
        .replace(/\(lokasi\)/g, selectedPu.alamat)
        .replace(/\(jenis_usaha\)/g, selectedPu.jenis_usaha)
        .replace(/\(slk_no\)/g, selectedPu.slk_no)
        .replace(/\(slk_tanggal\)/g, formatIndonesianDate(selectedPu.slk_tanggal))
        
        // PBPH placeholders
        .replace(/\(sk_pbph_no\)/g, selectedPu.sk_pbph_no || '-')
        .replace(/\(sk_pbph_tanggal\)/g, selectedPu.sk_pbph_tanggal ? formatIndonesianDate(selectedPu.sk_pbph_tanggal) : '-')
        .replace(/\(luas_areal\)/g, selectedPu.luas_areal || '-')
        .replace(/\(sk_rkuph_no\)/g, selectedPu.sk_rkuph_no || '-')
        .replace(/\(sk_rkuph_tanggal\)/g, selectedPu.sk_rkuph_tanggal ? formatIndonesianDate(selectedPu.sk_rkuph_tanggal) : '-')
        .replace(/\(slk_masa_berlaku\)/g, selectedPu.slk_masa_berlaku ? formatIndonesianDate(selectedPu.slk_masa_berlaku) : '-')
        .replace(/\(slk_penerbit\)/g, selectedPu.slk_penerbit || '-')
        .replace(/\(rktph_tahun\)/g, selectedPu.rktph_tahun || '-')
        .replace(/\(sk_rktph_no\)/g, selectedPu.sk_rktph_no || '-')
        .replace(/\(sk_rktph_tanggal\)/g, selectedPu.sk_rktph_tanggal ? formatIndonesianDate(selectedPu.sk_rktph_tanggal) : '-')
        .replace(/\(luas_rktph\)/g, selectedPu.luas_rktph || '-')
        .replace(/\(target_rktph_jenis\)/g, selectedPu.target_rktph_jenis || '-')
        .replace(/\(target_rktph_hhbk_jenis\)/g, selectedPu.target_rktph_hhbk_jenis || '-')

        // PBPHH placeholders
        .replace(/\(sk_pbphh_no\)/g, selectedPu.sk_pbphh_no || '-')
        .replace(/\(sk_pbphh_tanggal\)/g, selectedPu.sk_pbphh_tanggal ? formatIndonesianDate(selectedPu.sk_pbphh_tanggal) : '-')
        .replace(/\(kapasitas_produksi_jenis\)/g, selectedPu.kapasitas_produksi_jenis || '-');
    }

    // Replace other placeholders in Data Umum
    Object.entries(placeholders).forEach(([key, val]) => {
      dataUmum = dataUmum.replace(new RegExp(`\\(${key}\\)`, 'g'), val || `(${key})`);
    });

    // 2. Poin Penting
    let poinPenting = selectedProgram.template_hasil_poin_penting || '';
    if (selectedPu) {
      poinPenting = poinPenting
        .replace(/\(pelaku_usaha\)/g, selectedPu.nama)
        .replace(/\(lokasi\)/g, selectedPu.alamat)
        .replace(/\(jenis_usaha\)/g, selectedPu.jenis_usaha)
        .replace(/\(slk_no\)/g, selectedPu.slk_no)
        .replace(/\(slk_tanggal\)/g, formatIndonesianDate(selectedPu.slk_tanggal))
        
        // PBPH placeholders
        .replace(/\(sk_pbph_no\)/g, selectedPu.sk_pbph_no || '-')
        .replace(/\(sk_pbph_tanggal\)/g, selectedPu.sk_pbph_tanggal ? formatIndonesianDate(selectedPu.sk_pbph_tanggal) : '-')
        .replace(/\(luas_areal\)/g, selectedPu.luas_areal || '-')
        .replace(/\(sk_rkuph_no\)/g, selectedPu.sk_rkuph_no || '-')
        .replace(/\(sk_rkuph_tanggal\)/g, selectedPu.sk_rkuph_tanggal ? formatIndonesianDate(selectedPu.sk_rkuph_tanggal) : '-')
        .replace(/\(slk_masa_berlaku\)/g, selectedPu.slk_masa_berlaku ? formatIndonesianDate(selectedPu.slk_masa_berlaku) : '-')
        .replace(/\(slk_penerbit\)/g, selectedPu.slk_penerbit || '-')
        .replace(/\(rktph_tahun\)/g, selectedPu.rktph_tahun || '-')
        .replace(/\(sk_rktph_no\)/g, selectedPu.sk_rktph_no || '-')
        .replace(/\(sk_rktph_tanggal\)/g, selectedPu.sk_rktph_tanggal ? formatIndonesianDate(selectedPu.sk_rktph_tanggal) : '-')
        .replace(/\(luas_rktph\)/g, selectedPu.luas_rktph || '-')
        .replace(/\(target_rktph_jenis\)/g, selectedPu.target_rktph_jenis || '-')
        .replace(/\(target_rktph_hhbk_jenis\)/g, selectedPu.target_rktph_hhbk_jenis || '-')

        // PBPHH placeholders
        .replace(/\(sk_pbphh_no\)/g, selectedPu.sk_pbphh_no || '-')
        .replace(/\(sk_pbphh_tanggal\)/g, selectedPu.sk_pbphh_tanggal ? formatIndonesianDate(selectedPu.sk_pbphh_tanggal) : '-')
        .replace(/\(kapasitas_produksi_jenis\)/g, selectedPu.kapasitas_produksi_jenis || '-');
    }

    Object.entries(placeholders).forEach(([key, val]) => {
      poinPenting = poinPenting.replace(new RegExp(`\\(${key}\\)`, 'g'), val || `(${key})`);
    });

    const fullResult = `A. DATA UMUM OBYEK KEGIATAN\n${dataUmum}\n\nB. TEMUAN PENTING KEGIATAN\n${poinPenting}`;

    return {
      dataUmum,
      poinPenting,
      full: fullResult
    };
  };

  // Populate form if editing
  useEffect(() => {
    if (editingLaporan) {
      setJenisKegiatanId(editingLaporan.jenis_kegiatan_id);
      setNomorSurat(editingLaporan.nomor_surat_tugas);
      setTanggalSurat(editingLaporan.tanggal_surat_tugas);
      setTempat(editingLaporan.tempat_kegiatan);
      setTglMulai(editingLaporan.tanggal_mulai);
      setTglSelesai(editingLaporan.tanggal_selesai);
      setPelaksanaIds(editingLaporan.pelaksana_ids);
      setSasaran(editingLaporan.sasaran_kegiatan);
      setMaksudTujuan(editingLaporan.maksud_tujuan);
      setHasil(editingLaporan.hasil_kegiatan);
      setKesimpulan(editingLaporan.kesimpulan);
      setSaran(editingLaporan.saran);
      setLampiranList(editingLaporan.lampiran);

      // Populate new template fields
      setPelakuUsahaId(editingLaporan.pelaku_usaha_id || '');
      setCustomPlaceholders(editingLaporan.custom_placeholders || {});
      setMetodePelaksanaan(editingLaporan.metode_pelaksanaan || '');
      setHasilDataUmum(editingLaporan.hasil_data_umum || '');
      setHasilPoinPenting(editingLaporan.hasil_poin_penting || '');
    } else {
      // Default to first active program
      const activePrograms = jenisKegiatanList.filter(jk => jk.is_active);
      if (activePrograms.length > 0) {
        handleProgramChange(activePrograms[0].id);
      }
    }
  }, [editingLaporan, jenisKegiatanList]);

  // Sync compilation
  useEffect(() => {
    if (jenisKegiatanId) {
      const compiled = compileReportContent(jenisKegiatanId, pelakuUsahaId, customPlaceholders);
      setHasilDataUmum(compiled.dataUmum);
      setHasilPoinPenting(compiled.poinPenting);
      setHasil(compiled.full);
    }
  }, [pelakuUsahaId, customPlaceholders, jenisKegiatanId]);

  const getDefaultLocation = (pu: PelakuUsaha) => {
    const alamatParts = pu.alamat.split(',');
    const regencyName = alamatParts[0]?.trim() || '';
    
    let regencyLabel = 'Kabupaten';
    const lowerRegency = regencyName.toLowerCase();
    if (lowerRegency.startsWith('kota') || lowerRegency === 'banjarmasin' || lowerRegency === 'banjarbaru') {
      if (lowerRegency.startsWith('kota')) {
        regencyLabel = ''; // already has "Kota"
      } else {
        regencyLabel = 'Kota';
      }
    }
    
    const displayRegency = regencyLabel ? `${regencyLabel} ${regencyName}` : regencyName;
    return `${pu.nama} di ${displayRegency}, Provinsi Kalimantan Selatan`;
  };

  const handlePelakuUsahaChange = (puId: string) => {
    setPelakuUsahaId(puId);
    const selectedPu = pelakuUsahaList.find(p => p.id === puId);
    if (selectedPu) {
      setTempat(getDefaultLocation(selectedPu));
    }
  };

  // Autofill logic when travel program changes
  const handleProgramChange = (id: string) => {
    setJenisKegiatanId(id);
    const selectedProgram = jenisKegiatanList.find(jk => jk.id === id);
    if (selectedProgram) {
      setMaksudTujuan(selectedProgram.maksud_tujuan);
      setSasaran(selectedProgram.sasaran_kegiatan || '');
      setMetodePelaksanaan(selectedProgram.metode_pelaksanaan || '');
      
      const phList = getPlaceholdersFromTemplates(selectedProgram);
      const initialPh: Record<string, string> = {};
      phList.forEach(ph => {
        initialPh[ph] = '';
      });
      setCustomPlaceholders(initialPh);

      const activePu = pelakuUsahaList.filter(p => p.is_active);
      if (activePu.length > 0) {
        setPelakuUsahaId(activePu[0].id);
        setTempat(getDefaultLocation(activePu[0]));
        const compiled = compileReportContent(id, activePu[0].id, initialPh);
        setHasilDataUmum(compiled.dataUmum);
        setHasilPoinPenting(compiled.poinPenting);
        setHasil(compiled.full);
      } else {
        const compiled = compileReportContent(id, '', initialPh);
        setHasilDataUmum(compiled.dataUmum);
        setHasilPoinPenting(compiled.poinPenting);
        setHasil(compiled.full);
      }
    }
  };

  // Generate real-time preview of the dynamic regulations (Dasar Pelaksanaan)
  const currentProgram = jenisKegiatanList.find(jk => jk.id === jenisKegiatanId);
  let generatedRegulations: string[] = [];
  if (currentProgram) {
    // Row 1 is automatically generated using the inputted Nomor and Tanggal Surat Tugas
    const liveNomorStr = nomorSurat.trim() || '[Nomor Surat Tugas]';
    const liveTanggalStr = formatIndonesianDate(tanggalSurat);
    const rawRegulations = [
      `Surat Tugas Kepala BPHL Wilayah XI Banjarbaru Nomor: ${liveNomorStr} Tanggal ${liveTanggalStr}.`,
      ...currentProgram.dasar_hukum
    ];
    generatedRegulations = sortRegulations(rawRegulations);
  }

  // Handle multi-select for travelers
  const togglePelaksana = (id: string) => {
    if (pelaksanaIds.includes(id)) {
      if (pelaksanaIds.length > 1) {
        setPelaksanaIds(pelaksanaIds.filter(pid => pid !== id));
      }
    } else {
      setPelaksanaIds([...pelaksanaIds, id]);
    }
  };

  // Attachment Upload with Supabase Storage, Server Disk File Storage & Base64 Fallback
  const handleUploadSimulated = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawResult = reader.result as string;
        let finalUrl = rawResult;
        
        // 1. Try Supabase Storage Bucket first if configured
        if (isSupabaseConfigured) {
          const { url: supabaseUrl, error: supaErr } = await uploadToSupabaseStorage(file, file.name);
          if (supabaseUrl && !supaErr) {
            finalUrl = supabaseUrl;
          }
        }
        
        // 2. Fallback to server local disk upload /api/upload if Supabase wasn't used or failed
        if (finalUrl === rawResult) {
          try {
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({
                fileName: file.name,
                dataUrl: rawResult
              })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.url) {
                finalUrl = data.url;
              }
            }
          } catch (err) {
            console.warn("Upload ke disk server gagal, beralih ke simpan lokal DataURL:", err);
          }
        }

        const newLampiran: Lampiran = {
          id: 'lamp-' + Date.now() + Math.random().toString(36).substring(2, 7),
          nama_file: file.name,
          dataUrl: finalUrl,
          tipe: file.type.startsWith('image/') ? 'foto' : 'dokumen',
          ukuran: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        };

        setLampiranList(prev => [...prev, newLampiran]);
        if (onShowToast) {
          onShowToast(`Berkas "${file.name}" berhasil diunggah!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };



  const removeLampiran = (id: string) => {
    setLampiranList(prev => prev.filter(lamp => lamp.id !== id));
  };

  // Basic step verification logic
  const handleNextStep = () => {
    const stepErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!jenisKegiatanId) stepErrors.jenisKegiatanId = 'Jenis kegiatan penugasan wajib dipilih';
      if (!nomorSurat.trim()) stepErrors.nomorSurat = 'Nomor Surat Tugas SK/ST wajib diisi';
      if (!tanggalSurat) stepErrors.tanggalSurat = 'Tanggal persetujuan Surat Tugas wajib diisi';
      if (!sasaran.trim()) stepErrors.sasaran = 'Sasaran strategis kegiatan dinas wajib dijabarkan';
    } else if (currentStep === 2) {
      if (!tempat.trim()) stepErrors.tempat = 'Tempat atau lokasi tujuan perjalanan dinas wajib diisi';
      if (!tglMulai) stepErrors.tglMulai = 'Tanggal keberangkatan wajib berkisar nyata';
      if (!tglSelesai) stepErrors.tglSelesai = 'Tanggal kepulangan wajib diatur';
      if (tglMulai && tglSelesai && new Date(tglMulai) > new Date(tglSelesai)) {
        stepErrors.tglSelesai = 'Tanggal selesai tidak boleh mendahului tanggal mulai';
      }
      if (pelaksanaIds.length === 0) stepErrors.pelaksana = 'Minimal harus memiliki satu orang pelaksana dinas';
    } else if (currentStep === 3) {
      if (!maksudTujuan.trim()) stepErrors.maksudTujuan = 'Maksud dan tujuan kegiatan wajib diisi';
      if (!hasil.trim()) stepErrors.hasil = 'Hasil rinci pencapaian di lapangan wajib diisi';
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      // scroll to first error
      const firstErrorKey = Object.keys(stepErrors)[0];
      const errorEl = document.getElementsByName(firstErrorKey)[0];
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setErrors({});
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleGenerateKesimpulanAi = async () => {
    if (!hasil.trim()) {
      if (onShowToast) {
        onShowToast("Silakan isi Hasil Kegiatan terlebih dahulu agar AI dapat menganalisis pembahasan.");
      } else {
        console.warn("Silakan isi Hasil Kegiatan terlebih dahulu agar AI dapat menganalisis pembahasan.");
      }
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/generate-ai", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          type: "kesimpulan",
          pembahasan: hasil
        })
      });
      if (!res.ok) {
        throw new Error(`Gagal memanggil API generate: ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respons dari server bukan berformat JSON.");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setKesimpulan(data.text);
      if (onShowToast) {
        onShowToast("Kesimpulan berhasil dibuat oleh AI!");
      }
    } catch (err: any) {
      console.error(err);
      if (onShowToast) {
        onShowToast(`Gagal membuat kesimpulan AI: ${err.message}`);
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateRekomendasiAi = async () => {
    if (!hasil.trim()) {
      if (onShowToast) {
        onShowToast("Silakan isi Hasil Kegiatan terlebih dahulu agar AI dapat menganalisis pembahasan.");
      } else {
        console.warn("Silakan isi Hasil Kegiatan terlebih dahulu agar AI dapat menganalisis pembahasan.");
      }
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/generate-ai", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          type: "rekomendasi",
          pembahasan: hasil,

          kesimpulan: kesimpulan
        })
      });
      if (!res.ok) {
        throw new Error(`Gagal memanggil API generate: ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respons dari server bukan berformat JSON.");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSaran(data.text);
      if (onShowToast) {
        onShowToast("Rekomendasi berhasil dibuat oleh AI!");
      }
    } catch (err: any) {
      console.error(err);
      if (onShowToast) {
        onShowToast(`Gagal membuat rekomendasi AI: ${err.message}`);
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmitForm = (status: 'draft' | 'submitted') => {
    // Validate entire form before final save
    const finalErrors: Record<string, string> = {};
    if (!jenisKegiatanId) finalErrors.jenisKegiatanId = 'Jenis kegiatan wajib dipilih';
    if (!nomorSurat.trim()) finalErrors.nomorSurat = 'Nomor Surat Tugas wajib diisi';
    if (!tanggalSurat) finalErrors.tanggalSurat = 'Tanggal Surat Tugas wajib diisi';
    if (!tempat.trim()) finalErrors.tempat = 'Tempat kegiatan wajib diisi';
    if (!tglMulai) finalErrors.tglMulai = 'Tanggal mulai wajib diisi';
    if (!tglSelesai) finalErrors.tglSelesai = 'Tanggal selesai wajib diisi';
    if (!sasaran.trim()) finalErrors.sasaran = 'Sasaran kegiatan wajib diisi';
    if (!maksudTujuan.trim()) finalErrors.maksudTujuan = 'Maksud & tujuan wajib diisi';
    if (!hasil.trim()) finalErrors.hasil = 'Hasil kegiatan wajib diisi';
    if (!kesimpulan.trim()) finalErrors.kesimpulan = 'Kesimpulan laporan wajib diisi';

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      // Go to first step with error
      if (finalErrors.jenisKegiatanId || finalErrors.nomorSurat || finalErrors.tanggalSurat) {
        setCurrentStep(1);
      } else if (finalErrors.tempat || finalErrors.tglMulai || finalErrors.tglSelesai) {
        setCurrentStep(2);
      } else if (finalErrors.sasaran || finalErrors.maksudTujuan || finalErrors.hasil) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
      return;
    }

    // Sort pelaksana IDs based on user rank & position hierarchy before saving
    const sortedPelaksanaUsers = sortPelaksanaDinas(
      allUsers.filter(u => pelaksanaIds.includes(u.id))
    );
    const sortedPelaksanaIds = sortedPelaksanaUsers.map(u => u.id);

    const payload: Laporan = {
      id: editingLaporan?.id || 'rep-' + Date.now(),
      user_id: editingLaporan?.user_id || currentUser.id,
      jenis_kegiatan_id: jenisKegiatanId,
      nomor_surat_tugas: nomorSurat.trim(),
      tanggal_surat_tugas: tanggalSurat,
      tempat_kegiatan: tempat.trim(),
      tanggal_mulai: tglMulai,
      tanggal_selesai: tglSelesai,
      pelaksana_ids: sortedPelaksanaIds,
      sasaran_kegiatan: sasaran.trim(),
      maksud_tujuan: maksudTujuan.trim(),
      metode_pelaksanaan: metodePelaksanaan.trim(),
      hasil_data_umum: hasilDataUmum.trim(),
      hasil_poin_penting: hasilPoinPenting.trim(),
      pelaku_usaha_id: pelakuUsahaId,
      custom_placeholders: customPlaceholders,
      hasil_kegiatan: hasil.trim(),
      kesimpulan: kesimpulan.trim(),
      saran: saran.trim(),
      status, // 'draft' or 'submitted'
      lampiran: lampiranList,
      created_at: editingLaporan?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // carry over verification data if already present
      ...(editingLaporan?.catatan_verifikator && { catatan_verifikator: editingLaporan.catatan_verifikator }),
      ...(editingLaporan?.verifikator_id && { verifikator_id: editingLaporan.verifikator_id }),
      ...(editingLaporan?.submitted_at && { submitted_at: editingLaporan.submitted_at }),
      ...(editingLaporan?.verified_at && { verified_at: editingLaporan.verified_at }),
    };

    if (status === 'submitted') {
      payload.submitted_at = new Date().toISOString();
    }

    onSave(payload);
  };

  const stepClasses = (stepNum: number) => {
    if (currentStep === stepNum) return 'bg-amber-500 text-slate-950 font-bold border-amber-500';
    if (currentStep > stepNum) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      
      {/* Header with back button */}
      <div className="flex items-center justify-between border-b border-[#22293f] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {editingLaporan ? 'Ubah Laporan Perjalanan Dinas' : 'Form Pengisian LPD Baru'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {editingLaporan ? `ID: ${editingLaporan.id}` : 'Template Digital cascade'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmitForm('draft')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Draft
          </button>
          <button
            onClick={() => handleSubmitForm('submitted')}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim ke Atasan
          </button>
        </div>
      </div>

      {/* Verification Revision Note Alert */}
      {editingLaporan?.status === 'revision' && editingLaporan.catatan_verifikator && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/25 rounded-xl space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-purple-400 font-mono uppercase">
            Catatan Perbaikan dari Atasan / Verifikator:
          </span>
          <p className="text-xs text-purple-200 leading-relaxed italic">
            "{editingLaporan.catatan_verifikator}"
          </p>
        </div>
      )}

      {/* Multi-step progress tracker with BMW M Design */}
      <div className="bg-[#1a1a1a] rounded-none p-5 shadow-2xl border border-[#3c3c3c]">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#1c69d4] uppercase">
              LANGKAH {currentStep} DARI 4
            </span>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              {currentStep === 1 && '1. JENIS PENUGASAN & SURAT TUGAS'}
              {currentStep === 2 && '2. LOKASI & TIM PELAKSANA'}
              {currentStep === 3 && '3. FORMULASI & HASIL KEGIATAN'}
              {currentStep === 4 && '4. DOKUMENTASI & PENGESAHAN'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-white">
              {Math.round((currentStep / 4) * 100)}%
            </span>
            <span className="text-[9px] text-[#7e7e7e] block font-mono uppercase">SELESAI</span>
          </div>
        </div>

        {/* M Tricolor Progress Bar */}
        <div className="w-full h-1.5 bg-[#0d0d0d] rounded-none overflow-hidden mb-4 border border-[#262626]">
          <div
            className="h-full m-stripe-bg transition-all duration-300 ease-out rounded-none"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Step Items */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { num: 1, label: 'Kategori & Surat', desc: 'SPT & Dasar Hukum' },
            { num: 2, label: 'Lokus & Tim', desc: 'Lokasi & Pelaksana' },
            { num: 3, label: 'Isi & Formulasi', desc: 'Hasil & AI Generator' },
            { num: 4, label: 'Dokumentasi', desc: 'Lampiran & Review' },
          ].map((s) => {
            const isPassed = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num <= currentStep) {
                    setCurrentStep(s.num);
                  }
                }}
                disabled={s.num > currentStep}
                className={`flex items-center gap-2.5 p-2.5 rounded-none border text-left transition-all ${
                  isCurrent
                    ? 'bg-[#0d0d0d] border-[#1c69d4] text-white shadow-lg'
                    : isPassed
                    ? 'bg-[#1a1a1a] border-[#3c3c3c] text-white hover:bg-[#262626] cursor-pointer'
                    : 'bg-[#0d0d0d]/40 border-[#262626] text-[#7e7e7e] cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-none flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-[#1c69d4] text-white font-mono'
                      : isPassed
                      ? 'bg-[#262626] text-white border border-[#3c3c3c]'
                      : 'bg-[#0d0d0d] text-[#7e7e7e]'
                  }`}
                >
                  {isPassed ? <CheckCircle className="w-4 h-4 text-[#0fa336]" /> : s.num}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className={`text-[11px] font-bold uppercase truncate tracking-wider ${isCurrent ? 'text-white' : isPassed ? 'text-[#bbbbbb]' : 'text-[#7e7e7e]'}`}>
                    {s.label}
                  </p>
                  <p className="text-[9px] text-[#7e7e7e] font-mono truncate">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Area panel */}
      <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 shadow-2xl">
        
        {/* ================= STEP 1: BASIS PROGRAM & SURAT TUGAS ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                LANGKAH 1: JENIS PENUGASAN & DASAR HUKUM
              </h3>
              <p className="text-xs text-[#bbbbbb] font-light mt-1">
                Pilih jenis penugasan di bawah. Sistem mengimpor dan memformat dasar pelaksanaan resmi secara otomatis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jenis Program selector dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  PROGRAM / JENIS KEGIATAN <span className="text-[#e22718]">*</span>
                </label>
                <select
                  name="jenisKegiatanId"
                  value={jenisKegiatanId}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  className="bmw-input w-full py-3 font-sans text-xs text-white cursor-pointer"
                >
                  <option value="" disabled className="bg-[#1a1a1a]">-- Pilih Kategori Tugas --</option>
                  {jenisKegiatanList.map((jk) => (
                    <option key={jk.id} value={jk.id} className="bg-[#1a1a1a] text-white">
                      {jk.nama_kegiatan}
                    </option>
                  ))}
                </select>
                {errors.jenisKegiatanId && (
                  <p className="text-[10px] text-[#e22718] font-mono">{errors.jenisKegiatanId}</p>
                )}
              </div>

              {/* Tips block */}
              <div className="bg-[#0d0d0d] p-3.5 border border-[#3c3c3c] rounded-none text-xs text-[#bbbbbb] font-light leading-relaxed self-center">
                <span className="font-bold text-white uppercase tracking-wider block mb-1 font-mono">CASCADE TEMPLATE ENGINE:</span>
                Setiap kali program diubah, form Dasar Pelaksanaan & template Hasil Kegiatan akan terisi otomatis secara real-time.
              </div>
            </div>

            {/* Sasaran Kegiatan Field */}
            <div className="space-y-2 bg-[#0d0d0d] border border-[#262626] rounded-none p-4">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                SASARAN KEGIATAN <span className="text-[#e22718]">*</span>
              </label>
              <textarea
                name="sasaran"
                value={sasaran}
                onChange={(e) => setSasaran(e.target.value)}
                placeholder="Sasaran kegiatan ini terisi otomatis berdasarkan master data jenis kegiatan..."
                rows={2.5}
                className="bmw-input w-full leading-relaxed font-sans"
              />
              {errors.sasaran && (
                <p className="text-[10px] text-[#e22718] font-mono">{errors.sasaran}</p>
              )}
            </div>

            {/* Surat Tugas parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  NOMOR SURAT TUGAS <span className="text-[#e22718]">*</span>
                </label>
                <input
                  type="text"
                  name="nomorSurat"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="Contoh: ST.108/BPHL-XI/TNL/2026"
                  className="bmw-input w-full font-mono text-xs"
                />
                {errors.nomorSurat && (
                  <p className="text-[10px] text-[#e22718] font-mono">{errors.nomorSurat}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  TANGGAL SURAT TUGAS <span className="text-[#e22718]">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalSurat"
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="bmw-input w-full font-mono text-xs"
                />
                {errors.tanggalSurat && (
                  <p className="text-[10px] text-[#e22718] font-mono">{errors.tanggalSurat}</p>
                )}
              </div>
            </div>

            {/* Real-time preview of Laws generation */}
            <div className="space-y-2 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none p-4">
              <span className="text-[10px] text-white font-bold uppercase tracking-widest font-mono block mb-1">
                PRATINJAU DASAR PELAKSANAAN LPD:
              </span>
              <ul className="space-y-1.5 list-decimal list-inside text-xs text-[#bbbbbb] font-light">
                {generatedRegulations.map((reg, index) => (
                  <li key={index} className={`leading-relaxed ${index === 0 ? 'text-white font-mono font-bold' : ''}`}>
                    {reg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ================= STEP 2: LOKUS (LOCATION) & TIM PELAKSANA ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                LANGKAH 2: LOKASI PENUGASAN & TIM PELAKSANA
              </h3>
              <p className="text-xs text-[#bbbbbb] font-light mt-1">
                Petakan lokasi target serta tentukan staf kementerian yang berangkat.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                TEMPAT / LOKASI KEGIATAN <span className="text-[#e22718]">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#7e7e7e]" />
                <textarea
                  name="tempat"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  placeholder="Contoh: Kantor Utama PBPH PT. Kayu Rimba Sejahtera, Tapin, Kalimantan Selatan"
                  rows={2}
                  className="bmw-input w-full pl-9 leading-relaxed font-sans"
                />
              </div>
              {errors.tempat && (
                <p className="text-[10px] text-[#e22718] font-mono">{errors.tempat}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  TANGGAL BERANGKAT <span className="text-[#e22718]">*</span>
                </label>
                <input
                  type="date"
                  name="tglMulai"
                  value={tglMulai}
                  onChange={(e) => setTglMulai(e.target.value)}
                  className="bmw-input w-full font-mono text-xs"
                />
                {errors.tglMulai && (
                  <p className="text-[10px] text-[#e22718] font-mono">{errors.tglMulai}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  TANGGAL KEMBALI <span className="text-[#e22718]">*</span>
                </label>
                <input
                  type="date"
                  name="tglSelesai"
                  value={tglSelesai}
                  onChange={(e) => setTglSelesai(e.target.value)}
                  className="bmw-input w-full font-mono text-xs"
                />
                {errors.tglSelesai && (
                  <p className="text-[10px] text-[#e22718] font-mono">{errors.tglSelesai}</p>
                )}
              </div>
            </div>

            {/* Tim Pelaksana (Multi-Select) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                TIM PELAKSANA (MULTI-PILIH) <span className="text-[#e22718]">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {sortPelaksana(allUsers).map((u) => {
                  const isChecked = pelaksanaIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => togglePelaksana(u.id)}
                      className={`flex items-start gap-3 p-3 rounded-none border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-[#0d0d0d] border-[#1c69d4] text-white shadow-md'
                          : 'bg-[#1a1a1a] border-[#262626] text-[#bbbbbb] hover:border-[#3c3c3c]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 pointer-events-none rounded-none accent-[#1c69d4]"
                      />
                      <div className="flex flex-col text-xs leading-none space-y-1">
                        <span className="font-bold uppercase font-sans text-white">{u.nama}</span>
                        <span className="font-mono text-[9px] text-[#7e7e7e]">NIP. {u.nip}</span>
                        <span className="text-[9px] text-[#bbbbbb] font-light">
                          {u.pangkat && u.pangkat !== '-' ? `${u.pangkat} (${u.golongan}) — ` : ''}{u.jabatan}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.pelaksana && (
                <p className="text-[10px] text-[#e22718] font-mono">{errors.pelaksana}</p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 3: ISI & DYNAMIC FORMULASI ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                LANGKAH 3: FORMULASI & HASIL KEGIATAN
              </h3>
              <p className="text-xs text-[#bbbbbb] font-light mt-1">
                Kandungan deskriptif LPD disarikan di bawah sesuai standar kementerian.
              </p>
            </div>

            {/* Maksud & Tujuan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                MAKSUD & TUJUAN <span className="text-[#e22718]">*</span>
              </label>
              <textarea
                name="maksudTujuan"
                value={maksudTujuan}
                onChange={(e) => setMaksudTujuan(e.target.value)}
                rows={3}
                className="bmw-input w-full leading-relaxed font-sans"
              />
              {errors.maksudTujuan && (
                <p className="text-[10px] text-[#e22718] font-mono">{errors.maksudTujuan}</p>
              )}
            </div>

            {/* Metode Pelaksanaan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                METODE PELAKSANAAN <span className="text-[#e22718]">*</span>
              </label>
              <textarea
                value={metodePelaksanaan}
                onChange={(e) => setMetodePelaksanaan(e.target.value)}
                rows={3}
                className="bmw-input w-full leading-relaxed font-sans"
              />
            </div>

            {/* Pelaku Usaha Selector & Dynamic Template Compiler */}
            {currentProgram && (currentProgram.template_hasil_data_umum || currentProgram.template_hasil_poin_penting) && (
              <div className="p-4 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none space-y-4">
                <div className="border-b border-[#262626] pb-2">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-widest block">
                    MODUL FORMULASI KEHUTANAN (AUTOMATED TEMPLATE)
                  </span>
                </div>

                {/* Dropdown Pelaku Usaha */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#bbbbbb] font-mono uppercase">
                    PILIH TARGET PELAKU USAHA (PBPH/PBPHH/IPKR)
                  </label>
                  <select
                    value={pelakuUsahaId}
                    onChange={(e) => handlePelakuUsahaChange(e.target.value)}
                    className="bmw-input w-full py-2.5 font-mono text-xs cursor-pointer"
                  >
                    <option value="" className="bg-[#1a1a1a]">-- Hubungkan dengan Pelaku Usaha --</option>
                    {pelakuUsahaList.filter(p => p.is_active).map(pu => (
                      <option key={pu.id} value={pu.id} className="bg-[#1a1a1a] text-white">
                        {pu.nama} ({pu.jenis_usaha} - SLK: {pu.slk_no})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic fields from templates (placeholders) */}
                {getPlaceholdersFromTemplates(currentProgram).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-[#bbbbbb] font-mono uppercase">
                      VARIABEL TAMBAHAN LAPORAN
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getPlaceholdersFromTemplates(currentProgram).map(ph => (
                        <div key={ph} className="space-y-1">
                          <label className="text-[10px] font-bold text-[#bbbbbb] uppercase font-mono">
                            {ph.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="text"
                            value={customPlaceholders[ph] || ''}
                            onChange={(e) => {
                              setCustomPlaceholders(prev => ({
                                ...prev,
                                [ph]: e.target.value
                              }));
                            }}
                            placeholder={`Masukkan nilai (${ph})...`}
                            className="bmw-input w-full font-mono text-xs py-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hasil Kegiatan (Pembahasan Hasil) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                HASIL KEGIATAN / PEMBAHASAN AKHIR <span className="text-[#e22718]">*</span>
              </label>
              <textarea
                name="hasil"
                value={hasil}
                onChange={(e) => setHasil(e.target.value)}
                rows={10}
                className="bmw-input w-full font-sans leading-relaxed text-xs"
              />
              {errors.hasil && (
                <p className="text-[10px] text-[#e22718] font-mono">{errors.hasil}</p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 4: KESIMPULAN, SARAN & FOTO ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                LANGKAH 4: KESIMPULAN, SARAN & LAMPIRAN FOTO
              </h3>
              <p className="text-xs text-[#bbbbbb] font-light mt-1">
                Lengkapi berkas dengan analisis akhir, usulan, serta bukti dokumentasi pendukung.
              </p>
            </div>

            {/* Kesimpulan */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  KESIMPULAN LPD <span className="text-[#e22718]">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateKesimpulanAi}
                  disabled={isGeneratingAi}
                  className="bmw-btn-outline px-3 py-1 text-[10px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3 h-3 text-[#1c69d4] ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'MEMBUAT...' : 'GENERASI AI'}
                </button>
              </div>
              <textarea
                name="kesimpulan"
                value={kesimpulan}
                onChange={(e) => setKesimpulan(e.target.value)}
                placeholder="Tulis kesimpulan..."
                rows={3}
                className="bmw-input w-full leading-relaxed font-sans"
              />
              {errors.kesimpulan && (
                <p className="text-[10px] text-[#e22718] font-mono">{errors.kesimpulan}</p>
              )}
            </div>

            {/* Saran */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                  SARAN / USULAN TINDAK LANJUT
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRekomendasiAi}
                  disabled={isGeneratingAi}
                  className="bmw-btn-outline px-3 py-1 text-[10px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Brain className={`w-3 h-3 text-[#1c69d4] ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'MEMBUAT...' : 'GENERASI AI'}
                </button>
              </div>
              <textarea
                name="saran"
                value={saran}
                onChange={(e) => setSaran(e.target.value)}
                placeholder="Tulis saran tindak lanjut..."
                rows={3}
                className="bmw-input w-full leading-relaxed font-sans"
              />
            </div>

            {/* Upload Attachment Panel */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-white uppercase tracking-widest font-mono">
                DOKUMENTASI & LAMPIRAN PENDUKUNG
              </label>
              
              <div className="border border-dashed border-[#3c3c3c] hover:border-white rounded-none p-6 text-center transition-colors bg-[#0d0d0d] cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleUploadSimulated}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-[#1c69d4]" />
                  <p className="text-xs text-white font-bold uppercase tracking-wider font-mono">
                    KLIK ATAU SERET BERKAS KE SINI
                  </p>
                  <p className="text-[10px] text-[#7e7e7e] font-mono">
                    JPG, PNG, PDF (Maksimal 5MB)
                  </p>
                </div>
              </div>

              {/* Uploaded List with Preview */}
              {lampiranList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[#7e7e7e] font-bold uppercase tracking-widest font-mono block">
                    BERKAS TERLAMPIR ({lampiranList.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lampiranList.map((lamp) => (
                      <div
                        key={lamp.id}
                        className="p-3 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {lamp.tipe === 'foto' ? (
                            <img
                              src={lamp.dataUrl}
                              alt={lamp.nama_file}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-none bg-[#1a1a1a] border border-[#3c3c3c] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#1a1a1a] border border-[#3c3c3c] text-white rounded-none flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                              PDF
                            </div>
                          )}
                          <div className="flex flex-col leading-tight overflow-hidden">
                            <span className="font-bold text-white truncate font-sans">
                              {lamp.nama_file}
                            </span>
                            <span className="text-[9px] text-[#7e7e7e] font-mono">
                              {lamp.ukuran}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLampiran(lamp.id)}
                          className="p-1.5 bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/30 hover:bg-[#e22718] hover:text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer navigation between steps */}
      <div className="flex justify-between items-center pt-3">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              className="bmw-btn-outline px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              KEMBALI
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              className="bmw-btn-primary px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              LANJUTKAN
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSubmitForm('draft')}
                className="bmw-btn-outline px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                SIMPAN DRAFT
              </button>
              <button
                onClick={() => handleSubmitForm('submitted')}
                className="bmw-btn-primary px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#1c69d4]" />
                KIRIM KE ATASAN
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

