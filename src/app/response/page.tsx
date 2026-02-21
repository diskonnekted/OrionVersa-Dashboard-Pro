"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, FileText, HardHat, MapPin, Calendar, Users, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ResponseReportPage() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    incidentId: "",
    date: "",
    type: "Longsor",
    district: "",
    village: "",
    hamlet: "",
    address: "",
    chronology: "",
    impact: "",
    handling: "",
    teamLeader: "",
    teamMembers: "",
    notes: ""
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const incidentId = searchParams.get("incidentId");
    const type = searchParams.get("type");
    const location = searchParams.get("location");
    const dusun = searchParams.get("dusun");
    const dateText = searchParams.get("dateText");

    if (!incidentId && !type && !location && !dusun && !dateText) return;

    let district = form.district;
    let village = form.village;
    if (location) {
      const parts = location.split(",");
      if (parts.length >= 2) {
        village = village || parts[0].trim();
        district = district || parts[1].trim();
      } else {
        village = village || location;
      }
    }

    setForm(prev => ({
      ...prev,
      incidentId: incidentId || prev.incidentId,
      type: type || prev.type,
      district: district || prev.district,
      village: village || prev.village,
      hamlet: dusun || prev.hamlet,
      date: prev.date,
    }));
  }, [searchParams]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Gagal menyimpan respon");
        return;
      }
      setSubmitted(true);
    } catch (error: any) {
      alert(error.message || "Gagal terhubung ke server");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 font-sans">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 px-10 py-12 max-w-xl w-full text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-black uppercase text-slate-800 tracking-tight">Respon Tersimpan</h1>
          <p className="text-sm text-slate-500">
            Laporan penanganan telah dicatat. Informasi ini dapat digunakan sebagai bahan publikasi kepada masyarakat dan arsip internal.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Buat Laporan Respon Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white px-8 py-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-red-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-[0.18em] leading-none">Respon Penanganan Bencana</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-300 mt-2">
              Formulir Ringkasan Tindakan Lapangan Untuk Informasi Publik
            </p>
          </div>
        </div>
        <button
          onClick={() => history.back()}
          className="px-4 py-2 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10"
        >
          <ArrowLeft className="w-3 h-3" />
          Kembali
        </button>
      </header>

      <main className="flex-1 flex justify-center px-6 py-8">
        <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25em]">Dokumen Respon Bencana</p>
            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500 font-bold">
              <span className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Tanggal Kejadian: {form.date ? new Date(form.date).toLocaleString() : "-"}
              </span>
              <span className="flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-red-500" />
                Jenis: {form.type || "-"}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-emerald-500" />
                Lokasi: {form.village || form.district || "-"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-slate-50">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Identitas Kejadian
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">ID Laporan / Arsip</label>
                      <input
                        value={form.incidentId}
                        onChange={e => handleChange("incidentId", e.target.value)}
                        placeholder="Contoh: legacy-2023-51 atau ORION-2026-001"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Tanggal & Waktu Kejadian</label>
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={e => handleChange("date", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Jenis Bencana</label>
                      <select
                        value={form.type}
                        onChange={e => handleChange("type", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      >
                        <option>Longsor</option>
                        <option>Banjir</option>
                        <option>Kebakaran</option>
                        <option>Angin Kencang</option>
                        <option>Gempa Bumi</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Wilayah Administratif</label>
                      <input
                        value={form.district}
                        onChange={e => handleChange("district", e.target.value)}
                        placeholder="Kecamatan"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Desa/Kelurahan</label>
                      <input
                        value={form.village}
                        onChange={e => handleChange("village", e.target.value)}
                        placeholder="Nama Desa/Kelurahan"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Dusun / RT/RW</label>
                      <input
                        value={form.hamlet}
                        onChange={e => handleChange("hamlet", e.target.value)}
                        placeholder="Contoh: Dusun X RT 01/02"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-[9px] font-black uppercase text-slate-400">Alamat Detail / Titik Lokasi</label>
                    <input
                      value={form.address}
                      onChange={e => handleChange("address", e.target.value)}
                      placeholder="Contoh: Jl. Raya KM 5, dekat jembatan utama..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Kronologi Kejadian Singkat
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Jelaskan secara ringkas bagaimana kejadian berlangsung, kondisi awal di lokasi, dan laporan dari masyarakat.
                  </p>
                  <textarea
                    value={form.chronology}
                    onChange={e => handleChange("chronology", e.target.value)}
                    className="w-full min-h-[120px] px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 bg-slate-50 font-medium"
                    placeholder="Contoh: Pada hari Jumat, pukul 16.30 WIB terjadi longsor susulan yang menutup akses jalan kabupaten..."
                    required
                  />
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Dampak Bangunan dan Fisik
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Rinci kerusakan rumah, fasilitas umum, sarana prasarana, serta dampak korban jiwa atau luka-luka jika ada.
                  </p>
                  <textarea
                    value={form.impact}
                    onChange={e => handleChange("impact", e.target.value)}
                    className="w-full min-h-[120px] px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 bg-red-50 font-semibold"
                    placeholder="Contoh: 3 rumah rusak berat, 5 rumah rusak sedang, 1 jembatan penghubung desa terputus..."
                    required
                  />
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-green-600 flex items-center gap-2">
                    <HardHat className="w-4 h-4" />
                    Upaya Penanganan Oleh Tim
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Jelaskan langkah yang sudah dilakukan: asesmen, evakuasi, pembersihan material, pendirian posko, penyaluran logistik, dan koordinasi lintas instansi.
                  </p>
                  <textarea
                    value={form.handling}
                    onChange={e => handleChange("handling", e.target.value)}
                    className="w-full min-h-[140px] px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 bg-emerald-50 font-semibold"
                    placeholder="Contoh: Tim melakukan asesmen cepat, mengevakuasi 12 KK ke tempat aman, mengerahkan alat berat untuk membuka akses jalan..."
                    required
                  />
                </div>
              </div>

              <div className="col-span-5 space-y-6">
                <div className="bg-slate-900 rounded-3xl shadow-xl p-6 text-white space-y-5">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Ringkasan Lokasi</p>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase leading-tight">{form.village || "Desa/Kelurahan"}</p>
                        {form.hamlet && (
                          <p className="text-[11px] text-slate-300">{form.hamlet}</p>
                        )}
                        {form.address && (
                          <p className="text-[11px] text-slate-400">{form.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-[11px]">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-500">Jenis Bencana</p>
                      <p className="text-xs font-black text-amber-400 uppercase">{form.type || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-500">Tanggal Kejadian</p>
                      <p className="text-[11px] font-bold text-green-400">{form.date ? new Date(form.date).toLocaleString() : "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Tim Penanganan
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Koordinator Lapangan</label>
                      <input
                        value={form.teamLeader}
                        onChange={e => handleChange("teamLeader", e.target.value)}
                        placeholder="Nama koordinator / komandan regu"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Anggota Tim</label>
                      <textarea
                        value={form.teamMembers}
                        onChange={e => handleChange("teamMembers", e.target.value)}
                        className="w-full min-h-[80px] px-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 bg-slate-50"
                        placeholder="Contoh: 4 personil TRC BPBD, 3 relawan desa, 2 personil TNI..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Catatan Tambahan Untuk Masyarakat
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Gunakan bagian ini untuk menyampaikan himbauan, informasi jalur alternatif, atau rencana tindak lanjut yang perlu diketahui masyarakat.
                  </p>
                  <textarea
                    value={form.notes}
                    onChange={e => handleChange("notes", e.target.value)}
                    className="w-full min-h-[100px] px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-800 bg-slate-50"
                    placeholder="Contoh: Masyarakat diimbau menghindari area sekitar tebing selama 3x24 jam, gunakan jalur alternatif melalui..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.22em]">
                Formulir ini dapat dicetak atau disalin untuk penyebaran informasi resmi.
              </p>
              <button
                type="submit"
                className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.25em] shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
              >
                Simpan Ringkasan Respon
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
