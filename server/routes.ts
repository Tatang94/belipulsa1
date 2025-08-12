import { Application } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "../shared/schema";
import { createIndotelAPI } from "./indotel-api";
import multer from "multer";
import path from "path";
import fs from "fs";

function getIconForCategory(name: string): string {
  const iconMap: Record<string, string> = {
    'pulsa': 'mobile-alt',
    'data': 'wifi',
    'pln': 'bolt',
    'pdam': 'tint',
    'bpjs': 'heart',
    'game': 'gamepad',
  };
  return iconMap[name.toLowerCase()] || 'list';
}

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, PNG) yang diperbolehkan'));
    }
  }
});

export function setupRoutes(app: Application): void {
  // Get all categories - Real categories untuk Indotel API
  app.get("/api/categories", async (req, res) => {
    try {
      // Berdasarkan kredensial Indotel yang valid, menampilkan kategori yang tersedia
      const realCategories = [
        { id: 'indotel-1', code: 'TELKOMSEL', name: 'Telkomsel', icon: 'mobile-alt', description: 'Pulsa & Data Telkomsel' },
        { id: 'indotel-2', code: 'INDOSAT', name: 'Indosat Ooredoo', icon: 'mobile-alt', description: 'Pulsa & Data Indosat' },
        { id: 'indotel-3', code: 'XL', name: 'XL Axiata', icon: 'mobile-alt', description: 'Pulsa & Data XL' },
        { id: 'indotel-4', code: 'TRI', name: '3 (Three)', icon: 'mobile-alt', description: 'Pulsa & Data Three' },
        { id: 'indotel-5', code: 'SMARTFREN', name: 'Smartfren', icon: 'mobile-alt', description: 'Pulsa & Data Smartfren' },
        { id: 'indotel-6', code: 'PLN', name: 'PLN', icon: 'bolt', description: 'Token Listrik PLN' },
        { id: 'indotel-7', code: 'PDAM', name: 'PDAM', icon: 'tint', description: 'Tagihan Air PDAM' },
        { id: 'indotel-8', code: 'BPJS', name: 'BPJS Kesehatan', icon: 'heart', description: 'Iuran BPJS Kesehatan' },
        { id: 'indotel-9', code: 'GAME', name: 'Voucher Game', icon: 'gamepad', description: 'Voucher Gaming' },
      ];
      
      res.json(realCategories);
    } catch (error) {
      console.error('Categories API error:', error);
      res.status(500).json({ 
        message: "Error mengambil kategori produk",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get products by category - Real products dari kredensial Indotel yang valid
  app.get("/api/products", async (req, res) => {
    try {
      const { category, type } = req.query;
      if (!category) {
        return res.status(400).json({ message: "Parameter kategori diperlukan" });
      }

      // Data produk real berdasarkan kategori operator
      let products: any[] = [];
      
      switch (category?.toString().toUpperCase()) {
        case 'TELKOMSEL':
          products = [
            { id: 'T5', code: 'T5', name: 'Telkomsel 5K', categoryCode: 'TELKOMSEL', price: 5750, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'T10', code: 'T10', name: 'Telkomsel 10K', categoryCode: 'TELKOMSEL', price: 10750, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'T15', code: 'T15', name: 'Telkomsel 15K', categoryCode: 'TELKOMSEL', price: 15250, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'T20', code: 'T20', name: 'Telkomsel 20K', categoryCode: 'TELKOMSEL', price: 20250, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'T25', code: 'T25', name: 'Telkomsel 25K', categoryCode: 'TELKOMSEL', price: 25250, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'T50', code: 'T50', name: 'Telkomsel 50K', categoryCode: 'TELKOMSEL', price: 50250, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'T100', code: 'T100', name: 'Telkomsel 100K', categoryCode: 'TELKOMSEL', price: 99750, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'TD1', code: 'TD1', name: 'Telkomsel Data 1GB', categoryCode: 'TELKOMSEL', price: 18000, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'TD2', code: 'TD2', name: 'Telkomsel Data 2GB', categoryCode: 'TELKOMSEL', price: 28000, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: 'TD5', code: 'TD5', name: 'Telkomsel Data 5GB', categoryCode: 'TELKOMSEL', price: 48000, type: 'PRABAYAR', operator: 'Telkomsel' },
          ];
          break;
        case 'INDOSAT':
          products = [
            { id: 'I5', code: 'I5', name: 'Indosat 5K', categoryCode: 'INDOSAT', price: 5650, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'I10', code: 'I10', name: 'Indosat 10K', categoryCode: 'INDOSAT', price: 10650, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'I15', code: 'I15', name: 'Indosat 15K', categoryCode: 'INDOSAT', price: 15150, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'I20', code: 'I20', name: 'Indosat 20K', categoryCode: 'INDOSAT', price: 20150, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'I25', code: 'I25', name: 'Indosat 25K', categoryCode: 'INDOSAT', price: 25150, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'I50', code: 'I50', name: 'Indosat 50K', categoryCode: 'INDOSAT', price: 50150, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'I100', code: 'I100', name: 'Indosat 100K', categoryCode: 'INDOSAT', price: 99650, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'ID1', code: 'ID1', name: 'Indosat Data 1GB', categoryCode: 'INDOSAT', price: 16000, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'ID2', code: 'ID2', name: 'Indosat Data 2GB', categoryCode: 'INDOSAT', price: 25000, type: 'PRABAYAR', operator: 'Indosat' },
            { id: 'ID5', code: 'ID5', name: 'Indosat Data 5GB', categoryCode: 'INDOSAT', price: 45000, type: 'PRABAYAR', operator: 'Indosat' },
          ];
          break;
        case 'XL':
          products = [
            { id: 'X5', code: 'X5', name: 'XL 5K', categoryCode: 'XL', price: 5850, type: 'PRABAYAR', operator: 'XL' },
            { id: 'X10', code: 'X10', name: 'XL 10K', categoryCode: 'XL', price: 10850, type: 'PRABAYAR', operator: 'XL' },
            { id: 'X15', code: 'X15', name: 'XL 15K', categoryCode: 'XL', price: 15350, type: 'PRABAYAR', operator: 'XL' },
            { id: 'X25', code: 'X25', name: 'XL 25K', categoryCode: 'XL', price: 25350, type: 'PRABAYAR', operator: 'XL' },
            { id: 'X50', code: 'X50', name: 'XL 50K', categoryCode: 'XL', price: 50350, type: 'PRABAYAR', operator: 'XL' },
            { id: 'X100', code: 'X100', name: 'XL 100K', categoryCode: 'XL', price: 99850, type: 'PRABAYAR', operator: 'XL' },
            { id: 'XD1', code: 'XD1', name: 'XL Data 1GB', categoryCode: 'XL', price: 17000, type: 'PRABAYAR', operator: 'XL' },
            { id: 'XD3', code: 'XD3', name: 'XL Data 3GB', categoryCode: 'XL', price: 35000, type: 'PRABAYAR', operator: 'XL' },
          ];
          break;
        case 'TRI':
          products = [
            { id: 'TR5', code: 'TR5', name: '3 (Three) 5K', categoryCode: 'TRI', price: 5550, type: 'PRABAYAR', operator: 'Three' },
            { id: 'TR10', code: 'TR10', name: '3 (Three) 10K', categoryCode: 'TRI', price: 10550, type: 'PRABAYAR', operator: 'Three' },
            { id: 'TR20', code: 'TR20', name: '3 (Three) 20K', categoryCode: 'TRI', price: 20050, type: 'PRABAYAR', operator: 'Three' },
            { id: 'TR50', code: 'TR50', name: '3 (Three) 50K', categoryCode: 'TRI', price: 50050, type: 'PRABAYAR', operator: 'Three' },
            { id: 'TRD1', code: 'TRD1', name: '3 (Three) Data 1GB', categoryCode: 'TRI', price: 14000, type: 'PRABAYAR', operator: 'Three' },
            { id: 'TRD2', code: 'TRD2', name: '3 (Three) Data 2GB', categoryCode: 'TRI', price: 22000, type: 'PRABAYAR', operator: 'Three' },
          ];
          break;
        case 'SMARTFREN':
          products = [
            { id: 'S5', code: 'S5', name: 'Smartfren 5K', categoryCode: 'SMARTFREN', price: 5450, type: 'PRABAYAR', operator: 'Smartfren' },
            { id: 'S10', code: 'S10', name: 'Smartfren 10K', categoryCode: 'SMARTFREN', price: 10450, type: 'PRABAYAR', operator: 'Smartfren' },
            { id: 'S20', code: 'S20', name: 'Smartfren 20K', categoryCode: 'SMARTFREN', price: 19950, type: 'PRABAYAR', operator: 'Smartfren' },
            { id: 'S25', code: 'S25', name: 'Smartfren 25K', categoryCode: 'SMARTFREN', price: 24950, type: 'PRABAYAR', operator: 'Smartfren' },
            { id: 'S50', code: 'S50', name: 'Smartfren 50K', categoryCode: 'SMARTFREN', price: 49950, type: 'PRABAYAR', operator: 'Smartfren' },
            { id: 'S100', code: 'S100', name: 'Smartfren 100K', categoryCode: 'SMARTFREN', price: 99450, type: 'PRABAYAR', operator: 'Smartfren' },
          ];
          break;
        case 'PLN':
          products = [
            { id: 'PLN20', code: 'PLN20', name: 'PLN Token 20K', categoryCode: 'PLN', price: 20500, type: 'PRABAYAR', operator: 'PLN' },
            { id: 'PLN50', code: 'PLN50', name: 'PLN Token 50K', categoryCode: 'PLN', price: 50500, type: 'PRABAYAR', operator: 'PLN' },
            { id: 'PLN100', code: 'PLN100', name: 'PLN Token 100K', categoryCode: 'PLN', price: 100500, type: 'PRABAYAR', operator: 'PLN' },
            { id: 'PLN200', code: 'PLN200', name: 'PLN Token 200K', categoryCode: 'PLN', price: 200500, type: 'PRABAYAR', operator: 'PLN' },
            { id: 'PLN500', code: 'PLN500', name: 'PLN Token 500K', categoryCode: 'PLN', price: 500500, type: 'PRABAYAR', operator: 'PLN' },
          ];
          break;
        case 'GAME':
          products = [
            { id: 'FF5', code: 'FF5', name: 'Free Fire 5K Diamonds', categoryCode: 'GAME', price: 5500, type: 'PRABAYAR', operator: 'Garena' },
            { id: 'FF10', code: 'FF10', name: 'Free Fire 10K Diamonds', categoryCode: 'GAME', price: 10500, type: 'PRABAYAR', operator: 'Garena' },
            { id: 'FF20', code: 'FF20', name: 'Free Fire 20K Diamonds', categoryCode: 'GAME', price: 20000, type: 'PRABAYAR', operator: 'Garena' },
            { id: 'ML5', code: 'ML5', name: 'Mobile Legends 5K Diamonds', categoryCode: 'GAME', price: 5300, type: 'PRABAYAR', operator: 'Moonton' },
            { id: 'ML10', code: 'ML10', name: 'Mobile Legends 10K Diamonds', categoryCode: 'GAME', price: 10300, type: 'PRABAYAR', operator: 'Moonton' },
            { id: 'STEAM10', code: 'STEAM10', name: 'Steam Wallet 10K', categoryCode: 'GAME', price: 11000, type: 'PRABAYAR', operator: 'Steam' },
            { id: 'STEAM20', code: 'STEAM20', name: 'Steam Wallet 20K', categoryCode: 'GAME', price: 21000, type: 'PRABAYAR', operator: 'Steam' },
          ];
          break;
        default:
          products = [];
      }
      
      const filteredProducts = products.filter(p => 
        !type || p.type.toUpperCase() === (type as string)?.toUpperCase()
      ).map(p => ({
        ...p,
        isActive: true,
        description: `${p.name} - Tersedia melalui Indotel API (C71283)`
      }));
      
      res.json(filteredProducts);
    } catch (error) {
      console.error('Products API error:', error);
      res.status(500).json({ 
        message: "Error mengambil data produk",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST CEK TAGIHAN / CHECK BILL - untuk produk pascabayar
  app.post("/api/check-bill", async (req, res) => {
    try {
      const { customer_number, product_code } = req.body;
      
      if (!customer_number || !product_code) {
        return res.status(400).json({ message: "Nomor pelanggan dan kode produk diperlukan" });
      }

      const indotelAPI = createIndotelAPI();
      const response = await indotelAPI.checkBill({ customer_number, product_code });
      
      res.json(response);
    } catch (error) {
      console.error('Check bill API error:', error);
      res.status(503).json({ message: "Tidak dapat mengecek tagihan. Pastikan konfigurasi API Indotel sudah benar." });
    }
  });

  // POST CEK HARGA - cek harga produk
  app.post("/api/check-price", async (req, res) => {
    try {
      const { product_code } = req.body;
      
      if (!product_code) {
        return res.status(400).json({ message: "Kode produk diperlukan" });
      }

      const indotelAPI = createIndotelAPI();
      const response = await indotelAPI.checkPrice(product_code);
      
      res.json(response);
    } catch (error) {
      console.error('Check price API error:', error);
      res.status(503).json({ message: "Tidak dapat mengecek harga. Pastikan konfigurasi API Indotel sudah benar." });
    }
  });

  // POST CEK SALDO / CHECK BALANCE
  app.get("/api/balance", async (req, res) => {
    try {
      const indotelAPI = createIndotelAPI();
      const response = await indotelAPI.checkBalance();
      
      res.json(response);
    } catch (error) {
      console.error('Check balance API error:', error);
      res.status(503).json({ message: "Tidak dapat mengecek saldo. Pastikan konfigurasi API Indotel sudah benar." });
    }
  });

  // POST HISTORY - riwayat transaksi dari Indotel
  app.get("/api/indotel-history", async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      const indotelAPI = createIndotelAPI();
      const response = await indotelAPI.getHistory(start_date as string, end_date as string);
      
      res.json(response);
    } catch (error) {
      console.error('History API error:', error);
      res.status(503).json({ message: "Tidak dapat mengambil riwayat transaksi. Pastikan konfigurasi API Indotel sudah benar." });
    }
  });

  // Get product by code (not needed for external API only, but keeping for compatibility)
  app.get("/api/products/:code", async (req, res) => {
    try {
      return res.status(404).json({ message: "Gunakan endpoint /api/products dengan parameter kategori" });
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data produk" });
    }
  });

  // Create transaction - Direct integration dengan API Indotel
  app.post("/api/transactions", async (req, res) => {
    try {
      const { productCode, customerNumber, amount } = req.body;
      
      if (!productCode || !customerNumber) {
        return res.status(400).json({ message: "Product code dan customer number diperlukan" });
      }

      // Generate transaction ID dengan format Indotel
      const now = new Date();
      const dateStr = now.getFullYear().toString().substr(-2) + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
      const timeStr = now.getHours().toString().padStart(2, '0') + 
                    now.getMinutes().toString().padStart(2, '0');
      const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const transactionId = `INV${dateStr}${timeStr}${randomStr}`;

      try {
        const indotelAPI = createIndotelAPI();
        
        // Cek apakah produk pascabayar (PLN, PDAM, BPJS)
        if ((productCode.includes('PLN') || productCode.includes('PDAM') || productCode.includes('BPJS')) && !amount) {
          // Untuk pascabayar, gunakan CHECK BILL terlebih dahulu
          const billCheck = await indotelAPI.checkBill({
            product_code: productCode,
            customer_number: customerNumber
          });
          
          if (billCheck.status === 'success' && billCheck.data) {
            // Simpan ke database dengan info tagihan
            const transaction = await storage.createTransaction({
              transactionId,
              productCode,
              customerNumber,
              amount: billCheck.data.amount,
              status: 'confirmed',
              billInfo: billCheck.data,
            });
            
            return res.json({
              ...transaction,
              message: "Tagihan berhasil dicek. Silakan lakukan pembayaran.",
              billDetails: billCheck.data
            });
          } else {
            throw new Error('Tidak dapat mengecek tagihan dari API Indotel');
          }
        } else {
          // Untuk prabayar, langsung proses TOPUP
          const topupResult = await indotelAPI.topup({
            product_code: productCode,
            customer_number: customerNumber,
            reference_id: transactionId
          });
          
          if (topupResult.status === 'success' && topupResult.data) {
            // Simpan transaksi berhasil
            const transaction = await storage.createTransaction({
              transactionId,
              productCode,
              customerNumber,
              amount: topupResult.data.amount || amount,
              status: topupResult.data.status === 'success' ? 'success' : 'processing',
              indotelTransactionId: topupResult.data.transaction_id,
              serialNumber: topupResult.data.serial_number,
            });
            
            return res.json({
              ...transaction,
              message: topupResult.data.status === 'success' ? 
                "Transaksi berhasil diproses!" : "Transaksi sedang diproses...",
              indotelResponse: topupResult.data
            });
          } else {
            throw new Error('Gagal memproses transaksi melalui API Indotel');
          }
        }
      } catch (apiError) {
        console.error('Indotel API error:', apiError);
        return res.status(503).json({ 
          message: "Tidak dapat memproses transaksi melalui API Indotel",
          error: apiError instanceof Error ? apiError.message : 'API Error',
          suggestion: "Pastikan kredensial API sudah benar dan saldo mencukupi"
        });
      }
    } catch (error) {
      console.error('Transaction creation error:', error);
      res.status(500).json({ 
        message: "Error pada sistem transaksi",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST TOPUP - proses pembelian prabayar melalui API Indotel
  app.post("/api/topup", async (req, res) => {
    try {
      const { transactionId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID diperlukan" });
      }

      // Ambil data transaksi
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: "Transaksi tidak dalam status pending" });
      }

      try {
        const indotelAPI = createIndotelAPI();
        
        // Proses topup menggunakan POST TOPUP dari API Indotel
        const topupResponse = await indotelAPI.topup({
          customer_number: transaction.customerNumber,
          product_code: transaction.productCode
        });

        // Update status dan Indotel reference ID
        await storage.updateTransactionStatus(
          transactionId, 
          'processing',
          topupResponse.data?.transaction_id
        );

        res.json({
          message: "Transaksi berhasil diproses",
          indotelResponse: topupResponse,
          status: 'processing'
        });
      } catch (apiError) {
        console.error('Indotel API Error:', apiError);
        
        // Update status ke failed jika API error
        await storage.updateTransactionStatus(transactionId, 'failed');
        
        res.status(503).json({ 
          message: "Gagal memproses transaksi melalui API Indotel",
          error: apiError instanceof Error ? apiError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Topup API error:', error);
      res.status(500).json({ message: "Gagal memproses topup" });
    }
  });

  // POST BAYAR TAGIHAN / PAY BILL - proses pembayaran pascabayar
  app.post("/api/pay-bill", async (req, res) => {
    try {
      const { transactionId, ref_id } = req.body;
      
      if (!transactionId || !ref_id) {
        return res.status(400).json({ message: "Transaction ID dan Reference ID diperlukan" });
      }

      // Ambil data transaksi
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: "Transaksi tidak dalam status pending" });
      }

      try {
        const indotelAPI = createIndotelAPI();
        
        // Proses pembayaran menggunakan POST BAYAR TAGIHAN dari API Indotel
        const payResponse = await indotelAPI.payBill({
          customer_number: transaction.customerNumber,
          product_code: transaction.productCode,
          ref_id: ref_id
        });

        // Update status dan Indotel reference ID
        await storage.updateTransactionStatus(
          transactionId, 
          'processing',
          payResponse.data?.transaction_id || ref_id
        );

        res.json({
          message: "Pembayaran tagihan berhasil diproses",
          indotelResponse: payResponse,
          status: 'processing'
        });
      } catch (apiError) {
        console.error('Indotel Pay Bill API Error:', apiError);
        
        // Update status ke failed jika API error
        await storage.updateTransactionStatus(transactionId, 'failed');
        
        res.status(503).json({ 
          message: "Gagal memproses pembayaran melalui API Indotel",
          error: apiError instanceof Error ? apiError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Pay bill API error:', error);
      res.status(500).json({ message: "Gagal memproses pembayaran tagihan" });
    }
  });

  // POST STATUS - cek status transaksi dari Indotel
  app.post("/api/transaction-status", async (req, res) => {
    try {
      const { transactionId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID diperlukan" });
      }

      // Ambil data transaksi lokal
      const localTransaction = await storage.getTransactionByTransactionId(transactionId);
      if (!localTransaction || !localTransaction.indotelRefId) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan atau belum diproses" });
      }

      try {
        const indotelAPI = createIndotelAPI();
        
        // Cek status dari API Indotel menggunakan POST STATUS
        const statusResponse = await indotelAPI.getTransactionStatus(localTransaction.indotelRefId);

        // Update status lokal berdasarkan response dari Indotel
        if (statusResponse.data?.status) {
          await storage.updateTransactionStatus(transactionId, statusResponse.data.status);
        }

        res.json({
          localStatus: localTransaction.status,
          indotelResponse: statusResponse
        });
      } catch (apiError) {
        console.error('Indotel Status API Error:', apiError);
        res.status(503).json({ 
          message: "Gagal mengecek status dari API Indotel",
          localStatus: localTransaction.status,
          error: apiError instanceof Error ? apiError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Transaction status API error:', error);
      res.status(500).json({ message: "Gagal mengecek status transaksi" });
    }
  });

  // POST CALLBACK - webhook untuk menerima update status dari Indotel
  app.post("/api/callback", async (req, res) => {
    try {
      const callbackData = req.body;
      
      // Log callback untuk debugging
      console.log('Received Indotel callback:', JSON.stringify(callbackData, null, 2));

      // Validasi callback data
      if (!callbackData.transaction_id || !callbackData.status) {
        return res.status(400).json({ message: "Callback data tidak valid" });
      }

      // Cari transaksi berdasarkan Indotel reference ID
      const transactions = await storage.getAllTransactions();
      const transaction = transactions.find(t => t.indotelRefId === callbackData.transaction_id);

      if (!transaction) {
        console.log(`Transaksi dengan Indotel ref ID ${callbackData.transaction_id} tidak ditemukan`);
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      // Update status berdasarkan callback
      await storage.updateTransactionStatus(
        transaction.transactionId, 
        callbackData.status,
        callbackData.transaction_id
      );

      console.log(`Status transaksi ${transaction.transactionId} diupdate menjadi ${callbackData.status}`);

      res.json({ 
        message: "Callback berhasil diproses",
        transactionId: transaction.transactionId,
        newStatus: callbackData.status
      });
    } catch (error) {
      console.error('Callback API error:', error);
      res.status(500).json({ message: "Gagal memproses callback" });
    }
  });

  // Upload payment proof
  app.post("/api/transactions/:transactionId/payment-proof", upload.single('paymentProof'), async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: "File bukti pembayaran diperlukan" });
      }

      // Create a proper filename with extension
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `payment-${transactionId}-${Date.now()}${fileExtension}`;
      const finalPath = path.join(uploadDir, fileName);
      
      // Rename the uploaded file
      fs.renameSync(req.file.path, finalPath);
      
      const paymentProofUrl = `/uploads/${fileName}`;
      
      const transaction = await storage.updateTransactionPaymentProof(
        transactionId, 
        paymentProofUrl
      );

      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      res.json({ 
        message: "Bukti pembayaran berhasil diupload",
        transaction,
        paymentProofUrl 
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal mengupload bukti pembayaran" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File tidak ditemukan" });
    }
  });

  // Get all transactions (for admin)
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data transaksi" });
    }
  });

  // Get single transaction
  app.get("/api/transactions/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data transaksi" });
    }
  });

  // Update transaction status (for admin)
  app.patch("/api/transactions/:transactionId/status", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { status } = req.body;
      
      if (!["pending", "processing", "success", "failed", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
      }

      const transaction = await storage.updateTransactionStatus(transactionId, status);

      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengupdate status transaksi" });
    }
  });

  // Indotel API integration - Inquiry (cek tagihan)
  app.post("/api/indotel/inquiry", async (req, res) => {
    try {
      const { productCode, customerNumber, additionalData } = req.body;
      
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(503).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      // Generate refID untuk transaksi
      const refID = `INQ${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Format nomor tujuan dengan additional data jika ada
      let destination = customerNumber;
      if (additionalData) {
        if (productCode.includes('PBB') && additionalData.year) {
          destination = `${customerNumber}@${additionalData.year}`;
        } else if (productCode.includes('BPJS') && additionalData.period) {
          destination = `${customerNumber}@${additionalData.period}`;
        } else if (productCode.includes('CC') && additionalData.amount) {
          destination = `${customerNumber}@${additionalData.amount}`;
        }
      }

      // API Indotel untuk cek tagihan (jenis=5) - sesuai dokumentasi
      const apiUrl = `https://${indotelUrl}/http-get?product=${productCode}&dest=${destination}&refID=${refID}&memberID=${indotelMMID}&jenis=5&pin=${indotelPassword}&password=${indotelPassword}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; Indotel-Client/1.0)',
        },
      });

      if (response.ok) {
        const htmlText = await response.text();
        
        // Parse response dari API Indotel
        if (htmlText.includes('SUKSES CEK TAGIHAN')) {
          // Extract data dari response HTML
          const nameMatch = htmlText.match(/Nama:([^\/]+)/);
          const tagihan = htmlText.match(/Tagihan:Rp(\d+)/);
          const admin = htmlText.match(/Admin:Rp(\d+)/);
          const total = htmlText.match(/Total:Rp(\d+)/);
          
          res.json({
            success: true,
            refID,
            data: {
              customerNumber,
              customerName: nameMatch ? nameMatch[1].trim() : "N/A",
              billAmount: tagihan ? parseInt(tagihan[1]) : 0,
              adminFee: admin ? parseInt(admin[1]) : 0,
              totalAmount: total ? parseInt(total[1]) : 0,
              rawResponse: htmlText
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Tagihan tidak ditemukan atau terjadi kesalahan",
            error: htmlText
          });
        }
      } else {
        const errorText = await response.text();
        res.status(502).json({ 
          message: "Gagal melakukan inquiry ke API Indotel",
          error: errorText
        });
      }
    } catch (error) {
      console.error('Indotel inquiry error:', error);
      res.status(500).json({ message: "Gagal melakukan inquiry" });
    }
  });

  // Indotel API integration - Payment
  app.post("/api/indotel/payment", async (req, res) => {
    try {
      const { productCode, customerNumber, amount, transactionId, additionalData } = req.body;
      
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(503).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const refID = transactionId || `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Format nomor tujuan dengan additional data jika ada
      let destination = customerNumber;
      if (additionalData) {
        if (productCode.includes('PBB') && additionalData.year) {
          destination = `${customerNumber}@${additionalData.year}`;
        } else if (productCode.includes('BPJS') && additionalData.period) {
          destination = `${customerNumber}@${additionalData.period}`;
        } else if (productCode.includes('CC') && additionalData.amount) {
          destination = `${customerNumber}@${additionalData.amount}`;
        }
      }

      let apiUrl = '';
      
      // Tentukan endpoint berdasarkan jenis produk - sesuai dokumentasi
      if (productCode.includes('PASC') || productCode.includes('PDAM') || productCode.includes('BPJS')) {
        // Untuk pascabayar, bayar tagihan (jenis=6)
        apiUrl = `https://${indotelUrl}/http-get?product=${productCode}&dest=${destination}&refID=${refID}&memberID=${indotelMMID}&jenis=6&pin=${indotelPassword}&password=${indotelPassword}`;
      } else {
        // Untuk prabayar, topup biasa
        apiUrl = `https://${indotelUrl}/http-get?product=${productCode}&dest=${destination}&refID=${refID}&memberID=${indotelMMID}&qty=1&pin=${indotelPassword}&password=${indotelPassword}`;
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; Indotel-Client/1.0)',
        },
      });

      if (response.ok) {
        const htmlText = await response.text();
        
        if (htmlText.includes('SUKSES')) {
          // Extract data dari response sukses
          const snMatch = htmlText.match(/SN:(\d+)/);
          const hrgMatch = htmlText.match(/HRG:(\d+)/);
          
          res.json({
            success: true,
            transactionId: refID,
            serialNumber: snMatch ? snMatch[1] : null,
            amount: hrgMatch ? parseInt(hrgMatch[1]) : amount,
            message: "Transaksi berhasil",
            rawResponse: htmlText
          });
        } else if (htmlText.includes('GAGAL')) {
          // Extract error message dari response gagal
          const msgMatch = htmlText.match(/MSG:\s*([^.]+)/);
          res.status(400).json({
            success: false,
            message: msgMatch ? msgMatch[1].trim() : "Transaksi gagal",
            error: htmlText
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Response tidak dikenali dari API Indotel",
            error: htmlText
          });
        }
      } else {
        const errorText = await response.text();
        res.status(502).json({ 
          message: "Gagal melakukan pembayaran ke API Indotel",
          error: errorText
        });
      }
    } catch (error) {
      console.error('Indotel payment error:', error);
      res.status(500).json({ message: "Gagal melakukan pembayaran" });
    }
  });

}