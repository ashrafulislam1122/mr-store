
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const allowedSellerEmails = (process.env.SELLER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const allowedStatuses = ["pending", "confirmed", "cancelled"];

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    if (
      allowedSellerEmails.length === 0 ||
      !allowedSellerEmails.includes(user.email.trim().toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "You are not authorized." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const status = String(body.status ?? "").trim().toLowerCase();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid order status." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId)
      .select("id, order_status")
      .maybeSingle();

    if (error) {
      console.error("Order status update failed:", error.message);

      return NextResponse.json(
        { success: false, message: "Could not update the order." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully.",
      order: data,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request." },
      { status: 400 }
    );
  }
}
