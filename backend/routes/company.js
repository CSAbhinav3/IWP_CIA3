const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get company profile
router.get('/profile', async (req, res) => {
    try {
        const [companies] = await db.execute(
            `SELECT id, email, companyName, industry, website, location, 
                    companySize, description, contactPerson, contactEmail, 
                    contactPhone, status, createdAt, updatedAt 
             FROM companies WHERE id = ?`,
            [req.user.id]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            ...companies[0]
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// Update company profile
router.put('/profile', async (req, res) => {
    try {
        const {
            companyName, industry, website, location, companySize,
            description, contactPerson, contactEmail, contactPhone
        } = req.body;

        // Validation
        if (!companyName || !contactPerson) {
            return res.status(400).json({
                success: false,
                message: 'Company name and contact person are required'
            });
        }

        await db.execute(
            `UPDATE companies SET 
                companyName = ?, industry = ?, website = ?, location = ?,
                companySize = ?, description = ?, contactPerson = ?,
                contactEmail = ?, contactPhone = ?, updatedAt = NOW()
             WHERE id = ?`,
            [
                companyName, industry, website, location, companySize,
                description, contactPerson, contactEmail, contactPhone,
                req.user.id
            ]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Get dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
    try {
        // Get total jobs
        const [jobsCount] = await db.execute(
            'SELECT COUNT(*) as count FROM job_postings WHERE companyId = ? AND status = "active"',
            [req.user.id]
        );

        // Get total applications
        const [applicationsCount] = await db.execute(
            `SELECT COUNT(*) as count FROM applications a 
             JOIN job_postings j ON a.jobId = j.id 
             WHERE j.companyId = ?`,
            [req.user.id]
        );

        // Get total hired
        const [hiredCount] = await db.execute(
            `SELECT COUNT(*) as count FROM applications a 
             JOIN job_postings j ON a.jobId = j.id 
             WHERE j.companyId = ? AND a.status = 'hired'`,
            [req.user.id]
        );

        res.json({
            success: true,
            totalJobs: jobsCount[0].count,
            totalApplications: applicationsCount[0].count,
            totalHired: hiredCount[0].count
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
});

// Get company's job postings
router.get('/jobs', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        
        let query = `
            SELECT j.*, 
                   COUNT(a.id) as applicationsCount
            FROM job_postings j
            LEFT JOIN applications a ON j.id = a.jobId
            WHERE j.companyId = ? AND j.status = 'active'
            GROUP BY j.id
            ORDER BY j.createdAt DESC
        `;
        
        const params = [req.user.id];
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        const [jobs] = await db.execute(query, params);

        res.json(jobs);

    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs'
        });
    }
});

// Get applications for company's jobs
router.get('/applications', async (req, res) => {
    try {
        const jobId = req.query.jobId;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        
        let query = `
            SELECT a.*, j.jobTitle, j.department,
                   s.firstName, s.lastName, s.email as studentEmail, 
                   s.phone as studentPhone, s.resumeUrl,
                   CONCAT(s.firstName, ' ', s.lastName) as studentName
            FROM applications a
            JOIN job_postings j ON a.jobId = j.id
            JOIN students s ON a.studentId = s.id
            WHERE j.companyId = ?
        `;
        
        const params = [req.user.id];
        
        if (jobId) {
            query += ' AND a.jobId = ?';
            params.push(jobId);
        }
        
        query += ' ORDER BY a.appliedAt DESC';
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        const [applications] = await db.execute(query, params);

        res.json(applications);

    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
});

module.exports = router;
