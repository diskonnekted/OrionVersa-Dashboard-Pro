"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, ScaleControl, ZoomControl, Marker, Popup, Polyline, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const LAYERS_CONFIG = [
  { id: "desa", name: "Batas Desa", file: "peta_desa.geojson", color: "#10b981", cat: "Administrasi", icon: "fa-map" },
  { id: "sungai_lokal", name: "Sungai (data lokal)", file: "sungai.geojson", color: "#3b82f6", cat: "Hidrologi", icon: "fa-droplet" },
  { id: "air_permukaan", name: "Waduk / danau / kolam", file: "banjarnegara-air-permukaan.geojson", color: "#0ea5e9", cat: "Hidrologi", icon: "fa-water" },
  { id: "irigasi", name: "Saluran irigasi / kanal", file: "sungai.geojson", color: "#60a5fa", cat: "Hidrologi", icon: "fa-faucet-drip" },
  { id: "jalan_all", name: "Jalan & infrastruktur", file: "jalan.geojson", color: "#f59e0b", cat: "Transportasi", icon: "fa-road" },
  { id: "jalan_kab", name: "Jalan Kabupaten", file: "jalan_kabupaten.geojson", color: "#d97706", cat: "Transportasi", icon: "fa-car-side" },
  { id: "jalan_prov", name: "Jalan Provinsi", file: "jalan_provinsi.geojson", color: "#b45309", cat: "Transportasi", icon: "fa-truck" },
  { id: "bangunan", name: "Bangunan (GeoJSON lokal)", file: "buildings_banjarnegara.geojson", color: "#64748b", cat: "Infrastruktur", icon: "fa-building" },
  { id: "kontur", name: "Kontur tanah / elevasi", file: "kontur-banjarnegara.geojson", color: "#8b5cf6", cat: "Topografi", icon: "fa-mountain" },
  { id: "tanah", name: "Jenis Tanah", file: "tanah-jateng.geojson", color: "#d97706", cat: "Topografi", icon: "fa-hill-rockslide" },
  { id: "big_tanah", name: "Zona kerentanan tanah (BIG)", url: "/api/proxy/landslide", color: "#f43f5e", cat: "Bencana", icon: "fa-warning" },
  { id: "natural", name: "Area alami (hutan/taman)", file: "natural.geojson", color: "#15803d", cat: "Lingkungan", icon: "fa-tree" },
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

function FitToBoundary({ boundary }: any) {
  const map = useMap();
  useEffect(() => {
    if (!map || !boundary || !boundary.features || boundary.features.length === 0) return;
    try {
      const layer = L.geoJSON(boundary as any);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch {}
  }, [map, boundary]);
  return null;
}

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
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [bnpbStats, setBnpbStats] = useState<any[] | null>(null);
  const [bnpbLoading, setBnpbLoading] = useState(false);
  const [bnpbPages, setBnpbPages] = useState<any[] | null>(null);
  const [bnpbPagesLoading, setBnpbPagesLoading] = useState(false);

  useEffect(() => { fetch("/data/batas-admin.geojson").then(r=>r.json()).then(d=>setBoundary(d)).catch(()=>{}); }, []);

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(data => setDynamicMarkers(Array.isArray(data) ? data : [])).catch(() => setDynamicMarkers([]));
    fetch("/api/reports").then(r => r.json()).then(data => setReports(Array.isArray(data) ? data : [])).catch(() => setReports([]));
  }, []);

  useEffect(() => {
    const loadBnpb = async () => {
      try {
        setBnpbLoading(true);
        const res = await fetch("/api/bnpb/daily?tahun=2025&kabkot=Banjarnegara");
        const json = await res.json();
        setBnpbStats(Array.isArray(json.byJenisBencana) ? json.byJenisBencana : []);
      } catch {
        setBnpbStats([]);
      } finally {
        setBnpbLoading(false);
      }
    };
    loadBnpb();
  }, []);

  useEffect(() => {
    const loadBnpbPages = async () => {
      try {
        setBnpbPagesLoading(true);
        const res = await fetch("https://gis.bnpb.go.id/arcgis//sharing/rest/content/items/d4ac7dd9718143a4a7a00c25c2235171/data?f=json");
        const json = await res.json();
        const pages = Array.isArray(json?.values?.pages) ? json.values.pages : [];
        const relevantSlugs = [
          "infografis-bencana-bulanan",
          "data-bencana",
          "buletin-info-bencana",
          "disaster-briefing-mingguan",
          "dashboards"
        ];
        const relevant = pages.filter((p: any) => {
          const title = (p.title || "").toLowerCase();
          const slug = (p.slug || "").toLowerCase();
          if (!title && !slug) return false;
          if (relevantSlugs.some((s: string) => slug.includes(s))) return true;
          if (title.includes("infografis bencana bulanan")) return true;
          if (title.includes("buletin info bencana")) return true;
          if (title.includes("data bencana")) return true;
          if (title.includes("disaster briefing")) return true;
          if (title.includes("dashboard")) return true;
          return false;
        });
        setBnpbPages(relevant);
      } catch {
        setBnpbPages([]);
      } finally {
        setBnpbPagesLoading(false);
      }
    };
    loadBnpbPages();
  }, []);

  useEffect(() => {
    selected.forEach((id: any) => {
      if (!dataCache[id]) {
        const cfg = LAYERS_CONFIG.find((l: any) => l.id === id);
        if (cfg) fetch(cfg.url || "/data/" + cfg.file).then(r=>r.json()).then(d=>{ if(d&&d.type) setDataCache(p=>({...p, [id]:d})); }).catch(()=>{});
      }
    });
    DISASTER_YEARS.forEach((y: any) => {
      const fn = `bencana-banjarnegara-${y}.geojson`;
      if (!dataCache[fn] && Object.keys(selectedDisasters).some(k => k.startsWith(y))) {
        fetch("/data/"+fn).then(r=>r.json()).then(d=>setDataCache(p=>({...p, [fn]:d})));
      }
    });
  }, [selected, selectedDisasters, dataCache]);

  const getContourStyle = (f: any) => {
    const h = f.properties?.HEIGHT || 0;
    let color = "#16a34a";
    if (h > 1500) color = "#7f1d1d";
    else if (h > 1000) color = "#b91c1c";
    else if (h > 750) color = "#d97706";
    else if (h > 500) color = "#f59e0b";
    else if (h > 250) color = "#ca8a04";
    return { color, weight: h % 100 === 0 ? 2 : 0.5, opacity: 0.8 };
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

  const parseLegacyDescription = (raw: string) => {
    if (!raw) {
      return { images: [] as string[], chronology: "", impact: "", handling: "", text: "" };
    }
    let temp = raw.replace(/`/g, "");
    const images: string[] = [];
    temp = temp.replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, (_, src: string) => {
      images.push(src);
      return "";
    });
    temp = temp.replace(/<br\s*\/?>/gi, "\n");
    temp = temp.replace(/<\/?[^>]+>/gi, "");
    const text = temp.trim();
    const lower = text.toLowerCase();
    const chronoLabel = "kronologi/ kondisi umum:";
    const impactLabel = "dampak bangunan/ fisik:";
    const handlingLabel = "penanganan:";
    const idxChrono = lower.indexOf(chronoLabel);
    const idxImpact = lower.indexOf(impactLabel);
    const idxHandling = lower.indexOf(handlingLabel);
    const getSection = (startIdx: number, label: string, endIdx: number) => {
      if (startIdx === -1) return "";
      const from = startIdx + label.length;
      const to = endIdx === -1 ? undefined : endIdx;
      return text.slice(from, to).trim();
    };
    const chronology = getSection(idxChrono, chronoLabel, idxImpact !== -1 ? idxImpact : idxHandling);
    const impact = getSection(idxImpact, impactLabel, idxHandling);
    const handling = getSection(idxHandling, handlingLabel, -1);
    return { images, chronology, impact, handling, text };
  };

  const shouldHideLegacyKey = (key: string) => {
    const k = key.toLowerCase().replace(/[\s_]+/g, " ");
    if (k.includes("kronologi")) return true;
    if (k.includes("kondisi umum")) return true;
    if (k.includes("dampak")) return true;
    if (k.includes("tim") && k.includes("terlibat")) return true;
    if (k.includes("saran tl")) return true;
    if (k.includes("petugas")) return true;
    if (k.includes("keterangan lain")) return true;
    if (k.includes("fisik")) return true;
    if (k.includes("luka")) return true;
    return false;
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

  const categories = ["Administrasi", "Hidrologi", "Transportasi", "Infrastruktur", "Topografi", "Bencana", "Lingkungan", "Informasi"];

  const openDetails = (payload: { title: string; subtitle?: string; source?: string; properties: Record<string, any> }) => {
    setSelectedFeature(payload);
  };

  const selectedProps = selectedFeature?.properties || {};
  const hasLegacyDescription =
    typeof selectedProps.description === "string" &&
    /kronologi\/ kondisi umum/i.test(selectedProps.description);
  const parsedLegacy = hasLegacyDescription ? parseLegacyDescription(selectedProps.description) : null;
  const gxMediaRaw =
    typeof selectedProps.gx_media_links === "string"
      ? selectedProps.gx_media_links
      : "";
  const gxMediaUrls = gxMediaRaw
    ? gxMediaRaw
        .split(/\s+/)
        .map((u: string) => u.replace(/`/g, "").trim())
        .filter(Boolean)
    : [];
  const disasterImages = [
    ...(parsedLegacy?.images || []),
    ...gxMediaUrls,
  ];

  return (
    <div className="flex w-full h-[calc(100vh-48px)] overflow-hidden absolute inset-0">
      <aside className="w-80 bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col h-full">
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
                          <input type="checkbox" checked={!!selectedDisasters[`${year}-${type.id}`]} onChange={() => setSelectedDisasters((p: any) => ({ ...p, [`${year}-${type.id}`]: !p[`${year}-${type.id}`] }))} className="w-3 h-3 rounded text-red-600 border-slate-300" />
                          <span className="text-[10px] font-bold text-slate-600">{type.label}</span>
                          <i className={`${type.icon} ml-auto text-[9px]`} style={{ color: type.color }}></i>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Statistik BNPB 2025
                  </p>
                  <p className="text-[10px] font-black text-slate-700 leading-tight">
                    Kab. Banjarnegara
                  </p>
                </div>
                {bnpbLoading && (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                )}
              </div>

              {Array.isArray(bnpbStats) && bnpbStats.length > 0 ? (
                <div className="space-y-1.5">
                  {bnpbStats.map((s: any) => {
                    const mapCfg = DISASTER_MAP[s.jenisBencana] || null;
                    return (
                      <div
                        key={s.jenisBencana}
                        className="flex items-center justify-between text-[10px] bg-white rounded-lg px-2 py-1.5 border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: mapCfg?.color || "#64748b" }}
                          />
                          <span className="font-bold text-slate-700">
                            {s.jenisBencana}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 text-right leading-tight">
                          <span className="font-black text-slate-800">{s.kejadian}</span>{" "}
                          kejadian
                          {typeof s.md === "number" && s.md > 0 && (
                            <> • <span className="font-semibold">{s.md}</span> MD</>
                          )}
                          {typeof s.trdmpk === "number" && s.trdmpk > 0 && (
                            <> • <span className="font-semibold">{s.trdmpk}</span> terdampak</>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !bnpbLoading ? (
                <p className="text-[9px] text-slate-400 italic">
                  Belum ada rekap BNPB yang tersimpan.
                </p>
              ) : null}
            </div>

            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Info Bencana BNPB
                  </p>
                  <p className="text-[10px] font-black text-slate-700 leading-tight">
                    Geoportal Kebencanaan Indonesia
                  </p>
                </div>
                {bnpbPagesLoading && (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                )}
              </div>

              {Array.isArray(bnpbPages) && bnpbPages.length > 0 ? (
                <div className="space-y-1.5">
                  {bnpbPages.map((p: any) => {
                    const slug = p.slug || "";
                    const href = `https://gis.bnpb.go.id/arcgis/apps/sites/#/public/pages/${slug}`;
                    return (
                      <a
                        key={p.id || slug}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[10px] bg-white rounded-lg px-2 py-1.5 border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="font-bold text-slate-700 truncate">
                          {p.title || slug}
                        </div>
                        <div className="text-[8px] text-slate-400 uppercase tracking-[0.18em]">
                          Halaman BNPB
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : !bnpbPagesLoading ? (
                <p className="text-[9px] text-slate-400 italic">
                  Tidak dapat memuat daftar info BNPB.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-3 border-t bg-slate-50 shrink-0 flex flex-col gap-2">
          <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Banjarnegara</span><span className="text-[9px] font-mono font-bold text-indigo-600 uppercase">{mousePos}</span></div>
          <button onClick={() => window.location.reload()} className="w-full py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2"><i className="fa-solid fa-arrows-to-dot"></i> Reset Center</button>
        </div>
      </aside>

      <main className="flex-1 relative h-full bg-slate-50 flex">
        <div className="flex-1 relative">
          <MapContainer 
            center={[-7.36, 109.68]} 
            zoom={11} 
            minZoom={9} 
            maxBounds={[[-7.7, 109.2], [-7.0, 110.1]]}
            className="h-full w-full" 
            zoomControl={true}
            zoomSnap={0.25} 
            zoomDelta={0.25}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <Controller setPos={setMousePos} />
            {boundary && <FitToBoundary boundary={boundary} />}
            
            {boundary && (
              <GeoJSON
                data={{
                  ...boundary,
                  features: boundary.features.filter(
                    (f: any) => f.geometry?.type?.includes("Polygon")
                  ),
                }}
                interactive={false}
                style={{ color: "#2563eb", weight: 1.5, fillOpacity: 0, dashArray: "5,5" }}
              />
            )}
            
            {selected.map(id => {
              const d = dataCache[id]; const cfg = LAYERS_CONFIG.find(l=>l.id===id);
              if (!d || !cfg) return null;
              return (
                <GeoJSON
                  key={id}
                  data={d}
                  pointToLayer={(f: any, l: any) =>
                    L.circleMarker(l, {
                      radius: 5,
                      fillColor: cfg.color,
                      color: "#fff",
                      weight: 1,
                      fillOpacity: 0.8,
                    })
                  }
                  style={(f: any) => {
                    if (id === "kontur") return getContourStyle(f);
                    if (id === "desa") {
                      const desaFill = "#bfdbfe";
                      return {
                        color: "#2563eb",
                        weight: 1,
                        opacity: 0.9,
                        fillOpacity: 0.25,
                        fillColor: desaFill,
                      };
                    }
                    const isTanah = id === "tanah";
                    const soilColor = isTanah
                      ? f.properties?.MACAM_TANA?.toLowerCase().includes("litosol")
                        ? "#451a03"
                        : "#d97706"
                      : cfg.color;
                    return {
                      color: soilColor,
                      weight: 1.5,
                      opacity: 0.8,
                      fillOpacity: isTanah ? 0.3 : 0.1,
                      fillColor: soilColor,
                    };
                  }}
                  onEachFeature={(f: any, l: any) => {
                    if (f.properties) {
                      l.bindPopup(
                        `<div class="text-xs font-sans"><b>${cfg.name}</b><br/>${
                          f.properties.Nama_Desa_ ||
                          f.properties.name ||
                          f.properties.MACAM_TANA ||
                          f.properties.HEIGHT ||
                          "Data"
                        }</div>`
                      );
                      l.on("click", () => {
                        const title = f.properties.Nama_Desa_ || f.properties.name || cfg.name;
                        openDetails({
                          title: String(title || cfg.name),
                          subtitle: String(cfg.name),
                          source: cfg.cat,
                          properties: f.properties,
                        });
                      });
                    }
                  }}
                />
              );
            })}

          {DISASTER_YEARS.map(year => {
            const dynamicMatches = dynamicMarkers.filter(m => m.category === "bencana" && String(m.year) === year);
            const reportMatches = year === "2026" ? reports : []; 
            const d = dataCache[`bencana-banjarnegara-${year}.geojson`];
            
            const staticLayers = d ? DISASTER_TYPES.map(type => {
              if (!selectedDisasters[`${year}-${type.id}`]) return null;
              return (
                <GeoJSON
                  key={`static-${year}-${type.id}`}
                  data={d}
                  filter={(f: any) => {
                    const val = (
                      f.properties?.["JENIS KEJADIAN"] ||
                      f.properties?.["JENIS_KEJADIAN"] ||
                      f.properties?.["Jenis Kejadian"] ||
                      f.properties?.["Kejadian"] ||
                      f.properties?.["Name"] ||
                      ""
                    ).toLowerCase();
                    return type.keywords.some(k => val.includes(k));
                  }}
                  pointToLayer={(f: any, l: any) =>
                    L.marker(l, { icon: createDisasterIcon(type), zIndexOffset: 1000 })
                  }
                  onEachFeature={(f, l) => {
                    if (!f.properties) return;
                    l.bindPopup(
                      `<div class="text-xs font-sans"><b>${type.label} (${year})</b><br/>${
                        f.properties.Name || f.properties.JENIS_KEJADIAN || "Bencana"
                      }</div>`
                    );
                    l.on("click", () => {
                      const title =
                        f.properties.Name ||
                        f.properties["JENIS KEJADIAN"] ||
                        f.properties["JENIS_KEJADIAN"] ||
                        type.label;
                      openDetails({
                        title: String(title || type.label),
                        subtitle: `${year}`,
                        source: "Riwayat Bencana (Statik)",
                        properties: f.properties,
                      });
                    });
                  }}
                />
              );
            }) : null;

            const dynamicLayers = dynamicMatches.map(m => {
              const typeId = DISASTER_TYPES.find(t => t.label === m.icon || t.keywords.some(k => m.name.toLowerCase().includes(k)))?.id || "longsor";
              const isTypeSelected = !!selectedDisasters[`${year}-${typeId}`];
              if (!isTypeSelected) return null;
              const geom = JSON.parse(m.geometry);
              const config = DISASTER_MAP[m.icon] || DISASTER_MAP["Longsor"];
              if (m.type === "Point") return <Marker key={`dyn-dis-${m.id}`} position={[m.lat, m.lng]} icon={createCategoryIcon(m.color || config.color, config.icon)} eventHandlers={{ click: () => openDetails({ title: m.name, subtitle: `${year}`, source: "Riwayat Bencana Dinamis", properties: m }) }}><Popup><div className="text-xs"><b>{m.name} ({year})</b><br/>{m.description}</div></Popup></Marker>;
              if (m.type === "LineString") return <Polyline key={`dyn-dis-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || config.color} weight={4} eventHandlers={{ click: () => openDetails({ title: m.name, subtitle: `${year}`, source: "Riwayat Bencana Dinamis", properties: m }) }}><Popup><div className="text-xs"><b>{m.name} ({year})</b><br/>{m.description}</div></Popup></Polyline>;
              if (m.type === "Polygon") return <Polygon key={`dyn-dis-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || config.color} fillOpacity={0.4} eventHandlers={{ click: () => openDetails({ title: m.name, subtitle: `${year}`, source: "Riwayat Bencana Dinamis", properties: m }) }}><Popup><div className="text-xs"><b>{m.name} ({year})</b><br/>{m.description}</div></Popup></Polygon>;
              return null;
            });

            const reportLayers = reportMatches.map(r => {
              const typeId = DISASTER_TYPES.find(t => t.label === r.type || r.type.toLowerCase().includes(t.id))?.id || "longsor";
              const isTypeSelected = !!selectedDisasters[`${year}-${typeId}`];
              if (!isTypeSelected) return null;
              const config = DISASTER_MAP[r.type] || DISASTER_MAP["Longsor"];
              return (
                <Marker key={`report-explorer-${r.id}`} position={[r.lat, r.lng]} icon={L.divIcon({ className: "report-marker", html: `<div style="background-color:${config.color};width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fa-solid ${config.icon} text-[8px]"></i></div>`, iconSize: [24, 24], iconAnchor: [12, 12] })} eventHandlers={{ click: () => openDetails({ title: r.type, subtitle: r.village || r.district, source: "Riwayat Bencana Arsip", properties: r }) }}>
                  <Popup><div className="p-1 font-sans"><div className="flex justify-between items-center mb-1"><span className="font-black text-[10px] uppercase text-indigo-900">{r.type}</span><span className={`text-[7px] font-black px-1 py-0.5 rounded ${r.status==='Ditangani'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{r.status}</span></div><p className="text-[9px] text-slate-500 italic">"{r.desc}"</p><p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">{r.village}</p></div></Popup>
                </Marker>
              );
            });

            return <div key={`year-group-${year}`}>{staticLayers}{dynamicLayers}{reportLayers}</div>;
          })}

          {selected.includes("laporan") && reports.map(r => {
            const config = DISASTER_MAP[r.type] || { color: "#6366f1", icon: "fa-triangle-exclamation" };
            return (
              <Marker key={`live-report-${r.id}`} position={[r.lat, r.lng]} icon={createCategoryIcon(config.color, config.icon)} eventHandlers={{ click: () => openDetails({ title: r.type, subtitle: r.village || r.district, source: "Laporan Live", properties: r }) }}>
                <Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">LAPORAN: {r.type}</h4><p className="text-[9px] text-slate-600 mt-1 italic">"{r.desc}"</p><p className="text-[8px] font-black text-indigo-600 mt-2 uppercase">{r.status}</p></div></Popup>
              </Marker>
            );
          })}

          {dynamicMarkers.map(m => {
            if (m.category === "bencana") return null;
            if (!selected.includes(m.category)) return null;
            const cfg = LAYERS_CONFIG.find(l => l.id === m.category);
            const geom = JSON.parse(m.geometry);
            if (m.type === "Point") return <Marker key={`dyn-${m.id}`} position={[m.lat, m.lng]} icon={createCategoryIcon(m.color || cfg?.color || "#6366f1", m.icon || cfg?.icon || "fa-location-dot")} eventHandlers={{ click: () => openDetails({ title: m.name, subtitle: cfg?.name, source: "Layer Dinamis", properties: m }) }}><Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">{m.name}</h4><p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{cfg?.name || 'Titik Lokasi'}</p><p className="text-[9px] text-slate-600 mt-2 italic">"{m.description}"</p></div></Popup></Marker>;
            if (m.type === "LineString") return <Polyline key={`dyn-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || cfg?.color || "#6366f1"} weight={4} eventHandlers={{ click: () => openDetails({ title: m.name, subtitle: cfg?.name, source: "Layer Dinamis", properties: m }) }}><Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">{m.name}</h4><p className="text-[9px] text-slate-600 mt-2 italic">"{m.description}"</p></div></Popup></Polyline>;
            if (m.type === "Polygon") return <Polygon key={`dyn-${m.id}`} positions={geom.coordinates.map((c: any) => [c[1], c[0]])} color={m.color || cfg?.color || "#6366f1"} fillOpacity={0.4} eventHandlers={{ click: () => openDetails({ title: m.name, subtitle: cfg?.name, source: "Layer Dinamis", properties: m }) }}><Popup><div className="p-1 font-sans"><h4 className="font-black uppercase text-[10px] text-indigo-900">{m.name}</h4><p className="text-[9px] text-slate-600 mt-2 italic">"{m.description}"</p></div></Popup></Polygon>;
            return null;
          })}

          <ZoomControl position="topright" />
          <ScaleControl position="bottomright" />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Jalan"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satelit"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
          </LayersControl>
        </MapContainer>
        </div>

        <aside className="w-80 bg-white border-l border-slate-200 shadow-xl z-10 h-full flex flex-col">
          <div className="p-5 border-b bg-slate-900 text-white">
            <h2 className="font-black text-sm uppercase tracking-[0.25em]">
              {selectedFeature ? "Detail Objek" : "Kabupaten Banjarnegara"}
            </h2>
            {selectedFeature ? (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-black uppercase text-indigo-300 truncate">{selectedFeature.title}</p>
                {selectedFeature.subtitle && (
                  <p className="text-[11px] text-slate-200 truncate">{selectedFeature.subtitle}</p>
                )}
                {selectedFeature.source && (
                  <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em]">
                    {selectedFeature.source}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-white/40 flex items-center justify-center">
                  <img
                    src="/logo-banjarnegara.png"
                    alt="Logo Kabupaten Banjarnegara"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black text-white leading-tight">
                    Banjarnegara, Provinsi Jawa Tengah, Indonesia
                  </p>
                  <p className="text-[9px] text-indigo-200 font-semibold tracking-[0.18em] uppercase">
                    Profil singkat 2026
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {selectedFeature ? (
              <>
                {hasLegacyDescription && (
                  <div className="space-y-3">
                    {disasterImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {disasterImages.map((src: string, idx: number) => (
                          <img
                            key={`${src}-${idx}`}
                            src={src}
                            className="w-full h-24 object-cover rounded-xl border border-slate-200 bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.classList.add("hidden");
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {parsedLegacy?.chronology && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                          Kronologi Kejadian
                        </p>
                        <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                          {parsedLegacy.chronology}
                        </p>
                      </div>
                    )}

                    {parsedLegacy?.impact && (
                      <div className="bg-red-50 rounded-2xl border border-red-200 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600">
                          Dampak Bangunan & Fisik
                        </p>
                        <p className="text-[11px] text-red-900 leading-relaxed whitespace-pre-line font-semibold">
                          {parsedLegacy.impact}
                        </p>
                      </div>
                    )}

                    {parsedLegacy?.handling && (
                      <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                          Penanganan
                        </p>
                        <p className="text-[11px] text-emerald-900 leading-relaxed whitespace-pre-line font-semibold">
                          {parsedLegacy.handling}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 border-t border-slate-200 pt-3 mt-2">
                  {Object.entries(selectedFeature.properties || {}).map(([key, value]) => {
                    if (value === null || typeof value === "undefined" || key === "geometry") return null;
                    if (key === "gx_media_links") return null;
                    if (hasLegacyDescription && key === "description") return null;
                    if (hasLegacyDescription && shouldHideLegacyKey(key)) return null;
                    const displayValue =
                      typeof value === "object" ? JSON.stringify(value) : String(value);
                    const isHTMLLike =
                      typeof value === "string" &&
                      /<\/?[a-z][\s\S]*>/i.test(value);
                    return (
                      <div
                        key={key}
                        className="px-2 py-1 rounded-lg hover:bg-slate-50"
                      >
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">
                          {key}
                        </p>
                        <div className="text-[11px] text-slate-800 break-words">
                          {isHTMLLike ? (
                            <div
                              className="leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: cleanHTML(displayValue) }}
                            />
                          ) : (
                            displayValue
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col gap-3">
                <div className="bg-slate-900/5 border border-slate-200 rounded-2xl p-3 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Posisi Administratif
                  </p>
                  <p className="text-[11px] text-slate-800 leading-relaxed">
                    Banjarnegara adalah kabupaten di Provinsi Jawa Tengah yang beribu kota di
                    Kota Banjarnegara dan dikenal sebagai gerbang menuju Dataran Tinggi Dieng.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                      Luas & Penduduk
                    </p>
                    <p className="text-[11px] text-slate-800 leading-snug">
                      Wilayah pegunungan dengan ratusan desa, mayoritas penduduk bekerja di
                      sektor pertanian, perkebunan, dan usaha kecil.
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
                      Lanskap & Iklim
                    </p>
                    <p className="text-[11px] text-slate-800 leading-snug">
                      Topografi berbukit hingga bergunung dengan curah hujan tinggi, membuat
                      wilayah ini sejuk namun rawan gerakan tanah.
                    </p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-2.5 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-600">
                    Risiko Bencana 2026
                  </p>
                  <p className="text-[11px] text-slate-900 leading-snug">
                    Banjarnegara termasuk zona rawan longsor dan banjir bandang. Sistem ini
                    membantu memantau laporan warga, arsip kejadian, dan analisis spasial
                    untuk mendukung pengambilan keputusan.
                  </p>
                </div>
                <div className="mt-1 bg-white border border-slate-200 rounded-2xl p-2.5 space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Platform & Sumber Data
                  </p>
                  <div className="grid grid-cols-4 gap-2 w-full">
                    <div className="flex items-center justify-center">
                      <a
                        href="https://orion.clasnet.co.id"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full"
                      >
                        <img
                          src="/orion-dark.jpg"
                          alt="Orion"
                          className="h-7 w-full object-contain"
                          onError={(e) => e.currentTarget.classList.add("hidden")}
                        />
                      </a>
                    </div>
                    <div className="flex items-center justify-center">
                      <a
                        href="https://www.bmkg.go.id/"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full"
                      >
                        <img
                          src="/bmkg.jpg"
                          alt="BMKG"
                          className="h-7 w-full object-contain"
                          onError={(e) => e.currentTarget.classList.add("hidden")}
                        />
                      </a>
                    </div>
                    <div className="flex items-center justify-center">
                      <a
                        href="https://bpbd.banjarnegarakab.go.id/"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full"
                      >
                        <img
                          src="/bnpb.png"
                          alt="BPBD Banjarnegara"
                          className="h-7 w-full object-contain"
                          onError={(e) => e.currentTarget.classList.add("hidden")}
                        />
                      </a>
                    </div>
                    <div className="flex items-center justify-center">
                      <a
                        href="https://www.esri.com/en-us/home"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full"
                      >
                        <img
                          src="/esri.jpg"
                          alt="Esri"
                          className="h-7 w-full object-contain"
                          onError={(e) => e.currentTarget.classList.add("hidden")}
                        />
                      </a>
                    </div>
                    <div className="flex items-center justify-center">
                      <a
                        href="https://www.openstreetmap.org/"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full"
                      >
                        <img
                          src="/osm.ong"
                          alt="OpenStreetMap"
                          className="h-7 w-full object-contain"
                          onError={(e) => e.currentTarget.classList.add("hidden")}
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
