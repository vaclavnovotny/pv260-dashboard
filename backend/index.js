const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/courses', require('./src/routes/upload'));
app.use('/api/courses', require('./src/routes/stats'));

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;
