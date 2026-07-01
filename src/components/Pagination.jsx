import { memo, useMemo, useState } from 'react';
import './pagination.css';

const PAGE_SIZES = [5, 10, 25, 50, 100];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function buildPaginationRange(currentPage, totalPages, siblingCount = 2, boundaryCount = 1) {
  if (totalPages <= 0) return [];

  const visible = new Set();
  for (let page = 1; page <= Math.min(boundaryCount, totalPages); page += 1) visible.add(page);
  for (let page = Math.max(1, totalPages - boundaryCount + 1); page <= totalPages; page += 1) visible.add(page);

  const interiorStart = Math.min(totalPages, boundaryCount + 1);
  const interiorEnd = Math.max(1, totalPages - boundaryCount);
  const desiredWindow = siblingCount * 2 + 1;
  let windowStart = Math.max(interiorStart, currentPage - siblingCount);
  let windowEnd = Math.min(interiorEnd, currentPage + siblingCount);

  if (windowEnd - windowStart + 1 < desiredWindow) {
    if (currentPage <= interiorStart + siblingCount) {
      windowEnd = Math.min(interiorEnd, windowStart + desiredWindow - 1);
    } else {
      windowStart = Math.max(interiorStart, windowEnd - desiredWindow + 1);
    }
  }

  for (let page = windowStart; page <= windowEnd; page += 1) visible.add(page);

  const pages = [...visible].sort((a, b) => a - b);
  const result = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous && page - previous > 1) result.push(`ellipsis-${previous}-${page}`);
    result.push(page);
  });
  return result;
}

function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  siblingCount = 2,
  boundaryCount = 1,
  loading = false,
  labels = {},
}) {
  const [jumpPage, setJumpPage] = useState('');
  const safeTotalPages = Math.max(0, Number(totalPages) || 0);
  const safePage = safeTotalPages ? clamp(currentPage, 1, safeTotalPages) : 1;
  const items = useMemo(
    () => buildPaginationRange(safePage, safeTotalPages, siblingCount, boundaryCount),
    [safePage, safeTotalPages, siblingCount, boundaryCount]
  );
  const start = totalRecords ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, totalRecords);
  const isFirst = safePage <= 1 || safeTotalPages === 0;
  const isLast = safePage >= safeTotalPages || safeTotalPages === 0;

  const hrefFor = (page) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    params.set('pageSize', pageSize);
    return `${window.location.pathname}?${params.toString()}`;
  };

  const navigate = (page) => {
    if (loading || safeTotalPages === 0) return;
    onPageChange(clamp(page, 1, safeTotalPages));
  };

  const submitJump = (event) => {
    event.preventDefault();
    const page = Number.parseInt(jumpPage, 10);
    if (Number.isFinite(page)) navigate(page);
    setJumpPage('');
  };

  const handleKeys = (event) => {
    if (event.target.matches('input, select')) return;
    const actions = {
      ArrowLeft: () => navigate(safePage - 1),
      ArrowRight: () => navigate(safePage + 1),
      Home: () => navigate(1),
      End: () => navigate(safeTotalPages),
    };
    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
    }
  };

  const PageLink = ({ page, children, className = '', ariaLabel, disabled = false }) => disabled ? (
    <span className={`pagination-button is-disabled ${className}`} aria-disabled="true">{children}</span>
  ) : (
    <a
      href={hrefFor(page)}
      className={`pagination-button ${className}`}
      aria-label={ariaLabel}
      aria-current={page === safePage ? 'page' : undefined}
      onClick={(event) => { event.preventDefault(); navigate(page); }}
    >
      {children}
    </a>
  );

  return (
    <nav className={`enterprise-pagination ${loading ? 'is-loading' : ''}`} aria-label="Expense list pagination" onKeyDown={handleKeys}>
      <div className="pagination-summary" aria-live="polite" aria-atomic="true">
        {totalRecords ? `Showing ${start.toLocaleString()}-${end.toLocaleString()} of ${totalRecords.toLocaleString()} records` : 'No records found'}
      </div>

      <div className="pagination-main">
        <div className="pagination-pages">
          <span className="desktop-only"><PageLink page={1} disabled={isFirst} ariaLabel={labels.first || 'Go to first page'}>«</PageLink></span>
          <PageLink page={safePage - 1} disabled={isFirst} ariaLabel={labels.previous || 'Go to previous page'}>‹</PageLink>

          <div className="desktop-pagination">
            {items.map((item) => typeof item === 'number' ? (
              <PageLink key={item} page={item} ariaLabel={`Go to page ${item}`} className={item === safePage ? 'is-active' : ''}>{item}</PageLink>
            ) : <span className="pagination-ellipsis" aria-hidden="true" key={item}>…</span>)}
          </div>

          <div className="tablet-pagination">
            {[safePage - 1, safePage, safePage + 1].filter((page) => page >= 1 && page <= safeTotalPages).map((page) => (
              <PageLink key={page} page={page} className={page === safePage ? 'is-active' : ''}>{page}</PageLink>
            ))}
          </div>
          <span className="mobile-pagination" aria-current="page">{safePage}/{safeTotalPages || 1}</span>

          <PageLink page={safePage + 1} disabled={isLast} ariaLabel={labels.next || 'Go to next page'}>›</PageLink>
          <span className="desktop-only"><PageLink page={safeTotalPages} disabled={isLast} ariaLabel={labels.last || 'Go to last page'}>»</PageLink></span>
        </div>

        <div className="pagination-tools">
          <label className="page-size-control">
            <span>Rows per page</span>
            <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} disabled={loading} aria-label="Rows per page">
              {PAGE_SIZES.map((size) => <option value={size} key={size}>{size}</option>)}
            </select>
          </label>
          <form className="jump-control" onSubmit={submitJump}>
            <label htmlFor="jump-page">Go to</label>
            <input id="jump-page" type="number" min="1" max={safeTotalPages || 1} value={jumpPage} onChange={(event) => setJumpPage(event.target.value)} placeholder={String(safePage)} disabled={!safeTotalPages || loading} />
            <button type="submit" disabled={!jumpPage || loading}>Go</button>
          </form>
        </div>
      </div>
      {loading && <span className="sr-only" role="status">Loading page {safePage}</span>}
    </nav>
  );
}

export default memo(Pagination);
