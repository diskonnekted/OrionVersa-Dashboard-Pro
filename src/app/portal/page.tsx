"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Home, Send, BookOpen, AlertTriangle, ShieldCheck, MapPin, 
  Camera, ChevronRight, Info, Zap, Wifi, Phone, Clock, Loader2
} from "lucide-react";

// Dynamic Import for the entire Map component (CRITICAL: ssr: false)
const PublicMap = dynamic(() => import("@/components/PublicMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase text-[10px] tracking-widest">Inisialisasi Peta...</div>
});

const REGION_DATA: Record<string, string[]> = {
  "Banjarnegara": ["Ampelsari", "Argasoka", "Karangtengah", "Krandegan", "Kutabanjarnegara", "Parakancanggah", "Semarang", "Sokanandi"],
  "Bawang": ["Bandingan", "Bawang", "Binorong", "Blambangan", "Joho", "Kebondalem", "Masaran", "Wanadri"],
  "Karangkobar": ["Ambal", "Binangun", "Jatiteken", "Karangkobar", "Leksana", "Pagentan", "Pasiraman", "Sampang"],
  "Madukara": ["Bantarwaru", "Clapar", "Gumiwang", "Kutayasa", "Madukara", "Pagelak", "Pekauman", "Talunamba"],
  "Pagentan": ["Aribaya", "Gumingsir", "Kalitlaga", "Karangnangka", "Kasinoman", "Nagadira", "Pagentan", "Plumbungan"],
  "Purwanegara": ["Gumiwang", "Kaliajir", "Karanganyar", "Mertasari", "Pucungbedug", "Purwanegara", "Smeru"],
  "Susukan": ["Bumiagung", "Gumelem Kulon", "Gumelem Wetan", "Kemranggon", "Susukan"]
};

const DISASTER_MAP: Record<string, { color: string, icon: string }> = {
  "Longsor": { color: "#a855f7", icon: "fa-hill-rockslide" },
  "Banjir": { color: "#3b82f6", icon: "fa-house-flood-water" },
  "Kebakaran": { color: "#ef4444", icon: "fa-fire" },
  "Angin Kencang": { color: "#06b6d4", icon: "fa-wind" },
  "Gempa Bumi": { color: "#f59e0b", icon: "fa-house-crack" }
};

export default function PublicPortal() {
  const [activeTab, setActiveTab] = useState("home");
  const [location, setLocation] = useState<[number, number]>([-7.36, 109.68]);
  const [reports, setReports] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [isSafe, setIsSafe] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "", phone: "", type: "Longsor", district: "Banjarnegara", 
    village: "", address: "", desc: "", photo: null as string | null
  });
  const [submitted, setSubmitted] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data);
      setIsSafe(!data.some((r: any) => !r.isValidated));
      const respRes = await fetch("/api/responses?limit=5");
      if (respRes.ok) {
        const respData = await respRes.json();
        setResponses(Array.isArray(respData) ? respData : []);
      } else {
        setResponses([]);
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    setFormData(prev => ({ ...prev, village: REGION_DATA["Banjarnegara"]?.[0] || "" }));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("GPS Position using default"),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const handlePhoto = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lat: location[0],
          lng: location[1],
          verif: { reporter: false, village: false, residents: false }
        })
      });
      if (res.ok) {
        setSubmitted(true);
        loadData();
      } else {
        alert("Gagal mengirim laporan ke server.");
      }
    } catch (e) {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden font-sans select-none">
      
      {/* HEADER STATUS */}
      <div className={`p-4 pt-6 ${isSafe ? 'bg-green-600' : 'bg-red-600'} text-white shrink-0 shadow-lg z-[2001] transition-colors duration-500`}>
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex flex-col items-center gap-1">
            <img src="/orion-light.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-[7px] font-bold opacity-70 uppercase tracking-[0.3em] leading-none">Command Center</span>
          </div>
          <div>
            {isSafe ? (
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase text-white">Aman</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase text-white">Waspada</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className={`flex-1 relative min-h-0 ${activeTab === 'home' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {activeTab === "home" && (
          <div className="absolute inset-0 flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <PublicMap location={location} reports={reports} isSafe={isSafe} DISASTER_MAP={DISASTER_MAP} />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border flex items-center gap-3">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-black text-slate-700 uppercase">Pantauan Terkini</span>
            </div>
            {responses.length > 0 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xl">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-700">
                        Informasi Resmi Terbaru
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {responses.length} Update
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {responses.map((r: any) => (
                      <div
                        key={r.id}
                        className="bg-slate-50 rounded-2xl px-3 py-2 border border-slate-100 flex items-start gap-3"
                      >
                        <div className="mt-0.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700 uppercase">
                            {r.type?.[0] || "B"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-800 truncate">
                            {r.village || r.district || "Lokasi tidak diketahui"}
                          </p>
                          {r.notes && (
                            <p className="text-[10px] text-slate-500 line-clamp-2">
                              {r.notes}
                            </p>
                          )}
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "report" && (
          <div className="p-5 max-w-md mx-auto animate-in slide-in-from-bottom-4 pb-24">
            {submitted ? (
              <div className="py-20 text-center space-y-4">
                <ShieldCheck className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-black uppercase text-slate-800">Laporan Terkirim</h2>
                <p className="text-slate-500 text-sm">Laporan Anda sedang diproses oleh tim BPBD.</p>
                <button onClick={() => setSubmitted(false)} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs">OK</button>
              </div>
            ) : (
              <form onSubmit={submitReport} className="space-y-6">
                <h3 className="text-lg font-black uppercase text-slate-800">Laporan Resmi</h3>
                <div className="space-y-2">
                  <div className="relative h-48 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <div className="text-center text-slate-300"><Camera className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-[9px] font-black uppercase tracking-widest">Ambil Foto Kejadian</p></div>}
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="absolute inset-0 opacity-0 cursor-pointer" required />
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-slate-900">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Jenis Bencana</label><select value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-xs">{Object.keys(DISASTER_MAP).map(t => <option key={t}>{t}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Kecamatan</label><select value={formData.district} onChange={(e)=>setFormData({...formData, district: e.target.value, village: REGION_DATA[e.target.value][0]})} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-xs">{Object.keys(REGION_DATA).map(d => <option key={d}>{d}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Desa</label><select value={formData.village} onChange={(e)=>setFormData({...formData, village: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-xs">{REGION_DATA[formData.district]?.map(v => <option key={v}>{v}</option>)}</select></div>
                  </div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Alamat Detail</label><input value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} type="text" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium" required /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-slate-900">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Nama</label><input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} type="text" className="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold" required /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">WhatsApp</label><input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} type="tel" placeholder="08..." className="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold" required /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Deskripsi</label><textarea value={formData.desc} onChange={(e)=>setFormData({...formData, desc: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none text-xs h-24" required /></div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Kirim Laporan
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === "manual" && (
          <div className="p-6 max-w-md mx-auto space-y-6 pb-24 animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-lg font-black uppercase text-slate-800">Panduan</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border flex items-start gap-4 shadow-sm"><div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6 text-green-600" /></div><div><h4 className="text-xs font-black uppercase text-slate-800">Status Aman</h4><p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Wilayah Banjarnegara kondusif.</p></div></div>
              <div className="bg-white p-4 rounded-2xl border flex items-start gap-4 shadow-sm"><div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div><h4 className="text-xs font-black uppercase text-slate-800">Status Waspada</h4><p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Ada laporan bencana aktif.</p></div></div>
              <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-3 shadow-xl border-t-4 border-red-500"><h4 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2"><Phone className="w-4 h-4" /> Kontak Darurat</h4><div className="flex justify-between items-center"><span className="text-[10px] font-bold opacity-70 uppercase">BPBD</span><span className="text-lg font-black text-red-500 tracking-widest">112</span></div></div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex items-center justify-around z-[2000] shadow-xl rounded-t-[32px]">
        {[{ id: "home", label: "Beranda", icon: Home }, { id: "report", label: "Lapor", icon: Send }, { id: "manual", label: "Panduan", icon: BookOpen }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300'}`}><div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-indigo-50' : ''}`}><tab.icon className="w-6 h-6" /></div><span className="text-[9px] font-black uppercase">{tab.label}</span></button>
        ))}
      </nav>
    </div>
  );
}
