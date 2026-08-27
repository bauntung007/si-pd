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
      <div className="border-b border-[#22293f] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Konsol Administrasi Master Data</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manajemen parameter program kedinasan kementerian dan rekrutmen staf lapangan
          </p>
        </div>

        {/* Tab triggers */}
        <div className="bg-[#121626] border border-[#232a49] p-1 rounded-xl flex gap-1 self-start">
          <button
            onClick={() => {
              setActiveTab('kegiatan');
              setIsAddingProgram(false);
              setEditingProgramId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'kegiatan' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Perjalanan Dinas
          </button>
          <button
            onClick={() => {
              setActiveTab('pelaku_usaha');
              setIsAddingPelaku(false);
              setEditingPelakuId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'pelaku_usaha' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database Pelaku Usaha
          </button>
          <button
            onClick={() => {
              setActiveTab('staf');
              setIsAddingStaf(false);
              setEditingStafId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'staf' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Daftar Staf
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: JENIS KEGIATAN PROGRAM ======================= */}
      {activeTab === 'kegiatan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Programs Selector Column of List */}
          <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-4 lg:col-span-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#22293f] pb-2.5">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Jenis Perjalanan Dinas ({jenisKegiatanList.length})
              </span>
              <button
                onClick={handleAddNewProgramClick}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 hover:text-slate-900 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <Plus className="w-3 h-3" />
                Tambah Baru
              </button>
            </div>

            <div className="divide-y divide-[#1e233d] max-h-[500px] overflow-y-auto pr-1">
              {jenisKegiatanList.map((prog) => (
                <div 
                  key={prog.id}
                  className={`py-3 flex flex-col justify-between gap-2.5 first:pt-1 last:pb-1 ${!prog.is_active ? 'opacity-65' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-200 line-clamp-1">
                        {prog.nama_kegiatan}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded uppercase ${
                        prog.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-400/15 text-red-400'
                      }`}>
                        {prog.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">
                      {prog.maksud_tujuan}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEditProgramClick(prog)}
                      className="px-2 py-0.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 rounded border border-amber-500/15 cursor-pointer focus:outline-none"
                    >
                      Buka Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(prog.id)}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded border border-transparent cursor-pointer focus:outline-none"
                    >
                      {prog.is_active ? 'Matikan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program Form Editor Column Panel */}
          <div className="lg:col-span-7 bg-[#101426] border border-[#1e233d] rounded-2xl p-5 shadow-sm space-y-4">
            
            {!(isAddingProgram || editingProgramId) ? (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2.5">
                <Settings className="w-8 h-8 text-slate-600 animate-spin-slow" />
                <span>Pilih salah satu program dinas di kiri atau klik Tambah Baru untuk merombak hukum dan template.</span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="border-b border-[#22293f] pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                    {isAddingProgram ? 'Buat Perjalanan Dinas Baru' : 'Edit Parameter Perjalanan Dinas'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingProgramId(null);
                      setIsAddingProgram(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form inputs */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Nama Kegiatan</label>
                    <input
                      type="text"
                      value={progNama}
                      onChange={(e) => setProgNama(e.target.value)}
                      placeholder="Contoh: Pengujian Laboratorium Mutu Kayu"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Default Maksud & Tujuan</label>
                    <textarea
                      value={progMaksud}
                      onChange={(e) => setProgMaksud(e.target.value)}
                      rows={3}
                      placeholder="Maksud standard kementerian..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 leading-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Default Sasaran Kegiatan</label>
                    <textarea
                      value={progSasaran}
                      onChange={(e) => setProgSasaran(e.target.value)}
                      rows={3}
                      placeholder="Sasaran Kegiatan standard..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 leading-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Template Metode Pelaksanaan</label>
                    <textarea
                      value={progMetode}
                      onChange={(e) => setProgMetode(e.target.value)}
                      rows={3}
                      placeholder="Langkah-langkah metodologi pelaksanaan..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 leading-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Template Hasil: Data Umum Obyek</label>
                    <span className="text-[10px] text-amber-500 font-mono block">
                      Gunakan kurung seperti (pelaku_usaha), (lokasi), (slk_no), (slk_tanggal) untuk auto-replace atau input manual!
                    </span>
                    <textarea
                      value={progDataUmum}
                      onChange={(e) => setProgDataUmum(e.target.value)}
                      rows={3}
                      placeholder="Narasi umum obyek kegiatan..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 leading-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Template Hasil: Poin Penting Kegiatan</label>
                    <span className="text-[10px] text-amber-500 font-mono block">
                      Gunakan kurung seperti (akurasi_persen) atau (kendala) untuk menghasilkan kolom isian otomatis di form!
                    </span>
                    <textarea
                      value={progPoinPenting}
                      onChange={(e) => setProgPoinPenting(e.target.value)}
                      rows={3}
                      placeholder="Temuan penting di lapangan..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 leading-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Template Hasil (Legacy Fallback)</label>
                    <textarea
                      value={progTemplate}
                      onChange={(e) => setProgTemplate(e.target.value)}
                      rows={3}
                      placeholder="1. Isi kuesioner kuantitas: [___]&#10;2. Sampling kayu..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 font-mono leading-normal"
                    />
                  </div>

                  {/* Laws Array setup */}
                  <div className="space-y-2 pt-1">
                    <label className="font-bold text-slate-300 block">Daftar Dasar Hukum / Peraturan Perundangan</label>
                    <span className="text-[10px] text-slate-500 block">
                      Baris ke-1 akan diisi metadata Surat Tugas dinas secara otomatis. Daftarkan hukum tambahan (Permenhut/PP) di bawah.
                    </span>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-950 p-2.5 border border-slate-800 rounded-lg">
                      {progLaws.map((law, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-3 p-1.5 bg-slate-900 border border-slate-800/40 rounded text-[11px] text-slate-300 leading-snug">
                          <span className="line-clamp-2">{law}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLaw(idx)}
                            className="p-0.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded cursor-pointer"
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
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddLaw}
                        className="px-3 bg-slate-800 text-slate-200 font-bold rounded-lg border border-slate-700 hover:bg-slate-700 cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit panel buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#22293f]">
                  <button
                    onClick={() => {
                      setEditingProgramId(null);
                      setIsAddingProgram(false);
                    }}
                    className="px-3.5 py-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveProgram}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Perubahan
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
          <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-4 lg:col-span-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#22293f] pb-2.5">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Staf Kehutanan BPHL XI ({allUsers.length})
              </span>
              <button
                onClick={handleAddNewStafClick}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 hover:text-slate-900 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <Plus className="w-3 h-3" />
                Tambah Staf
              </button>
            </div>

            <div className="divide-y divide-[#1e233d] max-h-[500px] overflow-y-auto pr-1">
              {allUsers.map((staf) => (
                <div 
                  key={staf.id}
                  className={`py-3 flex flex-col justify-between gap-1 first:pt-1 last:pb-1 ${!staf.is_active ? 'opacity-65' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">
                        {staf.nama}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        staf.role === 'admin' 
                          ? 'bg-red-400/10 text-red-400' 
                          : staf.role === 'verifikator'
                          ? 'bg-purple-400/10 text-purple-400'
                          : staf.role === 'validator'
                          ? 'bg-blue-400/10 text-blue-400'
                          : 'bg-emerald-400/10 text-emerald-400'
                      }`}>
                        {staf.role === 'admin' ? 'admin / validator' : staf.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      NIP. {staf.nip}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate italic">
                      {staf.jabatan}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleEditStafClick(staf)}
                      className="px-2 py-0.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-amber-400/5 rounded border border-amber-500/15 cursor-pointer focus:outline-none"
                    >
                      Ubah Data
                    </button>
                    <button
                      onClick={() => handleToggleStafActive(staf.id)}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded border border-transparent cursor-pointer focus:outline-none"
                    >
                      {staf.is_active ? 'Matikan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staf Form Editor Column Panel */}
          <div className="lg:col-span-7 bg-[#101426] border border-[#1e233d] rounded-2xl p-5 shadow-sm space-y-4">
            
            {!(isAddingStaf || editingStafId) ? (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2.5">
                <Users className="w-8 h-8 text-slate-600 animate-pulse" />
                <span>Pilih salah satu personil di kiri atau daftarkan anggota baru ke instansi.</span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="border-b border-[#22293f] pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                    {isAddingStaf ? 'Daftarkan Staf Baru' : 'Ubah Data Personil'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingStafId(null);
                      setIsAddingStaf(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Nomor Induk Pegawai (NIP)</label>
                    <input
                      type="text"
                      value={stafNip}
                      onChange={(e) => setStafNip(e.target.value)}
                      placeholder="18 digit angka, contoh: 199406072022031000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Nama Lengkap & Gelar Akademik</label>
                    <input
                      type="text"
                      value={stafNama}
                      onChange={(e) => setStafNama(e.target.value)}
                      placeholder="Contoh: Iman Tochid, S.Hut."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Pangkat / Jabatan Dinas</label>
                    <input
                      type="text"
                      value={stafJabatan}
                      onChange={(e) => setStafJabatan(e.target.value)}
                      placeholder="Contoh: Pengendali Ekosistem Hutan Pertama"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">E-mail Resmi</label>
                      <input
                        type="email"
                        value={stafEmail}
                        onChange={(e) => setStafEmail(e.target.value)}
                        placeholder="user@menlhk.go.id"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Hak Akses / Peran</label>
                      <select
                        value={stafRole}
                        onChange={(e) => setStafRole(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white cursor-pointer focus:outline-none focus:border-amber-500"
                      >
                        <option value="user">User (Staf Pelaksana)</option>
                        <option value="verifikator">Verifikator (Kasi / User & Verifikator)</option>
                        <option value="validator">Validator (Kepala Balai / Kaur TU & Validator)</option>
                        <option value="admin">Administrator (Superuser, Admin & Validator)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#22293f]">
                  <button
                    onClick={() => {
                      setEditingStafId(null);
                      setIsAddingStaf(false);
                    }}
                    className="px-3.5 py-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveStaf}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Staf
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
          <div className="bg-[#101426] border border-[#1e233d] rounded-2xl p-4 lg:col-span-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22293f] pb-2.5">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                Daftar Pelaku Usaha ({pelakuUsahaList.length})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncSipakPhl}
                  disabled={isSyncing}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'SIPAK-PHL'}
                </button>
                <button
                  onClick={handleAddNewPelakuClick}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 hover:text-slate-900 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer focus:outline-none"
                >
                  <Plus className="w-3 h-3" />
                  Baru
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#1e233d] max-h-[500px] overflow-y-auto pr-1">
              {pelakuUsahaList.map((pu) => (
                <div 
                  key={pu.id}
                  className={`py-3 flex flex-col justify-between gap-1 first:pt-1 last:pb-1 ${!pu.is_active ? 'opacity-65' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">
                        {pu.nama}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        pu.jenis_usaha === 'PBPHH' 
                          ? 'bg-blue-400/10 text-blue-400' 
                          : pu.jenis_usaha === 'PBPH'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'bg-purple-400/10 text-purple-400'
                      }`}>
                        {pu.jenis_usaha}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      SLK: {pu.slk_no} ({pu.slk_tanggal})
                    </p>
                    <p className="text-[10px] text-slate-500 truncate italic">
                      Pimp: {pu.pimpinan} | {pu.alamat}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleEditPelakuClick(pu)}
                      className="px-2 py-0.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-amber-400/5 rounded border border-amber-500/15 cursor-pointer focus:outline-none"
                    >
                      Ubah Data
                    </button>
                    <button
                      onClick={() => handleTogglePelakuActive(pu.id)}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded border border-transparent cursor-pointer focus:outline-none"
                    >
                      {pu.is_active ? 'Matikan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pelaku Usaha Form Editor Panel */}
          <div className="lg:col-span-7 bg-[#101426] border border-[#1e233d] rounded-2xl p-5 shadow-sm space-y-4">
            
            {!(isAddingPelaku || editingPelakuId) ? (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2.5">
                <Database className="w-8 h-8 text-slate-600 animate-pulse" />
                <span>Pilih salah satu pelaku usaha di kiri atau buat baru untuk menambahkan ke database kementerian.</span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="border-b border-[#22293f] pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                    {isAddingPelaku ? 'Tambah Pelaku Usaha Baru' : 'Ubah Data Pelaku Usaha'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingPelakuId(null);
                      setIsAddingPelaku(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Nama Pelaku Usaha (Perusahaan/Masyarakat)</label>
                    <input
                      type="text"
                      value={pelakuNama}
                      onChange={(e) => setPelakuNama(e.target.value)}
                      placeholder="Contoh: PBPHH PT Wijaya Tri Utama Plywood"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Jenis Usaha Kehutanan</label>
                      <select
                        value={pelakuJenis}
                        onChange={(e) => setPelakuJenis(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white cursor-pointer focus:outline-none focus:border-amber-500"
                      >
                        <option value="PBPH">PBPH (Pemanfaatan Hutan)</option>
                        <option value="PBPHH">PBPHH (Pemanfaatan Hasil Hutan)</option>
                        <option value="IPKR">IPKR (Industri Primer Kayu Rakyat)</option>
                        <option value="Lainnya">Lainnya / Umum</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Nama Pimpinan / Penanggung Jawab</label>
                      <input
                        type="text"
                        value={pelakuPimpinan}
                        onChange={(e) => setPelakuPimpinan(e.target.value)}
                        placeholder="Contoh: Ir. Hendra Gunawan"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Nomor Sertifikat Legalitas (SLK)</label>
                      <input
                        type="text"
                        value={pelakuSlkNo}
                        onChange={(e) => setPelakuSlkNo(e.target.value)}
                        placeholder="Contoh: 12/S-LK/01/2025"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Tanggal Terbit SLK</label>
                      <input
                        type="date"
                        value={pelakuSlkTanggal}
                        onChange={(e) => setPelakuSlkTanggal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Conditional Licensing Subforms */}
                  {pelakuJenis === 'PBPH' && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-3">
                      <h4 className="text-amber-400 font-bold font-mono tracking-wide">DETAIL PERIZINAN PBPH</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Nomor SK PBPH</label>
                          <input
                            type="text"
                            value={skPbphNo}
                            onChange={(e) => setSkPbphNo(e.target.value)}
                            placeholder="SK.99/MENLHK-PH/..."
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Tanggal SK PBPH</label>
                          <input
                            type="date"
                            value={skPbphTanggal}
                            onChange={(e) => setSkPbphTanggal(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-slate-300">Luas Areal (Ha)</label>
                          <input
                            type="text"
                            value={luasAreal}
                            onChange={(e) => setLuasAreal(e.target.value)}
                            placeholder="Contoh: 15430"
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-slate-300">Masa Berlaku S-LK</label>
                          <input
                            type="date"
                            value={slkMasaBerlaku}
                            onChange={(e) => setSlkMasaBerlaku(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-slate-300">Penerbit S-LK</label>
                          <input
                            type="text"
                            value={slkPenerbit}
                            onChange={(e) => setSlkPenerbit(e.target.value)}
                            placeholder="PT. Mutuagung..."
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Nomor SK RKUPH</label>
                          <input
                            type="text"
                            value={skRkuphNo}
                            onChange={(e) => setSkRkuphNo(e.target.value)}
                            placeholder="SK.12/MENLHK-PH/..."
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Tanggal SK RKUPH</label>
                          <input
                            type="date"
                            value={skRkuphTanggal}
                            onChange={(e) => setSkRkuphTanggal(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <h5 className="text-[11px] font-bold text-amber-500/80 border-b border-slate-800/60 pb-1 pt-1">Rencana Kerja Tahunan (RKTPH)</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Tahun RKTPH</label>
                          <select
                            value={rktphTahun}
                            onChange={(e) => setRktphTahun(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                          >
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                            <option value="2028">2028</option>
                            <option value="2029">2029</option>
                            <option value="2030">2030</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Luas RKTPH (Ha)</label>
                          <input
                            type="text"
                            value={luasRktph}
                            onChange={(e) => setLuasRktph(e.target.value)}
                            placeholder="Contoh: 2500"
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Nomor SK RKTPH</label>
                          <input
                            type="text"
                            value={skRktphNo}
                            onChange={(e) => setSkRktphNo(e.target.value)}
                            placeholder="SK.88/MENLHK-PH/..."
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Tanggal SK RKTPH</label>
                          <input
                            type="date"
                            value={skRktphTanggal}
                            onChange={(e) => setSkRktphTanggal(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Target RKTPH (Jenis)</label>
                          <select
                            value={targetRktphJenis}
                            onChange={(e) => setTargetRktphJenis(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                          >
                            <option value="">-- Pilih Target --</option>
                            <option value="Penanaman">Penanaman</option>
                            <option value="Produksi HHK">Produksi HHK</option>
                            <option value="Produksi HHBK">Produksi HHBK</option>
                            <option value="Pembayaran PSDH">Pembayaran PSDH</option>
                            <option value="Pembayaran DR">Pembayaran DR</option>
                          </select>
                        </div>
                        {targetRktphJenis === 'Produksi HHBK' && (
                          <div className="space-y-1">
                            <label className="font-bold text-slate-300">Jenis HHBK</label>
                            <select
                              value={targetRktphHhbkJenis}
                              onChange={(e) => setTargetRktphHhbkJenis(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                            >
                              <option value="">-- Pilih Jenis HHBK --</option>
                              <option value="Buah">Buah</option>
                              <option value="Biji">Biji</option>
                              <option value="Daun">Daun</option>
                              <option value="Rimpang">Rimpang</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {pelakuJenis === 'PBPHH' && (
                    <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-3">
                      <h4 className="text-amber-400 font-bold font-mono tracking-wide">DETAIL PERIZINAN PBPHH</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Nomor SK PBPHH</label>
                          <input
                            type="text"
                            value={skPbphhNo}
                            onChange={(e) => setSkPbphhNo(e.target.value)}
                            placeholder="SK.512/MENLHK-PHL/..."
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300">Tanggal SK PBPHH</label>
                          <input
                            type="date"
                            value={skPbphhTanggal}
                            onChange={(e) => setSkPbphhTanggal(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-slate-300">Kapasitas Produksi (Jenis)</label>
                          <select
                            value={kapasitasProduksiJenis}
                            onChange={(e) => setKapasitasProduksiJenis(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                          >
                            <option value="">-- Pilih Jenis --</option>
                            <option value="Veneer">Veneer</option>
                            <option value="Plywood">Plywood</option>
                            <option value="Kayu Gergajian">Kayu Gergajian</option>
                            <option value="Serpih">Serpih</option>
                            <option value="Block Board">Block Board</option>
                          </select>
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-slate-300">Masa Berlaku S-LK</label>
                          <input
                            type="date"
                            value={slkMasaBerlaku}
                            onChange={(e) => setSlkMasaBerlaku(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <label className="font-bold text-slate-300">Penerbit S-LK</label>
                          <input
                            type="text"
                            value={slkPenerbit}
                            onChange={(e) => setSlkPenerbit(e.target.value)}
                            placeholder="PT. Mutuagung..."
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Alamat Lengkap / Lokasi Operasional</label>
                    <textarea
                      value={pelakuAlamat}
                      onChange={(e) => setPelakuAlamat(e.target.value)}
                      rows={2}
                      placeholder="Kabupaten/Kota, Kalimantan Selatan..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-500 leading-normal"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#22293f]">
                  <button
                    onClick={() => {
                      setEditingPelakuId(null);
                      setIsAddingPelaku(false);
                    }}
                    className="px-3.5 py-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSavePelaku}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Pelaku Usaha
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
