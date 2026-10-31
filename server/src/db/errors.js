export const isUniqueViolation = (err, constraint) =>
  err.code === "23505" && (!constraint || err.constraint === constraint);
