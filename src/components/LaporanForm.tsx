import { useState, useEffect, ChangeEvent } from 'react';
import { Laporan, JenisKegiatan, User, Lampiran, PelakuUsaha } from '../types';
import { 
  Calendar, MapPin, Users, FileText, ArrowLeft, ArrowRight, Save, 
  Send, User as UserIcon, Plus, Trash2, HelpCircle, ImageIcon, CheckCircle, Image, Sparkles, Brain
} from 'lucide-react';
import { sortRegulations, sortPelaksana, sortPelaksanaDinas, getApiHeaders } from '../lib/utils';

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

  // Attachment Upload with Server File Storage & Base64 Fallback
  const handleUploadSimulated = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawResult = reader.result as string;
        let finalUrl = rawResult;
        
        try {
          // Attempt server disk upload to /api/upload
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

      {/* Multi-step progress tracker */}
      <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-4 flex justify-between items-center max-w-2xl mx-auto shadow-inner overflow-x-auto whitespace-nowrap gap-4">
        {[
          { num: 1, label: 'Kategori & Surat' },
          { num: 2, label: 'Lokus & Tim' },
          { num: 3, label: 'Isi & Formulasi' },
          { num: 4, label: 'Dokumentasi' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] transition-all shrink-0 ${stepClasses(s.num)}`}>
              {s.num}
            </span>
            <span className={`text-[11px] font-medium ${currentStep === s.num ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
              {s.label}
            </span>
            {s.num < 4 && <span className="text-slate-600 text-xs shrink-0">&bull;&bull;</span>}
          </div>
        ))}
      </div>

      {/* Form Area panel */}
      <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-6 shadow-md">
        
        {/* ================= STEP 1: BASIS PROGRAM & SURAT TUGAS ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#22293f] pb-2">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider font-mono">
                Langkah 1: Jenis Penugasan & Dasar Hukum
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pilih jenis penugasan di bawah. Sistem akan secara otomatis mengimpor dan memformat dasar pelaksanaan resmi sesuai peraturan menteri LHK.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jenis Program selector dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Program / Jenis Kegiatan <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenisKegiatanId"
                  value={jenisKegiatanId}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Kategori Tugas --</option>
                  {jenisKegiatanList.map((jk) => (
                    <option key={jk.id} value={jk.id}>
                      {jk.nama_kegiatan}
                    </option>
                  ))}
                </select>
                {errors.jenisKegiatanId && (
                  <p className="text-[10px] text-red-500">{errors.jenisKegiatanId}</p>
                )}
              </div>

              {/* Tips block */}
              <div className="bg-slate-900/50 p-3 h-fit border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed self-center">
                <span className="font-bold text-amber-400 block mb-1">Cascade Template Engine:</span>
                Setiap kali program diubah, form Dasar Pelaksanaan (Step 3) dan template Hasil Kegiatan (Step 3) akan terisi otomatis secara real-time. Anda tidak perlu menyalin manual undang-undang berulang-ulang.
              </div>
            </div>

            {/* Sasaran Kegiatan Field */}
            <div className="space-y-2 bg-[#13192f] border border-[#1e233d]/50 rounded-xl p-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sasaran Kegiatan <span className="text-red-500">*</span>
              </label>
              <textarea
                name="sasaran"
                value={sasaran}
                onChange={(e) => setSasaran(e.target.value)}
                placeholder="Sasaran kegiatan ini terisi otomatis berdasarkan master data jenis kegiatan yang dipilih, dan dapat disesuaikan."
                rows={2.5}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
              />
              {errors.sasaran && (
                <p className="text-[10px] text-red-500">{errors.sasaran}</p>
              )}
              <span className="text-[10px] text-slate-500 block">Sasaran strategis atau target hasil dari perjalanan dinas</span>
            </div>

            {/* Surat Tugas parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nomor Surat Tugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nomorSurat"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="Contoh: ST.108/BPHL-XI/TNL/2026"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
                {errors.nomorSurat && (
                  <p className="text-[10px] text-red-500">{errors.nomorSurat}</p>
                )}
                <span className="text-[10px] text-slate-500 block">Surat Tugas sah dari Kepala BPHL XI</span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tanggal Surat Tugas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="tanggalSurat"
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                {errors.tanggalSurat && (
                  <p className="text-[10px] text-red-500">{errors.tanggalSurat}</p>
                )}
              </div>
            </div>

            {/* Real-time preview of Laws generation */}
            <div className="space-y-2 bg-[#14182e] border border-blue-900/20 rounded-xl p-4">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider font-mono">
                Pratinjau Dasar Pelaksanaan LPD Ter-generate Secara Live:
              </span>
              <ul className="space-y-1.5 list-decimal list-inside text-xs text-slate-300">
                {generatedRegulations.map((reg, index) => (
                  <li key={index} className={`leading-relaxed ${index === 0 ? 'text-amber-400 font-mono font-medium' : ''}`}>
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
            <div className="border-b border-[#22293f] pb-2">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider font-mono">
                Langkah 2: Lokasi Penugasan & Tim Pelaksana
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Petakan koordinat/institusi target serta tentukan siapa saja staf kementerian yang berangkat.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tempat / Lokasi Kegiatan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
                <textarea
                  name="tempat"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  placeholder="Contoh: Kantor Utama PBPH PT. Kayu Rimba Sejahtera, Tapin, Kalimantan Selatan"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              {errors.tempat && (
                <p className="text-[10px] text-red-500">{errors.tempat}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tanggal Berangkat <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tglMulai"
                  value={tglMulai}
                  onChange={(e) => setTglMulai(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.tglMulai && (
                  <p className="text-[10px] text-red-500">{errors.tglMulai}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tanggal Kembali <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tglSelesai"
                  value={tglSelesai}
                  onChange={(e) => setTglSelesai(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.tglSelesai && (
                  <p className="text-[10px] text-red-500">{errors.tglSelesai}</p>
                )}
              </div>
            </div>

            {/* Tim Pelaksana (Multi-Select) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tim Pelaksana (Multi-Pilih) <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Pilih satu atau beberapa staf yang ditugaskan dalam Surat Tugas. Pemilik laporan wajib dicentang.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {sortPelaksana(allUsers).map((u) => {
                  const isChecked = pelaksanaIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => togglePelaksana(u.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-amber-400/5 border-amber-500/25 text-amber-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // toggled by overlay click
                        className="mt-0.5 pointer-events-none rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
                      />
                      <div className="flex flex-col text-xs leading-none space-y-1">
                        <span className="font-bold">{u.nama}</span>
                        <span className="font-mono text-[9px] text-slate-400">NIP. {u.nip}</span>
                        <span className="text-[9px] text-slate-500 leading-snug">
                          {u.pangkat && u.pangkat !== '-' ? `${u.pangkat} (${u.golongan}) — ` : ''}{u.jabatan}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.pelaksana && (
                <p className="text-[10px] text-red-500">{errors.pelaksana}</p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 3: ISI & DYNAMIC FORMULASI ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#22293f] pb-2">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider font-mono">
                Langkah 3: Formulasi & Penulisan Hasil Kegiatan
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kandungan deskriptif LPD disarikan di bawah. Anda bisa menyesuaikan maksud kerja dan mengedit hasil di lapangan dari template.
              </p>
            </div>

            {/* Maksud & Tujuan */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Maksud & Tujuan <span className="text-red-500">*</span>
                </label>
                <span className="text-[9px] text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded font-mono">
                  Membaca Kategori Otomatis
                </span>
              </div>
              <textarea
                name="maksudTujuan"
                value={maksudTujuan}
                onChange={(e) => setMaksudTujuan(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
              />
              {errors.maksudTujuan && (
                <p className="text-[10px] text-red-500">{errors.maksudTujuan}</p>
              )}
            </div>

            {/* Metode Pelaksanaan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Metode Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500 block">
                Tata cara atau metodologi pengerjaan kegiatan di bawah ini.
              </span>
              <textarea
                value={metodePelaksanaan}
                onChange={(e) => setMetodePelaksanaan(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Pelaku Usaha Selector & Dynamic Template Compiler */}
            {currentProgram && (currentProgram.template_hasil_data_umum || currentProgram.template_hasil_poin_penting) && (
              <div className="p-4 bg-[#14182e] border border-amber-500/10 rounded-xl space-y-4">
                <div className="border-b border-[#22293f] pb-2">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider block">
                    Modul Pengisian Form Dinamis Kehutanan
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Isian di bawah akan secara otomatis memformat Laporan Hasil sesuai standard Kementerian Kehutanan.
                  </span>
                </div>

                {/* Dropdown Pelaku Usaha */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Pilih Target Pelaku Usaha (PBPH/PBPHH/IPKR)
                  </label>
                  <select
                    value={pelakuUsahaId}
                    onChange={(e) => handlePelakuUsahaChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    <option value="">-- Hubungkan dengan Pelaku Usaha --</option>
                    {pelakuUsahaList.filter(p => p.is_active).map(pu => (
                      <option key={pu.id} value={pu.id}>
                        {pu.nama} ({pu.jenis_usaha} - SLK: {pu.slk_no})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block">
                    Menghubungkan laporan ini dengan legalitas SLK dan alamat pelaku usaha di database.
                  </span>
                </div>

                {/* Dynamic fields from templates (placeholders) */}
                {getPlaceholdersFromTemplates(currentProgram).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Variabel Tambahan Laporan (Input Manual)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getPlaceholdersFromTemplates(currentProgram).map(ph => (
                        <div key={ph} className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 capitalize">
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
                            className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
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
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hasil Kegiatan / Pembahasan Akhir <span className="text-red-500">*</span>
                </label>
                <span className="text-[9px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                  Review Akhir Hasil Laporan
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Teks di bawah di-generate otomatis dari isian template di atas. Anda masih bisa melakukan perubahan manual langsung jika diperlukan.
              </p>
              <textarea
                name="hasil"
                value={hasil}
                onChange={(e) => setHasil(e.target.value)}
                rows={10}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-sans leading-relaxed"
              />
              {errors.hasil && (
                <p className="text-[10px] text-red-500">{errors.hasil}</p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 4: KESIMPULAN, SARAN & FOTO ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="border-b border-[#22293f] pb-2">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider font-mono">
                Langkah 4: Kesimpulan, Saran & Lampiran Foto
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lengkapi berkas dengan analisis akhir, usulan, serta unggahan bukti dokumentasi pendukung.
              </p>
            </div>

            {/* Kesimpulan */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kesimpulan LPD <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateKesimpulanAi}
                  disabled={isGeneratingAi}
                  className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  <Sparkles className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'Membuat...' : 'Hasilkan dengan AI'}
                </button>
              </div>
              <textarea
                name="kesimpulan"
                value={kesimpulan}
                onChange={(e) => setKesimpulan(e.target.value)}
                placeholder="Tulis kalimat kesimpulan singkat dari seluruh perjalanan dinas atau klik tombol AI..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
              />
              {errors.kesimpulan && (
                <p className="text-[10px] text-red-500">{errors.kesimpulan}</p>
              )}
            </div>

            {/* Saran */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Saran / Usulan Tindak Lanjut
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRekomendasiAi}
                  disabled={isGeneratingAi}
                  className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  <Brain className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'Membuat...' : 'Hasilkan dengan AI'}
                </button>
              </div>
              <textarea
                name="saran"
                value={saran}
                onChange={(e) => setSaran(e.target.value)}
                placeholder="Tulis usulan perbaikan atau klik tombol AI..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Upload Attachment Panel */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dokumentasi & Lampiran Pendukung
              </label>
              
              {/* Drag drop zone simulated */}
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/40 rounded-2xl p-6 text-center transition-colors bg-slate-900/45 cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleUploadSimulated}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-slate-800 rounded-full text-slate-300">
                    <ImageIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-xs text-slate-200 font-semibold">
                    Klik atau Seret Berkas ke Area Ini
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Mendukung JPG, PNG, PDF (Maksimal 5MB per berkas)
                  </p>
                </div>
              </div>

              {/* Uploaded List with Preview */}
              {lampiranList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Berkas Terlampir ({lampiranList.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lampiranList.map((lamp) => (
                      <div
                        key={lamp.id}
                        className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {lamp.tipe === 'foto' ? (
                            <img
                              src={lamp.dataUrl}
                              alt={lamp.nama_file}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded bg-slate-800 border border-slate-700/30 grow-0 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded flex items-center justify-center font-bold text-[10px] shrink-0">
                              PDF
                            </div>
                          )}
                          <div className="flex flex-col leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-200 truncate pr-2">
                              {lamp.nama_file}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {lamp.ukuran}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLampiran(lamp.id)}
                          className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors focus:outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className="flex justify-between items-center pt-2">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/5"
            >
              Lanjutkan
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSubmitForm('draft')}
                className="px-4 py-2.5 bg-[#171c31] hover:bg-[#1f2642] text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Draft
              </button>
              <button
                onClick={() => handleSubmitForm('submitted')}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
              >
                <Send className="w-4 h-4" />
                Kirim Laporan
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
