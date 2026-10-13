
import Link from "next/link";
import "./about.css";

export default function AboutPage() {
  return (
    <main className="about-page">
      <nav className="about-nav">
        <Link href="/" className="brand">
          MR<span>.</span> STORE
        </Link>
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
      </nav>

      <section className="about-hero">
        <p className="eyebrow">OUR STORY · MR STORE</p>
        <h1>
          Less, but better.
          <br />
          <span>Made for everyday.</span>
        </h1>
        <p className="intro">
          We believe great style does not need to be complicated.
          MR Store brings together carefully selected products,
          thoughtful design, and a simpler shopping experience.
        </p>
        <Link href="/" className="shop-button">
          Explore the Store <span>↗</span>
        </Link>
      </section>

      <section className="about-grid">
        <article className="about-card">
          <span className="card-number">01 / OUR VISION</span>
          <h2>Everyday, elevated.</h2>
          <p>
            Our goal is to make discovering useful, stylish products
            feel simple, comfortable, and enjoyable.
          </p>
        </article>

        <article className="about-card">
          <span className="card-number">02 / OUR APPROACH</span>
          <h2>Quality over clutter.</h2>
          <p>
            We focus on a clean shopping experience where products
            are easy to explore and important details are easy to find.
          </p>
        </article>

        <article className="about-card">
          <span className="card-number">03 / OUR PROMISE</span>
          <h2>Shopping made simple.</h2>
          <p>
            We aim to provide clear product information, helpful
            support, and a straightforward shopping journey.
          </p>
        </article>
      </section>

      <footer className="about-footer">
        <span>MR STORE © {new Date().getFullYear()}</span>
        <span>Thoughtfully selected. Simply yours.</span>
      </footer>
    </main>
  );
}
