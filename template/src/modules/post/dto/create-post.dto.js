import Joi from "joi";

import BaseDto from "../../../common/dto/base.dto.js";

class CreatePostDto extends BaseDto {
  static schema = Joi.object({
    title: Joi.string().min(3).max(120).required(),
    content: Joi.string().min(1).required(),
    tags: Joi.array().items(Joi.string().trim().lowercase()).default([]),
    published: Joi.boolean().default(false),
  });
}

export default CreatePostDto;
