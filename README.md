# men-backend

Scaffolds a **backend-only** MongoDB + Express + Node (MEN) API with a standardized,
module-sliced structure — the same conventions used across my projects: ESM, Express 5,
Mongoose, `common/` cross-cutting layer, feature folders under `modules/`, Joi DTO
validation, `ApiError`/`ApiResponse` envelopes, and a central error handler.

Generated projects run on both **Node (>= 20)** and **Bun**.

## Usage

```bash
npx men-backend [dir]              # via npm
bunx men-backend [dir]             # via bun
pnpm dlx men-backend [dir]         # via pnpm
```

> Previously published as `create-men-backend` (deprecated). Heads-up for pnpm users:
> `pnpm create men-backend` resolves to the old `create-men-backend` package —
> use `pnpm dlx men-backend` instead.

Runs interactively when options are omitted:

```
? Where should the backend be created?  ./backend
? How do you want to run MongoDB?       MongoDB Atlas / Docker (local)
? Which media / file-storage?           None / Cloudinary / ImageKit
```

Or fully non-interactive with flags (works in CI, scripts, non-TTY):

```bash
npx men-backend ./server --docker --cloudinary
bunx men-backend my-api --atlas --imagekit
pnpm dlx men-backend ./backend --atlas --media none
```

| Flag | Description |
| --- | --- |
| `[dir]` | Target directory (default: `./backend`, prompted) |
| `--atlas` | MongoDB Atlas — SRV connection string lives in `.env` |
| `--docker` | Local MongoDB via `docker-compose.yml` (+ `db:up` / `db:down` scripts) |
| `--media <choice>` | `none` \| `cloudinary` \| `imagekit` |
| `--cloudinary` / `--imagekit` | shorthands for `--media …` |
| `-h`, `--help` / `-v`, `--version` | help / version |

At least one of `--atlas` / `--docker` and a `--media` choice are required in
non-interactive mode.

## What gets generated

Always: `server.js`, `src/app.js`, `src/common/` (config, dto, middleware, utils),
`src/modules/health/` (liveness probe), `src/modules/post/` (full example module:
model, dto, service, controller, routes), `.env.example`, `.gitignore`,
`jsconfig.json`, `README.md`, `package.json`.

Per choice:

| Choice | Adds |
| --- | --- |
| **Atlas** | `MONGODB_URI=mongodb+srv://…` placeholder in `.env.example` |
| **Docker** | `docker-compose.yml` (mongo:8.0 + named volume), `db:up`/`db:down` scripts, `MONGO_INITDB_ROOT_*` + local `MONGODB_URI` in `.env.example` |
| **Cloudinary** | `src/common/config/cloudinary.js`, `cloudinary` dep, `CLOUDINARY_*` env keys |
| **ImageKit** | `src/common/config/imagekit.js`, `imagekit` + `multer` deps, `IMAGEKIT_*` env keys |

The generated `README.md` documents the exact structure, env vars, response
conventions, and how to add new modules.

## Generated structure (example: Docker + ImageKit)

```
.
├── .env.example          # per-choice placeholders
├── .gitignore
├── README.md
├── docker-compose.yml    # local MongoDB
├── jsconfig.json
├── package.json
├── server.js             # dotenv → connectDB() → app.listen()
└── src/
    ├── app.js            # cors → parsers → routes → 404 → errorHandler
    ├── common/
    │   ├── config/       # db.js, imagekit.js
    │   ├── dto/          # base.dto.js
    │   ├── middleware/   # error-handler.js, validate.middleware.js
    │   └── utils/        # api-error.js, api-response.js
    └── modules/
        ├── health/       # GET /api/health
        └── post/         # example module — copy this pattern for new features
            ├── dto/      # create-post.dto.js, update-post.dto.js
            ├── post.controller.js
            ├── post.model.js
            ├── post.routes.js
            └── post.service.js
```

## Development (this package)

```bash
npm install
node bin.js /tmp/demo --docker --cloudinary   # test generation locally
```

Layout:

- `bin.js` — CLI: arg parsing, interactive prompts (@clack/prompts), orchestration
- `lib/generate.js` — copies templates + renders decision-aware files
- `lib/render.js` — generators for `package.json`, `.env.example`, `README.md`
- `template/` — base files (ships `.gitignore` as `_gitignore`; npm strips dotfiles)
- `template-docker/` — docker-compose.yml (Docker choice only)
- `template-media/` — cloudinary.js / imagekit.js (media choice only)

To test the exact artifact npm would publish:

```bash
npm pack
npm install -g ./men-backend-<version>.tgz
men-backend /tmp/demo --docker --imagekit
```

## License

MIT
