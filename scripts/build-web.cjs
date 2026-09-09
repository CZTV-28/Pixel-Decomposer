const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "www");
const vendor = path.join(output, "vendor");
const paintingFiles = ['paint-tools.js'];
const appFiles = ["index.html", "editor.html", "gif.html", "settings.html", "styles.css", "app.js", "editor.js", "gif.js", "settings.js", "i18n.js", "project-lifecycle.js", "workspace-transfer.js", "chroma.js", "animation-studio.js"];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(vendor, { recursive: true });
for (const file of [...appFiles, ...paintingFiles]) fs.copyFileSync(path.join(root, file), path.join(output, file));

const replacements = [
  ["https://unpkg.com/lucide@0.468.0", "vendor/lucide.js"],
  ["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "vendor/jszip.min.js"],
  ["https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js", "vendor/gif.js"]
];
for (const page of ["index.html", "editor.html", "gif.html", "settings.html"]) {
  const file = path.join(output, page);
  let content = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) content = content.replace(from, to);
  fs.writeFileSync(file, content);
}

const copyVendor = (source, target) => fs.copyFileSync(path.join(root, "node_modules", source), path.join(vendor, target));
copyVendor("lucide/dist/umd/lucide.js", "lucide.js");
copyVendor("jszip/dist/jszip.min.js", "jszip.min.js");
copyVendor("gif.js/dist/gif.js", "gif.js");
copyVendor("gif.js/dist/gif.worker.js", "gif.worker.js");
