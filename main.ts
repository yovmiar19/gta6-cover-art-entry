// Vice Cover entry for gta6-cover-art-01 (Node 22, standard library only).
// The app is this repo's app/ folder: plain static files a desktop browser
// loads offline (app/index.html plus its ES modules, no library, no network
// request). This program hands the entry in: it copies app/ and screenshots/
// from beside this file into /output and writes /output/dossier.json, the
// summary the judge reads, using the vendored make.fun library.
//
// Run it locally with MAKEFUN_OUTPUT_DIR set:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's caps, mirrored here so a bad entry fails locally first:
// at most 4 screenshots, each at most 256 KiB; app/ at most 993 files and
// 48 MiB in all; no path under app/ over 1000 bytes. The dossier text is
// capped at 160 KiB by text_max_bytes.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyIntoRepoDir(root, outDir) {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  const shots = join(root, 'screenshots');
  if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

copyIntoRepoDir(repoRoot, outputDir);
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_LIMITS));
