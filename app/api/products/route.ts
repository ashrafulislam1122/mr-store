import { NextResponse } from "next/server";
import { connection } from "next/server";

export async function GET() {
  await connection();

  const apiKey = process.env.SUPPLIER_API_KEY;
  const headerName =
    process.env.SUPPLIER_API_KEY_HEADER || "x-api-key";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Supplier API key is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.businesskoro.com/api/v1/storefront/products",
      {
        method: "GET",
        headers: {
          [headerName]: apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Supplier API error:", response.status);

      return NextResponse.json(
        {
          error: "Failed to fetch products from supplier.",
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result, {
      status: 200,
    });
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      { error: "Unable to connect to the supplier API." },
      { status: 502 }
    );
  }
}
