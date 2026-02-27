"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Lock, User as UserIcon, AlertCircle, 
  Zap, Loader2, ArrowRight, Activity, AlertTriangle
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/sungai/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Save user session to localStorage for client-side role checks
        localStorage.setItem("orion_user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.error || "Login gagal. Cek kembali akun Anda.");
      }
    } catch (e) {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex relative overflow-hidden font-sans">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/sungai/login.jpg')] bg-cover bg-center opacity-25"></div>
        <div className="absolute inset-0 bg-slate-950/70"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* LEFT: VISUAL (DESKTOP ONLY) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 z-10 relative border-r border-white/5">
        <div className="flex items-center gap-4">
          <img src="/sungai/orion-light.png" alt="Orion Logo" className="h-12 w-auto object-contain" />
          <div className="h-8 w-[1px] bg-white/20 mx-2"></div>
          <p className="text-sm font-black text-white/80 uppercase tracking-[0.3em] leading-none">Intelligence<br/><span className="text-[10px] opacity-50">Command Center</span></p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-red-500">
            <Activity className="w-6 h-6 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Real-time Monitoring Active</span>
          </div>
          <h1 className="text-6xl font-black text-white leading-tight uppercase tracking-tighter">
            Mitigasi Cerdas<br/>
            <span className="text-indigo-500">Banjarnegara</span>
          </h1>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed">
            Sistem informasi terpadu pemantauan Early Warning System (EWS) dan manajemen logistik bencana alam Kabupaten Banjarnegara.
          </p>
        </div>

        <div className="flex items-center gap-8 opacity-40 grayscale">
          <img src="/sungai/logo.png" className="h-10 w-auto" alt="Logo BPBD" />
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
      </div>

      {/* RIGHT: LOGIN FORM */}
      <div className="w-full lg:w-[500px] flex items-center justify-center p-8 z-10 relative bg-slate-900/40 backdrop-blur-md border-l border-white/5 shadow-2xl">
        <div className="w-full max-w-sm space-y-10 animate-in slide-in-from-bottom-10 duration-700">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Otentikasi Petugas</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Silakan masuk menggunakan kredensial BPBD</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input 
                  required
                  type="text" 
                  value={username}
                  onChange={e=>setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-white/5 border-2 border-white/5 focus:border-indigo-500/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold placeholder:text-slate-600 transition-all focus:outline-none focus:ring-4 ring-indigo-500/10"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/5 border-2 border-white/5 focus:border-indigo-500/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold placeholder:text-slate-600 transition-all focus:outline-none focus:ring-4 ring-indigo-500/10"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in zoom-in-95">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Akses Sistem
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-none">
            Orion Dashboard v4.0.2<br/>
            <span className="opacity-50 font-normal mt-2 inline-block">Authorized Personnel Only</span>
          </p>
        </div>
      </div>
    </div>
  );
}
