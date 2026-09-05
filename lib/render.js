const DEPENDENCIES = {
  cors: "^2.8.6",
  dotenv: "^17.4.2",
  express: "^5.2.1",
  joi: "^18.2.8",
  mongoose: "^9.9.5",
  cloudinary: "^2.11.0",
  imagekit: "^6.0.0",
  multer: "^2.3.0",
};

export function toPackageName(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "");
  return slug || "backend";
}

export function renderPackageJson({ name, db, media }) {
  const dependencies = {
    cors: DEPENDENCIES.cors,
    dotenv: DEPENDENCIES.dotenv,
    express: DEPENDENCIES.express,
    joi: DEPENDENCIES.joi,
    mongoose: DEPENDENCIES.mongoose,
  };

  if (media === "cloudinary") {
    dependencies.cloudinary = DEPENDENCIES.cloudinary;
  }

  if (media === "imagekit") {
    dependencies.imagekit = DEPENDENCIES.imagekit;
    dependencies.multer = DEPENDENCIES.multer;
  }

  const scripts = {
    dev: "node --watch server.js",
    start: "node server.js",
  };

  if (db === "docker") {
    scripts["db:up"] = "docker compose up -d";
    scripts["db:down"] = "docker compose down";
  }

  const pkg = {
    name: toPackageName(name),
    version: "1.0.0",
    private: true,
    type: "module",
    main: "server.js",
    scripts,
    dependencies,
    engines: {
      node: ">=20",
    },
  };

  return JSON.stringify(pkg, null, 2) + "\n";
}

export function renderEnvExample({ name, db, media }) {
  const dbName = toPackageName(name).replace(/[^a-z0-9]/g, "") || "myapp";

  const lines = [
    "# Server",
    "PORT=5000",
    "NODE_ENV=development",
    "# Frontend origin for CORS — keep it in sync with where the frontend runs,",
    "# or leave it empty to allow all origins (development only)",
    "CLIENT_URL=http://localhost:5173",
    "",
  ];

  if (db === "docker") {
    lines.push(
      "# MongoDB (local Docker) — credentials must match the MONGO_INITDB_ROOT_* values",
      "# below; both are read by docker-compose.yml. Start the database with: db:up script",
      "MONGO_INITDB_ROOT_USERNAME=admin",
      "MONGO_INITDB_ROOT_PASSWORD=password",
      `MONGODB_URI=mongodb://admin:password@localhost:27017/${dbName}?authSource=admin`,
      ""
    );
  } else {
    lines.push(
      "# MongoDB Atlas — Atlas console: Database → Connect → Drivers, paste the SRV string here",
      "MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>",
      ""
    );
  }

  if (media === "cloudinary") {
    lines.push(
      "# Cloudinary — console: Dashboard → Account Details → API Keys",
      "CLOUDINARY_CLOUD_NAME=",
      "CLOUDINARY_API_KEY=",
      "CLOUDINARY_API_SECRET=",
      ""
    );
  }

  if (media === "imagekit") {
    lines.push(
      "# ImageKit — console: Dashboard → Settings → API Keys",
      "IMAGEKIT_PUBLIC_KEY=",
      "IMAGEKIT_PRIVATE_KEY=",
      "IMAGEKIT_URL_ENDPOINT=",
      ""
    );
  }

  return lines.join("\n");
}

function structureTree(db, media) {
  const lines = [
    ".",
    "├── .env.example          # every variable the app reads, per-choice placeholders",
    "├── .gitignore",
    "├── README.md",
  ];
  if (db === "docker") {
    lines.push("├── docker-compose.yml   # local MongoDB (mongo:8.0 + named volume)");
  }
  lines.push(
    "├── jsconfig.json",
    "├── package.json",
    "├── server.js             # entry: dotenv → connectDB() → app.listen()",
    "└── src/",
    "    ├── app.js            # express app: cors → parsers → routes → 404 → errorHandler",
    "    ├── common/"
  );

  if (media === "none") {
    lines.push("    │   ├── config/", "    │   │   └── db.js     # mongoose connection");
  } else {
    lines.push(
      "    │   ├── config/",
      "    │   │   ├── db.js     # mongoose connection",
      `    │   │   └── ${media}.js`
    );
  }

  lines.push(
    "    │   ├── dto/",
    "    │   │   └── base.dto.js",
    "    │   ├── middleware/",
    "    │   │   ├── error-handler.js",
    "    │   │   └── validate.middleware.js",
    "    │   └── utils/",
    "    │       ├── api-error.js",
    "    │       └── api-response.js",
    "    └── modules/",
    "        ├── health/        # GET /api/health — liveness probe",
    "        │   ├── health.controller.js",
    "        │   └── health.routes.js",
    "        └── post/          # example module — the pattern to copy for new features",
    "            ├── dto/",
    "            │   ├── create-post.dto.js",
    "            │   └── update-post.dto.js",
    "            ├── post.controller.js",
    "            ├── post.model.js",
    "            ├── post.routes.js",
    "            └── post.service.js"
  );
  return lines.join("\n");
}

function envTable(db, media) {
  const uriDescription =
    db === "docker"
      ? "Local Docker connection string — matches the compose defaults and `MONGO_INITDB_ROOT_*` below"
      : "MongoDB Atlas SRV connection string";

  const lines = [
    "| Variable | Description |",
    "| --- | --- |",
    "| `PORT` | Port the server listens on (default `5000`) |",
    "| `NODE_ENV` | `development` / `production` — logged at startup |",
    "| `CLIENT_URL` | Frontend origin for CORS — empty allows all origins (development only) |",
    `| \`MONGODB_URI\` | ${uriDescription} |`,
  ];

  if (db === "docker") {
    lines.push(
      "| `MONGO_INITDB_ROOT_USERNAME` | Root user the Mongo container creates on first boot (read by docker-compose.yml) |",
      "| `MONGO_INITDB_ROOT_PASSWORD` | Root password — keep it in sync with `MONGODB_URI` |"
    );
  }
  if (media === "cloudinary") {
    lines.push(
      "| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |",
      "| `CLOUDINARY_API_KEY` | Cloudinary API key |",
      "| `CLOUDINARY_API_SECRET` | Cloudinary API secret |"
    );
  }
  if (media === "imagekit") {
    lines.push(
      "| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |",
      "| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key |",
      "| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint |"
    );
  }
  return lines.join("\n");
}

function mediaSection(media) {
  if (media === "none") return "";

  if (media === "cloudinary") {
    return `
## Cloudinary

The SDK client is configured in \`src/common/config/cloudinary.js\` and reads the
\`CLOUDINARY_*\` variables from the environment.

Signed **direct** upload — the browser uploads straight to Cloudinary, so the server
never touches file bytes (also sidesteps serverless body-size limits):

\`\`\`js
import cloudinary from "../common/config/cloudinary.js";

const signUpload = () => {
  const folder = "my-app";
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET
  );
  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
};

// delete an asset (e.g. in a service when its document is deleted)
await cloudinary.uploader.destroy(publicId);
\`\`\`
`;
  }

  return `
## ImageKit

The SDK client is configured in \`src/common/config/imagekit.js\`; \`multer\` is included
for buffering uploads in memory (no temp files on disk — serverless friendly).

\`\`\`js
import multer from "multer";
import imagekit from "../common/config/imagekit.js";

// in your routes file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
router.post("/", upload.single("coverImage"), createThing);

// in your service
const result = await imagekit.upload({
  file: req.file.buffer,
  fileName: req.file.originalname,
  folder: "/uploads",
  useUniqueFileName: true,
});
// persist result.url (and result.fileId for deletion) on your document
await imagekit.deleteFile(fileId);
\`\`\`
`;
}

function dockerSection(db, pm) {
  if (db !== "docker") return "";

  const up = pm === "npm" ? "npm run db:up" : `${pm} db:up`;
  const down = pm === "npm" ? "npm run db:down" : `${pm} db:down`;

  return `
## Local MongoDB (Docker)

\`docker-compose.yml\` runs a single \`mongo:8.0\` service with a named data volume.
The root credentials come from \`.env\` (\`MONGO_INITDB_ROOT_USERNAME\` /
\`MONGO_INITDB_ROOT_PASSWORD\`, with fallback defaults inside the compose file).

\`\`\`bash
${up}        # docker compose up -d
${down}      # docker compose down (add -v to also drop the data volume)
\`\`\`
`;
}

export function renderReadme({ name, db, media, pm }) {
  const displayName = toPackageName(name);
  const install = pm === "npm" ? "npm install" : `${pm} install`;
  const dev = pm === "npm" ? "npm run dev" : `${pm} dev`;
  const dbUp = pm === "npm" ? "npm run db:up" : `${pm} db:up`;

  const gettingStarted = [
    "```bash",
    `${install}            # or npm install / bun install`,
    "cp .env.example .env    # then fill in your values",
  ];
  if (db === "docker") {
    gettingStarted.push(`${dbUp}         # start the local MongoDB container`);
  }
  gettingStarted.push(
    `${dev}               # http://localhost:5000`,
    "```",
    "",
    "Sanity check: `GET http://localhost:5000/api/health` → `{ \"success\": true, ... }`"
  );

  const scriptsTable = [
    "| Script | Description |",
    "| --- | --- |",
    "| `dev` | Start with watch mode (`node --watch`) |",
    "| `start` | Start for production |",
  ];
  if (db === "docker") {
    scriptsTable.push(
      "| `db:up` | Start the local MongoDB container (docker compose up -d) |",
      "| `db:down` | Stop the local MongoDB container |"
    );
  }

  return `# ${displayName}

Backend API — MongoDB + Express 5 + Node (ESM), generated with \`create-men-backend\`.

## Getting started

${gettingStarted.join("\n")}

## Scripts

${scriptsTable.join("\n")}

## Environment variables

${envTable(db, media)}

## Project structure

\`\`\`
${structureTree(db, media)}
\`\`\`

## Adding a module

Follow the \`post\` module pattern for every new feature — one self-contained folder per
feature under \`src/modules/\`:

1. **\`<feature>.model.js\`** — mongoose schema; default-export the model
2. **\`dto/<action>-<feature>.dto.js\`** — Joi schemas extending \`BaseDto\` (one per endpoint that takes a body)
3. **\`<feature>.service.js\`** — all business logic; throw \`ApiError.notFound()\` / \`badRequest()\` / … on failures; named exports
4. **\`<feature>.controller.js\`** — thin HTTP layer: call the service, respond with \`ApiResponse.ok\` / \`created\` / \`noContent\`; \`try { … } catch (err) { next(err) }\`
5. **\`<feature>.routes.js\`** — \`Router()\`; apply \`validate(SomeDto)\` before handlers that need a validated body; default-export the router
6. Mount it in \`src/app.js\`: \`app.use("/api/<feature>", featureRoutes)\`

Conventions used throughout:

- ESM with explicit \`.js\` import extensions
- Controllers stay thin — services own the business logic
- Validation: DTO classes + \`validate()\` middleware sanitize \`req.body\` (\`stripUnknown: true\`)
- Undefined routes hit the 404 catch-all in \`src/app.js\`

## Response conventions

Success — via \`ApiResponse\` (\`src/common/utils/api-response.js\`):

\`\`\`json
{ "success": true, "message": "Posts fetched successfully", "data": { "…": "…" } }
\`\`\`

Error — thrown \`ApiError\`s (\`src/common/utils/api-error.js\`) are converted to JSON by the
central error handler (\`src/common/middleware/error-handler.js\`):

\`\`\`json
{ "success": false, "message": "Post not found" }
\`\`\`
${mediaSection(media)}${dockerSection(db, pm)}
`;
}
