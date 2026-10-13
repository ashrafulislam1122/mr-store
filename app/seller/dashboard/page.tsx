
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_division: string;
  customer_district: string;
  customer_area: string;
  selling_price: number;
  customer_note: string | null;
  order_status: string;
  created_at: string;
};

const statuses = ["pending", "confirmed", "cancelled"];

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-blue-500/15 text-blue-300",
  cancelled: "bg-red-500/15 text-red-300",
  sent_to_supplier: "bg-purple-500/15 text-purple-300",
  supplier_failed: "bg-red-500/15 text-red-300",
  shipped: "bg-cyan-500/15 text-cyan-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
};

export default function SellerDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/seller/orders", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load orders.");
      }

      const fetchedOrders = result.orders as Order[];
      setOrders(fetchedOrders);

      setSelectedStatuses((previous) => {
        const next = { ...previous };

        for (const order of fetchedOrders) {
          next[order.id] = order.order_status;
        }

        return next;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId: string) {
    const status = selectedStatuses[orderId];

    if (!statuses.includes(status)) {
      setErrorMessage("Choose a valid order status.");
      return;
    }

    setUpdatingId(orderId);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/seller/orders/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not update order.");
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? { ...order, order_status: result.order.order_status }
            : order
        )
      );

      setMessage("Order status updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update order."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = orders.filter(
    (order) => order.order_status === "pending"
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.order_status === "confirmed"
  ).length;

  const cancelledCount = orders.filter(
    (order) => order.order_status === "cancelled"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
              MR Store
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Seller Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage your customer orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadOrders()}
              disabled={loading}
              className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh Orders"}
            </button>

            <Link
              href="/"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Back to Store
            </Link>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-400/15 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Pending Orders</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-400/15 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Confirmed Orders</p>
            <p className="mt-2 text-3xl font-bold text-blue-300">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/15 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Cancelled Orders</p>
            <p className="mt-2 text-3xl font-bold text-red-300">
              {cancelledCount}
            </p>
          </div>
        </section>

        {message && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            {message}
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Customer Orders</h2>
          <p className="mt-1 text-sm text-slate-400">
            Latest orders, newest first.
          </p>

          {loading && orders.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-8 text-slate-400">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
              <h3 className="text-lg font-semibold">No orders yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                New customer orders will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-lg font-bold">
                        {order.product_name}
                      </h3>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        Order ID: {order.id}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {new Date(order.created_at).toLocaleString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Dhaka",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[order.order_status] ??
                          "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {order.order_status.replaceAll("_", " ")}
                      </span>

                      <span className="text-xl font-bold text-emerald-400">
                        ৳{Number(order.selling_price).toLocaleString("en-BD")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 pt-5 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-emerald-300">
                        Customer Information
                      </h4>
                      <dl className="mt-3 space-y-3 text-sm">
                        <div>
                          <dt className="text-slate-500">Name</dt>
                          <dd className="mt-1">{order.customer_name}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Phone</dt>
                          <dd className="mt-1 break-all">
                            {order.customer_phone}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Address</dt>
                          <dd className="mt-1">
                            {[
                              order.customer_area,
                              order.customer_district,
                              order.customer_division,
                              order.customer_address,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="font-semibold text-emerald-300">
                        Order Information
                      </h4>
                      <dl className="mt-3 space-y-3 text-sm">
                        <div>
                          <dt className="text-slate-500">Product ID</dt>
                          <dd className="mt-1">{order.product_id}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Customer Note</dt>
                          <dd className="mt-1 whitespace-pre-wrap">
                            {order.customer_note || "No note"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label
                        htmlFor={`status-${order.id}`}
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Change order status
                      </label>

                      <select
                        id={`status-${order.id}`}
                        value={
                          selectedStatuses[order.id] ?? order.order_status
                        }
                        onChange={(event) =>
                          setSelectedStatuses((previous) => ({
                            ...previous,
                            [order.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                      >
                        {!statuses.includes(order.order_status) && (
                          <option value={order.order_status}>
                            {order.order_status.replaceAll("_", " ")}
                          </option>
                        )}

                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => void updateStatus(order.id)}
                      disabled={
                        updatingId === order.id ||
                        (selectedStatuses[order.id] ?? order.order_status) ===
                          order.order_status
                      }
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingId === order.id
                        ? "Updating..."
                        : "Update Status"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
