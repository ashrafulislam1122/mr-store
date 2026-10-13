
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const allowedSellerEmails = (
  process.env.SELLER_EMAILS ?? ""
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  try {
    if (allowedSellerEmails.length === 0) {
      return NextResponse.json(
        { success: false, message: "Seller access is not configured." },
        { status: 500 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const userEmail = user.email.trim().toLowerCase();

    if (!allowedSellerEmails.includes(userEmail)) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to view orders." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, product_id, product_name, customer_name, customer_phone, customer_address, customer_division, customer_district, customer_area, selling_price, customer_note, order_status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Seller orders query failed:", error.message);

      return NextResponse.json(
        { success: false, message: "Could not load orders." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: data ?? [],
    });
  } catch (error) {
    console.error("Seller orders API failed:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
