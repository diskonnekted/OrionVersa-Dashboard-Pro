"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { 
  MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl, 
  GeoJSON, useMapEvents, useMap, Polyline, Polygon 
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  ShieldCheck, Phone, Home, Users, CheckCircle2, Trash2, 
  RefreshCcw, Radio, MapPin, Plus, Save, X, Edit, 
  Map as MapIcon, Database, AlertCircle, Loader2,
  MousePointer2, Square, GitCommit, HelpCircle, Info
} from "lucide-react";

// Helper for marker icons
const createMarkerIcon = (color: string, icon: string) => L.divIcon({
  className: "admin-marker-icon",
  html: `<div style="background-color:${color};width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fa-solid ${icon}"></i></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14]
});

// Drawing Component
function DrawingHandler({ 
  active, type, onAddPoint, points, onFinish 
}: { 
  active: boolean, 
  type: string, 
  onAddPoint: (lat: number, lng: number) => void,
  points: [number, number][],
  onFinish: () => void
}) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onAddPoint(e.latlng.lat, e.latlng.lng);
    },
    dblclick() {
      if (!active) return;
      onFinish();
    }
  });
  return null;
}

// FlyTo Component
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 1.5 });
  }, [target, map]);
  return null;
}

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState<"reports" | "devices" | "features">("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [villageGeo, setVillageGeo] = useState(null);
  const [pulse, setPulse] = useState(true);
  const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "reports") {
        const res = await fetch("/sungai/api/reports");
        const data = await res.json();
        setReports(data);
      } else if (activeTab === "devices") {
        const res = await fetch("/sungai/api/admin/devices");
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : []);
      } else if (activeTab === "features") {
        const res = await fetch("/sungai/api/admin/features");
        const data = await res.json();
        setFeatures(Array.isArray(data) ? data : []);
      }
    } catch (e) { 
      console.error("Load Data Error:", e); 
      if (activeTab === "devices") setDevices([]);
      if (activeTab === "features") setFeatures([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetch("/sungai/data/peta_desa.geojson").then(r=>r.json()).then(d=>setVillageGeo(d));
    loadData();
    const interval = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(interval);
  }, [activeTab]);

  const startCreate = () => {
    setIsEditing(true);
    setSelected(null);
    setDrawingPoints([]);
    if (activeTab === "devices") {
      setFormData({
        name: "",
        type: "flood",
        status: "aktif",
        latitude: -7.36,
        longitude: 109.68,
        sensor_code: "",
        location: ""
      });
    } else if (activeTab === "reports") {
      setFormData({
        name: "ADMIN BPBD",
        phone: "-",
        type: "Longsor",
        address: "",
        desc: "",
        village: "",
        district: "Banjarnegara",
        photo: "/sungai/logo.png" // Default placeholder
      });
    } else {
      setFormData({
        name: "",
        type: "Point",
        category: "tempat",
        icon: "fa-location-dot",
        color: "#6366f1",
        description: ""
      });
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(true);
    setSelected(item);
    if (activeTab === "features") {
      const geom = JSON.parse(item.geometry);
      setDrawingPoints(item.type === "Point" ? [[geom.coordinates[1], geom.coordinates[0]]] : geom.coordinates.map((c: any) => [c[1], c[0]]));
    } else if (activeTab === "devices") {
      setDrawingPoints([[item.latitude, item.longitude]]);
    }
    setFormData({ ...item });
  };

  const handleSave = async () => {
    if (drawingPoints.length === 0) {
      alert("Harap tentukan lokasi di peta terlebih dahulu!");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "reports") {
        const reportsList = JSON.parse(localStorage.getItem("orion_reports") || "[]");
        const newReport = {
          ...formData,
          id: Date.now(),
          lat: drawingPoints[0][0],
          lng: drawingPoints[0][1],
          isValidated: true,
          status: 'Ditangani',
          verif: { reporter: true, village: true, residents: true },
          timestamp: new Date().toLocaleString()
        };
        reportsList.push(newReport);
        localStorage.setItem("orion_reports", JSON.stringify(reportsList));
        setIsEditing(false);
        loadData();
        setSelected(null);
        alert("Laporan manual berhasil dibuat dan divalidasi!");
        setLoading(false);
        return;
      }

      let payload: any = { ...formData };
      let endpoint = "";

      if (activeTab === "devices") {
        endpoint = "/sungai/api/admin/devices";
        payload.latitude = drawingPoints[0][0];
        payload.longitude = drawingPoints[0][1];
      } else {
        endpoint = "/sungai/api/admin/features";
        const geometry = formData.type === "Point" 
          ? { type: "Point", coordinates: [drawingPoints[0][1], drawingPoints[0][0]] }
          : { type: formData.type, coordinates: drawingPoints.map(p => [p[1], p[0]]) };
        payload.geometry = JSON.stringify(geometry);
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        setIsEditing(false);
        setIsDrawing(false);
        loadData();
        setSelected(null);
        alert("Data berhasil disimpan!");
      } else {
        alert("Gagal menyimpan: " + (result.error || "Terjadi kesalahan server"));
      }
    } catch (e: any) {
      console.error("Save Error:", e);
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVerif = (reportId: any, field: any) => {
    const updated = reports.map(r => {
      if (r.id === reportId) {
        const newVerif = { ...r.verif, [field]: !r.verif[field] };
        return { ...r, verif: newVerif, status: 'Proses Validasi' };
      }
      return r;
    });
    setReports(updated);
    localStorage.setItem("orion_reports", JSON.stringify(updated));
    if (selected?.id === reportId) setSelected(updated.find((r: any) => r.id === reportId));
  };

  const markAsValid = (reportId: any) => {
    const updated = reports.map(r => r.id === reportId ? { ...r, status: 'Ditangani', isValidated: true } : r);
    setReports(updated);
    localStorage.setItem("orion_reports", JSON.stringify(updated));
    if (selected?.id === reportId) setSelected(updated.find((r: any) => r.id === reportId));
  };

  const deleteReport = (reportId: any) => {
    if(!confirm("Hapus laporan ini?")) return;
    const filtered = reports.filter((r: any) => r.id !== reportId);
    setReports(filtered);
    localStorage.setItem("orion_reports", JSON.stringify(filtered));
    setSelected(null);
  };

  const addPoint = (lat: number, lng: number) => {
    if (activeTab === "devices" || (activeTab === "features" && formData.type === "Point")) {
      setDrawingPoints([[lat, lng]]);
      setIsDrawing(false);
    } else {
      setDrawingPoints(p => [...p, [lat, lng]]);
    }
  };

  const finishDrawing = () => setIsDrawing(false);

  const handleDelete = async (id: any) => {
    if (!confirm("Hapus item ini secara permanen?")) return;
    setLoading(true);
    try {
      const endpoint = activeTab === "devices" ? "/sungai/api/admin/devices" : "/sungai/api/admin/features";
      const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
        setSelected(null);
        alert("Data berhasil dihapus");
      } else {
        alert("Gagal menghapus data");
      }
    } catch (e) { 
      alert("Gagal menghapus data"); 
    } finally {
      setLoading(false);
    }
  };

  const LAYERS = [
    { id: "desa", name: "Batas Desa", color: "#10b981", icon: "fa-map" },
    { id: "sungai_lokal", name: "Hidrologi (Sungai/Irigasi)", color: "#3b82f6", icon: "fa-water" },
    { id: "jalan_all", name: "Transportasi (Jalan)", color: "#f59e0b", icon: "fa-road" },
    { id: "bangunan", name: "Infrastruktur (Bangunan)", color: "#64748b", icon: "fa-building" },
    { id: "natural", name: "Lingkungan (Hutan/Taman)", color: "#15803d", icon: "fa-tree" },
    { id: "tempat", name: "Informasi (Tempat)", color: "#4f46e5", icon: "fa-location-dot" },
    { id: "bencana", name: "Riwayat Bencana", color: "#ef4444", icon: "fa-triangle-exclamation" }
  ];

  const DISASTER_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021"];

  const ICON_PICKER = [
    { id: "fa-location-dot", label: "Marker" },
    { id: "fa-house", label: "Rumah" },
    { id: "fa-building", label: "Gedung" },
    { id: "fa-hospital", label: "RS/Klinik" },
    { id: "fa-school", label: "Sekolah" },
    { id: "fa-mosque", label: "Masjid" },
    { id: "fa-church", label: "Gereja" },
    { id: "fa-bridge", label: "Jembatan" },
    { id: "fa-road", label: "Jalan" },
    { id: "fa-water", label: "Air/Sungai" },
    { id: "fa-mountain", label: "Gunung" },
    { id: "fa-tree", label: "Hutan" },
    { id: "fa-triangle-exclamation", label: "Bahaya" },
    { id: "fa-fire", label: "Api" },
    { id: "fa-wind", label: "Angin" },
    { id: "fa-cloud-showers-heavy", label: "Hujan" },
    { id: "fa-plug", label: "Listrik" },
    { id: "fa-tower-broadcast", label: "Menara" },
    { id: "fa-truck", label: "Logistik" },
    { id: "fa-car", label: "Kendaraan" },
    { id: "fa-info", label: "Informasi" },
    { id: "fa-shield-halved", label: "Pos Keamanan" },
    { id: "fa-first-aid", label: "Pos Medis" },
    { id: "fa-flag", label: "Titik Penting" }
  ];

  const COLOR_PICKER = [
    { id: "#ef4444", label: "Merah" },
    { id: "#3b82f6", label: "Biru" },
    { id: "#10b981", label: "Hijau" },
    { id: "#8b5cf6", label: "Ungu" },
    { id: "#f59e0b", label: "Oranye" },
    { id: "#06b6d4", label: "Cyan" },
    { id: "#6366f1", label: "Indigo" },
    { id: "#ec4899", label: "Pink" },
    { id: "#1e293b", label: "Hitam" },
    { id: "#78350f", label: "Coklat" },
    { id: "#64748b", label: "Abu-abu" },
    { id: "#475569", label: "Slate" }
  ];

  const DISASTER_MAP: Record<string, { color: string, icon: string }> = {
    "Longsor": { color: "#a855f7", icon: "fa-hill-rockslide" },
    "Banjir": { color: "#3b82f6", icon: "fa-house-flood-water" },
    "Kebakaran": { color: "#ef4444", icon: "fa-fire" },
    "Angin Kencang": { color: "#06b6d4", icon: "fa-wind" },
    "Gempa Bumi": { color: "#f59e0b", icon: "fa-house-crack" }
  };

  return (
    <div className="flex h-full w-full bg-slate-100 font-sans overflow-hidden relative absolute inset-0">
      <aside className="w-[450px] bg-white border-r flex flex-col shadow-xl z-20 h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-4 text-white shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div><h2 className="font-black text-lg uppercase leading-none tracking-tighter">ADMIN PANEL</h2><p className="text-[9px] text-indigo-400 font-bold uppercase mt-1 tracking-widest">Master Data Management</p></div>
            <button onClick={loadData} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl gap-1 border border-white/10">
            {[{ id: "reports", label: "Reports", icon: AlertCircle }, { id: "devices", label: "Devices", icon: Radio }, { id: "features", label: "Map Data", icon: MapPin }].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelected(null); setIsEditing(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab===tab.id ? "bg-indigo-600 shadow-lg text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><tab.icon className="w-3 h-3" /> {tab.label}</button>
            ))}
          </div>
        </div>

        {/* WORK AREA */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-white">
          {isEditing ? (
            <div className="absolute inset-0 grid grid-rows-[auto_1fr_auto] bg-white animate-in slide-in-from-right-4 overflow-hidden z-40">
              <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white shrink-0 shadow-md z-30">
                <h3 className="text-[10px] font-black uppercase flex items-center gap-2">{selected ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {selected ? 'Edit' : 'Tambah'} {activeTab}</h3>
                <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
              </div>

              <div className="overflow-y-auto bg-white p-5 space-y-6 scrollbar-thin">
                {activeTab === "reports" && (
                  <>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nama Pelapor / Sumber</label>
                      <input required value={formData.name || ""} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 text-xs font-bold text-slate-900" placeholder="e.g. Telp dari Warga" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Kontak Telp</label>
                      <input value={formData.phone || ""} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 text-xs font-bold text-slate-900" placeholder="-" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Jenis Kejadian</label>
                        <select value={formData.type || "Longsor"} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900">
                          <option>Longsor</option><option>Banjir</option><option>Kebakaran</option><option>Angin Kencang</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Kecamatan</label>
                        <input value={formData.district || "Banjarnegara"} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Desa & Alamat</label>
                      <input required value={formData.address || ""} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 text-xs font-bold text-slate-900" placeholder="Desa X, RT 01..." />
                    </div>
                  </>
                )}

                {activeTab !== "reports" && (
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nama Objek</label>
                    <input required value={formData.name || ""} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 text-xs font-bold text-slate-900" placeholder="e.g. Bangunan Kantor" />
                  </div>
                )}

                {activeTab === "devices" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Jenis EWS</label>
                      <select value={formData.type || "flood"} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900">
                        <option value="flood">Banjir</option>
                        <option value="landslide">Longsor</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Kode Sensor</label>
                      <input required value={formData.sensor_code || ""} onChange={e=>setFormData({...formData, sensor_code: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 text-xs font-bold text-slate-900" placeholder="SN-001" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tipe Data</label>
                        <select value={formData.type || "Point"} onChange={e=>{setFormData({...formData, type: e.target.value}); setDrawingPoints([])}} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900">
                          <option value="Point">Point (Titik)</option>
                          <option value="LineString">Line (Garis)</option>
                          <option value="Polygon">Polygon (Area)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Kategori / Layer</label>
                        <select value={formData.category || "tempat"} onChange={e=>setFormData({...formData, category: e.target.value, year: e.target.value === "bencana" ? "2026" : null})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900">
                          {LAYERS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {formData.category === "bencana" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tahun</label>
                          <select value={formData.year || "2026"} onChange={e=>setFormData({...formData, year: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900">
                            {DISASTER_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Jenis Bencana</label>
                          <select 
                            value={formData.icon || "Longsor"} 
                            onChange={e=>{
                              const type = e.target.value;
                              setFormData({...formData, icon: type, color: DISASTER_MAP[type]?.color || "#ef4444"});
                            }} 
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900"
                          >
                            {Object.keys(DISASTER_MAP).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}

                                  <div className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-900 uppercase">Input Geospasial</span><span className="text-[8px] font-bold text-indigo-400 uppercase">{drawingPoints.length} Titik dipilih</span></div>
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => { setIsDrawing(true); if(formData.type==='Point') setDrawingPoints([]); }} className={`flex-1 py-3 rounded-xl border-2 border-dashed font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isDrawing ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
                                        {formData.type === "Polygon" ? <Square className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                        {isDrawing ? "Klik di Peta..." : (drawingPoints.length > 0 ? "Ganti Lokasi" : "Tentukan Lokasi di Peta")}
                                      </button>
                                      {isDrawing && formData.type !== "Point" && (
                                        <button type="button" onClick={finishDrawing} className="px-4 py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-green-700">Selesai</button>
                                      )}
                                    </div>
                                    {isDrawing && formData.type !== "Point" && activeTab !== "devices" && <p className="text-[8px] text-indigo-500 font-bold text-center animate-bounce">Klik beberapa titik di peta, lalu tekan tombol Selesai</p>}
                                  </div>
                {(activeTab === "features" && formData.type === "Point") && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Pilih Simbol</label>
                      <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                        {ICON_PICKER.map(ico => (
                          <button key={ico.id} type="button" onClick={() => setFormData({...formData, icon: ico.id})} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${formData.icon === ico.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'}`}><i className={`fa-solid ${ico.id} text-xs`}></i></button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Pilih Warna</label>
                      <div className="grid grid-cols-6 gap-2 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100">
                        {COLOR_PICKER.map(clr => (
                          <button key={clr.id} type="button" onClick={() => setFormData({...formData, color: clr.id})} className={`w-9 h-9 rounded-full border-2 ${formData.color === clr.id ? 'border-white ring-2 ring-indigo-500' : 'border-transparent opacity-60'}`} style={{ backgroundColor: clr.id }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab === "features" && formData.type !== "Point") && (
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Warna Garis/Area</label>
                    <input type="color" value={formData.color || "#6366f1"} onChange={e=>setFormData({...formData, color: e.target.value})} className="w-full h-10 p-1 rounded-xl border-2 border-slate-100" />
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Deskripsi</label>
                  <textarea value={formData.description || ""} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-900 min-h-[100px]" placeholder="..." />
                </div>
              </div>

              <div className="p-4 border-t bg-slate-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <div className="flex gap-3">
                  <button type="button" disabled={loading} onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-50 active:scale-95 transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Perubahan
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] hover:bg-slate-50 transition-all active:scale-95">Batal</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase">{activeTab === "reports" ? `${reports.length} Laporan` : (activeTab === "devices" ? `${devices.length} Devices` : `${features.length} Features`)}</span>
                <button onClick={startCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md"><Plus className="w-3 h-3" /> Tambah</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === "reports" && reports.sort((a,b)=>b.id-a.id).map(r => (
                  <div key={r.id} onClick={()=>{setSelected(r); setMapTarget([r.lat, r.lng])}} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?.id===r.id?'border-indigo-500 bg-indigo-50 shadow-md':'border-slate-50 hover:bg-slate-50'} ${!r.isValidated && pulse ? 'border-red-400 bg-red-50/30' : ''}`}>
                    <div className="flex justify-between mb-1"><span className="font-black text-[10px] text-slate-700 uppercase">{r.type}</span><span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${r.status==='Ditangani'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{r.status}</span></div>
                    <p className="text-[10px] font-bold text-slate-500">{r.village}, {r.district}</p>
                  </div>
                ))}
                {activeTab === "devices" && devices.map(d => (
                  <div key={d.id} onClick={()=>{setSelected(d); setMapTarget([d.latitude, d.longitude])}} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?.id===d.id?'border-indigo-500 bg-indigo-50 shadow-md':'border-slate-50 hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start"><div><span className="font-black text-[10px] text-slate-800 uppercase block">{d.name}</span><span className="text-[9px] font-bold text-indigo-600 uppercase">{d.type}</span></div><span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${d.status==='aktif'?'bg-green-100 text-green-600':'bg-slate-100 text-slate-400'}`}>{d.status}</span></div>
                  </div>
                ))}
                {activeTab === "features" && Array.isArray(features) && features.map(f => (
                  <div key={f.id} onClick={()=>{setSelected(f); const g = JSON.parse(f.geometry); setMapTarget(f.type==="Point" ? [g.coordinates[1], g.coordinates[0]] : [g.coordinates[0][1], g.coordinates[0][0]])}} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?.id===f.id?'border-indigo-500 bg-indigo-50 shadow-md':'border-slate-50 hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start"><div className="flex items-center gap-2"><div style={{backgroundColor:f.color}} className="w-2 h-2 rounded-full"></div><span className="font-black text-[10px] text-slate-800 uppercase block">{f.name}</span></div><span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{f.type}</span></div>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">{f.category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* SELECTION DETAIL */}
          {!isEditing && selected && (
            <div className="p-4 bg-slate-900 rounded-t-[32px] text-white space-y-4 animate-in slide-in-from-bottom-4 shadow-2xl absolute bottom-0 left-0 right-0 z-30 max-h-[70%] overflow-y-auto scrollbar-hide">
              {activeTab === "reports" ? (
                <>
                  <div className="relative group">
                    <img src={selected.photo} className="w-full h-32 object-cover rounded-2xl border border-white/10" />
                    <button onClick={()=>deleteReport(selected.id)} className="absolute top-2 right-2 p-2 bg-red-600/80 rounded-lg hover:bg-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black opacity-50 uppercase tracking-widest">Pelapor: {selected.name} ({selected.phone})</p>
                    <p className="text-[10px] font-bold leading-tight text-indigo-300">{selected.address}</p>
                    <p className="text-[10px] italic opacity-80 mt-1">"{selected.desc}"</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-3">
                    <p className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protokol Validasi:</p>
                    <div className="space-y-2">
                      {[
                        { id: 'reporter', label: 'Hubungi Pelapor' },
                        { id: 'village', label: 'Verif Perangkat Desa' },
                        { id: 'residents', label: 'Verif Warga Sekitar' }
                      ].map(f => (
                        <label key={f.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 border border-transparent has-[:checked]:border-indigo-500">
                          <input type="checkbox" checked={selected.verif?.[f.id]} onChange={()=>updateVerif(selected.id, f.id)} className="w-3 h-3 rounded bg-transparent border-white/20 text-indigo-500" />
                          <div className="flex-1"><p className="text-[9px] font-black uppercase leading-none">{f.label}</p></div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selected.status !== 'Ditangani' ? (
                    <button 
                      onClick={() => markAsValid(selected.id)} 
                      disabled={!(selected.verif?.reporter && selected.verif?.village && selected.verif?.residents)}
                      className={`w-full py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg ${selected.verif?.reporter && selected.verif?.village && selected.verif?.residents ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Nyatakan Informasi Valid
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 font-black uppercase text-[10px]"><ShieldCheck className="w-4 h-4" /> Informasi Terverifikasi Valid</div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-sm uppercase leading-none">{selected.name}</h3>
                      <p className="text-[9px] font-bold text-indigo-400 mt-2 uppercase">{selected.category || selected.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(selected)} className="p-2 bg-white/10 rounded-lg hover:bg-indigo-600"><Edit className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(selected.id)} className="p-2 bg-red-600/80 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/70 italic">"{selected.description || 'No description'}"</p>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        <MapContainer center={[-7.36, 109.68]} zoom={11} maxBounds={[[-7.7, 109.2], [-7.0, 110.1]]} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" /><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo target={mapTarget} />
          <DrawingHandler active={isDrawing} type={formData.type} points={drawingPoints} onAddPoint={addPoint} onFinish={finishDrawing} />
          
          {villageGeo && activeTab === "reports" && <GeoJSON data={villageGeo} style={(f: any) => ({ color: "#64748b", weight: 1, fillOpacity: 0.05, fillColor: "#fff" })} />}

          {/* Drawing Preview */}
          {isEditing && (
            <>
              {drawingPoints.length > 0 && (activeTab === "devices" || formData.type === "Point") && <Marker position={drawingPoints[0]} icon={createMarkerIcon(formData.color || "#6366f1", formData.icon || "fa-location-dot")} />}
              {formData.type === "LineString" && drawingPoints.length > 1 && <Polyline positions={drawingPoints} color={formData.color} weight={4} />}
              {formData.type === "Polygon" && drawingPoints.length > 2 && <Polygon positions={drawingPoints} color={formData.color} fillOpacity={0.4} />}
              {isDrawing && drawingPoints.map((p, i) => <Marker key={i} position={p} icon={L.divIcon({ className: "dot", html: `<div class="w-2 h-2 bg-white border-2 border-indigo-600 rounded-full"></div>`, iconSize: [8,8], iconAnchor: [4,4] })} />)}
            </>
          )}

          {/* Existing Map Features */}
          {activeTab === "features" && Array.isArray(features) && features.map(f => {
            const g = JSON.parse(f.geometry);
            const isDisaster = f.category === "bencana";
            const disCfg = isDisaster ? (DISASTER_MAP[f.icon] || { color: f.color, icon: "fa-triangle-exclamation" }) : null;

            if (f.type === "Point") return <Marker key={f.id} position={[g.coordinates[1], g.coordinates[0]]} icon={createMarkerIcon(disCfg?.color || f.color, disCfg?.icon || f.icon)}><Popup><b>{isDisaster ? `[${f.icon}] ` : ''}{f.name}</b></Popup></Marker>;
            if (f.type === "LineString") return <Polyline key={f.id} positions={g.coordinates.map((c:any)=>[c[1],c[0]])} color={disCfg?.color || f.color} weight={4}><Popup><b>{f.name}</b></Popup></Polyline>;
            if (f.type === "Polygon") return <Polygon key={f.id} positions={g.coordinates.map((c:any)=>[c[1],c[0]])} color={disCfg?.color || f.color} fillOpacity={0.4}><Popup><b>{f.name}</b></Popup></Polygon>;
            return null;
          })}

          {/* Existing Reports/Devices */}
          {activeTab === "reports" && reports.map((r: any) => {
            const config = DISASTER_MAP[r.type] || { color: "#6366f1", icon: "fa-triangle-exclamation" };
            const statusColor = r.status === 'Ditangani' ? '#10b981' : (r.status === 'Proses Validasi' ? '#f59e0b' : '#ef4444');
            
            return (
              <Marker 
                key={r.id} 
                position={[r.lat, r.lng]} 
                icon={L.divIcon({
                  className: "report-marker",
                  html: `<div style="background-color:${config.color};width:32px;height:32px;border-radius:50%;border:3px solid ${statusColor};display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.3);position:relative;">
                          <i class="fa-solid ${config.icon} text-xs"></i>
                          ${r.status === 'Ditangani' ? '<div style="position:absolute;top:-4px;right:-4px;background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;"><i class="fa-solid fa-check"></i></div>' : ''}
                        </div>`,
                  iconSize: [32, 32], iconAnchor: [16, 16]
                })} 
                eventHandlers={{ click: () => setSelected(r) }}
              />
            );
          })}
          {activeTab === "devices" && devices.map((d: any) => <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createMarkerIcon('#10b981', 'fa-water')} />)}
        </MapContainer>
        {isDrawing && <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-2xl animate-bounce flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> Klik di Peta {formData.type !== "Point" ? "• Tekan tombol Selesai di Sidebar" : ""}</div>}
      </main>
    </div>
  );
}
