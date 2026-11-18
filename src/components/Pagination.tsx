import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from 'lucide-react';

export interface PaginationProps {
  /** 0-based index */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalElements: number;
  /** Current items per page */
  pageSize: number;
  /** Allowed page sizes, defaults to [5, 10, 15, 20] */
  pageSizeOptions?: number[];
  /** Callback when page is changed (returns 0-based page index) */
  onPageChange: (page: number) => void;
  /** Callback when page size is changed */
  onPageSizeChange?: (size: number) => void;
  /** Human-readable item noun, e.g. "phiên truy cập", "thiết bị", "bản ghi" */
  itemLabel?: string;
  /** Custom wrapper class */
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  pageSizeOptions = [5, 10, 15, 20],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'bản ghi',
  className = '',
}) => {
  const safeTotalPages = Math.max(1, totalPages || Math.ceil(totalElements / pageSize) || 1);
  const safeCurrentPage = Math.min(Math.max(0, currentPage), safeTotalPages - 1);

  // Compute item range display
  const startItem = totalElements === 0 ? 0 : safeCurrentPage * pageSize + 1;
  const endItem = Math.min((safeCurrentPage + 1) * pageSize, totalElements);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i);
    }

    const pages: (number | '...')[] = [];
    const current = safeCurrentPage;

    // Always include page 1 (index 0)
    pages.push(0);

    if (current > 2) {
      pages.push('...');
    }

    // Window around current page
    const start = Math.max(1, current - 1);
    const end = Math.min(safeTotalPages - 2, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < safeTotalPages - 3) {
      pages.push('...');
    }

    // Always include last page
    pages.push(safeTotalPages - 1);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`px-4 py-3 bg-white/95 border-t border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 transition-all ${className}`}
    >
      {/* 1. Item summary info */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
        <span className="text-slate-500">Hiển thị</span>
        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-mono border border-slate-200/60">
          {startItem.toLocaleString('vi-VN')} – {endItem.toLocaleString('vi-VN')}
        </span>
        <span className="text-slate-500">trong tổng số</span>
        <span className="font-bold text-[#004b87] bg-sky-50 px-2 py-0.5 rounded-md text-[11px] font-mono border border-sky-200/60">
          {totalElements.toLocaleString('vi-VN')}
        </span>
        <span className="text-slate-600 font-medium">{itemLabel}</span>
      </div>

      {/* 2. Page Size Selector (5 / 10 / 15 / 20) */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Số dòng/trang:</span>
          </div>
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs">
            {pageSizeOptions.map((size) => {
              const active = pageSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onPageSizeChange(size)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-white text-[#004b87] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={`${size} dòng mỗi trang`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Page Navigation (First, Prev, Page Pills, Next, Last) */}
      <div className="flex items-center gap-1 flex-wrap justify-center md:justify-end">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={safeCurrentPage === 0}
          className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 0}
          className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-0.5">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-slate-400 font-mono text-xs select-none"
                >
                  …
                </span>
              );
            }

            const isCurrent = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-1.5 text-xs font-mono font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#004b87] text-white shadow-xs font-bold scale-[1.02]'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#004b87]'
                }`}
                title={`Chuyển tới trang ${p + 1}`}
              >
                {p + 1}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages - 1, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= safeTotalPages - 1}
          className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
          title="Trang sau"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages - 1)}
          disabled={safeCurrentPage >= safeTotalPages - 1}
          className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
          title="Trang cuối"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
