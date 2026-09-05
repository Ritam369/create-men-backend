import ApiResponse from "../../common/utils/api-response.js";

const healthCheck = (req, res) => {
  return ApiResponse.ok(res, "Server is healthy", {
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

export { healthCheck };
