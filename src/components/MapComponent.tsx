"use client";
import { useEffect, useState } from "react";
import DashboardExplorer from "./DashboardExplorer";
import DashboardAnalysis from "./DashboardAnalysis";
import DashboardMonitor from "./DashboardMonitor";
import DashboardReports from "./DashboardReports";
import DashboardAdmin from "./DashboardAdmin";
import { AlertTriangle, BellRing, ShieldAlert, Wifi } from "lucide-react";

export default function MapComponent() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [ewsAlert, setEwsAlert] = useState(false);
  const [reportAlert, setReportAlert] = useState(false);

  // Monitor Global Status
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        // 1. Check EWS Danger Signals
        const ewsRes = await fetch("/data/ews_live.json?t=" + Date.now());
        const ewsData = await ewsRes.json();
        const hasDanger = ewsData.some((d: any) => d.type === 'flood' ? d.lastValue > 200 : d.lastValue > 15);
        setEwsAlert(hasDanger);

        // 2. Check Unvalidated Reports
        const reports = JSON.parse(localStorage.getItem("orion_reports") || "[]");
        const hasNewReport = reports.some((r: any) => !r.isValidated);
        setReportAlert(hasNewReport);
      } catch (e) {}
    };

    checkAlerts();
    const timer = setInterval(checkAlerts, 5000); // Cek setiap 5 detik
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden font-sans">
      {/* GLOBAL NAVIGATION HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Orion Logo" className="h-10 w-auto rounded object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-black text-slate-800 text-sm tracking-tight uppercase">Orion Intelligence</span>
            <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5">Banjarnegara Command</span>
          </div>
        </div>

        {/* ALERT INDICATORS */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all duration-500 ${ewsAlert ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
            <Wifi className={`w-4 h-4 ${ewsAlert ? 'text-red-600' : 'text-slate-400'}`} />
            <span className={`text-[9px] font-black uppercase ${ewsAlert ? 'text-red-700' : 'text-slate-500'}`}>
              {ewsAlert ? 'EWS DANGER' : 'EWS SAFE'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all duration-500 ${reportAlert ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
            <BellRing className={`w-4 h-4 ${reportAlert ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className={`text-[9px] font-black uppercase ${reportAlert ? 'text-amber-700' : 'text-slate-500'}`}>
              {reportAlert ? 'NEW REPORTS' : 'NO REPORTS'}
            </span>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
          {[
            { id: "explorer", label: "Explorer", color: "text-indigo-600" },
            { id: "analysis", label: "Analysis", color: "text-red-600" },
            { id: "monitor", label: "Monitor EWS", color: "text-green-600" },
            { id: "reports", label: "Reporting", color: "text-blue-600" },
            { id: "admin", label: "Admin", color: "text-slate-800" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${activeTab===tab.id ? "bg-white shadow-lg translate-y-[-1px] " + tab.color : "text-slate-400 hover:text-slate-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* INDEPENDENT WORKSPACES */}
      <div className="flex-1 relative">
        {activeTab === "explorer" && <DashboardExplorer />}
        {activeTab === "analysis" && <DashboardAnalysis />}
        {activeTab === "monitor" && <DashboardMonitor />}
        {activeTab === "reports" && <DashboardReports />}
        {activeTab === "admin" && <DashboardAdmin />}
      </div>
    </div>
  );
}