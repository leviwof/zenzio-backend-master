import axios, { AxiosError, AxiosResponse } from 'axios';

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
export interface RazorpayFundAccountBank {
  name: string;
  ifsc: string;
  account_number: string;
}

export interface RazorpayFundAccountResponse {
  id: string;
  entity: string;
  customer_id: string;
  account_type: string;
  bank_account: RazorpayFundAccountBank;
  active: boolean;
  created_at: number;
}

interface RazorpayErrorPayload {
  error?: {
    description?: string;
  };
}

// ---------------------------------------------------------
// BUILD PAYLOAD
// ---------------------------------------------------------
export function buildFundAccountPayload(
  customerId: string,
  name: string,
  ifsc: string,
  accountNumber: string,
) {
  return {
    customer_id: customerId,
    account_type: 'bank_account',
    bank_account: {
      name,
      ifsc,
      account_number: accountNumber,
    },
  };
}

// ---------------------------------------------------------
// CREATE FUND ACCOUNT (SAFE)
// ---------------------------------------------------------
export async function createFundAccount(
  payload: ReturnType<typeof buildFundAccountPayload>,
  keyId: string,
  keySecret: string,
): Promise<RazorpayFundAccountResponse> {
  const baseUrl = 'https://api.razorpay.com/v1';
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response: AxiosResponse<RazorpayFundAccountResponse> =
      await axios.post<RazorpayFundAccountResponse>(`${baseUrl}/fund_accounts`, payload, {
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });

    return response.data;
  } catch (err: unknown) {
    // SAFE TYPE CHECK
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<RazorpayErrorPayload>;
      const description =
        axiosError.response?.data?.error?.description ?? 'Failed to create fund account';

      throw new Error(description);
    }

    // Fallback for non-Axios errors
    throw new Error('Unknown error occurred while creating fund account');
  }
}
