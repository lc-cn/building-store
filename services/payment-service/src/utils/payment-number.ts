/**
 * 生成加密安全的随机数字
 */
function generateSecureRandomNumber(digits: number): string {
  const max = Math.pow(10, digits);
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomNum = array[0] % max;
  return randomNum.toString().padStart(digits, '0');
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
