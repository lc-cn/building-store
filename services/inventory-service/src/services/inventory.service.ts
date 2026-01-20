import type {
  Inventory,
  InventoryWithWarehouse,
  InventoryTransaction,
  InventoryReservation,
  AdjustInventoryRequest,
  ReserveInventoryRequest,
  ReleaseInventoryRequest,
  Env,
} from '../types';

export class InventoryService {
  constructor(private db: D1Database) {}

  /**
   * 查询SKU库存
   */
  async getInventoryBySku(sku: string): Promise<InventoryWithWarehouse | null> {
    const result = await this.db
      .prepare(`
        SELECT 
          i.*,
          w.name as warehouse_name,
          w.code as warehouse_code
        FROM inventory i
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.sku = ?
      `)
      .bind(sku)
      .first<InventoryWithWarehouse>();

    return result;
  }

  /**
   * 库存调整（事务性操作）
   */
  async adjustInventory(request: AdjustInventoryRequest): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const { sku, quantity, type, warehouse_id, reference_type, reference_id, note, created_by } = request;

    // 查询库存
    let inventory = await this.db
      .prepare('SELECT * FROM inventory WHERE sku = ?')
      .bind(sku)
      .first<Inventory>();

    // 如果库存不存在，创建新库存记录
    if (!inventory) {
      const createResult = await this.db
        .prepare(`
          INSERT INTO inventory (product_id, sku, quantity, warehouse_id, created_at, updated_at)
          VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(0, sku, warehouse_id || null)
        .run();

      inventory = await this.db
        .prepare('SELECT * FROM inventory WHERE id = ?')
        .bind(createResult.meta.last_row_id)
        .first<Inventory>();

      if (!inventory) {
        throw new Error('Failed to create inventory');
      }
    }

    const beforeQuantity = inventory.quantity;
    let afterQuantity = beforeQuantity;
    let changeQuantity = quantity;

    // 根据类型计算新库存
    switch (type) {
      case 'in':
        afterQuantity = beforeQuantity + quantity;
        break;
      case 'out':
        if (beforeQuantity < quantity) {
          throw new Error('Insufficient inventory');
        }
        afterQuantity = beforeQuantity - quantity;
        changeQuantity = -quantity;
        break;
      case 'adjust':
        afterQuantity = quantity;
        changeQuantity = quantity - beforeQuantity;
        break;
    }

    // 更新库存
    await this.db
      .prepare(`
        UPDATE inventory 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(afterQuantity, inventory.id)
      .run();

    // 创建库存变动记录
    const txResult = await this.db
      .prepare(`
        INSERT INTO inventory_transactions 
        (inventory_id, type, quantity, before_quantity, after_quantity, reference_type, reference_id, note, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(
        inventory.id,
        type,
        changeQuantity,
        beforeQuantity,
        afterQuantity,
        reference_type || null,
        reference_id || null,
        note || null,
        created_by || null
      )
      .run();

    // 获取更新后的库存和交易记录
    const updatedInventory = await this.db
      .prepare('SELECT * FROM inventory WHERE id = ?')
      .bind(inventory.id)
      .first<Inventory>();

    const transaction = await this.db
      .prepare('SELECT * FROM inventory_transactions WHERE id = ?')
      .bind(txResult.meta.last_row_id)
      .first<InventoryTransaction>();

    if (!updatedInventory || !transaction) {
      throw new Error('Failed to retrieve updated data');
    }

    return {
      inventory: updatedInventory,
      transaction,
    };
  }

  /**
   * 预留库存
   */
  async reserveInventory(request: ReserveInventoryRequest): Promise<{
    reservation: InventoryReservation;
    inventory: Inventory;
  }> {
    const { sku, quantity, order_id, expires_in_minutes = 30 } = request;

    // 查询库存
    const inventory = await this.db
      .prepare('SELECT * FROM inventory WHERE sku = ?')
      .bind(sku)
      .first<Inventory>();

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // 检查可用库存
    const availableQuantity = inventory.quantity - inventory.reserved_quantity;
    if (availableQuantity < quantity) {
      throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Required: ${quantity}`);
    }

    // 计算过期时间
    const expiresAt = new Date(Date.now() + expires_in_minutes * 60 * 1000).toISOString();

    // 创建预留记录
    const reservationResult = await this.db
      .prepare(`
        INSERT INTO inventory_reservations 
        (inventory_id, order_id, quantity, status, expires_at, created_at)
        VALUES (?, ?, ?, 'reserved', ?, CURRENT_TIMESTAMP)
      `)
      .bind(inventory.id, order_id, quantity, expiresAt)
      .run();

    // 更新预留库存数量
    await this.db
      .prepare(`
        UPDATE inventory 
        SET reserved_quantity = reserved_quantity + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(quantity, inventory.id)
      .run();

    // 创建库存变动记录
    await this.db
      .prepare(`
        INSERT INTO inventory_transactions 
        (inventory_id, type, quantity, before_quantity, after_quantity, reference_type, reference_id, created_at)
        VALUES (?, 'reserve', ?, ?, ?, 'order', ?, CURRENT_TIMESTAMP)
      `)
      .bind(inventory.id, -quantity, inventory.quantity, inventory.quantity, order_id)
      .run();

    // 获取预留记录和更新后的库存
    const reservation = await this.db
      .prepare('SELECT * FROM inventory_reservations WHERE id = ?')
      .bind(reservationResult.meta.last_row_id)
      .first<InventoryReservation>();

    const updatedInventory = await this.db
      .prepare('SELECT * FROM inventory WHERE id = ?')
      .bind(inventory.id)
      .first<Inventory>();

    if (!reservation || !updatedInventory) {
      throw new Error('Failed to retrieve reservation data');
    }

    return {
      reservation,
      inventory: updatedInventory,
    };
  }

  /**
   * 释放库存预留
   */
  async releaseInventory(request: ReleaseInventoryRequest): Promise<{
    released_count: number;
    reservations: InventoryReservation[];
  }> {
    const { order_id, sku } = request;

    // 查询待释放的预留记录
    let query = `
      SELECT r.* FROM inventory_reservations r
      JOIN inventory i ON r.inventory_id = i.id
      WHERE r.order_id = ? AND r.status = 'reserved'
    `;
    const params: any[] = [order_id];

    if (sku) {
      query += ' AND i.sku = ?';
      params.push(sku);
    }

    const reservations = await this.db
      .prepare(query)
      .bind(...params)
      .all<InventoryReservation>();

    if (!reservations.results || reservations.results.length === 0) {
      return {
        released_count: 0,
        reservations: [],
      };
    }

    // 批量释放预留
    for (const reservation of reservations.results) {
      // 更新预留状态
      await this.db
        .prepare(`
          UPDATE inventory_reservations 
          SET status = 'released', released_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(reservation.id)
        .run();

      // 减少预留数量
      await this.db
        .prepare(`
          UPDATE inventory 
          SET reserved_quantity = reserved_quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(reservation.quantity, reservation.inventory_id)
        .run();

      // 创建库存变动记录
      const inventory = await this.db
        .prepare('SELECT * FROM inventory WHERE id = ?')
        .bind(reservation.inventory_id)
        .first<Inventory>();

      if (inventory) {
        await this.db
          .prepare(`
            INSERT INTO inventory_transactions 
            (inventory_id, type, quantity, before_quantity, after_quantity, reference_type, reference_id, created_at)
            VALUES (?, 'release', ?, ?, ?, 'order', ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            inventory.id,
            reservation.quantity,
            inventory.quantity,
            inventory.quantity,
            order_id
          )
          .run();
      }
    }

    return {
      released_count: reservations.results.length,
      reservations: reservations.results,
    };
  }

  /**
   * 查询库存变动记录
   */
  async getTransactions(params: {
    sku?: string;
    type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    transactions: InventoryTransaction[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const { sku, type, page = 1, page_size = 20 } = params;
    const offset = (page - 1) * page_size;

    let query = `
      SELECT t.* FROM inventory_transactions t
      JOIN inventory i ON t.inventory_id = i.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (sku) {
      query += ' AND i.sku = ?';
      queryParams.push(sku);
    }

    if (type) {
      query += ' AND t.type = ?';
      queryParams.push(type);
    }

    // 查询总数
    const countQuery = query.replace('SELECT t.*', 'SELECT COUNT(*) as count');
    const countResult = await this.db
      .prepare(countQuery)
      .bind(...queryParams)
      .first<{ count: number }>();

    const total = countResult?.count || 0;

    // 查询列表
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(page_size, offset);

    const result = await this.db
      .prepare(query)
      .bind(...queryParams)
      .all<InventoryTransaction>();

    return {
      transactions: result.results || [],
      total,
      page,
      page_size,
    };
  }

  /**
   * 清理过期的预留库存
   */
  async cleanupExpiredReservations(): Promise<number> {
    // 查询过期的预留记录
    const expiredReservations = await this.db
      .prepare(`
        SELECT * FROM inventory_reservations 
        WHERE status = 'reserved' 
        AND expires_at < datetime('now')
      `)
      .all<InventoryReservation>();

    if (!expiredReservations.results || expiredReservations.results.length === 0) {
      return 0;
    }

    // 释放过期预留
    for (const reservation of expiredReservations.results) {
      await this.releaseInventory({
        order_id: reservation.order_id,
      });
    }

    return expiredReservations.results.length;
  }
}
