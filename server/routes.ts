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
  // Get all categories - menggunakan POST PRODUCT CATEGORY dari API Indotel
  app.get("/api/categories", async (req, res) => {
    try {
      // Coba buat instance API Indotel
      try {
        const indotelAPI = createIndotelAPI();
        
        // Coba ambil dari API Indotel
        const response = await indotelAPI.getCategories();
        if (response.status === 'success' && response.data) {
          return res.json(response.data.map(cat => ({
            id: `indotel-${cat.code}`,
            code: cat.code,
            name: cat.name,
            icon: cat.icon || getIconForCategory(cat.name),
            description: cat.description || `${cat.name} melalui API Indotel`
          })));
        }
      } catch (apiError) {
        // Jika error adalah konfigurasi yang tidak lengkap, gunakan fallback
        if (apiError instanceof Error && apiError.message === 'API_NOT_CONFIGURED') {
          console.log('API Indotel belum dikonfigurasi, menggunakan kategori default');
        } else {
          console.log('Error koneksi API Indotel, menggunakan kategori default:', apiError);
        }
      }

      // Fallback ke kategori default jika API tidak tersedia atau belum dikonfigurasi
      const defaultCategories = [
        { id: 'indotel-1', code: 'PULSA', name: 'Pulsa', icon: 'mobile-alt', description: 'Pulsa semua operator (Demo)' },
        { id: 'indotel-2', code: 'DATA', name: 'Paket Data', icon: 'wifi', description: 'Paket data internet (Demo)' },
        { id: 'indotel-3', code: 'PLN', name: 'PLN', icon: 'bolt', description: 'Token listrik dan tagihan PLN (Demo)' },
        { id: 'indotel-4', code: 'PDAM', name: 'PDAM', icon: 'tint', description: 'Tagihan air PDAM (Demo)' },
        { id: 'indotel-5', code: 'BPJS', name: 'BPJS', icon: 'heart', description: 'BPJS Kesehatan (Demo)' },
        { id: 'indotel-6', code: 'GAME', name: 'Voucher Game', icon: 'gamepad', description: 'Voucher gaming (Demo)' },
      ];
      
      return res.json(defaultCategories);
    } catch (error) {
      console.error('Categories API error:', error);
      
      // Tetap berikan response dengan data demo
      const defaultCategories = [
        { id: 'indotel-1', code: 'PULSA', name: 'Pulsa', icon: 'mobile-alt', description: 'Pulsa semua operator (Demo)' },
        { id: 'indotel-2', code: 'DATA', name: 'Paket Data', icon: 'wifi', description: 'Paket data internet (Demo)' },
        { id: 'indotel-3', code: 'PLN', name: 'PLN', icon: 'bolt', description: 'Token listrik dan tagihan PLN (Demo)' },
        { id: 'indotel-4', code: 'PDAM', name: 'PDAM', icon: 'tint', description: 'Tagihan air PDAM (Demo)' },
        { id: 'indotel-5', code: 'BPJS', name: 'BPJS', icon: 'heart', description: 'BPJS Kesehatan (Demo)' },
        { id: 'indotel-6', code: 'GAME', name: 'Voucher Game', icon: 'gamepad', description: 'Voucher gaming (Demo)' },
      ];
      
      return res.json(defaultCategories);
    }
  });

  // Get products by category - menggunakan POST LIST PRODUCT dari API Indotel
  app.get("/api/products", async (req, res) => {
    try {
      const { category, type } = req.query;
      if (!category) {
        return res.status(400).json({ message: "Parameter kategori diperlukan" });
      }

      try {
        const indotelAPI = createIndotelAPI();
        
        // Coba ambil dari API Indotel terlebih dahulu menggunakan POST LIST PRODUCT
        const response = await indotelAPI.getProducts(category as string);
        if (response.status === 'success' && response.data) {
          const filteredProducts = response.data
            .filter(p => !type || p.type.toUpperCase() === (type as string)?.toUpperCase())
            .map(p => ({
              id: `indotel-${p.code}`,
              code: p.code,
              name: p.name,
              categoryCode: p.category,
              operator: p.operator,
              price: p.price,
              type: p.type,
              isActive: true,
              description: p.description || `${p.name} melalui API Indotel`
            }));
          
          return res.json(filteredProducts);
        }
      } catch (apiError) {
        if (apiError instanceof Error && apiError.message === 'API_NOT_CONFIGURED') {
          console.log('API Indotel belum dikonfigurasi, menggunakan produk default');
        } else {
          console.log('Error koneksi API Indotel, menggunakan produk default:', apiError);
        }
      }

      // Fallback ke produk default jika API tidak tersedia
      let products: any[] = [];
      
      switch (category?.toString().toUpperCase()) {
        case 'PULSA':
          products = [
            { id: '1', code: 'T1', name: 'Telkomsel 5K', categoryCode: 'PULSA', price: 5700, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: '2', code: 'T5', name: 'Telkomsel 10K', categoryCode: 'PULSA', price: 10700, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: '3', code: 'I1', name: 'Indosat 5K', categoryCode: 'PULSA', price: 5600, type: 'PRABAYAR', operator: 'Indosat' },
            { id: '11', code: 'X1', name: 'XL 5K', categoryCode: 'PULSA', price: 5800, type: 'PRABAYAR', operator: 'XL' },
          ];
          break;
        case 'DATA':
          products = [
            { id: '4', code: 'TD1GB', name: 'Telkomsel Data 1GB', categoryCode: 'DATA', price: 15000, type: 'PRABAYAR', operator: 'Telkomsel' },
            { id: '5', code: 'ID1GB', name: 'Indosat Data 1GB', categoryCode: 'DATA', price: 14000, type: 'PRABAYAR', operator: 'Indosat' },
            { id: '12', code: 'XD1GB', name: 'XL Data 1GB', categoryCode: 'DATA', price: 13000, type: 'PRABAYAR', operator: 'XL' },
          ];
          break;
        case 'PLN':
          if (type === 'PRABAYAR') {
            products = [
              { id: '6', code: 'PLN20', name: 'PLN Token 20K', categoryCode: 'PLN', price: 20500, type: 'PRABAYAR', operator: 'PLN' },
              { id: '7', code: 'PLN50', name: 'PLN Token 50K', categoryCode: 'PLN', price: 50500, type: 'PRABAYAR', operator: 'PLN' },
              { id: '13', code: 'PLN100', name: 'PLN Token 100K', categoryCode: 'PLN', price: 100500, type: 'PRABAYAR', operator: 'PLN' },
            ];
          } else {
            products = [
              { id: '8', code: 'PLNPASC', name: 'PLN Pascabayar', categoryCode: 'PLN', price: 0, type: 'PASCABAYAR', operator: 'PLN' },
              { id: '14', code: 'PLNNONTGL', name: 'PLN Non Taglis', categoryCode: 'PLN', price: 0, type: 'PASCABAYAR', operator: 'PLN' },
            ];
          }
          break;
        case 'PDAM':
          products = [
            { id: '9', code: 'PDAMSLTG', name: 'PDAM Salatiga', categoryCode: 'PDAM', price: 0, type: 'PASCABAYAR', operator: 'PDAM' },
            { id: '15', code: 'PDAMJKT', name: 'PDAM Jakarta', categoryCode: 'PDAM', price: 0, type: 'PASCABAYAR', operator: 'PDAM' },
          ];
          break;
        case 'BPJS':
          products = [
            { id: '10', code: 'BPJS', name: 'BPJS Kesehatan', categoryCode: 'BPJS', price: 0, type: 'PASCABAYAR', operator: 'BPJS' },
          ];
          break;
        case 'GAME':
          products = [
            { id: '16', code: 'GARENA', name: 'Garena Voucher', categoryCode: 'GAME', price: 10000, type: 'PRABAYAR', operator: 'Garena' },
            { id: '17', code: 'STEAM', name: 'Steam Wallet', categoryCode: 'GAME', price: 50000, type: 'PRABAYAR', operator: 'Steam' },
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
        description: `${p.name} - Demo Mode (API belum dikonfigurasi)`
      }));
      
      return res.json(filteredProducts);
    } catch (error) {
      console.error('Products API error:', error);
      res.status(502).json({ message: "Tidak dapat terhubung ke server Indotel" });
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

  // Create transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Generate transaction ID
      const now = new Date();
      const dateStr = now.getFullYear().toString().substr(-2) + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
      const timeStr = now.getHours().toString().padStart(2, '0') + 
                    now.getMinutes().toString().padStart(2, '0');
      const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const transactionId = `TRX${dateStr}${timeStr}${randomStr}`;

      const transaction = await storage.createTransaction({
        ...validatedData,
        transactionId,
      });

      res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Gagal membuat transaksi" });
      }
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