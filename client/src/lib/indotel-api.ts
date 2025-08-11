export interface IndotelApiRequest {
  mmid: string;
  ref_1: string;
  product_code?: string;
  customer_id?: string;
  ref_2?: string;
  periode?: string;
  tahun?: string;
  nominal?: string;
}

export interface IndotelApiResponse {
  status: number;
  message: string;
  data?: any;
}

export const indotelApi = {
  async inquiry(data: IndotelApiRequest): Promise<IndotelApiResponse> {
    const response = await fetch('/api/indotel/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  },

  async payment(data: IndotelApiRequest): Promise<IndotelApiResponse> {
    const response = await fetch('/api/indotel/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  },

  async topup(data: IndotelApiRequest): Promise<IndotelApiResponse> {
    const response = await fetch('/api/indotel/topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  },
};
