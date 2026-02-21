"use client";
import { useEffect, useState, useMemo } from "react";
import { 
  Search, Eye, X, Camera, Database,
  Loader2, ShieldAlert, BarChart3,
  Download, MapPin, FileText, Calendar,
  HardHat, AlertCircle, Info, Activity
} from "lucide-react";

const DISASTER_TYPES_CONFIG = [
  { id: "Longsor", color: "#8b5cf6" },
  { id: "Banjir", color: "#3b82f6" },
  { id: "Kebakaran", color: "#ef4444" },
  { id: "Angin Kencang", color: "#06b6d4" }
];

export default function DisasterManagement() {
  const [reports, setReports] = useState<any[]>([]);
  const [legacyData, setLegacyData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("Semua");
  const [filterYear, setFilterYear] = useState("2026"); 
  const [searchTerm, setSearchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/sungai/api/reports");
      const reportsData = await res.json();
      const formattedReports = reportsData.map((r: any) => ({
        id: r.id, date: r.timestamp, year: new Date(r.timestamp).getFullYear().toString(),
        type: r.type, location: `${r.village}, ${r.district}`, source: "Laporan Live",
        status: r.status, description: r.desc, impact: "Sedang Diverifikasi", handling: "Proses Koordinasi", raw: r
      }));

      const years = ["2024", "2023", "2022", "2021"];
      const legacyPromises = years.map(async (y) => {
        try {
          const res = await fetch(`/sungai/data/bencana-banjarnegara-${y}.geojson`);
          const json = await res.json();
          return json.features.map((f: any, idx: number) => {
            const p = f.properties;
            return {
              id: `legacy-${y}-${idx}`, date: p.WAKTU_KEJADIAN || p.TANGGAL || `${y}-01-01`,
              year: y, type: p.JENIS_KEJADIAN || p.KEJADIAN || "Lainnya",
              location: p["LOKASI KEJADIAN (Desa, Kecamatan)"] || p.LOKASI || p.Nama || "Banjarnegara",
              dusun: p["LOKASI KEJADIAN (Dusun, RT/RW)"] || "-",
              source: `Arsip ${y}`, status: "Arsip", 
              description: p["KRONOLOGI/ KONDISI UMUM"] || p.description || p.KETERANGAN || "-",
              impact: p["DAMPAK Bangunan/ Fisik"] || "N/A",
              handling: p.PENANGANAN || "Telah Diarsip",
              raw: p
            };
          });
        } catch (e) { return []; }
      });

      const legacyResults = await Promise.all(legacyPromises);
      setReports(formattedReports);
      setLegacyData(legacyResults.flat());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTableData = useMemo(() => {
    let all = [...reports, ...legacyData];
    if (filterType !== "Semua") all = all.filter(d => d.type.toLowerCase().includes(filterType.toLowerCase()));
    if (filterYear !== "Semua") all = all.filter(d => d.year === filterYear);
    if (searchTerm) all = all.filter(d => d.location.toLowerCase().includes(searchTerm.toLowerCase()) || d.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, legacyData, filterType, filterYear, searchTerm]);

  const chartStats = useMemo(() => {
    const dataContext = filterYear === "Semua" 
      ? [...reports, ...legacyData] 
      : [...reports, ...legacyData].filter(d => d.year === filterYear);

    return DISASTER_TYPES_CONFIG.map(t => ({
      label: t.id,
      count: dataContext.filter(d => d.type.toLowerCase().includes(t.id.toLowerCase())).length,
      color: t.color
    }));
  }, [reports, legacyData, filterYear]);

  const maxVal = useMemo(() => Math.max(...chartStats.map(s => s.count), 1), [chartStats]);

  const cleanHTML = (str: string) => {
    if (!str) return "-";
    return str.replace(/<br\s*\/?>/gi, '\n');
  };

  if (loading) return <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /><p className="mt-4 font-black text-xs text-slate-400 uppercase">Sinkronisasi Data...</p></div>;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 font-sans overflow-hidden">
      
      {/* 1. TOP SECTION: TOTAL & CHART */}
      <div className="grid grid-cols-12 gap-6 p-6 shrink-0 bg-white border-b">
        <div className="col-span-3 bg-slate-900 p-6 rounded-[32px] text-white flex flex-col justify-center relative overflow-hidden shadow-xl">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Kejadian</p>
          <p className="text-5xl font-black mt-2 text-indigo-400">{filteredTableData.length}</p>
          <p className="text-[9px] mt-4 font-bold opacity-50 uppercase">Filter: {filterYear === "Semua" ? "Seluruh Tahun" : `Tahun ${filterYear}`}</p>
          <Database className="absolute -bottom-2 -right-2 w-20 h-20 opacity-10 rotate-12" />
        </div>

        <div className="col-span-9 bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black uppercase text-xs text-slate-800 tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Rincian Bencana: {filterYear === "Semua" ? "Akumulasi" : `Tahun ${filterYear}`}
            </h3>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
              <Calendar className="w-3 h-3 text-slate-400" />
              <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer">
                <option value="Semua">Semua Tahun</option>
                {["2026", "2025", "2024", "2023", "2022", "2021"].map(y => <option key={y} value={y}>Tahun {y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 h-24">
            {chartStats.map((s) => (
              <div key={s.label} className="flex flex-col justify-end gap-2 group">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">{s.label}</span>
                  <span className="text-lg font-black text-slate-800">{s.count}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${(s.count / maxVal) * 100}%`, backgroundColor: s.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TABLE TOOLBAR */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 shrink-0 bg-slate-50">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchTerm} onChange={e=>setSearchName(e.target.value)} placeholder="Cari wilayah..." className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl text-xs font-bold text-slate-900 shadow-sm focus:ring-2 ring-indigo-500/20" />
          </div>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="px-4 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase text-slate-600 border-none shadow-sm outline-none"><option>Semua Jenis</option><option>Longsor</option><option>Banjir</option><option>Kebakaran</option><option>Angin Kencang</option></select>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-800"><Download className="w-3 h-3" /> Cetak</button>
      </div>

      {/* 3. TABLE SECTION */}
      <div className="flex-1 overflow-auto p-6 pt-0 min-h-0">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium italic">
                      {cleanHTML(selectedItem.description)}
                    </p>
                  </div>
                  {selectedItem.impact !== "N/A" && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <h4 className="text-[10px] font-black text-red-600 uppercase mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Dampak Bangunan & Fisik</h4>
                      <div className="text-sm font-bold text-red-900 bg-red-50 p-4 rounded-2xl border border-red-100 whitespace-pre-line leading-relaxed">
                        {cleanHTML(selectedItem.impact)}
                      </div>
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
                      <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase">Jenis</p><p className="text-xs font-black uppercase text-amber-400">{selectedItem.type}</p></div>
                      <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase">Waktu</p><p className="text-[10px] font-black text-green-400">{selectedItem.date.split(',')[1] || selectedItem.date}</p></div>
                    </div>
                  </div>
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
