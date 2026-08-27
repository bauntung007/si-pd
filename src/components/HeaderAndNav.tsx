import { useState } from 'react';
import { User, AppNotification } from '../types';
import { Bell, UserCheck, Menu, FileText, Briefcase, Settings, Users, LogOut, Check } from 'lucide-react';

interface HeaderAndNavProps {
  currentUser: User;
  allUsers: User[];
  onRoleSwitch: (userId: string) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout?: () => void;
}

export default function HeaderAndNav({
  currentUser,
  allUsers,
  onRoleSwitch,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
  currentPage,
  onLogout,
}: HeaderAndNavProps) {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handlePageClick = (page: string) => {
    onNavigate(page);
    setShowMobileMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0e111d] border-b border-[#22293f] text-slate-100 shadow-md print:hidden">
      {/* Top Banner (Ministry of Environment and Forestry branding) */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-[11px] md:text-xs text-center py-1.5 px-4 font-medium tracking-wide flex items-center justify-center gap-2 border-b border-emerald-950/40 text-emerald-100">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Kementerian Kehutanan RI • BPHL Wilayah XI Banjarbaru
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handlePageClick('dashboard')}>
            <div className="relative w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg border border-amber-400/20">
              <Briefcase className="w-5 h-5 text-slate-900" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-[#0e111d] flex items-center justify-center text-[8px] font-bold">
                XI
              </div>
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-amber-500">
                LPD BPHL XI
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                Banjarbaru • SIPD Online
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handlePageClick('dashboard')}
              className={`px-3 py-2 rounded-md text-xs font-medium tracking-wide transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-amber-500/10 text-amber-500 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handlePageClick('laporan')}
              className={`px-3 py-2 rounded-md text-xs font-medium tracking-wide transition-colors ${
                currentPage === 'laporan' || currentPage === 'laporan-detail' || currentPage === 'laporan-form'
                  ? 'bg-amber-500/10 text-amber-500 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              Laporan Perjalanan Dinas
            </button>
            <button
              onClick={() => handlePageClick('telaahan-staf')}
              className={`px-3 py-2 rounded-md text-xs font-medium tracking-wide transition-colors ${
                currentPage === 'telaahan-staf'
                  ? 'bg-amber-500/10 text-amber-500 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              Telaahan Staf
            </button>

            {/* Verificator Section */}
            {(currentUser.role === 'verifikator' || currentUser.role === 'validator' || currentUser.role === 'admin') && (
              <button
                onClick={() => handlePageClick('verifikasi')}
                className={`px-3 py-2 rounded-md text-xs font-medium tracking-wide transition-colors ${
                  currentPage === 'verifikasi'
                    ? 'bg-amber-500/10 text-amber-500 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                Verifikasi LPD
              </button>
            )}

            {/* Admin Section */}
            {(currentUser.role === 'admin' || currentUser.role === 'validator') && (
              <>
                <button
                  onClick={() => handlePageClick('master-data')}
                  className={`px-3 py-2 rounded-md text-xs font-medium tracking-wide transition-colors ${
                    currentPage === 'master-data'
                      ? 'bg-amber-500/10 text-amber-500 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  Master Data
                </button>
              </>
            )}
          </nav>

          {/* Right Controls - Notification and Role-Switcher Simulation */}
          <div className="flex items-center gap-3">
            
            {/* Quick Role Switcher Panel */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleSelector(!showRoleSelector);
                  setShowNotificationDropdown(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-200 transition-all shadow-inner focus:outline-none"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Simulasi Peran:</span>
                <span className="font-bold text-amber-400 capitalize bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px]">
                  {currentUser.role === 'admin' ? 'admin / validator' : currentUser.role}
                </span>
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-72 bg-[#121626] border border-[#2b3353] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in-50 duration-100">
                  <div className="pb-2 mb-2 border-b border-[#2b3353] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 tracking-wide uppercase font-mono">
                      Ganti Akun & Peran
                    </span>
                    {onLogout ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleSelector(false);
                          onLogout();
                        }}
                        className="text-[10px] bg-red-950/40 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono hover:bg-red-900/40 hover:text-red-200 transition-all cursor-pointer"
                      >
                        LOGOUT
                      </button>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        Demo Mode
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                    Pilih akun staf kehutanan di bawah untuk menguji alur kerja (Staf mengajukan, Atasan memverifikasi & mencetak).
                  </p>
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                    {[...allUsers].sort((a, b) => {
                      // 1. Role hierarchy (admin -> validator -> verifikator -> user)
                      const getRoleWeight = (r: string) => {
                        if (r === 'admin') return 1;
                        if (r === 'validator') return 2;
                        if (r === 'verifikator') return 3;
                        return 4;
                      };
                      const roleDiff = getRoleWeight(a.role) - getRoleWeight(b.role);
                      if (roleDiff !== 0) return roleDiff;

                      // Helper to get score of PNS grades (golongan)
                      const getGolonganScore = (g?: string) => {
                        if (!g || g === '-') return 0;
                        const map: Record<string, number> = {
                          'IV/e': 18,
                          'IV/d': 17,
                          'IV/c': 16,
                          'IV/b': 15,
                          'IV/a': 14,
                          'III/d': 13,
                          'III/c': 12,
                          'III/b': 11,
                          'III/a': 10,
                          'II/d': 9,
                          'II/c': 8,
                          'II/b': 7,
                          'II/a': 6,
                          'I/d': 5,
                          'I/c': 4,
                          'I/b': 3,
                          'I/a': 2,
                        };
                        return map[g] || 1;
                      };

                      // Helper to get score of Jabatan
                      const getJabatanScore = (j?: string) => {
                        if (!j || j === '-') return 0;
                        const title = j.toLowerCase();
                        if (title.includes('kepala balai')) return 100;
                        if (title.includes('kepala sub bagian') || title.includes('kasubag')) return 90;
                        if (title.startsWith('kasi ') || title.includes('kasi_') || title.includes('kepala seksi')) return 80;
                        if (title.includes('madya')) return 70;
                        if (title.includes('muda')) return 60;
                        if (title.includes('pertama')) return 50;
                        if (title.includes('mahir')) return 40;
                        if (title.includes('terampil') || title.includes('pranata') || title.includes('barang')) return 30;
                        if (title.includes('pengolah') || title.includes('penelaah') || title.includes('analis')) return 20;
                        return 10;
                      };

                      // 2. Rank/Golongan score (highest first)
                      const golA = getGolonganScore(a.golongan);
                      const golB = getGolonganScore(b.golongan);
                      if (golB !== golA) return golB - golA;

                      // 3. Position/Jabatan score (highest first)
                      const jabA = getJabatanScore(a.jabatan);
                      const jabB = getJabatanScore(b.jabatan);
                      if (jabB !== jabA) return jabB - jabA;

                      // 4. TMT Pangkat (earliest first)
                      const tmtPangkatA = a.tmt_pangkat || '9999-12-31';
                      const tmtPangkatB = b.tmt_pangkat || '9999-12-31';
                      if (tmtPangkatA !== tmtPangkatB) {
                        return tmtPangkatA.localeCompare(tmtPangkatB);
                      }

                      // 5. TMT Jabatan (earliest first)
                      const tmtJabatanA = a.tmt_jabatan || '9999-12-31';
                      const tmtJabatanB = b.tmt_jabatan || '9999-12-31';
                      return tmtJabatanA.localeCompare(tmtJabatanB);
                    }).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onRoleSwitch(u.id);
                          setShowRoleSelector(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start justify-between gap-2 ${
                          currentUser.id === u.id
                            ? 'bg-amber-600/20 border border-amber-500/30 text-amber-300'
                            : 'hover:bg-slate-800/60 text-slate-300 border border-transparent hover:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                          <span className="font-bold truncate text-slate-100">{u.nama}</span>
                          {u.username && (
                            <span className="text-[10px] font-mono text-amber-500 font-semibold">
                              Akun: {u.username} | Pass: {u.password}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono">NIP. {u.nip}</span>
                          <span className="text-[10px] text-amber-400/95 font-medium">{u.jabatan}</span>
                          {u.pangkat && u.pangkat !== '-' && (
                            <span className="text-[9px] text-slate-400">
                              {u.pangkat} {u.golongan && u.golongan !== '-' ? `(${u.golongan})` : ''}
                            </span>
                          )}
                          {(u.tmt_pangkat || u.tmt_jabatan) && (
                            <span className="text-[8px] text-slate-500 font-mono pt-0.5 block">
                              TMT Pk: {u.tmt_pangkat || '-'} | Jb: {u.tmt_jabatan || '-'}
                            </span>
                          )}
                        </div>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded capitalize shrink-0 font-mono tracking-wide ${
                          u.role === 'admin'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : u.role === 'verifikator'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : u.role === 'validator'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.role === 'admin' ? 'admin / validator' : u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowRoleSelector(false);
                }}
                className="relative p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors focus:outline-none"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#121626] border border-[#2b3353] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 bg-[#171c31] border-b border-[#2b3353] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold focus:outline-none"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#22293f]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Tidak ada notifikasi sistem
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-[#161a2e] cursor-pointer ${
                            !n.is_read ? 'bg-[#181d36]/70' : ''
                          }`}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            if (n.laporan_id) {
                              onNavigate('laporan');
                            }
                            setShowNotificationDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-amber-400 font-mono text-[10px]">{n.judul}</span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-snug">{n.pesan}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 md:hidden bg-slate-800/80 rounded-lg text-slate-300 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {showMobileMenu && (
        <div className="md:hidden bg-[#0d101a] border-t border-[#22293f] py-2 px-3 space-y-1 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handlePageClick('dashboard')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold ${
              currentPage === 'dashboard' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handlePageClick('laporan')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold ${
              currentPage === 'laporan' || currentPage === 'laporan-detail' || currentPage === 'laporan-form'
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-slate-300'
            }`}
          >
            Daftar Laporan Perjalanan Dinas
          </button>
          <button
            onClick={() => handlePageClick('telaahan-staf')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold ${
              currentPage === 'telaahan-staf'
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-slate-300'
            }`}
          >
            Telaahan Staf (Kajian AI)
          </button>

          {(currentUser.role === 'verifikator' || currentUser.role === 'admin') && (
            <button
              onClick={() => handlePageClick('verifikasi')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold ${
                currentPage === 'verifikasi' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-300'
              }`}
            >
              Verifikasi LPD
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => handlePageClick('master-data')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold ${
                currentPage === 'master-data' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-300'
              }`}
            >
              Master Data Perjalanan Dinas
            </button>
          )}
        </div>
      )}
    </header>
  );
}
