/**
 * 生成订单号
 * 格式: ORD{YYYYMMDD}{6位随机数}
 * 例如: ORD20240115123456
 */
export function generateOrderNumber(): string {
  const now = new Date();
  
  // 获取日期部分 YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  // 生成6位安全随机数
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  const randomPart = (randomArray[0] % 1000000).toString().padStart(6, '0');
  
  return `ORD${datePart}${randomPart}`;
}

/**
 * 验证订单号格式
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const pattern = /^ORD\d{8}\d{6}$/;
  return pattern.test(orderNumber);
}
