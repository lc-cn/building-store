import { Payment, CreatePaymentInput, UpdatePaymentInput, PaymentStatus, ListResponse, PaginationParams } from '../types';
import { generatePaymentNumber } from '../utils/payment-number';

export class PaymentService {
  constructor(private db: D1Database) {}

  /**
   * 获取支付记录列表
   */
  async list(params: PaginationParams & { user_id?: number; status?: string; order_id?: string }): Promise<ListResponse<Payment>> {
    const { page = 1, limit = 20, user_id, status, order_id } = params;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const whereParams: any[] = [];

    if (user_id) {
      whereClause += ' AND user_id = ?';
      whereParams.push(user_id);
    }

    if (status) {
      whereClause += ' AND status = ?';
      whereParams.push(status);
    }

    if (order_id) {
      whereClause += ' AND order_id = ?';
      whereParams.push(order_id);
    }

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM payments WHERE ${whereClause}`)
      .bind(...whereParams)
      .first<{ total: number }>();

    const total = countResult?.total || 0;

    const { results } = await this.db
      .prepare(`SELECT * FROM payments WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...whereParams, limit, offset)
      .all<Payment>();

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取支付记录详情
   */
  async getById(id: number): Promise<Payment | null> {
    const result = await this.db
      .prepare('SELECT * FROM payments WHERE id = ?')
      .bind(id)
      .first<Payment>();

    return result;
  }

  /**
   * 根据支付单号获取支付记录
   */
  async getByPaymentNumber(paymentNumber: string): Promise<Payment | null> {
    const result = await this.db
      .prepare('SELECT * FROM payments WHERE payment_number = ?')
      .bind(paymentNumber)
      .first<Payment>();

    return result;
  }

  /**
   * 创建支付记录
   */
  async create(input: CreatePaymentInput): Promise<Payment> {
    const paymentNumber = generatePaymentNumber();
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(`
        INSERT INTO payments (
          payment_number, order_id, user_id, amount, currency,
          payment_method, payment_provider, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        paymentNumber,
        input.order_id,
        input.user_id,
        input.amount,
        input.currency || 'CNY',
        input.payment_method,
        input.payment_provider || null,
        'pending',
        now,
        now
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to create payment');
    }

    const payment = await this.getById(result.meta.last_row_id);
    if (!payment) {
      throw new Error('Failed to retrieve created payment');
    }

    return payment;
  }

  /**
   * 更新支付记录
   */
  async update(id: number, input: UpdatePaymentInput): Promise<Payment> {
    const payment = await this.getById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.status !== undefined) {
      // 验证状态流转
      this.validateStatusTransition(payment.status, input.status);
      updates.push('status = ?');
      params.push(input.status);
    }

    if (input.provider_transaction_id !== undefined) {
      updates.push('provider_transaction_id = ?');
      params.push(input.provider_transaction_id);
    }

    if (input.provider_response !== undefined) {
      updates.push('provider_response = ?');
      params.push(input.provider_response);
    }

    if (input.note !== undefined) {
      updates.push('note = ?');
      params.push(input.note);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(id);

    await this.db
      .prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updatedPayment = await this.getById(id);
    if (!updatedPayment) {
      throw new Error('Failed to retrieve updated payment');
    }

    return updatedPayment;
  }

  /**
   * 完成支付
   */
  async complete(id: number, providerTransactionId?: string): Promise<Payment> {
    const payment = await this.getById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    this.validateStatusTransition(payment.status, 'completed');

    const now = new Date().toISOString();
    const updates: string[] = ['status = ?', 'paid_at = ?', 'updated_at = ?'];
    const params: any[] = ['completed', now, now];

    if (providerTransactionId) {
      updates.push('provider_transaction_id = ?');
      params.push(providerTransactionId);
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updatedPayment = await this.getById(id);
    if (!updatedPayment) {
      throw new Error('Failed to retrieve updated payment');
    }

    return updatedPayment;
  }

  /**
   * 支付失败
   */
  async fail(id: number, reason?: string): Promise<Payment> {
    const payment = await this.getById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    this.validateStatusTransition(payment.status, 'failed');

    const now = new Date().toISOString();
    const updates: string[] = ['status = ?', 'failed_at = ?', 'updated_at = ?'];
    const params: any[] = ['failed', now, now];

    if (reason) {
      updates.push('note = ?');
      params.push(reason);
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updatedPayment = await this.getById(id);
    if (!updatedPayment) {
      throw new Error('Failed to retrieve updated payment');
    }

    return updatedPayment;
  }

  /**
   * 验证支付状态流转
   */
  private validateStatusTransition(from: PaymentStatus, to: PaymentStatus): void {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      pending: ['processing', 'completed', 'failed', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: ['refunded'],
      failed: [],
      cancelled: [],
      refunded: [],
    };

    const allowedStatuses = validTransitions[from] || [];
    if (!allowedStatuses.includes(to)) {
      throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
  }
}
