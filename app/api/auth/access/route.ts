
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return NextResponse.json(
        { message: "Please sign in first." },
        { status: 401 }
      );
    }

    const email = user.email.trim().toLowerCase();

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const sellerEmails = (process.env.SELLER_EMAILS ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = adminEmails.includes(email);
    const isSeller = sellerEmails.includes(email);

    if (!isAdmin && !isSeller) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { isAdmin, isSeller },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to verify access." },
      { status: 500 }
    );
  }
}
