"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, ScaleControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Sparkline = ({ data, color, width = 200, height = 60 }: any) => {
  if (!data || data.length < 2) return null;
  const values = data.map((d: any) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = data.map((d: any, i: any) => {
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
  const [devices, setDevices] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<[number, number] | null>(null);

  // Ambil data detail perangkat yang sedang dipilih dari list devices
  const selectedDevice = useMemo(() => {
    return devices.find(d => d.id === selectedId) || null;
  }, [devices, selectedId]);

  const fetchData = useCallback(async () => {
    try {
      const [liveRes, stationRes] = await Promise.all([
        fetch("/sungai/api/ews/push"),
        fetch("/sungai/api/admin/devices")
      ]);
      
      const liveData = await liveRes.json();
      const stationData = await stationRes.json();
      
      setStations(stationData);
      setDevices(liveData);
    } catch (e) {
      console.error("Monitor Fetch Error:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000); 
    return () => clearInterval(timer);
  }, [fetchData]);

  const getIcon = (d: any) => {
    const isDanger = d.type === "flood" ? d.lastValue > 200 : d.lastValue > 10;
    const color = isDanger ? '#ef4444' : '#10b981';
    return L.divIcon({ 
      className: "ews-icon", 
      html: `<div style="background-color:${color};width:32px;height:32px;border-radius:8px;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.3);"><i class="fa-solid ${d.type==='flood'?'fa-water':'fa-mountain-set'}"></i></div>`, 
      iconSize: [32,32], iconAnchor: [16,16] 
    });
  };

  const getDevicePosition = (deviceId: string): [number, number] => {
    const station = stations.find(s => s.sensor_code === deviceId || s.name === deviceId);
    if (station) return [station.latitude, station.longitude];
    return [-7.36, 109.68];
  };

  function FlyTo({ target }: any) {
    const map = useMap();
    useEffect(() => { if (target) map.flyTo(target, 16, { duration: 1.5 }); }, [target, map]);
    return null;
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 font-sans absolute inset-0">
      <aside className="w-80 bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col h-full overflow-hidden">
        <div className="p-5 border-b shrink-0 bg-white">
          <h2 className="font-black text-green-700 text-lg uppercase leading-none tracking-tighter">ORION LIVE</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Satellite Node Tracking</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedId ? (
            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Nodes</h4>
              {devices.length === 0 ? <p className="text-center p-10 text-[10px] italic opacity-40">Awaiting device signal...</p> : 
                devices.map((d: any) => (
                  <button key={d.id} onClick={() => { setSelectedId(d.id); setTarget(getDevicePosition(d.id)); }} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-green-500 hover:bg-green-50 transition-all mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
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
              <button onClick={() => setSelectedId(null)} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:gap-2 transition-all">
                <i className="fa-solid fa-arrow-left"></i> Back to Nodes
              </button>
              
              {selectedDevice && (
                <>
                  <div className="relative h-44 w-full mb-4 overflow-hidden rounded-2xl border-2 border-white shadow-lg group">
                    {(() => {
                      // Logic untuk memilih foto secara variatif berdasarkan ID perangkat
                      const imgNum = (selectedDevice.id.charCodeAt(selectedDevice.id.length - 1) % 3) + 1;
                      let imgSrc = "/sungai/logo.png";
                      
                      if (selectedDevice.type === 'flood') {
                        imgSrc = `/sungai/flood${imgNum}.jpg`;
                      } else if (selectedDevice.type === 'landslide') {
                        // Memperhitungkan typo 'lanslide1.jpg' pada file pertama
                        imgSrc = imgNum === 1 ? "/sungai/lanslide1.jpg" : `/sungai/landslide${imgNum}.jpg`;
                      } else {
                        imgSrc = "/sungai/earthquake1.jpg";
                      }

                      return (
                        <img 
                          src={imgSrc} 
                          alt={`EWS ${selectedDevice.type}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e: any) => { e.target.src = "/sungai/orion-dark.jpg"; }}
                        />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                      <div>
                        <p className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">Station Photo</p>
                        <p className="text-[10px] font-black text-white uppercase truncate w-40">{selectedDevice.id}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-md border border-green-500/50 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[7px] font-black text-green-400 uppercase">Live</span>
                      </div>
                    </div>
                  </div>

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
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        <MapContainer center={[-7.36, 109.68]} zoom={11} maxBounds={[[-7.7, 109.2], [-7.0, 110.1]]} className="h-full w-full" zoomControl={false}>
          <ZoomControl position="topright" /><ScaleControl position="bottomright" />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo target={target} />
          {devices.map((d: any) => (
            <Marker key={d.id} position={getDevicePosition(d.id)} icon={getIcon(d)} eventHandlers={{ click: () => { setSelectedId(d.id); setTarget(getDevicePosition(d.id)); } }}>
              <Popup><div className="text-[10px] font-black uppercase">{d.id}</div></Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
