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
  customer_id: string; // Razorpay still calls it customer_id
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
// BUILD PAYLOAD (CONTACT → FUND ACCOUNT)
// ---------------------------------------------------------
export function buildFundAccountPayloadForContact(
  contactId: string,
  name: string,
  ifsc: string,
  accountNumber: string,
) {
  return {
    contact_id: contactId, // ✅ Correct field name
    account_type: 'bank_account',
    bank_account: {
      name,
      ifsc,
      account_number: accountNumber,
    },
  };
}

// ---------------------------------------------------------
// CREATE FUND ACCOUNT USING CONTACT ID
// ---------------------------------------------------------
export async function createFundAccountForContact(
  payload: ReturnType<typeof buildFundAccountPayloadForContact>,
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
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<RazorpayErrorPayload>;

      const description =
        axiosError.response?.data?.error?.description ??
        'Failed to create fund account using contact ID';

      throw new Error(description);
    }

    throw new Error('Unknown error occurred while creating fund account');
  }
}
