export type NotificationType = 'email' | 'sms' | 'push' | 'system';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TemplateStatus = 'active' | 'inactive';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  channel?: string;
  title?: string;
  content: string;
  data?: string; // JSON string
  status: NotificationStatus;
  priority: NotificationPriority;
  
  // 接收方信息
  recipient_email?: string;
  recipient_phone?: string;
  recipient_device_token?: string;
  
  // 发送信息
  sent_at?: string;
  read_at?: string;
  failed_at?: string;
  error_message?: string;
  
  // 关联信息
  reference_type?: string;
  reference_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: number;
  code: string;
  name: string;
  type: NotificationType;
  subject?: string;
  content: string;
  variables?: string; // JSON array
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  system_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Request/Response DTOs
export interface SendNotificationRequest {
  user_id: number;
  type: NotificationType;
  channel?: string;
  title?: string;
  content?: string;
  template_code?: string;
  template_variables?: Record<string, any>;
  priority?: NotificationPriority;
  recipient_email?: string;
  recipient_phone?: string;
  recipient_device_token?: string;
  reference_type?: string;
  reference_id?: string;
  data?: Record<string, any>;
}

export interface CreateTemplateRequest {
  code: string;
  name: string;
  type: NotificationType;
  subject?: string;
  content: string;
  variables?: string[];
  status?: TemplateStatus;
}

export interface UpdateTemplateRequest {
  name?: string;
  type?: NotificationType;
  subject?: string;
  content?: string;
  variables?: string[];
  status?: TemplateStatus;
}

export interface UpdatePreferenceRequest {
  notification_type: string;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  system_enabled?: boolean;
}

export interface NotificationListQuery {
  user_id?: number;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
}

export interface TemplateListQuery {
  type?: NotificationType;
  status?: TemplateStatus;
  page?: number;
  limit?: number;
}

export interface Bindings {
  DB: D1Database;
  [key: string]: any;
}
