"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, ScaleControl, ZoomControl, Marker, Popup, Polyline, Polygon, ImageOverlay } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import InaRiskChart from "./InaRiskChart";
import IrbiDashboard from "./IrbiDashboard";

const LAYERS_CONFIG = [
  { id: "desa", name: "Batas Desa", file: "peta_desa.geojson", color: "#3b82f6", cat: "Administrasi", icon: "fa-map" },
  { id: "batas_bnpb", name: "Batas Administrasi (BNPB)", type: "arcgis_image", url: "https://gis.bnpb.go.id/server/rest/services/Basemap/batas_administrasi/MapServer/export?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=1158%2C973&BBOX=12174009.783704797%2C-851188.7588369228%2C12238542.493225245%2C-796965.6790757853&BBOXSR=3857&IMAGESR=3857&DPI=90", bounds: [[-7.646, 109.361], [-7.157, 109.940]], color: "#64748b", cat: "Administrasi", icon: "fa-map-location-dot" },
  { id: "sungai_garis_kab", name: "Sungai (Garis Detil)", file: "KAB. BANJARNEGARA/sungai", color: "#3b82f6", cat: "Hidrologi", icon: "fa-water" },
  { id: "sungai_area_kab", name: "Sungai (Area)", file: "KAB. BANJARNEGARA/sungai_area.geojson", color: "#0ea5e9", cat: "Hidrologi", icon: "fa-water" },
  { id: "sungai_lokal", name: "Sungai (data lokal)", file: "sungai.geojson", color: "#3b82f6", cat: "Hidrologi", icon: "fa-droplet" },
  { id: "air_permukaan", name: "Waduk / danau / kolam", file: "banjarnegara-air-permukaan.geojson", color: "#0ea5e9", cat: "Hidrologi", icon: "fa-water" },
  { id: "danau_new", name: "Danau / Waduk (Detail)", file: "new/danau.geojson", color: "#0c4a6e", cat: "Hidrologi", icon: "fa-water" },
  { id: "irigasi", name: "Saluran irigasi / kanal", file: "sungai.geojson", color: "#60a5fa", cat: "Hidrologi", icon: "fa-faucet-drip" },
  { id: "jalan_all", name: "Jalan & infrastruktur", file: "jalan.geojson", color: "#f59e0b", cat: "Transportasi", icon: "fa-road" },
  { id: "jalan_kab", name: "Jalan Kabupaten", file: "jalan_kabupaten.geojson", color: "#d97706", cat: "Transportasi", icon: "fa-car-side" },
  { id: "jalan_prov", name: "Jalan Provinsi", file: "jalan_provinsi.geojson", color: "#b45309", cat: "Transportasi", icon: "fa-truck" },
  { id: "pemukiman", name: "Area Pemukiman", file: "KAB. BANJARNEGARA/pemukiman.geojson", color: "#f97316", cat: "Infrastruktur", icon: "fa-city" },
  { id: "bangunan", name: "Bangunan (GeoJSON lokal)", file: "buildings_banjarnegara.geojson", color: "#64748b", cat: "Infrastruktur", icon: "fa-building" },
  { id: "bangunan_area_new", name: "Area Bangunan (Detail)", file: "new/bangunan_area.geojson", color: "#78350f", cat: "Infrastruktur", icon: "fa-building" },
  { id: "bangunan_titik_new", name: "Titik Bangunan (Detail)", file: "new/bangunan_titik", color: "#451a03", cat: "Infrastruktur", icon: "fa-circle-dot" },
  { id: "ibadah_new", name: "Tempat Ibadah", file: "new/ibadah.geojson", color: "#7e22ce", cat: "Infrastruktur", icon: "fa-place-of-worship" },
  { id: "rambu", name: "Rambu Lalu Lintas", file: "rambu_only.geojson", color: "#eab308", cat: "Infrastruktur", icon: "fa-traffic-light" },
  { id: "pju", name: "Lampu PJU / Penerangan", file: "pju.geojson", color: "#f59e0b", cat: "Infrastruktur", icon: "fa-lightbulb" },
  { id: "kontur", name: "Kontur tanah / elevasi", file: "kontur-banjarnegara.geojson", color: "#8b5cf6", cat: "Topografi", icon: "fa-mountain" },
  // { id: "kontur_full", name: "Kontur Lengkap (Detail)", file: "KAB. BANJARNEGARA/kontur_full", color: "#8b5cf6", cat: "Topografi", icon: "fa-mountain-sun" },
  { id: "tanah", name: "Jenis Tanah", file: "tanah-jateng.geojson", color: "#d97706", cat: "Topografi", icon: "fa-hill-rockslide" },
  { id: "sawah_new", name: "Sawah", file: "new/sawah.geojson", color: "#4ade80", cat: "Tata Guna Lahan", icon: "fa-seedling" },
  { id: "ladang_new", name: "Ladang / Tegalan", file: "new/ladang.geojson", color: "#84cc16", cat: "Tata Guna Lahan", icon: "fa-wheat" },
  { id: "kebun_new", name: "Perkebunan", file: "new/kebun.geojson", color: "#166534", cat: "Tata Guna Lahan", icon: "fa-tree" },
  { id: "tambang_new", name: "Area Pertambangan", file: "new/tambang.geojson", color: "#1f2937", cat: "Tata Guna Lahan", icon: "fa-industry" },
  { id: "big_tanah", name: "Zona kerentanan tanah (BIG)", url: "/sungai/api/proxy/landslide", color: "#f43f5e", cat: "Bencana", icon: "fa-warning" },
  { id: "natural", name: "Area alami (hutan/taman)", file: "natural.geojson", color: "#15803d", cat: "Lingkungan", icon: "fa-tree" },
  { id: "bahaya_banjir", name: "Peta Bahaya Banjir (BNPB)", type: "arcgis_image", url: "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/ImageServer/exportImage?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=1158%2C973&BBOX=12144450.718491517%2C-912335.8167964853%2C12363452.805747215%2C-728321.1096291321&BBOXSR=3857&IMAGESR=3857&DPI=90", bounds: [[-8.196, 109.100], [-6.544, 111.065]], color: "#0ea5e9", cat: "Bencana", icon: "fa-water" },
  { id: "bahaya_cuaca", name: "Peta Bahaya Cuaca Ekstrim (BNPB)", type: "arcgis_image", url: "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_cuaca_ekstrim/ImageServer/exportImage?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=1159%2C972&BBOX=12168057.250716235%2C-854737.967695456%2C12241073.65211188%2C-793502.4697173997&BBOXSR=3857&IMAGESR=3857&DPI=90", bounds: [[-7.674, 109.307], [-7.126, 109.963]], color: "#f59e0b", cat: "Bencana", icon: "fa-cloud-bolt" },
  { id: "bahaya_longsor", name: "Peta Bahaya Tanah Longsor (BNPB)", type: "arcgis_image", url: "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor/ImageServer/exportImage?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=1158%2C973&BBOX=12174009.783704797%2C-851188.7588369228%2C12238542.493225245%2C-796965.6790757853&BBOXSR=3857&IMAGESR=3857&DPI=90", bounds: [[-7.646, 109.361], [-7.157, 109.940]], color: "#a855f7", cat: "Bencana", icon: "fa-hill-rockslide" },
  { id: "tempat", name: "Nama desa/kota (tempat)", file: "tempat.geojson", color: "#4f46e5", cat: "Informasi", icon: "fa-location-dot" },
  { id: "laporan", name: "Laporan Masyarakat (Live)", color: "#ec4899", cat: "Informasi", icon: "fa-comment-dots" }
];

const DISASTER_MAP: Record<string, { color: string, icon: string }> = {
  "Longsor": { color: "#a855f7", icon: "fa-hill-rockslide" },
  "Banjir": { color: "#3b82f6", icon: "fa-house-flood-water" },
  "Kebakaran": { color: "#ef4444", icon: "fa-fire" },
  "Angin Kencang": { color: "#06b6d4", icon: "fa-wind" },
  "Gempa Bumi": { color: "#f59e0b", icon: "fa-house-crack" }
};

const DISASTER_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021"];
const DISASTER_TYPES = [
  { id: "longsor", label: "Tanah Longsor", keywords: ["longsor", "bergerak", "gerakan", "talud"], color: "#a855f7", icon: "fa-solid fa-hill-rockslide" },
  { id: "kebakaran", label: "Kebakaran", keywords: ["kebakaran", "terbakar"], color: "#ef4444", icon: "fa-solid fa-fire" },
  { id: "air", label: "Banjir / Laka Air", keywords: ["banjir", "air", "sumur"], color: "#3b82f6", icon: "fa-solid fa-house-flood-water" },
  { id: "angin", label: "Angin Kencang", keywords: ["angin", "pohon tumbang"], color: "#06b6d4", icon: "fa-solid fa-wind" }
];

function Controller({ setPos }: any) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const onMove = (e: any) => setPos(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
    map.on("mousemove", onMove);
    return () => { map.off("mousemove", onMove); };
  }, [map, setPos]);
  return null;
}

export default function DashboardExplorer() {
  const [selected, setSelected] = useState(["desa"]);
  const [selectedDisasters, setSelectedDisasters] = useState<Record<string, any>>({});
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [dataCache, setDataCache] = useState<Record<string, any>>({});
  const [mousePos, setMousePos] = useState("-");
  const [boundary, setBoundary] = useState<any>(null);
  const [dynamicMarkers, setDynamicMarkers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isIrbiOpen, setIsIrbiOpen] = useState(false);

  useEffect(() => { fetch("/sungai/data/batas-admin.geojson").then(r=>r.json()).then(d=>setBoundary(d)).catch(()=>{}); }, []);

  useEffect(() => {
    fetch("/sungai/api/locations").then(r => r.json()).then(data => setDynamicMarkers(Array.isArray(data) ? data : [])).catch(() => setDynamicMarkers([]));
    fetch("/sungai/api/reports").then(r => r.json()).then(data => setReports(Array.isArray(data) ? data : [])).catch(() => setReports([]));
  }, []);

  useEffect(() => {
    // Only fetch data for currently selected layers that are not yet cached
    selected.forEach((id: any) => {
      if (!dataCache[id]) {
        const cfg = LAYERS_CONFIG.find((l: any) => l.id === id);
        if (cfg) {
          // Fetch logic based on configuration type
          let fetchUrl = "";
          if (cfg.file) fetchUrl = "/sungai/data/" + cfg.file;
          else if (cfg.url && !cfg.type) fetchUrl = cfg.url; // For API endpoints like BIG landslide

          if (fetchUrl) {
             fetch(fetchUrl)
               .then(r => {
                 if (!r.ok) {
                    console.error(`Fetch failed for layer ${id} at ${fetchUrl}: ${r.status} ${r.statusText}`);
                    throw new Error(`Network response was not ok: ${r.status}`);
                 }
                 return r.json();
               })
               .then(d => { 
                 if(d && d.type) setDataCache(p => ({...p, [id]:d})); 
               })
               .catch(e => console.error(`Failed to load layer ${id}:`, e));
          }
        }
      }
    });

    // Handle disaster years separately
    DISASTER_YEARS.forEach((y: any) => {
      const fn = `bencana-banjarnegara-${y}.geojson`;
      const isYearActive = Object.keys(selectedDisasters).some(k => k.startsWith(y) && selectedDisasters[k]);
      
      if (isYearActive && !dataCache[fn]) {
        fetch("/sungai/data/"+fn)
          .then(r => r.json())
          .then(d => setDataCache(p => ({...p, [fn]:d})))
          .catch(() => {});
      }
    });
  }, [selected, selectedDisasters, dataCache]);

  const getSoilStyle = (f: any) => {
    const type = (f.properties?.MACAM_TANA || "").toLowerCase();
    let color = "#d97706"; // Default

    if (type.includes("aluvial")) color = "#78716c"; // Abu-abu kecoklatan (Endapan)
    else if (type.includes("andosol")) color = "#262626"; // Hitam (Vulkanik subur)
    else if (type.includes("latosol")) color = "#b91c1c"; // Merah bata (Tanah tua)
    else if (type.includes("regosol")) color = "#facc15"; // Kuning (Pasir vulkanik)
    else if (type.includes("grumosol")) color = "#4b5563"; // Abu-abu gelap (Lempung berat)
    else if (type.includes("mediteran")) color = "#ef4444"; // Merah terang (Kapur)
    else if (type.includes("litosol")) color = "#854d0e"; // Coklat berbatu (Tanah dangkal)
    else if (type.includes("podsolik")) color = "#d97706"; // Kuning kemerahan

    return { 
      color: color, 
      weight: 1, 
      opacity: 0.8, 
      fillOpacity: 0.5, 
      fillColor: color 
    };
  };

  const getContourStyle = (f: any) => {
    // Properti ketinggian bisa berupa HEIGHT, ELEVATION, atau contour
    const h = f.properties?.HEIGHT || f.properties?.ELEVATION || f.properties?.contour || f.properties?.VALKNT || 0;
    
    // Skema warna berdasarkan ketinggian (Hypsometric tint MENYOLOK)
    let color = "#22c55e"; // Dataran rendah (Hijau Terang)
    
    if (h > 2000) color = "#7f1d1d"; // Puncak Gunung (Merah Tua Gelap)
    else if (h > 1500) color = "#dc2626"; // Pegunungan (Merah)
    else if (h > 1000) color = "#ea580c"; // Dataran Tinggi Atas (Oranye Tua)
    else if (h > 750) color = "#f97316"; // Dataran Tinggi (Oranye)
    else if (h > 500) color = "#fbbf24"; // Perbukitan Tinggi (Kuning Emas)
    else if (h > 250) color = "#facc15"; // Perbukitan (Kuning)
    else if (h > 100) color = "#4ade80"; // Dataran Rendah (Hijau Muda)
    else color = "#22c55e"; // Sangat Rendah (Hijau)

    return { 
      color: color, 
      weight: h % 500 === 0 ? 2 : (h % 100 === 0 ? 1.5 : 0.5), // Garis lebih tebal agar warna terlihat
      opacity: 0.9 // Opacity tinggi agar warna menyolok
    };
  };

  const createDisasterIcon = (t: any) => L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${t.color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;"><i class="${t.icon}"></i></div>`,
    iconSize: [22, 22], iconAnchor: [11, 11]
  });

  const createCategoryIcon = (color: string, icon: string) => L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><i class="fa-solid ${icon}"></i></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12]
  });

  const categories = ["Administrasi", "Hidrologi", "Transportasi", "Infrastruktur", "Topografi", "Tata Guna Lahan", "Bencana", "Lingkungan", "Informasi"];

  const renderLegend = () => {
    return (
      <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 max-w-[200px] max-h-[300px] overflow-y-auto scrollbar-hide">
        <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Legenda Peta</h4>
        <div className="space-y-3">
          {/* Legend Tanah */}
          {selected.includes("tanah") && (
            <div>
              <span className="block text-[9px] font-bold text-slate-700 mb-1">Jenis Tanah</span>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { l: "Aluvial", c: "#78716c" }, { l: "Andosol", c: "#262626" },
                  { l: "Latosol", c: "#b91c1c" }, { l: "Regosol", c: "#facc15" },
                  { l: "Grumosol", c: "#4b5563" }, { l: "Mediteran", c: "#ef4444" },
                  { l: "Litosol", c: "#854d0e" }, { l: "Podsolik", c: "#d97706" }
                ].map(i => (
                  <div key={i.l} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{backgroundColor: i.c}}></span>
                    <span className="text-[9px] text-slate-600 font-medium">{i.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Legend Kontur */}
          {(selected.includes("kontur") || selected.includes("kontur_full")) && (
            <div>
              <span className="block text-[9px] font-bold text-slate-700 mb-1">Ketinggian (mdpl)</span>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { l: "> 2000m", c: "#7f1d1d" }, { l: "1500 - 2000m", c: "#dc2626" },
                  { l: "1000 - 1500m", c: "#ea580c" }, { l: "750 - 1000m", c: "#f97316" },
                  { l: "500 - 750m", c: "#fbbf24" }, { l: "250 - 500m", c: "#facc15" },
                  { l: "100 - 250m", c: "#4ade80" }, { l: "< 100m", c: "#22c55e" }
                ].map(i => (
                  <div key={i.l} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{backgroundColor: i.c}}></span>
                    <span className="text-[9px] text-slate-600 font-medium">{i.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend Bencana */}
          {Object.keys(selectedDisasters).some(k => selectedDisasters[k]) && (
            <div>
              <span className="block text-[9px] font-bold text-slate-700 mb-1">Jenis Bencana</span>
              <div className="grid grid-cols-1 gap-1">
                {DISASTER_TYPES.map(t => (
                   <div key={t.id} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full flex items-center justify-center text-[6px] text-white" style={{backgroundColor: t.color}}>
                      <i className={t.icon}></i>
                    </div>
                    <span className="text-[9px] text-slate-600 font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

           {/* Legend Bahaya Banjir & Cuaca */}
           {(selected.includes("bahaya_banjir") || selected.includes("bahaya_cuaca") || selected.includes("bahaya_longsor")) && (
            <div>
              <span className="block text-[9px] font-bold text-slate-700 mb-1">Indeks Bahaya (BNPB)</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-full h-2 rounded-sm shrink-0 bg-gradient-to-r from-[#38a800] via-[#ffff00] to-[#ff0000]"></span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-medium">
                  <span>Rendah</span>
                  <span>Sedang</span>
                  <span>Tinggi</span>
                </div>
              </div>
            </div>
          )}

          {/* Default Layers */}
          {selected.filter(s => !["tanah", "kontur", "bahaya_banjir", "bahaya_cuaca", "bahaya_longsor"].includes(s)).map(s => {
             const l = LAYERS_CONFIG.find(x => x.id === s);
             if(!l) return null;
             return (
               <div key={s} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 flex items-center justify-center text-[7px]" style={{color: l.color}}>
                    <i className={`fa-solid ${l.icon}`}></i>
                  </div>
                  <span className="text-[9px] text-slate-600 font-medium">{l.name}</span>
               </div>
             )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-[calc(100vh-48px)] overflow-hidden absolute inset-0">
      {/* SIDEBAR KIRI - LAYERS (STATIS) */}
      <aside className="w-80 bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col h-full shrink-0 relative">
        <div className="p-5 border-b shrink-0 bg-white">
          <h2 className="font-black text-indigo-900 text-lg tracking-tighter uppercase leading-none">Penjelajah Data</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sistem Informasi Geografis</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
          {categories.map((cat: any) => {
            const items = LAYERS_CONFIG.filter(l => l.cat === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-indigo-200">{cat}</h4>
                <div className="flex flex-col gap-1">
                  {items.map((l: any) => (
                    <label key={l.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${selected.includes(l.id)?"bg-indigo-50/60 shadow-sm border border-indigo-100":"border border-transparent"}`}>
                      <input type="checkbox" checked={selected.includes(l.id)} onChange={() => setSelected((p: any) => p.includes(l.id)?p.filter((x: any) => x!==l.id):[...p, l.id])} className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300" />
                      <span className={`text-[11px] font-bold ${selected.includes(l.id)?"text-indigo-800":"text-slate-600"}`}>{l.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t bg-slate-50 shrink-0 flex flex-col gap-2">
          <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Banjarnegara</span><span className="text-[9px] font-mono font-bold text-indigo-600 uppercase">{mousePos}</span></div>
          <button onClick={() => window.location.reload()} className="w-full py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2"><i className="fa-solid fa-arrows-to-dot"></i> Reset Center</button>
          <button onClick={() => setIsIrbiOpen(true)} className="w-full py-2 bg-orange-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-orange-600 transition-all shadow-sm flex items-center justify-center gap-2"><i className="fa-solid fa-chart-pie"></i> Dashboard IRBI</button>
        </div>
      </aside>

      {/* IRBI DASHBOARD MODAL */}
      {isIrbiOpen && <IrbiDashboard onClose={() => setIsIrbiOpen(false)} />}

      {/* MAIN MAP AREA */}
      <main className="flex-1 relative h-full bg-slate-50">
        {renderLegend()}
        <MapContainer 
          center={[-7.36, 109.68]} 
          zoom={11.45} 
          minZoom={10} 
          maxZoom={18}
          maxBounds={[[-7.6, 109.3], [-7.1, 110.0]]}
          className="h-full w-full" 
          zoomControl={true}
          zoomSnap={0.05} 
          zoomDelta={0.05}
        >
          {/* Base TileLayer (Always rendered first) */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <Controller setPos={setMousePos} />
          
          {boundary && <GeoJSON data={{...boundary, features: boundary.features.filter((f: any) => f.geometry?.type?.includes("Polygon"))}} interactive={false} style={{ color: "#64748b", weight: 1.5, fillOpacity: 0, dashArray: "5,5" }} />}
          
          {selected.map(id => {
            const d = dataCache[id]; const cfg = LAYERS_CONFIG.find(l=>l.id===id);
            if (!cfg) return null;

            if (cfg.type === "arcgis_image" && cfg.url && cfg.bounds) {
              // Ensure bounds are valid LatLngTuple[]
              const bounds = cfg.bounds as L.LatLngBoundsExpression;
              return <ImageOverlay key={id} url={cfg.url} bounds={bounds} opacity={0.5} zIndex={500} />;
            }

            if ((id === "rambu" || id === "pju") && d && d.features) {
              return (
                <MarkerClusterGroup 
                    key={id} 
                    chunkedLoading 
                    maxClusterRadius={60} 
                    spiderfyOnMaxZoom={true}
                    disableClusteringAtZoom={17}
                >
                  {d.features.map((f: any, i: number) => {
                    const coords = f.geometry.coordinates;
                    // GeoJSON is [lng, lat], Leaflet Marker is [lat, lng]
                    return (
                      <Marker 
                        key={`${id}-${i}`} 
                        position={[coords[1], coords[0]]}
                        icon={L.divIcon({
                          className: "custom-div-icon",
                          html: `<div style="background-color:${cfg.color};width:10px;height:10px;border-radius:50%;border:1px solid white;"></div>`,
                          iconSize: [10, 10],
                          iconAnchor: [5, 5]
                        })}
                        eventHandlers={{
                          click: () => {
                            setSelectedFeature({
                              title: cfg.name,
                              type: "Informasi Layer",
                              properties: f.properties,
                              desc: f.properties.nama || f.properties.keterangan || "Infrastruktur Jalan"
                            });
                          }
                        }}
                      >
                         <Popup>
                            <div className="text-xs font-sans">
                              <b>{cfg.name}</b><br/>
                              {f.properties.nama}<br/>
                            </div>
                         </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              );
            }

            if (!d) return null;
            return <GeoJSON key={id} data={d} 
              pointToLayer={(f: any, l: any) =>L.circleMarker(l,{radius:5,fillColor:cfg.color,color:"#fff",weight:1,fillOpacity:0.8})} 
              style={(f: any) => {
                if (id === "kontur") return getContourStyle(f);
                if (id === "tanah") return getSoilStyle(f);
                if (id === "sungai_garis_kab") return { color: "#3b82f6", weight: 1.5, opacity: 0.8, smoothFactor: 0, noClip: true };
                if (id === "sungai_area_kab") return { color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.5, weight: 0 };
                if (id === "danau_new") return { color: "#0c4a6e", fillColor: "#0c4a6e", fillOpacity: 0.6, weight: 0 };
                if (id === "pemukiman") return { color: "#f97316", fillColor: "#f97316", fillOpacity: 0.5, weight: 0.5 };
                if (id === "bangunan_area_new") return { color: "#78350f", fillColor: "#78350f", fillOpacity: 0.6, weight: 0.5 };
                if (id === "ibadah_new") return { color: "#7e22ce", fillColor: "#7e22ce", fillOpacity: 0.8, weight: 0.5 };
                if (id === "sawah_new") return { color: "#4ade80", fillColor: "#4ade80", fillOpacity: 0.4, weight: 0 };
                if (id === "ladang_new") return { color: "#84cc16", fillColor: "#84cc16", fillOpacity: 0.4, weight: 0 };
                if (id === "kebun_new") return { color: "#166534", fillColor: "#166534", fillOpacity: 0.4, weight: 0 };
                if (id === "tambang_new") return { color: "#1f2937", fillColor: "#1f2937", fillOpacity: 0.6, weight: 0 };
                return { color: cfg.color, weight: 1.5, opacity: 0.8, fillOpacity: (id === "desa" ? 0.05 : 0.1), fillColor: cfg.color };
              }}
              onEachFeature={(f: any, l: any) => {
                l.on("click", () => {
                  setSelectedFeature({
                    title: cfg.name,
                    type: "Informasi Layer",
                    properties: f.properties,
                    desc: f.properties.Nama_Desa_ || f.properties.name || f.properties.MACAM_TANA || "Data Geospasial"
                  });
                });
                if(f.properties) l.bindPopup(`<div class="text-xs font-sans"><b>${cfg.name}</b><br/>${f.properties.Nama_Desa_||f.properties.name||f.properties.MACAM_TANA||f.properties.HEIGHT||"Data"}</div>`) 
              }} 
            />;
          })}

          {DISASTER_YEARS.map(year => {
            const dynamicMatches = dynamicMarkers.filter(m => m.category === "bencana" && String(m.year) === year);
            const reportMatches = year === "2026" ? reports : []; 
            const d = dataCache[`bencana-banjarnegara-${year}.geojson`];
            
            const staticLayers = d ? DISASTER_TYPES.map(type => {
              if (!selectedDisasters[`${year}-${type.id}`]) return null;
              return <GeoJSON key={`static-${year}-${type.id}`} data={d} 
                filter={(f: any) => {
                  const val = (f.properties?.["JENIS KEJADIAN"] || f.properties?.["JENIS_KEJADIAN"] || f.properties?.["Jenis Kejadian"] || f.properties?.["Kejadian"] || f.properties?.["Name"] || "").toLowerCase();
                  return type.keywords.some(k => val.includes(k));
                }} 
                pointToLayer={(f: any, l: any) => L.marker(l, { icon: createDisasterIcon(type), zIndexOffset: 1000 })} 
                onEachFeature={(f,l) => {
                  l.on("click", () => {
                    setSelectedFeature({
                      title: type.label,
                      type: `Bencana ${year}`,
                      properties: f.properties,
                      desc: f.properties.Name || f.properties.JENIS_KEJADIAN || "Kejadian Bencana"
                    });
                  });
                  if(f.properties) l.bindPopup(`<div class="text-xs font-sans"><b>${type.label} (${year})</b><br/>${f.properties.Name || f.properties.JENIS_KEJADIAN || "Bencana"}</div>`) 
                }}
              />;
            }) : null;

            const dynamicLayers = dynamicMatches.map(m => {
              const typeId = DISASTER_TYPES.find(t => t.label === m.icon || t.keywords.some(k => m.name.toLowerCase().includes(k)))?.id || "longsor";
              const isTypeSelected = !!selectedDisasters[`${year}-${typeId}`];
              if (!isTypeSelected) return null;
              const geom = JSON.parse(m.geometry);
              const config = DISASTER_MAP[m.icon] || DISASTER_MAP["Longsor"];
              
              const clickHandler = {
                click: () => setSelectedFeature({
                  title: m.name,
                  type: `Bencana ${year} (Live)`,
                  properties: { ...m, geometry: undefined },
                  desc: m.description
                })
              };

              if (m.type === "Point") return <Marker key={`dyn-dis-${m.id}`} position={[m.lat, m.lng]} icon={createCategoryIcon(m.color || config.color, config.icon)} eventHandlers={clickHandler}><Popup><div className="text-xs"><b>{m.name} ({year})</b><br/>{m.description}</div></Popup></Marker>;
              if (m.type === "LineString") return <Polyline key={`dyn-dis-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || config.color} weight={4} eventHandlers={clickHandler}><Popup><div className="text-xs"><b>{m.name} ({year})</b><br/>{m.description}</div></Popup></Polyline>;
              if (m.type === "Polygon") return <Polygon key={`dyn-dis-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || config.color} fillOpacity={0.4} eventHandlers={clickHandler}><Popup><div className="text-xs"><b>{m.name} ({year})</b><br/>{m.description}</div></Popup></Polygon>;
              return null;
            });

            const reportLayers = reportMatches.map(r => {
              const typeId = DISASTER_TYPES.find(t => t.label === r.type || r.type.toLowerCase().includes(t.id))?.id || "longsor";
              const isTypeSelected = !!selectedDisasters[`${year}-${typeId}`];
              if (!isTypeSelected) return null;
              const config = DISASTER_MAP[r.type] || DISASTER_MAP["Longsor"];
              return (
                <Marker key={`report-explorer-${r.id}`} position={[r.lat, r.lng]} 
                  icon={L.divIcon({ className: "report-marker", html: `<div style="background-color:${config.color};width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fa-solid ${config.icon} text-[8px]"></i></div>`, iconSize: [24, 24], iconAnchor: [12, 12] })}
                  eventHandlers={{
                    click: () => setSelectedFeature({
                      title: `Laporan: ${r.type}`,
                      type: "Laporan Masyarakat",
                      properties: r,
                      desc: r.desc
                    })
                  }}
                >
                  <Popup><div className="p-1 font-sans"><div className="flex justify-between items-center mb-1"><span className="font-black text-[10px] uppercase text-indigo-900">{r.type}</span><span className={`text-[7px] font-black px-1 py-0.5 rounded ${r.status==='Ditangani'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{r.status}</span></div><p className="text-[9px] text-slate-500 italic">"{r.desc}"</p><p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">{r.village}</p></div></Popup>
                </Marker>
              );
            });

            return <div key={`year-group-${year}`}>{staticLayers}{dynamicLayers}{reportLayers}</div>;
          })}

          {selected.includes("laporan") && reports.map(r => {
            const config = DISASTER_MAP[r.type] || { color: "#6366f1", icon: "fa-triangle-exclamation" };
            return (
              <Marker key={`live-report-${r.id}`} position={[r.lat, r.lng]} 
                icon={createCategoryIcon(config.color, config.icon)}
                eventHandlers={{
                  click: () => setSelectedFeature({
                    title: `Laporan: ${r.type}`,
                    type: "Laporan Masyarakat",
                    properties: r,
                    desc: r.desc
                  })
                }}
              >
                <Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">LAPORAN: {r.type}</h4><p className="text-[9px] text-slate-600 mt-1 italic">"{r.desc}"</p><p className="text-[8px] font-black text-indigo-600 mt-2 uppercase">{r.status}</p></div></Popup>
              </Marker>
            );
          })}

          {dynamicMarkers.map(m => {
            if (m.category === "bencana") return null;
            if (!selected.includes(m.category)) return null;
            const cfg = LAYERS_CONFIG.find(l => l.id === m.category);
            const geom = JSON.parse(m.geometry);
            
            const clickHandler = {
              click: () => setSelectedFeature({
                title: m.name,
                type: cfg?.name || "Lokasi Penting",
                properties: { ...m, geometry: undefined },
                desc: m.description
              })
            };

            if (m.type === "Point") return <Marker key={`dyn-${m.id}`} position={[m.lat, m.lng]} icon={createCategoryIcon(m.color || cfg?.color || "#6366f1", m.icon || cfg?.icon || "fa-location-dot")} eventHandlers={clickHandler}><Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">{m.name}</h4><p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{cfg?.name || 'Titik Lokasi'}</p><p className="text-[9px] text-slate-600 mt-2 italic">"{m.description}"</p></div></Popup></Marker>;
            if (m.type === "LineString") return <Polyline key={`dyn-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || cfg?.color || "#6366f1"} weight={4} eventHandlers={clickHandler}><Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">{m.name}</h4><p className="text-[9px] text-slate-600 mt-2 italic">"{m.description}"</p></div></Popup></Polyline>;
            if (m.type === "Polygon") return <Polygon key={`dyn-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || cfg?.color || "#6366f1"} fillOpacity={0.4} eventHandlers={clickHandler}><Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">{m.name}</h4><p className="text-[9px] text-slate-600 mt-2 italic">"{m.description}"</p></div></Popup></Polygon>;
            return null;
          })}

          {/* CONTROLS AT THE END */}
          <ZoomControl position="topright" />
          <ScaleControl position="bottomright" />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Jalan"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satelit"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
          </LayersControl>
        </MapContainer>
      </main>

      {/* SIDEBAR KANAN (POPUP) - BENCANA & INFO */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-none">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)} 
          className="pointer-events-auto w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all border border-slate-200"
          title={isPanelOpen ? "Tutup Panel" : "Buka Panel Riwayat"}
        >
          <i className={`fa-solid fa-${isPanelOpen ? 'xmark' : 'list'} text-sm`}></i>
        </button>

        <aside className={`pointer-events-auto w-80 bg-white/95 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl flex flex-col transition-all duration-300 transform origin-top-right ${isPanelOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 -translate-y-4 pointer-events-none'} h-[calc(100vh-140px)]`}>
          <div className="p-5 border-b border-slate-200/50 shrink-0 flex items-center gap-3">
            <img src="/sungai/banjarnegara.png" alt="Logo Banjarnegara" className="h-10 w-auto object-contain drop-shadow-sm" />
            <div>
              <h2 className={`font-black text-lg tracking-tighter uppercase leading-none ${selectedFeature ? "text-indigo-900" : "text-blue-700"}`}>
                {selectedFeature ? "Detail Informasi" : "Riwayat Bencana"}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                {selectedFeature ? "Data Atribut Layer" : "Data Kejadian & Laporan"}
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {!selectedFeature && <InaRiskChart />}
          {selectedFeature ? (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <button onClick={() => setSelectedFeature(null)} className="flex items-center gap-2 text-[10px] font-bold text-red-600 hover:text-red-800 uppercase mb-4 transition-colors">
                <i className="fa-solid fa-arrow-left"></i> Kembali ke Riwayat
              </button>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-900 text-lg leading-tight mb-2">{selectedFeature.title}</h3>
                <span className="inline-block px-2 py-1 bg-white rounded text-[9px] font-bold text-slate-600 uppercase border border-slate-200 shadow-sm mb-3">
                  {selectedFeature.type}
                </span>
                
                <div className="space-y-3">
                  {Object.entries(selectedFeature.properties || {}).reduce((acc: any[], [key, val]: any) => {
                    if (["geometry", "type", "id", "coordinates", "gx_media_links", "description", "photo"].includes(key)) return acc;
                    
                    const normalizedKey = key.toLowerCase().replace(/_/g, " ").trim();
                    const existingIndex = acc.findIndex((item: any) => item.key.toLowerCase().replace(/_/g, " ").trim() === normalizedKey);
                    
                    if (existingIndex !== -1) {
                      // Jika data sudah ada, pilih yang lebih lengkap/panjang
                      if (val && String(val).length > String(acc[existingIndex].val).length) {
                        acc[existingIndex] = { key, val };
                      }
                    } else {
                      acc.push({ key, val });
                    }
                    return acc;
                  }, []).map(({ key, val }: any) => (
                    <div key={key} className="flex flex-col border-b border-slate-200 pb-2 last:border-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{key.replace(/_/g, " ")}</span>
                      <span className="text-sm font-medium text-slate-700 break-words">{val === null || val === "null" ? "-" : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedFeature.properties?.gx_media_links && selectedFeature.properties.gx_media_links !== "null" && (
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img 
                    src={selectedFeature.properties.gx_media_links.split(' ').find((url: string) => url.match(/\.(jpeg|jpg|gif|png)$/)) || selectedFeature.properties.gx_media_links} 
                    alt="Dokumentasi Kejadian" 
                    className="w-full h-auto object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                  <div className="p-2 bg-slate-50 text-[9px] text-slate-500 font-bold uppercase text-center border-t border-slate-200">
                    Dokumentasi Lapangan
                  </div>
                </div>
              )}

              {/* FOTO RAMBU / PJU (Local) */}
              {selectedFeature.properties?.photo && selectedFeature.properties.photo !== 'NULL' && (
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mt-4">
                  <img 
                    src={`/sungai/perlengkapan/${selectedFeature.properties.photo}`} 
                    alt="Foto Alat" 
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                  />
                  <div className="p-2 bg-slate-50 text-[9px] text-slate-500 font-bold uppercase text-center border-t border-slate-200">
                    Foto Kondisi Fisik
                  </div>
                </div>
              )}

              {(selectedFeature.desc || selectedFeature.properties?.description) && (
                 <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm mt-4">
                   <h4 className="font-bold text-indigo-900 text-xs uppercase mb-2">Keterangan Tambahan</h4>
                   <p className="text-sm text-indigo-800 italic leading-relaxed">
                     "{ (selectedFeature.desc || selectedFeature.properties?.description || "").replace(/<[^>]*>?/gm, '') }"
                   </p>
                 </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               <InaRiskChart />
               {/* DEFAULT VIEW - BANJARNEGARA INFO (PINDAH KANAN) */}
               <div className="relative p-4 bg-blue-600 rounded-xl shadow-lg text-white mb-6 overflow-hidden">
                {/* Background Logo Samar */}
                <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                  <img src="/sungai/banjarnegara.png" alt="" className="w-32 h-auto" />
                </div>

                <div className="relative z-10">
                  <h3 className="font-black text-lg mb-1">Kabupaten Banjarnegara</h3>
                  <p className="text-[10px] font-medium opacity-90 mb-4">Provinsi Jawa Tengah, Indonesia</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                      <span className="block text-[8px] font-bold opacity-70 uppercase">Luas Wilayah</span>
                      <span className="block text-sm font-black">1.069 km²</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                      <span className="block text-[8px] font-bold opacity-70 uppercase">Jumlah Penduduk</span>
                      <span className="block text-sm font-black">1.03 Juta</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20 col-span-2">
                      <span className="block text-[8px] font-bold opacity-70 uppercase">Zona Waktu</span>
                      <span className="block text-sm font-black">WIB (UTC+7)</span>
                    </div>
                  </div>
                </div>
              </div>

              {DISASTER_YEARS.map(year => (
                <div key={year} className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                  <button onClick={() => setExpandedYear(expandedYear === year ? null : year)} className={`w-full flex items-center justify-between p-3 text-[11px] font-black uppercase transition-all ${expandedYear === year ? "bg-blue-50 text-blue-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                    TAHUN {year} <i className={`fa-solid fa-chevron-${expandedYear === year ? 'up' : 'down'} text-[9px]`}></i>
                  </button>
                  {expandedYear === year && (
                    <div className="bg-white p-2 border-t border-slate-50 grid grid-cols-1 gap-1">
                      {DISASTER_TYPES.map(type => (
                        <label key={`${year}-${type.id}`} className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-blue-50/50 transition-colors">
                          <input type="checkbox" checked={!!selectedDisasters[`${year}-${type.id}`]} onChange={() => setSelectedDisasters((p: any) => ({ ...p, [`${year}-${type.id}`]: !p[`${year}-${type.id}`] }))} className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                          <span className="text-[11px] font-bold text-slate-700">{type.label}</span>
                          <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]" style={{backgroundColor: type.color}}>
                            <i className={type.icon}></i>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </aside>
      </div>
    </div>
  );
}
