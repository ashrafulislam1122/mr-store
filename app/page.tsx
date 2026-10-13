
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApiProduct = {
  id: string | number;
  name: string;
  description?: string | null;
  images?: string[];
  suggestedPrice: number;
  inStock: boolean;
  variants?: {
    color?: string | null;
    size?: string | null;
    inStock?: boolean;
  }[];
};

type Product = ApiProduct & {
  displayCategory: string;
  tag: string;
  image: string;
  originalPrice?: number;
  discountPercent?: number;
  source?: "supplier" | "local";
};

type LocalApiProduct = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  category?: string | null;
  selling_price: number;
  stock_quantity: number;
  discount_percent?: number;
  is_active: boolean;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  source: "local";
};

const categories = ["All Products", "In Stock", "Out of Stock"];

function getDisplayCategory(product: ApiProduct) {
  return product.inStock ? "In Stock" : "Out of Stock";
}

function getProductTag(product: ApiProduct) {
  if (!product.inStock) return "SOLD OUT";
  if (product.variants?.length) return "AVAILABLE";
  return "CURATED PICK";
}

function Logo() {
  return (
    <Link href="#home" className="logo" aria-label="MR Store home">
      <span className="logo-symbol">
        M<span>R</span>
      </span>
      <span className="logo-word">
        MR<span>.</span>STORE
        <small>EVERYDAY, ELEVATED</small>
      </span>
    </Link>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All Products");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<(string | number)[]>([]);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const [supplierResult, localResult] = await Promise.allSettled([
          fetch("/api/products", {
            signal: controller.signal,
            cache: "no-store",
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error("Supplier products failed");
            }
            return response.json();
          }),

          fetch("/api/storefront/local-products", {
            signal: controller.signal,
            cache: "no-store",
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error("Local products failed");
            }
            return response.json();
          }),
        ]);

        if (
          supplierResult.status === "rejected" &&
          localResult.status === "rejected"
        ) {
          throw new Error("Both product sources failed");
        }

        let supplierProducts: ApiProduct[] = [];
        let localProducts: LocalApiProduct[] = [];

        if (supplierResult.status === "fulfilled") {
          const result = supplierResult.value;
          const data = Array.isArray(result)
            ? result
            : result.data ?? result.products ?? [];

          if (Array.isArray(data)) {
            supplierProducts = data;
          }
        }

        if (localResult.status === "fulfilled") {
          const result = localResult.value;

          if (result.success && Array.isArray(result.products)) {
            localProducts = result.products;
          }
        }

        const mappedSupplier: Product[] = supplierProducts.map(
          (product) => ({
            ...product,
            image: product.images?.[0] || "",
            displayCategory: getDisplayCategory(product),
            tag: getProductTag(product),
            originalPrice: Number(product.suggestedPrice),
            discountPercent: 0,
            source: "supplier",
          })
        );

        const mappedLocal: Product[] = localProducts.map((product) => ({
          id: `local-${product.id}`,
          name: product.name,
          description: product.description || "",
          images: product.image_url ? [product.image_url] : [],
          suggestedPrice: Number(product.finalPrice),
          inStock: product.is_active && product.stock_quantity > 0,
          variants: [],
          image: product.image_url || "",
          displayCategory:
            product.is_active && product.stock_quantity > 0
              ? "In Stock"
              : "Out of Stock",
          tag:
            product.discountPercent > 0
              ? `${product.discountPercent}% OFF`
              : "MR STORE PICK",
          originalPrice: Number(product.originalPrice),
          discountPercent: Number(product.discountPercent),
          source: "local",
        }));

        setProducts([...mappedLocal, ...mappedSupplier]);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Product loading error:", err);
          setError(
            "We couldn't load the products. Please check your product APIs."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach((item) => {
      if (!item.classList.contains("visible")) {
        observer.observe(item);
      }
    });

    return () => observer.disconnect();
  }, [products, loading, category, search]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function addToCart(product: Product) {
    if (!product.inStock) {
      setNotice("Sorry, this product is currently out of stock.");
      return;
    }

    try {
      const existing = localStorage.getItem("mr-store-bag");
      const bag: { id: string | number; quantity: number }[] = existing
        ? JSON.parse(existing)
        : [];

      const found = bag.find(
        (item) => String(item.id) === String(product.id)
      );

      if (found) {
        found.quantity += 1;
      } else {
        bag.push({ id: product.id, quantity: 1 });
      }

      localStorage.setItem("mr-store-bag", JSON.stringify(bag));

      setCart((current) => [...current, product.id]);
      setNotice(`${product.name} added to your bag`);
    } catch {
      setNotice("Could not update your bag. Please try again.");
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === "All Products" ||
      product.displayCategory === category;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      (product.description || "").toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="mr-store">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');

        :root {
          --black: #10120f;
          --panel: #171a15;
          --olive: #b1c69b;
          --paper: #f3f1e9;
          --muted: #a0a397;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; scroll-padding-top: 95px; }
        body {
          margin: 0;
          background: var(--black);
          color: var(--paper);
          font-family: 'DM Sans', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        button { cursor: pointer; }
        ::selection { background: var(--olive); color: var(--black); }
        .mr-store { overflow: clip; background: var(--black); }

        .announcement {
          padding: 10px 16px;
          background: var(--olive);
          color: #151910;
          text-align: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .announcement span { padding: 0 8px; }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(16,18,15,.9);
          border-bottom: 1px solid #ffffff12;
          backdrop-filter: blur(20px);
        }
        .header-inner {
          width: min(1280px,100%);
          min-height: 79px;
          margin: auto;
          padding: 14px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .logo { display: inline-flex; align-items: center; gap: 11px; }
        .logo-symbol {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid #b1c69b70;
          color: var(--olive);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          letter-spacing: -3px;
          transition: transform .4s, background .4s;
        }
        .logo:hover .logo-symbol {
          transform: rotate(-8deg);
          background: #b1c69b13;
        }
        .logo-symbol span { color: white; }
        .logo-word { font-size: 17px; font-weight: 700; letter-spacing: -.8px; }
        .logo-word > span { color: var(--olive); }
        .logo-word small {
          display: block;
          margin-top: 5px;
          color: #92978b;
          font-size: 7px;
          font-weight: 500;
          letter-spacing: 2px;
        }

        .nav {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }
        .nav a {
          position: relative;
          padding: 10px 0;
          color: #c2c4bb;
          font-size: 10px;
          white-space: nowrap;
          transition: color .25s;
        }
        .nav a::after {
          content: "";
          position: absolute;
          bottom: 2px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--olive);
          transition: width .3s;
        }
        .nav a:hover { color: white; }
        .nav a:hover::after { width: 100%; }

        .header-actions { display: flex; align-items: center; gap: 10px; }
        .bag {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #ffffff2a;
          border-radius: 50px;
          padding: 10px 15px;
          background: transparent;
          color: white;
          font-size: 11px;
          transition: border-color .3s, background .3s;
        }
        .bag:hover { border-color: var(--olive); background: #b1c69b12; }
        .bag-count {
          min-width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          padding: 0 5px;
          border-radius: 50px;
          background: var(--olive);
          color: #171a15;
          font-size: 10px;
          font-weight: 700;
        }
        .menu-button {
          display: none;
          width: 39px;
          height: 39px;
          border: 1px solid #ffffff30;
          border-radius: 50%;
          background: transparent;
          color: white;
          font-size: 18px;
        }
        .mobile-nav {
          display: none;
          padding: 8px 22px 18px;
          background: #141711;
        }
        .mobile-nav a {
          display: block;
          padding: 13px 0;
          border-bottom: 1px solid #ffffff12;
          font-size: 13px;
        }

        .hero {
          position: relative;
          width: min(1280px, 100%);
          min-height: 590px;
          margin: auto;
          padding: 100px 7% 90px;
          display: flex;
          align-items: center;
          background:
            radial-gradient(ellipse at 80% 45%, #78885b22, transparent 42%),
            linear-gradient(110deg, #10120f 30%, #1b2017 100%);
        }
        .hero::after {
          content: "MR";
          position: absolute;
          right: 6%;
          top: 50%;
          transform: translateY(-50%);
          color: #ffffff05;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(180px, 32vw, 420px);
          pointer-events: none;
        }
        .hero-content { position: relative; z-index: 1; max-width: 650px; }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--olive);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .eyebrow::before {
          content: "";
          width: 30px;
          height: 1px;
          background: var(--olive);
        }
        .hero h1 {
          margin: 25px 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(48px, 7.2vw, 94px);
          font-weight: 400;
          line-height: 1.04;
          letter-spacing: -3px;
        }
        .hero h1 em { color: var(--olive); font-weight: 400; }
        .hero-description {
          max-width: 430px;
          color: #a7aa9f;
          font-size: 13px;
          line-height: 2;
        }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 13px; margin-top: 32px; }
        .button-primary, .button-secondary {
          min-height: 48px;
          padding: 0 23px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 700;
          transition: transform .25s, background .25s, border-color .25s;
        }
        .button-primary {
          background: var(--olive);
          color: #171a15;
          border: 1px solid var(--olive);
        }
        .button-primary:hover { transform: translateY(-3px); background: #c5d6b4; }
        .button-secondary { background: transparent; color: white; border: 1px solid #ffffff35; }
        .button-secondary:hover { transform: translateY(-3px); border-color: var(--olive); }
        .hero-foot {
          position: absolute;
          bottom: 28px;
          left: 7%;
          right: 7%;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: #888d80;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .trust-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #ffffff12;
          border-bottom: 1px solid #ffffff12;
        }
        .trust-item {
          padding: 25px 15px;
          text-align: center;
          border-right: 1px solid #ffffff12;
        }
        .trust-item:last-child { border-right: 0; }
        .trust-item strong { display: block; font-size: 11px; font-weight: 600; }
        .trust-item span { display: block; margin-top: 7px; color: #969b8e; font-size: 10px; }

        .section {
          width: min(1280px, 100%);
          margin: auto;
          padding: 100px 30px;
        }
        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 36px;
        }
        .section-kicker {
          color: var(--olive);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }
        .section-heading h2 {
          margin: 13px 0 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(35px, 5vw, 56px);
          font-weight: 400;
          letter-spacing: -1.5px;
        }
        .section-heading h2 em { color: var(--olive); }
        .section-description { max-width: 370px; color: #9da194; font-size: 12px; line-height: 1.9; }

        .catalog-tools {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }
        .category-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .category-button {
          padding: 10px 15px;
          border: 1px solid #ffffff1c;
          border-radius: 40px;
          background: transparent;
          color: #a7aa9f;
          font-size: 10px;
          transition: all .25s;
        }
        .category-button:hover, .category-button.active {
          border-color: var(--olive);
          background: var(--olive);
          color: #171a15;
        }
        .search-box {
          width: min(100%, 280px);
          padding: 12px 15px;
          border: 1px solid #ffffff24;
          border-radius: 4px;
          outline: none;
          background: #171a15;
          color: white;
          font-size: 11px;
        }
        .search-box:focus { border-color: var(--olive); }
        .product-count { margin-bottom: 18px; color: #92978b; font-size: 10px; }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }
        .product-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #ffffff12;
          background: #151812;
          transition: transform .35s, border-color .35s;
        }
        .product-card:hover { transform: translateY(-5px); border-color: #b1c69b70; }
        .product-image {
          position: relative;
          aspect-ratio: 4 / 4.5;
          overflow: hidden;
          background: #20241c;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform .6s;
        }
        .product-card:hover .product-image img { transform: scale(1.05); }
        .product-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #747c68;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 40px;
        }
        .product-tag {
          position: absolute;
          top: 13px;
          left: 13px;
          padding: 7px 9px;
          background: var(--olive);
          color: #171a15;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .product-info { padding: 17px; }
        .product-category { color: var(--olive); font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; }
        .product-name {
          min-height: 42px;
          margin: 10px 0;
          color: #f0efe7;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 400;
          line-height: 1.4;
        }
        .product-description {
          display: -webkit-box;
          overflow: hidden;
          min-height: 35px;
          color: #92978b;
          font-size: 10px;
          line-height: 1.7;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .product-price-row {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        .product-price { color: var(--olive); font-size: 17px; font-weight: 700; }
        .product-old-price { color: #7e8377; font-size: 11px; text-decoration: line-through; }
        .product-discount { color: #e6b58a; font-size: 9px; font-weight: 700; }
        .product-actions { display: flex; gap: 8px; }
        .add-button, .details-button {
          min-height: 39px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 10px;
          font-size: 10px;
          font-weight: 600;
        }
        .add-button { flex: 1; border: 1px solid var(--olive); background: var(--olive); color: #171a15; }
        .add-button:hover { background: #c5d6b4; }
        .add-button:disabled { opacity: .45; cursor: not-allowed; }
        .details-button { border: 1px solid #ffffff30; background: transparent; color: white; }
        .details-button:hover { border-color: var(--olive); }

        .status-message {
          padding: 65px 20px;
          text-align: center;
          color: #a4a99a;
          font-size: 13px;
          line-height: 1.8;
        }
        .status-message strong { display: block; margin-bottom: 12px; color: white; font-size: 20px; }
        .retry-button {
          margin-top: 15px;
          padding: 10px 18px;
          border: 1px solid var(--olive);
          background: transparent;
          color: var(--olive);
        }

        .philosophy {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 70px;
          align-items: center;
          border-top: 1px solid #ffffff12;
        }
        .philosophy-mark {
          min-height: 340px;
          display: grid;
          place-items: center;
          border: 1px solid #b1c69b35;
          background:
            radial-gradient(circle at center, #b1c69b18, transparent 55%),
            #171a15;
        }
        .philosophy-mark span {
          color: var(--olive);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(90px, 14vw, 170px);
          letter-spacing: -12px;
        }
        .philosophy-copy h2 {
          margin: 18px 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(34px, 4vw, 50px);
          font-weight: 400;
          line-height: 1.15;
        }
        .philosophy-copy h2 em { color: var(--olive); }
        .philosophy-copy p { color: #9da194; font-size: 12px; line-height: 2.1; }

        .footer {
          padding: 50px 30px 25px;
          border-top: 1px solid #ffffff18;
          background: #0c0e0b;
        }
        .footer-inner {
          width: min(1220px, 100%);
          margin: auto;
          display: flex;
          align-items: start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 35px;
        }
        .footer-description { max-width: 300px; margin-top: 15px; color: #92978b; font-size: 11px; line-height: 1.9; }
        .footer-links { display: flex; flex-wrap: wrap; gap: 22px; }
        .footer-links a { color: #a9ada1; font-size: 11px; }
        .footer-links a:hover { color: var(--olive); }
        .footer-bottom {
          width: min(1220px, 100%);
          margin: 38px auto 0;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border-top: 1px solid #ffffff12;
          color: #777d70;
          font-size: 9px;
        }

        .toast {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 100;
          max-width: min(360px, calc(100vw - 44px));
          padding: 15px 20px;
          border: 1px solid #b1c69b70;
          background: #20251b;
          color: white;
          font-size: 12px;
          box-shadow: 0 10px 40px #0006;
          animation: toast-in .3s ease both;
        }
        .reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s, transform .6s; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1100px) {
          .header-inner { gap: 15px; padding-right: 20px; padding-left: 20px; }
          .nav { gap: 10px; }
          .nav a { font-size: 9px; }
          .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .philosophy { gap: 35px; }
        }

        @media (max-width: 760px) {
          .header-inner { min-height: 70px; padding: 12px 18px; }
          .nav { display: none; }
          .menu-button { display: grid; place-items: center; }
          .mobile-nav { display: block; }
          .hero { min-height: 530px; padding: 80px 24px 100px; }
          .hero h1 { letter-spacing: -2px; }
          .hero-foot { left: 24px; right: 24px; font-size: 8px; }
          .section { padding: 75px 20px; }
          .section-heading { align-items: start; flex-direction: column; }
          .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .product-info { padding: 12px; }
          .product-name { font-size: 16px; }
          .product-price { font-size: 15px; }
          .product-actions { flex-direction: column; }
          .philosophy { grid-template-columns: 1fr; gap: 30px; }
          .philosophy-mark { min-height: 240px; }
          .catalog-tools { align-items: stretch; flex-direction: column; }
          .search-box { width: 100%; }
        }

        @media (max-width: 420px) {
          .announcement { font-size: 8px; letter-spacing: 1px; }
          .logo-symbol { width: 36px; height: 36px; }
          .logo-word { font-size: 15px; }
          .hero { min-height: 490px; }
          .hero h1 { font-size: 47px; }
          .trust-item { padding: 20px 7px; }
          .trust-item strong { font-size: 9px; }
          .trust-item span { font-size: 8px; }
          .product-tag { top: 8px; left: 8px; font-size: 7px; }
          .product-name { font-size: 14px; }
          .product-description { font-size: 9px; }
          .footer { padding-right: 20px; padding-left: 20px; }
        }
      `}</style>

      <div className="announcement">
        THOUGHTFULLY SELECTED <span>✦</span> MADE FOR EVERYDAY LIVING
      </div>

      <header className="header">
        <div className="header-inner">
          <Logo />

          <nav className="nav" aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#products">Collection</a>
            <a href="#about">About</a>
            <Link href="/contact">Contact</Link>
            <Link href="/help-center">Help Center</Link>
            <Link href="/policy">Privacy Policy</Link>
            <Link href="/seller/login">Login</Link>
          </nav>

          <div className="header-actions">
            <button
              className="bag"
              onClick={() => {
                window.location.href = "/cart";
              }}
              aria-label={`Shopping bag with ${cart.length} items`}
            >
              Bag <span className="bag-count">{cart.length}</span>
            </button>

            <button
              className="menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a href="#home" onClick={() => setMenuOpen(false)}>
              Home
            </a>
            <a href="#products" onClick={() => setMenuOpen(false)}>
              Collection
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
            <Link href="/help-center" onClick={() => setMenuOpen(false)}>
              Help Center
            </Link>
            <Link href="/policy" onClick={() => setMenuOpen(false)}>
              Privacy Policy
            </Link>
            <Link href="/seller/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </nav>
        )}
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow">THE MR STORE EDIT</div>
          <h1>
            Less, but
            <br />
            <em>better.</em>
            <br />
            Every day.
          </h1>
          <p className="hero-description">
            Thoughtfully selected essentials for everyday living.
            Discover considered pieces, timeless details, and quality
            that speaks for itself.
          </p>
          <div className="hero-actions">
            <a href="#products" className="button-primary">
              Explore the collection <span>↗</span>
            </a>
            <a href="#about" className="button-secondary">
              Our philosophy
            </a>
          </div>
        </div>

        <div className="hero-foot">
          <span>CURATED WITH INTENTION</span>
          <span>EST. MR STORE</span>
        </div>
      </section>

      <section className="trust-strip" aria-label="Store benefits">
        <div className="trust-item">
          <strong>Thoughtfully Selected</strong>
          <span>Quality over quantity</span>
        </div>
        <div className="trust-item">
          <strong>Everyday Essentials</strong>
          <span>Made for your routine</span>
        </div>
        <div className="trust-item">
          <strong>A Considered Collection</strong>
          <span>Simple, useful, timeless</span>
        </div>
      </section>

      <section className="section" id="products">
        <div className="section-heading reveal">
          <div>
            <div className="section-kicker">THE COLLECTION</div>
            <h2>
              Find your <em>favourites.</em>
            </h2>
          </div>
          <p className="section-description">
            Explore our growing collection of carefully selected
            products, chosen to bring a little more thoughtfulness
            to your everyday.
          </p>
        </div>

        <div className="catalog-tools reveal">
          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={`category-button ${
                  category === item ? "active" : ""
                }`}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>

          <input
            className="search-box"
            type="search"
            placeholder="Search the collection..."
            aria-label="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {!loading && !error && (
          <p className="product-count">
            SHOWING {filteredProducts.length} PRODUCTS
          </p>
        )}

        {loading ? (
          <div className="status-message">
            <strong>Curating your collection...</strong>
            Please wait while we load the latest products.
          </div>
        ) : error ? (
          <div className="status-message">
            <strong>Collection temporarily unavailable</strong>
            {error}
            <br />
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="status-message">
            <strong>No products found</strong>
            Try another search term or choose a different category.
            <br />
            <button
              className="retry-button"
              onClick={() => {
                setSearch("");
                setCategory("All Products");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card reveal" key={product.id}>
                <div className="product-image">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="product-placeholder">MR.</div>
                  )}

                  <span className="product-tag">{product.tag}</span>
                </div>

                <div className="product-info">
                  <div className="product-category">
                    {product.source === "local"
                      ? "MR STORE COLLECTION"
                      : product.displayCategory}
                  </div>

                  <h3 className="product-name">{product.name}</h3>

                  <p className="product-description">
                    {product.description ||
                      "A considered choice for everyday living."}
                  </p>

                  <div className="product-price-row">
                    <span className="product-price">
                      ৳{Number(product.suggestedPrice).toLocaleString("en-BD")}
                    </span>

                    {product.discountPercent &&
                    product.discountPercent > 0 ? (
                      <>
                        <span className="product-old-price">
                          ৳{Number(product.originalPrice).toLocaleString("en-BD")}
                        </span>
                        <span className="product-discount">
                          {product.discountPercent}% OFF
                        </span>
                      </>
                    ) : null}
                  </div>

                  <div className="product-actions">
                    <button
                      className="add-button"
                      disabled={!product.inStock}
                      onClick={() => addToCart(product)}
                    >
                      {product.inStock ? "Add to bag +" : "Out of stock"}
                    </button>

                    <Link
                      className="details-button"
                      href={`/products/${String(product.id)}`}
                    >
                      Details ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section philosophy" id="about">
        <div className="philosophy-mark reveal" aria-hidden="true">
          <span>MR.</span>
        </div>

        <div className="philosophy-copy reveal">
          <div className="section-kicker">OUR PHILOSOPHY</div>
          <h2>
            Everyday things,
            <br />
            <em>thoughtfully chosen.</em>
          </h2>
          <p>
            At MR Store, we believe everyday essentials should be
            useful, considered, and easy to love. Our collection
            focuses on the things that make daily life feel a little
            more intentional.
          </p>
          <p>
            No unnecessary noise. Just a growing collection of
            products selected with care.
          </p>
          <a href="#products" className="button-primary">
            Explore the collection ↗
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Logo />
            <p className="footer-description">
              Thoughtfully selected essentials for everyday living.
              Discover the MR Store collection.
            </p>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <a href="#home">Home</a>
            <a href="#products">Collection</a>
            <a href="#about">About</a>
            <Link href="/contact">Contact</Link>
            <Link href="/help-center">Help Center</Link>
            <Link href="/policy">Privacy Policy</Link>
            <Link href="/seller/login">Login</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} MR Store. All rights reserved.
          </span>
          <span>THOUGHTFULLY SELECTED · MADE FOR EVERYDAY LIVING</span>
        </div>
      </footer>

      {notice && (
        <div className="toast" role="status" aria-live="polite">
          {notice}
        </div>
      )}
    </main>
  );
}
