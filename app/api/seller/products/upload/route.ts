
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

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

  if (error || !user?.email) return false;

  return allowedSellerEmails.includes(user.email.toLowerCase());
}

export async function POST(request: Request) {
  try {
    // Verify that the user is an authorized seller.
    if (!(await isAuthorizedSeller())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select an image." },
        { status: 400 }
      );
    }

    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    if (!allowedTypes[file.type]) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be larger than 0 and no bigger than 5 MB.",
        },
        { status: 400 }
      );
    }

    const filePath = `${randomUUID()}.${allowedTypes[file.type]}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError.message);

      return NextResponse.json(
        {
          success: false,
          message: "Image upload failed. Check the Supabase Storage bucket.",
        },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      image_url: data.publicUrl,
      message: "Image uploaded successfully.",
    });
  } catch (error) {
    console.error("Seller image upload error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to upload image." },
      { status: 500 }
    );
  }
}
