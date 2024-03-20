const { z } = require("zod");

const createChaptersSchema = z.object({
  title: z.string().min(3).max(100),
  units: z.array(z.string()),
});

module.exports = { createChaptersSchema };
