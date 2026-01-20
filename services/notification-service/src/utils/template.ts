/**
 * 模板变量替换工具
 * 支持 {{variable}} 格式的变量替换
 */

/**
 * 替换模板中的变量
 * @param template 模板字符串，如 "订单 {{order_number}} 已创建"
 * @param variables 变量对象，如 { order_number: "12345" }
 * @returns 替换后的字符串
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  if (!template) return '';
  if (!variables || Object.keys(variables).length === 0) return template;

  let result = template;
  
  // 匹配 {{variable}} 格式的变量
  const variablePattern = /\{\{(\w+)\}\}/g;
  
  result = result.replace(variablePattern, (match, variableName) => {
    const value = variables[variableName];
    
    // 如果变量不存在，保留原始占位符
    if (value === undefined || value === null) {
      return match;
    }
    
    // 转换为字符串
    return String(value);
  });
  
  return result;
}

/**
 * 提取模板中的所有变量名
 * @param template 模板字符串
 * @returns 变量名数组
 */
export function extractTemplateVariables(template: string): string[] {
  if (!template) return [];
  
  const variablePattern = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variablePattern.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * 验证模板变量是否都已提供
 * @param template 模板字符串
 * @param variables 提供的变量
 * @returns 缺失的变量名数组
 */
export function validateTemplateVariables(
  template: string,
  variables: Record<string, any>
): string[] {
  const requiredVariables = extractTemplateVariables(template);
  const providedVariables = Object.keys(variables || {});
  
  return requiredVariables.filter(
    varName => !providedVariables.includes(varName)
  );
}
