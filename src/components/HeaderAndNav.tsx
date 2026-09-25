import { useState } from 'react';
import { User, AppNotification } from '../types';
import { Bell, UserCheck, Menu, Briefcase, LogOut } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-[#000000] border-b border-[#3c3c3c] text-white shadow-2xl print:hidden">
      {/* BMW M Tricolor Signature Top Bar */}
      <div className="m-stripe-bg h-1 w-full"></div>

      {/* Top Banner (Ministry of Environment and Forestry branding) */}
      <div className="bg-[#0d0d0d] text-[10px] md:text-xs text-center py-1.5 px-4 font-mono tracking-widest uppercase flex items-center justify-center gap-3 border-b border-[#262626] text-[#bbbbbb]">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-[#0066b1] inline-block"></span>
          <span className="w-1.5 h-1.5 bg-[#1c69d4] inline-block"></span>
          <span className="w-1.5 h-1.5 bg-[#e22718] inline-block"></span>
        </div>
        <span>KEMENTERIAN KEHUTANAN RI • BPHL WILAYAH XI BANJARBARU</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handlePageClick('dashboard')}>
            <div className="relative w-10 h-10 bg-[#1a1a1a] border border-[#3c3c3c] flex items-center justify-center group-hover:border-[#1c69d4] transition-colors">
              <Briefcase className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 px-1 bg-[#1c69d4] text-white text-[8px] font-bold font-mono">
                M
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-base leading-none tracking-wider text-white uppercase font-sans">
                  LPD BPHL XI
                </h1>
                <div className="flex h-3.5 w-4 overflow-hidden rounded-none">
                  <span className="w-1.3 bg-[#0066b1]"></span>
                  <span className="w-1.3 bg-[#1c69d4]"></span>
                  <span className="w-1.3 bg-[#e22718]"></span>
                </div>
              </div>
              <p className="text-[9px] text-[#7e7e7e] font-mono tracking-widest uppercase pt-0.5">
                BANJARBARU • SIPD PERFORMANCE
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => handlePageClick('dashboard')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all rounded-none border-b-2 ${
                currentPage === 'dashboard'
                  ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
                  : 'border-transparent text-[#bbbbbb] hover:text-white hover:bg-[#1a1a1a]/50'
              }`}
            >
              DASHBOARD
            </button>
            <button
              onClick={() => handlePageClick('laporan')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all rounded-none border-b-2 ${
                currentPage === 'laporan' || currentPage === 'laporan-detail' || currentPage === 'laporan-form'
                  ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
                  : 'border-transparent text-[#bbbbbb] hover:text-white hover:bg-[#1a1a1a]/50'
              }`}
            >
              LAPORAN PERDIN
            </button>
            <button
              onClick={() => handlePageClick('telaahan-staf')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all rounded-none border-b-2 ${
                currentPage === 'telaahan-staf'
                  ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
                  : 'border-transparent text-[#bbbbbb] hover:text-white hover:bg-[#1a1a1a]/50'
              }`}
            >
              TELAAHAN STAF
            </button>

            {/* Verificator Section */}
            {(currentUser.role === 'verifikator' || currentUser.role === 'validator' || currentUser.role === 'admin') && (
              <button
                onClick={() => handlePageClick('verifikasi')}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all rounded-none border-b-2 ${
                  currentPage === 'verifikasi'
                    ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
                    : 'border-transparent text-[#bbbbbb] hover:text-white hover:bg-[#1a1a1a]/50'
                }`}
              >
                VERIFIKASI
              </button>
            )}

            {/* Admin Section */}
            {(currentUser.role === 'admin' || currentUser.role === 'validator') && (
              <button
                onClick={() => handlePageClick('master-data')}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all rounded-none border-b-2 ${
                  currentPage === 'master-data'
                    ? 'border-[#1c69d4] text-white bg-[#1a1a1a]'
                    : 'border-transparent text-[#bbbbbb] hover:text-white hover:bg-[#1a1a1a]/50'
                }`}
              >
                MASTER DATA
              </button>
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
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] border border-[#3c3c3c] rounded-none text-xs font-bold uppercase tracking-wider text-white transition-all focus:outline-none"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#1c69d4]" />
                <span className="hidden sm:inline text-[#bbbbbb] font-mono">PERAN:</span>
                <span className="font-bold text-white uppercase bg-[#000000] border border-[#3c3c3c] px-2 py-0.5 text-[10px] tracking-widest font-mono">
                  {currentUser.role === 'admin' ? 'ADMIN/VAL' : currentUser.role}
                </span>
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none shadow-2xl p-4 z-50 animate-in fade-in-50 duration-100">
                  <div className="m-stripe-bg h-0.5 w-full mb-3"></div>
                  <div className="pb-2 mb-2 border-b border-[#262626] flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-widest uppercase font-mono">
                      SIMULASI PERAN & AKUN
                    </span>
                    {onLogout ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleSelector(false);
                          onLogout();
                        }}
                        className="text-[10px] bg-[#e22718]/20 border border-[#e22718] text-[#ffffff] px-2 py-0.5 rounded-none font-mono hover:bg-[#e22718] transition-all cursor-pointer font-bold"
                      >
                        LOGOUT
                      </button>
                    ) : (
                      <span className="text-[10px] bg-[#0d0d0d] text-[#7e7e7e] px-2 py-0.5 rounded-none font-mono border border-[#262626]">
                        DEMO MODE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#bbbbbb] mb-3 leading-relaxed font-light">
                    Pilih akun staf kehutanan di bawah untuk menguji alur verifikasi & penerbitan dokumen.
                  </p>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                    {[...allUsers].sort((a, b) => {
                      const getRoleWeight = (r: string) => {
                        if (r === 'admin') return 1;
                        if (r === 'validator') return 2;
                        if (r === 'verifikator') return 3;
                        return 4;
                      };
                      return getRoleWeight(a.role) - getRoleWeight(b.role);
                    }).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onRoleSwitch(u.id);
                          setShowRoleSelector(false);
                        }}
                        className={`w-full text-left p-3 rounded-none text-xs transition-all flex items-start justify-between gap-2 border ${
                          currentUser.id === u.id
                            ? 'bg-[#0d0d0d] border-[#1c69d4] text-white'
                            : 'bg-[#1a1a1a] hover:bg-[#262626] text-[#bbbbbb] border-[#262626] hover:border-[#3c3c3c]'
                        }`}
                      >
                        <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                          <span className="font-bold truncate text-white uppercase font-sans tracking-wide">{u.nama}</span>
                          {u.username && (
                            <span className="text-[10px] font-mono text-[#1c69d4] font-bold">
                              @{u.username}
                            </span>
                          )}
                          <span className="text-[9px] text-[#7e7e7e] font-mono">NIP. {u.nip}</span>
                          <span className="text-[10px] text-white font-mono font-medium">{u.jabatan}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-none uppercase shrink-0 font-mono tracking-widest border ${
                          u.role === 'admin'
                            ? 'bg-[#e22718]/10 text-[#e22718] border-[#e22718]/40'
                            : u.role === 'verifikator'
                            ? 'bg-[#1c69d4]/10 text-[#1c69d4] border-[#1c69d4]/40'
                            : u.role === 'validator'
                            ? 'bg-[#0066b1]/10 text-[#0066b1] border-[#0066b1]/40'
                            : 'bg-[#262626] text-white border-[#3c3c3c]'
                        }`}>
                          {u.role === 'admin' ? 'ADMIN/VAL' : u.role}
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
                className="relative p-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#3c3c3c] rounded-none text-white transition-colors focus:outline-none"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#e22718] text-white font-bold rounded-none text-[9px] px-1 font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] border border-[#3c3c3c] rounded-none shadow-2xl z-50 overflow-hidden">
                  <div className="m-stripe-bg h-0.5 w-full"></div>
                  <div className="p-3 bg-[#0d0d0d] border-b border-[#262626] flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">NOTIFIKASI SISTEM</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[10px] text-[#1c69d4] hover:text-white font-mono font-bold uppercase tracking-wider focus:outline-none"
                      >
                        TANDAI DIBACA
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#262626]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-[#7e7e7e] text-xs font-light">
                        Tidak ada notifikasi sistem
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-[#262626] cursor-pointer ${
                            !n.is_read ? 'bg-[#0d0d0d]' : ''
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
                            <span className="font-bold text-white font-mono text-[10px] uppercase tracking-wider">{n.judul}</span>
                            <span className="text-[9px] text-[#7e7e7e] font-mono">
                              {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[#bbbbbb] font-light leading-snug">{n.pesan}</p>
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
              className="p-2 md:hidden bg-[#1a1a1a] border border-[#3c3c3c] rounded-none text-white focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {showMobileMenu && (
        <div className="md:hidden bg-[#0d0d0d] border-t border-[#3c3c3c] py-3 px-4 space-y-2">
          <button
            onClick={() => handlePageClick('dashboard')}
            className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest ${
              currentPage === 'dashboard' ? 'bg-[#1a1a1a] text-white border-l-2 border-[#1c69d4]' : 'text-[#bbbbbb]'
            }`}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => handlePageClick('laporan')}
            className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest ${
              currentPage === 'laporan' || currentPage === 'laporan-detail' || currentPage === 'laporan-form'
                ? 'bg-[#1a1a1a] text-white border-l-2 border-[#1c69d4]'
                : 'text-[#bbbbbb]'
            }`}
          >
            LAPORAN PERDIN
          </button>
          <button
            onClick={() => handlePageClick('telaahan-staf')}
            className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest ${
              currentPage === 'telaahan-staf'
                ? 'bg-[#1a1a1a] text-white border-l-2 border-[#1c69d4]'
                : 'text-[#bbbbbb]'
            }`}
          >
            TELAAHAN STAF
          </button>

          {(currentUser.role === 'verifikator' || currentUser.role === 'admin') && (
            <button
              onClick={() => handlePageClick('verifikasi')}
              className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest ${
                currentPage === 'verifikasi' ? 'bg-[#1a1a1a] text-white border-l-2 border-[#1c69d4]' : 'text-[#bbbbbb]'
              }`}
            >
              VERIFIKASI LPD
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => handlePageClick('master-data')}
              className={`w-full text-left px-3 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest ${
                currentPage === 'master-data' ? 'bg-[#1a1a1a] text-white border-l-2 border-[#1c69d4]' : 'text-[#bbbbbb]'
              }`}
            >
              MASTER DATA
            </button>
          )}
        </div>
      )}
    </header>
  );
}

