import Joi from "joi";

import BaseDto from "../../../common/dto/base.dto.js";

class UpdatePostDto extends BaseDto {
  static schema = Joi.object({
    title: Joi.string().min(3).max(120),
    content: Joi.string().min(1),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
    published: Joi.boolean(),
  }).min(1);
}

export default UpdatePostDto;
