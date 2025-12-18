import React, { useState, useEffect } from "react";
import "../Css/Home.css";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { linksAPI } from "../services/api";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [inputUrl, setInputUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const testimonials = [
    {
      id: 1,
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "Shrinkly made shortening links easy and effective",
      name: "Sarah L."
    },
    {
      id: 2,
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "The analytics features helped me track clicks",
      name: "John D."
    },
    {
      id: 3,
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "Great support and smooth interface",
      name: "Emily R."
    }
  ];

  // Validate URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const createShortLink = async () => {
    setError("");
    setSuccess(false);

    if (!inputUrl.trim()) {
      setError("❌ Please enter a URL");
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError("❌ Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setLoading(true);

    try {
      const data = await linksAPI.create({ originalUrl: inputUrl.trim() });
      console.log("API Response:", data);

      if (data.success) {
        // Use shortUrl or construct from short code
        const url = data.shortUrl || data.link?.short || `http://localhost:5000/r/${data.short}`;
        setShortUrl(url);
        setSuccess(true);
        setInputUrl("");

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        throw new Error(data.message || data.error || "Failed to create link");
      }
    } catch (err) {
      setError(`❌ ${err.message || "Failed to create short link. Please try again."}`);
      console.error("Link creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert("✅ Copied to clipboard!");
  };

  const goToSlide = index => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div id="home" className="page active home-page">

          <div className="hero-section">
            <h1 className="hero-title">Create Short Links!</h1>
            <p className="hero-description">
              Shrinkly helps you shorten and track your links.
            </p>

            <div className="input-section">
              <input
                type="text"
                placeholder="Paste a link (e.g., https://example.com)"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyPress={e => e.key === "Enter" && createShortLink()}
              />
              <button 
                className="create-btn" 
                onClick={createShortLink}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create URL"}
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {success && shortUrl && (
              <div className="alert alert-success">
                <div className="success-content">
                  <p>✅ Short link created successfully!</p>
                  <div className="short-link-box">
                    <p className="short-link-text">{shortUrl}</p>
                    <button className="copy-btn" onClick={copyToClipboard}>
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="features-section">
            <h2 className="features-title">A short link with real use</h2>
            <p className="features-description">
              Use advanced short link customization and sharing.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔗</div>
                <h3>Custom Domains</h3>
                <p>Track performance using your own domain.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Track Clicks</h3>
                <p>See every click and visitor source.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3>Support</h3>
                <p>Get quick help when needed.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Fast</h3>
                <p>Create links in one second.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Secure</h3>
                <p>Every link uses HTTPS.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🌐</div>
                <h3>Global Access</h3>
                <p>Use your links anywhere.</p>
              </div>
            </div>
          </div>

          <div className="testimonials-section">
            <h2>What Users Say</h2>

            <div className="carousel-wrapper">
              <div className="carousel-indicators">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={index === currentSlide ? "active" : ""}
                    onClick={() => goToSlide(index)}
                  ></button>
                ))}
              </div>

              <div className="carousel-inner">
                {testimonials.map((t, index) => (
                  <div
                    key={t.id}
                    className={
                      index === currentSlide
                        ? "carousel-item active"
                        : "carousel-item"
                    }
                  >
                    <div className="testimonial-card">
                      <img src={t.image} alt={t.name} />
                      <p>{t.text}</p>
                      <h4>{t.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="faq-section">
            <h2>Frequently Asked Questions</h2>

            <div className="faq-item">
              <h4>How do I track performance metrics and analytics for my shortened links across different campaigns?</h4>
              <p>Our advanced analytics dashboard provides real-time insights including click-through rates, geographic location data, device types, referral sources, and conversion tracking. You can set up custom parameters and UTM codes to segment your campaigns effectively.</p>
            </div>

            <div className="faq-item">
              <h4>What security measures and compliance standards does Shrinkly implement for data protection?</h4>
              <p>We employ end-to-end HTTPS encryption, maintain SOC 2 compliance, implement regular security audits, and support GDPR/CCPA regulations. Your data is stored securely with automated backups and DDoS protection.</p>
            </div>

            <div className="faq-item">
              <h4>Can I integrate Shrinkly with my existing marketing automation and CRM platforms?</h4>
              <p>Yes! We offer native integrations with Zapier, Make (formerly Integromat), HubSpot, Salesforce, and custom API access. Our REST API allows you to programmatically create, manage, and track links within your existing workflows.</p>
            </div>

            <div className="faq-item">
              <h4>What are the rate limits and scalability options for enterprise-level link management?</h4>
              <p>Enterprise plans support unlimited links with custom rate limits configured per your needs. We handle millions of daily redirects with sub-millisecond response times and offer dedicated infrastructure options for large-scale operations.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
