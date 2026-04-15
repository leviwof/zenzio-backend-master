import axios from 'axios';

export interface RazorpayCaptureResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function captureRazorpayPayment(
  paymentId: string,
  amount: number,
  keyId: string,
  keySecret: string,
): Promise<RazorpayCaptureResponse> {
  if (typeof paymentId !== 'string') {
    throw new Error('Invalid paymentId');
  }

  if (typeof keyId !== 'string' || typeof keySecret !== 'string') {
    throw new Error('Invalid Razorpay API credentials');
  }

  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response = await axios.post<RazorpayCaptureResponse>(
      `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
      {
        amount: amount * 100,
        currency: 'INR',
      },
      {
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    // Type-safe error handling
    let message = 'Payment capture failed';

    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response?.data?.error?.description
    ) {
      message = String((error as any).response.data.error.description);
    }

    console.error('CAPTURE ERROR:', message);

    throw new Error(message);
  }
}
