const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const config = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: config.corsOrigin !== '*'
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Notification API running on port ${config.port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = app;
