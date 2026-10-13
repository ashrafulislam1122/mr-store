
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";

type Product = {
  id: string | number;
  title: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  stock: number;
  source: "local" | "supplier";
};

type ApiProduct = Record<string, unknown>;

function getNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[,\s৳$]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function extractProducts(data: unknown): ApiProduct[] {
  if (Array.isArray(data)) {
    return data as ApiProduct[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const result = data as Record<string, unknown>;

  for (const key of ["products", "data", "items", "results"]) {
    const value = result[key];

    if (Array.isArray(value)) {
      return value as ApiProduct[];
    }

    if (value && typeof value === "object") {
      const nested = extractProducts(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function getPriceField(item: ApiProduct, keys: string[]): number {
  for (const key of keys) {
    const value = item[key];

    if (value !== null && value !== undefined && value !== "") {
      const price = getNumber(value, -1);
      if (price >= 0) return price;
    }
  }

  return 0;
}

function normalizeProduct(
  item: ApiProduct,
  source: "local" | "supplier"
): Product {
  const id = getText(item.id ?? item.product_id ?? item.productId);

  const name = getText(
    item.name ??
      item.title ??
      item.product_name ??
      item.productName
  );

  const originalPrice = getPriceField(item, [
    "originalPrice",
    "original_price",
    "selling_price",
    "sellingPrice",
    "regular_price",
    "regularPrice",
    "suggested_price",
    "suggestedPrice",
    "mrp",
    "price",
    "salePrice",
    "sale_price",
    "amount",
  ]);

  const discountPercent = Math.min(
    100,
    Math.max(
      0,
      getNumber(
        item.discountPercent ??
          item.discount_percent ??
          item.discount ??
          0
      )
    )
  );

  const calculatedPrice =
    Math.round(
      originalPrice * (1 - discountPercent / 100) * 100
    ) / 100;

  const explicitFinalPrice = getPriceField(item, [
    "finalPrice",
    "final_price",
    "discounted_price",
    "discountedPrice",
  ]);

  const finalPrice =
    explicitFinalPrice > 0
      ? explicitFinalPrice
      : calculatedPrice > 0
        ? calculatedPrice
        : originalPrice;

  const categoryValue = item.category;
  const category =
    typeof categoryValue === "object" && categoryValue !== null
      ? getText(
          (categoryValue as Record<string, unknown>).name ??
            (categoryValue as Record<string, unknown>).title
        )
      : getText(categoryValue ?? item.category_name);

  const image = getText(
    item.image_url ??
      item.imageUrl ??
      item.image ??
      item.thumbnail ??
      item.photo ??
      item.product_image ??
      item.productImage
  );

  const stock = getNumber(
    item.stock_quantity ?? item.stock ?? item.quantity,
    99
  );

  return {
    id,
    name,
    title: name,
    description: getText(item.description ?? item.details),
    image,
    category,
    price: finalPrice,
    originalPrice: originalPrice || finalPrice,
    finalPrice,
    discountPercent,
    stock,
    source,
  };
}

function formatPrice(value: number): string {
  return `৳${value.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

export default function ProductDetailsClient() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");

  const lookupId = id.startsWith("local-")
    ? id.slice("local-".length)
    : id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [deliveryChargePaidByCustomer, setDeliveryChargePaidByCustomer] =
    useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [orderSucceeded, setOrderSucceeded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setImageFailed(false);

      try {
        let foundProduct: Product | null = null;

        // First, preserve existing local product lookup.
        const localResponse = await fetch(
          "/api/storefront/local-products",
          { cache: "no-store" }
        );

        if (localResponse.ok) {
          const localData: unknown = await localResponse.json();
          const localProducts = extractProducts(localData);

          const matchedLocal = localProducts.find(
            (item) => getText(item.id ?? item.product_id) === lookupId
          );

          if (matchedLocal) {
            foundProduct = normalizeProduct(matchedLocal, "local");
          }
        }

        // If it is not a local product, search supplier products.
        if (!foundProduct) {
          const supplierResponse = await fetch("/api/products", {
            cache: "no-store",
          });

          if (!supplierResponse.ok) {
            throw new Error(
              "Supplier products could not be loaded. Please try again."
            );
          }

          const supplierData: unknown = await supplierResponse.json();
          const supplierProducts = extractProducts(supplierData);

          const matchedSupplier = supplierProducts.find(
            (item) =>
              getText(
                item.id ?? item.product_id ?? item.productId
              ) === id
          );

          if (matchedSupplier) {
            foundProduct = normalizeProduct(
              matchedSupplier,
              "supplier"
            );
          }
        }

        if (!active) return;

        if (!foundProduct || !foundProduct.name) {
          setError(
            "This product could not be found. Please return home and select it again."
          );
          return;
        }

        setProduct(foundProduct);
      } catch (err) {
        console.error("Product details loading error:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load product details. Please refresh."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    } else {
      setLoading(false);
      setError("Product ID is missing.");
    }

    return () => {
      active = false;
    };
  }, [id, lookupId]);

  const title = product?.title ?? "Product";
  const price = product?.price ?? 0;
  const originalPrice = product?.originalPrice ?? price;
  const discountPercent = product?.discountPercent ?? 0;

  const maxQuantity = Math.max(
    1,
    Math.min(99, product?.stock || 99)
  );

  const total = Math.round(price * quantity * 100) / 100;

  async function handleOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product) return;

    if (!Number.isFinite(price) || price <= 0) {
      setMessage(
        "The product price is missing or invalid. Please contact the store."
      );
      setOrderSucceeded(false);
      return;
    }

    setSubmitting(true);
    setMessage("");
    setOrderSucceeded(false);

    try {
      const quantityNote =
        `Quantity: ${quantity}; Unit price: ${formatPrice(price)}; ` +
        `Order total: ${formatPrice(total)}; Source: ${product.source}`;

      const fullNote = [quantityNote, customerNote.trim()]
        .filter(Boolean)
        .join("\n");

      const storedProductId =
        product.source === "supplier"
          ? `supplier-${product.id}`
          : String(product.id);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: storedProductId,
          productName: title,
          customerName: customerName.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim(),
          customerDivision: division.trim(),
          customerDistrict: district.trim(),
          customerArea: area.trim(),
          sellingPrice: total,
          deliveryChargePaidByCustomer,
          customerNote: fullNote,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ??
            data?.error ??
            "Your order could not be submitted."
        );
      }

      setOrderSucceeded(true);

      setMessage(
        product.source === "supplier"
          ? `Order saved in MR Store. Order ID: ${
              data?.order?.id ?? "Confirmed"
            }. Supplier fulfillment still needs to be arranged.`
          : `Order received successfully! Order ID: ${
              data?.order?.id ?? "Confirmed"
            }`
      );

      setCustomerName("");
      setPhone("");
      setAddress("");
      setDivision("");
      setDistrict("");
      setArea("");
      setCustomerNote("");
      setQuantity(1);
      setDeliveryChargePaidByCustomer(true);
    } catch (err) {
      setOrderSucceeded(false);
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#17132d] to-[#291647] px-4">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-violet-400" />
          <p className="font-semibold">Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#17132d] to-[#291647] px-4 py-10">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 text-center shadow-2xl">
          <div className="mb-4 text-5xl">!</div>
          <h1 className="text-2xl font-black text-slate-900">
            Product unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error || "We could not find this product."}
          </p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-full bg-violet-700 px-6 py-3 font-bold text-white transition hover:bg-violet-800"
          >
            Back to Home
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-[#17132d] to-[#291647] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none fixed -left-40 top-32 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 top-20 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-white/60">
          <a href="/" className="transition hover:text-white">
            Home
          </a>
          <span>/</span>
          <span className="text-violet-200">Product Details</span>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="overflow-hidden rounded-3xl border border-white/15 bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-violet-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-violet-700">
                Product Preview
              </span>

              {discountPercent > 0 && (
                <span className="rounded-full bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-100 p-5 sm:min-h-[430px]">
              {product.image && !imageFailed ? (
                <img
                  src={product.image}
                  alt={title}
                  onError={() => setImageFailed(true)}
                  className="max-h-[400px] w-full object-contain transition duration-500 hover:scale-105"
                />
              ) : (
                <div className="px-4 py-10 text-center">
                  <div className="text-6xl">📦</div>
                  <p className="mt-4 font-semibold text-slate-500">
                    Product image unavailable
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-800">
                MR Store quality shopping
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Review the product and delivery details before placing your order.
              </p>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/15 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  Available product
                </span>

                {product.category && (
                  <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                    {product.category}
                  </span>
                )}
              </div>

              <h1 className="mt-5 break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                {product.description ||
                  "Explore this product and review the information below."}
              </p>

              <div className="my-7 h-px bg-gradient-to-r from-violet-200 via-slate-200 to-transparent" />

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Our Price
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-black tracking-tight text-violet-700 sm:text-5xl">
                  {price > 0 ? formatPrice(price) : "Price unavailable"}
                </span>

                {originalPrice > price && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Price per item
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Stock
                  </p>
                  <p className="mt-2 font-bold text-slate-800">
                    {product.stock > 0
                      ? `${product.stock} available`
                      : "Check availability"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Product type
                  </p>
                  <p className="mt-2 font-bold text-slate-800">
                    {product.source === "local" ? "MR Store" : "Supplier"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                  Checkout
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Place Your Order
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your name, phone number and complete delivery address.
                </p>
              </div>

              {product.source === "supplier" && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Supplier product: submitting this form saves an order in MR Store. It does not automatically send the order to the supplier.
                </div>
              )}

              <form onSubmit={handleOrder} className="space-y-5">
                <div>
                  <label
                    htmlFor="customerName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="customerName"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    minLength={8}
                    maxLength={20}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Delivery Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="House number, road and delivery address"
                    autoComplete="street-address"
                    rows={3}
                    required
                    maxLength={500}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="division"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Division
                    </label>
                    <input
                      id="division"
                      value={division}
                      onChange={(event) => setDivision(event.target.value)}
                      placeholder="e.g. Chattogram"
                      required
                      maxLength={100}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="district"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      District
                    </label>
                    <input
                      id="district"
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      placeholder="Your district"
                      required
                      maxLength={100}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="area"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Area / Upazila
                  </label>
                  <input
                    id="area"
                    value={area}
                    onChange={(event) => setArea(event.target.value)}
                    placeholder="Your area or upazila"
                    required
                    maxLength={150}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerNote"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Additional Note (Optional)
                  </label>
                  <textarea
                    id="customerNote"
                    value={customerNote}
                    onChange={(event) => setCustomerNote(event.target.value)}
                    placeholder="Any additional delivery instructions"
                    rows={2}
                    maxLength={500}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    Select Quantity
                  </label>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-sm font-medium text-slate-600">
                      Number of items
                    </span>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((current) => Math.max(1, current - 1))
                        }
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-bold text-slate-700 transition hover:text-violet-700 disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="min-w-5 text-center text-lg font-black text-slate-900">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((current) =>
                            Math.min(maxQuantity, current + 1)
                          )
                        }
                        disabled={quantity >= maxQuantity}
                        aria-label="Increase quantity"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold text-white transition hover:bg-violet-700 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={deliveryChargePaidByCustomer}
                    onChange={(event) =>
                      setDeliveryChargePaidByCustomer(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-violet-600"
                  />
                  <span>Customer pays the delivery charge.</span>
                </label>

                <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 p-5">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Price per item</span>
                    <span>{price > 0 ? formatPrice(price) : "Unavailable"}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Quantity</span>
                    <span>{quantity}</span>
                  </div>

                  <div className="my-4 h-px bg-violet-200" />

                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-800">
                      Total Amount
                    </span>
                    <span className="text-2xl font-black text-violet-700">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Delivery charge is not included in this product total.
                  </p>
                </div>

                {message && (
                  <div
                    role="status"
                    className={`break-words rounded-xl p-4 text-sm font-medium ${
                      orderSucceeded
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || price <= 0}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 px-6 py-4 font-bold text-white shadow-xl shadow-violet-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting Order..." : "Confirm Order"}
                  {!submitting && <span aria-hidden="true">→</span>}
                </button>

                <p className="text-center text-xs leading-5 text-slate-400">
                  Check your contact and delivery details before submitting.
                </p>
              </form>
            </section>
          </div>
        </div>

        <footer className="mt-10 pb-3 text-center text-sm text-white/50">
          MR Store · A better shopping experience
        </footer>
      </div>
    </main>
  );
}
