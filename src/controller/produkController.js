const db = require('../config/db');

// GET semua produk (semua bisa lihat menu)
const tampilProduk = async (req, res, next) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, k.nama_kategori 
            FROM produk p 
            LEFT JOIN kategori k ON p.kategori_id = k.id
        `);
        return res.status(200).json({ message: 'Berhasil menampilkan produk', data: rows });
    } catch (error) {
        next(error);
    }
};

// GET produk by id
const getProdukById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(`
            SELECT p.*, k.nama_kategori 
            FROM produk p 
            LEFT JOIN kategori k ON p.kategori_id = k.id 
            WHERE p.id = ?
        `, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Berhasil menampilkan produk', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

// POST tambah produk - admin
const createProduk = async (req, res, next) => {
    try {
        const { nama_produk, gambar_produk, harga_produk, harga_modal, deskripsi_produk, status_produk, kategori_id } = req.body;

        if (!nama_produk || !harga_produk || !harga_modal) {
            return res.status(400).json({ status: 'error', message: 'nama_produk, harga_produk, dan harga_modal wajib diisi' });
        }

        if (isNaN(harga_produk) || isNaN(harga_modal)) {
            return res.status(400).json({ status: 'error', message: 'harga_produk dan harga_modal harus berupa angka' });
        }

        await db.execute(
            'INSERT INTO produk (nama_produk, gambar_produk, harga_produk, harga_modal, deskripsi_produk, status_produk, kategori_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nama_produk, gambar_produk || null, harga_produk, harga_modal, deskripsi_produk || null, status_produk || 'tersedia', kategori_id || null]
        );
        return res.status(201).json({ status: 'success', message: 'Berhasil tambah produk' });
    } catch (error) {
        next(error);
    }
};

// PUT update produk - admin
const updateProduk = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nama_produk, gambar_produk, harga_produk, harga_modal, deskripsi_produk, status_produk, kategori_id } = req.body;

        if (!nama_produk || !harga_produk || !harga_modal) {
            return res.status(400).json({ status: 'error', message: 'nama_produk, harga_produk, dan harga_modal wajib diisi' });
        }

        await db.execute(
            'UPDATE produk SET nama_produk = ?, gambar_produk = ?, harga_produk = ?, harga_modal = ?, deskripsi_produk = ?, status_produk = ?, kategori_id = ? WHERE id = ?',
            [nama_produk, gambar_produk || null, harga_produk, harga_modal, deskripsi_produk || null, status_produk || 'tersedia', kategori_id || null, id]
        );
        return res.status(200).json({ status: 'success', message: `Berhasil update produk id ${id}` });
    } catch (error) {
        next(error);
    }
};

// DELETE produk - admin
const deleteProduk = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM produk WHERE id = ?', [id]);
        return res.status(200).json({ status: 'success', message: `Berhasil hapus produk id ${id}` });
    } catch (error) {
        next(error);
    }
};

module.exports = { tampilProduk, getProdukById, createProduk, updateProduk, deleteProduk };
