import axios, { AxiosError, AxiosResponse } from 'axios';

export interface RazorpayBankVerificationPayload {
  fund_account: {
    id: string; // fund account ID created earlier (required)
  };
  amount: number; // Usually 1 INR
  currency: 'INR';
}

export interface RazorpayBankVerificationResponse {
  id: string;
  entity: string;
  fund_account: {
    id: string;
  };
  amount: number;
  currency: string;
  status: string; // "created", "pending", "completed", "failed"
  created_at: number;
}

interface RazorpayErrorPayload {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: any;
  };
}

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

/**
 * Verify bank account via Razorpay Fund Account Validation API
 */
export async function verifyBankAccount(
  payload: RazorpayBankVerificationPayload,
  keyId: string,
  keySecret: string,
): Promise<RazorpayBankVerificationResponse> {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response: AxiosResponse<RazorpayBankVerificationResponse> = await axios.post(
      `${RAZORPAY_BASE_URL}/fund_accounts/validations`,
      payload,
      {
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<RazorpayErrorPayload>;

      const msg =
        axiosError.response?.data?.error?.description ??
        axiosError.message ??
        'Failed to verify bank account';

      throw new Error(msg);
    }

    throw new Error('Unknown error occurred while verifying bank account');
  }
}
