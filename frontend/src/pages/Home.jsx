import "../css/pages/home.css";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── SVG Icon Components ── */
const IconGear = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="1"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    <line x1="6" y1="11" x2="6.01" y2="11"/>
    <line x1="6" y1="15" x2="6.01" y2="15"/>
    <line x1="18" y1="11" x2="18.01" y2="11"/>
    <line x1="18" y1="15" x2="18.01" y2="15"/>
  </svg>
);
const IconAward = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconUnlock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

const FEATURES = [
  { Icon: IconGear,     name: "Technical Skills Training",   desc: "Hands-on modules in Engineering Drawing, Control Programming, Fabrication, Sub-Assembly, and System Maintenance — taught by instructors with 5+ years of industry experience." },
  { Icon: IconBuilding, name: "Work-Based Learning",         desc: "70% of learning happens on the factory floor. Apprentices are placed at selected industry companies, returning to ViTrox Academy every Friday for structured theory sessions." },
  { Icon: IconAward,    name: "Recognised Certification",    desc: "Graduates receive the Sijil K-Youth Development Programme TVET BOLTS, a credential designed to strengthen your employability in the semiconductor and electronics industries." },
  { Icon: IconTrend,    name: "Clear Career Pathway",        desc: "Progress from the 6-month BOLTS programme to SKM Level 2 & 3 certification, building toward a full 18-month learning journey and a career as an industry technologist." },
  { Icon: IconUsers,    name: "Mentorship by Engineers",     desc: "ViTrox's manufacturing engineers personally coach apprentices through their practical learning, ensuring real-world relevance in every lesson." },
  { Icon: IconUnlock,   name: "No SPM Barrier",              desc: "Strong SPM results are not required. If you have a genuine interest in electronics, electrical, and semiconductor fields, you are welcome to apply." },
];

const PHOTO_STRIP = [
  { src: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80", caption: "Workshop Training" },
  { src: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80", caption: "Electronics Lab" },
  { src: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80", caption: "Industry Attachment" },
  { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80", caption: "Mentorship Sessions" },
];

const FOOTER_LINKS = [
  ["Academy",   ["About ViTrox Academy", "Our Instructors", "Facilities", "News & Updates"]],
  ["Support",   ["How to Apply", "FAQ", "Contact Us", "Khazanah K-Youth"]],
];

const STATS = [
  ["500+",     "Programme places available"],
  ["RM 1,700", "Monthly allowance"],
  ["6 months", "Programme duration"],
];

const SLIDES = [
  {
    badge:    ["Khazanah Nasional Berhad Initiative", "Delivered by ViTrox Academy"],
    tag:      "Now Accepting Applications",
    title:    "K-Youth Development\nProgramme 2026",
    titleEm:  "Programme 2026",
    sub:      "A government-sponsored TVET apprenticeship for Form 5 graduates aged 17\u201323. Earn while you learn \u2014 receive RM\u00a01,700 per month as you build industry-ready technical skills in Malaysia's semiconductor sector.",
    subBold:  "RM\u00a01,700 per month",
    cta:      "Apply Now",
    ctaLink:  "signup",
    highlight: "#60a5fa",
    bg:       "linear-gradient(145deg, #060e1e 0%, #0c1d3a 45%, #132d58 100%)",
    orb1:     "rgba(59,130,246,.22)",
    orb2:     "rgba(29,78,216,.15)",
  },
  {
    badge:    ["New Cohort Opening", "Limited to 25 Seats"],
    tag:      "Deadline: 31 July 2026",
    title:    "Fully Sponsored\nZero Fees. Real Pay.",
    titleEm:  "Zero Fees. Real Pay.",
    sub:      "No tuition fees. No hidden costs. Participants receive RM\u00a01,700 monthly allowance inclusive of EPF & SOCSO contributions \u2014 fully funded by Khazanah Nasional Berhad throughout the 6-month programme.",
    subBold:  "RM\u00a01,700 monthly allowance",
    cta:      "Secure Your Seat",
    ctaLink:  "signup",
    highlight: "#34d399",
    bg:       "linear-gradient(145deg, #041810 0%, #062e1a 45%, #0a4a2a 100%)",
    orb1:     "rgba(52,211,153,.18)",
    orb2:     "rgba(16,185,129,.12)",
  },
  {
    badge:    ["Industry-Embedded Learning", "70% On-the-Job Training"],
    tag:      "Work & Learn Model",
    title:    "Learn on the\nFactory Floor",
    titleEm:  "Factory Floor",
    sub:      "70% of your learning happens inside real semiconductor factories. Apprentices are placed at leading electronics companies in Penang, returning to ViTrox Academy every Friday for structured theory sessions led by industry engineers.",
    subBold:  null,
    cta:      "See How It Works",
    ctaLink:  "signup",
    highlight: "#f59e0b",
    bg:       "linear-gradient(145deg, #0f0800 0%, #1c1000 45%, #2d1f00 100%)",
    orb1:     "rgba(245,158,11,.18)",
    orb2:     "rgba(217,119,6,.12)",
  },
  {
    badge:    ["Recognised Qualification", "JPK & MQA Accredited"],
    tag:      "Career Pathway",
    title:    "Certified &\nCareer-Ready",
    titleEm:  "Career-Ready",
    sub:      "Graduate with the Sijil K-Youth TVET BOLTS \u2014 a nationally recognised credential. Progress directly to SKM Level 2 & 3 certification, building toward an 18-month journey and a full career as an industry technologist.",
    subBold:  "Sijil K-Youth TVET BOLTS",
    cta:      "View Career Pathways",
    ctaLink:  "signup",
    highlight: "#c084fc",
    bg:       "linear-gradient(145deg, #0c0418 0%, #160830 45%, #200d48 100%)",
    orb1:     "rgba(192,132,252,.18)",
    orb2:     "rgba(139,92,246,.12)",
  },
];

const TIMELINE = [
  { step: "01", title: "Submit Application",               desc: "Apply online or walk in for an interview at ViTrox Academy, Batu Kawan. No SPM results required." },
  { step: "02", title: "Selection & Interview",            desc: "Attend a structured interview session. Candidates are assessed on interest and motivation, not prior grades." },
  { step: "03", title: "Classroom & Workshop Training",    desc: "Begin your 6-month programme combining weekly theory classes with practical workshop modules at ViTrox Academy." },
  { step: "04", title: "Industry Attachment (OJT)",        desc: "Gain real work experience at partner semiconductor and electronics companies in Penang and beyond." },
  { step: "05", title: "Certification & Career Placement", desc: "Graduate with the TVET BOLTS Certificate and receive guidance for employment or progression to SKM Level 2 & 3." },
];

const INFO_ROWS = [
  ["Programme",         "K-Youth TVET BOLTS",                        false],
  ["Delivered by",      "ViTrox Academy, Batu Kawan",                 false],
  ["Funded by",         "Khazanah Nasional Berhad",                   false],
  ["Duration",          "6 months (extendable to 18 months via SKM)", false],
  ["Monthly Allowance", "RM 1,700",               true],
  ["Eligibility",       "Form 5 graduates, age 18–23",                false],
  ["SPM Required?",     "No — interest is sufficient",                true],
  ["Availability",      "Limited — 25 trainees per cohort",           false],
];

const HomePage = () => {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [animDir, setAnimDir] = useState(""); // "left" | "right"

  const goTo = useCallback((idx) => {
    setAnimDir(idx > slide ? "left" : "right");
    setSlide(idx);
  }, [slide]);

  const prev = useCallback(() => {
    const idx = (slide - 1 + SLIDES.length) % SLIDES.length;
    setAnimDir("right");
    setSlide(idx);
  }, [slide]);

  const next = useCallback(() => {
    const idx = (slide + 1) % SLIDES.length;
    setAnimDir("left");
    setSlide(idx);
  }, [slide]);

  // Auto-advance every 6s
  useEffect(() => {
    const t = setTimeout(() => next(), 6000);
    return () => clearTimeout(t);
  }, [slide, next]);

  const s = SLIDES[slide];

  // Build sub text with optional bold word
  const renderSub = (sub, bold) => {
    if (!bold) return sub;
    const parts = sub.split(bold);
    return <>{parts[0]}<strong style={{ color: "#fff" }}>{bold}</strong>{parts[1]}</>;
  };

  // Build title with em on second line
  const renderTitle = (title, em) => {
    const lines = title.split("\n");
    return lines.map((line, i) =>
      line === em
        ? <em key={i}>{line}</em>
        : <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
    );
  };

  return (
    <>
      {/* ── Hero Slider ── */}
      <section
        className="hero-section"
        id="announcements"
        style={{ background: s.bg, "--orb1": s.orb1, "--orb2": s.orb2, "--accent": s.highlight }}
      >
        {/* nav arrows */}
        <button className="hero-arrow hero-arrow--prev" onClick={prev} aria-label="Previous slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className="hero-arrow hero-arrow--next" onClick={next} aria-label="Next slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <div className={`hero-container hero-slide-content hero-slide--${animDir}`} key={slide}>
          <div>
            <div className="hero-tag" style={{ borderColor: `${s.highlight}55`, background: `${s.highlight}18`, color: s.highlight }}>
              {s.tag}
            </div>

            <div className="hero-badge">
              <span>{s.badge[0]}</span>
              <span className="badge-divider" />
              <span>{s.badge[1]}</span>
            </div>

            <h1 className="hero-title" style={{ "--em-color": s.highlight }}>
              {renderTitle(s.title, s.titleEm)}
            </h1>

            <p className="hero-sub">{renderSub(s.sub, s.subBold)}</p>

            <div className="hero-actions">
              <button className="btn-hero-primary" style={{ background: `linear-gradient(135deg, ${s.highlight}cc, ${s.highlight})`, boxShadow: `0 8px 28px ${s.highlight}44` }} onClick={() => navigate(s.ctaLink)}>
                {s.cta} →
              </button>
              <button className="btn-outline hero-btn-outline">Learn More ↓</button>
            </div>

            <div className="hero-stats">
              {STATS.map(([num, label]) => (
                <div className="stat-item" key={label}>
                  <div className="stat-num" style={{ color: s.highlight }}>{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-info-card" style={{ borderColor: `${s.highlight}33` }}>
              <div className="info-card-header" style={{ borderBottomColor: `${s.highlight}44` }}>
                Programme at a Glance
              </div>
              {INFO_ROWS.map(([k, v, hi]) => (
                <div className="info-row" key={k}>
                  <span className="info-key">{k}</span>
                  <span className={`info-val${hi ? " highlight" : ""}`} style={hi ? { color: s.highlight } : {}}>
                    {v}
                  </span>
                </div>
              ))}
              <button
                className="btn-outline btn-full"
                style={{ marginTop: "1.5rem", borderColor: s.highlight, color: s.highlight }}
                onClick={() => navigate("signup")}
              >
                Register Your Interest
              </button>
            </div>
          </div>
        </div>

        {/* dot indicators */}
        <div className="hero-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === slide ? " hero-dot--active" : ""}`}
              style={i === slide ? { background: s.highlight, width: "2rem" } : {}}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* progress bar */}
        <div className="hero-progress">
          <div className="hero-progress-bar" style={{ background: s.highlight }} key={slide} />
        </div>
      </section>

      {/* ── Photo Strip ── */}
      <div className="photo-strip">
        {PHOTO_STRIP.map(({ src, caption }) => (
          <div className="photo-strip-item" key={caption}>
            <img src={src} alt={caption} />
            <div className="photo-strip-caption">{caption}</div>
          </div>
        ))}
      </div>

      {/* ── About ── */}
      <div className="about-band" id="background">
        <div className="section">
          <div className="about-grid">
            <div>
              <div className="section-label">Background</div>
              <h2 className="section-title">A National Initiative for Malaysia's Youth</h2>
              <p className="body-text">
                Launched in 2023, the K-Youth Development Programme is a flagship youth
                employability initiative by <strong>Khazanah Nasional Berhad</strong>, Malaysia's
                sovereign wealth fund. It is anchored within the <em>Advancing Malaysia</em> long-term
                strategy and aligned with the aspirations of <em>Malaysia MADANI</em>.
              </p>
              <p className="body-text" style={{ marginTop: "1rem" }}>
                At ViTrox Academy, the programme is delivered as <strong>TVET BOLTS</strong> —
                Bridging Opportunities Learning Technical and Skills — a structured work-study
                model specifically designed to develop skilled technologists for Malaysia's
                semiconductor and electronics manufacturing industry.
              </p>
            </div>
            <div className="about-image-col">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80"
                alt="ViTrox electronics manufacturing"
                className="about-photo"
              />
              <blockquote className="pull-quote">
                "The work-study model gives us hands-on experience and industry-relevant skills
                in high demand at major semiconductor companies."
              </blockquote>
              <div className="pull-quote-attr">— Programme Participant, K-Youth 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="section" id="components">
        <div className="section-label">Programme Components</div>
        <h2 className="section-title">What the Programme Covers</h2>
        <p className="section-sub">
          The TVET BOLTS curriculum is industry-designed and JPK-accredited, combining
          structured classroom instruction with meaningful on-the-job training.
        </p>
        <div className="features-grid">
          {FEATURES.map(({ Icon, name, desc }) => (
            <div key={name} className="feature-card">
              <div className="feature-icon"><Icon /></div>
              <div className="feature-name">{name}</div>
              <div className="feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="timeline-band" id="application">
        <div className="section">
          <div className="timeline-layout">
            <div className="timeline-left">
              <div className="section-label">Application Process</div>
              <h2 className="section-title">How to Join</h2>
              <p className="section-sub">
                The application process is straightforward. Walk-in interviews are welcomed at
                ViTrox Academy, Batu Kawan, Penang.
              </p>
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&q=80"
                alt="Students at ViTrox Academy orientation"
                className="timeline-photo"
              />
            </div>
            <div className="timeline">
              {TIMELINE.map((item) => (
                <div key={item.step} className="timeline-item">
                  <div className="timeline-step">{item.step}</div>
                  <div className="timeline-content">
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div className="cta-section">
        <div className="cta-bg-img">
          <img
            src="https://images.unsplash.com/photo-1565022536102-f7645c84354a?w=1400&q=80"
            alt="Semiconductor manufacturing facility"
            className="cta-photo"
          />
          <div className="cta-overlay" />
        </div>
        <div className="cta-inner">
          <div className="cta-label">Limited Cohort Intake</div>
          <h2 className="cta-title">Begin Your Career in Malaysia's Semiconductor Industry</h2>
          <p className="cta-sub">
            Places are limited to 25 trainees per cohort. Supported by Khazanah Nasional.
            Delivered by ViTrox Academy. Free of charge.
          </p>
          <div className="cta-actions">
            <button className="btn-primary-light" onClick={() => navigate("signup")}>
              Apply for K-Youth 2026
            </button>
            <a className="cta-link" href="mailto:kyouth@vitrox.edu.my">
              Enquire via email →
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand">ViTrox Academy</div>
              <div className="footer-tagline">
                An education arm of ViTrox Corporation Berhad. Delivering industry-driven
                technical education and TVET programmes from Batu Kawan, Penang.
              </div>
              <div className="footer-address">
                746, Persiaran Cassia Selatan 3,<br />
                Batu Kawan Industrial Park,<br />
                14110 Bandar Cassia, Penang, Malaysia.
              </div>
            </div>
            {FOOTER_LINKS.map(([heading, links]) => (
              <div key={heading}>
                <div className="footer-heading">{heading}</div>
                {links.map((l) => (
                  <div key={l} className="footer-link">{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">
              © 2025 ViTrox Academy Sdn Bhd (202001005007). All rights reserved. A Khazanah K-Youth Partner.
            </div>
            <div style={{ display: "flex", gap: "1.2rem" }}>
              {["Privacy Policy", "Terms of Use", "Sitemap"].map((l) => (
                <div key={l} className="footer-copy" style={{ cursor: "pointer", color: "#64748b" }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;