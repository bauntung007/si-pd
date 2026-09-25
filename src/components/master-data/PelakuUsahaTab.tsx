import React, { useState } from 'react';
import { PelakuUsaha } from '../../types';
import { Plus, Check, X, Database, RefreshCw } from 'lucide-react';

interface PelakuUsahaTabProps {
  pelakuUsahaList: PelakuUsaha[];
  onUpdatePelakuUsaha: (list: PelakuUsaha[]) => void;
  onShowToast?: (msg: string) => void;
}

export default function PelakuUsahaTab({
  pelakuUsahaList,
  onUpdatePelakuUsaha,
  onShowToast,
}: PelakuUsahaTabProps) {
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

  const handleEditPelakuClick = (pu: PelakuUsaha) => {
    setEditingPelakuId(pu.id);
    setIsAddingPelaku(false);
    setPelakuNama(pu.nama);
    setPelakuJenis(pu.jenis_usaha);
    setPelakuSlkNo(pu.slk_no);
    setPelakuSlkTanggal(pu.slk_tanggal);
    setPelakuAlamat(pu.alamat);
    setPelakuPimpinan(pu.pimpinan);

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

    setSkPbphhNo('');
    setSkPbphhTanggal('');
    setKapasitasProduksiJenis('');
  };

  const handleSavePelaku = () => {
    if (!pelakuNama.trim() || !pelakuSlkNo.trim()) return;

    const extraFields = {
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

              {/* Conditional Subforms for PBPH */}
              {pelakuJenis === 'PBPH' && (
                <div className="p-4 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none space-y-3">
                  <h4 className="text-white font-bold font-mono tracking-widest uppercase text-xs">DETAIL PERIZINAN PBPH</h4>
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
                    <div className="space-y-1">
                      <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Luas Areal (Ha)</label>
                      <input
                        type="text"
                        value={luasAreal}
                        onChange={(e) => setLuasAreal(e.target.value)}
                        placeholder="15430"
                        className="bmw-input w-full font-mono text-xs py-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Masa Berlaku S-LK</label>
                      <input
                        type="date"
                        value={slkMasaBerlaku}
                        onChange={(e) => setSlkMasaBerlaku(e.target.value)}
                        className="bmw-input w-full font-mono text-xs py-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Penerbit S-LK</label>
                      <input
                        type="text"
                        value={slkPenerbit}
                        onChange={(e) => setSlkPenerbit(e.target.value)}
                        placeholder="PT Mutuagung..."
                        className="bmw-input w-full font-sans text-xs py-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Subforms for PBPHH */}
              {pelakuJenis === 'PBPHH' && (
                <div className="p-4 bg-[#0d0d0d] border border-[#3c3c3c] rounded-none space-y-3">
                  <h4 className="text-white font-bold font-mono tracking-widest uppercase text-xs">DETAIL PERIZINAN PBPHH</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#bbbbbb] uppercase font-mono text-[10px]">Nomor SK PBPHH</label>
                      <input
                        type="text"
                        value={skPbphhNo}
                        onChange={(e) => setSkPbphhNo(e.target.value)}
                        placeholder="SK.45/MENLHK-PHH/..."
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
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-white uppercase font-mono tracking-wider block">ALAMAT LENGKAP LOKASI USAHA</label>
                <textarea
                  value={pelakuAlamat}
                  onChange={(e) => setPelakuAlamat(e.target.value)}
                  rows={2}
                  placeholder="Jl. Raya Banjarbaru KM 24, Kalimantan Selatan"
                  className="bmw-input w-full font-sans leading-relaxed text-xs"
                />
              </div>
            </div>

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
                SIMPAN DATA PELAKU USAHA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
