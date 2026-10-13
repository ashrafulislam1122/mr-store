
import Link from "next/link";
import "./help-center.css";

const topics = [
  {
    number: "01",
    title: "Orders & Tracking",
    description:
      "Learn how to place an order and get help with your order status.",
  },
  {
    number: "02",
    title: "Payments",
    description:
      "Find information about available payment methods and payment questions.",
  },
  {
    number: "03",
    title: "Returns & Refunds",
    description:
      "Get guidance on return requests, eligible items, and refund questions.",
  },
  {
    number: "04",
    title: "Products",
    description:
      "Need more information about a product? Contact our support team.",
  },
];

export default function HelpCenterPage() {
  return (
    <main className="help-page">
      <nav className="help-nav">
        <Link href="/" className="help-brand">
          MR<span>.</span> STORE
        </Link>
        <Link href="/" className="help-back">
          ← Back to Store
        </Link>
      </nav>

      <section className="help-hero">
        <p className="help-eyebrow">CUSTOMER CARE · MR STORE</p>
        <h1>
          How can we
          <br />
          <span>help you?</span>
        </h1>
        <p>
          Find answers to common shopping questions or reach out
          to our team for assistance.
        </p>
        <a href="#help-topics" className="help-button">
          Explore Help Topics <span>↓</span>
        </a>
      </section>

      <section id="help-topics" className="help-topics">
        <div className="help-section-heading">
          <div>
            <p className="help-eyebrow">HERE TO HELP</p>
            <h2>Browse help topics</h2>
          </div>
          <span className="help-count">04 TOPICS</span>
        </div>

        <div className="help-grid">
          {topics.map((topic) => (
            <article className="help-card" key={topic.number}>
              <span className="help-number">{topic.number}</span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <span className="help-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="help-contact">
        <div>
          <p className="help-eyebrow">STILL NEED HELP?</p>
          <h2>We’re here for you.</h2>
          <p>
            Contact us with your question and we’ll help you find
            the right information.
          </p>
        </div>
        <Link href="/contact" className="help-button">
          Contact Us <span>↗</span>
        </Link>
      </section>

      <footer className="help-footer">
        <span>MR STORE © {new Date().getFullYear()}</span>
        <Link href="/about">About MR Store</Link>
        <Link href="/contact">Contact Support</Link>
      </footer>
    </main>
  );
}
