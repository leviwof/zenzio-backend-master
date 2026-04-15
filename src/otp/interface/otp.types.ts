export interface OtpVerifyResponse {
  status: 'success' | 'error';
  code: number;
  data: {
    message: string;
    user?: { phone: string };
  };
  meta: {
    timestamp: string;
  };
}
