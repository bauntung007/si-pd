import React, { useState, useEffect } from 'react';
import { User, JenisKegiatan, Laporan, AppNotification, PelakuUsaha, RiwayatPerubahan } from './types';
import { LocalDB } from './lib/db';
import HeaderAndNav from './components/HeaderAndNav';
import Dashboard from './components/Dashboard';
import LaporanForm from './components/LaporanForm';
import LaporanDetail from './components/LaporanDetail';
import VerifikasiPanel from './components/VerifikasiPanel';
import MasterDataPanel from './components/MasterDataPanel';
import DaftarLaporan from './components/DaftarLaporan';
import TelaahanStafPanel from './components/TelaahanStafPanel';
import { AlertCircle, FileText, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

// Initialize standard LocalDB eagerly to ensure database is ready before state initialization
LocalDB.initializeToDefault();

export default function App() {
  // System States
  const [allUsers, setAllUsers] = useState<User[]>(() => LocalDB.get('users', []));
  const [jenisKegiatanList, setJenisKegiatanList] = useState<JenisKegiatan[]>(() => LocalDB.get('jenis_kegiatan', []));
  const [laporanList, setLaporanList] = useState<Laporan[]>(() => LocalDB.get('laporan', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => LocalDB.get('notifications', []));
  const [pelakuUsahaList, setPelakuUsahaList] = useState<PelakuUsaha[]>(() => LocalDB.get('pelaku_usaha', []));

  // Default currentUser - checked from localStorage first
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const users = LocalDB.get('users', []);
    const savedUserId = localStorage.getItem('lpd_bphl_active_user_id');
    const savedUser = users.find((u: User) => u.id === savedUserId);
    if (savedUser) return savedUser;

    return users.find((u: User) => u.id === 'user-staff1') || users[2] || users[0] || {
      id: 'user-guest',
      nama: 'Guest Staf',
      nip: '-',
      jabatan: 'Staf',
      role: 'user',
      email: 'staff@example.com'
    };
  });

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('lpd_bphl_logged_in') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    localStorage.setItem('lpd_bphl_logged_in', 'true');
    localStorage.setItem('lpd_bphl_active_user_id', user.id);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('lpd_bphl_logged_in', 'false');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const cleanUsername = loginUsername.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    const matchedUser = allUsers.find(
      u => u.username?.toLowerCase() === cleanUsername && u.password === cleanPassword
    );

    if (matchedUser) {
      handleLogin(matchedUser);
      showToast(`Selamat datang kembali, ${matchedUser.nama}!`);
    } else {
      setLoginError('Nama akun atau kata sandi salah. Harap periksa detail akun Anda.');
    }
  };

  // Client Routing State
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [editingLaporan, setEditingLaporan] = useState<Laporan | null>(null);

  // Success feedback alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Safe Custom Confirmation Dialog state for iFrame compatibility
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  // Debug function to check database state and log findings
  const debugDatabaseState = () => {
    console.group('%c=== SISTEM DIAGNOSTIK DATA LPD & TELAAHAN ===', 'color: #6366f1; font-weight: bold; font-size: 13px;');
    
    // Retrieve counts from LocalDB
    const localLPD = LocalDB.get<Laporan[]>('laporan', []);
    const localTS = LocalDB.get<any[]>('telaahan_staf', []);
    
    console.log(`%c[LPD State - LocalDB]%c Jumlah Laporan Perjalanan Dinas: %c${localLPD.length}`, 'color: #10b981; font-weight: bold;', 'color: inherit;', 'color: #10b981; font-weight: bold;');
    console.log(`%c[TS State - LocalDB]%c Jumlah Telaahan Staf: %c${localTS.length}`, 'color: #8b5cf6; font-weight: bold;', 'color: inherit;', 'color: #8b5cf6; font-weight: bold;');
    
    // Analyze direct localStorage keys
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    
    const appKeys = allKeys.filter(k => k.startsWith('lpd_bphl_'));
    console.log(`Total kunci sistem ('lpd_bphl_*') di localStorage: ${appKeys.length}`);
    console.log('Daftar kunci:', appKeys);
    
    const hasLPDKey = appKeys.includes('lpd_bphl_laporan');
    const hasTSKey = appKeys.includes('lpd_bphl_telaahan_staf');
    
    console.log(`Kunci 'lpd_bphl_laporan' ada: ${hasLPDKey ? '✓ YA' : '❌ TIDAK'}`);
    console.log(`Kunci 'lpd_bphl_telaahan_staf' ada: ${hasTSKey ? '✓ YA' : '❌ TIDAK'}`);
    
    // Verify JSON integrity and parse direct from localStorage
    try {
      const rawLPD = localStorage.getItem('lpd_bphl_laporan');
      if (rawLPD) {
        const parsed = JSON.parse(rawLPD);
        console.log(`Validasi JSON 'lpd_bphl_laporan': Berhasil parse! Berisi ${Array.isArray(parsed) ? parsed.length : 0} item.`);
      }
    } catch (e) {
      console.error("EROR: Data 'lpd_bphl_laporan' korup atau bukan JSON valid!");
    }
    
    try {
      const rawTS = localStorage.getItem('lpd_bphl_telaahan_staf');
      if (rawTS) {
        const parsed = JSON.parse(rawTS);
        console.log(`Validasi JSON 'lpd_bphl_telaahan_staf': Berhasil parse! Berisi ${Array.isArray(parsed) ? parsed.length : 0} item.`);
      }
    } catch (e) {
      console.error("EROR: Data 'lpd_bphl_telaahan_staf' korup atau bukan JSON valid!");
    }
    
    // Compare with server backend JSON store
    fetch('/api/db/all')
      .then(res => res.json())
      .then(serverDb => {
        console.log('%c--- Perbandingan Data Server Backend ---', 'color: #f59e0b; font-weight: bold;');
        const serverLPDCount = serverDb?.laporan ? serverDb.laporan.length : 0;
        const serverTSCount = serverDb?.telaahan_staf ? serverDb.telaahan_staf.length : 0;
        
        console.log(`[SERVER DB] Jumlah Laporan: ${serverLPDCount}`);
        console.log(`[SERVER DB] Jumlah Telaahan Staf: ${serverTSCount}`);
        
        if (serverTSCount === 0 && localTS.length > 0) {
          console.warn("⚠️ PENYEBAB DISKREPANSI DETEKSI:");
          console.warn("Data 'telaahan_staf' tersimpan di local browser Anda (5 item), tetapi di server backend nilainya kosong/tidak ada.");
          console.warn("Hal ini dikarenakan kunci 'telaahan_staf' belum dimasukkan ke dalam daftar sinkronisasi backend ('keys' array pada App.tsx) sehingga perubahan/penambahan telaahan staf hanya bertahan di local browser, sedangkan laporan perjalanan dinas selalu disinkronkan dengan file 'db_store.json' server.");
        }
      })
      .catch(err => {
        console.error("Gagal melakukan verifikasi silang dengan database server:", err);
      });
      
    console.groupEnd();
  };

  // Sync data with backend filesystem database on mount
  useEffect(() => {
    const syncDbWithServer = async () => {
      try {
        const response = await fetch('/api/db/all');
        if (response.ok) {
          const serverDb = await response.json();
          const keys = ['users', 'jenis_kegiatan', 'laporan', 'notifications', 'pelaku_usaha', 'kop_surat', 'telaahan_staf'];
          
          // Check if server is empty
          const isServerEmpty = !serverDb || Object.keys(serverDb).length === 0;
          
          if (isServerEmpty) {
            console.log("Server DB is empty, seeding server from local state...");
            for (const key of keys) {
              const localVal = LocalDB.get(key, null);
              if (localVal) {
                await fetch(`/api/db/${key}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ value: localVal })
                });
              }
            }
          } else {
            console.log("Server DB has data, syncing client state...");
            if (serverDb.users) {
              setAllUsers(serverDb.users);
              localStorage.setItem('lpd_bphl_users', JSON.stringify(serverDb.users));
            }
            if (serverDb.jenis_kegiatan) {
              setJenisKegiatanList(serverDb.jenis_kegiatan);
              localStorage.setItem('lpd_bphl_jenis_kegiatan', JSON.stringify(serverDb.jenis_kegiatan));
            }
            if (serverDb.laporan) {
              setLaporanList(serverDb.laporan);
              localStorage.setItem('lpd_bphl_laporan', JSON.stringify(serverDb.laporan));
            }
            if (serverDb.notifications) {
              setNotifications(serverDb.notifications);
              localStorage.setItem('lpd_bphl_notifications', JSON.stringify(serverDb.notifications));
            }
            if (serverDb.pelaku_usaha) {
              setPelakuUsahaList(serverDb.pelaku_usaha);
              localStorage.setItem('lpd_bphl_pelaku_usaha', JSON.stringify(serverDb.pelaku_usaha));
            }
            if (serverDb.kop_surat) {
              localStorage.setItem('lpd_bphl_kop_surat', JSON.stringify(serverDb.kop_surat));
            }
            if (serverDb.telaahan_staf) {
              localStorage.setItem('lpd_bphl_telaahan_staf', JSON.stringify(serverDb.telaahan_staf));
            }
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi data dengan backend:", err);
      }
    };
    
    syncDbWithServer();
    debugDatabaseState();
  }, []);

  // Sync state changes with localStorage
  const updateUsersState = (newList: User[]) => {
    setAllUsers(newList);
    LocalDB.set('users', newList);
  };

  const updateJenisKegiatanState = (newList: JenisKegiatan[]) => {
    setJenisKegiatanList(newList);
    LocalDB.set('jenis_kegiatan', newList);
  };

  const updatePelakuUsahaState = (newList: PelakuUsaha[]) => {
    setPelakuUsahaList(newList);
    LocalDB.set('pelaku_usaha', newList);
  };

  const updateLaporanState = (newList: Laporan[]) => {
    setLaporanList(newList);
    LocalDB.set('laporan', newList);
  };

  const updateNotificationsState = (newList: AppNotification[]) => {
    setNotifications(newList);
    LocalDB.set('notifications', newList);
  };

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Role switching
  const handleRoleSwitch = (userId: string) => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      setIsLoggedIn(true);
      localStorage.setItem('lpd_bphl_logged_in', 'true');
      localStorage.setItem('lpd_bphl_active_user_id', userId);
      showToast(`Berhasil beralih akun simulasi ke: ${targetUser.nama}`);
      // return to dashboard on role switch to ensure page permissions are coherent
      setCurrentPage('dashboard');
    }
  };

  // Save / Submit Report
  const handleSaveLaporan = (laporan: Laporan) => {
    const isNew = !laporanList.some(l => l.id === laporan.id);
    let updatedLPD: Laporan[];

    if (isNew) {
      updatedLPD = [laporan, ...laporanList];
      showToast(laporan.status === 'submitted' 
        ? 'LPD sukses diajukan ke kepala balai!' 
        : 'LPD berhasil disimpan sebagai draft!'
      );
    } else {
      updatedLPD = laporanList.map(l => l.id === laporan.id ? laporan : l);
      showToast(laporan.status === 'submitted'
        ? 'Revisi LPD sukses diajukan kembali!'
        : 'Draft LPD sukses diperbarui!'
      );
    }

    updateLaporanState(updatedLPD);

    // Create a notification for verifiers if it was submitted
    if (laporan.status === 'submitted') {
      const verifiers = allUsers.filter(u => u.role === 'verifikator');
      const newNotifs: AppNotification[] = verifiers.map(v => ({
        id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 5),
        user_id: v.id,
        judul: 'Laporan Baru Masuk ✍',
        pesan: `${currentUser.nama} telah mengajukan LPD Baru: ${jenisKegiatanList.find(jk => jk.id === laporan.jenis_kegiatan_id)?.nama_kegiatan}`,
        is_read: false,
        created_at: new Date().toISOString(),
        laporan_id: laporan.id,
      }));
      updateNotificationsState([...newNotifs, ...notifications]);
    }

    // Reset routing states
    setEditingLaporan(null);
    setCurrentPage('laporan');
  };

  // Verifier Actions (Approve, Revision, Reject, Verify)
  const handleVerifyLaporan = (id: string, newStatus: Laporan['status'], notes: string) => {
    const updated = laporanList.map(l => {
      if (l.id === id) {
        const newRiwayat: RiwayatPerubahan = {
          id: 'riwayat-' + Date.now() + Math.random().toString(36).substring(2, 5),
          laporan_id: l.id,
          user_id: currentUser.id,
          user_nama: currentUser.nama,
          action: newStatus,
          status_before: l.status,
          status_after: newStatus,
          timestamp: new Date().toISOString(),
        };

        const riwayatList = l.riwayat_perubahan || [];

        return {
          ...l,
          status: newStatus,
          catatan_verifikator: notes,
          verifikator_id: currentUser.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          riwayat_perubahan: [...riwayatList, newRiwayat],
        };
      }
      return l;
    });

    updateLaporanState(updated);

    const targetLpd = laporanList.find(l => l.id === id);
    if (targetLpd) {
      let title = 'LPD Perlu Revisi ⚡';
      let message = `LPD Anda membutuhkan perbaikan: "${notes}"`;

      if (newStatus === 'verified') {
        title = 'LPD Terverifikasi TU ✓';
        message = `LPD Anda telah lolos verifikasi TU oleh ${currentUser.nama} dan kini menunggu pengesahan Kepala Balai/Validator.`;
      } else if (newStatus === 'approved') {
        title = 'LPD Disetujui & Disahkan ✓';
        message = `Selamat! LPD Anda telah disahkan secara final oleh Kepala Balai/Validator (${currentUser.nama}).`;
      } else if (newStatus === 'rejected') {
        title = 'LPD Ditolak ✗';
        message = `LPD ditolak oleh ${currentUser.nama} dengan catatan: "${notes}"`;
      } else if (newStatus === 'revision') {
        title = 'LPD Perlu Revisi ⚡';
        message = `LPD Anda memerlukan revisi oleh ${currentUser.nama}: "${notes}"`;
      }

      // Add feedback notification for the author of report
      const feedbackNotif: AppNotification = {
        id: 'notif-' + Date.now(),
        user_id: targetLpd.user_id,
        judul: title,
        pesan: message,
        is_read: false,
        created_at: new Date().toISOString(),
        laporan_id: id,
      };

      updateNotificationsState([feedbackNotif, ...notifications]);
    }

    showToast(`Status laporan sukses diubah menjadi: ${newStatus}`);
  };

  // Mark specific notification read
  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    updateNotificationsState(updated);
  };

  // Mark all notifications read for currentUser
  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map(n => n.user_id === currentUser.id ? { ...n, is_read: true } : n);
    updateNotificationsState(updated);
    showToast('Semua notifikasi ditandai sudah dibaca.');
  };

  // Delete Report (Admin privilege)
  const handleDeleteLaporan = (id: string) => {
    setConfirmDialog({
      title: 'Hapus LPD Secara Permanen',
      message: 'Apakah Anda yakin ingin menghapus Laporan Perjalanan Dinas ini secara permanen dari database sistem? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: () => {
        const updated = laporanList.filter(l => l.id !== id);
        updateLaporanState(updated);
        
        // Auto-cleanup corresponding Telaahan Staf
        const currentTSList = LocalDB.get<any[]>('telaahan_staf', []);
        const filteredTS = currentTSList.filter(ts => ts.laporan_id !== id);
        if (currentTSList.length !== filteredTS.length) {
          LocalDB.set('telaahan_staf', filteredTS);
        }

        showToast('Laporan Perjalanan Dinas berhasil dihapus!');
        if (selectedLaporan?.id === id) {
          setSelectedLaporan(null);
        }
        setCurrentPage('laporan');
        setConfirmDialog(null);
      }
    });
  };

  // Restore Default Seeds (for evaluation reset)
  const handleResetData = () => {
    setConfirmDialog({
      title: 'Reset Basis Data & Seeds',
      message: 'Apakah Anda yakin ingin mengulangi basis data simulasi ke awal? Seluruh draft, edit, dan data pelaku usaha yang baru Anda buat akan diriset kembali ke awal.',
      type: 'warning',
      onConfirm: () => {
        LocalDB.resetAll();
        setAllUsers(LocalDB.get('users', []));
        setJenisKegiatanList(LocalDB.get('jenis_kegiatan', []));
        setLaporanList(LocalDB.get('laporan', []));
        setNotifications(LocalDB.get('notifications', []));
        setPelakuUsahaList(LocalDB.get('pelaku_usaha', []));
        setCurrentPage('dashboard');
        showToast('Sistem dan database sukses direset ke data awal!');
        setConfirmDialog(null);
      }
    });
  };

  // Screen routing navigation
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedLaporan(null);
    setEditingLaporan(null);
  };

  // Selection handlers
  const handleSelectLaporan = (lpd: Laporan) => {
    setSelectedLaporan(lpd);
    setCurrentPage('laporan-detail');
  };

  const handleEditLaporanClick = (lpd: Laporan) => {
    setEditingLaporan(lpd);
    setCurrentPage('laporan-form');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070e] text-slate-100 font-sans p-4 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#0e1222] border border-[#1e2444] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-100">
              Sistem Penulisan LPD Otomatis
            </h1>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              BPHL Wilayah XI Banjarbaru
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Silakan masuk menggunakan nama akun (role_nama) untuk menguji otorisasi dokumen dan alur kerja verifikasi.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Nama Akun (Username)
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Contoh: user_lia, admin_busran"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Contoh: lia, busran"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-slate-600"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 rounded-lg text-[10px] text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer animate-none"
            >
              Masuk ke Aplikasi
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider font-mono">Bypass / Akses Instan</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] text-center text-slate-500 leading-relaxed">
              Anda juga dapat masuk secara instan menggunakan opsi peran di bawah ini:
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => {
                  const busran = allUsers.find(u => u.username === 'admin_busran');
                  if (busran) handleLogin(busran);
                }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 hover:border-amber-500/30 transition-all font-medium cursor-pointer"
              >
                🔑 Admin (Busran)
              </button>
              <button
                type="button"
                onClick={() => {
                  const wahyu = allUsers.find(u => u.username === 'validator_wahyu');
                  if (wahyu) handleLogin(wahyu);
                }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 hover:border-amber-500/30 transition-all font-medium cursor-pointer"
              >
                ✓ Validator (Wahyu)
              </button>
              <button
                type="button"
                onClick={() => {
                  const isma = allUsers.find(u => u.username === 'verifikator_isma');
                  if (isma) handleLogin(isma);
                }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 hover:border-amber-500/30 transition-all font-medium cursor-pointer"
              >
                🛡️ Verifikator (Isma)
              </button>
              <button
                type="button"
                onClick={() => {
                  const lia = allUsers.find(u => u.username === 'user_lia');
                  if (lia) handleLogin(lia);
                }}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 hover:border-amber-500/30 transition-all font-medium cursor-pointer"
              >
                👤 User (Lia)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05070e] text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-500">
      
      {/* Top Header & Navigation Panel */}
      <HeaderAndNav
        currentUser={currentUser}
        allUsers={allUsers}
        onRoleSwitch={handleRoleSwitch}
        notifications={notifications.filter(n => n.user_id === currentUser.id)}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onLogout={handleLogout}
      />

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0">
        
        {/* Dynamic page placement container */}
        <div className="space-y-6">
          
          {/* Toast Notification Alerts */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 bg-[#12182b] border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce font-sans font-semibold text-xs leading-none print:hidden">
              <CheckCircle2 className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Custom Safe Confirmation Dialog Modal */}
          {confirmDialog && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#020306]/85 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
              <div className="bg-[#0e1222] border border-[#1e2444] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    confirmDialog.type === 'danger' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {confirmDialog.type === 'danger' ? (
                      <Trash2 className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-extrabold text-slate-100 tracking-wide font-sans">
                      {confirmDialog.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {confirmDialog.message}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1a1f3c] text-xs font-bold font-sans">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all cursor-pointer border border-[#23294c] hover:border-[#303867]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      confirmDialog.onConfirm();
                    }}
                    className={`px-4 py-2 text-white rounded-xl transition-all cursor-pointer shadow-lg ${
                      confirmDialog.type === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                        : 'bg-amber-500 hover:bg-amber-600 !text-slate-950 font-bold shadow-amber-500/10'
                    }`}
                  >
                    {confirmDialog.type === 'danger' ? 'Ya, Hapus' : 'Ya, Reset'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGE ROUTER PLACEMENT */}
          {currentPage === 'dashboard' && (
            <Dashboard
              laporanList={laporanList}
              currentUser={currentUser}
              allUsers={allUsers}
              jenisKegiatanList={jenisKegiatanList}
              onNavigate={handleNavigate}
              onSelectLaporan={handleSelectLaporan}
              onCreateNew={() => {
                setEditingLaporan(null);
                setCurrentPage('laporan-form');
              }}
            />
          )}

          {currentPage === 'laporan' && (
            <DaftarLaporan
              laporanList={laporanList}
              allUsers={allUsers}
              jenisKegiatanList={jenisKegiatanList}
              currentUser={currentUser}
              onSelectLaporan={handleSelectLaporan}
              onCreateNew={() => {
                setEditingLaporan(null);
                setCurrentPage('laporan-form');
              }}
              onDeleteLaporan={handleDeleteLaporan}
            />
          )}

          {currentPage === 'laporan-form' && (
            <LaporanForm
              jenisKegiatanList={jenisKegiatanList}
              allUsers={allUsers}
              currentUser={currentUser}
              onSave={handleSaveLaporan}
              onCancel={() => handleNavigate('laporan')}
              editingLaporan={editingLaporan || undefined}
              pelakuUsahaList={pelakuUsahaList}
              onShowToast={showToast}
            />
          )}

          {currentPage === 'laporan-detail' && selectedLaporan && (
            <LaporanDetail
              laporan={selectedLaporan}
              allUsers={allUsers}
              jenisKegiatanList={jenisKegiatanList}
              currentUser={currentUser}
              onBack={() => handleNavigate('laporan')}
              onEdit={() => handleEditLaporanClick(selectedLaporan)}
              pelakuUsahaList={pelakuUsahaList}
              onDeleteLaporan={handleDeleteLaporan}
              onShowToast={showToast}
            />
          )}

          {currentPage === 'verifikasi' && (
            <VerifikasiPanel
              laporanList={laporanList}
              allUsers={allUsers}
              jenisKegiatanList={jenisKegiatanList}
              currentUser={currentUser}
              onVerify={handleVerifyLaporan}
              onSelectLaporan={handleSelectLaporan}
            />
          )}

          {currentPage === 'master-data' && (currentUser.role === 'admin' || currentUser.role === 'validator') && (
            <MasterDataPanel
              jenisKegiatanList={jenisKegiatanList}
              allUsers={allUsers}
              onUpdateJenisKegiatan={updateJenisKegiatanState}
              onUpdateUsers={updateUsersState}
              pelakuUsahaList={pelakuUsahaList}
              onUpdatePelakuUsaha={updatePelakuUsahaState}
              onShowToast={showToast}
            />
          )}

          {currentPage === 'telaahan-staf' && (
            <TelaahanStafPanel
              laporanList={laporanList}
              allUsers={allUsers}
              currentUser={currentUser}
              onShowToast={showToast}
            />
          )}

        </div>
      </main>

      {/* System Footer of Application */}
      <footer className="bg-[#0b0e1a] border-t border-[#1d233a] py-6 text-center text-slate-500 text-xs mt-12 print:hidden select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-slate-400">
            Sistem Informasi Laporan Perjalanan Dinas Digital (LPD Online)
          </p>
          <p>
            Hak Cipta &copy; 2026 Balai Pengelolaan Hutan Lestari Wilayah XI Banjarbaru.
          </p>
          <div className="pt-2 flex justify-center items-center gap-3">
            <button
              onClick={handleResetData}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-500 rounded text-[10px] font-mono cursor-pointer transition-colors"
            >
              Ulangi Basis Data (Reset Seeds)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
