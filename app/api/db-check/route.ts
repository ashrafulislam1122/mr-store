
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { error } = await supabaseAdmin
    .from("orders")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase DB check:", error);

    return NextResponse.json(
      {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
        errorHint: error.hint,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Supabase orders table is accessible.",
  });
}
