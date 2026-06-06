import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { linksAPI } from "../services/api";
import "../Css/Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      text: "Shrinkly completely changed how we track campaign links. The location analytics down to the city level are incredibly accurate!",
      name: "Sarah L.",
      role: "Growth Marketer"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      text: "The custom QR codes and password protection features are enterprise-grade. We use them for all our exclusive product drops.",
      name: "John D.",
      role: "Brand Director"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      text: "As an influencer, I need to know where my audience is coming from. Shrinkly's platform reports are clean, fast, and gorgeous.",
      name: "Emily R.",
      role: "Content Creator"
    }
  ];

  const features = [
    { icon: "🔗", title: "Short Links", desc: "Shorten links with custom back-halves and domains instantly." },
    { icon: "📱", title: "QR Codes", desc: "Generate styled QR codes with customized background and foreground colors." },
    { icon: "📊", title: "Advanced Analytics", desc: "Track clicks, devices, operating systems, browsers, and countries." },
    { icon: "🛡️", title: "Smart Security", desc: "Set passwords, expiry dates, and maximum click limits on links." }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      desc: "Perfect for personal use and testing.",
      features: ["50 Short Links / mo", "Basic Analytics", "Standard QR Codes", "Community Support"],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Pro",
      price: "$9",
      period: "month",
      desc: "Ideal for creators & marketing pros.",
      features: ["Unlimited Short Links", "Advanced Analytics & Cities", "Custom Styling QR Codes", "Password & Expiry Limits", "Priority Support"],
      cta: "Go Pro",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "month",
      desc: "Designed for scaling brands & agencies.",
      features: ["Everything in Pro", "Team Management", "Dedicated Domain Support", "Weekly Email Cron Reports", "Dedicated Support Manager"],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  const useCases = [
    { title: "Marketing & Campaigns", desc: "Track ROI on social, search, and email marketing efforts with tags and click graphs." },
    { title: "Content Creators & Influencers", desc: "Manage bio links, track sponsor links, and study audience locations and device preferences." },
    { title: "Events & Print Media", desc: "Create trackable QR codes for brochures, tickets, and billboards with color matches." },
    { title: "Businesses & Agencies", desc: "Secure internal redirects, export CSV files for clients, and schedule automated analytics reports." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handlePricingClick = (planName) => {
    const planSlug = planName.toLowerCase();
    if (isAuthenticated()) {
      if (planSlug === "free") {
        navigate("/home");
        toast.success("You are already using Shrinkly's Free plan!");
      } else {
        navigate("/profile", { state: { activeTab: "billing", autoSelectPlan: planSlug } });
      }
    } else {
      navigate(`/auth?plan=${planSlug}`);
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!inputUrl.trim()) {
      setError("Please enter a URL first.");
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setLoading(true);
    try {
      const data = await linksAPI.create({ originalUrl: inputUrl.trim() });
      if (data.success) {
        setShortUrl(data.shortUrl || `${window.location.origin}/r/${data.short}`);
        setSuccess(true);
        setInputUrl("");
        toast.success("Link shortened successfully!");
      } else {
        throw new Error(data.message || "Failed to shorten link");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard!");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-root">
      
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate("/")}>
            <span className="logo-icon">🔗</span>
            <span className="logo-text">Shrinkly</span>
          </div>
          <div className="nav-links">
            <button className="nav-item" onClick={() => scrollToSection("features")}>Features</button>
            <button className="nav-item" onClick={() => scrollToSection("usecases")}>Use Cases</button>
            <button className="nav-item" onClick={() => scrollToSection("pricing")}>Pricing</button>
            <button className="nav-item" onClick={() => scrollToSection("testimonials")}>Reviews</button>
          </div>
          <div className="nav-cta">
            {isAuthenticated() ? (
              <button className="btn-nav-primary" onClick={() => navigate("/home")}>Dashboard →</button>
            ) : (
              <button className="btn-nav-primary" onClick={() => navigate("/auth")}>Sign In</button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-wrap">
        <div className="hero-content">
          <div className="badge-pill">🚀 The Premium URL Management Platform</div>
          <h1 className="hero-title">
            Shorten, Track, and <span className="text-gradient">Secure</span> Every Link
          </h1>
          <p className="hero-subtitle">
            A beautiful, glassmorphic analytics suite built for modern creators, agencies, and businesses. Track origins, devices, and restrict access with advanced passwords and auto-expiries.
          </p>
          <div className="hero-buttons">
            {isAuthenticated() ? (
              <button className="btn-primary-glow" onClick={() => navigate("/home")}>Go to Dashboard</button>
            ) : (
              <button className="btn-primary-glow" onClick={() => navigate("/auth")}>Get Started for Free</button>
            )}
            <button className="btn-secondary-flat" onClick={() => scrollToSection("demo")}>Try Live Shortener</button>
          </div>
        </div>
      </header>

      {/* Live Demo Section */}
      <section id="demo" className="demo-section">
        <div className="section-container">
          <div className="glass-panel demo-box">
            <div className="demo-header">
              <h2>Try it Live</h2>
              <p>Shorten any link instantly. No credit card or account required.</p>
            </div>
            <form onSubmit={handleShorten} className="demo-form">
              <input
                type="text"
                placeholder="Paste your long URL here (e.g., https://my-very-long-portfolio-website.com/...)"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <button type="submit" disabled={loading} className="btn-demo-submit">
                {loading ? "Shortening..." : "Shorten URL"}
              </button>
            </form>

            {error && <div className="demo-error">{error}</div>}

            {success && shortUrl && (
              <div className="demo-success-box animate-slide-up">
                <div className="success-icon-badge">✅</div>
                <div className="success-content">
                  <span className="success-label">Your shortened link is ready:</span>
                  <strong className="success-link">{shortUrl}</strong>
                </div>
                <button className="btn-copy-success" onClick={handleCopy}>
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="features-wrap">
        <div className="section-container">
          <div className="section-header">
            <h2>Everything you need to manage links</h2>
            <p>One platform to control, secure, and understand your traffic channels.</p>
          </div>
          <div className="features-grid-custom">
            {features.map((feat, idx) => (
              <div key={idx} className="glass-panel feature-item">
                <div className="feat-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="usecases" className="usecases-wrap">
        <div className="section-container">
          <div className="section-header">
            <h2>Built for every use case</h2>
            <p>Empowering campaigns, digital spaces, and offline activations.</p>
          </div>
          <div className="usecases-grid">
            {useCases.map((use, idx) => (
              <div key={idx} className="usecase-card">
                <div className="usecase-num">0{idx + 1}</div>
                <h3>{use.title}</h3>
                <p>{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="pricing-wrap">
        <div className="section-container">
          <div className="section-header">
            <h2>Sleek pricing plans for everyone</h2>
            <p>Scale as your audience grows. Upgrade or downgrade anytime.</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan, idx) => (
              <div key={idx} className={`glass-panel pricing-card ${plan.highlight ? "highlighted" : ""}`}>
                {plan.highlight && <div className="card-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="price-tag">
                  <span className="amount">{plan.price}</span>
                  <span className="period">/{plan.period}</span>
                </div>
                <p className="plan-desc">{plan.desc}</p>
                <ul className="plan-features">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx}>✓ {feat}</li>
                  ))}
                </ul>
                <button
                  className={`btn-pricing ${plan.highlight ? "btn-pricing-highlight" : "btn-pricing-secondary"}`}
                  onClick={() => handlePricingClick(plan.name)}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-wrap">
        <div className="section-container">
          <div className="section-header">
            <h2>Loved by creators and developers</h2>
            <p>Hear what professionals are saying about our link management solutions.</p>
          </div>
          <div className="testimonial-carousel-box">
            <div className="testimonial-carousel-inner">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className={`testimonial-slide ${idx === currentTestimonial ? "active" : ""}`}
                >
                  <p className="testimonial-quote">"{t.text}"</p>
                  <div className="testimonial-user">
                    <img src={t.image} alt={t.name} />
                    <div className="user-info">
                      <h4>{t.name}</h4>
                      <p>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="carousel-dots">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  className={`dot-btn ${idx === currentTestimonial ? "active" : ""}`}
                  onClick={() => setCurrentTestimonial(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-banner">
        <div className="section-container">
          <h2>Ready to track your first link?</h2>
          <p>Join thousands of marketers and businesses scaling their conversion rates.</p>
          <button className="btn-primary-glow" onClick={() => navigate("/auth")}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Shrinkly. All rights reserved.</p>
          <div className="footer-links">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }}>Features</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection("pricing"); }}>Pricing</a>
            <a href="/contact">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
