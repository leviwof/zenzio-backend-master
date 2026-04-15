import axios, { AxiosError, AxiosResponse } from 'axios';

export interface RazorpayContactResponse {
  id: string;
  entity: string;
  name: string;
  email: string | null;
  contact: string | null;
  type: string | null;
  reference_id: string | null;
  notes: Record<string, any>;
  active: boolean;
  created_at: number;
}

interface RazorpayErrorPayload {
  error?: { description?: string };
}

export async function fetchRazorpayContactById(
  contactId: string,
  keyId: string,
  keySecret: string,
): Promise<RazorpayContactResponse> {
  const baseUrl = 'https://api.razorpay.com/v1';
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response: AxiosResponse<RazorpayContactResponse> = await axios.get(
      `${baseUrl}/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Basic ${token}`,
        },
      },
    );

    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<RazorpayErrorPayload>;
      const description = axiosErr.response?.data?.error?.description ?? 'Failed to fetch contact';

      throw new Error(description);
    }

    throw new Error('Unknown error while fetching Razorpay contact');
  }
}
