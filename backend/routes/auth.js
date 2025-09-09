const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'christ_university_placement_secret_key_2024';

// Company Registration
router.post('/company/register', async (req, res) => {
    try {
        const { email, password, companyName, contactPerson } = req.body;

        // Validation
        if (!email || !password || !companyName || !contactPerson) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if company already exists
        const [existingCompany] = await db.execute(
            'SELECT id FROM companies WHERE email = ?',
            [email]
        );

        if (existingCompany.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Company already registered with this email'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert company
        const [result] = await db.execute(
            `INSERT INTO companies (email, password, companyName, contactPerson, status, createdAt) 
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [email, hashedPassword, companyName, contactPerson]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: result.insertId, 
                email, 
                type: 'company',
                companyName 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Company registered successfully',
            token,
            user: {
                id: result.insertId,
                email,
                companyName,
                contactPerson,
                type: 'company'
            }
        });

    } catch (error) {
        console.error('Company registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// Company Login
router.post('/company/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find company
        const [companies] = await db.execute(
            'SELECT * FROM companies WHERE email = ?',
            [email]
        );

        if (companies.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const company = companies[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, company.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if company is approved
        if (company.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Account pending approval by Christ University administration'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: company.id, 
                email: company.email, 
                type: 'company',
                companyName: company.companyName 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update last login
        await db.execute(
            'UPDATE companies SET lastLoginAt = NOW() WHERE id = ?',
            [company.id]
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: company.id,
                email: company.email,
                companyName: company.companyName,
                contactPerson: company.contactPerson,
                type: 'company'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Verify Token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get fresh user data
        let user = null;
        if (decoded.type === 'company') {
            const [companies] = await db.execute(
                'SELECT id, email, companyName, contactPerson, status FROM companies WHERE id = ?',
                [decoded.id]
            );
            user = companies[0];
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.json({
            success: true,
            user: {
                ...user,
                type: decoded.type
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

module.exports = router;
