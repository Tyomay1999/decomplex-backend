import fs from "node:fs";
import path from "node:path";

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

const root = process.cwd();

const pairs = [
  ["src/database/migrations", "dist/database/migrations"],
  ["src/database/seeders", "dist/database/seeders"],
];

for (const [srcRel, destRel] of pairs) {
  const src = path.resolve(root, srcRel);
  const dest = path.resolve(root, destRel);
  if (fs.existsSync(src)) copyDir(src, dest);
}
