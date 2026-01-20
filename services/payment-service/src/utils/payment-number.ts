/**
 * 生成加密安全的随机数字（使用拒绝采样确保均匀分布）
 */
function generateSecureRandomNumber(digits: number): string {
  const max = Math.pow(10, digits);
  const range = Math.pow(2, 32);
  const validRange = Math.floor(range / max) * max;
  
  let randomNum: number;
  do {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    randomNum = array[0];
  } while (randomNum >= validRange);
  
  return (randomNum % max).toString().padStart(digits, '0');
}

/**
 * 生成支付单号
 * 格式：PAY{YYYYMMDD}{6位随机数}
 * 示例：PAY202312251234567
 */
export function generatePaymentNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const randomNum = generateSecureRandomNumber(6);
  
  return `PAY${dateStr}${randomNum}`;
}

/**
 * 生成退款单号
 * 格式：REF{YYYYMMDD}{6位随机数}
 * 示例：REF202312251234567
 */
export function generateRefundNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const randomNum = generateSecureRandomNumber(6);
  
  return `REF${dateStr}${randomNum}`;
}
