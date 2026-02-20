"use client";
import { useState, useEffect } from "react";
import { Camera, MapPin, Send, CheckCircle2, ChevronLeft } from "lucide-react";

// Data Wilayah Banjarnegara (Contoh beberapa kecamatan utama)
const REGION_DATA: Record<string, string[]> = {
  "Banjarnegara": ["Ampelsari", "Argasoka", "Karangtengah", "Krandegan", "Kutabanjarnegara", "Parakancanggah", "Semarang", "Sokanandi"],
  "Bawang": ["Bandingan", "Bawang", "Binorong", "Blambangan", "Joho", "Kebondalem", "Masaran", "Wanadri"],
  "Karangkobar": ["Ambal", "Binangun", "Jatiteken", "Karangkobar", "Leksana", "Pagentan", "Pasiraman", "Sampang"],
  "Madukara": ["Bantarwaru", "Clapar", "Gumiwang", "Kutayasa", "Madukara", "Pagelak", "Pekauman", "Talunamba"],
  "Pagentan": ["Aribaya", "Gumingsir", "Kalitlaga", "Karangnangka", "Kasinoman", "Nagadira", "Pagentan", "Plumbungan"],
  "Purwanegara": ["Gumiwang", "Kaliajir", "Karanganyar", "Mertasari", "Pucungbedug", "Purwanegara", "Smeru"],
  "Susukan": ["Bumiagung", "Gumelem Kulon", "Gumelem Wetan", "Kemranggon", "Susukan"]
};

export default function PublicReport() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [photo, setPhoto] = useState<string | null>(null);
  const [type, setType] = useState("Longsor");
  const [district, setDistrict] = useState("Banjarnegara");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    setVillage(REGION_DATA["Banjarnegara"][0]);
  }, []);

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setVillage(REGION_DATA[val][0]);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const reports = JSON.parse(localStorage.getItem("orion_reports") || "[]");
    const newReport = {
      id: Date.now(),
      lat: coords.lat || -7.36,
      lng: coords.lng || 109.68,
      type, district, village, address, desc, name, phone, photo,
      isValidated: false,
      timestamp: new Date().toLocaleString()
    };
    reports.push(newReport);
    localStorage.setItem("orion_reports", JSON.stringify(reports));
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center font-sans">
      <CheckCircle2 className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
      <h1 className="text-2xl font-black text-slate-800 uppercase">Laporan Terkirim!</h1>
      <p className="text-slate-500 mt-2">Terima kasih atas partisipasi Anda. Laporan akan segera divalidasi oleh petugas BPBD.</p>
      <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs">Kirim Laporan Baru</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <div className="bg-indigo-900 p-6 text-white shrink-0 shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter">ORION REPORT</h1>
          <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none mt-1">Laporan Bencana Banjarnegara</p>
        </div>
        <button onClick={() => window.close()} className="p-2 bg-white/10 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
      </div>

      <form onSubmit={submitReport} className="p-5 space-y-5 max-w-md mx-auto">
        {/* PHOTO SECTION */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bukti Foto Kejadian</label>
          <div className="relative h-56 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
            {photo ? (
              <img src={photo} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-slate-400">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Klik untuk Ambil Foto</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="absolute inset-0 opacity-0 cursor-pointer" required />
          </div>
        </div>

        {/* LOCATION SELECTORS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 mb-2">Lokasi Kejadian</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Kecamatan</label>
              <select value={district} onChange={(e)=>handleDistrictChange(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs appearance-none">
                {Object.keys(REGION_DATA).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Desa/Kelurahan</label>
              <select value={village} onChange={(e)=>setVillage(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs appearance-none">
                {REGION_DATA[district].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase">Alamat Detail / Patokan</label>
            <input value={address} onChange={(e)=>setAddress(e.target.value)} type="text" placeholder="Contoh: Jl. Raya KM 5, depan Masjid..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium" required />
          </div>
        </div>

        {/* EVENT DETAILS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 mb-2">Detail Kejadian</h4>
          
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase">Jenis Bencana</label>
            <select value={type} onChange={(e)=>setType(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs appearance-none">
              <option>Longsor</option><option>Banjir</option><option>Kebakaran</option><option>Angin Kencang</option><option>Gempa Bumi</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase">Deskripsi Kerusakan</label>
            <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Ceritakan kondisi di lapangan..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs h-20" required />
          </div>
        </div>

        {/* REPORTER INFO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 mb-2">Data Pelapor</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Nama Lengkap</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">No. WhatsApp</label>
              <input value={phone} onChange={(e)=>setPhone(e.target.value)} type="tel" placeholder="08..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold" required />
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg"><MapPin className="w-5 h-5" /></div>
          <div>
            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter leading-none">Koordinat Presisi (GPS)</p>
            <p className="text-[11px] font-mono font-black text-indigo-900 mt-1">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Send className="w-4 h-4" /> Kirim Laporan Resmi
        </button>
      </form>
    </div>
  );
}
