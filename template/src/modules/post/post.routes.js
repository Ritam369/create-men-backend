import { Router } from "express";

import validate from "../../common/middleware/validate.middleware.js";
import CreatePostDto from "./dto/create-post.dto.js";
import UpdatePostDto from "./dto/update-post.dto.js";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
} from "./post.controller.js";

const router = Router();

router.route("/").get(getPosts).post(validate(CreatePostDto), createPost);

router
  .route("/:idOrSlug")
  .get(getPost)
  .patch(validate(UpdatePostDto), updatePost)
  .delete(deletePost);

export default router;
