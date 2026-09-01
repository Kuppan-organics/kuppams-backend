const JSON_FIELDS = ["framingMethods", "nutritionalBenefits", "variants"];

const parseMultipartJson = (req, res, next) => {
  for (const field of JSON_FIELDS) {
    const value = req.body[field];
    if (typeof value === "string") {
      try {
        req.body[field] = JSON.parse(value);
      } catch {
        // Leave as-is; validator will surface the error.
      }
    }
  }
  next();
};

module.exports = parseMultipartJson;
