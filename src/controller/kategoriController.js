const db = require('../config/db');

// GET semua kategori
const tampilKategori = async (req, res, next) => {
    try {
        const [rows] = await db.execute('SELECT * FROM kategori');
        return res.status(200).json({ message: 'Berhasil menampilkan kategori', data: rows });
    } catch (error) {
        next(error);
    }
};

// GET kategori by id
const getKategoriById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM kategori WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Berhasil menampilkan kategori', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

// POST tambah kategori - admin
const createKategori = async (req, res, next) => {
    try {
        const { nama_kategori } = req.body;
        if (!nama_kategori) {
            return res.status(400).json({ status: 'error', message: 'nama_kategori wajib diisi' });
        }
        await db.execute('INSERT INTO kategori (nama_kategori) VALUES (?)', [nama_kategori]);
        return res.status(201).json({ status: 'success', message: 'Berhasil tambah kategori' });
    } catch (error) {
        next(error);
    }
};

// PUT update kategori - admin
const updateKategori = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nama_kategori } = req.body;
        if (!nama_kategori) {
            return res.status(400).json({ status: 'error', message: 'nama_kategori wajib diisi' });
        }
        await db.execute('UPDATE kategori SET nama_kategori = ? WHERE id = ?', [nama_kategori, id]);
        return res.status(200).json({ status: 'success', message: `Berhasil update kategori id ${id}` });
    } catch (error) {
        next(error);
    }
};

// DELETE kategori - admin
const deleteKategori = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM kategori WHERE id = ?', [id]);
        return res.status(200).json({ status: 'success', message: `Berhasil hapus kategori id ${id}` });
    } catch (error) {
        next(error);
    }
};

module.exports = { tampilKategori, getKategoriById, createKategori, updateKategori, deleteKategori };
