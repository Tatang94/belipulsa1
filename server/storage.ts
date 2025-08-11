import { type Transaction, type InsertTransaction, type Category, type InsertCategory, type Product, type InsertProduct } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  updateTransactionStatus(transactionId: string, status: string, indotelRefId?: string): Promise<Transaction | undefined>;
  updateTransactionPaymentProof(transactionId: string, paymentProofUrl: string): Promise<Transaction | undefined>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product methods
  getProductsByCategory(categoryCode: string, type?: string): Promise<Product[]>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  getAllProducts(): Promise<Product[]>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;

  constructor() {
    this.transactions = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize default categories
    const defaultCategories: InsertCategory[] = [
      { code: "PULSA", name: "Pulsa", icon: "mobile-alt", description: "Semua Operator" },
      { code: "DATA", name: "Paket Data", icon: "wifi", description: "Internet" },
      { code: "PLN", name: "PLN", icon: "bolt", description: "Token Listrik" },
      { code: "PDAM", name: "PDAM", icon: "tint", description: "Air" },
      { code: "BPJS", name: "BPJS", icon: "heart", description: "Kesehatan" },
      { code: "GAME", name: "Voucher Game", icon: "gamepad", description: "Gaming" },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = { 
        ...cat, 
        id: randomUUID(),
        description: cat.description || null
      };
      this.categories.set(category.id, category);
    });

    // Initialize default products
    const defaultProducts: InsertProduct[] = [
      { code: "T1", name: "THREE 1.000", categoryCode: "PULSA", operator: "THREE", price: 2000, description: "Pulsa THREE Rp 1.000", type: "PRABAYAR", isActive: true },
      { code: "T2", name: "THREE 5.000", categoryCode: "PULSA", operator: "THREE", price: 5500, description: "Pulsa THREE Rp 5.000", type: "PRABAYAR", isActive: true },
      { code: "T3", name: "THREE 10.000", categoryCode: "PULSA", operator: "THREE", price: 10500, description: "Pulsa THREE Rp 10.000", type: "PRABAYAR", isActive: true },
      { code: "XL1", name: "XL 5.000", categoryCode: "PULSA", operator: "XL", price: 5200, description: "Pulsa XL Rp 5.000", type: "PRABAYAR", isActive: true },
      { code: "TSEL1", name: "Telkomsel 5.000", categoryCode: "PULSA", operator: "Telkomsel", price: 5300, description: "Pulsa Telkomsel Rp 5.000", type: "PRABAYAR", isActive: true },
      { code: "PLN20", name: "PLN Token 20k", categoryCode: "PLN", operator: "PLN", price: 20500, description: "Token PLN Rp 20.000", type: "PRABAYAR", isActive: true },
      { code: "PLN50", name: "PLN Token 50k", categoryCode: "PLN", operator: "PLN", price: 50500, description: "Token PLN Rp 50.000", type: "PRABAYAR", isActive: true },
    ];

    defaultProducts.forEach(prod => {
      const product: Product = { 
        ...prod, 
        id: randomUUID(),
        operator: prod.operator || null,
        description: prod.description || null,
        isActive: prod.isActive ?? true
      };
      this.products.set(product.id, product);
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: insertTransaction.status || "pending",
      paymentProofUrl: insertTransaction.paymentProofUrl || null,
      indotelRefId: insertTransaction.indotelRefId || null,
      periode: insertTransaction.periode || null,
      tahun: insertTransaction.tahun || null,
      nominal: insertTransaction.nominal || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (transaction) => transaction.transactionId === transactionId,
    );
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.status === "pending",
    );
  }

  async updateTransactionStatus(transactionId: string, status: string, indotelRefId?: string): Promise<Transaction | undefined> {
    const transaction = await this.getTransactionByTransactionId(transactionId);
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = new Date();
      if (indotelRefId) {
        transaction.indotelRefId = indotelRefId;
      }
      this.transactions.set(transaction.id, transaction);
      return transaction;
    }
    return undefined;
  }

  async updateTransactionPaymentProof(transactionId: string, paymentProofUrl: string): Promise<Transaction | undefined> {
    const transaction = await this.getTransactionByTransactionId(transactionId);
    if (transaction) {
      transaction.paymentProofUrl = paymentProofUrl;
      transaction.updatedAt = new Date();
      this.transactions.set(transaction.id, transaction);
      return transaction;
    }
    return undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id,
      description: insertCategory.description || null
    };
    this.categories.set(id, category);
    return category;
  }

  async getProductsByCategory(categoryCode: string, type?: string): Promise<Product[]> {
    const products = Array.from(this.products.values()).filter(
      (product) => product.categoryCode === categoryCode && product.isActive
    );
    
    if (type) {
      return products.filter(product => product.type === type);
    }
    
    return products;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.code === code,
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      operator: insertProduct.operator || null,
      description: insertProduct.description || null,
      isActive: insertProduct.isActive ?? true
    };
    this.products.set(id, product);
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
}

export const storage = new MemStorage();
