export function cleanLatestCommit(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const commit = data[0];
  const commitInfo = commit.commit;

  if (!commitInfo) {
    return null;
  }

  const rawDate = commitInfo.author?.date || '';
  // 格式化时间: 2026-06-21 18:28:16
  let formattedDate = '';
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      const pad = (n) => String(n).padStart(2, '0');
      formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      formattedDate = rawDate;
    }
  }

  return {
    author: commitInfo.author?.name || '',
    date: formattedDate,
    message: (commitInfo.message || '').trim(),
  };
}
