# Orion Intelligence - Banjarnegara Command

Orion Intelligence is a comprehensive geographic information system (GIS) and disaster monitoring dashboard designed for the Banjarnegara region. The application integrates real-time Early Warning System (EWS) data, public reports, and spatial analysis to provide actionable insights for disaster management.

## Key Features

- **Explorer Dashboard**: Interactive map with multiple layers including village boundaries, rivers, irrigation, roads, and topography (elevation contours).
- **Live Monitor**: Real-time monitoring of EWS nodes (Flood and Landslide sensors) with live data streaming and status alerts.
- **Analytics Suite**: Spatial risk analysis tools including hotspot identification, infrastructure vulnerability, and village-level risk profiles using Turf.js.
- **Public Reporting**: A dedicated mobile-friendly interface for citizens to report disasters with GPS coordinates and photo evidence.
- **Admin Panel**: Backend management system for validating and managing public reports.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Mapping**: Leaflet & React-Leaflet
- **Spatial Engine**: Turf.js
- **Database ORM**: Prisma
- **Database Engine**: SQLite (Local file-based storage)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React & FontAwesome

## Project Structure

- `/src/app`: Next.js App Router pages and API routes.
- `/src/components`: Reusable UI components for the various dashboards.
- `/src/lib`: Shared utilities, including Prisma client and database helpers.
- `/public/data`: GeoJSON datasets used for spatial rendering.
- `/prisma`: Database schema and SQLite database file.

## Configuration

The application is configured to run in a subdirectory (`/sungai`). This is managed in `next.config.ts` via the `basePath` and `assetPrefix` settings.

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- NPM or Yarn

### Installation

1. Clone the repository:
   git clone https://github.com/diskonnekted/OrionVersa-Dashboard-Pro.git sungai

2. Install dependencies:
   npm install

3. Initialize the database:
   npx prisma db push
   npx prisma generate

### Running the Application

Start the development server:
npm run dev

Access the application at: http://localhost:3000/sungai

## API Endpoints

- GET/POST `/sungai/api/ews/push`: Manage Early Warning System node data.
- GET/POST `/sungai/api/reports`: Manage public disaster reports.
- GET `/sungai/api/locations`: Retrieve spatial markers for the dashboard.

## Database Migration (MySQL to SQLite)

The system has been migrated from MySQL to SQLite to allow for easier local deployment and zero-configuration environment setup. All data is stored in `prisma/dev.db`.

## License

This project is private and intended for the Banjarnegara Command center.
