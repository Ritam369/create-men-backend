import { test } from "node:test";
import assert from "node:assert/strict";

import {
  toPackageName,
  renderPackageJson,
  renderEnvExample,
  renderReadme,
} from "../lib/render.js";

test("toPackageName slugifies names", () => {
  assert.equal(toPackageName("My Cool API"), "my-cool-api");
  assert.equal(toPackageName("../weird name!!"), "weird-name");
  assert.equal(toPackageName("---"), "backend");
});

test("cloudinary choice includes cloudinary and multer", () => {
  const pkg = JSON.parse(
    renderPackageJson({ name: "demo", db: "atlas", media: "cloudinary" })
  );
  assert.ok(pkg.dependencies.cloudinary);
  assert.ok(pkg.dependencies.multer, "multer must ship with the cloudinary choice");
  assert.equal(pkg.dependencies.imagekit, undefined);
});

test("imagekit choice includes imagekit and multer", () => {
  const pkg = JSON.parse(
    renderPackageJson({ name: "demo", db: "atlas", media: "imagekit" })
  );
  assert.ok(pkg.dependencies.imagekit);
  assert.ok(pkg.dependencies.multer);
  assert.equal(pkg.dependencies.cloudinary, undefined);
});

test("media none ships no media dependencies", () => {
  const pkg = JSON.parse(
    renderPackageJson({ name: "demo", db: "docker", media: "none" })
  );
  assert.equal(pkg.dependencies.cloudinary, undefined);
  assert.equal(pkg.dependencies.imagekit, undefined);
  assert.equal(pkg.dependencies.multer, undefined);
});

test("docker adds db scripts, atlas does not", () => {
  const docker = JSON.parse(
    renderPackageJson({ name: "demo", db: "docker", media: "none" })
  );
  assert.equal(docker.scripts["db:up"], "docker compose up -d");
  assert.equal(docker.scripts["db:down"], "docker compose down");

  const atlas = JSON.parse(
    renderPackageJson({ name: "demo", db: "atlas", media: "none" })
  );
  assert.equal(atlas.scripts["db:up"], undefined);
});

test("env example varies per choice", () => {
  const docker = renderEnvExample({ name: "demo", db: "docker", media: "none" });
  assert.match(docker, /MONGO_INITDB_ROOT_USERNAME/);
  assert.match(docker, /mongodb:\/\/admin:password@localhost:27017\/demo\?authSource=admin/);

  const atlas = renderEnvExample({ name: "demo", db: "atlas", media: "none" });
  assert.match(atlas, /mongodb\+srv:\/\//);
  assert.doesNotMatch(atlas, /MONGO_INITDB_ROOT/);

  const cloudinary = renderEnvExample({ name: "demo", db: "atlas", media: "cloudinary" });
  assert.match(cloudinary, /CLOUDINARY_CLOUD_NAME/);

  const imagekit = renderEnvExample({ name: "demo", db: "atlas", media: "imagekit" });
  assert.match(imagekit, /IMAGEKIT_PUBLIC_KEY/);
});

test("generated readme documents server-side multer upload for cloudinary", () => {
  const readme = renderReadme({ name: "demo", db: "atlas", media: "cloudinary", pm: "npm" });
  assert.match(readme, /multer/);
  assert.match(readme, /upload_stream/);
  assert.match(readme, /api_sign_request/);
});

test("generated readme keeps imagekit multer snippet", () => {
  const readme = renderReadme({ name: "demo", db: "docker", media: "imagekit", pm: "npm" });
  assert.match(readme, /multer/);
  assert.match(readme, /imagekit\.upload/);
});
