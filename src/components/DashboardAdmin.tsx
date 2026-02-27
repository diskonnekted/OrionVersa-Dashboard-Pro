"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { 
  MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl, 
  GeoJSON, useMapEvents, useMap, Polyline, Polygon 
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { AlertTriangle, BellRing, ShieldAlert, Wifi, Database as DatabaseIcon, Loader2, Info, LayoutGrid, CheckCircle2, Trash2, RefreshCcw, Radio, MapPin, Plus, Save, X, Edit, MousePointer2, Square, GitCommit, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Helper for marker icons
const createMarkerIcon = (color: string, icon: string) => L.divIcon({
  className: "admin-marker-icon",
  html: `<div style="background-color:${color};width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fa-solid ${icon}"></i></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14]
});

// Drawing Component
function DrawingHandler({ active, type, onAddPoint, points, onFinish }: any) {
  useMapEvents({
    click(e) { if (active) onAddPoint(e.latlng.lat, e.latlng.lng); },
    dblclick() { if (active) onFinish(); }
  });
  return null;
}

// FlyTo Component
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 16, { duration: 1.5 }); }, [target, map]);
  return null;
}

const REGION_DATA: Record<string, string[]> = {
  "Banjarnegara": ["Ampelsari", "Argasoka", "Karangtengah", "Krandegan", "Kutabanjarnegara", "Parakancanggah", "Semarang", "Sokanandi"],
  "Bawang": ["Bandingan", "Bawang", "Binorong", "Blambangan", "Joho", "Kebondalem", "Masaran", "Wanadri"],
  "Karangkobar": ["Ambal", "Binangun", "Jatiteken", "Karangkobar", "Leksana", "Pagentan", "Pasiraman", "Sampang"],
  "Madukara": ["Bantarwaru", "Clapar", "Gumiwang", "Kutayasa", "Madukara", "Pagelak", "Pekauman", "Talunamba"],
  "Pagentan": ["Aribaya", "Gumingsir", "Kalitlaga", "Karangnangka", "Kasinoman", "Nagadira", "Pagentan", "Plumbungan"],
  "Purwanegara": ["Gumiwang", "Kaliajir", "Karanganyar", "Mertasari", "Pucungbedug", "Purwanegara", "Smeru"],
  "Susukan": ["Bumiagung", "Gumelem Kulon", "Gumelem Wetan", "Kemranggon", "Susukan"]
};

const DISASTER_MAP: Record<string, { color: string, icon: string }> = {
  "Longsor": { color: "#a855f7", icon: "fa-hill-rockslide" },
  "Banjir": { color: "#3b82f6", icon: "fa-house-flood-water" },
  "Kebakaran": { color: "#ef4444", icon: "fa-fire" },
  "Angin Kencang": { color: "#06b6d4", icon: "fa-wind" },
  "Gempa Bumi": { color: "#f59e0b", icon: "fa-house-crack" }
};

type LatLng = [number, number];
type DeviceLinkStyle = "curve" | "straight" | "dashed";

function toNumber(value: any): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLat = lat2 - lat1;
  const dLng = toRad(b[1] - a[1]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function computeMstEdges(nodes: Array<{ id: any; latitude: any; longitude: any }>) {
  const pts = nodes
    .map((n) => {
      const lat = toNumber(n.latitude);
      const lng = toNumber(n.longitude);
      if (lat === null || lng === null) return null;
      return { id: String(n.id), lat, lng };
    })
    .filter(Boolean) as Array<{ id: string; lat: number; lng: number }>;

  if (pts.length < 2) return [];

  const visited = new Set<string>();
  const edges: Array<{ a: typeof pts[number]; b: typeof pts[number]; dist: number }> = [];

  visited.add(pts[0].id);
  while (visited.size < pts.length) {
    let best: { a: typeof pts[number]; b: typeof pts[number]; dist: number } | null = null;
    for (const a of pts) {
      if (!visited.has(a.id)) continue;
      for (const b of pts) {
        if (visited.has(b.id)) continue;
        const dist = haversineMeters([a.lat, a.lng], [b.lat, b.lng]);
        if (!best || dist < best.dist) best = { a, b, dist };
      }
    }
    if (!best) break;
    edges.push(best);
    visited.add(best.b.id);
  }

  return edges;
}

function buildCurvedPositions(a: LatLng, b: LatLng, segments = 24): LatLng[] {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const mx = (lng1 + lng2) / 2;
  const my = (lat1 + lat2) / 2;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d;
  const ny = dx / d;
  const sign = dx >= 0 ? 1 : -1;
  const offset = Math.min(0.06, Math.max(0.004, d * 0.25));
  const cx = mx + nx * offset * sign;
  const cy = my + ny * offset * sign;

  const out: LatLng[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const inv = 1 - t;
    const x = inv * inv * lng1 + 2 * inv * t * cx + t * t * lng2;
    const y = inv * inv * lat1 + 2 * inv * t * cy + t * t * lat2;
    out.push([y, x]);
  }
  return out;
}

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState<"reports" | "devices" | "features" | "analysis">("reports");
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
  const [user, setUser] = useState<any>(null);
  const [showDeviceLinks, setShowDeviceLinks] = useState(true);
  const [deviceLinkStyle, setDeviceLinkStyle] = useState<DeviceLinkStyle>("curve");
  const router = useRouter();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("orion_user") || "null");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    setUser(savedUser);
    fetch("/sungai/data/peta_desa.geojson").then(r=>r.json()).then(d=>setVillageGeo(d));
    loadData();
    const intv = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(intv);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("orion_user");
    router.push("/login");
  };

  const isAdmin = user?.role === "ADMIN";
  const canVerify = user?.role === "ADMIN" || user?.role === "KEPALA";

  const loadData = async () => {
    setLoading(true);
    try {
      const [repRes, devRes, featRes] = await Promise.all([
        fetch("/sungai/api/reports"), fetch("/sungai/api/admin/devices"), fetch("/sungai/api/admin/features")
      ]);
      setReports(await repRes.json());
      setDevices(await devRes.json());
      setFeatures(await featRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
    if (selected?.id === reportId) setSelected(updated.find((r: any) => r.id === reportId));
  };

  const markAsValid = async (reportId: any) => {
    const target = reports.find(r => r.id === reportId);
    const res = await fetch("/sungai/api/reports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...target, status: 'Ditangani', isValidated: true })
    });
    if (res.ok) { loadData(); setSelected(null); }
  };

  const deleteReport = async (reportId: any) => {
    if(!confirm("Hapus laporan?")) return;
    await fetch(`/sungai/api/reports?id=${reportId}`, { method: "DELETE" });
    loadData(); setSelected(null);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Hapus data?")) return;
    const endpoint = activeTab === "devices" ? "/sungai/api/admin/devices" : "/sungai/api/admin/features";
    await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    loadData();
    setSelected(null);
  };

  const startCreate = () => {
    setIsEditing(true); setSelected(null); setDrawingPoints([]);
    setFormData(activeTab === "reports" ? { name: "ADMIN", type: "Longsor", district: "Banjarnegara", village: "", address: "", desc: "" } : { name: "", type: "Point", category: "tempat" });
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

  const [formData, setFormData] = useState<any>({});
  const handleSave = async () => {
    if (drawingPoints.length === 0) return alert("Tentukan lokasi!");
    setLoading(true);
    try {
      const endpoint = activeTab === "reports" ? "/sungai/api/reports" : (activeTab === "devices" ? "/sungai/api/admin/devices" : "/sungai/api/admin/features");
      const payload = { ...formData, lat: drawingPoints[0]?.[0], lng: drawingPoints[0]?.[1] };
      if (activeTab === "features") payload.geometry = JSON.stringify({ type: formData.type, coordinates: drawingPoints.map((p:any)=>[p[1],p[0]]) });
      if (activeTab === "devices") { payload.latitude = drawingPoints[0][0]; payload.longitude = drawingPoints[0][1]; }
      
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setIsEditing(false); loadData(); setSelected(null); }
    } catch (e) { alert("Error saving"); }
    finally { setLoading(false); }
  };

  const LAYERS = [
    { id: "desa", name: "Batas Desa" }, { id: "sungai_lokal", name: "Hidrologi" }, { id: "jalan_all", name: "Transportasi" },
    { id: "bangunan", name: "Infrastruktur" }, { id: "natural", name: "Lingkungan" }, { id: "tempat", name: "Informasi" }, { id: "bencana", name: "Riwayat Bencana" }
  ];

  const ICON_PICKER = [
    { id: "fa-location-dot", label: "Marker" }, { id: "fa-house", label: "Rumah" }, { id: "fa-building", label: "Gedung" },
    { id: "fa-hospital", label: "RS/Klinik" }, { id: "fa-school", label: "Sekolah" }, { id: "fa-mosque", label: "Masjid" },
    { id: "fa-bridge", label: "Jembatan" }, { id: "fa-road", label: "Jalan" }, { id: "fa-water", label: "Air/Sungai" },
    { id: "fa-triangle-exclamation", label: "Bahaya" }, { id: "fa-fire", label: "Api" }, { id: "fa-flag", label: "Titik Penting" }
  ];

  const COLOR_PICKER = [
    { id: "#ef4444", label: "Merah" }, { id: "#3b82f6", label: "Biru" }, { id: "#10b981", label: "Hijau" },
    { id: "#8b5cf6", label: "Ungu" }, { id: "#f59e0b", label: "Oranye" }, { id: "#1e293b", label: "Hitam" }
  ];

  const DISASTER_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021"];

  const deviceLinkEdges = useMemo(() => {
    if (activeTab !== "devices" || !showDeviceLinks) return [];
    return computeMstEdges(devices);
  }, [activeTab, devices, showDeviceLinks]);

  return (
    <div className="flex h-full w-full bg-slate-100 font-sans overflow-hidden absolute inset-0">
      <aside className="w-[450px] bg-white border-r flex flex-col shadow-xl z-20 h-full overflow-hidden">
        <div className="bg-slate-900 p-4 text-white shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div><h2 className="font-black text-lg">ADMIN PANEL</h2><p className="text-[9px] opacity-50 uppercase tracking-widest">{user?.name} ({user?.role})</p></div>
            <button onClick={handleLogout} className="text-[9px] font-black bg-red-600 px-2 py-1 rounded">LOGOUT</button>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl gap-1">
            {[{ id: "reports", label: "Reports" }, { id: "devices", label: "Devices" }, { id: "features", label: "Map Data" }].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelected(null); setIsEditing(false); }} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab===tab.id ? "bg-indigo-600 text-white" : "text-slate-400"}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-white">
          {!isEditing ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase">{activeTab} ({activeTab === "reports" ? reports.length : (activeTab === "devices" ? devices.length : features.length)})</span>
                <div className="flex items-center gap-2">
                  {activeTab === "devices" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDeviceLinks((v) => !v)}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${showDeviceLinks ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-slate-500 border-slate-200"}`}
                      >
                        Link: {showDeviceLinks ? "On" : "Off"}
                      </button>
                      <select
                        value={deviceLinkStyle}
                        onChange={(e) => setDeviceLinkStyle(e.target.value as DeviceLinkStyle)}
                        className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border border-slate-200 bg-white text-slate-600"
                        disabled={!showDeviceLinks}
                      >
                        <option value="curve">Lengkung</option>
                        <option value="straight">Lurus</option>
                        <option value="dashed">Patah-patah</option>
                      </select>
                    </>
                  )}
                  {isAdmin && <button onClick={startCreate} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase shadow-md"><Plus className="w-3 h-3" /> Tambah</button>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === "reports" && reports.map(r => (
                  <div key={r.id} onClick={()=>{setSelected(r); setMapTarget([r.lat, r.lng])}} className={`p-3 rounded-xl border-2 cursor-pointer ${selected?.id===r.id?'border-indigo-500 bg-indigo-50':'border-slate-50'} ${!r.isValidated && pulse ? 'border-red-400' : ''}`}>
                    <div className="flex justify-between mb-1"><span className="font-black text-[10px] uppercase">{r.type}</span><span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${r.status==='Ditangani'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{r.status}</span></div>
                    <p className="text-[10px] font-bold text-slate-500">{r.village}, {r.district}</p>
                  </div>
                ))}
                {activeTab === "devices" && devices.map(d => (
                  <div
                    key={d.id}
                    onClick={() => { setSelected(d); setMapTarget([d.latitude, d.longitude]); }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all shadow-sm bg-white hover:border-indigo-300 hover:bg-indigo-50/40 ${selected?.id===d.id?'border-indigo-600 bg-indigo-50':'border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-black text-xs uppercase text-slate-900 block truncate">{d.name || d.id}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block truncate">{d.id}</span>
                      </div>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-full uppercase border ${String(d.type).toLowerCase()==='flood' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                        {d.type}
                      </span>
                    </div>
                    {(d.latitude !== undefined && d.longitude !== undefined) && (
                      <div className="mt-2 text-[10px] font-bold text-slate-600 font-mono">
                        {Number(d.latitude).toFixed(5)}, {Number(d.longitude).toFixed(5)}
                      </div>
                    )}
                  </div>
                ))}
                {activeTab === "features" && Array.isArray(features) && features.map(f => (
                  <div key={f.id} onClick={()=>{setSelected(f); const g = JSON.parse(f.geometry); setMapTarget(f.type==="Point" ? [g.coordinates[1], g.coordinates[0]] : [g.coordinates[0][1], g.coordinates[0][0]])}} className={`p-3 rounded-xl border-2 cursor-pointer ${selected?.id===f.id?'border-indigo-500 bg-indigo-50':'border-slate-50'}`}>
                    <span className="font-black text-[10px] uppercase block">{f.name}</span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 rounded uppercase">{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 grid grid-rows-[auto_1fr_auto] bg-white z-40 overflow-hidden">
              <div className="p-4 border-b flex justify-between bg-slate-900 text-white shrink-0 shadow-md">
                <h3 className="text-[10px] font-black uppercase tracking-widest">{selected ? 'Edit' : 'Tambah'} {activeTab}</h3>
                <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-5 space-y-6">
                <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Nama</label><input required value={formData.name || ""} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 text-xs font-bold text-slate-900" /></div>
                {activeTab === "reports" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <select value={formData.district} onChange={(e)=>setFormData({...formData, district: e.target.value, village: REGION_DATA[e.target.value][0]})} className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-900">{Object.keys(REGION_DATA).map(d => <option key={d}>{d}</option>)}</select>
                      <select value={formData.village} onChange={(e)=>setFormData({...formData, village: e.target.value})} className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-900">{REGION_DATA[formData.district]?.map(v => <option key={v}>{v}</option>)}</select>
                    </div>
                    <textarea value={formData.desc || ""} onChange={e=>setFormData({...formData, desc: e.target.value})} placeholder="Deskripsi kejadian..." className="w-full p-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 h-24" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={formData.type || "Point"} onChange={e=>{setFormData({...formData, type: e.target.value}); setDrawingPoints([])}} className="p-3 rounded-xl border-2 text-xs font-bold text-slate-900">
                        <option value="Point">Point</option><option value="LineString">Line</option><option value="Polygon">Polygon</option>
                      </select>
                      <select value={formData.category || "tempat"} onChange={e=>setFormData({...formData, category: e.target.value, year: e.target.value === "bencana" ? "2026" : null})} className="p-3 rounded-xl border-2 text-xs font-bold text-slate-900">
                        {LAYERS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    {formData.category === "bencana" && (
                      <div className="grid grid-cols-2 gap-3">
                        <select value={formData.year || "2026"} onChange={e=>setFormData({...formData, year: e.target.value})} className="p-3 rounded-xl border-2 text-xs font-bold text-slate-900">{DISASTER_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                        <select value={formData.icon || "Longsor"} onChange={e=>{const type = e.target.value; setFormData({...formData, icon: type, color: DISASTER_MAP[type]?.color || "#ef4444"});}} className="p-3 rounded-xl border-2 text-xs font-bold text-slate-900">{Object.keys(DISASTER_MAP).map(t => <option key={t} value={t}>{t}</option>)}</select>
                      </div>
                    )}
                  </>
                )}
                <div className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-900 uppercase">Geospasial</span><span className="text-[8px] font-bold text-indigo-400 uppercase">{drawingPoints.length} Titik</span></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsDrawing(true)} className={`flex-1 py-3 rounded-xl border-2 border-dashed font-black text-[10px] uppercase transition-all ${isDrawing ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600'}`}>{isDrawing ? "Klik di Peta..." : "Tentukan Lokasi"}</button>
                    {isDrawing && formData.type !== "Point" && <button type="button" onClick={() => setIsDrawing(false)} className="px-4 py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase">Selesai</button>}
                  </div>
                </div>
                {(activeTab === "features" && formData.type === "Point" && formData.category !== "bencana") && (
                  <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded-xl border">
                    {ICON_PICKER.map(ico => <button key={ico.id} type="button" onClick={() => setFormData({...formData, icon: ico.id})} className={`w-9 h-9 rounded-lg flex items-center justify-center ${formData.icon === ico.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}><i className={`fa-solid ${ico.id} text-xs`}></i></button>)}
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-slate-50 flex gap-3 shrink-0">
                <button type="button" disabled={loading} onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg disabled:opacity-50">SIMPAN PERUBAHAN</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white border-2 text-slate-600 rounded-xl font-black uppercase text-[10px]">BATAL</button>
              </div>
            </div>
          )}
          
          {!isEditing && selected && (
            <div className="p-4 bg-slate-900 rounded-t-[32px] text-white space-y-4 absolute bottom-0 left-0 right-0 z-30 max-h-[70%] overflow-y-auto">
              {activeTab === "reports" ? (
                <>
                  <div className="relative group"><img src={selected.photo} className="w-full h-32 object-cover rounded-2xl border border-white/10" />{isAdmin && <button onClick={()=>deleteReport(selected.id)} className="absolute top-2 right-2 p-2 bg-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button>}</div>
                  <p className="text-[10px] font-bold text-indigo-300">{selected.address}</p>
                  <p className="text-[10px] italic opacity-80 mt-1">"{selected.desc}"</p>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-3">
                    {['reporter', 'village', 'residents'].map(f => (
                      <label key={f} className={`flex items-center gap-3 p-2 bg-white/5 rounded-lg ${!canVerify ? 'opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={selected.verif?.[f]} onChange={()=>updateVerif(selected.id, f)} disabled={!canVerify} className="w-3 h-3 rounded text-indigo-500" />
                        <p className="text-[9px] font-black uppercase">{f}</p>
                      </label>
                    ))}
                  </div>
                  {selected.status !== 'Ditangani' && canVerify && (
                    <button onClick={() => markAsValid(selected.id)} disabled={!(selected.verif?.reporter && selected.verif?.village && selected.verif?.residents)} className="w-full py-3 bg-green-600 rounded-xl font-black uppercase text-[10px] disabled:opacity-50">Validasi Laporan</button>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-start">
                  <div><h3 className="font-black text-sm uppercase">{selected.name}</h3><p className="text-[9px] font-bold text-indigo-400 mt-2 uppercase">{selected.category || selected.type}</p></div>
                  {isAdmin && <div className="flex gap-2"><button onClick={() => startEdit(selected)} className="p-2 bg-white/10 rounded-lg hover:bg-indigo-600"><Edit className="w-3 h-3" /></button><button onClick={() => handleDelete(selected.id)} className="p-2 bg-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button></div>}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        <MapContainer center={[-7.36, 109.68]} zoom={11} maxBounds={[[-7.7, 109.2], [-7.0, 110.1]]} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" /><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo target={mapTarget} />
          <DrawingHandler active={isDrawing} type={formData.type} points={drawingPoints} onAddPoint={(lat:any, lng:any) => { if(activeTab==="reports" || formData.type==="Point") { setDrawingPoints([[lat, lng]]); setIsDrawing(false); } else setDrawingPoints((p:any) => [...p, [lat, lng]]); }} onFinish={() => setIsDrawing(false)} />
          {activeTab === "devices" && showDeviceLinks && deviceLinkEdges.map((e) => {
            const a: LatLng = [e.a.lat, e.a.lng];
            const b: LatLng = [e.b.lat, e.b.lng];
            const positions = deviceLinkStyle === "curve" ? buildCurvedPositions(a, b) : [a, b];
            const pathOptions: any = deviceLinkStyle === "dashed"
              ? { color: "#ef4444", weight: 4, opacity: 0.9, dashArray: "10 10" }
              : { color: "#ef4444", weight: 4, opacity: 0.9 };
            return (
              <Polyline
                key={`${e.a.id}__${e.b.id}`}
                positions={positions}
                pathOptions={pathOptions}
              />
            );
          })}
          {activeTab === "features" && Array.isArray(features) && features.map(f => {
            const g = JSON.parse(f.geometry);
            const isDis = f.category === "bencana"; const cfg = isDis ? (DISASTER_MAP[f.icon] || { color: f.color, icon: "fa-triangle-exclamation" }) : null;
            if (f.type === "Point") return <Marker key={f.id} position={[g.coordinates[1], g.coordinates[0]]} icon={createMarkerIcon(cfg?.color || f.color, cfg?.icon || f.icon)}><Popup><b>{f.name}</b></Popup></Marker>;
            if (f.type === "LineString") return <Polyline key={f.id} positions={g.coordinates.map((c:any)=>[c[1],c[0]])} color={cfg?.color || f.color} weight={4}><Popup><b>{f.name}</b></Popup></Polyline>;
            if (f.type === "Polygon") return <Polygon key={f.id} positions={g.coordinates.map((c:any)=>[c[1],c[0]])} color={cfg?.color || f.color} fillOpacity={0.4}><Popup><b>{f.name}</b></Popup></Polygon>;
            return null;
          })}
          {activeTab === "reports" && reports.map((r: any) => {
            const config = DISASTER_MAP[r.type] || { color: "#6366f1", icon: "fa-triangle-exclamation" };
            const statusColor = r.status === 'Ditangani' ? '#10b981' : (r.status === 'Proses Validasi' ? '#f59e0b' : '#ef4444');
            return <Marker key={r.id} position={[r.lat, r.lng]} icon={L.divIcon({ className: "report-marker", html: `<div style="background-color:${config.color};width:32px;height:32px;border-radius:50%;border:3px solid ${statusColor};display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.3);position:relative;"><i class="fa-solid ${config.icon} text-xs"></i>${r.status === 'Ditangani' ? '<div style="position:absolute;top:-4px;right:-4px;background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;"><i class="fa-solid fa-check"></i></div>' : ''}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] })} eventHandlers={{ click: () => setSelected(r) }} />;
          })}
          {activeTab === "devices" && devices.map((d: any) => <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createMarkerIcon('#10b981', 'fa-water')} eventHandlers={{ click: () => setSelected(d) }} />)}
        </MapContainer>
      </main>
    </div>
  );
}
