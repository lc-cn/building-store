// 产品服务类型定义

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  description?: string;
  image_url?: string;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku: string;
  barcode?: string;
  images?: string;
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  weight?: number;
  dimensions?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  barcode?: string;
  image_url?: string;
  attributes?: string;
  weight?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parent_id?: number;
  description?: string;
  image_url?: string;
  sort_order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parent_id?: number;
  description?: string;
  image_url?: string;
  sort_order?: number;
  status?: 'active' | 'inactive';
}

export interface CreateProductInput {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku: string;
  barcode?: string;
  images?: string[];
  status?: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  featured?: boolean;
  weight?: number;
  dimensions?: { length: number, width: number, height: number };
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface UpdateProductInput {
  category_id?: number;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  price?: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  images?: string[];
  status?: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  featured?: boolean;
  weight?: number;
  dimensions?: { length: number, width: number, height: number };
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface CreateVariantInput {
  product_id: number;
  sku: string;
  name: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  barcode?: string;
  image_url?: string;
  attributes?: Record<string, string>;
  weight?: number;
}

export interface UpdateVariantInput {
  sku?: string;
  name?: string;
  price?: number;
  compare_price?: number;
  cost_price?: number;
  barcode?: string;
  image_url?: string;
  attributes?: Record<string, string>;
  weight?: number;
  status?: 'active' | 'inactive';
}

export interface Bindings {
  DB: D1Database;
  CACHE: KVNamespace;
}
