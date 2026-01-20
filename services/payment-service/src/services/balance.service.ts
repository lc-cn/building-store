import { Balance, BalanceTransaction, BalanceTransactionType, RechargeInput, ListResponse, PaginationParams } from '../types';

export class BalanceService {
  constructor(private db: D1Database) {}

  /**
   * 获取用户余额
   */
  async getBalance(userId: number): Promise<Balance> {
    let balance = await this.db
      .prepare('SELECT * FROM balances WHERE user_id = ?')
      .bind(userId)
      .first<Balance>();

    // 如果余额记录不存在，创建一个
    if (!balance) {
      balance = await this.createBalance(userId);
    }

    return balance;
  }

  /**
   * 创建余额记录
   */
  private async createBalance(userId: number): Promise<Balance> {
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(`
        INSERT INTO balances (
          user_id, available_balance, frozen_balance,
          total_recharged, total_spent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(userId, 0, 0, 0, 0, now, now)
      .run();

    if (!result.success) {
      throw new Error('Failed to create balance');
    }

    const balance = await this.db
      .prepare('SELECT * FROM balances WHERE user_id = ?')
      .bind(userId)
      .first<Balance>();

    if (!balance) {
      throw new Error('Failed to retrieve created balance');
    }

    return balance;
  }

  /**
   * 充值
   */
  async recharge(input: RechargeInput): Promise<Balance> {
    if (input.amount <= 0) {
      throw new Error('Recharge amount must be positive');
    }

    const balance = await this.getBalance(input.user_id);
    const newAvailableBalance = balance.available_balance + input.amount;
    const newTotalRecharged = balance.total_recharged + input.amount;

    // 开始事务操作
    await this.db.batch([
      // 更新余额
      this.db
        .prepare(`
          UPDATE balances 
          SET available_balance = ?, total_recharged = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(
          newAvailableBalance,
          newTotalRecharged,
          new Date().toISOString(),
          input.user_id
        ),
      // 记录余额变动
      this.db
        .prepare(`
          INSERT INTO balance_transactions (
            user_id, type, amount, before_balance, after_balance, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          input.user_id,
          'recharge',
          input.amount,
          balance.available_balance,
          newAvailableBalance,
          input.note || `充值 ${input.amount}元`,
          new Date().toISOString()
        ),
    ]);

    return await this.getBalance(input.user_id);
  }

  /**
   * 扣款（支付）
   */
  async deduct(
    userId: number,
    amount: number,
    referenceType?: string,
    referenceId?: string,
    note?: string
  ): Promise<Balance> {
    if (amount <= 0) {
      throw new Error('Deduct amount must be positive');
    }

    const balance = await this.getBalance(userId);

    if (balance.available_balance < amount) {
      throw new Error('Insufficient balance');
    }

    const newAvailableBalance = balance.available_balance - amount;
    const newTotalSpent = balance.total_spent + amount;

    // 开始事务操作
    await this.db.batch([
      // 更新余额
      this.db
        .prepare(`
          UPDATE balances 
          SET available_balance = ?, total_spent = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(
          newAvailableBalance,
          newTotalSpent,
          new Date().toISOString(),
          userId
        ),
      // 记录余额变动
      this.db
        .prepare(`
          INSERT INTO balance_transactions (
            user_id, type, amount, before_balance, after_balance,
            reference_type, reference_id, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          'payment',
          -amount,
          balance.available_balance,
          newAvailableBalance,
          referenceType || null,
          referenceId || null,
          note || `支付 ${amount}元`,
          new Date().toISOString()
        ),
    ]);

    return await this.getBalance(userId);
  }

  /**
   * 退款
   */
  async refund(
    userId: number,
    amount: number,
    referenceType?: string,
    referenceId?: string,
    note?: string
  ): Promise<Balance> {
    if (amount <= 0) {
      throw new Error('Refund amount must be positive');
    }

    const balance = await this.getBalance(userId);
    const newAvailableBalance = balance.available_balance + amount;
    const newTotalSpent = Math.max(0, balance.total_spent - amount);

    // 开始事务操作
    await this.db.batch([
      // 更新余额
      this.db
        .prepare(`
          UPDATE balances 
          SET available_balance = ?, total_spent = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(
          newAvailableBalance,
          newTotalSpent,
          new Date().toISOString(),
          userId
        ),
      // 记录余额变动
      this.db
        .prepare(`
          INSERT INTO balance_transactions (
            user_id, type, amount, before_balance, after_balance,
            reference_type, reference_id, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          'refund',
          amount,
          balance.available_balance,
          newAvailableBalance,
          referenceType || null,
          referenceId || null,
          note || `退款 ${amount}元`,
          new Date().toISOString()
        ),
    ]);

    return await this.getBalance(userId);
  }

  /**
   * 冻结余额
   */
  async freeze(userId: number, amount: number, note?: string): Promise<Balance> {
    if (amount <= 0) {
      throw new Error('Freeze amount must be positive');
    }

    const balance = await this.getBalance(userId);

    if (balance.available_balance < amount) {
      throw new Error('Insufficient available balance to freeze');
    }

    const newAvailableBalance = balance.available_balance - amount;
    const newFrozenBalance = balance.frozen_balance + amount;

    // 开始事务操作
    await this.db.batch([
      // 更新余额
      this.db
        .prepare(`
          UPDATE balances 
          SET available_balance = ?, frozen_balance = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(
          newAvailableBalance,
          newFrozenBalance,
          new Date().toISOString(),
          userId
        ),
      // 记录余额变动
      this.db
        .prepare(`
          INSERT INTO balance_transactions (
            user_id, type, amount, before_balance, after_balance, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          'freeze',
          -amount,
          balance.available_balance,
          newAvailableBalance,
          note || `冻结 ${amount}元`,
          new Date().toISOString()
        ),
    ]);

    return await this.getBalance(userId);
  }

  /**
   * 解冻余额
   */
  async unfreeze(userId: number, amount: number, note?: string): Promise<Balance> {
    if (amount <= 0) {
      throw new Error('Unfreeze amount must be positive');
    }

    const balance = await this.getBalance(userId);

    if (balance.frozen_balance < amount) {
      throw new Error('Insufficient frozen balance to unfreeze');
    }

    const newAvailableBalance = balance.available_balance + amount;
    const newFrozenBalance = balance.frozen_balance - amount;

    // 开始事务操作
    await this.db.batch([
      // 更新余额
      this.db
        .prepare(`
          UPDATE balances 
          SET available_balance = ?, frozen_balance = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(
          newAvailableBalance,
          newFrozenBalance,
          new Date().toISOString(),
          userId
        ),
      // 记录余额变动
      this.db
        .prepare(`
          INSERT INTO balance_transactions (
            user_id, type, amount, before_balance, after_balance, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          'unfreeze',
          amount,
          balance.available_balance,
          newAvailableBalance,
          note || `解冻 ${amount}元`,
          new Date().toISOString()
        ),
    ]);

    return await this.getBalance(userId);
  }

  /**
   * 获取余额变动记录
   */
  async getTransactions(params: PaginationParams & { user_id: number; type?: string }): Promise<ListResponse<BalanceTransaction>> {
    const { page = 1, limit = 20, user_id, type } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'user_id = ?';
    const whereParams: any[] = [user_id];

    if (type) {
      whereClause += ' AND type = ?';
      whereParams.push(type);
    }

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM balance_transactions WHERE ${whereClause}`)
      .bind(...whereParams)
      .first<{ total: number }>();

    const total = countResult?.total || 0;

    const { results } = await this.db
      .prepare(`SELECT * FROM balance_transactions WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...whereParams, limit, offset)
      .all<BalanceTransaction>();

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
}
