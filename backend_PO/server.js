// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health route
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

// Mount routes
const jobsRouter = require('./routes/jobs');
const applicationsRouter = require('./routes/applications');
const studentsRouter = require('./routes/students');
const notifyRouter = require('./routes/notify');
const statsRouter = require('./routes/stats');

app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/notify-students', notifyRouter);
app.use('/api/stats', statsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
