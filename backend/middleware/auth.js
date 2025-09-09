const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'christ_university_placement_secret_key_2024';

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user data from database
        let user = null;
        
        if (decoded.type === 'company') {
            const [companies] = await db.execute(
                'SELECT id, email, companyName, status FROM companies WHERE id = ?',
                [decoded.id]
            );
            user = companies[0];
            
            if (user && user.status !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: 'Account not approved'
                });
            }
        } else if (decoded.type === 'student') {
            const [students] = await db.execute(
                'SELECT id, email, firstName, lastName FROM students WHERE id = ?',
                [decoded.id]
            );
            user = students[0];
        } else if (decoded.type === 'faculty') {
            const [faculty] = await db.execute(
                'SELECT id, email, firstName, lastName FROM faculty WHERE id = ?',
                [decoded.id]
            );
            user = faculty[0];
        }
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // Attach user info to request
        req.user = {
            ...user,
            type: decoded.type
        };
        
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authMiddleware;
