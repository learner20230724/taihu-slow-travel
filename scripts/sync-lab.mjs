import {
  readFile,
  writeFile,
  cp,
  stat,
  mkdir,
  symlink,
  rename,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const lab = "/home/ubuntu/apps/guihua-lab";
const card = JSON.parse(
  await readFile(path.join(root, "deploy/lab-card.json"), "utf8"),
);
const source = path.join(lab, "src/App.jsx");
const before = await readFile(source, "utf8");
const row =
  "  { " +
  Object.entries(card)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ") +
  ", icon: Compass },";
let after;
if (
  before.includes(`id: "${card.id}"`) ||
  before.includes(`id: '${card.id}'`)
) {
  const re = new RegExp(`  \\{ id: ["']${card.id}["'][\\s\\S]*? \\},`);
  if (!re.test(before))
    throw new Error(
      "Existing card format changed; inspect it before updating.",
    );
  after = before.replace(re, row);
} else {
  if (!before.includes("const projects = [\n"))
    throw new Error("Navigation project list not found.");
  after = before.replace(
    "const projects = [\n",
    `const projects = [\n${row}\n`,
  );
}
await stat(path.join(root, "test-results/navigation-preview.png"));
await cp(
  path.join(root, "test-results/navigation-preview.png"),
  path.join(lab, "public/assets/taihu-slow-travel.png"),
);
if (after !== before) await writeFile(source, after);
execFileSync("npm", ["run", "build"], { cwd: lab, stdio: "inherit" });
execFileSync("npm", ["run", "test:sites"], { cwd: lab, stdio: "inherit" });
const base = "/var/www/guihua-lab";
await mkdir(path.join(base, "releases"), { recursive: true });
const release = path.join(
  base,
  "releases",
  `taihu-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`,
);
await cp(path.join(lab, "dist/client"), release, { recursive: true });
const pending = path.join(base, `.current-taihu-${process.pid}`);
await symlink(release, pending);
await rename(pending, path.join(base, "current"));
console.log("Navigation published: https://guihualab.cn/");
