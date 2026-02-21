"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size multiple times to ensure full container coverage
    const timers = [100, 500, 1000, 2000].map(ms => 
      setTimeout(() => {
        map.invalidateSize();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

export default function PublicMap({ location, reports, isSafe, DISASTER_MAP = {} }: any) {
  return (
    <MapContainer 
      center={location} 
      zoom={13} 
      className="h-full w-full" 
      zoomControl={false}
      attributionControl={false}
    >
      <MapResizeFix />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <Circle 
        center={location} 
        radius={1000} 
        pathOptions={{ 
          color: isSafe ? '#10b981' : '#ef4444', 
          fillColor: isSafe ? '#10b981' : '#ef4444', 
          fillOpacity: 0.1 
        }} 
      />
      
      <Marker position={location} icon={L.divIcon({ html: '<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg ring-4 ring-blue-600/20"></div>', className: 'user-pos' })} />

      {reports.map((r: any) => {
        const config = DISASTER_MAP[r.type] || { color: "#6366f1", icon: "fa-triangle-exclamation" };
        return (
          <Marker 
            key={r.id} 
            position={[r.lat, r.lng]} 
            icon={L.divIcon({
              className: 'pub-marker',
              html: `<div style="background-color:${config.color};width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.3)"><i class="fa-solid ${config.icon} text-[10px]"></i></div>`
            })}
          >
            <Popup>
              <div className="p-1 font-sans">
                <p className="font-black uppercase text-[10px] text-slate-800">{r.type}</p>
                <p className="text-[9px] text-slate-500 italic mt-1">"{r.desc}"</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
