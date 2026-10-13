
import Link from "next/link";
import "./contact.css";

export default function ContactPage() {
  return (
    <main className="contact-page">
      <nav className="contact-nav">
        <Link href="/" className="contact-brand">
          MR<span>.</span> STORE
        </Link>
        <Link href="/" className="contact-back">
          ← Back to Store
        </Link>
      </nav>

      <section className="contact-hero">
        <p className="contact-eyebrow">LET’S TALK · MR STORE</p>
        <h1>
          We’re here
          <br />
          <span>to help.</span>
        </h1>
        <p>
          Have a question about a product or order? Find the right
          information below and get in touch with our team.
        </p>
      </section>

      <section className="contact-layout">
        <div className="contact-info">
          <p className="contact-eyebrow">GET IN TOUCH</p>
          <h2>How can we help?</h2>
          <p className="contact-description">
            Choose the best way to reach us. For order questions,
            include your order number when contacting support.
          </p>

          <div className="contact-detail">
            <span className="contact-icon">01</span>
            <div>
              <h3>Customer Support</h3>
              <p>
                Need help with an order or product?
              </p>
              <Link href="/help-center">Visit Help Center ↗</Link>
            </div>
          </div>

          <div className="contact-detail">
            <span className="contact-icon">02</span>
            <div>
              <h3>Store Policies</h3>
              <p>
                Read our policies before making a purchase.
              </p>
              <Link href="/policy">Read Our Policies ↗</Link>
            </div>
          </div>

          <div className="contact-detail">
            <span className="contact-icon">03</span>
            <div>
              <h3>Our Story</h3>
              <p>
                Learn more about MR Store and our approach.
              </p>
              <Link href="/about">About MR Store ↗</Link>
            </div>
          </div>
        </div>

        <div className="contact-message">
          <p className="contact-eyebrow">SEND US A MESSAGE</p>
          <h2>Let’s make things simple.</h2>
          <p>
            Our contact form is not connected to a message service yet.
            You can use the Help Center to find support information.
          </p>
          <Link href="/help-center" className="contact-button">
            Get Support <span>↗</span>
          </Link>
          <p className="contact-small">
            We’ll add a working contact form when a verified support
            email or message destination is configured.
          </p>
        </div>
      </section>

      <section className="contact-bottom">
        <p className="contact-eyebrow">MR STORE</p>
        <h2>Thoughtfully selected. Simply yours.</h2>
        <Link href="/" className="contact-button">
          Explore the Store <span>↗</span>
        </Link>
      </section>

      <footer className="contact-footer">
        <span>MR STORE © {new Date().getFullYear()}</span>
        <Link href="/about">About</Link>
        <Link href="/help-center">Help Center</Link>
        <Link href="/policy">Policy</Link>
      </footer>
    </main>
  );
}
