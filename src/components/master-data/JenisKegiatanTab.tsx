import React, { useState } from 'react';
import { JenisKegiatan } from '../../types';
import { Plus, Trash2, Check, X, Settings } from 'lucide-react';

interface JenisKegiatanTabProps {
  jenisKegiatanList: JenisKegiatan[];
  onUpdateJenisKegiatan: (list: JenisKegiatan[]) => void;
}

export default function JenisKegiatanTab({
  jenisKegiatanList,
  onUpdateJenisKegiatan,
}: JenisKegiatanTabProps) {
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

  return (
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
  );
}
