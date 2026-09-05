#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";

import { generate } from "./lib/generate.js";

const VERSION = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf8")
).version;
const MEDIA_CHOICES = ["none", "cloudinary", "imagekit"];

const HELP = `
create-men-backend · scaffold a MongoDB + Express + Node backend

Usage
  pnpm create men-backend [dir]
  bunx create-men-backend [dir]      (same as: npx create-men-backend [dir])

Options
  [dir]             Target directory (default: ./backend, prompted when omitted)
  --atlas           MongoDB Atlas — SRV connection string lives in .env
  --docker          Local MongoDB via docker-compose.yml (+ db:up / db:down scripts)
  --media <choice>  none | cloudinary | imagekit
  --cloudinary      shorthand for --media cloudinary
  --imagekit        shorthand for --media imagekit
  -h, --help        show help
  -v, --version     show version

Examples
  pnpm create men-backend
  pnpm create men-backend ./server --docker --cloudinary
  bunx create-men-backend my-api --atlas --imagekit
`.trim();

function parseArgs(argv) {
  const args = {
    dir: null,
    atlas: false,
    docker: false,
    media: null,
    help: false,
    version: false,
    unknown: null,
    extra: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "-v" || arg === "--version") args.version = true;
    else if (arg === "--atlas") args.atlas = true;
    else if (arg === "--docker") args.docker = true;
    else if (arg === "--media") args.media = argv[++i] ?? null;
    else if (arg === "--cloudinary") args.media = "cloudinary";
    else if (arg === "--imagekit") args.media = "imagekit";
    else if (arg.startsWith("-")) args.unknown = arg;
    else if (args.dir === null) args.dir = arg;
    else args.extra.push(arg);
  }
  return args;
}

function detectPackageManager() {
  const ua = process.env.npm_config_user_agent || "";
  const pm = ua.split("/")[0];
  return ["pnpm", "yarn", "bun", "npm"].includes(pm) ? pm : "npm";
}

function runCommand(pm, script) {
  return pm === "npm" ? `npm run ${script}` : `${pm} ${script}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.version) {
    console.log(VERSION);
    return;
  }

  if (args.unknown) {
    console.error(`Unknown option: ${args.unknown}\n\n${HELP}`);
    process.exit(1);
  }
  if (args.extra.length > 0) {
    console.error(
      `Unexpected extra argument(s): ${args.extra.join(" ")}\nOnly one target directory is expected.\n`
    );
    process.exit(1);
  }
  if (args.atlas && args.docker) {
    console.error("Choose either --atlas or --docker, not both.");
    process.exit(1);
  }
  if (args.media != null && !MEDIA_CHOICES.includes(args.media)) {
    console.error(
      `Invalid --media value "${args.media}". Valid values: ${MEDIA_CHOICES.join(" | ")}`
    );
    process.exit(1);
  }

  const db = args.atlas ? "atlas" : args.docker ? "docker" : null;

  const missing = [];
  if (!args.dir) missing.push("target directory");
  if (!db) missing.push("MongoDB option (--atlas | --docker)");
  if (!args.media) missing.push("media option (--media none|cloudinary|imagekit)");

  const interactive = missing.length > 0;

  if (interactive && !process.stdin.isTTY) {
    console.error("Some choices are missing and interactive prompts need a terminal.");
    console.error(`Missing: ${missing.join(", ")}`);
    console.error("\nRun with all options instead, e.g.:");
    console.error("  pnpm create men-backend ./backend --docker --cloudinary");
    process.exit(1);
  }

  let targetDir = args.dir;
  let dbChoice = db;
  let mediaChoice = args.media;

  if (interactive) {
    p.intro(`create-men-backend ${VERSION}`);

    if (!targetDir) {
      const answer = await p.text({
        message: "Where should the backend be created?",
        placeholder: "./backend",
        defaultValue: "backend",
        validate(value) {
          if (!value || !value.trim()) return "Please enter a directory path.";
        },
      });
      if (p.isCancel(answer)) return p.cancel("Operation cancelled.");
      targetDir = answer;
    }

    if (!dbChoice) {
      const answer = await p.select({
        message: "How do you want to run MongoDB?",
        options: [
          {
            value: "atlas",
            label: "MongoDB Atlas",
            hint: "cloud cluster — SRV connection string in .env",
          },
          {
            value: "docker",
            label: "Docker (local)",
            hint: "docker-compose.yml + db:up / db:down scripts",
          },
        ],
      });
      if (p.isCancel(answer)) return p.cancel("Operation cancelled.");
      dbChoice = answer;
    }

    if (!mediaChoice) {
      const answer = await p.select({
        message: "Which media / file-storage integration?",
        options: [
          {
            value: "none",
            label: "None",
            hint: "no image SDK — can be added later",
          },
          {
            value: "cloudinary",
            label: "Cloudinary",
            hint: "src/common/config/cloudinary.js",
          },
          {
            value: "imagekit",
            label: "ImageKit",
            hint: "src/common/config/imagekit.js + multer",
          },
        ],
      });
      if (p.isCancel(answer)) return p.cancel("Operation cancelled.");
      mediaChoice = answer;
    }
  }

  const resolved = path.resolve(process.cwd(), targetDir);

  if (fs.existsSync(resolved) && fs.readdirSync(resolved).length > 0) {
    if (!interactive) {
      console.log(
        `Note: ${targetDir} exists and is not empty — files will be overwritten.`
      );
    } else {
      const proceed = await p.confirm({
        message: `${targetDir} exists and is not empty. Files may be overwritten. Continue?`,
      });
      if (p.isCancel(proceed) || !proceed) return p.cancel("Operation cancelled.");
    }
  }

  const pm = detectPackageManager();
  generate(resolved, {
    name: path.basename(resolved),
    db: dbChoice,
    media: mediaChoice,
    pm,
  });

  const steps = [
    `cd ${targetDir}`,
    pm === "npm" ? "npm install" : `${pm} install`,
    "cp .env.example .env    # then fill in the values",
  ];
  if (dbChoice === "docker") steps.push(runCommand(pm, "db:up"));
  steps.push(runCommand(pm, "dev"));

  if (interactive) {
    p.log.success(`Backend created at ${targetDir}`);
    p.log.info(`MongoDB: ${dbChoice} · Media: ${mediaChoice}`);
    p.note(steps.join("\n"), "Next steps");
    p.outro("Done — happy building!");
  } else {
    console.log(`✔ Backend created at ${targetDir}`);
    console.log(`  MongoDB: ${dbChoice} · Media: ${mediaChoice}\n`);
    console.log("Next steps:");
    for (const step of steps) console.log(`  ${step}`);
  }
}

main().catch((err) => {
  console.error("Something went wrong while generating the backend:");
  console.error(err);
  process.exit(1);
});
