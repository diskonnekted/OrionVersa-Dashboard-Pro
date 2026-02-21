"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Search, Eye, X, Camera, Database,
  Loader2, ShieldAlert, BarChart3,
  Download, MapPin, FileText, Calendar,
  HardHat, AlertCircle, Info, Activity
} from "lucide-react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const DISASTER_TYPES_CONFIG = [
  { id: "Longsor", color: "#8b5cf6" },
  { id: "Banjir", color: "#3b82f6" },
  { id: "Kebakaran", color: "#ef4444" },
  { id: "Angin Kencang", color: "#06b6d4" }
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const AVAILABLE_YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];

function normalizeHazardType(raw: string | undefined): string {
  if (!raw) return "Lainnya";
  const t = raw.toLowerCase();
  if (t.includes("longsor")) return "Longsor";
  if (t.includes("kebakar")) return "Kebakaran";
  if (t.includes("banjir")) return "Banjir";
  if (t.includes("angin") && (t.includes("kencang") || t.includes("puting"))) return "Angin Kencang";
  return raw;
}

function inferHazardFromText(p: any): string | undefined {
  const text = [
    p.Name,
    p.name,
    p.description,
    p["KONDISI UMUM"],
    p.KRONOLOGI_KONDISI_UMUM,
    p["KRONOLOGI/ KONDISI UMUM"]
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!text) return undefined;
  if (text.includes("longsor")) return "Longsor";
  if (text.includes("kebakar")) return "Kebakaran";
  if (text.includes("banjir")) return "Banjir";
  if (text.includes("angin kencang") || text.includes("puting beliung")) return "Angin Kencang";
  return undefined;
}

function extractLegacyRecord(p: any, y: string, idx: number) {
  const rawType =
    p.JENIS_KEJADIAN ||
    p["JENIS KEJADIAN"] ||
    p.JenisKejadian ||
    p.KEJADIAN ||
    p.Kejadian ||
    inferHazardFromText(p);

  const type = normalizeHazardType(rawType);

  const dateText =
    p.WAKTU_KEJADIAN ||
    p["WAKTU KEJADIAN"] ||
    p.TANGGAL ||
    p.Tgl ||
    p.Tanggal ||
    `${y}-01-01`;

  const location =
    p["LOKASI KEJADIAN (Desa, Kecamatan)"] ||
    p.LOKASI ||
    p.Lokasi ||
    p.LOKASI_KEJADIAN_Desa__Kecamatan ||
    p["Lokasi"] ||
    p["Lokasi 2"] ||
    p.Nama ||
    p.Name ||
    "Banjarnegara";

  const dusun =
    p["LOKASI KEJADIAN (Dusun, RT/RW)"] ||
    p.LOKASI_KEJADIAN_Dusun__RTRW ||
    p["Lokasi 3"] ||
    "-";

  const description =
    p["KRONOLOGI/ KONDISI UMUM"] ||
    p.KRONOLOGI_KONDISI_UMUM ||
    p.KRONOLOGI ||
    p["Kronologi Kejadian"] ||
    p.description ||
    p["KONDISI UMUM"] ||
    "-";

  const impact =
    p["DAMPAK Bangunan/ Fisik"] ||
    p.DAMPAK_Bangunan_Fisik ||
    p.DAMPAK_Bangunan ||
    p.Dampak ||
    "N/A";

  const handling = p.PENANGANAN || "Telah Diarsip";

  return {
    id: `legacy-${y}-${idx}`,
    date: dateText,
    year: y,
    type,
    location,
    dusun,
    source: `Arsip ${y}`,
    status: "Arsip",
    reportKind: "Laporan yang dibuat sendiri",
    description,
    impact,
    handling,
    raw: p
  };
}

export default function DisasterManagement() {
  const [reports, setReports] = useState<any[]>([]);
  const [legacyData, setLegacyData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("Semua");
  const [filterYear, setFilterYear] = useState("Semua"); 
  const [filterReportKind, setFilterReportKind] = useState("Semua");
  const [searchTerm, setSearchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [chartHazard, setChartHazard] = useState("Longsor");

  const [draftYear, setDraftYear] = useState("Semua");
  const [draftReportKind, setDraftReportKind] = useState("Semua");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const reportsData = await res.json();
      const formattedReports = reportsData.map((r: any) => ({
        id: r.id, date: r.timestamp, year: new Date(r.timestamp).getFullYear().toString(),
        type: r.type, location: `${r.village}, ${r.district}`, source: "Laporan Live",
        reportKind: "Laporan dari warga",
        status: r.status, description: r.desc, impact: "Sedang Diverifikasi", handling: "Proses Koordinasi", raw: r
      }));

      const years = ["2024", "2023", "2022", "2021"];
      const legacyPromises = years.map(async (y) => {
        try {
          const res = await fetch(`/data/bencana-banjarnegara-${y}.geojson`);
          const json = await res.json();
          return json.features.map((f: any, idx: number) => {
            const p = f.properties;
            return extractLegacyRecord(p, y, idx);
          });
        } catch (e) { return []; }
      });

      const legacyResults = await Promise.all(legacyPromises);
      const legacyFlat = legacyResults.flat();

      const legacy2025FromNews = [
        {
          id: "legacy-2025-situkung",
          date: "2025-11-16",
          year: "2025",
          type: "Longsor",
          location: "Dusun Situkung, Desa Pandanarum, Kec. Pandanarum",
          dusun: "Dusun Situkung",
          source: "Berita Longsor Situkung 2025",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Tanah longsor besar pada 16 November 2025 di Dusun Situkung setelah hujan deras berjam-jam. Lereng hutan pinus seluas sekitar 100×100 m runtuh, menyapu permukiman dan memaksa ratusan warga mengungsi.",
          impact:
            "Sedikitnya 2 orang meninggal, 27 orang dilaporkan hilang, sekitar 823 jiwa terdampak. Sekitar 35 rumah tertimbun longsor, 35 rumah lain terancam, dan hampir 200 rumah terdampak.",
          handling:
            "Operasi SAR gabungan Basarnas, BPBD, TNI, Polri, relawan dan masyarakat. Evakuasi pengungsi, pencarian korban berhari-hari, pembukaan akses jalan, dan penyiapan hunian sementara.",
          raw: {
            sumber: "Ringkasan berbagai berita 2025",
            urls: [
              "https://www.bbc.com/indonesia/articles/ckgk5dxldx5o",
              "https://pendidikan-sains.fmipa.unesa.ac.id/post/longsor-banjarnegara-16-november-2025-kronologi-penyebab-ilmiah-update-korban-dan-langkah-pemulihan",
              "https://dinkominfo.banjarnegarakab.go.id/banjarnegara-berduka-lagi-dua-warga-meninggal-dunia-27-dinyatakan-hilang-dalam-musibah-longsor-pandanarum/",
              "https://timesindonesia.co.id/peristiwa-daerah/562395/banjarnegara-tetapkan-status-siaga-darurat-bencana-selama-215-hari",
              "https://jdih.banjarnegarakab.go.id/inventarisasi-hukum/detail/KepBUp_300-2-255_th_2025"
            ]
          }
        },
        {
          id: "legacy-2025-20251021-lebakwangi-siwaru",
          date: "2025-10-21",
          year: "2025",
          type: "Longsor",
          location: "Dusun Siwaru, Desa Lebakwangi, Kec. Pagedongan",
          dusun: "Dusun Siwaru",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Longsor di Dusun Siwaru, Desa Lebakwangi, setelah hujan dua hari. Material longsor mengenai permukiman warga.",
          impact: "Dua rumah warga rusak akibat material longsor.",
          handling:
            "BPBD menutup area longsoran dengan terpal dan menyalurkan bantuan logistik darurat.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-lebakwangi-benda",
          date: "2025-10-21",
          year: "2025",
          type: "Longsor",
          location: "Dusun Benda, Desa Lebakwangi, Kec. Pagedongan",
          dusun: "Dusun Benda",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Longsor di Dusun Benda menutup akses jalan permukiman setelah hujan intensitas tinggi.",
          impact: "Material longsor berdampak pada empat rumah warga dan menutup akses jalan.",
          handling:
            "Warga dan perangkat desa melakukan kerja bakti dan membuat drainase sementara.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-pagedongan-tengah",
          date: "2025-10-21",
          year: "2025",
          type: "Longsor",
          location: "Dusun Pagedongan Tengah, Desa Pagedongan, Kec. Pagedongan",
          dusun: "Pagedongan Tengah",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Longsor di Dusun Pagedongan Tengah menyebabkan pergeseran tanah di sekitar permukiman.",
          impact: "Pondasi dapur dua rumah warga mengalami longsor.",
          handling:
            "BPBD dan pemerintah desa memberikan himbauan kewaspadaan dan bantuan terpal.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-karanganyar-pegaden-banjir",
          date: "2025-10-21",
          year: "2025",
          type: "Banjir",
          location: "Dusun Pegaden, Desa Karanganyar, Kec. Purwanegara",
          dusun: "Dusun Pegaden",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Banjir di Dusun Pegaden akibat hujan deras, air meluap ke permukiman warga.",
          impact:
            "Genangan air hingga sekitar satu meter, masuk ke lima rumah dan berdampak pada 21 jiwa.",
          handling:
            "Petugas melakukan asesmen, pembersihan saluran air, dan koordinasi antisipasi banjir susulan.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-bawang-wanadri-puskesmas",
          date: "2025-10-21",
          year: "2025",
          type: "Lainnya",
          location: "Desa Wanadri, Kec. Bawang",
          dusun: "-",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Atap UPTD Puskesmas Bawang 2 ambruk akibat hujan deras dan struktur yang melemah.",
          impact:
            "Layanan persalinan dan layanan kesehatan tertentu di Puskesmas Bawang 2 terganggu dan harus dialihkan sementara.",
          handling:
            "BPBD dan pengelola puskesmas melakukan asesmen kerusakan dan pengalihan layanan.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-bawang-serang-rumah-ambruk",
          date: "2025-10-21",
          year: "2025",
          type: "Lainnya",
          location: "Desa Serang, Kec. Bawang",
          dusun: "-",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Satu rumah di Desa Serang ambruk karena struktur pondasi yang melemah setelah hujan deras.",
          impact: "Satu rumah warga ambruk dan tidak bisa ditempati.",
          handling:
            "Petugas melakukan asesmen kerusakan dan memberikan himbauan kewaspadaan kepada warga sekitar.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-gumelem-kulon-klesem",
          date: "2025-10-21",
          year: "2025",
          type: "Longsor",
          location: "Dusun Klesem, Desa Gumelem Kulon, Kec. Susukan",
          dusun: "Dusun Klesem",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Tebing di samping rumah warga di Dusun Klesem longsor setelah hujan intensitas tinggi.",
          impact: "Longsoran mengancam bangunan rumah warga di bawah tebing.",
          handling:
            "BPBD menyalurkan kebutuhan darurat seperti terpal dan sembako serta melaporkan ke aparat kecamatan.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-argasoka-talud",
          date: "2025-10-21",
          year: "2025",
          type: "Longsor",
          location: "Kelurahan Argasoka, Kec. Banjarnegara",
          dusun: "-",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Talud belakang rumah warga di Kelurahan Argasoka longsor dan mengancam bangunan utama.",
          impact: "Longsoran talud mengancam struktur rumah warga di atasnya.",
          handling:
            "Penanganan awal oleh BPBD dan pemerintah setempat, himbauan kewaspadaan kepada warga.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        },
        {
          id: "legacy-2025-20251021-adipasir-jalan-longsor",
          date: "2025-10-21",
          year: "2025",
          type: "Longsor",
          location: "Desa Adipasir, Kec. Rakit",
          dusun: "-",
          source: "Hujan Deras Dua Hari, 9 Titik Bencana",
          status: "Arsip",
          reportKind: "Laporan yang dibuat sendiri",
          description:
            "Sebagian badan jalan kabupaten di Desa Adipasir longsor setelah hujan lebat.",
          impact:
            "Sebagian badan jalan turun/longsor sehingga arus lalu lintas diberlakukan sistem buka-tutup.",
          handling:
            "BPBD dan pemerintah setempat melakukan pengaturan lalu lintas dan asesmen kerusakan jalan.",
          raw: {
            sumber: "Berita 21 Oktober 2025",
            url: "https://suaraindonesia.co.id/news/news/68f796193b980/hujan-deras-selama-dua-hari-sembilan-titik-di-banjarnegara-dilanda-bencana"
          }
        }
      ];

      setReports(formattedReports);
      setLegacyData([...legacyFlat, ...legacy2025FromNews]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTableData = useMemo(() => {
    let all = [...reports, ...legacyData];
    if (filterType !== "Semua") all = all.filter(d => d.type.toLowerCase().includes(filterType.toLowerCase()));
    if (filterYear !== "Semua") all = all.filter(d => d.year === filterYear);
    if (filterReportKind !== "Semua") all = all.filter(d => d.reportKind === filterReportKind);
    if (searchTerm) all = all.filter(d => d.location.toLowerCase().includes(searchTerm.toLowerCase()) || d.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, legacyData, filterType, filterYear, filterReportKind, searchTerm]);

  const hazardMonthlySeries = useMemo(() => {
    const base: Record<string, { year: string; data: number[] }> = {};
    AVAILABLE_YEARS.forEach(y => {
      base[y] = { year: y, data: new Array(12).fill(0) };
    });

    const all = [...reports, ...legacyData];
    all.forEach(r => {
      if (!r.type) return;
      if (!r.type.toLowerCase().includes(chartHazard.toLowerCase())) return;
      const rawYear = r.year ? String(r.year) : undefined;
      const d = new Date(r.date);
      const parsedValid = !Number.isNaN(d.getTime());
      const yearStr = rawYear || (parsedValid ? `${d.getFullYear()}` : undefined);
      if (!base[yearStr]) return;
      let monthIndex = 0;
      if (parsedValid) {
        const m = d.getMonth();
        if (m >= 0 && m <= 11) monthIndex = m;
      }
      base[yearStr].data[monthIndex] += 1;
    });

    return AVAILABLE_YEARS.map(y => base[y]);
  }, [reports, legacyData, chartHazard]);

  const hazardYearlyCounts = useMemo(() => {
    return AVAILABLE_YEARS.map(y => {
      const entry = hazardMonthlySeries.find(s => s.year === y);
      if (!entry) return 0;
      return entry.data.reduce((acc, v) => acc + v, 0);
    });
  }, [hazardMonthlySeries]);

  const trendChartData = useMemo(() => {
    return {
      labels: AVAILABLE_YEARS,
      datasets: [
        {
          label: "Jumlah Kejadian per Tahun",
          data: hazardYearlyCounts,
          borderColor: "#f97316",
          backgroundColor: "#f97316",
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    };
  }, [hazardYearlyCounts]);

  const trendChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right" as const,
          labels: {
            color: "#e5e7eb",
            font: { size: 10, weight: "bold" }
          }
        },
        tooltip: {
          backgroundColor: "#020617",
          borderColor: "#4f46e5",
          borderWidth: 1,
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          padding: 8
        }
      },
      layout: {
        padding: { top: 4, right: 8, bottom: 4, left: 8 }
      },
      scales: {
        x: {
          grid: {
            color: "#111827"
          },
          ticks: {
            color: "#9ca3af",
            font: { size: 9 }
          }
        },
        y: {
          grid: {
            color: "#1f2937"
          },
          ticks: {
            color: "#e5e7eb",
            font: { size: 9 },
            precision: 0
          }
        }
      }
    };
  }, []);

  const applyTableFilters = () => {
    setFilterYear(draftYear);
    setFilterReportKind(draftReportKind);
  };

  const cleanHTML = (str: string) => {
    if (!str) return "-";
    let html = str.replace(/`/g, "");
    html = html.replace(/<br\s*\/?>/gi, "<br/>");
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/on\w+="[^"]*"/gi, "");
    html = html.replace(/on\w+='[^']*'/gi, "");
    return html;
  };

  if (loading) return <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /><p className="mt-4 font-black text-xs text-slate-400 uppercase">Sinkronisasi Data...</p></div>;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 font-sans overflow-hidden">
      
      {/* 1. TOP SECTION: CHART ONLY */}
      <div className="grid grid-cols-12 gap-6 p-6 pb-4 shrink-0 bg-white border-b-0 relative z-0">
        <div className="col-span-12 bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h3 className="font-black uppercase text-xs text-slate-800 tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Log Bencana: Tren Tahunan
              </h3>
              <p className="text-[9px] text-slate-500 font-bold mt-1">
                Pola kejadian per tahun berdasarkan arsip dan laporan live.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400">Jenis</span>
                <select
                  value={chartHazard}
                  onChange={e => setChartHazard(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer"
                >
                  {DISASTER_TYPES_CONFIG.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3 h-3 text-indigo-400" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Log Bencana • {chartHazard}
                </p>
                <p className="text-[10px] font-black text-slate-100 leading-tight">
                  Tren Kejadian Per Tahun ({AVAILABLE_YEARS[0]}–{AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]})
                </p>
              </div>
            </div>
            <div className="h-40">
              <Line data={trendChartData} options={trendChartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABLE TOOLBAR */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 shrink-0 bg-slate-50 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchTerm} onChange={e=>setSearchName(e.target.value)} placeholder="Cari wilayah..." className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl text-xs font-bold text-slate-900 shadow-sm focus:ring-2 ring-indigo-500/20" />
          </div>
          <select
            value={filterType}
            onChange={e=>setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase text-slate-600 border-none shadow-sm outline-none"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Longsor">Longsor</option>
            <option value="Banjir">Banjir</option>
            <option value="Kebakaran">Kebakaran</option>
            <option value="Angin Kencang">Angin Kencang</option>
          </select>
          <select
            value={draftYear}
            onChange={e => setDraftYear(e.target.value)}
            className="px-4 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase text-slate-600 border-none shadow-sm outline-none"
          >
            <option value="Semua">Semua Tahun</option>
            {AVAILABLE_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={draftReportKind}
            onChange={e => setDraftReportKind(e.target.value)}
            className="px-4 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase text-slate-600 border-none shadow-sm outline-none"
          >
            <option value="Semua">Semua Jenis Laporan</option>
            <option value="Laporan dari warga">Laporan dari warga</option>
            <option value="Laporan yang dibuat sendiri">Laporan yang dibuat sendiri</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={applyTableFilters}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-500"
          >
            Terapkan
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-800"
          >
            <Download className="w-3 h-3" /> Cetak
          </button>
        </div>
      </div>

      {/* 3. TABLE SECTION */}
      <div className="flex-1 overflow-auto p-6 pt-0 min-h-0">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Daftar Peristiwa
            </p>
            <p className="text-[10px] font-black text-slate-500">
              {filteredTableData.length} peristiwa
            </p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 sticky top-0 z-10 border-b">
              <tr>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest">Waktu</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest">Kategori</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest">Lokasi</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4"><p className="text-xs font-black text-slate-800 leading-none">{row.date.split(',')[1] || row.date}</p><span className="text-[8px] font-bold text-indigo-500 uppercase mt-1">{row.source}</span></td>
                  <td className="p-4"><span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-2.5 py-1 rounded-lg">{row.type}</span></td>
                  <td className="p-4 text-xs font-bold text-slate-600 uppercase">{row.location}</td>
                  <td className="p-4 text-center"><button onClick={() => setSelectedItem(row)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><Eye className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (RE-STRUCTURED) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">Dokumen Laporan Bencana</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">{selectedItem.source} • ID: {selectedItem.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
              <div className="grid grid-cols-12 gap-8">
                {/* Left: Content */}
                <div className="col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Kronologi Kejadian</h4>
                    <div
                      className="text-sm text-slate-700 leading-relaxed font-medium italic"
                      dangerouslySetInnerHTML={{ __html: cleanHTML(selectedItem.description) }}
                    />
                  </div>
                  {selectedItem.impact !== "N/A" && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <h4 className="text-[10px] font-black text-red-600 uppercase mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Dampak Bangunan & Fisik</h4>
                      <div
                        className="text-sm font-bold text-red-900 bg-red-50 p-4 rounded-2xl border border-red-100 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cleanHTML(selectedItem.impact) }}
                      />
                    </div>
                  )}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-green-600 uppercase mb-4 flex items-center gap-2"><HardHat className="w-4 h-4" /> Upaya Penanganan</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedItem.handling}</p>
                  </div>
                </div>

                {/* Right: Media & Location */}
                <div className="col-span-5 space-y-6">
                  {selectedItem.raw.photo ? (
                    <img src={selectedItem.raw.photo} className="w-full h-72 object-cover rounded-[32px] shadow-lg border-4 border-white" alt="Foto" />
                  ) : (
                    <div className="h-48 w-full bg-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-300">
                      <Camera className="w-10 h-10 opacity-20" />
                      <p className="text-[10px] font-black uppercase opacity-40">Dokumentasi Foto Kosong</p>
                    </div>
                  )}
                  <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl space-y-6">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Wilayah Lokasi</p>
                      <div className="flex items-center gap-2 text-indigo-400"><MapPin className="w-4 h-4 text-red-500" /><p className="text-sm font-black uppercase leading-tight">{selectedItem.location}</p></div>
                      {selectedItem.dusun && <p className="text-[10px] ml-6 text-slate-400 italic">{selectedItem.dusun}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase">Jenis</p>
                        <p className="text-xs font-black uppercase text-amber-400">{selectedItem.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase">Waktu</p>
                        <p className="text-[10px] font-black text-green-400">{selectedItem.date.split(',')[1] || selectedItem.date}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set("incidentId", String(selectedItem.id));
                      params.set("type", String(selectedItem.type || ""));
                      params.set("location", String(selectedItem.location || ""));
                      if (selectedItem.dusun) params.set("dusun", String(selectedItem.dusun));
                      params.set("source", String(selectedItem.source || ""));
                      params.set("dateText", String(selectedItem.date || ""));
                      window.open(`/response?${params.toString()}`, "_blank");
                    }}
                    className="w-full mt-3 py-3 rounded-2xl border border-amber-400 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-[0.22em] shadow-sm hover:bg-amber-100 transition-all"
                  >
                    Buat Respon Publik
                  </button>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-100 border-t flex justify-center">
              <button onClick={() => setSelectedItem(null)} className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition-all">Tutup Dokumen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
