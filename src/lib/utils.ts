import { User } from '../types';

/**
 * Utility functions for legal basis and regulations sorting.
 * Orders regulations hierarchically:
 * 1. Undang-Undang (UU)
 * 2. Peraturan Pemerintah Pengganti Undang-Undang (Perppu)
 * 3. Peraturan Pemerintah (PP)
 * 4. Peraturan Presiden (Perpres)
 * 5. Peraturan Menteri (Permen)
 * 6. Keputusan Menteri (Kepmen)
 * 7. Peraturan Dirjen (Perdirjen)
 * 8. Keputusan Dirjen (Kepdirjen)
 * 9. Daftar Isian Pelaksanaan Anggaran (DIPA)
 * 10. Other / Miscellaneous
 * 11. Surat Tugas (last)
 *
 * Within the same level, sorts chronologically ascending by year of publication.
 */

export function classifyLevel(text: string): number {
  const lower = text.toLowerCase();

  // Level 11: Surat Tugas (last)
  if (lower.includes('surat tugas') || /\bst\b/.test(lower)) {
    return 11;
  }
  // Level 2: Peraturan Pemerintah Pengganti Undang-Undang / Perppu
  if (lower.includes('pemerintah pengganti') || lower.includes('perppu') || lower.includes('perpu')) {
    return 2;
  }
  // Level 1: Undang-Undang / UU
  if (lower.includes('undang-undang') || lower.includes('undang undang') || /\buu\b/.test(lower)) {
    return 1;
  }
  // Level 3: Peraturan Pemerintah / PP
  if (lower.includes('peraturan pemerintah') || /\bpp\b/.test(lower)) {
    return 3;
  }
  // Level 4: Peraturan Presiden / Perpres
  if (lower.includes('peraturan presiden') || lower.includes('perpres')) {
    return 4;
  }
  // Level 5: Peraturan Menteri / Permen
  if (lower.includes('peraturan menteri') || lower.includes('permen')) {
    return 5;
  }
  // Level 6: Keputusan Menteri / Kepmen
  if (lower.includes('keputusan menteri') || lower.includes('kepmen')) {
    return 6;
  }
  // Level 7: Peraturan Direktur Jenderal / Perdirjen
  if (lower.includes('peraturan direktur jenderal') || lower.includes('peraturan dirjen') || lower.includes('perdirjen')) {
    return 7;
  }
  // Level 8: Keputusan Direktur Jenderal / Kepdirjen
  if (lower.includes('keputusan direktur jenderal') || lower.includes('keputusan dirjen') || lower.includes('kepdirjen')) {
    return 8;
  }
  // Level 9: Daftar Isian Pelaksanaan Anggaran / DIPA
  if (lower.includes('daftar isian pelaksanaan anggaran') || lower.includes('dipa')) {
    return 9;
  }

  // Other regulations go to level 10 (before Surat Tugas)
  return 10;
}

export function extractYear(text: string): number {
  // Try to find "Tahun XXXX" or "tahun XXXX" or "th. XXXX"
  const tahunMatch = text.match(/(?:tahun|th\.)\s*([0-9]{4})/i);
  if (tahunMatch) {
    return parseInt(tahunMatch[1], 10);
  }

  // Look for any 4-digit number between 1945 and 2030, possibly inside dates or numbers like /2020 or /2021
  const matches = text.match(/\b(19\d{2}|20[0-2]\d|2030)\b/g);
  if (matches && matches.length > 0) {
    // Return the last match as it's typically the year (e.g. "SK.9895/Menlhk-PHPL/.../2020" or "Nomor ... Tanggal 18 Mei 2025" -> 2025)
    return parseInt(matches[matches.length - 1], 10);
  }

  return 9999; // Fallback so regulations with missing years are placed at the end of their category
}

export function sortRegulations(regulationsList: string[]): string[] {
  return [...regulationsList].sort((a, b) => {
    const lvlA = classifyLevel(a);
    const lvlB = classifyLevel(b);

    if (lvlA !== lvlB) {
      return lvlA - lvlB;
    }

    const yearA = extractYear(a);
    const yearB = extractYear(b);

    if (yearA !== yearB) {
      return yearA - yearB;
    }

    // Secondary fallback: alphabetical sort to ensure consistent deterministic sorting
    return a.localeCompare(b);
  });
}

const GOLONGAN_ORDER: Record<string, number> = {
  'IV/E': 17,
  'IV/D': 16,
  'IV/C': 15,
  'IV/B': 14,
  'IV/A': 13,
  'III/D': 12,
  'III/C': 11,
  'III/B': 10,
  'III/A': 9,
  'II/D': 8,
  'II/C': 7,
  'II/B': 6,
  'II/A': 5,
  'I/D': 4,
  'I/C': 3,
  'I/B': 2,
  'I/A': 1,
};

const PANGKAT_ORDER: Record<string, number> = {
  'PEMBINA UTAMA': 17,
  'PEMBINA UTAMA MADYA': 16,
  'PEMBINA UTAMA MUDA': 15,
  'PEMBINA TINGKAT I': 14,
  'PEMBINA': 13,
  'PENATA TINGKAT I': 12,
  'PENATA': 11,
  'PENATA MUDA TINGKAT I': 10,
  'PENATA MUDA': 9,
  'PENGATUR TINGKAT I': 8,
  'PENGATUR': 7,
  'PENGATUR MUDA TINGKAT I': 6,
  'PENGATUR MUDA': 5,
  'JURU TINGKAT I': 4,
  'JURU': 3,
  'JURU MUDA TINGKAT I': 2,
  'JURU MUDA': 1,
};

export function getGolonganScore(golongan?: string): number {
  if (!golongan) return 0;
  const cleaned = golongan.trim().toUpperCase();
  return GOLONGAN_ORDER[cleaned] || 0;
}

export function getPangkatScore(pangkat?: string): number {
  if (!pangkat) return 0;
  const cleaned = pangkat.trim().toUpperCase();
  return PANGKAT_ORDER[cleaned] || 0;
}

export function getJabatanScore(jabatan?: string): number {
  if (!jabatan) return 0;
  const lower = jabatan.toLowerCase().trim();
  if (lower.includes('kepala balai') || lower.includes('ka. balai') || lower === 'kabalai') return 100;
  if (
    lower.includes('kepala sub bagian') || 
    lower.includes('kasubag') || 
    lower.includes('kasubbag') || 
    lower.includes('sub bagian tu') ||
    lower.includes('subbag tu') ||
    lower.includes('subbag tata usaha')
  ) return 90;
  if (lower.includes('kepala seksi') || lower.includes('kasi')) return 80;
  if (lower.includes('madya')) return 70;
  if (lower.includes('muda')) return 60;
  if (lower.includes('pertama')) return 50;
  if (lower.includes('penyelia')) return 40;
  if (lower.includes('mahir') || lower.includes('pelaksana lanjutan')) return 35;
  if (lower.includes('terampil') || lower.includes('pelaksana')) return 30;
  if (lower.includes('pemula')) return 25;
  if (lower.includes('analis') || lower.includes('pengolah') || lower.includes('penelaah')) return 20;
  if (lower.includes('operator') || lower.includes('pengadministrasi') || lower.includes('staff') || lower.includes('staf')) return 15;
  return 10;
}

export function sortPelaksana(usersList: User[]): User[] {
  return [...usersList].sort((a, b) => {
    // 1. Compare rank (pangkat/golongan) - HIGHEST first
    const rankScoreA = Math.max(getGolonganScore(a.golongan), getPangkatScore(a.pangkat));
    const rankScoreB = Math.max(getGolonganScore(b.golongan), getPangkatScore(b.pangkat));
    if (rankScoreA !== rankScoreB) {
      return rankScoreB - rankScoreA; // descending
    }

    // 2. Compare position (jabatan) - HIGHEST first
    const jabScoreA = getJabatanScore(a.jabatan);
    const jabScoreB = getJabatanScore(b.jabatan);
    if (jabScoreA !== jabScoreB) {
      return jabScoreB - jabScoreA; // descending
    }

    // 3. Compare TMT Pangkat - OLDEST first (earlier date is older)
    const tmtPangkatA = a.tmt_pangkat || '9999-12-31';
    const tmtPangkatB = b.tmt_pangkat || '9999-12-31';
    const compPangkat = tmtPangkatA.localeCompare(tmtPangkatB);
    if (compPangkat !== 0) {
      return compPangkat; // ascending (oldest first)
    }

    // 4. Compare TMT Jabatan - OLDEST first
    const tmtJabatanA = a.tmt_jabatan || '9999-12-31';
    const tmtJabatanB = b.tmt_jabatan || '9999-12-31';
    const compJabatan = tmtJabatanA.localeCompare(tmtJabatanB);
    if (compJabatan !== 0) {
      return compJabatan; // ascending (oldest first)
    }

    // 5. Final fallback: alphabetical by name
    return a.nama.localeCompare(b.nama);
  });
}

export function sortPelaksanaDinas(usersList: User[]): User[] {
  return [...usersList].sort((a, b) => {
    // 1. Compare position (jabatan) - HIGHEST first (structural-first)
    const jabScoreA = getJabatanScore(a.jabatan);
    const jabScoreB = getJabatanScore(b.jabatan);
    if (jabScoreA !== jabScoreB) {
      return jabScoreB - jabScoreA; // descending (highest score first)
    }

    // 2. Compare rank (pangkat/golongan) - HIGHEST first
    const rankScoreA = Math.max(getGolonganScore(a.golongan), getPangkatScore(a.pangkat));
    const rankScoreB = Math.max(getGolonganScore(b.golongan), getPangkatScore(b.pangkat));
    if (rankScoreA !== rankScoreB) {
      return rankScoreB - rankScoreA; // descending
    }

    // 3. Compare TMT Pangkat - OLDEST first (earlier date is older)
    const tmtPangkatA = a.tmt_pangkat || '9999-12-31';
    const tmtPangkatB = b.tmt_pangkat || '9999-12-31';
    const compPangkat = tmtPangkatA.localeCompare(tmtPangkatB);
    if (compPangkat !== 0) {
      return compPangkat; // ascending (oldest first)
    }

    // 4. Compare TMT Jabatan - OLDEST first
    const tmtJabatanA = a.tmt_jabatan || '9999-12-31';
    const tmtJabatanB = b.tmt_jabatan || '9999-12-31';
    const compJabatan = tmtJabatanA.localeCompare(tmtJabatanB);
    if (compJabatan !== 0) {
      return compJabatan; // ascending (oldest first)
    }

    // 5. Fallback: alphabetical by name
    return a.nama.localeCompare(b.nama);
  });
}

