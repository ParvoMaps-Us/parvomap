/**
 * Utah ZIP codes span 840xx–847xx.
 * 848xx–849xx are Idaho. This check is prefix-based and covers all
 * Utah ZIPs without maintaining a static list.
 */
export function isUtahZip(zip: string): boolean {
  if (!/^\d{5}$/.test(zip)) return false
  const prefix = zip.slice(0, 3)
  return prefix >= '840' && prefix <= '847'
}
