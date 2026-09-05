import mongoose from "mongoose";

import Post from "./post.model.js";
import ApiError from "../../common/utils/api-error.js";

const toSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const findByIdOrSlug = (idOrSlug) =>
  mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

const createPost = async (body) => {
  const post = await Post.create({ ...body, slug: toSlug(body.title) });
  return post;
};

const getPosts = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Post.countDocuments(),
  ]);
  return { posts, total, page, pages: Math.ceil(total / limit) };
};

const getPostByIdOrSlug = async (idOrSlug) => {
  const post = await Post.findOne(findByIdOrSlug(idOrSlug)).lean();
  if (!post) throw ApiError.notFound("Post not found");
  return post;
};

const updatePost = async (idOrSlug, body) => {
  const post = await Post.findOneAndUpdate(findByIdOrSlug(idOrSlug), body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!post) throw ApiError.notFound("Post not found");
  return post;
};

const deletePost = async (idOrSlug) => {
  const post = await Post.findOneAndDelete(findByIdOrSlug(idOrSlug)).lean();
  if (!post) throw ApiError.notFound("Post not found");
};

export { createPost, getPosts, getPostByIdOrSlug, updatePost, deletePost };
