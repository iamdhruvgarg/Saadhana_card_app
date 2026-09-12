/**
 * Scan Vani Syllabus directory and generate lecture data with exact durations.
 * 
 * Usage: node scripts/generateVaniData.mjs
 * Output: src/data/vaniSyllabus.js
 */
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join, extname, basename, relative } from 'node:path';
import { parseFile } from 'music-metadata';

const VANI_ROOT = 'C:\\Users\\maste\\Desktop\\HareKrishna\\9. Working Vani Syllabus';
const OUTPUT_PATH = join(process.cwd(), 'src', 'data', 'vaniSyllabus.js');
const AUDIO_EXTS = new Set(['.mp3', '.mp4', '.wav', '.m4a', '.flac', '.ogg', '.wma', '.aac', '.mkv', '.avi', '.mov']);

function sanitizeId(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

async function getAudioDuration(filePath) {
  try {
    const metadata = await parseFile(filePath, { duration: true, skipCovers: true });
    return metadata.format.duration || 0;
  } catch (err) {
    console.warn(`  ⚠ Could not read metadata: ${basename(filePath)} — ${err.message}`);
    // Fallback: estimate from file size (128kbps MP3)
    try {
      const info = await stat(filePath);
      const ext = extname(filePath).toLowerCase();
      const bitrate = ext === '.mp4' || ext === '.mkv' || ext === '.avi' || ext === '.mov'
        ? 500000 // ~500kbps for video
        : 128000; // ~128kbps for audio
      return (info.size * 8) / bitrate;
    } catch {
      return 0;
    }
  }
}

async function scanDirectory(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const dirs = [];
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(entry.name);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (AUDIO_EXTS.has(ext)) {
        files.push(entry.name);
      }
    }
  }

  dirs.sort();
  files.sort();

  return { dirs, files };
}

async function processFolder(folderPath, folderId, folderLabel) {
  const { dirs, files } = await scanDirectory(folderPath);
  
  const lectures = [];
  let sn = 1;

  // Process files in this folder
  for (const file of files) {
    const filePath = join(folderPath, file);
    const ext = extname(file);
    const name = basename(file, ext);
    
    console.log(`    [${sn}] ${name}`);
    
    const durationSec = await getAudioDuration(filePath);
    const info = await stat(filePath);
    
    lectures.push({
      id: `${folderId}-${String(sn).padStart(3, '0')}`,
      sn,
      filename: file,
      name,
      durationSec: Math.round(durationSec),
      duration: formatDuration(durationSec),
      sizeMB: Math.round(info.size / (1024 * 1024) * 10) / 10,
    });
    sn++;
  }

  // Process subdirectories (nested folders)
  const subfolders = [];
  for (const dir of dirs) {
    // Skip 'Notes' or other non-lecture dirs
    if (dir.toLowerCase() === 'notes') continue;
    
    const subPath = join(folderPath, dir);
    const subId = `${folderId}-${sanitizeId(dir)}`;
    console.log(`  📂 Subfolder: ${dir}`);
    
    const subResult = await processFolder(subPath, subId, dir);
    if (subResult.lectures.length > 0 || subResult.subfolders?.length > 0) {
      subfolders.push(subResult);
    }
  }

  return {
    id: folderId,
    label: folderLabel,
    lectures,
    ...(subfolders.length > 0 ? { subfolders } : {}),
  };
}

async function main() {
  console.log('🔍 Scanning Vani Syllabus directory...\n');
  
  const { dirs: levelDirs } = await scanDirectory(VANI_ROOT);
  const levels = [];

  for (const levelDir of levelDirs) {
    const levelPath = join(VANI_ROOT, levelDir);
    const levelId = sanitizeId(levelDir);
    console.log(`\n📁 ${levelDir}`);

    const { dirs: folderDirs } = await scanDirectory(levelPath);
    const folders = [];

    for (const folderDir of folderDirs) {
      const folderPath = join(levelPath, folderDir);
      const folderId = `${levelId}-${sanitizeId(folderDir)}`;
      console.log(`\n  📂 ${folderDir}`);

      const folderData = await processFolder(folderPath, folderId, folderDir);
      folders.push(folderData);
    }

    levels.push({
      id: levelId,
      label: levelDir,
      folders,
    });
  }

  // Count totals
  let totalLectures = 0;
  function countLectures(folder) {
    totalLectures += folder.lectures.length;
    if (folder.subfolders) {
      folder.subfolders.forEach(countLectures);
    }
  }
  levels.forEach(l => l.folders.forEach(countLectures));

  // Generate output
  const output = `/* ═══════════════════════════════════════════════════════════
   Vani Syllabus — Lecture Data (Auto-generated)
   Total: ${totalLectures} lectures across ${levels.length} levels
   Generated: ${new Date().toISOString()}
   
   DO NOT EDIT MANUALLY — regenerate with:
   node scripts/generateVaniData.mjs
   ═══════════════════════════════════════════════════════════ */

export const VANI_LEVELS = ${JSON.stringify(levels, null, 2)};

export const TOTAL_LECTURES = ${totalLectures};
`;

  await writeFile(OUTPUT_PATH, output, 'utf-8');
  console.log(`\n✅ Generated ${OUTPUT_PATH}`);
  console.log(`   ${totalLectures} lectures across ${levels.length} levels`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
