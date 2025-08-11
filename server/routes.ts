import { Application } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "../shared/schema";
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
  // Get all categories (berdasarkan dokumentasi API Indotel)
  app.get("/api/categories", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(503).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      // Berdasarkan dokumentasi API Indotel, menampilkan kategori produk yang tersedia
      const defaultCategories = [
        { id: 'indotel-1', code: 'PULSA', name: 'Pulsa', icon: 'mobile-alt', description: 'Pulsa semua operator' },
        { id: 'indotel-2', code: 'DATA', name: 'Paket Data', icon: 'wifi', description: 'Paket data internet' },
        { id: 'indotel-3', code: 'PLN', name: 'PLN', icon: 'bolt', description: 'Token listrik dan tagihan PLN' },
        { id: 'indotel-4', code: 'PDAM', name: 'PDAM', icon: 'tint', description: 'Tagihan air PDAM' },
        { id: 'indotel-5', code: 'BPJS', name: 'BPJS', icon: 'heart', description: 'BPJS Kesehatan' },
        { id: 'indotel-6', code: 'GAME', name: 'Voucher Game', icon: 'gamepad', description: 'Voucher gaming' },
      ];
      
      return res.json(defaultCategories);
    } catch (error) {
      console.error('Categories API error:', error);
      res.status(502).json({ message: "Tidak dapat terhubung ke server Indotel" });
    }
  });

  // Get products by category (berdasarkan dokumentasi API Indotel)
  app.get("/api/products", async (req, res) => {
    try {
      const { category, type } = req.query;
      if (!category) {
        return res.status(400).json({ message: "Parameter kategori diperlukan" });
      }
      
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(503).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      // Berdasarkan dokumentasi API Indotel, menampilkan produk berdasarkan kategori
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
        p.type.toUpperCase() === (type as string)?.toUpperCase()
      ).map(p => ({
        ...p,
        isActive: true,
        description: `${p.name} - Melalui API Indotel (format sesuai dokumentasi)`
      }));
      
      return res.json(filteredProducts);
    } catch (error) {
      console.error('Products API error:', error);
      res.status(502).json({ message: "Tidak dapat terhubung ke server Indotel" });
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
      const transaction = await storage.getTransactionById(transactionId);
      
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