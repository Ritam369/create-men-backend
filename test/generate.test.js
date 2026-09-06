import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { generate } from "../lib/generate.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "men-backend-test-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function generated(dir, choices) {
  const target = path.join(tmp, dir);
  generate(target, { name: dir, pm: "npm", ...choices });
  return target;
}

test("cloudinary + docker generates the full structure", () => {
  const target = generated("cloud-demo", { db: "docker", media: "cloudinary" });

  for (const file of [
    "server.js",
    "src/app.js",
    "package.json",
    ".env.example",
    ".gitignore",
    "jsconfig.json",
    "README.md",
    "docker-compose.yml",
    "src/common/config/db.js",
    "src/common/config/cloudinary.js",
    "src/common/dto/base.dto.js",
    "src/common/middleware/error-handler.js",
    "src/common/middleware/validate.middleware.js",
    "src/common/utils/api-error.js",
    "src/common/utils/api-response.js",
    "src/modules/health/health.controller.js",
    "src/modules/health/health.routes.js",
    "src/modules/post/post.model.js",
    "src/modules/post/post.service.js",
    "src/modules/post/post.controller.js",
    "src/modules/post/post.routes.js",
    "src/modules/post/dto/create-post.dto.js",
    "src/modules/post/dto/update-post.dto.js",
  ]) {
    assert.ok(fs.existsSync(path.join(target, file)), `missing ${file}`);
  }

  // _gitignore is renamed, and the imagekit config must not leak in
  assert.ok(!fs.existsSync(path.join(target, "_gitignore")));
  assert.ok(!fs.existsSync(path.join(target, "src/common/config/imagekit.js")));

  const pkg = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.ok(pkg.dependencies.cloudinary);
  assert.ok(pkg.dependencies.multer, "multer must ship with the cloudinary choice");
  assert.equal(pkg.dependencies.imagekit, undefined);
  assert.ok(pkg.scripts["db:up"]);
});

test("imagekit + atlas copies imagekit config, no compose file", () => {
  const target = generated("ik-demo", { db: "atlas", media: "imagekit" });
  assert.ok(fs.existsSync(path.join(target, "src/common/config/imagekit.js")));
  assert.ok(!fs.existsSync(path.join(target, "docker-compose.yml")));
  assert.ok(!fs.existsSync(path.join(target, "src/common/config/cloudinary.js")));

  const pkg = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.ok(pkg.dependencies.imagekit);
  assert.ok(pkg.dependencies.multer);
  assert.equal(pkg.scripts["db:up"], undefined);
});

test("media none keeps the config folder minimal", () => {
  const target = generated("plain-demo", { db: "atlas", media: "none" });
  assert.ok(!fs.existsSync(path.join(target, "src/common/config/cloudinary.js")));
  assert.ok(!fs.existsSync(path.join(target, "src/common/config/imagekit.js")));

  const pkg = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.equal(pkg.dependencies.multer, undefined);
  assert.equal(pkg.dependencies.cloudinary, undefined);
  assert.equal(pkg.dependencies.imagekit, undefined);
});
