"use client";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function InaRiskChart() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 33 is Central Java, 04 is Banjarnegara code
    fetch("/sungai/api/proxy/inarisk?path=infografis_chart_new/33/04")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch inaRISK data", err);
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (!data || !data.data) return null;

  // Transform data for chart
  // Data structure from API: data.data is an array of objects
  // Each object has: { index_name: "Banjir", exposed: 1234, not_exposed: 5678, ... }
  
  const labels = data.data.map((item: any) => item.index_name);
  const exposed = data.data.map((item: any) => item.exposed || 0);
  const notExposed = data.data.map((item: any) => item.not_exposed || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Jiwa Terpapar",
        data: exposed,
        backgroundColor: "#ef4444",
      },
      {
        label: "Jiwa Tidak Terpapar",
        data: notExposed,
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            font: { size: 10 },
            boxWidth: 10
        }
      },
      title: {
        display: true,
        text: 'Risiko Bencana (Jiwa)',
        font: { size: 12 }
      },
    },
    scales: {
        x: { stacked: true, ticks: { font: { size: 9 } } },
        y: { stacked: true, ticks: { font: { size: 9 } } }
    }
  };

  return (
    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 mt-2">
      <Bar options={options} data={chartData} height={300} />
      <div className="mt-2 text-[9px] text-slate-400 text-center">Sumber: inaRISK BNPB</div>
    </div>
  );
}
