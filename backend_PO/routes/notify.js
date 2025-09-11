// backend/routes/notify.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/notify-students
router.post('/', (req, res) => {
  const { jobId, year, branches, message } = req.body;

  if (!jobId || !year || !branches || !Array.isArray(branches) || branches.length === 0) {
    return res.status(400).json({ error: 'jobId, year and branches array are required' });
  }

  const placeholders = branches.map(() => '?').join(',');
  const query = `SELECT name FROM students WHERE year = ? AND branch IN (${placeholders})`;
  const params = [year, ...branches];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Notify select error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!results || results.length === 0) {
      return res.json({ message: 'No students found for selected criteria.' });
    }

    const studentNames = results.map(r => r.name);

    // Insert notifications (do it in a single transaction would be ideal; for simplicity we iterate)
    const notifText = message || `New job posted with ID ${jobId}`;
    const insertQuery = 'INSERT INTO notifications (studentName, message, notifiedAt) VALUES ?';
    const insertValues = studentNames.map(name => [name, notifText, new Date()]);

    db.query(insertQuery, [insertValues], (err2) => {
      if (err2) {
        console.error('Notify insert error:', err2);
        return res.status(500).json({ error: err2.message });
      }
      res.json({ message: `${studentNames.length} students notified successfully.` });
    });
  });
});

module.exports = router;
