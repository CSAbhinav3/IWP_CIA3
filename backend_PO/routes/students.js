// backend/routes/students.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/students?year=2024&branch=CSE
router.get('/', (req, res) => {
  const { year, branch } = req.query;
  if (!year || !branch) {
    return res.status(400).json({ error: 'Year and branch are required' });
  }

  db.query('SELECT * FROM students WHERE year = ? AND branch = ?', [year, branch], (err, results) => {
    if (err) {
      console.error('Get students error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

module.exports = router;
