const db = require('../config/db');

// GET semua laporan profit - admin
const tampilProfit = async (req, res, next) => {
    try {
        const [rows] = await db.execute(`
            SELECT pr.*, p.nomor_pesanan, m.nomor_meja
            FROM profit pr
            LEFT JOIN pesanan p ON pr.pesanan_id = p.id
            LEFT JOIN meja m ON p.meja_id = m.id
            ORDER BY pr.tanggal DESC
        `);
        return res.status(200).json({ message: 'Berhasil menampilkan laporan profit', data: rows });
    } catch (error) {
        next(error);
    }
};

// GET profit hari ini - admin
const profitHariIni = async (req, res, next) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COUNT(*) AS total_transaksi,
                SUM(total_penjualan) AS total_penjualan,
                SUM(total_modal) AS total_modal,
                SUM(keuntungan_bersih) AS total_keuntungan
            FROM profit
            WHERE tanggal = CURDATE()
        `);
        return res.status(200).json({ message: 'Profit hari ini', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

// GET profit by id pesanan
const getProfitByPesanan = async (req, res, next) => {
    try {
        const { pesanan_id } = req.params;
        const [rows] = await db.execute('SELECT * FROM profit WHERE pesanan_id = ?', [pesanan_id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Data profit tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Berhasil menampilkan profit', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = { tampilProfit, profitHariIni, getProfitByPesanan };
