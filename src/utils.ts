export const MIN_INIT_EPOCH = 946656000000; // 2000-01-01 00:00:00
export const DEFAULT_INIT_EPOCH = 1640966400000; // 2022-01-01 00:00:00

export function getMaxByBitLength(len: number) {
  if (len <= 0) return 0;
  return Number('0b'.padEnd(len + 2, '1'));
}

export function id2str(id: bigint, radix = 36) {
  if (radix < 2 || radix > 36 || Math.floor(radix) !== radix) {
    throw new Error(`radix进制参数范围应该在[2, 36]之间的正整数，当前值: ${radix}`);
  }
  return id.toString(radix).toUpperCase();
}

// function sleep(ms: number) {
//   return new Promise<void>(resolve => {
//     setTimeout(resolve, ms);
//   });
// }
export const resolved = Promise.resolve();

const indentUnit = '  ';
export function objectToString(obj: Record<string, any>, indent = '') {
  let str = `${obj.constructor ? obj.constructor.name : 'Unknown Object'} {\n`;
  let content = '';
  let val: any;
  const subIndent = indent + indentUnit;
  Object.keys(obj).forEach((key) => {
    val = obj[key];
    content += `${subIndent}${key}: ${val && typeof val === 'object' ? objectToString(val, subIndent) : val},\n`
  });
  str += content.substring(0, content.length - 2) + `\n${indent}}`;
  return str;
}
