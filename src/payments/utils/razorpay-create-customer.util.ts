import axios, { AxiosError } from 'axios';

// -----------------------------------------------------
// TYPES
// -----------------------------------------------------
export interface RazorpayCustomer {
  id: string;
  name: string;
  email: string;
  contact: string;
  created_at: number;
}

interface RazorpayErrorPayload {
  error?: {
    description?: string;
  };
}

// -----------------------------------------------------
// BUILD CUSTOMER PAYLOAD
// -----------------------------------------------------
export function buildCustomerPayload(name: string, email: string, contact: string) {
  return {
    name,
    email,
    contact,
    fail_existing: 0,
  };
}

// -----------------------------------------------------
// CREATE RAZORPAY CUSTOMER
// -----------------------------------------------------
export async function createRazorpayCustomer(
  payload: any,
  keyId: string,
  keySecret: string,
): Promise<RazorpayCustomer> {
  const baseUrl = 'https://api.razorpay.com/v1';
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response = await axios.post<RazorpayCustomer>(`${baseUrl}/customers`, payload, {
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (err) {
    const error = err as AxiosError<RazorpayErrorPayload>;
    const description = error.response?.data?.error?.description ?? 'Failed to create customer';

    throw new Error(description);
  }
}
