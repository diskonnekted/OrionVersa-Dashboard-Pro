"use client";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, ScaleControl, Marker, Popup, Polyline, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";
import { 
  Loader2, BrainCircuit, ShieldAlert, MapPin, Zap, AlertTriangle, 
  Activity, Milestone, Navigation, Flame, Globe, Building2,
  TrendingUp, Mountain, Map as MapIcon, Droplets, Ruler
} from "lucide-react";

const TOOLS = [
  { id: "stats", title: "Profil Risiko Desa", icon: "fa-chart-pie", desc: "Statistik bencana & kerentanan per desa.", type: "Micro Analysis" },
  { id: "infra_vulnerability", title: "Kerentanan Infrastruktur", icon: "fa-road-barrier", desc: "Cek jalan & gedung di zona bahaya.", type: "Intersection" },
  { id: "landslide_risk", title: "Risiko Longsor (NASA)", icon: "fa-hill-rockslide", desc: "Katalog NASA + Hujan + Tanah.", type: "Multi-Source" },
  { id: "hotspot", title: "Hotspot Bencana", icon: "fa-fire", desc: "Zona merah akumulasi kejadian.", type: "Density" },
  { id: "slope_vulnerability", title: "Analisis Lereng Terjal", icon: "fa-mountain-sun", desc: "Deteksi pemukiman di lereng > 40°.", type: "Topography" },
  { id: "nasa_fire", title: "Satelit Hotspot", icon: "fa-satellite", desc: "Titik panas thermal (NASA FIRMS).", type: "Satellite" },
  { id: "weather_risk", title: "Prediksi Cuaca", icon: "fa-cloud-showers-heavy", desc: "Analisis curah hujan 7 hari.", type: "Open-Meteo" },
  { id: "earthquake", title: "Gempa Terkini", icon: "fa-house-crack", desc: "Pantauan gempa terbaru (BMKG).", type: "BMKG API" }
];

const DISASTER_MAP: Record<string, { color: string, icon: string }> = {
  "Longsor": { color: "#a855f7", icon: "fa-hill-rockslide" },
  "Banjir": { color: "#3b82f6", icon: "fa-house-flood-water" },
  "Kebakaran": { color: "#ef4444", icon: "fa-fire" },
  "Angin Kencang": { color: "#06b6d4", icon: "fa-wind" },
  "Gempa Bumi": { color: "#f59e0b", icon: "fa-house-crack" }
};

export default function DashboardAnalysis() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [vulnerableRoads, setVulnerableRoads] = useState<any | null>(null);
  const [vulnerableBuildings, setVulnerableBuildings] = useState<any | null>(null);
  const [steepSlopeBuildings, setSteepSlopeBuildings] = useState<any | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [ewsRecommendations, setEwsRecommendations] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [quakeData, setQuakeData] = useState<any>(null);
  const [gdacsData, setGdacsData] = useState<any[]>([]);
  const [nasaData, setNasaData] = useState<any[]>([]);
  const [nasaLandslides, setNasaLandslides] = useState<any[]>([]);
  const [rainRisk, setRainRisk] = useState<any | null>(null);
  const [villageStats, setVillageStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);

  useEffect(() => {
    const files = ["peta_desa.geojson", "sungai.geojson", "tanah-jateng.geojson", "jalan.geojson", "buildings_banjarnegara.geojson", "kontur-banjarnegara.geojson", "bencana-banjarnegara-2024.geojson", "bencana-banjarnegara-2023.geojson", "bencana-banjarnegara-2022.geojson", "bencana-banjarnegara-2021.geojson"];
    files.forEach(f => {
      if(!data[f]) fetch("/sungai/data/"+f).then(r=>r.json()).then(d=>setData(p=>({...p, [f]:d}))).catch(()=>{});
    });
    fetch("/sungai/api/locations").then(r=>r.json()).then(d=>setData(p=>({...p, "dynamic": d})));
  }, []);

  const handleVillageClick = async (feature: any) => {
    setLoading(true); setProgress(10);
    let lsCount = 0;
    ["2024","2023","2022","2021"].forEach(y => {
      const d = data[`bencana-banjarnegara-${y}.geojson`];
      if(d) lsCount += d.features.filter((p: any) => turf.booleanPointInPolygon(p, feature)).length;
    });
    setProgress(40);
    const centroid = turf.centroid(feature);
    const soil = data["tanah-jateng.geojson"]?.features?.find((s: any) => turf.booleanPointInPolygon(centroid, s));
    setProgress(60);
    let riverPercent = 0;
    try {
      const rivers = data["sungai.geojson"];
      if(rivers) {
        const simplifiedRivers = turf.simplify(rivers, {tolerance: 0.005});
        const riverBuffer = turf.buffer(simplifiedRivers, 0.1, {units: 'kilometers'});
        const intersection = turf.intersect(turf.featureCollection([feature, riverBuffer] as any));
        if (intersection) {
          const villageArea = turf.area(feature);
          const intersectArea = turf.area(intersection);
          riverPercent = Math.round((intersectArea / villageArea) * 100);
        }
      }
    } catch(e) {}
    setProgress(100);
    setVillageStats({ name: feature.properties.Nama_Desa_ || "N/A", landslides: lsCount, soil: soil?.properties?.MACAM_TANA || "N/A", riverRisk: riverPercent, district: feature.properties.Kecamatan || "Banjarnegara" });
    setTimeout(() => setLoading(false), 500);
  };

  const runAnalysis = async (toolId: string) => {
    setLoading(true); setProgress(0); stopRef.current = false;
    let allDisasters: any[] = [];
    ["2024","2023","2022","2021"].forEach(y => { if(data[`bencana-banjarnegara-${y}.geojson`]) allDisasters.push(...data[`bencana-banjarnegara-${y}.geojson`].features); });
    const disasterPoints = turf.featureCollection(allDisasters.filter(f => f.geometry.type === "Point"));

    if (toolId === "hotspot") {
      const vGeo = data["peta_desa.geojson"];
      const coll = turf.featureCollection(allDisasters);
      let res: any[] = [];
      for(let i=0; i<vGeo.features.length; i++) {
        if(stopRef.current) break;
        const count = turf.pointsWithinPolygon(coll as any, vGeo.features[i]).features.length;
        res.push({ id: vGeo.features[i].properties.OBJECTID, val: count });
        if(i%20===0) setProgress(Math.round((i/vGeo.features.length)*100));
        await new Promise(r=>setTimeout(r,5));
      }
      setResults(res);
    }
    else if (toolId === "infra_vulnerability") {
      const roads = data["jalan.geojson"];
      const buildings = data["buildings_banjarnegara.geojson"];
      const rivers = data["sungai.geojson"];
      if(!roads || !buildings || !rivers) return alert("Data belum lengkap.");
      const riverBuffer = turf.buffer(turf.simplify(rivers, {tolerance:0.005}), 0.1, {units:'kilometers'});
      const dangerZone = turf.buffer(disasterPoints, 0.1, {units:'kilometers'});
      const totalZone = turf.union(turf.featureCollection([riverBuffer, dangerZone] as any));
      const atRiskRoads = roads.features.filter((r:any, i:number) => {
        if(i%100===0) setProgress(Math.round((i/roads.features.length)*100));
        return turf.booleanIntersects(r, totalZone as any);
      });
      setVulnerableRoads(turf.featureCollection(atRiskRoads));
      const atRiskBuildings = buildings.features.slice(0, 300).filter((b:any) => turf.booleanIntersects(b, totalZone as any));
      setVulnerableBuildings(turf.featureCollection(atRiskBuildings));
    }
    else if (toolId === "landslide_risk") {
      try {
        const nasaRes = await fetch("/sungai/api/proxy/external?service=nasa_landslide");
        const nasaJson = await nasaRes.json();
        setNasaLandslides(nasaJson);
        const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-7.36&longitude=109.68&daily=rain_sum&timezone=auto");
        const weatherJson = await weatherRes.json();
        const maxRain = Math.max(...weatherJson.daily.rain_sum);
        setRainRisk({ rain: maxRain, status: maxRain > 50 ? "BAHAYA" : (maxRain > 20 ? "WASPADA" : "AMAN"), color: maxRain > 50 ? "#ef4444" : (maxRain > 20 ? "#f59e0b" : "#10b981") });
        setProgress(100);
      } catch (e) { alert("Error API"); }
    }
    else if (toolId === "nasa_fire") {
      const res = await fetch("/sungai/api/proxy/external?service=nasa");
      setNasaData(await res.json()); setProgress(100);
    }
    else if (toolId === "earthquake") {
      const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
      const json = await res.json(); setQuakeData(json.Infogempa.gempa); setProgress(100);
    }
    else if (toolId === "weather_risk") {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-7.36&longitude=109.68&daily=rain_sum,precipitation_probability_max&timezone=auto");
      const json = await res.json(); setWeatherData(json.daily); setProgress(100);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex h-full w-full absolute inset-0 bg-slate-50 font-sans overflow-hidden">
      <aside className="w-80 bg-white border-r flex flex-col shadow-2xl z-20 h-full overflow-hidden">
        <div className="p-6 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-5 h-5 text-red-500" />
            <h2 className="font-black text-lg tracking-tighter uppercase font-mono">Analytics</h2>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Intelligence Suite</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3 scrollbar-thin">
          {!activeTool ? (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Pilih Instrumen</h4>
              {TOOLS.map(t => (
                <button key={t.id} onClick={()=>{setActiveTool(t.id); setResults(null); setVulnerableRoads(null); setVillageStats(null); setNasaData([]); setNasaLandslides([]); setRainRisk(null); setWeatherData(null); setQuakeData(null);}} className="w-full text-left p-4 border-2 border-slate-50 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group">
                  <div className="flex items-center gap-3 font-black text-xs uppercase text-slate-700 group-hover:text-red-700">
                    <i className={`fa-solid ${t.icon} text-lg w-6 text-center`}></i> 
                    <div><p className="leading-none">{t.title}</p><span className="text-[7px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full mt-1 inline-block font-bold">{t.type}</span></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-right-4 pb-10">
              <button onClick={()=>{setActiveTool(null); setVillageStats(null); setResults(null); setVulnerableRoads(null); setVulnerableBuildings(null); setSteepSlopeBuildings(null); setWeatherData(null); setQuakeData(null); setNasaData([]); setNasaLandslides([]); setRainRisk(null);}} className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 hover:text-red-600 transition-colors">← Kembali ke Menu</button>
              
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <h3 className="font-black text-red-900 uppercase text-xs mb-1">{(TOOLS.find((t: any)=>t.id===activeTool) as any).title}</h3>
                <p className="text-[10px] text-red-700 italic">{(TOOLS.find((t: any)=>t.id===activeTool) as any).desc}</p>
              </div>

              {activeTool === "stats" && villageStats && (
                <div className="space-y-4 animate-in zoom-in-95">
                  <div className="p-5 bg-slate-900 text-white rounded-2xl border-t-4 border-red-500 shadow-xl space-y-4">
                    <div className="flex justify-between items-start border-b border-white/10 pb-3"><div><h4 className="font-black uppercase text-sm leading-tight">Desa {villageStats.name}</h4><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{villageStats.district}</p></div><ShieldAlert className="w-5 h-5 text-red-500" /></div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white/5 p-3 rounded-xl flex items-center gap-4"><div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500 font-black">{villageStats.landslides}</div><div><p className="text-[8px] opacity-50 uppercase font-black">Bencana</p><p className="text-[10px] font-bold">Terdata historis</p></div></div>
                      <div className="bg-white/5 p-3 rounded-xl flex items-center gap-4"><div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500"><Droplets className="w-5 h-5" /></div><div><p className="text-[8px] opacity-50 uppercase font-black">Risiko Bantaran</p><p className="text-sm font-black text-blue-400">{villageStats.riverRisk}% Wilayah</p></div></div>
                      <div className="bg-white/5 p-3 rounded-xl flex items-center gap-4"><div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500"><MapIcon className="w-5 h-5" /></div><div><p className="text-[8px] opacity-50 uppercase font-black">Tanah</p><p className="text-[10px] font-bold leading-tight">{villageStats.soil}</p></div></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === "landslide_risk" && rainRisk && (
                <div className="p-4 rounded-2xl text-white space-y-2 shadow-lg" style={{backgroundColor: rainRisk.color}}>
                  <p className="text-2xl font-black">{rainRisk.status}</p>
                  <p className="text-[10px] font-bold">Curah Hujan Maks: {rainRisk.rain}mm</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-red-600" /><span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Analisis Berjalan</span></div><span className="text-[10px] font-black text-red-600">{progress}%</span></div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-red-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div></div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase text-center italic">Mohon tunggu, memproses spasial...</p>
                  <button onClick={()=>{stopRef.current=true; setLoading(false);}} className="mt-2 w-full py-2 border-2 border-slate-200 text-slate-400 hover:text-red-600 rounded-xl font-black text-[9px] uppercase">Batalkan</button>
                </div>
              )}

              {!loading && !results && !vulnerableRoads && !steepSlopeBuildings && !weatherData && !quakeData && ewsRecommendations.length === 0 && nasaData.length === 0 && nasaLandslides.length === 0 && (
                <button onClick={()=>runAnalysis(activeTool)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-red-700 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Zap className="w-4 h-4" /> Jalankan Analisis
                </button>
              )}

              {(results || vulnerableRoads || weatherData || quakeData || ewsRecommendations.length > 0) && (
                <div className="p-4 bg-green-50 border-2 border-green-100 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-black text-[10px] uppercase mb-3"><ShieldAlert className="w-4 h-4" /> Hasil Tersaji</div>
                  <button onClick={()=>{setResults(null); setVulnerableRoads(null); setVulnerableBuildings(null); setSteepSlopeBuildings(null); setWeatherData(null); setQuakeData(null); setEwsRecommendations([]); setNasaData([]); setNasaLandslides([]); setRainRisk(null);}} className="w-full py-2 bg-white border border-green-200 rounded-xl text-[9px] font-black text-green-600 uppercase hover:bg-green-100 transition-all">Bersihkan Hasil</button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 relative bg-slate-100">
        <MapContainer center={[-7.36, 109.68]} zoom={11} maxBounds={[[-7.7, 109.2], [-7.0, 110.1]]} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" /><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {data["peta_desa.geojson"] && (
            <GeoJSON data={data["peta_desa.geojson"]} 
              style={(f: any) => {
                if (results) {
                  const r = results.find((x: any) => x.id === f.properties.OBJECTID);
                  const color = r?.val > 10 ? "#7f1d1d" : (r?.val > 5 ? "#dc2626" : (r?.val > 0 ? "#f87171" : "#10b981"));
                  return { fillColor: color, fillOpacity: 0.6, color: "#fff", weight: 0.5 };
                }
                const isSel = villageStats?.name === f.properties.Nama_Desa_;
                return { color: isSel?"#ef4444":"#64748b", weight: isSel?3:1, fillOpacity: isSel?0.3:0.05, fillColor: isSel?"#ef4444":"#fff" };
              }}
              onEachFeature={(f,l) => l.on('click', () => { if(activeTool==="stats") handleVillageClick(f); })} 
            />
          )}

          {vulnerableRoads && <GeoJSON data={vulnerableRoads} style={{ color: "#ef4444", weight: 5 }} />}
          {Array.isArray(nasaLandslides) && nasaLandslides.map((l, i) => (<Marker key={`land-${i}`} position={[parseFloat(l.latitude), parseFloat(l.longitude)]} icon={L.divIcon({html:'<div class="bg-purple-600 w-3 h-3 rounded-full border border-white"></div>', className:'nasa-dot'})} />))}
          {Array.isArray(nasaData) && nasaData.map((n, i) => (<Circle key={`fire-${i}`} center={[n.lat, n.lng]} radius={500} pathOptions={{color:'red', fillColor:'red', fillOpacity:0.5}} />))}
        </MapContainer>
      </main>
    </div>
  );
}
