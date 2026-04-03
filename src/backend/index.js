const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const STATIC_DIR = path.join(__dirname, 'public');
const isProd = require('fs').existsSync(STATIC_DIR);

if (isProd) {
  app.use(express.static(STATIC_DIR));
} else {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

app.use(express.json());

app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/courses', require('./src/routes/upload'));
app.use('/api/courses', require('./src/routes/stats'));
app.use('/api/export', require('./src/routes/export'));

// SPA fallback — serve index.html for any non-API route in production
if (isProd) {
  app.get('/{*path}', (req, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;
