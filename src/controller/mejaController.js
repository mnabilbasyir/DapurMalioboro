const db = require('../config/db');

// GET semua meja
const tampilMeja = async (req, res, next) => {
    try {
        const [rows] = await db.execute('SELECT * FROM meja');
        return res.status(200).json({ message: 'Berhasil menampilkan data meja', data: rows });
    } catch (error) {
        next(error);
    }
};

// GET meja by id
const getMejaById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM meja WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Meja tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Berhasil menampilkan data meja', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

// POST tambah meja - admin
const createMeja = async (req, res, next) => {
    try {
        const { nomor_meja } = req.body;
        if (!nomor_meja) {
            return res.status(400).json({ status: 'error', message: 'nomor_meja wajib diisi' });
        }
        await db.execute('INSERT INTO meja (nomor_meja) VALUES (?)', [nomor_meja]);
        return res.status(201).json({ status: 'success', message: 'Berhasil tambah meja' });
    } catch (error) {
        next(error);
    }
};

// PUT update meja - admin
const updateMeja = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nomor_meja } = req.body;
        if (!nomor_meja) {
            return res.status(400).json({ status: 'error', message: 'nomor_meja wajib diisi' });
        }
        await db.execute('UPDATE meja SET nomor_meja = ? WHERE id = ?', [nomor_meja, id]);
        return res.status(200).json({ status: 'success', message: `Berhasil update meja id ${id}` });
    } catch (error) {
        next(error);
    }
};

// DELETE meja - admin
const deleteMeja = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM meja WHERE id = ?', [id]);
        return res.status(200).json({ status: 'success', message: `Berhasil hapus meja id ${id}` });
    } catch (error) {
        next(error);
    }
};

module.exports = { tampilMeja, getMejaById, createMeja, updateMeja, deleteMeja };
