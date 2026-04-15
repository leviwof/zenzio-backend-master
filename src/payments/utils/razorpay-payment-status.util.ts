import axios from 'axios';

export interface RazorpayPaymentStatus {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string | null;
  contact: string | null;
  notes: Record<string, any>;
  fee: number;
  tax: number;
  created_at: number;
}

export async function getRazorpayPaymentStatus(
  paymentId: string,
  keyId: string,
  keySecret: string,
): Promise<RazorpayPaymentStatus> {
  try {
    const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await axios.get<RazorpayPaymentStatus>(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${token}`,
        },
      },
    );

    return response.data;
  } catch (err: any) {
    console.error('----------- RAZORPAY ERROR -----------');
    console.error('Message:', err.message);
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    console.error('Headers:', err.response?.headers);
    console.error('---------------------------------------');

    throw err; // keep original error
  }
}
