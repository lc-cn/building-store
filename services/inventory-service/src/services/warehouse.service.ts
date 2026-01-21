import type {
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../types';

export class WarehouseService {
  constructor(private db: D1Database) {}

  /**
   * 获取所有仓库列表
   */
  async getWarehouses(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    warehouses: Warehouse[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const { status, page = 1, page_size = 20 } = params || {};
    const offset = (page - 1) * page_size;

    let query = 'SELECT * FROM warehouses WHERE 1=1';
    const queryParams: any[] = [];

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    // 查询总数
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db
      .prepare(countQuery)
      .bind(...queryParams)
      .first<{ count: number }>();

    const total = countResult?.count || 0;

    // 查询列表
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(page_size, offset);

    const result = await this.db
      .prepare(query)
      .bind(...queryParams)
      .all<Warehouse>();

    return {
      warehouses: result.results || [],
      total,
      page,
      page_size,
    };
  }

  /**
   * 根据ID获取仓库
   */
  async getWarehouseById(id: number): Promise<Warehouse | null> {
    const warehouse = await this.db
      .prepare('SELECT * FROM warehouses WHERE id = ?')
      .bind(id)
      .first<Warehouse>();

    return warehouse;
  }

  /**
   * 根据code获取仓库
   */
  async getWarehouseByCode(code: string): Promise<Warehouse | null> {
    const warehouse = await this.db
      .prepare('SELECT * FROM warehouses WHERE code = ?')
      .bind(code)
      .first<Warehouse>();

    return warehouse;
  }

  /**
   * 创建仓库
   */
  async createWarehouse(request: CreateWarehouseRequest): Promise<Warehouse> {
    const {
      name,
      code,
      address,
      city,
      province,
      country = 'CN',
      postal_code,
      contact_name,
      contact_phone,
    } = request;

    // 检查code是否已存在
    const existing = await this.getWarehouseByCode(code);
    if (existing) {
      throw new Error('Warehouse code already exists');
    }

    // 创建仓库
    const result = await this.db
      .prepare(`
        INSERT INTO warehouses 
        (name, code, address, city, province, country, postal_code, contact_name, contact_phone, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(
        name,
        code,
        address || null,
        city || null,
        province || null,
        country,
        postal_code || null,
        contact_name || null,
        contact_phone || null
      )
      .run();

    // 获取创建的仓库
    const warehouse = await this.db
      .prepare('SELECT * FROM warehouses WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Warehouse>();

    if (!warehouse) {
      throw new Error('Failed to create warehouse');
    }

    return warehouse;
  }

  /**
   * 更新仓库
   */
  async updateWarehouse(id: number, request: UpdateWarehouseRequest): Promise<Warehouse> {
    // 检查仓库是否存在
    const existing = await this.getWarehouseById(id);
    if (!existing) {
      throw new Error('Warehouse not found');
    }

    const {
      name,
      address,
      city,
      province,
      country,
      postal_code,
      contact_name,
      contact_phone,
      status,
    } = request;

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      params.push(city);
    }
    if (province !== undefined) {
      updates.push('province = ?');
      params.push(province);
    }
    if (country !== undefined) {
      updates.push('country = ?');
      params.push(country);
    }
    if (postal_code !== undefined) {
      updates.push('postal_code = ?');
      params.push(postal_code);
    }
    if (contact_name !== undefined) {
      updates.push('contact_name = ?');
      params.push(contact_name);
    }
    if (contact_phone !== undefined) {
      updates.push('contact_phone = ?');
      params.push(contact_phone);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    // 执行更新
    await this.db
      .prepare(`UPDATE warehouses SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    // 获取更新后的仓库
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new Error('Failed to retrieve updated warehouse');
    }

    return warehouse;
  }

  /**
   * 删除仓库
   */
  async deleteWarehouse(id: number): Promise<void> {
    // 检查是否有库存关联
    const inventoryCount = await this.db
      .prepare('SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = ?')
      .bind(id)
      .first<{ count: number }>();

    if (inventoryCount && inventoryCount.count > 0) {
      throw new Error('Cannot delete warehouse with inventory');
    }

    // 删除仓库
    await this.db
      .prepare('DELETE FROM warehouses WHERE id = ?')
      .bind(id)
      .run();
  }

  /**
   * 获取仓库库存统计
   */
  async getWarehouseInventoryStats(id: number): Promise<{
    warehouse: Warehouse;
    total_items: number;
    total_quantity: number;
    total_reserved: number;
    low_stock_items: number;
  }> {
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // 统计数据
    const stats = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total_items,
          COALESCE(SUM(quantity), 0) as total_quantity,
          COALESCE(SUM(reserved_quantity), 0) as total_reserved,
          COUNT(CASE WHEN quantity <= low_stock_threshold THEN 1 END) as low_stock_items
        FROM inventory
        WHERE warehouse_id = ?
      `)
      .bind(id)
      .first<{
        total_items: number;
        total_quantity: number;
        total_reserved: number;
        low_stock_items: number;
      }>();

    return {
      warehouse,
      total_items: stats?.total_items || 0,
      total_quantity: stats?.total_quantity || 0,
      total_reserved: stats?.total_reserved || 0,
      low_stock_items: stats?.low_stock_items || 0,
    };
  }
}
