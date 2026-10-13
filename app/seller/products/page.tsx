
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string | number;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  selling_price: number | string;
  stock_quantity: number;
  discount_percent?: number | string;
  is_active?: boolean;
};

type ProductForm = {
  name: string;
  description: string;
  image_url: string;
  category: string;
  selling_price: string;
  stock_quantity: string;
  discount_percent: string;
};

type ApiResult = {
  success?: boolean;
  message?: string;
  products?: Product[];
  image_url?: string;
  [key: string]: unknown;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  image_url: "",
  category: "",
  selling_price: "",
  stock_quantity: "0",
  discount_percent: "0",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400";

async function readResponse(response: Response): Promise<ApiResult> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new Error(
      `Server returned an empty response (HTTP ${response.status}). Check the VS Code terminal.`
    );
  }

  try {
    return JSON.parse(responseText) as ApiResult;
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}). Check the VS Code terminal.`
    );
  }
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/seller/products", {
        cache: "no-store",
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message ||
            (response.status === 401
              ? "Please log in as an authorized seller."
              : `Failed to load products (HTTP ${response.status}).`)
        );
      }

      if (!Array.isArray(result.products)) {
        throw new Error("Unexpected products response.");
      }

      setProducts(result.products);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function updateField(field: keyof ProductForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      category: product.category ?? "",
      selling_price: String(product.selling_price ?? ""),
      stock_quantity: String(product.stock_quantity ?? 0),
      discount_percent: String(product.discount_percent ?? 0),
    });
    setImagePreview(product.image_url ?? "");
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview("");
    setError("");
    setNotice("");
  }

  async function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setNotice("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploadingImage(true);

    try {
      const data = new FormData();
      data.append("file", file);

      // Do not manually set Content-Type.
      // The browser adds the multipart boundary automatically.
      const response = await fetch("/api/seller/products/upload", {
        method: "POST",
        body: data,
      });

      const result = await readResponse(response);

      if (!response.ok || !result.success || !result.image_url) {
        throw new Error(
          result.message ||
            `Could not upload the image (HTTP ${response.status}).`
        );
      }

      setForm((previous) => ({
        ...previous,
        image_url: String(result.image_url),
      }));

      setImagePreview(String(result.image_url));
      setNotice("Image uploaded successfully. Save the product to finish.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Image upload failed. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function removeSelectedImage() {
    setImagePreview("");
    updateField("image_url", "");
    setNotice("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const price = Number(form.selling_price);
    const stock = Number(form.stock_quantity);
    const discount = Number(form.discount_percent);

    if (
      !form.name.trim() ||
      form.selling_price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      setError(
        "Enter a product name, valid price, whole-number stock and discount between 0 and 100."
      );
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      selling_price: price,
      stock_quantity: stock,
      discount_percent: discount,
    };

    try {
      const response = await fetch("/api/seller/products", {
        method: editingId !== null ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId !== null
            ? { ...payload, id: String(editingId) }
            : payload
        ),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message ||
            (response.status === 401
              ? "Please log in as an authorized seller."
              : `Could not save the product (HTTP ${response.status}).`)
        );
      }

      setNotice(
        editingId !== null
          ? "Product updated successfully."
          : "Product added successfully."
      );

      setEditingId(null);
      setForm(emptyForm);
      setImagePreview("");
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product: Product) {
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/seller/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: String(product.id),
          is_active: product.is_active === false,
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Could not update product status.");
      }

      setNotice("Product status updated.");
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update product status."
      );
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}" permanently? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/seller/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(product.id) }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Could not delete product.");
      }

      if (String(editingId) === String(product.id)) {
        cancelEdit();
      }

      setNotice("Product deleted successfully.");
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete product."
      );
    }
  }

  function formatPrice(value: number | string) {
    return `৳${Number(value).toLocaleString("en-BD")}`;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
              MR STORE / INVENTORY
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Product Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage your products, pricing, stock and discounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
            >
              Admin Home
            </Link>
            <Link
              href="/seller/dashboard"
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
            >
              Orders
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              View Store
            </Link>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total products</p>
            <p className="mt-2 text-3xl font-black">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Active products</p>
            <p className="mt-2 text-3xl font-black text-emerald-400">
              {products.filter((p) => p.is_active !== false).length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Out of stock</p>
            <p className="mt-2 text-3xl font-black text-amber-300">
              {products.filter((p) => Number(p.stock_quantity) <= 0).length}
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              {editingId !== null ? "Edit inventory" : "Create inventory"}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {editingId !== null ? "Update product" : "Add a new product"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Fill in the product information below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-300">
                Product name *
                <input
                  className={`${inputClass} mt-2`}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Premium Cotton T-Shirt"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Category
                <input
                  className={`${inputClass} mt-2`}
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  placeholder="e.g. Clothing"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Selling price (৳) *
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) => updateField("selling_price", e.target.value)}
                  placeholder="1000"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Stock quantity *
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock_quantity}
                  onChange={(e) => updateField("stock_quantity", e.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Discount (%)
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.discount_percent}
                  onChange={(e) =>
                    updateField("discount_percent", e.target.value)
                  }
                  placeholder="0"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Enter 0 for no discount, or a value up to 100.
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-slate-200">
                Product Image
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Choose a JPG, PNG or WebP image. Maximum size: 5 MB.
              </p>

              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.03]">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Product image preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="px-4 text-center text-slate-500">
                      <div className="text-4xl">📷</div>
                      <p className="mt-2 text-xs">Image preview</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col items-start gap-3">
                  <label
                    className={`inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 ${
                      uploadingImage ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {uploadingImage ? "Uploading image..." : "Choose & Upload Image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingImage}
                      onChange={handleImageSelection}
                    />
                  </label>

                  {uploadingImage && (
                    <p className="text-sm text-emerald-300">
                      Uploading your image to Supabase Storage...
                    </p>
                  )}

                  {form.image_url && !uploadingImage && (
                    <p className="break-all text-xs text-emerald-300">
                      Image uploaded and ready to save.
                    </p>
                  )}

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      disabled={uploadingImage}
                      className="rounded-lg border border-red-400/20 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>

              <details className="mt-5">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-white">
                  Or enter an image URL manually
                </summary>
                <label className="mt-3 block text-sm font-medium text-slate-300">
                  Image URL
                  <input
                    className={`${inputClass} mt-2`}
                    type="url"
                    value={form.image_url}
                    onChange={(e) => {
                      updateField("image_url", e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/product.jpg"
                  />
                </label>
              </details>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              Description
              <textarea
                className={`${inputClass} mt-2 min-h-28 resize-y`}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the product..."
                rows={4}
              />
            </label>

            {form.selling_price.trim() !== "" &&
              Number(form.selling_price) >= 0 &&
              Number(form.discount_percent) >= 0 &&
              Number(form.discount_percent) <= 100 && (
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Price preview
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xl font-black text-emerald-300">
                      {formatPrice(
                        Number(form.selling_price) *
                          (1 - Number(form.discount_percent) / 100)
                      )}
                    </span>
                    {Number(form.discount_percent) > 0 && (
                      <>
                        <span className="text-sm text-slate-500 line-through">
                          {formatPrice(Number(form.selling_price))}
                        </span>
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                          {Number(form.discount_percent)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    The storefront must use the product data and discount
                    fields to show the same price to customers.
                  </p>
                </div>
              )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Product"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-white/10 px-6 py-3 font-semibold transition hover:bg-white/5"
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="button"
                onClick={() => void loadProducts()}
                disabled={loading}
                className="rounded-xl border border-white/10 px-6 py-3 font-semibold transition hover:bg-white/5 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh List"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">All Products</h2>
              <p className="mt-1 text-sm text-slate-400">
                Edit product details or manage availability.
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              {products.length} products
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-400">
              Loading products...
            </p>
          ) : error && products.length === 0 ? (
            <p className="py-10 text-center text-slate-400">
              Product list is unavailable. Check your seller login and try
              refreshing.
            </p>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-semibold">No products yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Use the form above to add your first product.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Product</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Price</th>
                    <th className="px-4 py-4">Discount</th>
                    <th className="px-4 py-4">Final price</th>
                    <th className="px-4 py-4">Stock</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const price = Number(product.selling_price) || 0;
                    const discount = Math.min(
                      100,
                      Math.max(0, Number(product.discount_percent) || 0)
                    );
                    const finalPrice = price * (1 - discount / 100);

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-12 w-12 rounded-xl border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-lg">
                                📦
                              </div>
                            )}
                            <div>
                              <p className="max-w-52 font-semibold text-white">
                                {product.name || "Unnamed product"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                ID: {product.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5 text-slate-300">
                          {product.category || "—"}
                        </td>
                        <td className="px-4 py-5 text-slate-300">
                          {formatPrice(price)}
                        </td>
                        <td className="px-4 py-5">
                          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                            {discount}%
                          </span>
                        </td>
                        <td className="px-4 py-5 font-bold text-emerald-300">
                          {formatPrice(finalPrice)}
                        </td>
                        <td className="px-4 py-5 text-slate-300">
                          {product.stock_quantity ?? 0}
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              product.is_active === false
                                ? "bg-red-500/10 text-red-300"
                                : "bg-emerald-500/10 text-emerald-300"
                            }`}
                          >
                            {product.is_active === false
                              ? "Inactive"
                              : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleStatus(product)}
                              className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10"
                            >
                              {product.is_active === false
                                ? "Activate"
                                : "Deactivate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteProduct(product)}
                              className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs leading-6 text-slate-600">
          MR Store Admin · Product data is managed through your protected seller API.
        </p>
      </div>
    </main>
  );
}
