import { readdir, stat, writeFile, rename } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = join(process.cwd(), 'dist', 'media');
const KB = 1024;

const profiles = [
  { test: /\/social\//, maxWidth: 1200, maxHeight: 630, budget: 400 * KB },
  { test: /\/home\/hero-background\./, maxWidth: 2400, maxHeight: 1600, budget: 320 * KB },
  { test: /\/home\/hero-poster\./, maxWidth: 1600, maxHeight: 2000, budget: 400 * KB },
  { test: /\/services\/[^/]+\/card\./, maxWidth: 1600, maxHeight: 1000, budget: 220 * KB },
  { test: /\/services\/[^/]+\/detail\./, maxWidth: 1920, maxHeight: 1080, budget: 420 * KB },
  { test: /\/before-after\//, maxWidth: 1800, maxHeight: 1800, budget: 450 * KB },
  { test: /\/about\//, maxWidth: 1600, maxHeight: 2000, budget: 400 * KB },
  { test: /\/location\//, maxWidth: 1800, maxHeight: 1200, budget: 400 * KB },
  { test: /\/brand\//, maxWidth: 1120, maxHeight: 1120, budget: 180 * KB }
];

const fallbackProfile = { maxWidth: 2000, maxHeight: 2000, budget: 500 * KB };
const qualities = [88, 84, 80, 76, 72, 68];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
};

const profileFor = (file) => {
  const normalized = file.replaceAll('\\', '/');
  return profiles.find((profile) => profile.test.test(normalized)) ?? fallbackProfile;
};

const encode = async (input, extension, quality) => {
  if (extension === '.jpg' || extension === '.jpeg') {
    return input.clone().jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
  }
  return input.clone().webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
};

const createHeroMobileVariant = async () => {
  const input = join(ROOT, 'home', 'hero-background.webp');
  const output = join(ROOT, 'home', 'hero-background-mobile.webp');

  try {
    await stat(input);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  const pipeline = sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: 1200, height: 800, fit: 'inside', withoutEnlargement: true });

  let buffer;
  for (const quality of [82, 78, 74, 70, 66]) {
    buffer = await pipeline.clone().webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
    if (buffer.length <= 160 * KB) break;
  }

  if (buffer) {
    await writeFile(output, buffer);
    console.log(`${relative(process.cwd(), output)}: generated ${Math.round(buffer.length / KB)} KB responsive hero`);
  }
};

const optimize = async (file) => {
  const extension = extname(file).toLowerCase();
  if (!['.webp', '.jpg', '.jpeg'].includes(extension)) return null;

  const profile = profileFor(file);
  const before = await stat(file);
  const source = sharp(file, { failOn: 'error' }).rotate();
  const metadata = await source.metadata();
  const needsResize = (metadata.width ?? 0) > profile.maxWidth || (metadata.height ?? 0) > profile.maxHeight;
  if (before.size <= profile.budget && !needsResize) return { before: before.size, after: before.size, skipped: true };

  const pipeline = needsResize
    ? source.resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
    : source;

  let output;
  for (const quality of qualities) {
    output = await encode(pipeline, extension, quality);
    if (output.length <= profile.budget) break;
  }

  if (!output || output.length >= before.size) return { before: before.size, after: before.size, skipped: true };

  const temporary = `${file}.optimized`;
  await writeFile(temporary, output);
  await rename(temporary, file);
  return { before: before.size, after: output.length, skipped: false };
};

let files;
try {
  await createHeroMobileVariant();
  files = await walk(ROOT);
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.log('No dist/media directory found; skipping media optimization.');
    process.exit(0);
  }
  throw error;
}

let beforeTotal = 0;
let afterTotal = 0;
let optimizedCount = 0;

for (const file of files) {
  const result = await optimize(file);
  if (!result) continue;
  beforeTotal += result.before;
  afterTotal += result.after;
  if (!result.skipped) {
    optimizedCount += 1;
    const saved = Math.round((1 - result.after / result.before) * 100);
    console.log(`${relative(process.cwd(), file)}: ${Math.round(result.before / KB)} KB -> ${Math.round(result.after / KB)} KB (${saved}% smaller)`);
  }
}

const savedBytes = beforeTotal - afterTotal;
console.log(`Optimized ${optimizedCount} image(s); saved ${Math.round(savedBytes / KB)} KB in deployment output.`);
