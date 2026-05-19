// ============================================================
// Auth Routes - Signup & Login
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { query, insert, update } = require('../db');
const { validateBody } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ─── POST /auth/signup ──────────────────────────────────────
router.post('/signup', validateBody(['username', 'password']), asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const existingUsers = await query('users', { filters: { username } });
        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Username already exists',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const newUser = await insert('users', {
            username,
            password_hash: hashedPassword,
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                level: newUser.level,
                total_xp: newUser.total_xp,
                avatar: newUser.avatar,
            },
        });
    } catch (error) {
        next(error);
    }
}));

// ─── POST /auth/login ───────────────────────────────────────
router.post('/login', validateBody(['username', 'password']), asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const users = await query('users', { filters: { username } });

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password',
            });
        }

        const user = users[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password',
            });
        }

        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                ...userWithoutPassword,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        next(error);
    }
}));

// ─── GET /auth/me/:user_id ──────────────────────────────────
router.get('/me/:user_id', asyncHandler(async (req, res, next) => {
    const { user_id } = req.params;

    try {
        const users = await query('users', {
            filters: { id: parseInt(user_id) },
            select: 'id, username, level, total_xp, created_at',
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            user: users[0],
        });
    } catch (error) {
        next(error);
    }
}));

// ─── PUT /auth/update-avatar ───────────────────────────────
router.put('/update-avatar', validateBody(['user_id', 'avatar']), asyncHandler(async (req, res, next) => {
    const { user_id, avatar } = req.body;

    try {
        const result = await update('users', { avatar }, { id: user_id });

        res.json({ success: true, user: result[0] });
    } catch (error) {
        next(error);
    }
}));

// ─── PUT /auth/update-username ──────────────────────────────
router.put('/update-username', validateBody(['user_id', 'new_username']), asyncHandler(async (req, res, next) => {
    const { user_id, new_username } = req.body;

    try {
        const existing = await query('users', { filters: { username: new_username } });
        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: 'Username already taken.' });
        }

        const result = await update('users', { username: new_username }, { id: user_id });

        res.json({ success: true, user: result[0] });
    } catch (error) {
        next(error);
    }
}));

// ─── POST /auth/reset-password ──────────────────────────────
router.post('/reset-password', validateBody(['username', 'new_password']), asyncHandler(async (req, res, next) => {
    const { username, new_password } = req.body;

    try {
        const users = await query('users', { filters: { username } });

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'No account found with that username.' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await update('users', { password_hash: hashedPassword }, { username });

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
