import { useState } from 'react';
import { JenisKegiatan, User, PelakuUsaha } from '../types';
import { 
  Plus, Edit, Trash2, Check, X, Shield, Users, Briefcase, Building2,
  Settings, AlertCircle, RefreshCw, Key, ToggleLeft, ToggleRight, ListPlus, Database
} from 'lucide-react';

interface MasterDataPanelProps {
  jenisKegiatanList: JenisKegiatan[];
  allUsers: User[];
  onUpdateJenisKegiatan: (list: JenisKegiatan[]) => void;
  onUpdateUsers: (list: User[]) => void;
  pelakuUsahaList: PelakuUsaha[];
  onUpdatePelakuUsaha: (list: PelakuUsaha[]) => void;
  onShowToast?: (msg: string) => void;
}

export default function MasterDataPanel({
  jenisKegiatanList,
  allUsers,
  onUpdateJenisKegiatan,
  onUpdateUsers,
  pelakuUsahaList,
  onUpdatePelakuUsaha,
  onShowToast,
}: MasterDataPanelProps) {
  const [activeTab, setActiveTab] = useState<'kegiatan' | 'staf' | 'pelaku_usaha'>('kegiatan');

  // Perjalanan Dinas Editing state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [progNama, setProgNama] = useState('');
  const [progMaksud, setProgMaksud] = useState('');
  const [progSasaran, setProgSasaran] = useState('');
  const [progMetode, setProgMetode] = useState('');
  const [progDataUmum, setProgDataUmum] = useState('');
  const [progPoinPenting, setProgPoinPenting] = useState('');
  const [progTemplate, setProgTemplate] = useState('');
  const [progLaws, setProgLaws] = useState<string[]>([]);
  const [lawInput, setLawInput] = useState('');

  // Pelaku Usaha Editing State
  const [editingPelakuId, setEditingPelakuId] = useState<string | null>(null);
  const [isAddingPelaku, setIsAddingPelaku] = useState(false);
  const [pelakuNama, setPelakuNama] = useState('');
  const [pelakuJenis, setPelakuJenis] = useState<'PBPH' | 'PBPHH' | 'IPKR' | 'Lainnya'>('PBPH');
  const [pelakuSlkNo, setPelakuSlkNo] = useState('');
  const [pelakuSlkTanggal, setPelakuSlkTanggal] = useState('');
  const [pelakuAlamat, setPelakuAlamat] = useState('');
  const [pelakuPimpinan, setPelakuPimpinan] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // PBPH specific states
  const [skPbphNo, setSkPbphNo] = useState('');
  const [skPbphTanggal, setSkPbphTanggal] = useState('');
  const [luasAreal, setLuasAreal] = useState('');
  const [skRkuphNo, setSkRkuphNo] = useState('');
  const [skRkuphTanggal, setSkRkuphTanggal] = useState('');
  const [slkMasaBerlaku, setSlkMasaBerlaku] = useState('');
  const [slkPenerbit, setSlkPenerbit] = useState('');
  const [rktphTahun, setRktphTahun] = useState('2025');
  const [skRktphNo, setSkRktphNo] = useState('');
  const [skRktphTanggal, setSkRktphTanggal] = useState('');
  const [luasRktph, setLuasRktph] = useState('');
  const [targetRktphJenis, setTargetRktphJenis] = useState<'Penanaman' | 'Produksi HHK' | 'Produksi HHBK' | 'Pembayaran PSDH' | 'Pembayaran DR' | ''>('');
  const [targetRktphHhbkJenis, setTargetRktphHhbkJenis] = useState<'Buah' | 'Biji' | 'Daun' | 'Rimpang' | ''>('');

  // PBPHH specific states
  const [skPbphhNo, setSkPbphhNo] = useState('');
  const [skPbphhTanggal, setSkPbphhTanggal] = useState('');
  const [kapasitasProduksiJenis, setKapasitasProduksiJenis] = useState<'Veneer' | 'Plywood' | 'Kayu Gergajian' | 'Serpih' | 'Block Board' | ''>('');

  // Staf Editing state
  const [editingStafId, setEditingStafId] = useState<string | null>(null);
  const [isAddingStaf, setIsAddingStaf] = useState(false);
  const [stafNip, setStafNip] = useState('');
  const [stafNama, setStafNama] = useState('');
  const [stafJabatan, setStafJabatan] = useState('');
  const [stafEmail, setStafEmail] = useState('');
  const [stafRole, setStafRole] = useState<'admin' | 'verifikator' | 'user'>('user');

  // PROGRAM DINAS LOGIC
  const handleEditProgramClick = (prog: JenisKegiatan) => {
    setEditingProgramId(prog.id);
    setIsAddingProgram(false);
    setProgNama(prog.nama_kegiatan);
    setProgMaksud(prog.maksud_tujuan);
    setProgSasaran(prog.sasaran_kegiatan || '');
    setProgMetode(prog.metode_pelaksanaan || '');
    setProgDataUmum(prog.template_hasil_data_umum || '');
    setProgPoinPenting(prog.template_hasil_poin_penting || '');
    setProgTemplate(prog.template_hasil || '');
    setProgLaws(prog.dasar_hukum);
  };

  const handleAddNewProgramClick = () => {
    setEditingProgramId(null);
    setIsAddingProgram(true);
    setProgNama('');
    setProgMaksud('');
    setProgSasaran('Terlaksananya kegiatan pembinaan, pengawasan, serta pendampingan teknis kehutanan pada obyek kegiatan secara optimal.');
    setProgMetode('1. \n2. ');
    setProgDataUmum('Pemeriksaan dilaksanakan pada (pelaku_usaha) yang berlokasi di (lokasi). Objek pemeriksaan merupakan pemegang izin (jenis_usaha) dengan sertifikat SLK Nomor (slk_no) tanggal (slk_tanggal).');
    setProgPoinPenting('Berdasarkan kegiatan di lapangan, diperoleh temuan:\n1. Terdapat temuan berupa (temuan).\n2. Kendala teknis utama (kendala).\n3. Pelaksanaan administratif (status).');
    setProgTemplate('');
    setProgLaws([
      'Undang-Undang Nomor 41 Tahun 1999 tentang Kehutanan.',
      'Peraturan Pemerintah Nomor 23 Tahun 2021 tentang Penyelenggaraan Kehutanan.'
    ]);
  };

  const handleAddLaw = () => {
    if (lawInput.trim()) {
      setProgLaws([...progLaws, lawInput.trim()]);
      setLawInput('');
    }
  };

  const handleRemoveLaw = (idx: number) => {
    setProgLaws(progLaws.filter((_, i) => i !== idx));
  };

  const handleSaveProgram = () => {
    if (!progNama.trim() || !progMaksud.trim()) return;

    if (isAddingProgram) {
      const newProg: JenisKegiatan = {
        id: 'jk-' + Date.now(),
        nama_kegiatan: progNama.trim(),
        slug: progNama.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        maksud_tujuan: progMaksud.trim(),
        sasaran_kegiatan: progSasaran.trim(),
        metode_pelaksanaan: progMetode.trim(),
        template_hasil_data_umum: progDataUmum.trim(),
        template_hasil_poin_penting: progPoinPenting.trim(),
        template_hasil: progTemplate.trim() || '1. Hasil pertama: [___]\n2. Hasil kedua: [___]',
        dasar_hukum: progLaws,
        is_active: true
      };
      onUpdateJenisKegiatan([...jenisKegiatanList, newProg]);
    } else if (editingProgramId) {
      const updated = jenisKegiatanList.map(p => {
        if (p.id === editingProgramId) {
          return {
            ...p,
            nama_kegiatan: progNama.trim(),
            maksud_tujuan: progMaksud.trim(),
            sasaran_kegiatan: progSasaran.trim(),
            metode_pelaksanaan: progMetode.trim(),
            template_hasil_data_umum: progDataUmum.trim(),
            template_hasil_poin_penting: progPoinPenting.trim(),
            template_hasil: progTemplate.trim(),
            dasar_hukum: progLaws
          };
        }
        return p;
      });
      onUpdateJenisKegiatan(updated);
    }
    setEditingProgramId(null);
    setIsAddingProgram(false);
  };

  const handleDeleteProgram = (id: string) => {
    const updated = jenisKegiatanList.map(p => {
      if (p.id === id) {
        return { ...p, is_active: !p.is_active };
      }
      return p;
    });
    onUpdateJenisKegiatan(updated);
  };


  // STAF / USERS LOGIC
  const handleEditStafClick = (staf: User) => {
    setEditingStafId(staf.id);
    setIsAddingStaf(false);
    setStafNip(staf.nip);
    setStafNama(staf.nama);
    setStafJabatan(staf.jabatan);
    setStafEmail(staf.email);
    setStafRole(staf.role);
  };

  const handleAddNewStafClick = () => {
    setEditingStafId(null);
    setIsAddingStaf(true);
    setStafNip('');
    setStafNama('');
    setStafJabatan('');
    setStafEmail('');
    setStafRole('user');
  };

  const handleSaveStaf = () => {
    if (!stafNip.trim() || !stafNama.trim() || !stafJabatan.trim()) return;

    if (isAddingStaf) {
      const newStaf: User = {
        id: 'staf-' + Date.now(),
        nip: stafNip.trim(),
        nama: stafNama.trim(),
        jabatan: stafJabatan.trim(),
        email: stafEmail.trim() || `${stafNip}@menlhk.go.id`,
        role: stafRole,
        is_active: true
      };
      onUpdateUsers([...allUsers, newStaf]);
    } else if (editingStafId) {
      const updated = allUsers.map(u => {
        if (u.id === editingStafId) {
          return {
            ...u,
            nip: stafNip.trim(),
            nama: stafNama.trim(),
            jabatan: stafJabatan.trim(),
            email: stafEmail.trim(),
            role: stafRole
          };
        }
        return u;
      });
      onUpdateUsers(updated);
    }
    setEditingStafId(null);
    setIsAddingStaf(false);
  };

  const handleToggleStafActive = (id: string) => {
    const updated = allUsers.map(u => {
      if (u.id === id) {
        return { ...u, is_active: !u.is_active };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  // PELAKU USAHA LOGIC
  const handleEditPelakuClick = (pu: PelakuUsaha) => {
    setEditingPelakuId(pu.id);
    setIsAddingPelaku(false);
    setPelakuNama(pu.nama);
    setPelakuJenis(pu.jenis_usaha);
    setPelakuSlkNo(pu.slk_no);
    setPelakuSlkTanggal(pu.slk_tanggal);
    setPelakuAlamat(pu.alamat);
    setPelakuPimpinan(pu.pimpinan);

    // Set PBPH specific states
    setSkPbphNo(pu.sk_pbph_no || '');
    setSkPbphTanggal(pu.sk_pbph_tanggal || '');
    setLuasAreal(pu.luas_areal || '');
    setSkRkuphNo(pu.sk_rkuph_no || '');
    setSkRkuphTanggal(pu.sk_rkuph_tanggal || '');
    setSlkMasaBerlaku(pu.slk_masa_berlaku || '');
    setSlkPenerbit(pu.slk_penerbit || '');
    setRktphTahun(pu.rktph_tahun || '2025');
    setSkRktphNo(pu.sk_rktph_no || '');
    setSkRktphTanggal(pu.sk_rktph_tanggal || '');
    setLuasRktph(pu.luas_rktph || '');
    setTargetRktphJenis(pu.target_rktph_jenis || '');
    setTargetRktphHhbkJenis(pu.target_rktph_hhbk_jenis || '');

    // Set PBPHH specific states
    setSkPbphhNo(pu.sk_pbphh_no || '');
    setSkPbphhTanggal(pu.sk_pbphh_tanggal || '');
    setKapasitasProduksiJenis(pu.kapasitas_produksi_jenis || '');
  };

  const handleAddNewPelakuClick = () => {
    setEditingPelakuId(null);
    setIsAddingPelaku(true);
    setPelakuNama('');
    setPelakuJenis('PBPH');
    setPelakuSlkNo('');
    setPelakuSlkTanggal('');
    setPelakuAlamat('');
    setPelakuPimpinan('');

    // Reset PBPH specific fields
    setSkPbphNo('');
    setSkPbphTanggal('');
    setLuasAreal('');
    setSkRkuphNo('');
    setSkRkuphTanggal('');
    setSlkMasaBerlaku('');
    setSlkPenerbit('');
    setRktphTahun('2025');
    setSkRktphNo('');
    setSkRktphTanggal('');
    setLuasRktph('');
    setTargetRktphJenis('');
    setTargetRktphHhbkJenis('');

    // Reset PBPHH specific fields
    setSkPbphhNo('');
    setSkPbphhTanggal('');
    setKapasitasProduksiJenis('');
  };

  const handleSavePelaku = () => {
    if (!pelakuNama.trim() || !pelakuSlkNo.trim()) return;

    const extraFields = {
      // PBPH fields
      sk_pbph_no: pelakuJenis === 'PBPH' ? skPbphNo.trim() : undefined,
      sk_pbph_tanggal: pelakuJenis === 'PBPH' ? skPbphTanggal : undefined,
      luas_areal: pelakuJenis === 'PBPH' ? luasAreal.trim() : undefined,
      sk_rkuph_no: pelakuJenis === 'PBPH' ? skRkuphNo.trim() : undefined,
      sk_rkuph_tanggal: pelakuJenis === 'PBPH' ? skRkuphTanggal : undefined,
      slk_masa_berlaku: (pelakuJenis === 'PBPH' || pelakuJenis === 'PBPHH') ? slkMasaBerlaku : undefined,
      slk_penerbit: (pelakuJenis === 'PBPH' || pelakuJenis === 'PBPHH') ? slkPenerbit.trim() : undefined,
      rktph_tahun: pelakuJenis === 'PBPH' ? rktphTahun : undefined,
      sk_rktph_no: pelakuJenis === 'PBPH' ? skRktphNo.trim() : undefined,
      sk_rktph_tanggal: pelakuJenis === 'PBPH' ? skRktphTanggal : undefined,
      luas_rktph: pelakuJenis === 'PBPH' ? luasRktph.trim() : undefined,
      target_rktph_jenis: pelakuJenis === 'PBPH' ? targetRktphJenis : undefined,
      target_rktph_hhbk_jenis: (pelakuJenis === 'PBPH' && targetRktphJenis === 'Produksi HHBK') ? targetRktphHhbkJenis : undefined,

      // PBPHH fields
      sk_pbphh_no: pelakuJenis === 'PBPHH' ? skPbphhNo.trim() : undefined,
      sk_pbphh_tanggal: pelakuJenis === 'PBPHH' ? skPbphhTanggal : undefined,
      kapasitas_produksi_jenis: pelakuJenis === 'PBPHH' ? kapasitasProduksiJenis : undefined,
    };

    if (isAddingPelaku) {
      const newPu: PelakuUsaha = {
        id: 'pu-' + Date.now(),
        nama: pelakuNama.trim(),
        jenis_usaha: pelakuJenis,
        slk_no: pelakuSlkNo.trim(),
        slk_tanggal: pelakuSlkTanggal || new Date().toISOString().split('T')[0],
        alamat: pelakuAlamat.trim() || 'Kalimantan Selatan',
        pimpinan: pelakuPimpinan.trim() || '-',
        is_active: true,
        ...extraFields
      };
      onUpdatePelakuUsaha([...pelakuUsahaList, newPu]);
    } else if (editingPelakuId) {
      const updated = pelakuUsahaList.map(pu => {
        if (pu.id === editingPelakuId) {
          return {
            ...pu,
            nama: pelakuNama.trim(),
            jenis_usaha: pelakuJenis,
            slk_no: pelakuSlkNo.trim(),
            slk_tanggal: pelakuSlkTanggal,
            alamat: pelakuAlamat.trim(),
            pimpinan: pelakuPimpinan.trim(),
            ...extraFields
          };
        }
        return pu;
      });
      onUpdatePelakuUsaha(updated);
    }
    setEditingPelakuId(null);
    setIsAddingPelaku(false);
  };

  const handleTogglePelakuActive = (id: string) => {
    const updated = pelakuUsahaList.map(pu => {
      if (pu.id === id) {
        return { ...pu, is_active: !pu.is_active };
      }
      return pu;
    });
    onUpdatePelakuUsaha(updated);
  };

  const handleSyncSipakPhl = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const mockSipak: PelakuUsaha[] = [
        {
          id: 'pu-sipak-1',
          nama: 'PBPH PT. Hutan Rimbawan Lestari',
          jenis_usaha: 'PBPH',
          slk_no: '33/S-LK/05/2025',
          slk_tanggal: '2025-05-18',
          alamat: 'Kandangan, Hulu Sungai Selatan',
          pimpinan: 'Slamet Rahardjo, S.Hut.',
          is_active: true
        },
        {
          id: 'pu-sipak-2',
          nama: 'IPKR CV. Borneo Wood Craft',
          jenis_usaha: 'IPKR',
          slk_no: '15/S-LK/11/2025',
          slk_tanggal: '2025-11-04',
          alamat: 'Banjarbaru, Kalimantan Selatan',
          pimpinan: 'Lia Herlina, S.E.',
          is_active: true
        }
      ];

      const currentNames = pelakuUsahaList.map(p => p.nama.toLowerCase());
      const filteredMock = mockSipak.filter(m => !currentNames.includes(m.nama.toLowerCase()));

      if (filteredMock.length > 0) {
        onUpdatePelakuUsaha([...pelakuUsahaList, ...filteredMock]);
        if (onShowToast) {
          onShowToast(`Sukses sinkronisasi data SIPAK-PHL! Mengimpor ${filteredMock.length} Pelaku Usaha baru.`);
        }
      } else {
        if (onShowToast) {
          onShowToast("Semua data pelaku usaha dari SIPAK-PHL sudah sinkron.");
        }
      }
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Header Panel */}
      <div className="border-b border-[#3c3c3c] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider font-sans">KONSOL ADMINISTRASI MASTER DATA</h2>
          <p className="text-xs text-[#7e7e7e] font-mono mt-0.5 uppercase tracking-wide">
            MANAJEMEN PARAMETER PROGRAM KEDINASAN & REKRUTMEN STAF BPHL XI
          </p>
        </div>

        {/* Tab triggers */}
        <div className="bg-[#1a1a1a] border border-[#3c3c3c] p-1 rounded-none flex gap-1 self-start shadow-xl">
          <button
            onClick={() => {
              setActiveTab('kegiatan');
              setIsAddingProgram(false);
              setEditingProgramId(null);
            }}
            className={`px-3.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'kegiatan' ? 'bg-[#0d0d0d] border border-[#1c69d4] text-white' : 'text-[#7e7e7e] hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[#1c69d4]" />
            PERJALANAN DINAS
          </button>
          <button
            onClick={() => {
              setActiveTab('pelaku_usaha');
              setIsAddingPelaku(false);
              setEditingPelakuId(null);
            }}
            className={`px-3.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'pelaku_usaha' ? 'bg-[#0d0d0d] border border-[#1c69d4] text-white' : 'text-[#7e7e7e] hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#1c69d4]" />
            PELAKU USAHA
          </button>
          <button
            onClick={() => {
              setActiveTab('staf');
              setIsAddingStaf(false);
              setEditingStafId(null);
            }}
            className={`px-3.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'staf' ? 'bg-[#0d0d0d] border border-[#1c69d4] text-white' : 'text-[#7e7e7e] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#1c69d4]" />
            DAFTAR STAF
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: JENIS KEGIATAN PROGRAM ======================= */}
      {activeTab === 'kegiatan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Programs Selector Column of List */}
          <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-4 lg:col-span-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
                JENIS PERJALANAN DINAS ({jenisKegiatanList.length})
              </span>
              <button
                onClick={handleAddNewProgramClick}
                className="bmw-btn-primary px-3 py-1.5 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#1c69d4]" />
                TAMBAH BARU
              </button>
            </div>

            <div className="divide-y divide-[#262626] max-h-[520px] overflow-y-auto pr-1">
              {jenisKegiatanList.map((prog) => (
                <div 
                  key={prog.id}
                  className={`py-3.5 flex flex-col justify-between gap-2.5 first:pt-1 last:pb-1 ${!prog.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white uppercase font-sans line-clamp-1">
                        {prog.nama_kegiatan}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-none uppercase border ${
                        prog.is_active ? 'bg-[#0fa336]/10 border-[#0fa336]/30 text-[#0fa336]' : 'bg-[#e22718]/10 border-[#e22718]/30 text-[#e22718]'
                      }`}>
                        {prog.is_active ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#bbbbbb] font-light line-clamp-2 leading-relaxed">
                      {prog.maksud_tujuan}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEditProgramClick(prog)}
                      className="bmw-btn-outline px-2.5 py-1 text-[9px] cursor-pointer"
                    >
                      BUKA EDIT
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(prog.id)}
                      className="px-2.5 py-1 bg-[#0d0d0d] border border-[#3c3c3c] text-[#7e7e7e] hover:text-[#e22718] hover:border-[#e22718] text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                    >
                      {prog.is_active ? 'MATIKAN' : 'AKTIFKAN'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program Form Editor Column Panel */}
          <div className="lg:col-span-7 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 shadow-2xl space-y-4">
            
            {!(isAddingProgram || editingProgramId) ? (
              <div className="py-28 text-center text-[#7e7e7e] text-xs flex flex-col items-center justify-center space-y-3 font-mono">
                <Settings className="w-8 h-8 text-[#3c3c3c]" />
                <span className="uppercase tracking-wider font-bold text-white">
                  PILIH SALAH SATU PROGRAM DINAS DI KIRI ATAU KLIK TAMBAH BARU
                </span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
                    {isAddingProgram ? 'BUAT PERJALANAN DINAS BARU' : 'EDIT PARAMETER PERJALANAN DINAS'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingProgramId(null);
                      setIsAddingProgram(false);
                    }}
                    className="p-1 text-[#7e7e7e] hover:text-white bg-[#0d0d0d] border border-[#3c3c3c] rounded-none focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form inputs */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">NAMA KEGIATAN</label>
                    <input
                      type="text"
                      value={progNama}
                      onChange={(e) => setProgNama(e.target.value)}
                      placeholder="Contoh: Pengujian Laboratorium Mutu Kayu"
                      className="bmw-input w-full font-sans text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">DEFAULT MAKSUD & TUJUAN</label>
                    <textarea
                      value={progMaksud}
                      onChange={(e) => setProgMaksud(e.target.value)}
                      rows={3}
                      placeholder="Maksud standard kementerian..."
                      className="bmw-input w-full font-sans leading-relaxed text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">DEFAULT SASARAN KEGIATAN</label>
                    <textarea
                      value={progSasaran}
                      onChange={(e) => setProgSasaran(e.target.value)}
                      rows={3}
                      placeholder="Sasaran Kegiatan standard..."
                      className="bmw-input w-full font-sans leading-relaxed text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">TEMPLATE METODE PELAKSANAAN</label>
                    <textarea
                      value={progMetode}
                      onChange={(e) => setProgMetode(e.target.value)}
                      rows={3}
                      placeholder="Langkah-langkah metodologi pelaksanaan..."
                      className="bmw-input w-full font-sans leading-relaxed text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">TEMPLATE HASIL: DATA UMUM OBYEK</label>
                    <span className="text-[10px] text-[#1c69d4] font-mono block uppercase">
                      Gunakan kurung (pelaku_usaha), (lokasi), (slk_no), (slk_tanggal) untuk auto-replace!
                    </span>
                    <textarea
                      value={progDataUmum}
                      onChange={(e) => setProgDataUmum(e.target.value)}
                      rows={3}
                      placeholder="Narasi umum obyek kegiatan..."
                      className="bmw-input w-full font-sans leading-relaxed text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">TEMPLATE HASIL: POIN PENTING KEGIATAN</label>
                    <span className="text-[10px] text-[#1c69d4] font-mono block uppercase">
                      Gunakan kurung (akurasi_persen) atau (kendala) untuk input variabel otomatis!
                    </span>
                    <textarea
                      value={progPoinPenting}
                      onChange={(e) => setProgPoinPenting(e.target.value)}
                      rows={3}
                      placeholder="Temuan penting di lapangan..."
                      className="bmw-input w-full font-sans leading-relaxed text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">TEMPLATE HASIL (LEGACY FALLBACK)</label>
                    <textarea
                      value={progTemplate}
                      onChange={(e) => setProgTemplate(e.target.value)}
                      rows={3}
                      placeholder="1. Isi kuesioner kuantitas..."
                      className="bmw-input w-full font-mono leading-relaxed text-xs"
                    />
                  </div>

                  {/* Laws Array setup */}
                  <div className="space-y-2 pt-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">DAFTAR DASAR HUKUM / PERATURAN PERUNDANGAN</label>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto bg-[#0d0d0d] p-3 border border-[#3c3c3c] rounded-none">
                      {progLaws.map((law, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-3 p-2 bg-[#1a1a1a] border border-[#262626] rounded-none text-xs text-[#bbbbbb] leading-relaxed">
                          <span className="line-clamp-2">{law}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLaw(idx)}
                            className="p-1 bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/30 hover:bg-[#e22718] hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add law array control */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={lawInput}
                        onChange={(e) => setLawInput(e.target.value)}
                        placeholder="Ketik dasar hukum baru..."
                        className="bmw-input flex-1 font-sans text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddLaw}
                        className="bmw-btn-outline px-4 py-2 text-xs font-mono uppercase cursor-pointer"
                      >
                        TAMBAH
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit panel buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                  <button
                    onClick={() => {
                      setEditingProgramId(null);
                      setIsAddingProgram(false);
                    }}
                    className="bmw-btn-outline px-4 py-2 text-xs font-mono uppercase cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleSaveProgram}
                    className="bmw-btn-primary px-5 py-2 text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-[#1c69d4]" />
                    SIMPAN PERUBAHAN
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================= TAB 2: DAFTAR STAF / USERS ======================= */}
      {activeTab === 'staf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Staff registry column list */}
          <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-4 lg:col-span-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
                STAF KEHUTANAN BPHL XI ({allUsers.length})
              </span>
              <button
                onClick={handleAddNewStafClick}
                className="bmw-btn-primary px-3 py-1.5 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#1c69d4]" />
                TAMBAH STAF
              </button>
            </div>

            <div className="divide-y divide-[#262626] max-h-[520px] overflow-y-auto pr-1">
              {allUsers.map((staf) => (
                <div 
                  key={staf.id}
                  className={`py-3.5 flex flex-col justify-between gap-1 first:pt-1 last:pb-1 ${!staf.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white uppercase font-sans">
                        {staf.nama}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-none uppercase border ${
                        staf.role === 'admin' 
                          ? 'bg-[#e22718]/10 border-[#e22718]/30 text-[#e22718]' 
                          : staf.role === 'verifikator'
                          ? 'bg-[#1c69d4]/10 border-[#1c69d4]/30 text-[#1c69d4]'
                          : staf.role === 'validator'
                          ? 'bg-[#0066b1]/10 border-[#0066b1]/30 text-[#0066b1]'
                          : 'bg-[#0fa336]/10 border-[#0fa336]/30 text-[#0fa336]'
                      }`}>
                        {staf.role === 'admin' ? 'ADMIN / VALIDATOR' : staf.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#bbbbbb] font-mono">
                      NIP. {staf.nip}
                    </p>
                    <p className="text-[10px] text-[#7e7e7e] truncate font-light">
                      {staf.jabatan}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleEditStafClick(staf)}
                      className="bmw-btn-outline px-2.5 py-1 text-[9px] cursor-pointer"
                    >
                      UBAH DATA
                    </button>
                    <button
                      onClick={() => handleToggleStafActive(staf.id)}
                      className="px-2.5 py-1 bg-[#0d0d0d] border border-[#3c3c3c] text-[#7e7e7e] hover:text-[#e22718] hover:border-[#e22718] text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                    >
                      {staf.is_active ? 'MATIKAN' : 'AKTIFKAN'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staf Form Editor Column Panel */}
          <div className="lg:col-span-7 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 shadow-2xl space-y-4">
            
            {!(isAddingStaf || editingStafId) ? (
              <div className="py-28 text-center text-[#7e7e7e] text-xs flex flex-col items-center justify-center space-y-3 font-mono">
                <Users className="w-8 h-8 text-[#3c3c3c]" />
                <span className="uppercase tracking-wider font-bold text-white">
                  PILIH SALAH SATU PERSONIL DI KIRI ATAU DAFTARKAN STAF BARU
                </span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
                    {isAddingStaf ? 'DAFTARKAN STAF BARU' : 'UBAH DATA PERSONIL'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingStafId(null);
                      setIsAddingStaf(false);
                    }}
                    className="p-1 text-[#7e7e7e] hover:text-white bg-[#0d0d0d] border border-[#3c3c3c] rounded-none focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">NOMOR INDUK PEGAWAI (NIP)</label>
                    <input
                      type="text"
                      value={stafNip}
                      onChange={(e) => setStafNip(e.target.value)}
                      placeholder="18 digit angka, contoh: 199406072022031000"
                      className="bmw-input w-full font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">NAMA LENGKAP & GELAR AKADEMIK</label>
                    <input
                      type="text"
                      value={stafNama}
                      onChange={(e) => setStafNama(e.target.value)}
                      placeholder="Contoh: Iman Tochid, S.Hut."
                      className="bmw-input w-full font-sans text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">PANGKAT / JABATAN DINAS</label>
                    <input
                      type="text"
                      value={stafJabatan}
                      onChange={(e) => setStafJabatan(e.target.value)}
                      placeholder="Contoh: Pengendali Ekosistem Hutan Pertama"
                      className="bmw-input w-full font-sans text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-white uppercase font-mono tracking-wider block">E-MAIL RESMI</label>
                      <input
                        type="email"
                        value={stafEmail}
                        onChange={(e) => setStafEmail(e.target.value)}
                        placeholder="user@menlhk.go.id"
                        className="bmw-input w-full font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-white uppercase font-mono tracking-wider block">HAK AKSES / PERAN</label>
                      <select
                        value={stafRole}
                        onChange={(e) => setStafRole(e.target.value as any)}
                        className="bmw-input w-full font-mono text-xs cursor-pointer py-2.5"
                      >
                        <option value="user" className="bg-[#1a1a1a]">User (Staf Pelaksana)</option>
                        <option value="verifikator" className="bg-[#1a1a1a]">Verifikator (Verifikator TU)</option>
                        <option value="validator" className="bg-[#1a1a1a]">Validator (Kepala Balai)</option>
                        <option value="admin" className="bg-[#1a1a1a]">Administrator (Superuser)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                  <button
                    onClick={() => {
                      setEditingStafId(null);
                      setIsAddingStaf(false);
                    }}
                    className="bmw-btn-outline px-4 py-2 text-xs font-mono uppercase cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleSaveStaf}
                    className="bmw-btn-primary px-5 py-2 text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-[#1c69d4]" />
                    SIMPAN STAF
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================= TAB 3: DATABASE PELAKU USAHA ======================= */}
      {activeTab === 'pelaku_usaha' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Pelaku Usaha List Column */}
          <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-4 lg:col-span-5 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#1c69d4]" />
                PELAKU USAHA ({pelakuUsahaList.length})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncSipakPhl}
                  disabled={isSyncing}
                  className="bmw-btn-outline px-2.5 py-1 text-[9px] font-mono flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 text-[#1c69d4] ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'SYNCING...' : 'SIPAK-PHL'}
                </button>
                <button
                  onClick={handleAddNewPelakuClick}
                  className="bmw-btn-primary px-3 py-1 text-[9px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#1c69d4]" />
                  BARU
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#262626] max-h-[520px] overflow-y-auto pr-1">
              {pelakuUsahaList.map((pu) => (
                <div 
                  key={pu.id}
                  className={`py-3.5 flex flex-col justify-between gap-1 first:pt-1 last:pb-1 ${!pu.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white uppercase font-sans">
                        {pu.nama}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-none uppercase border ${
                        pu.jenis_usaha === 'PBPHH' 
                          ? 'bg-[#0066b1]/10 border-[#0066b1]/30 text-[#0066b1]' 
                          : pu.jenis_usaha === 'PBPH'
                          ? 'bg-[#0fa336]/10 border-[#0fa336]/30 text-[#0fa336]'
                          : 'bg-[#1c69d4]/10 border-[#1c69d4]/30 text-[#1c69d4]'
                      }`}>
                        {pu.jenis_usaha}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#bbbbbb] font-mono">
                      SLK: {pu.slk_no} ({pu.slk_tanggal})
                    </p>
                    <p className="text-[10px] text-[#7e7e7e] truncate font-light">
                      PIMP: {pu.pimpinan} | {pu.alamat}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleEditPelakuClick(pu)}
                      className="bmw-btn-outline px-2.5 py-1 text-[9px] cursor-pointer"
                    >
                      UBAH DATA
                    </button>
                    <button
                      onClick={() => handleTogglePelakuActive(pu.id)}
                      className="px-2.5 py-1 bg-[#0d0d0d] border border-[#3c3c3c] text-[#7e7e7e] hover:text-[#e22718] hover:border-[#e22718] text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                    >
                      {pu.is_active ? 'MATIKAN' : 'AKTIFKAN'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pelaku Usaha Form Editor Panel */}
          <div className="lg:col-span-7 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none p-6 shadow-2xl space-y-4">
            
            {!(isAddingPelaku || editingPelakuId) ? (
              <div className="py-28 text-center text-[#7e7e7e] text-xs flex flex-col items-center justify-center space-y-3 font-mono">
                <Database className="w-8 h-8 text-[#3c3c3c]" />
                <span className="uppercase tracking-wider font-bold text-white">
                  PILIH SALAH SATU PELAKU USAHA DI KIRI ATAU KLIK BARU
                </span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
                    {isAddingPelaku ? 'TAMBAH PELAKU USAHA BARU' : 'UBAH DATA PELAKU USAHA'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingPelakuId(null);
                      setIsAddingPelaku(false);
                    }}
                    className="p-1 text-[#7e7e7e] hover:text-white bg-[#0d0d0d] border border-[#3c3c3c] rounded-none focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">NAMA PELAKU USAHA (PERUSAHAAN/MASYARAKAT)</label>
                    <input
                      type="text"
                      value={pelakuNama}
                      onChange={(e) => setPelakuNama(e.target.value)}
                      placeholder="Contoh: PBPHH PT Wijaya Tri Utama Plywood"
                      className="bmw-input w-full font-sans text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-white uppercase font-mono tracking-wider block">JENIS USAHA KEHUTANAN</label>
                      <select
                        value={pelakuJenis}
                        onChange={(e) => setPelakuJenis(e.target.value as any)}
                        className="bmw-input w-full font-mono text-xs cursor-pointer py-2.5"
                      >
                        <option value="PBPH" className="bg-[#1a1a1a]">PBPH (Pemanfaatan Hutan)</option>
                        <option value="PBPHH" className="bg-[#1a1a1a]">PBPHH (Pemanfaatan Hasil Hutan)</option>
                        <option value="IPKR" className="bg-[#1a1a1a]">IPKR (Industri Primer Kayu Rakyat)</option>
                        <option value="Lainnya" className="bg-[#1a1a1a]">Lainnya / Umum</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-white uppercase font-mono tracking-wider block">NAMA PIMPINAN / PENANGGUNG JAWAB</label>
                      <input
                        type="text"
                        value={pelakuPimpinan}
                        onChange={(e) => setPelakuPimpinan(e.target.value)}
                        placeholder="Contoh: Ir. Hendra Gunawan"
                        className="bmw-input w-full font-sans text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-white uppercase font-mono tracking-wider block">NOMOR SERTIFIKAT LEGALITAS (SLK)</label>
                      <input
                        type="text"
                        value={pelakuSlkNo}
                        onChange={(e) => setPelakuSlkNo(e.target.value)}
                        placeholder="Contoh: 12/S-LK/01/2025"
                        className="bmw-input w-full font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-white uppercase font-mono tracking-wider block">TANGGAL TERBIT SLK</label>
                      <input
                        type="date"
                        value={pelakuSlkTanggal}
                        onChange={(e) => setPelakuSlkTanggal(e.target.value)}
                        className="bmw-input w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Conditional Licensing Subforms */}
                  {pelakuJenis === 'PBPH' && (
                    <div className="p-4 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none space-y-3">
                      <h4 className="text-white font-bold font-mono tracking-widest uppercase">DETAIL PERIZINAN PBPH</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Nomor SK PBPH</label>
                          <input
                            type="text"
                            value={skPbphNo}
                            onChange={(e) => setSkPbphNo(e.target.value)}
                            placeholder="SK.99/MENLHK-PH/..."
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Tanggal SK PBPH</label>
                          <input
                            type="date"
                            value={skPbphTanggal}
                            onChange={(e) => setSkPbphTanggal(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Luas Areal (Ha)</label>
                          <input
                            type="text"
                            value={luasAreal}
                            onChange={(e) => setLuasAreal(e.target.value)}
                            placeholder="Contoh: 15430"
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Masa Berlaku S-LK</label>
                          <input
                            type="date"
                            value={slkMasaBerlaku}
                            onChange={(e) => setSlkMasaBerlaku(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Penerbit S-LK</label>
                          <input
                            type="text"
                            value={slkPenerbit}
                            onChange={(e) => setSlkPenerbit(e.target.value)}
                            placeholder="PT. Mutuagung..."
                            className="bmw-input w-full font-sans text-xs py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Nomor SK RKUPH</label>
                          <input
                            type="text"
                            value={skRkuphNo}
                            onChange={(e) => setSkRkuphNo(e.target.value)}
                            placeholder="SK.12/MENLHK-PH/..."
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Tanggal SK RKUPH</label>
                          <input
                            type="date"
                            value={skRkuphTanggal}
                            onChange={(e) => setSkRkuphTanggal(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                      </div>

                      <h5 className="text-[11px] font-bold text-white font-mono uppercase tracking-wider border-b border-[#262626] pb-1 pt-1">RENCANA KERJA TAHUNAN (RKTPH)</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Tahun RKTPH</label>
                          <select
                            value={rktphTahun}
                            onChange={(e) => setRktphTahun(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5 cursor-pointer"
                          >
                            <option value="2025" className="bg-[#1a1a1a]">2025</option>
                            <option value="2026" className="bg-[#1a1a1a]">2026</option>
                            <option value="2027" className="bg-[#1a1a1a]">2027</option>
                            <option value="2028" className="bg-[#1a1a1a]">2028</option>
                            <option value="2029" className="bg-[#1a1a1a]">2029</option>
                            <option value="2030" className="bg-[#1a1a1a]">2030</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Luas RKTPH (Ha)</label>
                          <input
                            type="text"
                            value={luasRktph}
                            onChange={(e) => setLuasRktph(e.target.value)}
                            placeholder="Contoh: 2500"
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Nomor SK RKTPH</label>
                          <input
                            type="text"
                            value={skRktphNo}
                            onChange={(e) => setSkRktphNo(e.target.value)}
                            placeholder="SK.88/MENLHK-PH/..."
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Tanggal SK RKTPH</label>
                          <input
                            type="date"
                            value={skRktphTanggal}
                            onChange={(e) => setSkRktphTanggal(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Target RKTPH (Jenis)</label>
                          <select
                            value={targetRktphJenis}
                            onChange={(e) => setTargetRktphJenis(e.target.value as any)}
                            className="bmw-input w-full font-mono text-xs py-1.5 cursor-pointer"
                          >
                            <option value="" className="bg-[#1a1a1a]">-- Pilih Target --</option>
                            <option value="Penanaman" className="bg-[#1a1a1a]">Penanaman</option>
                            <option value="Produksi HHK" className="bg-[#1a1a1a]">Produksi HHK</option>
                            <option value="Produksi HHBK" className="bg-[#1a1a1a]">Produksi HHBK</option>
                            <option value="Pembayaran PSDH" className="bg-[#1a1a1a]">Pembayaran PSDH</option>
                            <option value="Pembayaran DR" className="bg-[#1a1a1a]">Pembayaran DR</option>
                          </select>
                        </div>
                        {targetRktphJenis === 'Produksi HHBK' && (
                          <div className="space-y-1">
                            <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Jenis HHBK</label>
                            <select
                              value={targetRktphHhbkJenis}
                              onChange={(e) => setTargetRktphHhbkJenis(e.target.value as any)}
                              className="bmw-input w-full font-mono text-xs py-1.5 cursor-pointer"
                            >
                              <option value="" className="bg-[#1a1a1a]">-- Pilih Jenis HHBK --</option>
                              <option value="Buah" className="bg-[#1a1a1a]">Buah</option>
                              <option value="Biji" className="bg-[#1a1a1a]">Biji</option>
                              <option value="Daun" className="bg-[#1a1a1a]">Daun</option>
                              <option value="Rimpang" className="bg-[#1a1a1a]">Rimpang</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {pelakuJenis === 'PBPHH' && (
                    <div className="p-4 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none space-y-3">
                      <h4 className="text-white font-bold font-mono tracking-widest uppercase">DETAIL PERIZINAN PBPHH</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Nomor SK PBPHH</label>
                          <input
                            type="text"
                            value={skPbphhNo}
                            onChange={(e) => setSkPbphhNo(e.target.value)}
                            placeholder="SK.512/MENLHK-PHL/..."
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Tanggal SK PBPHH</label>
                          <input
                            type="date"
                            value={skPbphhTanggal}
                            onChange={(e) => setSkPbphhTanggal(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Kapasitas Produksi (Jenis)</label>
                          <select
                            value={kapasitasProduksiJenis}
                            onChange={(e) => setKapasitasProduksiJenis(e.target.value as any)}
                            className="bmw-input w-full font-mono text-xs py-1.5 cursor-pointer"
                          >
                            <option value="" className="bg-[#1a1a1a]">-- Pilih Jenis --</option>
                            <option value="Veneer" className="bg-[#1a1a1a]">Veneer</option>
                            <option value="Plywood" className="bg-[#1a1a1a]">Plywood</option>
                            <option value="Kayu Gergajian" className="bg-[#1a1a1a]">Kayu Gergajian</option>
                            <option value="Serpih" className="bg-[#1a1a1a]">Serpih</option>
                            <option value="Block Board" className="bg-[#1a1a1a]">Block Board</option>
                          </select>
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Masa Berlaku S-LK</label>
                          <input
                            type="date"
                            value={slkMasaBerlaku}
                            onChange={(e) => setSlkMasaBerlaku(e.target.value)}
                            className="bmw-input w-full font-mono text-xs py-1.5"
                          />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Penerbit S-LK</label>
                          <input
                            type="text"
                            value={slkPenerbit}
                            onChange={(e) => setSlkPenerbit(e.target.value)}
                            placeholder="PT. Mutuagung..."
                            className="bmw-input w-full font-sans text-xs py-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-white uppercase font-mono tracking-wider block">ALAMAT LENGKAP / LOKASI OPERASIONAL</label>
                    <textarea
                      value={pelakuAlamat}
                      onChange={(e) => setPelakuAlamat(e.target.value)}
                      rows={2}
                      placeholder="Kabupaten/Kota, Kalimantan Selatan..."
                      className="bmw-input w-full font-sans leading-relaxed text-xs"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                  <button
                    onClick={() => {
                      setEditingPelakuId(null);
                      setIsAddingPelaku(false);
                    }}
                    className="bmw-btn-outline px-4 py-2 text-xs font-mono uppercase cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleSavePelaku}
                    className="bmw-btn-primary px-5 py-2 text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-[#1c69d4]" />
                    SIMPAN PELAKU USAHA
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
