export const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(422).json({ message: 'Datos inválidos', errors });
  }

  if (source === 'query') {
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, parsed.data);
  } else {
    req[source] = parsed.data;
  }

  return next();
};
