const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ----------------- MySQL Connection -----------------
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'placehub'
});


db.connect(err => {
    if (err) {
        console.error('❌ MySQL connection error:', err);
    } else {
        console.log('✅ MySQL connected');
    }
});

// ----------------- Jobs -----------------

// Get all jobs
app.get('/api/jobs', (req, res) => {
    db.query('SELECT * FROM jobs', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Approve a job
app.post('/api/jobs/:id/approve', (req, res) => {
    const jobId = req.params.id;
    db.query(
        'UPDATE jobs SET status = ? WHERE id = ?',
        ['Approved', jobId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Job approved successfully' });
        }
    );
});

// Reject a job
app.post('/api/jobs/:id/reject', (req, res) => {
    const jobId = req.params.id;
    db.query(
        'UPDATE jobs SET status = ? WHERE id = ?',
        ['Rejected', jobId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Job rejected successfully' });
        }
    );
});

// ----------------- Applications -----------------

// Create an application
app.post('/api/applications', (req, res) => {
    const { jobId, studentName } = req.body;
    const applicationDate = new Date().toISOString().split('T')[0];
    const status = 'Pending';

    db.query(
        'INSERT INTO applications (jobId, studentName, applicationDate, status) VALUES (?, ?, ?, ?)',
        [jobId, studentName, applicationDate, status],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Application created successfully' });
        }
    );
});

// Get applications for a job (without join)
app.get('/api/applications/:jobId', (req, res) => {
    const jobId = req.params.jobId;

    db.query(
        'SELECT * FROM applications WHERE jobId = ? ORDER BY applicationDate ASC',
        [jobId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Update application status
app.post('/api/applications/:id/update', (req, res) => {
    const { status } = req.body;
    const applicationId = req.params.id;

    db.query(
        'UPDATE applications SET status = ? WHERE id = ?',
        [status, applicationId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Application status updated successfully' });
        }
    );
});

// ----------------- Students -----------------
// Get students by year + branch (existing)
app.get('/api/students', (req, res) => {
    const { year, branch } = req.query;

    if (!year || !branch) {
        return res.status(400).json({ error: 'Year and branch are required' });
    }

    db.query(
        'SELECT * FROM students WHERE year = ? AND branch = ?',
        [year, branch],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// ----------------- Notify Students -----------------

app.post('/api/notify-students', (req, res) => {
    const { jobId, year, branches, message } = req.body;

    if (!jobId || !year || !branches || branches.length === 0) {
        return res.status(400).json({ error: 'Job, year, and branches are required' });
    }

    const placeholders = branches.map(() => '?').join(',');
    const query = `SELECT name FROM students WHERE year = ? AND branch IN (${placeholders})`;
    const params = [year, ...branches];

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.json({ message: 'No students found for selected criteria.' });
        }

        const studentNames = results.map(s => s.name);

        studentNames.forEach(name => {
            db.query(
                'INSERT INTO notifications (studentName, message, notifiedAt) VALUES (?, ?, NOW())',
                [name, message || `New job posted with ID ${jobId}`],
                (err) => {
                    if (err) console.error('Notify error:', err);
                }
            );
        });

        res.json({ message: `${studentNames.length} students notified successfully.` });
    });
});

// ----------------- Stats endpoint -----------------
// Returns totalStudents, activeCompanies (Approved), pendingApprovals (Pending)
app.get('/api/stats', (req, res) => {
    db.query('SELECT COUNT(*) AS totalStudents FROM students', (err, studentsResult) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalStudents = studentsResult[0].totalStudents || 0;

        db.query('SELECT COUNT(*) AS activeCompanies FROM jobs WHERE status = ?', ['Approved'], (err2, activeResult) => {
            if (err2) return res.status(500).json({ error: err2.message });
            const activeCompanies = activeResult[0].activeCompanies || 0;

            db.query('SELECT COUNT(*) AS pendingApprovals FROM jobs WHERE status = ?', ['Pending'], (err3, pendingResult) => {
                if (err3) return res.status(500).json({ error: err3.message });
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

// ----------------- Start Server -----------------

app.listen(5000, () => {
    console.log('🚀 Backend running on http://localhost:5000');
});
