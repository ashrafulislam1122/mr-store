
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const allowedSellerEmails = (process.env.SELLER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function isAuthorizedSeller() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return false;
  }

  return allowedSellerEmails.includes(user.email.toLowerCase());
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

// GET: Load all products
export async function GET() {
  try {
    if (!(await isAuthorizedSeller())) {
      return errorResponse("Please log in with an authorized seller account.", 401);
    }

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, description, image_url, category, selling_price, stock_quantity, discount_percent, is_active"
      );

    if (error) {
      console.error("Load products error:", error.message);
      return errorResponse(error.message);
    }

    return NextResponse.json({
      success: true,
      products: products ?? [],
    });
  } catch (error) {
    console.error("GET products error:", error);
    return errorResponse("Failed to load products.");
  }
}

// POST: Create a product
export async function POST(request: Request) {
  try {
    if (!(await isAuthorizedSeller())) {
      return errorResponse("Please log in with an authorized seller account.", 401);
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const sellingPrice = Number(body.selling_price);
    const stockQuantity = Number(body.stock_quantity);
    const discountPercent = Number(body.discount_percent ?? 0);

    if (!name) {
      return errorResponse("Product name is required.", 400);
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return errorResponse("Enter a valid selling price.", 400);
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      return errorResponse("Stock quantity must be a non-negative whole number.", 400);
    }

    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      return errorResponse("Discount must be between 0 and 100.", 400);
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        description: String(body.description ?? ""),
        image_url: String(body.image_url ?? ""),
        category: String(body.category ?? ""),
        selling_price: sellingPrice,
        stock_quantity: stockQuantity,
        discount_percent: discountPercent,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Create product error:", error.message);
      return errorResponse(error.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST products error:", error);
    return errorResponse("Failed to create product. Check the submitted data.", 400);
  }
}

// PATCH: Update a product or its active status
export async function PATCH(request: Request) {
  try {
    if (!(await isAuthorizedSeller())) {
      return errorResponse("Please log in with an authorized seller account.", 401);
    }

    const body = await request.json();
    const id = body.id;

    if (id === undefined || id === null || String(id).trim() === "") {
      return errorResponse("Product ID is required.", 400);
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        return errorResponse("Product name is required.", 400);
      }

      updates.name = name;
    }

    if (body.description !== undefined) {
      updates.description = String(body.description ?? "");
    }

    if (body.image_url !== undefined) {
      updates.image_url = String(body.image_url ?? "");
    }

    if (body.category !== undefined) {
      updates.category = String(body.category ?? "");
    }

    if (body.selling_price !== undefined) {
      const price = Number(body.selling_price);

      if (!Number.isFinite(price) || price < 0) {
        return errorResponse("Enter a valid selling price.", 400);
      }

      updates.selling_price = price;
    }

    if (body.stock_quantity !== undefined) {
      const stock = Number(body.stock_quantity);

      if (!Number.isInteger(stock) || stock < 0) {
        return errorResponse("Stock must be a non-negative whole number.", 400);
      }

      updates.stock_quantity = stock;
    }

    if (body.discount_percent !== undefined) {
      const discount = Number(body.discount_percent);

      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        return errorResponse("Discount must be between 0 and 100.", 400);
      }

      updates.discount_percent = discount;
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return errorResponse("Invalid product status.", 400);
      }

      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No product changes were provided.", 400);
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Update product error:", error.message);
      return errorResponse(error.message);
    }

    if (!product) {
      return errorResponse("Product not found.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("PATCH products error:", error);
    return errorResponse("Failed to update product.", 400);
  }
}

// DELETE: Remove a product
export async function DELETE(request: Request) {
  try {
    if (!(await isAuthorizedSeller())) {
      return errorResponse("Please log in with an authorized seller account.", 401);
    }

    const body = await request.json();
    const id = body.id;

    if (id === undefined || id === null || String(id).trim() === "") {
      return errorResponse("Product ID is required.", 400);
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Delete product error:", error.message);
      return errorResponse(error.message);
    }

    if (!product) {
      return errorResponse("Product not found.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE products error:", error);
    return errorResponse("Failed to delete product.", 400);
  }
}
