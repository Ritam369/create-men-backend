import express from "express";
import cors from "cors";

import healthRoutes from "./modules/health/health.routes.js";
import postRoutes from "./modules/post/post.routes.js";
import errorHandler from "./common/middleware/error-handler.js";
import ApiError from "./common/utils/api-error.js";

const app = express();

// when CLIENT_URL is set, only that origin may call the API (with credentials);
// when empty, all origins are allowed — development only
const corsOptions = process.env.CLIENT_URL
  ? { origin: process.env.CLIENT_URL, credentials: true }
  : {};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/posts", postRoutes);

app.all("{*path}", (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

export default app;
