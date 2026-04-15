import axios, { AxiosError, AxiosResponse } from 'axios';

export interface RazorpayContactCreatePayload {
  name: string;
  email?: string;
  contact?: string;
  type?: string;
  reference_id?: string;
  notes?: Record<string, any>;
}

export interface RazorpayContactResponse {
  id: string;
  entity: string;
  name: string;
  email: string | null;
  contact: string | null;
  type: string;
  reference_id: string | null;
  notes: Record<string, any>;
  created_at: number;
}

interface RazorpayErrorPayload {
  error?: {
    description?: string;
  };
}

// ---------------------------------------------------------
// CREATE CONTACT (SAFE)
// ---------------------------------------------------------
export async function createRazorpayContact(
  payload: RazorpayContactCreatePayload,
  keyId: string,
  keySecret: string,
): Promise<RazorpayContactResponse> {
  const baseUrl = 'https://api.razorpay.com/v1';
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response: AxiosResponse<RazorpayContactResponse> =
      await axios.post<RazorpayContactResponse>(`${baseUrl}/contacts`, payload, {
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });

    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<RazorpayErrorPayload>;
      const msg = axiosError.response?.data?.error?.description ?? 'Failed to create contact';

      throw new Error(msg);
    }

    throw new Error('Unknown error occurred while creating Razorpay contact');
  }
}
