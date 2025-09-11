// backend/routes/jobs.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // this should be the connection exported above

// GET /api/jobs
router.get('/', (req, res) => {
  db.query('SELECT * FROM jobs', (err, results) => {
    if (err) {
      console.error('jobs GET error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Approve
router.post('/:id/approve', (req, res) => {
  const jobId = req.params.id;
  db.query('UPDATE jobs SET status = ? WHERE id = ?', ['Approved', jobId], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job approved successfully' });
  });
});

// Reject
router.post('/:id/reject', (req, res) => {
  const jobId = req.params.id;
  db.query('UPDATE jobs SET status = ? WHERE id = ?', ['Rejected', jobId], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job rejected successfully' });
  });
});

module.exports = router;
