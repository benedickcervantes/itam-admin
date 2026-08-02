/**
 * Guards paged list fetches so a slow high-page response cannot overwrite
 * a newer page-1 response after filters change.
 */
export function createLoadSeq() {
  let seq = 0;
  return {
    next() {
      seq += 1;
      return seq;
    },
    isCurrent(n: number) {
      return n === seq;
    },
  };
}

/** After a filter change: if current page is past the new total, jump to page 1. */
export function shouldResetPage(page: number, totalPages: number): boolean {
  const pages = Math.max(0, totalPages || 0);
  return pages > 0 && page > pages;
}
