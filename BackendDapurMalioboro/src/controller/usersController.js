const db      = require('../config/db');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { addToBlacklist } = require('../utils/tokenBlacklist');

// GET semua user - hanya admin
const TampilDataUser = async (req, res, next) => {
    try {
        const [rows] = await db.execute('SELECT id, nama_pengguna, role, created_at FROM pengguna');
        return res.status(200).json({
            message: 'Berhasil menampilkan data user',
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

// GET user by id
const TampilDataUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(
            'SELECT id, nama_pengguna, role, created_at FROM pengguna WHERE id = ?', [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: `User dengan id ${id} tidak ditemukan` });
        }
        return res.status(200).json({ message: 'Berhasil menampilkan data user', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

// POST register
const CreateDataUser = async (req, res, next) => {
    try {
        const { nama_pengguna, password, role } = req.body;

        if (!nama_pengguna || !password) {
            return res.status(400).json({ status: 'error', message: 'nama_pengguna dan password wajib diisi' });
        }

        const hashing = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO pengguna (nama_pengguna, password, role) VALUES (?, ?, ?)',
            [nama_pengguna, hashing, role || 'pelanggan']
        );
        return res.status(201).json({ status: 'success', message: 'Registrasi berhasil' });
    } catch (error) {
        next(error);
    }
};

// POST login
const login = async (req, res, next) => {
    try {
        const { nama_pengguna, password } = req.body;

        if (!nama_pengguna || !password) {
            return res.status(400).json({ message: 'nama_pengguna dan password wajib diisi' });
        }

        const [rows] = await db.execute('SELECT * FROM pengguna WHERE nama_pengguna = ?', [nama_pengguna]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        const token = jwt.sign(
            { id: user.id, nama_pengguna: user.nama_pengguna, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ message: 'Login berhasil', token });
    } catch (error) {
        next(error);
    }
};

// POST logout
const logout = async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(400).json({ message: 'Token tidak ditemukan' });
    }
    addToBlacklist(token);
    return res.status(200).json({ message: 'Logout berhasil' });
};

// PUT update user
const UpdateDataUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nama_pengguna, password, role } = req.body;

        if (!nama_pengguna || !password || !role) {
            return res.status(400).json({ message: 'Semua data wajib diisi' });
        }

        const hashing = await bcrypt.hash(password, 10);
        await db.execute(
            'UPDATE pengguna SET nama_pengguna = ?, password = ?, role = ? WHERE id = ?',
            [nama_pengguna, hashing, role, id]
        );
        return res.status(200).json({ message: `Berhasil update user id ${id}` });
    } catch (error) {
        next(error);
    }
};

// DELETE user
const DeleteDataUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM pengguna WHERE id = ?', [id]);
        return res.status(200).json({ message: `Berhasil hapus user id ${id}` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    TampilDataUser,
    TampilDataUserById,
    CreateDataUser,
    login,
    logout,
    UpdateDataUser,
    DeleteDataUser
};
