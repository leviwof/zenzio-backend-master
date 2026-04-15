import axios, { AxiosResponse } from 'axios';

export interface RazorpayCustomer {
  id: string;
  name: string;
  email: string;
  contact: string;
  gstin?: string;
  notes?: Record<string, any>;
  created_at: number;
}

export interface RazorpayCustomerListResponse {
  entity: string; // "collection"
  count: number;
  items: RazorpayCustomer[];
}

// -----------------------------------------------------
// FETCH CUSTOMER LIST (SAFE TYPED)
// -----------------------------------------------------
export async function fetchRazorpayCustomers(
  keyId: string,
  keySecret: string,
): Promise<RazorpayCustomerListResponse> {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response: AxiosResponse<RazorpayCustomerListResponse> =
    await axios.get<RazorpayCustomerListResponse>('https://api.razorpay.com/v1/customers', {
      headers: {
        Authorization: `Basic ${token}`,
      },
    });

  return response.data; // <- Safe typed return
}
