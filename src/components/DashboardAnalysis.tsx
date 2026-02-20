"use client";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, ScaleControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";

const TOOLS = [
  { id: "stats", title: "Profil Risiko Desa", icon: "fa-chart-pie", desc: "Klik desa untuk detail statistik.", risk: "Statistik Mikro" },
  { id: "hotspot", title: "Hotspot Bencana", icon: "fa-fire", desc: "Zona merah historis 2021-2024.", risk: "Akumulasi Kejadian" },
  { id: "risk", title: "Risiko Kawasan", icon: "fa-shield-virus", desc: "Analisis Sungai + Tanah.", risk: "Kerentanan Fisik" },
  { id: "infra", title: "Kerentanan Jalan", icon: "fa-road", desc: "Jalan di zona bahaya.", risk: "Isolasi Akses" }
];

export default function DashboardAnalysis() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [results, setResults] = useState<any[] | null>(null);
  const [roadRisk, setRoadRisk] = useState<any[] | null>(null);
  const [villageStats, setVillageStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);

  useEffect(() => {
    const files = ["peta_desa.geojson", "sungai.geojson", "tanah-jateng.geojson", "jalan.geojson", "bencana-banjarnegara-2024.geojson", "bencana-banjarnegara-2023.geojson", "bencana-banjarnegara-2022.geojson", "bencana-banjarnegara-2021.geojson"];
    files.forEach(f => {
      if(!data[f]) fetch("/sungai/data/"+f).then(r=>r.json()).then(d=>setData(p=>({...p, [f]:d}))).catch(()=>{});
    });
  }, []);

  const runAnalysis = async (toolId: string) => {
    setLoading(true); setProgress(0); stopRef.current = false;
    const vGeo = data["peta_desa.geojson"];
    if (!vGeo) return;

    if (toolId === "hotspot") {
      let pts: any[] = []; 
      ["2024","2023","2022","2021"].forEach((y: any) => { if(data[`bencana-banjarnegara-${y}.geojson`]) pts.push(...data[`bencana-banjarnegara-${y}.geojson`].features); });
      const coll = turf.featureCollection(pts);
      let res: any[] = [];
      for(let i=0; i<vGeo.features.length; i++) {
        if(stopRef.current) break;
        res.push({ id: vGeo.features[i].properties.OBJECTID, val: turf.pointsWithinPolygon(coll as any, vGeo.features[i]).features.length });
        if(i%20===0) { setProgress(Math.round((i/vGeo.features.length)*100)); await new Promise(r=>setTimeout(r,5)); }
      }
      if(!stopRef.current) setResults(res);
    } 
    else if (toolId === "risk") {
      const rivers = data["sungai.geojson"];
      const buff = turf.buffer(turf.simplify(rivers, {tolerance:0.002}), 0.15, {units:'kilometers'});
      let res: any[] = [];
      for(let i=0; i<vGeo.features.length; i++) {
        if(stopRef.current) break;
        let s = 0; try { if(turf.booleanIntersects(vGeo.features[i] as any, buff as any)) s += 50; } catch(e){}
        res.push({ id: vGeo.features[i].properties.OBJECTID, val: s });
        if(i%20===0) { setProgress(Math.round((i/vGeo.features.length)*100)); await new Promise(r=>setTimeout(r,5)); }
      }
      if(!stopRef.current) setResults(res);
    }
    else if (toolId === "infra") {
      const roads = data["jalan.geojson"]; 
      const buff = turf.buffer(turf.simplify(data["sungai.geojson"], {tolerance:0.002}), 0.1, {units:'kilometers'});
      let rRes: any[] = [];
      for(let i=0; i<roads.features.length; i++) {
        if(stopRef.current) break;
        let risk = 0; try { if(turf.booleanIntersects(roads.features[i] as any, buff as any)) risk = 1; } catch(e){}
        rRes.push({ id: i, atRisk: risk === 1 });
        if(i%50===0) { setProgress(Math.round((i/roads.features.length)*100)); await new Promise(r=>setTimeout(r,5)); }
      }
      if(!stopRef.current) setRoadRisk(rRes);
    }
    setLoading(false); setProgress(0);
  };

  const handleVillageClick = (f: any) => {
    let ls = 0;
    ["2024","2023","2022","2021"].forEach((y: any) => {
      const d = data[`bencana-banjarnegara-${y}.geojson`];
      if(d) ls += d.features.filter((p: any) => turf.booleanPointInPolygon(p, f)).length;
    });
    const soil = data["tanah-jateng.geojson"]?.features?.find((s: any) => turf.booleanPointInPolygon(turf.centroid(f), s));
    setVillageStats({ name: f.properties.Nama_Desa_, landslides: ls, soil: soil?.properties?.MACAM_TANA || "N/A" });
  };

  return (
    <div className="flex h-full w-full">
      <aside className="w-80 bg-white border-r p-5 shadow-xl z-20 flex flex-col gap-4 overflow-y-auto">
        <div><h2 className="font-black text-red-900 text-lg">ORION ANALYTICS</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Suite</p></div>
        {!activeTool ? (
          <div className="flex flex-col gap-2">
            {TOOLS.map(t => (
              <button key={t.id} onClick={()=>{setActiveTool(t.id); setResults(null); setRoadRisk(null);}} className="text-left p-3 border rounded-xl hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-2 font-black text-xs uppercase text-slate-700 group-hover:text-red-600"><i className={`fa-solid ${t.icon}`}></i> {t.title}</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div className="flex justify-between border-b pb-2"><h3 className="font-black text-red-900 uppercase text-xs">{(TOOLS.find((t: any)=>t.id===activeTool) as any).title}</h3><button onClick={()=>{setActiveTool(null); setResults(null); setRoadRisk(null); setVillageStats(null);}} className="text-[9px] font-bold text-slate-400 uppercase">Tutup</button></div>
            
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><h5 className="text-[9px] font-black text-slate-500 uppercase mb-1 underline">Keterangan</h5><p className="text-[10px] text-slate-600 italic">{(TOOLS.find((t: any)=>t.id===activeTool) as any).desc}</p></div>

            {activeTool === "stats" && villageStats && (
              <div className="p-4 bg-red-900 text-white rounded-xl shadow-lg space-y-2 animate-in zoom-in-95">
                <h4 className="font-black uppercase border-b border-red-800 pb-1">Desa {villageStats.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white/10 p-2 rounded"><p className="text-[8px] opacity-70">Longsor (4th)</p><p className="font-black text-lg">{villageStats.landslides}</p></div>
                  <div className="bg-white/10 p-2 rounded"><p className="text-[8px] opacity-70">Tanah</p><p className="font-black text-[9px]">{villageStats.soil}</p></div>
                </div>
              </div>
            )}

            {activeTool !== "stats" && !results && !roadRisk && (
              <button onClick={()=>runAnalysis(activeTool)} disabled={loading} className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] shadow-lg">{loading ? `PROSES ${progress}%` : "JALANKAN ANALISIS"}</button>
            )}
            
            {loading && <button onClick={()=>{stopRef.current=true; setLoading(false);}} className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px]">STOP</button>}
            
            {(results || roadRisk) && <div className="p-3 bg-white border-2 border-red-100 rounded-xl shadow-md"><h5 className="text-[10px] font-black text-center mb-2">Hasil Analisis</h5><div className="flex items-center gap-2 mb-2 font-bold text-[9px]"><span className="w-3 h-3 rounded-full bg-red-600"></span> Zona Rawan / Tinggi</div><button onClick={()=>{setResults(null); setRoadRisk(null);}} className="w-full py-1.5 border rounded text-[9px] font-black text-slate-400 uppercase">Reset</button></div>}
          </div>
        )}
      </aside>
      <main className="flex-1 relative bg-slate-50">
        <MapContainer center={[-7.36, 109.68]} zoom={11} minZoom={9} className="h-full w-full" zoomControl={false} zoomSnap={0.25} zoomDelta={0.25}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {data["peta_desa.geojson"] && (
            <GeoJSON key={"desa-"+activeTool+(results?"-an":"")} data={data["peta_desa.geojson"]} 
              style={(f: any) => {
                if (results) {
                  const r = results.find((x: any) => x.id === f.properties.OBJECTID);
                  return { fillColor: (r?.val > 5 || r?.val >= 50) ? "#dc2626" : "#10b981", fillOpacity: 0.6, color: "#fff", weight: 1 };
                }
                const isSel = villageStats?.name === f.properties.Nama_Desa_;
                return { color: isSel?"#ef4444":"#333", weight: isSel?3:1, fillOpacity: isSel?0.3:0.05, fillColor: isSel?"#ef4444":"#fff" };
              }}
              onEachFeature={(f,l) => l.on('click', () => { if(activeTool==="stats") handleVillageClick(f); })} 
            />
          )}
          {roadRisk && data["jalan.geojson"] && <GeoJSON key="an-infra" data={data["jalan.geojson"]} style={(f: any) => { const i = data["jalan.geojson"].features.indexOf(f); return { color: roadRisk?.[i]?.atRisk ? "#dc2626" : "#f59e0b", weight: roadRisk?.[i]?.atRisk?4:1, opacity: roadRisk?.[i]?.atRisk?1:0.2 }; }} />}
        </MapContainer>
      </main>
    </div>
  );
}
