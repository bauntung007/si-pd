import React, { useState } from 'react';
import { User } from '../../types';
import { Plus, Check, X, Users } from 'lucide-react';

interface StafTabProps {
  allUsers: User[];
  onUpdateUsers: (list: User[]) => void;
}

export default function StafTab({
  allUsers,
  onUpdateUsers,
}: StafTabProps) {
  const [editingStafId, setEditingStafId] = useState<string | null>(null);
  const [isAddingStaf, setIsAddingStaf] = useState(false);
  const [stafNip, setStafNip] = useState('');
  const [stafNama, setStafNama] = useState('');
  const [stafJabatan, setStafJabatan] = useState('');
  const [stafEmail, setStafEmail] = useState('');
  const [stafRole, setStafRole] = useState<'admin' | 'verifikator' | 'user'>('user');

  const handleEditStafClick = (staf: User) => {
    setEditingStafId(staf.id);
    setIsAddingStaf(false);
    setStafNip(staf.nip);
    setStafNama(staf.nama);
    setStafJabatan(staf.jabatan);
    setStafEmail(staf.email);
    setStafRole(staf.role as any);
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

  return (
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

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-white uppercase font-mono tracking-wider block">NOMOR INDUK PEGAWAI (NIP)</label>
                <input
                  type="text"
                  value={stafNip}
                  onChange={(e) => setStafNip(e.target.value)}
                  placeholder="199406072022031000"
                  className="bmw-input w-full font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white uppercase font-mono tracking-wider block">NAMA LENGKAP & GELAR</label>
                <input
                  type="text"
                  value={stafNama}
                  onChange={(e) => setStafNama(e.target.value)}
                  placeholder="Iman Tochid, S.Hut."
                  className="bmw-input w-full font-sans text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white uppercase font-mono tracking-wider block">JABATAN STRUKTURAL / FUNGSIONAL</label>
                <input
                  type="text"
                  value={stafJabatan}
                  onChange={(e) => setStafJabatan(e.target.value)}
                  placeholder="Pengendali Ekosistem Hutan Pemula"
                  className="bmw-input w-full font-sans text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white uppercase font-mono tracking-wider block">ALAMAT SURAT ELEKTRONIK (EMAIL)</label>
                <input
                  type="email"
                  value={stafEmail}
                  onChange={(e) => setStafEmail(e.target.value)}
                  placeholder="iman.tochid@menlhk.go.id"
                  className="bmw-input w-full font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white uppercase font-mono tracking-wider block">PERAN OTORISASI (ROLE)</label>
                <select
                  value={stafRole}
                  onChange={(e) => setStafRole(e.target.value as any)}
                  className="bmw-input w-full font-mono text-xs cursor-pointer"
                >
                  <option value="user">USER (STAF PELAKSANA)</option>
                  <option value="verifikator">VERIFIKATOR (SUBBAG TU)</option>
                  <option value="admin">ADMIN / VALIDATOR (KEPALA BALAI)</option>
                </select>
              </div>
            </div>

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
                SIMPAN PERSONIL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
