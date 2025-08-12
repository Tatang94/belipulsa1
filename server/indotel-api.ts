// API Indotel Integration berdasarkan dokumentasi yang diberikan
export interface IndotelConfig {
  url: string;
  mmid: string;
  password: string;
}

export interface IndotelResponse<T = any> {
  status: string;
  message: string;
  data?: T;
}

// Interface untuk berbagai request dan response
export interface TopupRequest {
  customer_number: string;
  product_code: string;
}

export interface TopupResponse {
  transaction_id: string;
  customer_number: string;
  product_code: string;
  amount: number;
  status: string;
}

export interface CheckBillRequest {
  customer_number: string;
  product_code: string;
}

export interface CheckBillResponse {
  customer_number: string;
  customer_name: string;
  amount: number;
  admin_fee: number;
  total_amount: number;
  period: string;
  due_date: string;
}

export interface PayBillRequest {
  customer_number: string;
  product_code: string;
  ref_id: string;
}

export interface Product {
  code: string;
  name: string;
  category: string;
  operator?: string;
  price: number;
  type: 'PRABAYAR' | 'PASCABAYAR';
  description?: string;
}

export interface Category {
  code: string;
  name: string;
  icon: string;
  description?: string;
}

export class IndotelAPI {
  private config: IndotelConfig;

  constructor(config: IndotelConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<IndotelResponse<T>> {
    const response = await fetch(`${this.config.url}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'rqid': `${this.config.mmid}:${this.config.password}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // POST TOPUP - untuk pembelian pulsa/data prabayar
  async topup(request: TopupRequest): Promise<IndotelResponse<TopupResponse>> {
    return this.makeRequest<TopupResponse>('topup', request);
  }

  // POST STATUS - cek status transaksi
  async getTransactionStatus(transactionId: string): Promise<IndotelResponse<any>> {
    return this.makeRequest('status', { transaction_id: transactionId });
  }

  // POST CEK TAGIHAN / CHECK BILL - untuk cek tagihan pascabayar
  async checkBill(request: CheckBillRequest): Promise<IndotelResponse<CheckBillResponse>> {
    return this.makeRequest<CheckBillResponse>('inquiry', request);
  }

  // POST BAYAR TAGIHAN / PAY BILL - untuk bayar tagihan pascabayar
  async payBill(request: PayBillRequest): Promise<IndotelResponse<any>> {
    return this.makeRequest('payment', request);
  }

  // POST PRODUCT CATEGORY - daftar kategori produk
  async getCategories(): Promise<IndotelResponse<Category[]>> {
    return this.makeRequest<Category[]>('categories', {});
  }

  // POST LIST PRODUCT - daftar produk berdasarkan kategori
  async getProducts(categoryCode?: string): Promise<IndotelResponse<Product[]>> {
    return this.makeRequest<Product[]>('products', { category: categoryCode || '' });
  }

  // POST CEK HARGA - cek harga produk
  async checkPrice(productCode: string): Promise<IndotelResponse<any>> {
    return this.makeRequest('price', { product_code: productCode });
  }

  // POST HISTORY - riwayat transaksi
  async getHistory(startDate?: string, endDate?: string): Promise<IndotelResponse<any[]>> {
    return this.makeRequest('history', { 
      start_date: startDate || '',
      end_date: endDate || ''
    });
  }

  // POST CEK SALDO / CHECK BALANCE - cek saldo akun
  async checkBalance(): Promise<IndotelResponse<{ balance: number }>> {
    return this.makeRequest('balance', {});
  }

  // POST CALLBACK - webhook untuk update status transaksi
  async handleCallback(callbackData: any): Promise<IndotelResponse<any>> {
    return this.makeRequest('callback', callbackData);
  }
}

// Helper function untuk membuat instance IndotelAPI
export function createIndotelAPI(): IndotelAPI {
  const config: IndotelConfig = {
    url: process.env.INDOTEL_URL || 'https://apiindotel.mesinr1.com/V1',
    mmid: process.env.INDOTEL_MMID || '',
    password: process.env.INDOTEL_PASSWORD || '',
  };

  if (!config.mmid || !config.password) {
    throw new Error('Konfigurasi INDOTEL_MMID dan INDOTEL_PASSWORD tidak ditemukan');
  }

  return new IndotelAPI(config);
}