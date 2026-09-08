/**
 * Builds the correct URL for a stored file.
 * file_path in DB is stored as "uploads/documents/4/SSC_Memo_123.png"
 * Uses the current browser host so it works on both localhost and LAN.
 */
export function getFileUrl(filePath) {
  if (!filePath) return '#';
  // Remove any leading slash
  const clean = filePath.replace(/^\//, '');
  // Use current origin so it works on LAN (e.g., http://192.168.192.112:5000)
  return `${window.location.origin}/${clean}`;
}
