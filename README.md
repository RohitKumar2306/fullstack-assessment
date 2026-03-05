# Stackline Full Stack Assignment

## Overview

This is a sample eCommerce website that includes:
- Product List Page
- Search Results Page
- Product Detail Page

The application contains various bugs including UX issues, design problems, functionality bugs, and potential security vulnerabilities.

## Getting Started

```bash
yarn install
yarn dev
```

## Your Task

1. **Identify and fix bugs** - Review the application thoroughly and fix any issues you find
2. **Document your work** - Create a comprehensive README that includes:
   - What bugs/issues you identified
   - How you fixed each issue
   - Why you chose your approach
   - Any improvements or enhancements you made

We recommend spending no more than 2 hours on this assignment. We are more interested in the quality of your work and your communication than the amount of time you spend or how many bugs you fix!

## Submission

- Fork this repository
- Make your fixes and improvements
- **Replace this README** with your own that clearly documents all changes and your reasoning
- Provide your Stackline contact with a link to a git repository where you have committed your changes

We're looking for clear communication about your problem-solving process as much as the technical fixes themselves.


## Bugs Identified and Fixes Applied

### 1) Search runtime crash from unconfigured image host
- **Issue:** Some products used images from `images-na.ssl-images-amazon.com`, which was not allowed in Next.js image config.
- **Fix:** Added that hostname to `images.remotePatterns` in `next.config.ts`.
- **Why:** Keeps `next/image` optimization enabled while safely allowlisting required remote domains.

### 2) Search crash for products missing `imageUrls`
- **Issue:** At least one product lacked `imageUrls`, causing `Cannot read properties of undefined (reading '0')`.
- **Fix:** Normalized product fixtures in `ProductService` via a `RawProduct` mapping and defaulted missing `imageUrls` to `[]`.
- **Why:** Service-layer normalization enforces a stable contract for all UI consumers.

### 3) Category/Subcategory mismatch
- **Issue:** Subcategory requests returned all values when category context was missing.
- **Fix:** Subcategory fetch now always sends `category` query parameter and resets selected subcategory when category changes.
- **Why:** Preserves centralized filtering logic on the API and prevents stale filter combinations.

### 4) Clear Filters not resetting select display state correctly
- **Issue:** Category/subcategory select labels could remain stale after clearing filters.
- **Fix:** Converted select state to fully controlled empty-string values and reset both selects on clear.
- **Why:** Avoids controlled/uncontrolled transitions and keeps UI state consistent with filter state.

### 5) Product detail URL contained serialized product JSON
- **Issue:** Large/unshareable URLs and unreliable direct navigation.
- **Fix:** Switched to SKU-based links (`/product?sku=...`) and fetched detail data from `/api/products/[sku]`.
- **Why:** Stable, shareable URLs and canonical server-side source of truth.

### 6) Retail price not displayed on product detail page
- **Issue:** `retailPrice` existed in data but was not rendered.
- **Fix:** Added `retailPrice` to relevant types and displayed formatted USD price using `Intl.NumberFormat`.
- **Why:** Minimal UI-layer fix for a presentation omission.

### 7) Missing fetch error handling and broken loading states
- **Issue:** Client fetches lacked consistent error handling.
- **Fix:** Added `try/catch/finally`, `res.ok` checks, cancellation guards, and user-facing error messages for categories, subcategories, products, and product detail.
- **Why:** Prevents unhandled promise flows and ensures loading/error state always resolves predictably.

### 8) No pagination UI
- **Issue:** Home page always showed first 20 products with no navigation.
- **Fix:** Added page state, previous/next controls, page indicator, result range text, and API `limit/offset` wiring.
- **Why:** Enables users to browse full catalog while reusing existing API capabilities.

### 9) Invalid nested interactive elements in product cards
- **Issue:** `<button>` was nested inside a clickable `<a>` card.
- **Fix:** Replaced inner button with non-interactive styled label.
- **Why:** Correct HTML semantics and improved accessibility.

### 10) Home page type drift risk
- **Issue:** Home page used a partial local `Product` interface that could diverge from backend contract.
- **Fix:** Switched to importing shared `Product` type from `lib/products`.
- **Why:** Single source of truth for type safety and maintainability.

### 11) Pagination edge-case bug (`limit=0`)
- **Issue:** `limit=0` was treated as “no limit” due to `||` fallback logic.
- **Fix:** Replaced `||` with nullish coalescing (`??`) for `offset` and `limit` defaults.
- **Why:** Honors explicit zero values while still defaulting null/undefined.

---

## Additional Improvements
- Added clearer loading/error UX for both list and detail views.
- Improved filter reset behavior and pagination reset on filter changes.
- Kept image optimization intact while broadening required remote host support.

---


## Validation Performed
- Lint checks (`npm run lint`)
- Manual/API verification for:
    - search behavior
    - category/subcategory filtering
    - clear filters state reset
    - SKU-based product detail loading
    - pagination controls and `limit/offset`
    - edge case `limit=0`

> Note: In restricted environments, Next.js Google Font fetch may warn/fail during build when outbound access is blocked. Application logic fixes remain valid.

---

## Outcome
The app is now significantly more stable and production-ready for this scope: runtime crashes were resolved, URL/data flow was normalized, filtering and pagination are reliable, accessibility was improved, and error handling is consistent across major user journeys.

---
