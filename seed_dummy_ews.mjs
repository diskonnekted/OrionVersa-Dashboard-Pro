import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  console.log("Cleaning old dummy data...");
  await prisma.ewsNode.deleteMany({});
  await prisma.ews_stations.deleteMany({});

  const dummyStations = [
    {
      id: "SN-FLOOD-SERAYU-01",
      name: "EWS Serayu Hulu",
      type: "flood",
      lat: -7.4012,
      lng: 109.6925,
      location: "Bantaran Sungai Serayu, Selamanik",
      desc: "Pemantauan TMA (Tinggi Muka Air) aliran utama Serayu."
    },
    {
      id: "SN-FLOOD-MRICA-02",
      name: "EWS Bendungan Mrica",
      type: "flood",
      lat: -7.3855,
      lng: 109.6352,
      location: "Area Inlet Waduk Mrica",
      desc: "Monitoring potensi luapan waduk."
    },
    {
      id: "SN-LS-PAGENTAN-01",
      name: "EWS Tebing Pagentan",
      type: "landslide",
      lat: -7.2958,
      lng: 109.7554,
      location: "Lereng Desa Aribaya, Pagentan",
      desc: "Sensor ekstensometer untuk pergerakan tanah di pemukiman."
    },
    {
      id: "SN-LS-KARANGKOBAR-02",
      name: "EWS Karangkobar Hill",
      type: "landslide",
      lat: -7.2654,
      lng: 109.7158,
      location: "Zona Merah Leksana, Karangkobar",
      desc: "Pemantauan kemiringan lereng jalan provinsi."
    },
    {
      id: "SN-LS-MADUKARA-03",
      name: "EWS Madukara Cliff",
      type: "landslide",
      lat: -7.3552,
      lng: 109.7221,
      location: "Tebing Clapar, Madukara",
      desc: "Monitoring pergerakan struktur tanah pasca-hujan."
    }
  ];

  console.log("Seeding EWS Stations & Live Nodes...");

  for (const s of dummyStations) {
    // 1. Buat Metadata di ews_stations
    await prisma.ews_stations.create({
      data: {
        name: s.name,
        sensor_code: s.id,
        type: s.type,
        latitude: s.lat,
        longitude: s.lng,
        location: s.location,
        description: s.desc,
        status: "aktif"
      }
    });

    // 2. Buat Live Data di EwsNode
    const history = [];
    for(let i=0; i<20; i++) {
      const time = new Date(Date.now() - (20-i) * 60000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      history.push({ time, value: s.type === 'flood' ? 120 + Math.random()*20 : 2 + Math.random()*5 });
    }

    await prisma.ewsNode.create({
      data: {
        id: s.id,
        type: s.type,
        lastValue: s.type === 'flood' ? 145.5 : 4.2,
        battery: 85 + Math.floor(Math.random()*15),
        wifi: -50 - Math.floor(Math.random()*20),
        cpuTemp: 40 + Math.floor(Math.random()*10),
        ram: "240KB",
        history: JSON.stringify(history)
      }
    });
  }

  console.log("Seed complete! 5 EWS Nodes are now live.");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
