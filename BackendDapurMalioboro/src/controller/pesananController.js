const db = require('../config/db');

// Helper: generate nomor pesanan unik
const generateNomorPesanan = () => {
    const now = new Date();
    const tgl = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `ORD-${tgl}-${rand}`;
};

// -------------------------------------------------------
// GET semua pesanan - admin/kasir
// -------------------------------------------------------
const tampilPesanan = async (req, res, next) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, m.nomor_meja, u.nama_pengguna
            FROM pesanan p
            LEFT JOIN meja m ON p.meja_id = m.id
            LEFT JOIN pengguna u ON p.pengguna_id = u.id
            ORDER BY p.created_at DESC
        `);
        return res.status(200).json({ message: 'Berhasil menampilkan pesanan', data: rows });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------------------------
// GET pesanan by id + detail item yang dipesan
// -------------------------------------------------------
const getPesananById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [pesanan] = await db.execute(`
            SELECT p.*, m.nomor_meja, u.nama_pengguna
            FROM pesanan p
            LEFT JOIN meja m ON p.meja_id = m.id
            LEFT JOIN pengguna u ON p.pengguna_id = u.id
            WHERE p.id = ?
        `, [id]);

        if (pesanan.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
        }

        const [detail] = await db.execute(`
            SELECT dp.*, pr.nama_produk, pr.harga_produk
            FROM detail_pesanan dp
            LEFT JOIN produk pr ON dp.produk_id = pr.id
            WHERE dp.pesanan_id = ?
        `, [id]);

        return res.status(200).json({
            message: 'Berhasil menampilkan pesanan',
            data: { ...pesanan[0], items: detail }
        });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------------------------
// POST buat pesanan baru (scan QR code → pilih menu → pesan)
// Body: { meja_id, catatan, items: [{ produk_id, quantity }] }
// -------------------------------------------------------
const createPesanan = async (req, res, next) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { meja_id, catatan, items } = req.body;
        const pengguna_id = req.user.id;

        // validasi
        if (!meja_id || !items || items.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ status: 'error', message: 'meja_id dan items wajib diisi' });
        }

        // cek meja ada
        const [meja] = await conn.execute('SELECT * FROM meja WHERE id = ?', [meja_id]);
        if (meja.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ status: 'error', message: 'Meja tidak ditemukan' });
        }

        // hitung total harga
        let total_harga = 0;
        const itemsWithPrice = [];

        for (const item of items) {
            if (!item.produk_id || !item.quantity || item.quantity <= 0) {
                await conn.rollback();
                conn.release();
                return res.status(400).json({ status: 'error', message: 'produk_id dan quantity wajib diisi dan harus lebih dari 0' });
            }

            const [produk] = await conn.execute('SELECT * FROM produk WHERE id = ? AND status_produk = "tersedia"', [item.produk_id]);
            if (produk.length === 0) {
                await conn.rollback();
                conn.release();
                return res.status(404).json({ status: 'error', message: `Produk id ${item.produk_id} tidak ditemukan atau tidak tersedia` });
            }

            const subtotal = produk[0].harga_produk * item.quantity;
            total_harga += subtotal;
            itemsWithPrice.push({ ...item, harga_satuan: produk[0].harga_produk, subtotal });
        }

        // insert pesanan
        const nomor_pesanan = generateNomorPesanan();
        const [result] = await conn.execute(
            'INSERT INTO pesanan (nomor_pesanan, total_harga, status, catatan, meja_id, pengguna_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nomor_pesanan, total_harga, 'menunggu', catatan || null, meja_id, pengguna_id]
        );
        const pesanan_id = result.insertId;

        // insert detail pesanan
        for (const item of itemsWithPrice) {
            await conn.execute(
                'INSERT INTO detail_pesanan (pesanan_id, produk_id, quantity, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)',
                [pesanan_id, item.produk_id, item.quantity, item.harga_satuan, item.subtotal]
            );
        }

        await conn.commit();
        conn.release();

        return res.status(201).json({
            status: 'success',
            message: 'Pesanan berhasil dibuat! Silakan bayar di kasir setelah selesai makan.',
            data: { nomor_pesanan, total_harga, status: 'menunggu' }
        });
    } catch (error) {
        await conn.rollback();
        conn.release();
        next(error);
    }
};

// -------------------------------------------------------
// PUT update status pesanan - kasir/admin
// status: menunggu → siap → menunggu_kasir → selesai / batal
// -------------------------------------------------------
const updateStatusPesanan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['menunggu', 'siap', 'menunggu_kasir', 'selesai', 'batal'];
        if (!status || !validStatus.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: `Status tidak valid. Pilihan: ${validStatus.join(', ')}`
            });
        }

        const [pesanan] = await db.execute('SELECT * FROM pesanan WHERE id = ?', [id]);
        if (pesanan.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
        }

        await db.execute('UPDATE pesanan SET status = ? WHERE id = ?', [status, id]);

        // Jika status selesai → otomatis isi tabel profit
        if (status === 'selesai') {
            const [existing] = await db.execute('SELECT * FROM profit WHERE pesanan_id = ?', [id]);
            if (existing.length === 0) {
                const [modalResult] = await db.execute(`
                    SELECT SUM(pr.harga_modal * dp.quantity) AS total_modal
                    FROM detail_pesanan dp
                    JOIN produk pr ON dp.produk_id = pr.id
                    WHERE dp.pesanan_id = ?
                `, [id]);
                const total_modal = modalResult[0].total_modal || 0;
                const total_penjualan = pesanan[0].total_harga;

                await db.execute(
                    'INSERT INTO profit (pesanan_id, total_penjualan, total_modal, tanggal) VALUES (?, ?, ?, CURDATE())',
                    [id, total_penjualan, total_modal]
                );
            }
        }

        const pesanMsg = {
            menunggu: 'Pesanan sedang diproses dapur',
            siap: 'Pesanan siap disajikan',
            menunggu_kasir: 'Silakan bayar di kasir',
            selesai: 'Pesanan selesai & sudah dibayar',
            batal: 'Pesanan dibatalkan'
        };

        return res.status(200).json({
            status: 'success',
            message: pesanMsg[status],
            data: { id, status }
        });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------------------------
// DELETE pesanan - admin
// -------------------------------------------------------
const deletePesanan = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM pesanan WHERE id = ?', [id]);
        return res.status(200).json({ status: 'success', message: `Berhasil hapus pesanan id ${id}` });
    } catch (error) {
        next(error);
    }
};

module.exports = { tampilPesanan, getPesananById, createPesanan, updateStatusPesanan, deletePesanan };
