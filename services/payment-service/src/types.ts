export interface Payment {
  id?: number;
  payment_number: string;
  order_id: string;
  user_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider?: string;
  status: PaymentStatus;
  provider_transaction_id?: string;
  provider_response?: string;
  paid_at?: string;
  failed_at?: string;
  cancelled_at?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface CreatePaymentInput {
  order_id: string;
  user_id: number;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_provider?: string;
  note?: string;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  provider_transaction_id?: string;
  provider_response?: string;
  note?: string;
}

export interface Refund {
  id?: number;
  refund_number: string;
  payment_id: number;
  order_id: string;
  user_id: number;
  amount: number;
  reason?: string;
  status: RefundStatus;
  provider_refund_id?: string;
  provider_response?: string;
  approved_at?: string;
  rejected_at?: string;
  completed_at?: string;
  note?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export interface CreateRefundInput {
  payment_id: number;
  amount: number;
  reason?: string;
  created_by?: number;
}

export interface UpdateRefundInput {
  status?: RefundStatus;
  provider_refund_id?: string;
  provider_response?: string;
  note?: string;
}

export interface Balance {
  id?: number;
  user_id: number;
  available_balance: number;
  frozen_balance: number;
  total_recharged: number;
  total_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface BalanceTransaction {
  id?: number;
  user_id: number;
  type: BalanceTransactionType;
  amount: number;
  before_balance: number;
  after_balance: number;
  reference_type?: string;
  reference_id?: string;
  note?: string;
  created_at?: string;
}

export type BalanceTransactionType = 'recharge' | 'payment' | 'refund' | 'freeze' | 'unfreeze' | 'withdraw';

export interface RechargeInput {
  user_id: number;
  amount: number;
  payment_method?: string;
  note?: string;
}

export type Env = {
  DB: D1Database;
  [key: string]: any;
};

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
