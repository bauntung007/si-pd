import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DB_FILE_PATH = path.join(process.cwd(), "db_store.json");

// Helper to read database state from server file
function readDbFile() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading db_store.json, using memory instead:", err);
  }
  return {};
}

// Helper to write database state to server file
function writeDbFile(data: any) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db_store.json:", err);
  }
}

// Helper to safely parse JSON that may be wrapped in Markdown code blocks
function parseCleanJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Database Persistence API Routes
app.get("/api/db/all", (req, res) => {
  const db = readDbFile();
  res.json(db);
});

app.get("/api/db/:key", (req, res) => {
  const { key } = req.params;
  const db = readDbFile();
  res.json({ value: db[key] || null });
});

app.post("/api/db/:key", (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  const db = readDbFile();
  db[key] = value;
  writeDbFile(db);
  
  res.json({ success: true });
});

// Route to serve the Kemenhut logo SVG
app.get("/api/kemenhut-logo.svg", (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.sendFile(path.join(process.cwd(), "assets", "kemenhut-logo.svg"));
});

// API route for AI Generation
app.post("/api/generate-ai", async (req, res) => {
  const { type, pembahasan, kesimpulan } = req.body;

  if (!pembahasan) {
    return res.status(400).json({ error: "Hasil Pembahasan tidak boleh kosong." });
  }

  const getFallback = () => {
    if (type === "kesimpulan") {
      return {
        text: `Berdasarkan hasil pemeriksaan administrasi dan pemeriksan lapangan sebagaimana tersebut di atas, dapat disimpulkan hal-hal sebagai berikut:\n1. Pelaksanaan kegiatan di lapangan berjalan lancar dan seluruh pihak kooperatif dalam memberikan data administratif.\n2. Berdasarkan hasil verifikasi silang data, teridentifikasi beberapa ketidaksesuaian teknis minor antara realisasi lapangan dengan dokumen perencanaan.\n3. Diperlukan tindakan perbaikan administratif segera oleh pihak penanggung jawab kegiatan guna menjaga kepatuhan regulasi penatausahaan hutan lestari.`,
        simulated: true,
        fallback: true
      };
    } else {
      return {
        text: `Berdasarkan kesimpulan pemeriksaan sebagaimana tersebut di atas, disrankan untuk segera mengambil langkah-langkah hal-hal sebagai berikut:\n1. Menginstruksikan kepada pimpinan perusahaan/objek kegiatan untuk segera melengkapi kekurangan data dukung administratif dalam jangka waktu maksimal 14 hari kerja.\n2. Mengintensifkan pembinaan teknis secara langsung kepada operator lapangan mengenai tata cara pengisian sistem pelaporan terbaru.\n3. Mengusulkan kepada Kepala Balai untuk melakukan monitoring evaluasi berkala secara online guna mengawal pemenuhan kepatuhan ini.`,
        simulated: true,
        fallback: true
      };
    }
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("GEMINI_API_KEY is not defined. Using high-quality simulated fallback.");
    return res.json(getFallback());
  }

  // Model hierarchy to try on failure/overload (Only use supported non-deprecated models)
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting generate-ai with model: ${modelName}`);
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let prompt = "";
      if (type === "kesimpulan") {
        prompt = `Sebagai asisten AI ahli Kementerian Kehutanan Republik Indonesia, buatkan KESIMPULAN yang padat, formal, profesional, dan realistis berdasarkan hasil pembahasan perjalanan dinas kehutanan berikut.\n\nHasil Pembahasan:\n${pembahasan}\n\nBagian KESIMPULAN ini WAJIB dibuka dengan kalimat pembuka persis seperti berikut:\n"Berdasarkan hasil pemeriksaan administrasi dan pemeriksan lapangan sebagaimana tersebut di atas, dapat disimpulkan hal-hal sebagai berikut:"\n\nSetelah kalimat pembuka tersebut, berikan penjelasan dan uraian poin-poin kesimpulan berdasarkan hal-hal yang diuraikan dalam data umum maupun temuan penting dalam bentuk poin-poin bernomor (1., 2., 3...) yang terstruktur, rapi, dan siap dimasukkan ke laporan resmi (tanpa kata pembuka/penutup/pemberitahuan tambahan di luar format tersebut).`;
      } else {
        prompt = `Sebagai asisten AI ahli Kementerian Kehutanan Republik Indonesia, buatkan REKOMENDASI/SARAN TINDAK LANJUT yang taktis, operasional, solutif, dan sesuai peraturan kehutanan berdasarkan hasil pembahasan dan kesimpulan perjalanan dinas kehutanan berikut.\n\nHasil Pembahasan:\n${pembahasan}\n\nKesimpulan:\n${kesimpulan || ""}\n\nBagian SARAN TINDAK LANJUT ini WAJIB dibuka dengan kalimat pembuka persis seperti berikut:\n"Berdasarkan kesimpulan pemeriksaan sebagaimana tersebut di atas, disrankan untuk segera mengambil langkah-langkah hal-hal sebagai berikut:"\n\nSetelah kalimat pembuka tersebut, berikan penjelasan dan uraian langkah taktis dan strategis yang diperlukan untuk menindaklanjuti temuan penting ketidaksesuaian sesuai dengan peraturan perundang-undangan yang berlaku dalam bentuk poin-poin bernomor (1., 2., 3...) yang terstruktur, rapi, dan siap dimasukkan ke laporan resmi (tanpa kata pembuka/penutup/pemberitahuan tambahan di luar format tersebut).`;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      const resultText = response.text || "";
      if (resultText) {
        console.log(`[AI] Successfully generated content using model: ${modelName}`);
        return res.json({ text: resultText, simulated: false });
      }
    } catch (err: any) {
      console.warn(`[AI] Model ${modelName} failed or overloaded:`, err.message || err);
      lastError = err;
    }
  }

  console.warn("[AI] All Gemini API models failed or experienced high demand. Falling back to high-quality simulated content gracefully.");
  return res.json(getFallback());
});

app.post("/api/generate-telaahan", async (req, res) => {
  const {
    nomor_surat_tugas,
    tanggal_surat_tugas,
    tempat_kegiatan,
    tanggal_mulai,
    tanggal_selesai,
    sasaran_kegiatan,
    maksud_tujuan,
    hasil_poin_penting,
    kesimpulan,
    saran,
    pelaku_usaha_nama
  } = req.body;

  const getFallback = () => {
    const fallbackTitle = `PENINGKATAN PENGAWASAN DAN TINDAK LANJUT TEMUAN LAPORAN PERJALANAN DINAS DI ${tempat_kegiatan ? tempat_kegiatan.toUpperCase() : "WILAYAH KERJA"}`;
    const fallbackPersoalan = `Berdasarkan hasil temuan pada perjalanan dinas berdasarkan Surat Tugas No. ${nomor_surat_tugas || "[Nomor ST]"} tanggal ${tanggal_surat_tugas || "[Tanggal ST]"}, ditemukan adanya persoalan krusial berupa:\n\n1. Ketidaksesuaian administratif dan tata kelola teknis operasional lapangan di ${tempat_kegiatan || "lokasi kegiatan"}.\n2. Kurangnya pemenuhan standar penatausahaan hasil hutan yang berpotensi melanggar ketentuan perundang-undangan kehutanan yang berlaku.\n3. Hambatan koordinasi yang menyebabkan rekomendasi pengawasan sebelumnya belum sepenuhnya ditindaklanjuti secara optimal.`;
    const fallbackPraanggapan = `1. Apabila ketidaksesuaian teknis dan administratif yang teridentifikasi di ${tempat_kegiatan || "lapangan"} dibiarkan tanpa tindakan pembinaan formal, maka berisiko menimbulkan sanksi administratif berat dari Direktorat Jenderal PHL.\n2. Dengan diterbitkannya instruksi resmi dari Kepala Balai BPHL Wilayah XI, pihak pelaku usaha/penanggung jawab kegiatan akan segera melakukan langkah-langkah perbaikan secara patuh dan tertib.`;
    const fallbackFakta = `1. Pelaksanaan kegiatan lapangan telah diselesaikan sesuai Surat Tugas No. ${nomor_surat_tugas || "[Nomor Surat Tugas]"}.\n2. Diperoleh data lapangan yang menunjukkan bahwa:\n   - ${hasil_poin_penting || "Terdapat beberapa temuan administrasi dan teknis kehutanan yang membutuhkan verifikasi dokumen lebih lanjut."}\n3. Belum adanya mekanisme pelaporan evaluasi mandiri (self-assessment) secara berkala dari objek kegiatan di ${tempat_kegiatan || "wilayah tersebut"} kepada BPHL Wilayah XI Banjarbaru.`;
    const fallbackAnalisis = `1. Analisis terhadap tingkat kepatuhan menunjukkan bahwa kendala utama disebabkan oleh keterbatasan pemahaman SDM lapangan terhadap peraturan menteri terbaru.\n2. Diperlukan intervensi berupa pembinaan teknis terstruktur (coaching clinic) dan penerbitan Surat Peringatan/Teguran Administratif Pembinaan guna menegakkan tertib regulasi.\n3. Langkah ini dinilai efektif untuk meminimalisir risiko penyimpangan berkelanjutan dan meningkatkan kredibilitas pengawasan BPHL Wilayah XI Banjarbaru.`;
    const fallbackKesimpulan = `Berdasarkan hasil pemeriksaan administrasi dan pemeriksan lapangan sebagaimana tersebut di atas, dapat disimpulkan hal-hal sebagai berikut:\n1. Persoalan administratif dan teknis di ${tempat_kegiatan || "lapangan"} harus segera ditangani secara formal untuk menghindari implikasi hukum dan operasional yang merugikan.\n2. Penerbitan Surat Rekomendasi Tindak Lanjut oleh Kepala Balai BPHL Wilayah XI Banjarbaru merupakan solusi administratif yang paling tepat dan berwibawa.`;
    const fallbackSaran = `Berdasarkan kesimpulan pemeriksaan sebagaimana tersebut di atas, disrankan untuk segera mengambil langkah-langkah hal-hal sebagai berikut:\n1. Menyetujui draf Surat Pembinaan Teknis dan Rekomendasi Perbaikan Dokumen yang ditujukan kepada pimpinan objek kegiatan/perusahaan dengan jangka waktu penyelesaian 14 (empat belas) hari kerja.\n2. Menugaskan tim fungsional terkait untuk melakukan monitoring berkala via sistem online guna memastikan seluruh poin rekomendasi telah dipenuhi dengan benar.`;

    return {
      judul: fallbackTitle,
      persoalan: fallbackPersoalan,
      praanggapan: fallbackPraanggapan,
      fakta: fallbackFakta,
      analisis: fallbackAnalisis,
      kesimpulan: fallbackKesimpulan,
      saran: fallbackSaran,
      simulated: true,
      fallback: true
    };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("GEMINI_API_KEY is not defined. Using high-quality simulated fallback for Telaahan Staf.");
    return res.json(getFallback());
  }

  // Model hierarchy to try on failure/overload (Only use supported non-deprecated models)
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting generate-telaahan with model: ${modelName}`);
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Sebagai asisten AI ahli Kementerian Kehutanan Republik Indonesia, buatkan TELAAHAN STAF (Staff Study) yang sangat formal, taktis, rinci, dan realistis untuk Kepala Balai Pengelolaan Hutan Lestari Wilayah XI Banjarbaru.
Gunakan data Laporan Perjalanan Dinas (LPD) berikut sebagai konteks:
- Surat Tugas: ${nomor_surat_tugas || "[Nomor Surat Tugas]"}
- Tanggal Surat Tugas: ${tanggal_surat_tugas || "[Tanggal]"}
- Tempat Kegiatan: ${tempat_kegiatan || "[Lokasi]"}
- Tanggal Perjalanan: ${tanggal_mulai || "[Mulai]"} s.d ${tanggal_selesai || "[Selesai]"}
- Sasaran Kegiatan: ${sasaran_kegiatan || "[Sasaran]"}
- Maksud dan Tujuan: ${maksud_tujuan || "[Maksud]"}
- Temuan Penting Lapangan: ${hasil_poin_penting || "Tidak disebutkan"}
- Kesimpulan LPD: ${kesimpulan || "Tidak disebutkan"}
- Saran/Rekomendasi LPD: ${saran || "Tidak disebutkan"}
${pelaku_usaha_nama ? `- Nama Pelaku Usaha Terkait: ${pelaku_usaha_nama}` : ""}

Isi dokumen Telaahan Staf harus memiliki struktur formal dan profesional sesuai kaidah tata naskah dinas Kementerian Kehutanan RI:
1. JUDUL (TENTANG): Judul singkat yang merepresentasikan pemecahan masalah/persoalan temuan lapangan. JANGAN menuliskan kata "Telaahan Staf Tentang" atau "TELAAHAN STAF TENTANG" di awal judul, tuliskan langsung isi/topik permasalahannya saja (contoh langsung: "OPTIMALISASI KEPATUHAN...").
2. PERSOALAN: Rumusan persoalan pokok berdasarkan temuan lapangan atau ketidaksesuaian yang ditemukan di ${tempat_kegiatan || "tempat kegiatan"}. Sebutkan surat tugas secara eksplisit.
3. PRAANGGAPAN: Dugaan logis atau prakiraan masa depan apabila persoalan tidak diatasi, serta kemungkinan keberhasilan perbaikan.
4. FAKTA YANG MEMPENGARUHI: Sebutkan fakta objektif yang melatarbelakangi persoalan, data teknis lapangan, regulasi terkait (seperti SLK, PBPH), dan surat tugas.
5. ANALISIS: Pembahasan mendalam yang mengupas sebab-akibat, membandingkan fakta lapangan dengan regulasi, dan memaparkan langkah-langkah penyelesaian teknis.
6. KESIMPULAN: Intisari analisis, merumuskan perlunya keputusan strategis dari Kepala Balai. Bagian ini WAJIB dibuka dengan kalimat pembuka persis: "Berdasarkan hasil pemeriksaan administrasi dan pemeriksan lapangan sebagaimana tersebut di atas, dapat disimpulkan hal-hal sebagai berikut:" dan dilanjutkan dengan poin-poin penjelasan/uraian dalam bentuk penomoran urut (1., 2., 3., dst.) dipisahkan baris baru.
7. SARAN/REKOMENDASI: Langkah konkret yang disarankan kepada Kepala Balai untuk diputuskan. Bagian ini WAJIB dibuka dengan kalimat pembuka persis: "Berdasarkan kesimpulan pemeriksaan sebagaimana tersebut di atas, disrankan untuk segera mengambil langkah-langkah hal-hal sebagai berikut:" dan dilanjutkan dengan penjelasan/uraian langkah taktis dan strategis yang diperlukan dalam bentuk penomoran urut (1., 2., 3., dst.) dipisahkan baris baru.

Anda HARUS mengembalikan respons dalam format JSON dengan kunci berikut:
- judul (string)
- persoalan (string, gunakan bullet point/poin bernomor di baris baru)
- praanggapan (string, gunakan bullet point/poin bernomor di baris baru)
- fakta (string, gunakan bullet point/poin bernomor di baris baru)
- analisis (string, gunakan bullet point/poin bernomor di baris baru)
- kesimpulan (string, dibuka dengan kalimat pembuka wajib di atas, lalu poin bernomor 1., 2., 3., dst. dipisahkan baris baru)
- saran (string, dibuka dengan kalimat pembuka wajib di atas, lalu poin bernomor 1., 2., 3., dst. dipisahkan baris baru)

Tulis isi teks langsung dalam bahasa Indonesia yang sangat resmi, kaku, berwibawa, dan lengkap, tanpa kata pengantar atau penutup lain di luar objek JSON.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              judul: { type: Type.STRING },
              persoalan: { type: Type.STRING },
              praanggapan: { type: Type.STRING },
              fakta: { type: Type.STRING },
              analisis: { type: Type.STRING },
              kesimpulan: { type: Type.STRING },
              saran: { type: Type.STRING },
            },
            required: ["judul", "persoalan", "praanggapan", "fakta", "analisis", "kesimpulan", "saran"],
          },
        },
      });

      const resultText = response.text || "{}";
      const resultJson = parseCleanJson(resultText);
      console.log(`[AI] Successfully generated Telaahan Staf using model: ${modelName}`);
      return res.json({ ...resultJson, simulated: false });
    } catch (err: any) {
      console.warn(`[AI] Model ${modelName} failed or overloaded to generate Telaahan Staf:`, err.message || err);
      lastError = err;
    }
  }

  console.warn("[AI] All Gemini API models failed or experienced high demand for Telaahan Staf. Falling back to high-quality simulated content gracefully.");
  return res.json(getFallback());
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
