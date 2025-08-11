import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data kategori" });
    }
  });

  // Get products by category
  app.get("/api/products", async (req, res) => {
    try {
      const { category, type } = req.query;
      if (!category) {
        return res.status(400).json({ message: "Parameter kategori diperlukan" });
      }
      
      const products = await storage.getProductsByCategory(
        category as string, 
        type as string
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data produk" });
    }
  });

  // Get product by code
  app.get("/api/products/:code", async (req, res) => {
    try {
      const product = await storage.getProductByCode(req.params.code);
      if (!product) {
        return res.status(404).json({ message: "Produk tidak ditemukan" });
      }
      res.json(product);
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

  // Get all transactions (admin)
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data transaksi" });
    }
  });

  // Get pending transactions (admin)
  app.get("/api/transactions/pending", async (req, res) => {
    try {
      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data transaksi pending" });
    }
  });

  // Approve/reject transaction
  app.patch("/api/transactions/:transactionId/status", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { status } = req.body;

      if (!['processing', 'success', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
      }

      // If approving, we should call Indotel API
      if (status === 'processing') {
        const transaction = await storage.getTransactionByTransactionId(transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        try {
          // Call Indotel API for transaction processing
          const indotelUrl = process.env.INDOTEL_URL;
          const indotelPassword = process.env.INDOTEL_PASSWORD;
          const indotelMMID = process.env.INDOTEL_MMID;
          
          if (indotelUrl && indotelPassword && indotelMMID) {
            const requestBody = {
              mmid: indotelMMID,
              ref_1: transaction.transactionId,
              product_code: transaction.productCode,
              customer_id: transaction.customerId,
              ...(transaction.periode && { periode: transaction.periode }),
              ...(transaction.tahun && { tahun: transaction.tahun }),
              ...(transaction.nominal && { nominal: transaction.nominal.toString() })
            };

            const response = await fetch(`${indotelUrl}/V1/api/topup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'rqid': indotelPassword,
              },
              body: JSON.stringify(requestBody),
            });

            const result = await response.json();
            
            if (result.status === 'success' || result.code === '00') {
              // Success
              const updatedTransaction = await storage.updateTransactionStatus(
                transactionId, 
                'success', 
                result.ref_2 || result.refid || `REF${Date.now()}`
              );
              return res.json(updatedTransaction);
            } else {
              // API error but still mark as processing
              console.log('Indotel API response:', result);
              const updatedTransaction = await storage.updateTransactionStatus(
                transactionId, 
                'processing', 
                `API_ERROR_${Date.now()}`
              );
              return res.json(updatedTransaction);
            }
          }
        } catch (error) {
          console.error('Indotel API error:', error);
        }

        // Fallback: Mark as processing without API call
        const updatedTransaction = await storage.updateTransactionStatus(
          transactionId, 
          'processing', 
          `MANUAL_${Date.now()}`
        );
        return res.json(updatedTransaction);
      } else {
        const transaction = await storage.updateTransactionStatus(transactionId, status);
        
        if (!transaction) {
          return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        res.json(transaction);
      }
    } catch (error) {
      res.status(500).json({ message: "Gagal mengupdate status transaksi" });
    }
  });

  // Indotel API integration
  app.post("/api/indotel/inquiry", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(400).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const requestBody = {
        mmid: indotelMMID,
        ...req.body
      };
      
      const response = await fetch(`${indotelUrl}/V1/api/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'rqid': indotelPassword,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Indotel inquiry error:', error);
      res.status(500).json({ message: "Gagal melakukan inquiry ke server Indotel" });
    }
  });

  app.post("/api/indotel/payment", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(400).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const requestBody = {
        mmid: indotelMMID,
        ...req.body
      };
      
      const response = await fetch(`${indotelUrl}/V1/api/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'rqid': indotelPassword,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Indotel payment error:', error);
      res.status(500).json({ message: "Gagal melakukan pembayaran ke server Indotel" });
    }
  });

  app.post("/api/indotel/topup", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(400).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const requestBody = {
        mmid: indotelMMID,
        ...req.body
      };
      
      const response = await fetch(`${indotelUrl}/V1/api/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'rqid': indotelPassword,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Indotel topup error:', error);
      res.status(500).json({ message: "Gagal melakukan topup ke server Indotel" });
    }
  });

  // Get Indotel product categories
  app.post("/api/indotel/product-categories", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(400).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const requestBody = {
        mmid: indotelMMID
      };
      
      const response = await fetch(`${indotelUrl}/V1/api/product-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'rqid': indotelPassword,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Indotel categories error:', error);
      res.status(500).json({ message: "Gagal mengambil kategori produk dari Indotel" });
    }
  });

  // Get Indotel products by category
  app.post("/api/indotel/products", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(400).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const requestBody = {
        mmid: indotelMMID,
        ...req.body
      };
      
      const response = await fetch(`${indotelUrl}/V1/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'rqid': indotelPassword,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Indotel products error:', error);
      res.status(500).json({ message: "Gagal mengambil produk dari Indotel" });
    }
  });

  // Check Indotel balance
  app.post("/api/indotel/balance", async (req, res) => {
    try {
      const indotelUrl = process.env.INDOTEL_URL;
      const indotelPassword = process.env.INDOTEL_PASSWORD;
      const indotelMMID = process.env.INDOTEL_MMID;
      
      if (!indotelUrl || !indotelPassword || !indotelMMID) {
        return res.status(400).json({ message: "Konfigurasi API Indotel belum lengkap" });
      }

      const requestBody = {
        mmid: indotelMMID
      };
      
      const response = await fetch(`${indotelUrl}/V1/api/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'rqid': indotelPassword,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Indotel balance error:', error);
      res.status(500).json({ message: "Gagal mengecek saldo Indotel" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
