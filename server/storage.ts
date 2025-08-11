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
  
  // Note: Category and Product methods removed - using external Indotel API only
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;

  constructor() {
    this.transactions = new Map();
    // Only storing transactions - categories and products from external API
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

  // Category and Product methods removed - using external Indotel API only
}

export const storage = new MemStorage();
