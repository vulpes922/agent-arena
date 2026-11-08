/** Merge browser snapshots without replacing newer work from another tab.
 * @param {...import('./arena').Session[]} histories
 * @returns {import('./arena').Session[]}
 */
export function mergeHistories(...histories) {
  const latest = new Map();
  for (const history of histories) {
    if (!Array.isArray(history)) continue;
    for (const session of history) {
      if (!session || typeof session.id !== 'string' || !Number.isFinite(session.updatedAt)) continue;
      const previous = latest.get(session.id);
      if (!previous || session.updatedAt > previous.updatedAt) latest.set(session.id, session);
    }
  }
  return [...latest.values()].sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id)).slice(0, 12);
}
