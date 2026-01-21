// 会话管理服务

import type { Session, Env } from '../types';
import { generateUUID } from '../utils/crypto';

/**
 * 创建新会话
 */
export async function createSession(
  userId: string,
  email: string | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  metadata: Record<string, any> | undefined,
  env: Env,
  ttl: number = 86400 * 7 // 默认7天
): Promise<Session> {
  const sessionId = generateUUID();
  const now = Date.now();
  
  const session: Session = {
    sessionId,
    userId,
    email,
    createdAt: now,
    expiresAt: now + ttl * 1000,
    lastAccessedAt: now,
    ipAddress,
    userAgent,
    metadata
  };
  
  // 存储会话到 KV
  await env.SESSION_KV.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: ttl }
  );
  
  // 为用户维护活跃会话列表
  const userSessionsKey = `user:${userId}:sessions`;
  const userSessionsData = await env.SESSION_KV.get(userSessionsKey);
  const userSessions: string[] = userSessionsData ? JSON.parse(userSessionsData) : [];
  
  if (!userSessions.includes(sessionId)) {
    userSessions.push(sessionId);
    await env.SESSION_KV.put(
      userSessionsKey,
      JSON.stringify(userSessions),
      { expirationTtl: ttl }
    );
  }
  
  return session;
}

/**
 * 获取会话信息
 */
export async function getSession(
  sessionId: string,
  env: Env
): Promise<Session | null> {
  const sessionData = await env.SESSION_KV.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return null;
  }
  
  const session: Session = JSON.parse(sessionData);
  
  // 检查会话是否过期
  if (session.expiresAt < Date.now()) {
    await deleteSession(sessionId, env);
    return null;
  }
  
  // 更新最后访问时间
  session.lastAccessedAt = Date.now();
  await env.SESSION_KV.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: Math.floor((session.expiresAt - Date.now()) / 1000) }
  );
  
  return session;
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string, env: Env): Promise<boolean> {
  const sessionData = await env.SESSION_KV.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return false;
  }
  
  const session: Session = JSON.parse(sessionData);
  
  // 从会话存储中删除
  await env.SESSION_KV.delete(`session:${sessionId}`);
  
  // 从用户会话列表中移除
  const userSessionsKey = `user:${session.userId}:sessions`;
  const userSessionsData = await env.SESSION_KV.get(userSessionsKey);
  
  if (userSessionsData) {
    const userSessions: string[] = JSON.parse(userSessionsData);
    const updatedSessions = userSessions.filter(id => id !== sessionId);
    
    if (updatedSessions.length > 0) {
      await env.SESSION_KV.put(userSessionsKey, JSON.stringify(updatedSessions));
    } else {
      await env.SESSION_KV.delete(userSessionsKey);
    }
  }
  
  return true;
}

/**
 * 获取用户的所有活跃会话
 */
export async function getUserSessions(
  userId: string,
  env: Env
): Promise<Session[]> {
  const userSessionsKey = `user:${userId}:sessions`;
  const userSessionsData = await env.SESSION_KV.get(userSessionsKey);
  
  if (!userSessionsData) {
    return [];
  }
  
  const sessionIds: string[] = JSON.parse(userSessionsData);
  const sessions: Session[] = [];
  
  for (const sessionId of sessionIds) {
    const session = await getSession(sessionId, env);
    if (session) {
      sessions.push(session);
    }
  }
  
  return sessions;
}

/**
 * 删除用户的所有会话（登出所有设备）
 */
export async function deleteAllUserSessions(
  userId: string,
  env: Env
): Promise<number> {
  const sessions = await getUserSessions(userId, env);
  
  for (const session of sessions) {
    await deleteSession(session.sessionId, env);
  }
  
  return sessions.length;
}

/**
 * 验证会话是否有效
 */
export async function validateSession(
  sessionId: string,
  env: Env
): Promise<{ valid: boolean; session?: Session; error?: string }> {
  const session = await getSession(sessionId, env);
  
  if (!session) {
    return { valid: false, error: 'Session not found or expired' };
  }
  
  return { valid: true, session };
}

/**
 * 更新会话元数据
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: Record<string, any>,
  env: Env
): Promise<boolean> {
  const session = await getSession(sessionId, env);
  
  if (!session) {
    return false;
  }
  
  session.metadata = { ...session.metadata, ...metadata };
  
  const ttl = Math.floor((session.expiresAt - Date.now()) / 1000);
  await env.SESSION_KV.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: ttl > 0 ? ttl : 60 }
  );
  
  return true;
}

/**
 * 延长会话有效期
 */
export async function extendSession(
  sessionId: string,
  additionalTtl: number,
  env: Env
): Promise<boolean> {
  const session = await getSession(sessionId, env);
  
  if (!session) {
    return false;
  }
  
  session.expiresAt = Date.now() + additionalTtl * 1000;
  
  await env.SESSION_KV.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: additionalTtl }
  );
  
  return true;
}
