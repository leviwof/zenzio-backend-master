import axios from 'axios';

export const createRazorpayPayout = async (
  fundAccountId: string,
  amount: number,
  currency: string = 'INR',
  mode: string = 'IMPS',
  purpose: string = 'payout',
  referenceId: string,
  keyId: string,
  keySecret: string,
) => {
  const payload = {
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '2323230043868615', // Required for RazorpayX Payouts. You can use an env var or a constant here. For test mode, you can use the test root account number.
    fund_account_id: fundAccountId,
    amount: Math.round(amount * 100), // convert to paise
    currency,
    mode,
    purpose,
    reference_id: referenceId,
    queue_if_low_balance: true,
  };

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const response = await axios.post('https://api.razorpay.com/v1/payouts', payload, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    const errorBody = error.response?.data || error.message;
    throw new Error(`Razorpay Payout Failed: ${JSON.stringify(errorBody)}`);
  }
};
