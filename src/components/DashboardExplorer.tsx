"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, ScaleControl, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const { BaseLayer } = LayersControl;

const LAYERS_CONFIG = [
  { id: "desa", name: "Batas Desa", file: "peta_desa.geojson", color: "#10b981", cat: "Administrasi" },
  { id: "sungai_lokal", name: "Sungai (data lokal)", file: "sungai.geojson", color: "#3b82f6", cat: "Hidrologi" },
  { id: "air_permukaan", name: "Waduk / danau / kolam", file: "banjarnegara-air-permukaan.geojson", color: "#0ea5e9", cat: "Hidrologi" },
  { id: "irigasi", name: "Saluran irigasi / kanal", file: "sungai.geojson", color: "#60a5fa", cat: "Hidrologi" },
  { id: "jalan_all", name: "Jalan & infrastruktur", file: "jalan.geojson", color: "#f59e0b", cat: "Transportasi" },
  { id: "jalan_kab", name: "Jalan Kabupaten", file: "jalan_kabupaten.geojson", color: "#d97706", cat: "Transportasi" },
  { id: "jalan_prov", name: "Jalan Provinsi", file: "jalan_provinsi.geojson", color: "#b45309", cat: "Transportasi" },
  { id: "bangunan", name: "Bangunan (GeoJSON lokal)", file: "buildings_banjarnegara.geojson", color: "#64748b", cat: "Infrastruktur" },
  { id: "kontur", name: "Kontur tanah / elevasi", file: "kontur-banjarnegara.geojson", color: "#8b5cf6", cat: "Topografi" },
  { id: "tanah", name: "Jenis Tanah", file: "tanah-jateng.geojson", color: "#d97706", cat: "Topografi" },
  { id: "big_tanah", name: "Zona kerentanan tanah (BIG)", url: "/api/proxy/landslide", color: "#f43f5e", cat: "Bencana" },
  { id: "natural", name: "Area alami (hutan/taman)", file: "natural.geojson", color: "#15803d", cat: "Lingkungan" },
  { id: "tempat", name: "Nama desa/kota (tempat)", file: "tempat.geojson", color: "#4f46e5", cat: "Informasi" }
];

const DISASTER_YEARS = ["2024", "2023", "2022", "2021"];
const DISASTER_TYPES = [
  { id: "longsor", label: "Tanah Longsor", keywords: ["longsor", "bergerak", "gerakan", "talud"], color: "#a855f7", icon: "fa-solid fa-hill-rockslide" },
  { id: "kebakaran", label: "Kebakaran", keywords: ["kebakaran", "terbakar"], color: "#ef4444", icon: "fa-solid fa-fire" },
  { id: "air", label: "Banjir / Laka Air", keywords: ["banjir", "air", "sumur"], color: "#3b82f6", icon: "fa-solid fa-house-flood-water" },
  { id: "angin", label: "Angin Kencang", keywords: ["angin", "pohon tumbang"], color: "#06b6d4", icon: "fa-solid fa-wind" }
];

function Controller({ setPos }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const onMove = (e) => setPos(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
    map.on("mousemove", onMove);
    return () => map.off("mousemove", onMove);
  }, [map, setPos]);
  return null;
}

export default function DashboardExplorer() {
  const [selected, setSelected] = useState(["desa"]);
  const [selectedDisasters, setSelectedDisasters] = useState({});
  const [expandedYear, setExpandedYear] = useState(null);
  const [dataCache, setDataCache] = useState({});
  const [mousePos, setMousePos] = useState("-");
  const [boundary, setBoundary] = useState(null);

  useEffect(() => { fetch("/data/batas-admin.geojson").then(r=>r.json()).then(d=>setBoundary(d)).catch(()=>{}); }, []);

  useEffect(() => {
    selected.forEach(id => {
      if (!dataCache[id]) {
        const cfg = LAYERS_CONFIG.find(l => l.id === id);
        if (cfg) fetch(cfg.url || "/data/" + cfg.file).then(r=>r.json()).then(d=>{ if(d&&d.type) setDataCache(p=>({...p, [id]:d})); }).catch(()=>{});
      }
    });
    DISASTER_YEARS.forEach(y => {
      const fn = `bencana-banjarnegara-${y}.geojson`;
      if (!dataCache[fn] && Object.keys(selectedDisasters).some(k => k.startsWith(y))) {
        fetch("/data/"+fn).then(r=>r.json()).then(d=>setDataCache(p=>({...p, [fn]:d})));
      }
    });
  }, [selected, selectedDisasters, dataCache]);

  const getContourStyle = (f) => {
    const h = f.properties?.HEIGHT || 0;
    let color = "#16a34a";
    if (h > 1500) color = "#7f1d1d";
    else if (h > 1000) color = "#b91c1c";
    else if (h > 750) color = "#d97706";
    else if (h > 500) color = "#f59e0b";
    else if (h > 250) color = "#ca8a04";
    return { color, weight: h % 100 === 0 ? 2 : 0.5, opacity: 0.8 };
  };

  const createDisasterIcon = (t) => L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${t.color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;"><i class="${t.icon}"></i></div>`,
    iconSize: [22, 22], iconAnchor: [11, 11]
  });

  const categories = ["Administrasi", "Hidrologi", "Transportasi", "Infrastruktur", "Topografi", "Bencana", "Lingkungan", "Informasi"];

  return (
    <div className="flex w-full h-[calc(100vh-48px)] overflow-hidden">
      <aside className="w-80 bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col h-full">
        <div className="p-5 border-b shrink-0 bg-white">
          <h2 className="font-black text-indigo-900 text-lg tracking-tighter uppercase leading-none">Penjelajah Data</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sistem Informasi Geografis</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {categories.map(cat => {
            const items = LAYERS_CONFIG.filter(l => l.cat === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-indigo-200">{cat}</h4>
                <div className="flex flex-col gap-1">
                  {items.map(l => (
                    <label key={l.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${selected.includes(l.id)?"bg-indigo-50/60 shadow-sm border border-indigo-100":"border border-transparent"}`}>
                      <input type="checkbox" checked={selected.includes(l.id)} onChange={() => setSelected(p => p.includes(l.id)?p.filter(x=>x!==l.id):[...p, l.id])} className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300" />
                      <span className={`text-[11px] font-bold ${selected.includes(l.id)?"text-indigo-800":"text-slate-600"}`}>{l.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="space-y-2">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-red-200">Riwayat Bencana</h4>
            <div className="space-y-1.5">
              {DISASTER_YEARS.map(year => (
                <div key={year} className="border border-slate-100 rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedYear(expandedYear === year ? null : year)} className={`w-full flex items-center justify-between p-2 text-[10px] font-black uppercase ${expandedYear === year ? "bg-red-50 text-red-700" : "bg-white text-slate-600"}`}>
                    TAHUN {year} <i className={`fa-solid fa-chevron-${expandedYear === year ? 'up' : 'down'} text-[8px]`}></i>
                  </button>
                  {expandedYear === year && (
                    <div className="bg-white p-1 border-t border-slate-50">
                      {DISASTER_TYPES.map(type => (
                        <label key={`${year}-${type.id}`} className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-slate-50">
                          <input type="checkbox" checked={!!selectedDisasters[`${year}-${type.id}`]} onChange={() => setSelectedDisasters(p => ({ ...p, [`${year}-${type.id}`]: !p[`${year}-${type.id}`] }))} className="w-3 h-3 rounded text-red-600 border-slate-300" />
                          <span className="text-[10px] font-bold text-slate-600">{type.label}</span>
                          <i className={`${type.icon} ml-auto text-[9px]`} style={{ color: type.color }}></i>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t bg-slate-50 shrink-0 flex justify-between items-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Banjarnegara</span>
          <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase">{mousePos}</span>
        </div>
      </aside>

      <main className="flex-1 relative h-full bg-slate-50">
        <MapContainer center={[-7.36, 109.68]} zoom={11} minZoom={9} className="h-full w-full" zoomControl={false} zoomSnap={0.25} zoomDelta={0.25}>
          <Controller setPos={setMousePos} />
          <ZoomControl position="topright" />
          <ScaleControl position="bottomright" />
          <LayersControl position="topright">
            <BaseLayer checked name="Jalan"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></BaseLayer>
            <BaseLayer name="Satelit"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></BaseLayer>
          </LayersControl>
          
          {boundary && <GeoJSON data={{...boundary, features: boundary.features.filter(f => f.geometry?.type?.includes("Polygon"))}} interactive={false} style={{ color: "#64748b", weight: 1.5, fillOpacity: 0, dashArray: "5,5" }} />}
          
          {selected.map(id => {
            const d = dataCache[id]; const cfg = LAYERS_CONFIG.find(l=>l.id===id);
            if (!d || !cfg) return null;
            return <GeoJSON key={id} data={d} 
              pointToLayer={(f,l)=>L.circleMarker(l,{radius:5,fillColor:cfg.color,color:"#fff",weight:1,fillOpacity:0.8})} 
              style={(f)=> {
                if (id === "kontur") return getContourStyle(f);
                const isTanah = id === "tanah";
                const soilColor = isTanah ? (f.properties?.MACAM_TANA?.toLowerCase().includes("litosol") ? "#451a03" : "#d97706") : cfg.color;
                return { color: soilColor, weight: 1.5, opacity: 0.8, fillOpacity: isTanah ? 0.3 : (id === "desa" ? 0.05 : 0.1), fillColor: soilColor };
              }}
              onEachFeature={(f,l)=>{ if(f.properties) l.bindPopup(`<div class="text-xs font-sans"><b>${cfg.name}</b><br/>${f.properties.Nama_Desa_||f.properties.name||f.properties.MACAM_TANA||f.properties.HEIGHT||"Data"}</div>`) }} 
            />;
          })}

          {DISASTER_YEARS.map(year => {
            const d = dataCache[`bencana-banjarnegara-${year}.geojson`]; if (!d) return null;
            return DISASTER_TYPES.map(type => {
              if (!selectedDisasters[`${year}-${type.id}`]) return null;
              return <GeoJSON key={`${year}-${type.id}`} data={d} 
                filter={(f) => {
                  const val = (f.properties?.["JENIS KEJADIAN"] || f.properties?.["JENIS_KEJADIAN"] || f.properties?.["Jenis Kejadian"] || f.properties?.["Kejadian"] || f.properties?.["Name"] || "").toLowerCase();
                  return type.keywords.some(k => val.includes(k));
                }} 
                pointToLayer={(f, l) => L.marker(l, { icon: createDisasterIcon(type), zIndexOffset: 1000 })} 
                onEachFeature={(f,l) => { if(f.properties) l.bindPopup(`<div class="text-xs font-sans"><b>${type.label} (${year})</b><br/>${f.properties.Name || f.properties.JENIS_KEJADIAN || "Bencana"}</div>`) }}
              />;
            });
          })}
        </MapContainer>
      </main>
    </div>
  );
}