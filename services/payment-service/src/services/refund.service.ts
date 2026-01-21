import { Refund, CreateRefundInput, UpdateRefundInput, RefundStatus, ListResponse, PaginationParams } from '../types';
import { generateRefundNumber } from '../utils/payment-number';
import { PaymentService } from './payment.service';

export class RefundService {
  private paymentService: PaymentService;

  constructor(private db: D1Database) {
    this.paymentService = new PaymentService(db);
  }

  /**
   * 获取退款记录列表
   */
  async list(params: PaginationParams & { user_id?: number; status?: string; payment_id?: number }): Promise<ListResponse<Refund>> {
    const { page = 1, limit = 20, user_id, status, payment_id } = params;
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

    if (payment_id) {
      whereClause += ' AND payment_id = ?';
      whereParams.push(payment_id);
    }

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM refunds WHERE ${whereClause}`)
      .bind(...whereParams)
      .first<{ total: number }>();

    const total = countResult?.total || 0;

    const { results } = await this.db
      .prepare(`SELECT * FROM refunds WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...whereParams, limit, offset)
      .all<Refund>();

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
   * 获取退款记录详情
   */
  async getById(id: number): Promise<Refund | null> {
    const result = await this.db
      .prepare('SELECT * FROM refunds WHERE id = ?')
      .bind(id)
      .first<Refund>();

    return result;
  }

  /**
   * 创建退款记录
   */
  async create(input: CreateRefundInput): Promise<Refund> {
    // 获取原支付记录
    const payment = await this.paymentService.getById(input.payment_id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // 验证支付状态
    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    // 验证退款金额
    if (input.amount <= 0 || input.amount > payment.amount) {
      throw new Error('Invalid refund amount');
    }

    // 检查已退款金额
    const existingRefunds = await this.db
      .prepare('SELECT SUM(amount) as total FROM refunds WHERE payment_id = ? AND status IN (?, ?)')
      .bind(input.payment_id, 'completed', 'processing')
      .first<{ total: number }>();

    const totalRefunded = existingRefunds?.total || 0;
    if (totalRefunded + input.amount > payment.amount) {
      throw new Error('Refund amount exceeds payment amount');
    }

    const refundNumber = generateRefundNumber();
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(`
        INSERT INTO refunds (
          refund_number, payment_id, order_id, user_id, amount,
          reason, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        refundNumber,
        input.payment_id,
        payment.order_id,
        payment.user_id,
        input.amount,
        input.reason || null,
        'pending',
        input.created_by || null,
        now,
        now
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to create refund');
    }

    const refund = await this.getById(result.meta.last_row_id);
    if (!refund) {
      throw new Error('Failed to retrieve created refund');
    }

    return refund;
  }

  /**
   * 更新退款记录
   */
  async update(id: number, input: UpdateRefundInput): Promise<Refund> {
    const refund = await this.getById(id);
    if (!refund) {
      throw new Error('Refund not found');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.status !== undefined) {
      // 验证状态流转
      this.validateStatusTransition(refund.status, input.status);
      updates.push('status = ?');
      params.push(input.status);
    }

    if (input.provider_refund_id !== undefined) {
      updates.push('provider_refund_id = ?');
      params.push(input.provider_refund_id);
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
      .prepare(`UPDATE refunds SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updatedRefund = await this.getById(id);
    if (!updatedRefund) {
      throw new Error('Failed to retrieve updated refund');
    }

    return updatedRefund;
  }

  /**
   * 批准退款
   */
  async approve(id: number, operatorId?: number): Promise<Refund> {
    const refund = await this.getById(id);
    if (!refund) {
      throw new Error('Refund not found');
    }

    this.validateStatusTransition(refund.status, 'processing');

    const now = new Date().toISOString();

    await this.db
      .prepare('UPDATE refunds SET status = ?, approved_at = ?, updated_at = ? WHERE id = ?')
      .bind('processing', now, now, id)
      .run();

    const updatedRefund = await this.getById(id);
    if (!updatedRefund) {
      throw new Error('Failed to retrieve updated refund');
    }

    return updatedRefund;
  }

  /**
   * 拒绝退款
   */
  async reject(id: number, reason?: string): Promise<Refund> {
    const refund = await this.getById(id);
    if (!refund) {
      throw new Error('Refund not found');
    }

    this.validateStatusTransition(refund.status, 'rejected');

    const now = new Date().toISOString();
    const updates: string[] = ['status = ?', 'rejected_at = ?', 'updated_at = ?'];
    const params: any[] = ['rejected', now, now];

    if (reason) {
      updates.push('note = ?');
      params.push(reason);
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE refunds SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updatedRefund = await this.getById(id);
    if (!updatedRefund) {
      throw new Error('Failed to retrieve updated refund');
    }

    return updatedRefund;
  }

  /**
   * 完成退款
   */
  async complete(id: number): Promise<Refund> {
    const refund = await this.getById(id);
    if (!refund) {
      throw new Error('Refund not found');
    }

    this.validateStatusTransition(refund.status, 'completed');

    const now = new Date().toISOString();

    await this.db
      .prepare('UPDATE refunds SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?')
      .bind('completed', now, now, id)
      .run();

    // 更新支付记录状态为已退款
    await this.paymentService.update(refund.payment_id, { status: 'refunded' });

    const updatedRefund = await this.getById(id);
    if (!updatedRefund) {
      throw new Error('Failed to retrieve updated refund');
    }

    return updatedRefund;
  }

  /**
   * 验证退款状态流转
   */
  private validateStatusTransition(from: RefundStatus, to: RefundStatus): void {
    const validTransitions: Record<RefundStatus, RefundStatus[]> = {
      pending: ['processing', 'rejected'],
      processing: ['completed', 'failed'],
      completed: [],
      failed: [],
      rejected: [],
    };

    const allowedStatuses = validTransitions[from] || [];
    if (!allowedStatuses.includes(to)) {
      throw new Error(`Invalid refund status transition from ${from} to ${to}`);
    }
  }
}
