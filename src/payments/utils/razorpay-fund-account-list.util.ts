import axios, { AxiosError, AxiosResponse } from 'axios';

export interface RazorpayFundAccountListResponse {
  entity: string;
  count: number;
  items: Array<{
    id: string;
    entity: string;
    customer_id: string;
    account_type: string;
    bank_account?: {
      name: string;
      ifsc: string;
      account_number: string;
      bank_name: string;
    };
    active: boolean;
    created_at: number;
  }>;
}

interface RazorpayErrorPayload {
  error?: { description?: string };
}

export async function fetchFundAccountsByContactId(
  contactId: string,
  keyId: string,
  keySecret: string,
): Promise<RazorpayFundAccountListResponse> {
  const baseUrl = 'https://api.razorpay.com/v1';
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response: AxiosResponse<RazorpayFundAccountListResponse> = await axios.get(
      `${baseUrl}/fund_accounts?customer_id=${contactId}`,
      {
        headers: { Authorization: `Basic ${token}` },
      },
    );

    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<RazorpayErrorPayload>;
      const message =
        axiosErr.response?.data?.error?.description ?? 'Failed to fetch fund accounts';

      throw new Error(message);
    }

    throw new Error('Unknown error while fetching fund accounts');
  }
}
