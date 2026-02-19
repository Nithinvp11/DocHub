// Pagination limits for consistent behavior across the app
export const PAGINATION_LIMITS = {
  DOCUMENTS_PER_PAGE: 50,
  VERSIONS_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 50,
  WORKSPACES_PER_PAGE: 20,
  ACTIVITY_FEED: 10,
  VERSION_HISTORY_SIDEBAR: 10,
  MEMBERS_PER_PAGE: 50,
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  API_CALLS_PER_MINUTE: 60,
  AUTH_ATTEMPTS_PER_HOUR: 5,
  DOCUMENT_CREATES_PER_HOUR: 100,
} as const;

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}
