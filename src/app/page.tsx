import MapWrapper from "@/components/MapWrapper";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-slate-50 overflow-hidden flex flex-col m-0 p-0 border-none">
      {/* Container utama tanpa padding/margin agar benar-benar full screen */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        <MapWrapper />
      </div>
    </main>
  );
}
