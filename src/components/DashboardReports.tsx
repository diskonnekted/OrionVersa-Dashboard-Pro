"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function DashboardReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("orion_reports") || "[]");
    setReports(data);
  }, []);

  const getIcon = (r) => {
    const color = r.status === 'Ditangani' ? '#10b981' : (r.status === 'Proses Validasi' ? '#f59e0b' : '#6366f1');
    return L.divIcon({
      className: "report-icon",
      html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 5px rgba(0,0,0,0.2);"><i class="fa-solid fa-triangle-exclamation"></i></div>`,
      iconSize: [24,24], iconAnchor: [12,12]
    });
  };

  return (
    <div className="flex h-full w-full bg-slate-50 font-sans">
      <aside className="w-80 bg-white border-r p-5 flex flex-col gap-4 shadow-xl z-20">
        <div>
          <h2 className="font-black text-indigo-900 text-lg uppercase leading-none">Public Reports</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Informasi Progres Kejadian</p>
        </div>
        
        <a href="/report" target="_blank" className="w-full py-3 bg-indigo-600 text-white text-center rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-700">Kirim Laporan Baru</a>

        <div className="flex-1 overflow-y-auto space-y-3 mt-4">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Daftar Kejadian</h4>
          {reports.length === 0 ? (
            <div className="text-center p-10 opacity-30 italic font-bold text-[10px]">Belum ada laporan masuk</div>
          ) : (
            reports.sort((a,b)=>b.id-a.id).map(r => (
              <div key={r.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-black text-[10px] text-slate-700 uppercase">{r.type}</span>
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${r.status==='Ditangani'?'bg-green-100 text-green-600':(r.status==='Proses Validasi'?'bg-amber-100 text-amber-600':'bg-indigo-100 text-indigo-600')}`}>
                    {r.status || 'Diterima'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 italic line-clamp-2">"{r.desc}"</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[8px] text-slate-400 font-bold uppercase">{r.village}</p>
                  <p className="text-[7px] font-mono text-slate-300">{r.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        <MapContainer center={[-7.36, 109.68]} zoom={11} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" />
          <ScaleControl position="bottomright" />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {reports.map(r => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={getIcon(r)}>
              <Popup>
                <div className="p-1 font-sans w-48">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-black uppercase text-[10px]">{r.type}</h4>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${r.status==='Ditangani'?'bg-green-100 text-green-600':'bg-amber-100 text-amber-600'}`}>
                      {r.status || 'Diterima'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mb-2 italic">"{r.desc}"</p>
                  <img src={r.photo} className="w-full h-24 object-cover rounded shadow-sm" />
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}