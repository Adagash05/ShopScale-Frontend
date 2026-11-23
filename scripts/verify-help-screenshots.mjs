// Checks the screenshot files: every shot in src/help/shots.js exists, is a real PNG, is large enough to be readable and is not
// (nearly) blank. With --dist it also checks that the images were copied into the production build.
//   node scripts/verify-help-screenshots.mjs [--dist]      (run `npm run build` first for --dist)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHOTS } from '../src/help/shots.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const dirs = [['public/help/shots', path.join(here, '../public/help/shots')]]
if (process.argv.includes('--dist')) dirs.push(['dist/help/shots', path.join(here, '../dist/help/shots')])
let bad = 0
for (const [label, dir] of dirs) {
  let ok = 0
  for (const s of SHOTS) {
    const f = path.join(dir, s.id + '.png')
    if (!fs.existsSync(f)) { console.log(`MISSING  ${label}/${s.id}.png`); bad++; continue }
    const b = fs.readFileSync(f)
    const png = b.length > 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString('ascii', 12, 16) === 'IHDR'
    const w = png ? b.readUInt32BE(16) : 0, h = png ? b.readUInt32BE(20) : 0
    const jf = path.join(dir, s.id + '.json')
    if (fs.existsSync(jf)) { try { const j = JSON.parse(fs.readFileSync(jf, 'utf8')); if (!(j.vw > 0 && j.vh > 0 && j.box && j.box.w > 0 && j.box.h > 0)) throw new Error('bad shape'); if (png && Math.abs(w / h - j.vw / j.vh) > 0.02) throw new Error('does not match the image size') } catch (e) { console.log(`BAD OUTLINE DATA  ${label}/${s.id}.json (${e.message})`); bad++ } }
    else if (s.highlight && label === 'public/help/shots') console.log(`note: ${s.id} has no outline data (.json); it will show without an outline`)
    if (!png) { console.log(`NOT A PNG  ${label}/${s.id}.png`); bad++ } else if (w < 600 || h < 400) { console.log(`TOO SMALL  ${label}/${s.id}.png (${w}x${h})`); bad++ } else if (b.length < 12000) { console.log(`LOOKS BLANK  ${label}/${s.id}.png (${b.length} bytes)`); bad++ } else ok++
  }
  console.log(`${label}: ${ok} of ${SHOTS.length} screenshots are present and look valid`)
}
console.log(bad ? `\n${bad} problem(s).` : '\nAll screenshots present. Now open them and check each one by eye: right screen, demo data only, nothing cut off.')
process.exit(bad ? 1 : 0)
