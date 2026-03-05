"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  retailPrice: number;
}

export default function Home() {
  const pageSize = 20;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsError, setProductsError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [subCategoriesError, setSubCategoriesError] = useState("");

  useEffect(() => {
      let isCancelled = false;

      const loadCategories = async () => {
          try {
              setCategoriesError("");
              const res = await fetch("/api/categories");
              if (!res.ok) {
                  throw new Error(`Failed to load categories (${res.status})`);
              }
              const data = await res.json();
              if (!isCancelled) {
                  setCategories(data.categories ?? []);
              }
          } catch {
              if (!isCancelled) {
                  setCategories([]);
                  setCategoriesError("Unable to load categories. Please refresh and try again.");
              }
          }
      };

      loadCategories();
      return () => {
          isCancelled = true;
      };
  }, []);

  useEffect(() => {
      let isCancelled = false;

      const loadSubCategories = async () => {
          if (!selectedCategory) {
              setSubCategories([]);
              setSelectedSubCategory("");
              setSubCategoriesError("");
              return;
          }

          try {
              setSelectedSubCategory("");
              setSubCategoriesError("");
              const subCategoryParams = new URLSearchParams({
                  category: selectedCategory,
              });
              const res = await fetch(`/api/subcategories?${subCategoryParams}`);
              if (!res.ok) {
                  throw new Error(`Failed to load subcategories (${res.status})`);
              }
              const data = await res.json();
              if (!isCancelled) {
                  setSubCategories(data.subCategories ?? []);
              }
          } catch {
              if (!isCancelled) {
                  setSubCategories([]);
                  setSubCategoriesError(
                      "Unable to load subcategories for this category right now."
                  );
              }
          }
      };

      loadSubCategories();
      return () => {
          isCancelled = true;
      };
  }, [selectedCategory]);

  useEffect(() => {
      let isCancelled = false;

      const loadProducts = async () => {
          setLoading(true);
          setProductsError("");

          const params = new URLSearchParams();
          if (search) params.append("search", search);
          if (selectedCategory) params.append("category", selectedCategory);
          if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
          params.append("limit", String(pageSize));
          params.append("offset", String((page - 1) * pageSize));

          try {
              const res = await fetch(`/api/products?${params}`);
              if (!res.ok) {
                  throw new Error(`Failed to load products (${res.status})`);
              }
              const data = await res.json();
              if (!isCancelled) {
                  setProducts(data.products ?? []);
                  setTotalProducts(data.total ?? 0);
              }
          } catch {
              if (!isCancelled) {
                  setProducts([]);
                  setTotalProducts(0);
                  setProductsError("Unable to load products. Please try again.");
              }
          } finally {
              if (!isCancelled) {
                  setLoading(false);
              }
          }
      };

      loadProducts();
      return () => {
          isCancelled = true;
      };
  }, [search, selectedCategory, selectedSubCategory, page]);

    useEffect(() => {
        setPage(1);
    }, [search, selectedCategory, selectedSubCategory]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const startItem = totalProducts === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalProducts);



    return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold mb-6">StackShop</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 0 && (
              <Select
                value={selectedSubCategory}
                onValueChange={setSelectedSubCategory}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(search || selectedCategory || selectedSubCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setSelectedSubCategory("");
                  setSubCategoriesError("");
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
            {(categoriesError || subCategoriesError) && (
                <p className="text-sm text-destructive mt-2">
                    {categoriesError || subCategoriesError}
                </p>
            )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : productsError ? (
            <div className="text-center py-12">
                <p className="text-destructive">{productsError}</p>
            </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <p className="text-sm text-muted-foreground">
                      Showing {startItem}-{endItem} of {totalProducts} products
                  </p>
                  <div className="flex items-center gap-2">
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1 || loading}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      >
                          Previous
                      </Button>
                      <p className="text-sm text-muted-foreground">
                          Page {page} of {totalPages}
                      </p>
                      <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages || loading}
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      >
                          Next
                      </Button>
                  </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.stacklineSku}
                  href={`/product?sku=${encodeURIComponent(product.stacklineSku)}`}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="p-0">
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                        {product.imageUrls[0] && (
                          <Image
                            src={product.imageUrls[0]}
                            alt={product.title}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <CardTitle className="text-base line-clamp-2 mb-2">
                        {product.title}
                      </CardTitle>
                      <CardDescription className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">
                          {product.categoryName}
                        </Badge>
                        <Badge variant="outline">
                          {product.subCategoryName}
                        </Badge>
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <span className="w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm font-medium">
                        View Details
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
