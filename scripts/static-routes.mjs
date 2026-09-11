import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
const directory = process.argv[2] ?? "dist";
const html = await readFile(join(directory, "index.html"));
for (const route of ["studio", "dream", "horizon", "phosphor", "obsidian"]) {
  await mkdir(join(directory, route), { recursive: true });
  await writeFile(join(directory, route, "index.html"), html);
}
