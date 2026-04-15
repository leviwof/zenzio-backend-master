export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  notes: Record<string, any>;
  created_at?: number;
  key_id?: string;
}

export interface VerifyResponse {
  verified: boolean;
}

export interface RazorpayCustomer {
  id: string;
  name: string;
  email: string;
  contact: string;
  created_at: number;
}
