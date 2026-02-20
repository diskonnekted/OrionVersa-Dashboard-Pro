"use client";
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, ScaleControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Sparkline = ({ data, color, width = 200, height = 60 }) => {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <path d={`M ${points} L ${width},${height} L 0,${height} Z`} fill={color} fillOpacity="0.1" />
    </svg>
  );
};

export default function DashboardMonitor() {
  const [devices, setReports] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [target, setTarget] = useState(null);

  const fetchLiveEws = useCallback(async () => {
    try {
      const res = await fetch("/data/ews_live.json?t=" + Date.now());
      const data = await res.json();
      setReports(data);
      if (selectedDevice) {
        const updated = data.find(d => d.id === selectedDevice.id);
        if (updated) setSelectedDevice(updated);
      }
    } catch (e) {}
  }, [selectedDevice]);

  useEffect(() => {
    fetchLiveEws();
    const timer = setInterval(fetchLiveEws, 5000); // Polling setiap 5 detik
    return () => clearInterval(timer);
  }, [fetchLiveEws]);

  const getIcon = (d) => {
    const isDanger = d.type === "flood" ? d.lastValue > 200 : d.lastValue > 10;
    const color = isDanger ? '#ef4444' : '#10b981';
    return L.divIcon({ 
      className: "ews-icon", 
      html: `<div style="background-color:${color};width:32px;height:32px;border-radius:8px;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.3);"><i class="fa-solid ${d.type==='flood'?'fa-water':'fa-mountain-set'}"></i></div>`, 
      iconSize: [32,32], iconAnchor: [16,16] 
    });
  };

  function FlyTo({ target }) {
    const map = useMap();
    useEffect(() => { if (target) map.flyTo(target, 16, { duration: 1.5 }); }, [target, map]);
    return null;
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 font-sans">
      <aside className="w-80 bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col h-full">
        <div className="p-5 border-b shrink-0 bg-white">
          <h2 className="font-black text-green-700 text-lg uppercase leading-none tracking-tighter">ORION LIVE</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Satellite Node Tracking</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedDevice ? (
            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Nodes</h4>
              {devices.length === 0 ? <p className="text-center p-10 text-[10px] italic opacity-40">Awaiting device signal...</p> : 
                devices.map(d => (
                  <button key={d.id} onClick={() => { setSelectedDevice(d); }} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-green-500 hover:bg-green-50 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="font-black text-slate-700 text-xs uppercase">{d.id}</span>
                      <span className="ml-auto text-[9px] font-black text-slate-400">{d.wifi} dBm</span>
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase">VALUE: {d.lastValue} • BAT: {d.battery}%</div>
                  </button>
                ))
              }
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setSelectedDevice(null)} className="text-[10px] font-black text-indigo-600 uppercase">← Back to Nodes</button>
              
              <div className="p-4 rounded-2xl shadow-lg text-white bg-indigo-600 space-y-3">
                <div className="flex justify-between items-start">
                  <div><h3 className="font-black text-sm uppercase leading-none">{selectedDevice.id}</h3><p className="text-[9px] font-bold opacity-80 mt-1 uppercase italic">{selectedDevice.type}</p></div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl"><i className={`fa-solid ${selectedDevice.type==="flood"?"fa-water":"fa-mountain-set"}`}></i></div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-white/20 pt-3">
                  <div className="bg-white/10 p-2 rounded-lg text-center"><p className="text-[7px] uppercase font-black opacity-70 mb-1">Live Sensor</p><p className="text-sm font-black">{selectedDevice.lastValue}</p></div>
                  <div className="bg-white/10 p-2 rounded-lg text-center"><p className="text-[7px] uppercase font-black opacity-70 mb-1">Battery</p><p className="text-sm font-black">{selectedDevice.battery}%</p></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">System Diagnostics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 text-[10px]"><i className="fa-solid fa-wifi"></i></div>
                    <div><p className="text-[7px] font-black text-slate-400 uppercase leading-none">Signal</p><p className="text-[10px] font-black text-slate-700">{selectedDevice.wifi} dBm</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 text-[10px]"><i className="fa-solid fa-microchip"></i></div>
                    <div><p className="text-[7px] font-black text-slate-400 uppercase leading-none">Temp</p><p className="text-[10px] font-black text-slate-700">{selectedDevice.cpuTemp}°C</p></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Trend</h4>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 h-20 flex items-center"><Sparkline data={selectedDevice.history} color="#6366f1" /></div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        <MapContainer center={[-7.36, 109.68]} zoom={11} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo target={target} />
          {devices.map(d => (
            <Marker key={d.id} position={[-7.36, 109.68]} icon={getIcon(d)}>
              <Popup><div className="text-[10px] font-black uppercase">{d.id}</div></Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}