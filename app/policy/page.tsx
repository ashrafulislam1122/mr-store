
import Link from "next/link";
import "./policy.css";

export default function PolicyPage() {
  return (
    <main className="policy-page">
      <nav className="policy-nav">
        <Link href="/" className="policy-brand">
          MR<span>.</span> STORE
        </Link>
        <Link href="/" className="policy-back">
          ← Back to Store
        </Link>
      </nav>

      <section className="policy-hero">
        <p className="policy-eyebrow">TRANSPARENCY · MR STORE</p>
        <h1>
          Clear policies.
          <br />
          <span>Better shopping.</span>
        </h1>
        <p>
          We want you to understand how our store works, how your
          information is handled, and where to get help with an order.
        </p>
        <p className="policy-note">
          Please read these general policies carefully. Specific
          order terms and applicable law may also apply.
        </p>
      </section>

      <section className="policy-list">
        <article className="policy-card">
          <span className="policy-number">01 / PRIVACY</span>
          <h2>Privacy Policy</h2>
          <p>
            We aim to handle customer information responsibly and
            use it only for legitimate store operations.
          </p>
          <ul>
            <li>
              Information you provide may be used to process and
              manage your orders.
            </li>
            <li>
              Contact details may be used to respond to your
              questions or provide order updates.
            </li>
            <li>
              Do not share passwords or sensitive payment details
              through customer support messages.
            </li>
            <li>
              Information handling is subject to applicable law
              and the services used to operate the store.
            </li>
          </ul>
        </article>

        <article className="policy-card">
          <span className="policy-number">02 / TERMS</span>
          <h2>Terms &amp; Conditions</h2>
          <p>
            By using MR Store, you agree to provide accurate
            information and use the website lawfully.
          </p>
          <ul>
            <li>
              Product availability, descriptions, and prices may
              change over time.
            </li>
            <li>
              Please check your order details carefully before
              submitting an order.
            </li>
            <li>
              Orders may require confirmation before they are
              processed.
            </li>
            <li>
              Nothing in these terms removes rights that you have
              under applicable consumer protection laws.
            </li>
          </ul>
        </article>

        <article className="policy-card">
          <span className="policy-number">03 / RETURNS</span>
          <h2>Returns &amp; Refunds</h2>
          <p>
            If there is a problem with an order, contact our support
            team so the situation can be reviewed.
          </p>
          <ul>
            <li>
              Include your order details and a clear explanation
              of the issue when contacting support.
            </li>
            <li>
              Eligibility, return arrangements, and refund timing
              depend on the order and applicable rules.
            </li>
            <li>
              Please wait for return instructions before sending
              an item back.
            </li>
            <li>
              Your statutory consumer rights remain unaffected.
            </li>
          </ul>
        </article>

        <article className="policy-card">
          <span className="policy-number">04 / DELIVERY</span>
          <h2>Delivery Information</h2>
          <p>
            Delivery arrangements and estimated arrival times can
            depend on the product, destination, and courier.
          </p>
          <ul>
            <li>
              Enter a complete and accurate delivery address.
            </li>
            <li>
              Delivery estimates are not guaranteed unless
              explicitly confirmed.
            </li>
            <li>
              Contact support if you need help with an order
              or delivery question.
            </li>
          </ul>
        </article>
      </section>

      <section className="policy-contact">
        <div>
          <p className="policy-eyebrow">QUESTIONS ABOUT OUR POLICIES?</p>
          <h2>We’re happy to help.</h2>
          <p>
            Contact our team if you need clarification about an
            order or any of these policies.
          </p>
        </div>
        <Link href="/contact" className="policy-button">
          Contact Us <span>↗</span>
        </Link>
      </section>

      <footer className="policy-footer">
        <span>MR STORE © {new Date().getFullYear()}</span>
        <Link href="/about">About</Link>
        <Link href="/help-center">Help Center</Link>
        <Link href="/contact">Contact</Link>
      </footer>
    </main>
  );
}
