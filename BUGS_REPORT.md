# StackShop - Bug Audit Report

**Date:** 2026-03-05
**Application:** StackShop (Full-Stack Next.js eCommerce App)
**Auditor:** Claude Code

---

## Summary

A total of **14 bugs** were identified across the codebase, categorized by severity. These span backend logic, frontend UI/UX, data handling, and application architecture concerns.

| Severity | Count |
|----------|-------|
| Critical | 3     |
| High     | 4     |
| Medium   | 5     |
| Low      | 2     |

---

## Critical Bugs

### BUG-01: Subcategory Filter Does Not Pass Category Parameter to API

**File:** `app/page.tsx:55`
**Type:** Logic Bug

The subcategories fetch call does not include the selected category as a query parameter. This means the API returns **all** subcategories across every category instead of only those belonging to the selected category.

```javascript
// CURRENT (broken)
fetch(`/api/subcategories`)

// EXPECTED (correct)
fetch(`/api/subcategories?category=${selectedCategory}`)
```

**Impact:** Subcategory dropdown displays irrelevant subcategories from other categories, leading to broken filtering and confusing UX.

---

### BUG-02: Product Detail Page Relies on URL Query Params Instead of API

**File:** `app/page.tsx:168-170`, `app/product/page.tsx:23-36`
**Type:** Architecture / Data Integrity Bug

Product data is serialized as JSON and passed through URL query parameters:

```javascript
// Home page passes entire product as JSON in URL
href={{
  pathname: "/product",
  query: { product: JSON.stringify(product) },
}}
```

**Problems:**
1. **URL length limits** - Browser URL limits (~2,048-8,192 chars) can be exceeded with products that have many feature bullets or image URLs, causing navigation failures.
2. **Data incompleteness** - The home page Product interface omits fields like `retailPrice`, `featureBullets`, and `retailerSku`. While the API returns them, this architecture is fragile.
3. **URL manipulation** - Users can tamper with JSON in the URL to display arbitrary product data.
4. **Non-shareable URLs** - URLs with giant JSON blobs are not user-friendly or shareable.
5. **No direct access** - Navigating directly to a product URL (e.g., from a bookmark) without the JSON param shows "Product not found."

**Expected:** Should use dynamic routing (`/product/[sku]`) and fetch product data via the existing `/api/products/[sku]` endpoint.

---

### BUG-03: No Error Handling on Any Fetch Calls

**File:** `app/page.tsx:47-77`
**Type:** Error Handling Bug

All three `useEffect` hooks that fetch data (categories, subcategories, products) have no `.catch()` handlers or error states:

```javascript
// No .catch() - if API fails, promise rejection is unhandled
fetch("/api/categories")
  .then((res) => res.json())
  .then((data) => setCategories(data.categories));
```

**Impact:**
- If any API call fails, the UI gets stuck in a broken state.
- The products fetch leaves `loading` as `true` forever on failure (user sees "Loading products..." indefinitely).
- Unhandled promise rejections in the console.

---

## High Severity Bugs

### BUG-04: Loading State Never Resets on Fetch Failure

**File:** `app/page.tsx:64-78`
**Type:** State Management Bug

The loading state is set to `true` before fetching products but is only set to `false` inside `.then()`. If the fetch fails, loading remains `true` forever.

```javascript
setLoading(true);  // Set to true
fetch(`/api/products?${params}`)
  .then((res) => res.json())
  .then((data) => {
    setProducts(data.products);
    setLoading(false);  // Only reset here - never reached on error
  });
// Missing: .catch(() => setLoading(false))
```

**Impact:** Users see a permanent "Loading products..." message with no way to recover except refreshing the page.

---

### BUG-05: Category Filter Cannot Be Deselected (No "All" Option)

**File:** `app/page.tsx:97-111`
**Type:** UI/UX Bug

The Radix UI `<Select>` component does not support deselecting a value once selected. There is no "All Categories" option in the dropdown items list. The only way to clear the filter is to use the "Clear Filters" button, which also resets search and subcategory.

```javascript
<Select
  value={selectedCategory}
  onValueChange={(value) => setSelectedCategory(value || undefined)}
>
  {/* No "All Categories" SelectItem present */}
  {categories.map((cat) => (
    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
  ))}
</Select>
```

**Impact:** Users cannot clear just the category filter without clearing all other filters too.

---

### BUG-06: `retailPrice` Not Displayed Anywhere in the UI

**File:** `app/page.tsx`, `app/product/page.tsx`
**Type:** Missing Feature / Data Bug

The product data includes `retailPrice` (e.g., `149.99`) but it is never displayed on either the product listing page or the product detail page. For an eCommerce app, this is a critical data omission.

**Data evidence:**
```json
{
  "stacklineSku": "E8ZVY2BP3",
  "title": "Amazon Kindle Paperwhite...",
  "retailPrice": 149.99,
  ...
}
```

The `retailPrice` field is also missing from the `Product` interface in `lib/products.ts`.

**Impact:** Users cannot see product prices anywhere in the application.

---

### BUG-07: Missing `Suspense` Boundary for `useSearchParams()`

**File:** `app/product/page.tsx:23`
**Type:** React/Next.js Bug

The product detail page uses `useSearchParams()` without being wrapped in a `<Suspense>` boundary. In Next.js 15 with App Router, this triggers a build warning and can cause the entire page to fall back to client-side rendering.

```javascript
export default function ProductPage() {
  const searchParams = useSearchParams(); // Needs Suspense boundary
```

**Impact:** Build warnings, degraded performance, potential hydration issues in production.

---

## Medium Severity Bugs

### BUG-08: No Pagination UI Despite API Support

**File:** `app/page.tsx:70`
**Type:** UI Bug

The API supports `limit` and `offset` parameters and returns a `total` count, but the frontend only fetches 20 products with no pagination controls:

```javascript
params.append("limit", "20");
// No offset parameter, no "Load More" or page navigation
```

The API response includes `total` which is never used by the frontend.

**Impact:** Users can only see the first 20 products out of potentially hundreds. No way to browse the full catalog.

---

### BUG-09: Metadata Still Shows Default "Create Next App"

**File:** `app/layout.tsx:15-18`
**Type:** UI/SEO Bug

The page metadata was never updated from the Next.js template defaults:

```javascript
export const metadata: Metadata = {
  title: "Create Next App",           // Should be "StackShop"
  description: "Generated by create next app",  // Should describe the app
};
```

**Impact:** Browser tab shows "Create Next App", poor SEO, unprofessional appearance.

---

### BUG-10: Product Card Image Area Shows Empty Space When No Image

**File:** `app/page.tsx:174-183`
**Type:** UI Bug

When a product has no images (empty `imageUrls` array), the card still renders a 192px tall empty gray box with no fallback image or "No image available" text:

```javascript
<div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
  {product.imageUrls[0] && (
    <Image ... />
  )}
  {/* No fallback for missing images */}
</div>
```

**Impact:** Blank gray boxes appear in the product grid for products without images.

---

### BUG-11: Product Detail Page Crashes if `featureBullets` is Undefined

**File:** `app/product/page.tsx:119`
**Type:** Runtime Error

If the product data parsed from the URL doesn't contain `featureBullets`, accessing `.length` on `undefined` will throw a TypeError:

```javascript
{product.featureBullets.length > 0 && (  // Crashes if featureBullets is undefined
```

**Impact:** Page crashes with a white screen for products with malformed or incomplete data.

---

### BUG-12: `getTotalCount` Performs Redundant Full Query

**File:** `lib/products.ts:83-85`
**Type:** Performance Bug

The `getTotalCount` method calls `getAll()` which applies all filters AND pagination, then counts the result. But it should count all matching items regardless of pagination:

```javascript
getTotalCount(filters?: Omit<ProductFilters, 'limit' | 'offset'>): number {
  return this.getAll(filters).length;
  // getAll() without limit/offset returns all, which is correct by accident
  // since Omit removes limit/offset from the type. But it still creates a
  // full copy of the filtered array just to get its length.
}
```

Additionally, in `api/products/route.ts`, both `getAll(filters)` and `getTotalCount(filters)` are called separately, meaning the filtering logic runs twice for every request.

**Impact:** Every product list API call runs the full filter pipeline twice unnecessarily.

---

## Low Severity Bugs

### BUG-13: Home Page Product Interface Missing Fields

**File:** `app/page.tsx:26-32`
**Type:** TypeScript / Type Safety Bug

The `Product` interface on the home page is incomplete compared to the actual API response:

```typescript
// Home page interface (incomplete)
interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  // Missing: featureBullets, retailerSku, retailPrice, categoryId, subCategoryId
}
```

**Impact:** TypeScript won't catch errors when accessing missing fields. The API returns extra data that inflates the response size unnecessarily (should either include all fields in the type or use a leaner API endpoint).

---

### BUG-14: Interactive Button Inside Link (Nested Interactive Elements)

**File:** `app/page.tsx:165-205`
**Type:** Accessibility / HTML Validity Bug

The product card wraps a `<Link>` (which renders as `<a>`) around a `<Button>` (which renders as `<button>`). Nesting interactive elements is invalid HTML:

```jsx
<Link href={...}>          {/* <a> tag */}
  <Card>
    <CardFooter>
      <Button variant="outline">   {/* <button> inside <a> - invalid */}
        View Details
      </Button>
    </CardFooter>
  </Card>
</Link>
```

**Impact:** Screen readers may announce this incorrectly, click behavior can be unpredictable across browsers, and it violates HTML spec (no interactive content inside `<a>`).

---

## Bug Location Summary

| Bug ID | File | Line(s) | Severity |
|--------|------|---------|----------|
| BUG-01 | `app/page.tsx` | 55 | Critical |
| BUG-02 | `app/page.tsx`, `app/product/page.tsx` | 168-170, 23-36 | Critical |
| BUG-03 | `app/page.tsx` | 47-77 | Critical |
| BUG-04 | `app/page.tsx` | 64-78 | High |
| BUG-05 | `app/page.tsx` | 97-111 | High |
| BUG-06 | `app/page.tsx`, `app/product/page.tsx`, `lib/products.ts` | — | High |
| BUG-07 | `app/product/page.tsx` | 23 | High |
| BUG-08 | `app/page.tsx` | 70 | Medium |
| BUG-09 | `app/layout.tsx` | 15-18 | Medium |
| BUG-10 | `app/page.tsx` | 174-183 | Medium |
| BUG-11 | `app/product/page.tsx` | 119 | Medium |
| BUG-12 | `lib/products.ts` | 83-85 | Medium |
| BUG-13 | `app/page.tsx` | 26-32 | Low |
| BUG-14 | `app/page.tsx` | 165-205 | Low |
