import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderEnvExample, renderPackageJson, renderReadme } from "./render.js";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function generate(targetDir, choices) {
  fs.mkdirSync(targetDir, { recursive: true });

  // npm drops dot-prefixed ignore files from published tarballs, so the
  // template ships it as _gitignore and it is renamed after copying
  fs.cpSync(path.join(pkgRoot, "template"), targetDir, { recursive: true });
  fs.renameSync(path.join(targetDir, "_gitignore"), path.join(targetDir, ".gitignore"));

  if (choices.db === "docker") {
    fs.cpSync(path.join(pkgRoot, "template-docker"), targetDir, { recursive: true });
  }

  if (choices.media === "cloudinary" || choices.media === "imagekit") {
    const fileName = `${choices.media}.js`;
    fs.copyFileSync(
      path.join(pkgRoot, "template-media", fileName),
      path.join(targetDir, "src", "common", "config", fileName)
    );
  }

  const rendered = {
    "package.json": renderPackageJson(choices),
    ".env.example": renderEnvExample(choices),
    "README.md": renderReadme(choices),
  };
  for (const [fileName, content] of Object.entries(rendered)) {
    fs.writeFileSync(path.join(targetDir, fileName), content);
  }
}
