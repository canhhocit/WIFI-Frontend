import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Layers,
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
  /** Human-readable item noun, e.g. "chiến dịch", "thiết bị", "bản ghi" */
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

  // Generate page numbers with smart ellipsis (1 ... 4 5 6 ... 15)
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
      className={`px-4 py-3 bg-white/95 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 transition-all ${className}`}
    >
      {/* 1. Item summary info (Clean typography, no cluttered tags) */}
      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
        <span>Hiển thị</span>
        <span className="font-semibold text-slate-800 font-mono">
          {startItem.toLocaleString('vi-VN')}–{endItem.toLocaleString('vi-VN')}
        </span>
        <span>trong</span>
        <span className="font-bold text-[#004b87] font-mono">
          {totalElements.toLocaleString('vi-VN')}
        </span>
        <span className="text-slate-600 font-medium">{itemLabel}</span>
      </div>

      {/* 2. Middle & Right controls */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end">
        {/* Page Size Selector (Compact Elegant Select) */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-[11px] font-medium hidden md:inline">Hiển thị:</span>
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 font-semibold text-xs rounded-md pl-2.5 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-[#004b87] transition cursor-pointer"
                title="Chọn số lượng bản ghi hiển thị trên mỗi trang"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / trang
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(0)}
            disabled={safeCurrentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            title="Trang đầu"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page Pills */}
          <div className="flex items-center gap-1 mx-0.5">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-5 text-center text-slate-400 font-mono text-xs select-none"
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
                  className={`min-w-[28px] h-7 px-2 text-xs font-mono font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#004b87] text-white shadow-xs font-bold ring-1 ring-[#004b87]/30'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#004b87] hover:border-slate-300'
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
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeTotalPages - 1)}
            disabled={safeCurrentPage >= safeTotalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            title="Trang cuối"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
