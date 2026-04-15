import axios, { AxiosError } from 'axios';

export interface RazorpayRefundResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
  created_at: number;
}

interface RazorpayErrorPayload {
  error?: {
    description?: string;
  };
}

export async function refundRazorpayPayment(
  paymentId: string,
  amountPaise: number | null, // <-- FIXED
  keyId: string,
  keySecret: string,
): Promise<RazorpayRefundResponse> {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const payload: Record<string, any> = {};
  if (amountPaise !== null) {
    payload.amount = amountPaise;
  }

  try {
    const response = await axios.post<RazorpayRefundResponse>(
      `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      payload,
      {
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (err) {
    const error = err as AxiosError<RazorpayErrorPayload>;

    const description = error.response?.data?.error?.description ?? 'Refund request failed';

    throw new Error(description);
  }
}
