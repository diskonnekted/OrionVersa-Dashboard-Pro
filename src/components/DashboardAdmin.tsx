"use client";
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ShieldCheck, Phone, Home, Users, CheckCircle2, Trash2, RefreshCcw } from "lucide-react";

export default function DashboardAdmin() {
  const [reports, setReports] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [villageGeo, setVillageGeo] = useState(null);
  const [pulse, setPulse] = useState(true);

  const loadReports = useCallback(() => {
    const data = JSON.parse(localStorage.getItem("orion_reports") || "[]");
    setReports(data.map((r: any) => ({ 
      ...r, 
      verif: r.verif || { reporter: false, village: false, residents: false },
      status: r.status || 'Diterima'
    })));
  }, []);

  useEffect(() => {
    fetch("/sungai/data/peta_desa.geojson").then(r=>r.json()).then(d=>setVillageGeo(d));
    loadReports();
    
    // Sinkronisasi otomatis antar tab
    window.addEventListener("storage", loadReports);
    
    // Interval untuk efek kedip
    const interval = setInterval(() => setPulse(p => !p), 800);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", loadReports);
    };
  }, [loadReports]);

  const updateVerif = (reportId: any, field: any) => {
    const updated = reports.map(r => {
      if (r.id === reportId) {
        const newVerif = { ...r.verif, [field]: !r.verif[field] };
        return { ...r, verif: newVerif, status: 'Proses Validasi' };
      }
      return r;
    });
    saveAndSync(updated, reportId);
  };

  const markAsValid = (reportId: any) => {
    const updated = reports.map(r => r.id === reportId ? { ...r, status: 'Ditangani', isValidated: true } : r);
    saveAndSync(updated, reportId);
  };

  const deleteReport = (reportId: any) => {
    if(!confirm("Hapus laporan ini?")) return;
    const filtered = reports.filter((r: any) => r.id !== reportId);
    setReports(filtered);
    localStorage.setItem("orion_reports", JSON.stringify(filtered));
    setSelected(null);
  };

  const saveAndSync = (newList: any, currentId: any) => {
    setReports(newList);
    localStorage.setItem("orion_reports", JSON.stringify(newList));
    if (currentId) setSelected(newList.find((r: any) => r.id === currentId));
  };

  const getIcon = (r: any) => L.divIcon({
    className: "admin-icon",
    html: `<div style="background-color:${r.status==='Ditangani'?'#10b981':(r.status==='Proses Validasi'?'#f59e0b':'#ef4444')};width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><i class="fa-solid ${r.status==='Ditangani'?'fa-check':'fa-triangle-exclamation'}"></i></div>`,
    iconSize: [24,24], iconAnchor: [12,12]
  });

  return (
    <div className="flex h-full w-full bg-slate-100 font-sans overflow-hidden">
      <aside className="w-[400px] bg-white border-r p-5 flex flex-col gap-4 shadow-xl z-20">
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h2 className="font-black text-slate-800 text-lg uppercase leading-none">ADMIN PANEL</h2>
            <p className="text-[9px] text-indigo-600 font-bold uppercase mt-1 tracking-widest">Reports Manager</p>
          </div>
          <button onClick={loadReports} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors" title="Refresh Data">
            <RefreshCcw className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
          {reports.length === 0 ? (
            <div className="text-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 opacity-40 italic font-black text-[10px] uppercase">
              No Data Found<br/>Send report via /report page
            </div>
          ) : (
            reports.sort((a: any, b: any) => b.id - a.id).map((r: any) => (
              <div key={r.id} onClick={()=>setSelected(r)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?.id===r.id?'border-indigo-500 bg-indigo-50 shadow-md':'border-slate-50 hover:bg-slate-50'} ${!r.isValidated && pulse ? 'border-red-400 bg-red-50/30' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-[10px] text-slate-700 uppercase">{r.type}</span>
                  <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${r.status==='Ditangani'?'bg-green-100 text-green-600':(r.status==='Proses Validasi'?'bg-amber-100 text-amber-600':'bg-red-100 text-red-600')}`}>
                    {r.status || 'Diterima'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500">{r.village}, {r.district}</p>
              </div>
            ))
          )}
        </div>

        {selected && (
          <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-4 animate-in slide-in-from-bottom-4 shadow-2xl shrink-0 overflow-y-auto max-h-[60%]">
            <div className="relative group">
              <img src={selected.photo} className="w-full h-32 object-cover rounded-xl border border-white/10" />
              <button onClick={()=>deleteReport(selected.id)} className="absolute top-2 right-2 p-2 bg-red-600/80 rounded-lg hover:bg-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black opacity-50 uppercase tracking-widest">Detail Pelapor: {selected.name} ({selected.phone})</p>
              <p className="text-[10px] font-bold leading-tight text-indigo-300">{selected.address}</p>
              <p className="text-[10px] italic opacity-80 leading-relaxed mt-1">"{selected.desc}"</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-3">
              <p className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protokol Validasi:</p>
              <div className="space-y-2">
                {['reporter', 'village', 'residents'].map(f => (
                  <label key={f} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 border border-transparent has-[:checked]:border-indigo-500">
                    <input type="checkbox" checked={selected.verif?.[f]} onChange={()=>updateVerif(selected.id, f)} className="w-3 h-3 rounded bg-transparent border-white/20 text-indigo-500" />
                    <div className="flex-1"><p className="text-[9px] font-black uppercase leading-none">{f==='reporter'?'Hubungi Pelapor':(f==='village'?'Verif Perangkat Desa':'Verif Warga Sekitar')}</p></div>
                  </label>
                ))}
              </div>
            </div>
            {selected.status !== 'Ditangani' ? (
              <button onClick={() => markAsValid(selected.id)} className={`w-full py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg ${selected.verif?.reporter && selected.verif?.village ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}><CheckCircle2 className="w-4 h-4" /> Nyatakan Informasi Valid</button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 font-black uppercase text-[10px]"><ShieldCheck className="w-4 h-4" /> Informasi Terverifikasi Valid</div>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 relative h-full">
        <MapContainer center={[-7.36, 109.68]} zoom={11} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {villageGeo && (
            <GeoJSON 
              key={"admin-village"+pulse}
              data={villageGeo} 
              style={(f: any) => {
                const hasReport = reports.some(r => r.village === f.properties.Nama_Desa_ && !r.isValidated);
                const isSelected = selected?.village === f.properties.Nama_Desa_;
                if (hasReport) return { fillColor: pulse ? "#ef4444" : "#fee2e2", fillOpacity: 0.6, color: "#ef4444", weight: 2 };
                return { color: "#64748b", weight: 1, fillOpacity: isSelected ? 0.2 : 0.05, fillColor: isSelected ? "#4f46e5" : "#fff" };
              }}
            />
          )}

          {reports.map((r: any) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={getIcon(r)} eventHandlers={{ click: () => setSelected(r) }}>
              <Popup><div className="text-[10px] font-black uppercase">{r.type} - {r.village}</div></Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
