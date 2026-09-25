import React, { useState } from 'react';
import { JenisKegiatan, User, PelakuUsaha } from '../types';
import { Briefcase, Users, Database } from 'lucide-react';
import JenisKegiatanTab from './master-data/JenisKegiatanTab';
import PelakuUsahaTab from './master-data/PelakuUsahaTab';
import StafTab from './master-data/StafTab';

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
            onClick={() => setActiveTab('kegiatan')}
            className={`px-3.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'kegiatan' ? 'bg-[#0d0d0d] border border-[#1c69d4] text-white' : 'text-[#7e7e7e] hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[#1c69d4]" />
            PERJALANAN DINAS
          </button>
          <button
            onClick={() => setActiveTab('pelaku_usaha')}
            className={`px-3.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'pelaku_usaha' ? 'bg-[#0d0d0d] border border-[#1c69d4] text-white' : 'text-[#7e7e7e] hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#1c69d4]" />
            PELAKU USAHA
          </button>
          <button
            onClick={() => setActiveTab('staf')}
            className={`px-3.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'staf' ? 'bg-[#0d0d0d] border border-[#1c69d4] text-white' : 'text-[#7e7e7e] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#1c69d4]" />
            DAFTAR STAF
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'kegiatan' && (
        <JenisKegiatanTab
          jenisKegiatanList={jenisKegiatanList}
          onUpdateJenisKegiatan={onUpdateJenisKegiatan}
        />
      )}

      {activeTab === 'pelaku_usaha' && (
        <PelakuUsahaTab
          pelakuUsahaList={pelakuUsahaList}
          onUpdatePelakuUsaha={onUpdatePelakuUsaha}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'staf' && (
        <StafTab
          allUsers={allUsers}
          onUpdateUsers={onUpdateUsers}
        />
      )}

    </div>
  );
}
