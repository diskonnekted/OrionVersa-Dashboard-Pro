import fs from "fs";
import path from "path";
import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
const INPUT_DIR = path.join(PROJECT_ROOT, "public", "perlengkapan");
const BACKUP_DIR = path.join(PROJECT_ROOT, "public", "perlengkapan_original");

const TARGET_SIZE = 300;
const JPEG_QUALITY = 70;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png";
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

async function optimizeOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const rel = path.relative(INPUT_DIR, filePath);
  const backupPath = path.join(BACKUP_DIR, rel);

  ensureDir(path.dirname(backupPath));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  const beforeStat = fs.statSync(filePath);

  const tmpPath = `${filePath}.tmp`;

  let pipeline = sharp(filePath).rotate().resize(TARGET_SIZE, TARGET_SIZE, {
    fit: "cover",
    position: "centre",
  });

  if (ext === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  }

  await pipeline.toFile(tmpPath);

  const afterStat = fs.statSync(tmpPath);
  fs.renameSync(tmpPath, filePath);

  return { before: beforeStat.size, after: afterStat.size };
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`Folder tidak ditemukan: ${INPUT_DIR}`);
    process.exit(1);
  }

  ensureDir(BACKUP_DIR);

  const files = walkFiles(INPUT_DIR).filter((f) => isImageFile(f));
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let failed = 0;
  const failedFiles = [];

  for (const filePath of files) {
    try {
      const { before, after } = await optimizeOne(filePath);
      totalBefore += before;
      totalAfter += after;
      processed += 1;
      if (processed % 200 === 0) {
        console.log(`Processed ${processed}/${files.length}...`);
      }
    } catch (e) {
      failed += 1;
      failedFiles.push(path.relative(INPUT_DIR, filePath));
    }
  }

  console.log(`Done.`);
  console.log(`Images processed: ${processed}/${files.length}`);
  console.log(`Failed: ${failed}`);
  if (failedFiles.length) {
    console.log(`Failed files (relative):`);
    for (const f of failedFiles.slice(0, 20)) console.log(`- ${f}`);
    if (failedFiles.length > 20) console.log(`...and ${failedFiles.length - 20} more`);
  }
  console.log(`Total before: ${formatBytes(totalBefore)}`);
  console.log(`Total after : ${formatBytes(totalAfter)}`);
  console.log(
    `Saved      : ${formatBytes(Math.max(0, totalBefore - totalAfter))}`
  );
  console.log(`Backup folder: ${BACKUP_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
