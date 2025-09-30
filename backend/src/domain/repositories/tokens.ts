// New proper aggregate repository
export const BOOK_AGGREGATE_REPOSITORY = Symbol('BOOK_AGGREGATE_REPOSITORY');

// User repository
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const USER_PROFILE_SETTINGS_REPOSITORY = Symbol('USER_PROFILE_SETTINGS_REPOSITORY');

// Bookmark repository
export const BOOKMARK_REPOSITORY = Symbol('BOOKMARK_REPOSITORY');

// Book cover repository
export const BOOK_COVER_REPOSITORY = Symbol('BOOK_COVER_REPOSITORY');

// Legacy repositories (to be deprecated)
export const READ_PAGE_REPOSITORY = Symbol('READ_PAGE_REPOSITORY');
export const USER_PREFERENCES_REPOSITORY = Symbol('USER_PREFERENCES_REPOSITORY');
export const TOC_ITEM_REPOSITORY = Symbol('TOC_ITEM_REPOSITORY');

// Domain services
export const FILE_SYSTEM_SERVICE = Symbol('FILE_SYSTEM_SERVICE');
export const PDF_METADATA_SERVICE = Symbol('PDF_METADATA_SERVICE');
export const SEARCH_SERVICE = Symbol('SEARCH_SERVICE');
export const TEXT_INDEXING_SERVICE = Symbol('TEXT_INDEXING_SERVICE');
export const TOC_EXTRACTION_SERVICE = Symbol('TOC_EXTRACTION_SERVICE');
export const LLM_SERVICE = Symbol('LLM_SERVICE');