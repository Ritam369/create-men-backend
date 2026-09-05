import * as postService from "./post.service.js";
import ApiResponse from "../../common/utils/api-response.js";

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.body);
    return ApiResponse.created(res, "Post created successfully", post);
  } catch (err) {
    next(err);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const data = await postService.getPosts({ page, limit });
    return ApiResponse.ok(res, "Posts fetched successfully", data);
  } catch (err) {
    next(err);
  }
};

const getPost = async (req, res, next) => {
  try {
    const post = await postService.getPostByIdOrSlug(req.params.idOrSlug);
    return ApiResponse.ok(res, "Post fetched successfully", post);
  } catch (err) {
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.params.idOrSlug, req.body);
    return ApiResponse.ok(res, "Post updated successfully", post);
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await postService.deletePost(req.params.idOrSlug);
    return ApiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
};

export { createPost, getPosts, getPost, updatePost, deletePost };
