
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const sections = [
  {
    title: "Manage Products",
    description: "Add products, edit names, descriptions and selling prices.",
    href: "/seller/products",
    icon: "📦",
  },
  {
    title: "Discounts & Pricing",
    description: "Manage product discounts and promotional pricing.",
    href: "/seller/products",
    icon: "🏷️",
  },
  {
    title: "Orders",
    description: "Review customer orders and update their status.",
    href: "/seller/dashboard",
    icon: "🛒",
  },
  {
    title: "View Storefront",
    description: "Visit the customer-facing MR Store website.",
    href: "/",
    icon: "🌐",
  },
];

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/seller/login");
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(user.email.toLowerCase())) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#10110d] px-4 py-8 text-[#f4f0e6] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime-300">
              MR Store
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Manage your store from one place.
            </p>
            <p className="mt-3 text-sm text-lime-300">
              Signed in as {user.email}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            View Store →
          </Link>
        </header>

        <section className="mt-8 rounded-3xl border border-lime-300/15 bg-gradient-to-br from-lime-300/10 to-transparent p-6 sm:p-9">
          <p className="text-sm font-medium text-lime-300">
            STORE MANAGEMENT
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
            Everything you need to manage MR Store.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
            Manage products, pricing, discounts and customer orders
            from one place.
          </p>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold">Management Sections</h2>
          <p className="mt-2 text-sm text-white/50">
            Choose what you want to manage.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section) => (
              <Link
                key={section.title}
                href={section.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-200 hover:-translate-y-1 hover:border-lime-300/40 hover:bg-white/[0.06]"
              >
                <span className="text-3xl" aria-hidden="true">
                  {section.icon}
                </span>
                <h3 className="mt-5 font-bold transition group-hover:text-lime-300">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {section.description}
                </p>
                <span className="mt-5 inline-block text-sm font-semibold text-lime-300">
                  Open section →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs text-white/40">
          MR Store Admin · Store management
        </footer>
      </div>
    </main>
  );
}
