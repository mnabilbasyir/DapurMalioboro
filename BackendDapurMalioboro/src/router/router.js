const express = require('express');
const router  = express.Router();

const auth      = require('../middleware/auth');
const checkRole = require('../middleware/role');

const mejaController     = require('../controller/mejaController');
const kategoriController = require('../controller/kategoriController');
const produkController   = require('../controller/produkController');
const pesananController  = require('../controller/pesananController');
const profitController   = require('../controller/profitController');

// =====================
// MEJA
// =====================
router.get('/meja',        auth, mejaController.tampilMeja);
router.get('/meja/:id',    auth, mejaController.getMejaById);
router.post('/meja',       auth, checkRole('admin'), mejaController.createMeja);
router.put('/meja/:id',    auth, checkRole('admin'), mejaController.updateMeja);
router.delete('/meja/:id', auth, checkRole('admin'), mejaController.deleteMeja);

// =====================
// KATEGORI
// =====================
router.get('/kategori',        auth, kategoriController.tampilKategori);
router.get('/kategori/:id',    auth, kategoriController.getKategoriById);
router.post('/kategori',       auth, checkRole('admin'), kategoriController.createKategori);
router.put('/kategori/:id',    auth, checkRole('admin'), kategoriController.updateKategori);
router.delete('/kategori/:id', auth, checkRole('admin'), kategoriController.deleteKategori);

// =====================
// PRODUK / MENU
// =====================
router.get('/produk',        auth, produkController.tampilProduk);       // scan QR → lihat menu
router.get('/produk/:id',    auth, produkController.getProdukById);
router.post('/produk',       auth, checkRole('admin'), produkController.createProduk);
router.put('/produk/:id',    auth, checkRole('admin'), produkController.updateProduk);
router.delete('/produk/:id', auth, checkRole('admin'), produkController.deleteProduk);

// =====================
// PESANAN (inti sistem gacoan)
// =====================
router.get('/pesanan',              auth, checkRole('admin'), pesananController.tampilPesanan);  // admin/kasir lihat semua
router.get('/pesanan/:id',          auth, pesananController.getPesananById);                     // lihat detail 1 pesanan
router.post('/pesanan',             auth, pesananController.createPesanan);                      // pelanggan buat pesanan
router.put('/pesanan/:id/status',   auth, checkRole('admin'), pesananController.updateStatusPesanan); // kasir/admin update status
router.delete('/pesanan/:id',       auth, checkRole('admin'), pesananController.deletePesanan);

// =====================
// PROFIT - hanya admin
// =====================
router.get('/profit',                        auth, checkRole('admin'), profitController.tampilProfit);
router.get('/profit/hari-ini',               auth, checkRole('admin'), profitController.profitHariIni);
router.get('/profit/pesanan/:pesanan_id',    auth, checkRole('admin'), profitController.getProfitByPesanan);

module.exports = router;
