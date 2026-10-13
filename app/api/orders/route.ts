
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requiredFields = [
      "productId",
      "productName",
      "customerName",
      "customerPhone",
      "customerAddress",
      "customerDivision",
      "customerDistrict",
      "customerArea",
      "sellingPrice",
    ];

    for (const field of requiredFields) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        String(body[field]).trim() === ""
      ) {
        return NextResponse.json(
          { success: false, message: `${field} is required.` },
          { status: 400 }
        );
      }
    }

    const price = Number(body.sellingPrice);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid selling price." },
        { status: 400 }
      );
    }

    const customerPhone = String(body.customerPhone).trim();

    if (!/^[0-9+\-\s()]{8,20}$/.test(customerPhone)) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        product_id: String(body.productId).trim(),
        product_name: String(body.productName).trim(),
        customer_name: String(body.customerName).trim(),
        customer_phone: customerPhone,
        customer_address: String(body.customerAddress).trim(),
        customer_division: String(body.customerDivision).trim(),
        customer_district: String(body.customerDistrict).trim(),
        customer_area: String(body.customerArea).trim(),
        selling_price: price,
        delivery_charge_paid_by_customer:
          body.deliveryChargePaidByCustomer !== false,
        customer_note: body.customerNote
          ? String(body.customerNote).trim()
          : null,
        order_status: "pending",
      })
      .select("id, order_status, created_at")
      .single();

    if (error) {
      console.error("Order insert failed:", error.message);

      return NextResponse.json(
        { success: false, message: "Could not save the order." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order received successfully.",
        order: data,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request." },
      { status: 400 }
    );
  }
}
