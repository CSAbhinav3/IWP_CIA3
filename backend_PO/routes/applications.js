// backend/routes/applications.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/applications  -> create application
router.post('/', (req, res) => {
  const { jobId, studentName } = req.body;
  if (!jobId || !studentName) {
    return res.status(400).json({ error: 'jobId and studentName are required' });
  }
  const applicationDate = new Date().toISOString().split('T')[0];
  const status = 'Pending';

  db.query(
    'INSERT INTO applications (jobId, studentName, applicationDate, status) VALUES (?, ?, ?, ?)',
    [jobId, studentName, applicationDate, status],
    (err) => {
      if (err) {
        console.error('Create application error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Application created successfully' });
    }
  );
});

// GET /api/applications/:jobId
router.get('/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  db.query(
    'SELECT * FROM applications WHERE jobId = ? ORDER BY applicationDate ASC',
    [jobId],
    (err, results) => {
      if (err) {
        console.error('Get applications error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    }
  );
});

// POST /api/applications/:id/update
router.post('/:id/update', (req, res) => {
  const applicationId = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  db.query('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId], (err) => {
    if (err) {
      console.error('Update application status error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Application status updated successfully' });
  });
});

module.exports = router;
