// backend/routes/stats.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.query('SELECT COUNT(*) AS totalStudents FROM students', (err, studentsResult) => {
    if (err) {
      console.error('Stats students query error:', err);
      return res.status(500).json({ error: err.message });
    }
    const totalStudents = studentsResult[0].totalStudents || 0;

    db.query('SELECT COUNT(*) AS activeCompanies FROM jobs WHERE status = ?', ['Approved'], (err2, activeResult) => {
      if (err2) {
        console.error('Stats active companies error:', err2);
        return res.status(500).json({ error: err2.message });
      }
      const activeCompanies = activeResult[0].activeCompanies || 0;

      db.query('SELECT COUNT(*) AS pendingApprovals FROM jobs WHERE status = ?', ['Pending'], (err3, pendingResult) => {
        if (err3) {
          console.error('Stats pending approvals error:', err3);
          return res.status(500).json({ error: err3.message });
        }
        const pendingApprovals = pendingResult[0].pendingApprovals || 0;

        res.json({
          totalStudents,
          activeCompanies,
          pendingApprovals
        });
      });
    });
  });
});

module.exports = router;
