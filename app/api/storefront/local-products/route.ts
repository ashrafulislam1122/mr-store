import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, description, image_url, category, selling_price, stock_quantity, discount_percent, is_active"
      )
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Local storefront products error:", error.message);

      return NextResponse.json(
        { success: false, message: "Failed to load local products." },
        { status: 500 }
      );
    }

    const products = (data ?? []).map((product) => {
      const originalPrice = Number(product.selling_price);
      const discountPercent = Number(product.discount_percent ?? 0);
      const finalPrice = Math.round(
        originalPrice * (1 - discountPercent / 100) * 100
      ) / 100;

      return {
        ...product,
        id: String(product.id),
        originalPrice,
        discountPercent,
        finalPrice,
        source: "local",
      };
    });

    return NextResponse.json(
      { success: true, products },
      { status: 200 }
    );
  } catch (error) {
    console.error("Local products API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load local products." },
      { status: 500 }
    );
  }
}