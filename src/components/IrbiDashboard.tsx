"use client";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Bar, Radar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data based on the screenshot provided by user
// Since we might not be able to fetch everything perfectly from their API without proper documentation
const MOCK_DATA = {
  population: "1.039.570",
  gender: { m: 51, f: 49 },
  capacity: "TINGGI",
  risks: [
    { name: "Cuaca Ekstrim", exposed: 57, not_exposed: 43 },
    { name: "Banjir", exposed: 92, not_exposed: 8 },
    { name: "Kekeringan", exposed: 100, not_exposed: 0 },
    { name: "Gempabumi", exposed: 95, not_exposed: 5 },
    { name: "Tanah Longsor", exposed: 31, not_exposed: 69 },
    { name: "Likuefaksi", exposed: 41, not_exposed: 59 },
    { name: "COVID 19", exposed: 49, not_exposed: 51 },
    { name: "Letusan Gunung Api", exposed: 98, not_exposed: 2 },
    { name: "Banjir Bandang", exposed: 95, not_exposed: 5 },
  ],
  trend: [
    { year: 2015, value: 150.00 },
    { year: 2016, value: 150.00 },
    { year: 2017, value: 150.00 },
    { year: 2018, value: 150.00 },
    { year: 2019, value: 150.00 },
    { year: 2020, value: 143.21 },
    { year: 2021, value: 138.46 },
    { year: 2022, value: 129.20 },
    { year: 2023, value: 126.86 },
    { year: 2024, value: 119.79 },
  ],
  priorities: [80, 70, 60, 50, 65, 55, 75]
};

export default function IrbiDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("jiwa"); // jiwa, rupiah, hektar

  // Chart Data: Risks (Stacked Bar)
  const riskData = {
    labels: MOCK_DATA.risks.map(r => r.name),
    datasets: [
      {
        label: 'Jiwa Terpapar (%)',
        data: MOCK_DATA.risks.map(r => r.exposed),
        backgroundColor: '#ef4444',
        barThickness: 15,
      },
      {
        label: 'Jiwa Tidak Terpapar (%)',
        data: MOCK_DATA.risks.map(r => r.not_exposed),
        backgroundColor: '#0ea5e9',
        barThickness: 15,
      }
    ]
  };

  const riskOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { boxWidth: 10, font: { size: 10 } } },
      title: { display: false }
    },
    scales: {
      x: { stacked: true, max: 100, grid: { display: false } },
      y: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, weight: 700 } } }
    }
  };

  // Chart Data: Trend (Bar/Line combo)
  const trendData = {
    labels: MOCK_DATA.trend.map(t => t.year),
    datasets: [
        {
            type: 'line' as const,
            label: 'Trend',
            data: MOCK_DATA.trend.map(t => t.value),
            borderColor: '#64748b',
            borderWidth: 1,
            pointRadius: 2,
            tension: 0.1
        },
        {
            type: 'bar' as const,
            label: 'Indeks Risiko',
            data: MOCK_DATA.trend.map(t => t.value),
            backgroundColor: MOCK_DATA.trend.map((t, i) => {
                const colors = ['#0ea5e9', '#f97316', '#22c55e', '#ef4444', '#a855f7', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f59e0b'];
                return colors[i % colors.length];
            }),
            barThickness: 20,
        }
    ]
  };

  const trendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: (ctx: any) => `${ctx.raw}`
              }
          }
      },
      scales: {
          y: { beginAtZero: true, max: 160 }
      }
  };

  // Chart Data: Radar (Prioritas)
  const radarData = {
      labels: ['Prioritas 1', 'Prioritas 2', 'Prioritas 3', 'Prioritas 4', 'Prioritas 5', 'Prioritas 6', 'Prioritas 7'],
      datasets: [{
          label: 'Prioritas',
          data: MOCK_DATA.priorities,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3b82f6'
      }]
  };

  // Chart Data: Doughnut (Capacity)
  const capacityData = {
      labels: ['Kapasitas', 'Kekurangan'],
      datasets: [{
          data: [75, 25],
          backgroundColor: ['#f97316', '#e2e8f0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
      }]
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center shadow-sm">
            <div>
                <h1 className="text-2xl font-black text-slate-800">Banjarnegara</h1>
                <p className="text-sm text-slate-500 font-medium">Dashboard Indeks Risiko Bencana Indonesia (IRBI)</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <i className="fa-solid fa-xmark text-xl text-slate-600"></i>
            </button>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
            
            {/* Top Section: Population & Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Population Info */}
                <div className="space-y-6">
                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Populasi</h3>
                        <div className="text-5xl font-black text-slate-800 mb-2">{MOCK_DATA.population}</div>
                        <span className="text-sm font-bold text-slate-400">Jiwa</span>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 bg-[#0f4c81] text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                            <span className="text-2xl font-black">{MOCK_DATA.gender.m}%</span>
                            <i className="fa-solid fa-person text-3xl opacity-80"></i>
                        </div>
                        <div className="flex-1 bg-[#e91e63] text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                            <span className="text-2xl font-black">{MOCK_DATA.gender.f}%</span>
                            <i className="fa-solid fa-person-dress text-3xl opacity-80"></i>
                        </div>
                    </div>
                </div>

                {/* Right: Risk Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-[400px]">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex gap-4 text-xs font-bold uppercase text-slate-500">
                            <span>Bencana</span>
                            <span className="text-red-500">Jiwa Terpapar</span>
                            <span className="text-blue-500">Jiwa Tidak Terpapar</span>
                        </div>
                    </div>
                    <div className="h-[340px]">
                        <Bar options={riskOptions} data={riskData} />
                    </div>
                </div>
            </div>

            {/* Middle Section: Priorities, Capacity, Trend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Prioritas */}
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-medium text-orange-500 mb-4 border-b-2 border-orange-200 pb-1">Prioritas</h3>
                    <div className="w-full h-[250px]">
                        <Radar data={radarData} options={{ maintainAspectRatio: false, scales: { r: { ticks: { display: false }, pointLabels: { font: { size: 9 } } } }, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                {/* Kapasitas */}
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-medium text-orange-500 mb-4 border-b-2 border-orange-200 pb-1">Tingkat Kapasitas Daerah</h3>
                    <div className="w-full h-[200px] relative flex items-center justify-center">
                        <Doughnut data={capacityData} options={{ cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2 text-center">
                             <div className="text-xl font-black text-slate-800">TINGGI</div>
                        </div>
                    </div>
                </div>

                {/* Trend */}
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-medium text-orange-500 mb-4 border-b-2 border-orange-200 pb-1">Trend Indeks Risiko Bencana</h3>
                    <div className="w-full h-[250px]">
                        <Bar data={trendData as any} options={trendOptions as any} />
                    </div>
                </div>
            </div>

            {/* Bottom: Policy Recommendations */}
            <div className="space-y-4">
                <div className="text-center">
                     <h3 className="text-lg font-medium text-orange-500 inline-block border-b-2 border-orange-200 pb-1">Rekomendasi Kebijakan</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[10px] leading-tight text-slate-600">
                    {[
                        "Perkuatan Kebijakan Dan Kelembagaan",
                        "Pengkajian Risiko Dan Perencanaan Terpadu",
                        "Pengembangan Sistem Informasi, Diklat Dan Logistik",
                        "Penanganan Tematik Kawasan Rawan Bencana",
                        "Peningkatan Efektivitas Pencegahan Dan Mitigasi Bencana",
                        "Perkuatan Kesiapsiagaan Dan Penanganan Darurat Bencana",
                        "Pengembangan Sistem Pemulihan Bencana"
                    ].map((p, i) => (
                        <div key={i} className="p-2 border-l-2 border-slate-200">
                            <span className="font-bold block mb-1">Prioritas {i+1} :</span>
                            {p}
                        </div>
                    ))}
                </div>

                {/* Detailed Table (Based on User Screenshot) */}
                <div className="overflow-x-auto pb-8">
                    <div className="grid grid-cols-7 gap-2 min-w-[1200px]">
                         {[1,2,3,4,5,6,7].map(n => (
                             <div key={n} className="bg-orange-500 text-white text-[10px] font-bold p-2 rounded-t-md text-center">Prioritas {n}</div>
                         ))}
                         
                         {/* Priority 1 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li><b>Penerapan Peraturan Daerah tentang Penyelenggaraan Penanggulangan Bencana</b></li>
                                 <li><b>Penerapan Aturan Teknis Pelaksanaan Fungsi BPBD</b></li>
                                 <li><b>Optimalisasi Penerapan Aturan dan Mekanisme Forum PRB</b></li>
                                 <li><b>Optimalisasi Penerapan Aturan dan Mekanisme Penyebaran Informasi Kebencanaan</b></li>
                                 <li><b>Optimalisasi Fungsi Peraturan Daerah tentang Rencana Penanggulangan Bencana</b></li>
                                 <li><b>Penguatan Peraturan Daerah tentang Rencana Tata Ruang Wilayah Berbasis Kajian Risiko Bencana untuk Pengurangan Risiko Bencana</b></li>
                                 <li><b>Peningkatan Kapabilitas dan Tata Kelola BPBD</b></li>
                                 <li><b>Optimalisasi Pencapaian Fungsi Forum PRB</b></li>
                                 <li><b>Penguatan Fungsi Pengawasan dan Penganggaran Legislatif dalam Pengurangan Risiko Bencana di Daerah</b></li>
                             </ul>
                         </div>

                         {/* Priority 2 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li>Penyusunan Peta Bahaya dan Pembaharuannya sesuai dengan aturan</li>
                                 <li>Penyusunan Peta Kerentanan dan Pembaharuannya sesuai dengan aturan</li>
                                 <li>Penyusunan Peta Kapasitas dan Pembaharuannya sesuai dengan aturan</li>
                                 <li>Optimalisasi Penerapan Rencana Penanggulangan Bencana Daerah</li>
                             </ul>
                         </div>

                         {/* Priority 3 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li>Penerapan dan Peningkatan Fungsi Informasi Kebencanaan Daerah</li>
                                 <li>Membangun Partisipasi Aktif Masyarakat untuk Pencegahan dan Kesiapsiagaan Bencana di Lingkungannya</li>
                                 <li>Komunikasi bencana lintas lembaga</li>
                                 <li>Mengoptimalkan Fungsi dan Peran Pusdalops PB untuk Efektivitas Penanganan Darurat Bencana</li>
                                 <li>Pemanfaatan Sistem Pendataan Daerah yang Terintegrasi dengan Sistem Pendataan Nasional</li>
                                 <li>Meningkatkan Kapasitas Respon Personil PB sesuai dengan Sertifikasi Penggunaan Peralatan PB</li>
                                 <li>Meningkatkan Kapasitas Daerah melalui Penyelenggaraan Latihan Kesiapsiagaan</li>
                                 <li>Peningkatan Kapabilitas Peralatan dan Logistik Kebencanaan Daerah</li>
                                 <li>Monitoring Ketersediaan dan Kesiapan Peralatan dan Logistik Kebencanaan Daerah</li>
                                 <li>Pengelolaan Gudang Logistik Kebencanaan Daerah</li>
                                 <li>Peningkatan akuntabilitas pemeliharaan peralatan dan jaringan penyediaan logistik untuk efektivitas penanganan masa krisis dan darurat bencana</li>
                                 <li>Penguatan Cadangan Pasokan Listrik Alternatif untuk Penanganan Bencana dalam Kondisi Terburuk</li>
                                 <li>Pemenuhan Kebutuhan Pangan untuk Kondisi Bencana</li>
                             </ul>
                         </div>

                         {/* Priority 4 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li>Penerapan Peraturan Daerah tentang Rencana Tata Ruang Wilayah untuk Pengurangan Risiko Bencana</li>
                                 <li>Penerapan dan Peningkatan Fungsi Informasi Penataan Ruang Daerah untuk Pengurangan Risiko bencana</li>
                                 <li>Penguatan 3 Pilar Sekolah dan Madrasah Aman Bencana pada Daerah Berisiko</li>
                                 <li>Penguatan 4 Modul Safety Hospital pada Rumah Sakit dan Puskesmas Aman Bencana pada Daerah Berisiko</li>
                                 <li>Replikasi Mandiri Destana ke Desa Tetangga</li>
                             </ul>
                         </div>

                         {/* Priority 5 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li>Pengurangan Frekuensi dan Dampak Bencana Banjir melalui Penerapan Sumur Resapan dan Biopori</li>
                                 <li>Pengurangan Frekuensi dan Dampak Bencana Banjir melalui Perlindungan Daerah Tangkapan Air</li>
                                 <li>Pengurangan Frekuensi dan Dampak Bencana Banjir melalui Restorasi Sungai</li>
                                 <li>Pengurangan Frekuensi dan Dampak Bencana Tanah Longsor melalui Penguatan Lereng</li>
                                 <li>Penerapan Aturan Daerah tentang Pemanfaatan dan Pengelolaan Air Permukaan untuk Pengurangan Risiko Bencana Kekeringan</li>
                                 <li>Penguatan Aturan Daerah tentang Pengembangan Sistem Pengelolaan dan Pemantauan Area Hulu DAS untuk Deteksi dan Pencegahan Bencana Banjir Bandang</li>
                                 <li>Penegakan Hukum untuk pelanggaran penerapan IMB khususnya bangunan tahan gempabumi</li>
                                 <li>Pembangunan/Revitalisasi tanggul, embung, waduk dan taman kota di daerah berisiko banjir</li>
                                 <li>Pengurangan Frekuensi dan Dampak Bencana Tanah Longsor melalui konservasi vegetatif DAS</li>
                             </ul>
                         </div>

                         {/* Priority 6 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li>Penguatan Kesiapsiagaan menghadapi bencana Gempabumi melalui Perencanaan Kontijensi</li>
                                 <li>Penguatan Kapasitas Tata Kelola dan Sumberdaya untuk Penanganan Darurat bencana Banjir berdasarkan Perencanaan Kontijensi</li>
                                 <li>Penguatan Sistem Peringatan Dini Bencana Banjir Daerah</li>
                                 <li>Penguatan Kesiapsiagaan menghadapi bencana Tanah Longsor melalui Perencanaan Kontijensi</li>
                                 <li>Peningkatan Validitas Kejadian dan Rentang Informasi Perintah Evakuasi Kejadian Bencana Tanah Longsor</li>
                                 <li>Penguatan Kesiapsiagaan menghadapi bencana Kebakaran Hutan dan Lahan melalui Perencanaan Kontijensi</li>
                                 <li>Penguatan Sistem Peringatan Dini Bencana Kebakaran Hutan dan Lahan Daerah</li>
                                 <li>Penguatan Kapasitas Tata Kelola dan Sumberdaya untuk Penanganan Darurat bencana erupsi gunungapi berdasarkan Perencanaan Kontijensi</li>
                                 <li>Penguatan Sistem Peringatan Dini Bencana erupsi gunungapi Daerah</li>
                                 <li>Penguatan Kapasitas dan Sarana Prasarana Evakuasi Masyarakat untuk Bencana Erupsi Gunungapi</li>
                                 <li>Penguatan Kesiapsiagaan menghadapi bencana Kekeringan melalui Perencanaan Kontijensi</li>
                                 <li>Penguatan Sistem Peringatan Dini Bencana Kekeringan Daerah</li>
                                 <li>Penguatan Kesiapsiagaan menghadapi bencana Banjir Bandang melalui Perencanaan Kontijensi</li>
                                 <li>Penguatan Sistem Peringatan Dini Bencana Banjir Bandang Daerah</li>
                                 <li>Penetapan Status Darurat Bencana</li>
                                 <li>Penguatan Mekanisme Sistem Komando Tanggap Darurat Bencana</li>
                                 <li>Pelaksanaan Kaji Cepat untuk Penetapan Status Darurat Bencana</li>
                                 <li>Pelaksanaan Penyelamatan dan Pertolongan Korban pada Masa Krisis</li>
                                 <li>Penguatan Kebijakan dan Mekanisme Perbaikan Darurat Bencana</li>
                                 <li>Pengerahan bantuan Kemanusiaan saat darurat bencana hingga Masyarakat terjauh sesuai dengan mekanisme</li>
                                 <li>Penghentian Status Darurat Bencana</li>
                             </ul>
                         </div>

                         {/* Priority 7 */}
                         <div className="bg-orange-50 p-2 text-[9px] text-slate-700 border border-orange-100 min-h-[300px]">
                             <ul className="list-disc pl-3 space-y-2">
                                 <li>Perencanaan Pemulihan Pelayanan Dasar Pemerintah Pasca Bencana</li>
                                 <li>Perencanaan Pemulihan infrastruktur penting Pasca Bencana</li>
                                 <li>Perbaikan Rumah Penduduk Pasca Bencana</li>
                                 <li>Pemulihan Penghidupan Masyarakat Pasca Bencana dengan Berorientasi pada Pengurangan Risiko Bencana baru</li>
                             </ul>
                         </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 pt-8 pb-4">
                Data Source: inaRISK BNPB (Replicated View)
            </div>
        </div>
    </div>
  );
}
