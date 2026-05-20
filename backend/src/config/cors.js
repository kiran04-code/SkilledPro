const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const clientOrigin = process.env.CLIENT_ORIGIN?.trim() || process.env.CLIENT_URL?.trim();

const allowedOrigins = [...new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(clientOrigin ? [clientOrigin] : []),
  ...envOrigins,
])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

module.exports = { allowedOrigins, corsOptions };
