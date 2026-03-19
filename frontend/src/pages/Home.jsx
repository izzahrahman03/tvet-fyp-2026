import "../css/pages/home.css";
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

const PROGRAMMES = [
  {
    img:    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
    accent: "#1A3A6B",
    cat:    "Track A — TVET",
    code:   "TVET BOLTS",
    name:   "Bridging Opportunities Learning Technical & Skills",
    meta:   "6 months · Batu Kawan, Penang · RM 1,700 / month",
    tag:    "Fully Sponsored",
  },
  {
    img:    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80",
    accent: "#8A5E10",
    cat:    "Advancement Track",
    code:   "SKM L2 & L3",
    name:   "Sijil Kemahiran Malaysia — Industrial Automation",
    meta:   "12 months · ViTrox Academy · Ministry-Recognised",
    tag:    "Post-BOLTS Pathway",
  },
  {
    img:    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80",
    accent: "#1D5C2B",
    cat:    "Higher Education",
    code:   "Diploma",
    name:   "Diploma in Electrical & Electronics Engineering",
    meta:   "MQA Accredited · Work-Based Learning Model",
    tag:    "MQA/PA15866",
  },
];

const PHOTO_STRIP = [
  { src: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80", caption: "Workshop Training" },
  { src: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80", caption: "Electronics Lab" },
  { src: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80", caption: "Industry Attachment" },
  { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80", caption: "Mentorship Sessions" },
];

const FOOTER_LINKS = [
  ["Programme", ["K-Youth TVET BOLTS", "SKM Pathway", "Diploma Courses", "Corporate Training"]],
  ["Academy",   ["About ViTrox Academy", "Our Instructors", "Facilities", "News & Updates"]],
  ["Support",   ["How to Apply", "FAQ", "Contact Us", "Khazanah K-Youth"]],
];

const STATS = [
  ["500+",     "Programme places available"],
  ["RM 1,700", "Monthly allowance"],
  ["6 months", "Programme duration"],
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
  ["Monthly Allowance", "RM 1,700 (incl. EPF & SOCSO)",               true],
  ["Eligibility",       "Form 5 graduates, age 17–23",                false],
  ["SPM Required?",     "No — interest is sufficient",                true],
  ["Availability",      "Limited — 25 trainees per cohort",           false],
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-container">
          <div>
            <div className="hero-badge">
              <span>Khazanah Nasional Berhad Initiative</span>
              <span className="badge-divider" />
              <span>Delivered by ViTrox Academy</span>
            </div>

            <h1 className="hero-title">
              K-Youth Development<br />
              <em>Programme 2026</em>
            </h1>

            <p className="hero-sub">
              A government-sponsored TVET apprenticeship for Form 5 graduates aged 17–23.
              Earn while you learn — receive <strong>RM 1,700 per month</strong> as you build
              industry-ready technical skills in Malaysia's semiconductor sector.
            </p>

            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate("signup")}>Apply Now</button>
              <button className="btn-outline">Learn More ↓</button>
            </div>

            <div className="hero-stats">
              {STATS.map(([num, label]) => (
                <div className="stat-item" key={label}>
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-info-card">
              <div className="info-card-header">Programme at a Glance</div>
              {INFO_ROWS.map(([k, v, hi]) => (
                <div className="info-row" key={k}>
                  <span className="info-key">{k}</span>
                  <span className={`info-val${hi ? " highlight" : ""}`}>{v}</span>
                </div>
              ))}
              <button className="btn-primary btn-full" style={{ marginTop: "1.5rem" }} onClick={() => navigate("signup")}>
                Register Your Interest
              </button>
            </div>
          </div>
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
      <div className="about-band">
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
      <div className="section">
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
      <div className="timeline-band">
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

      {/* ── Programmes ── */}
      <div className="section">
        <div className="courses-header">
          <div>
            <div className="section-label">Available Pathways</div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Choose Your Track</h2>
          </div>
          <button className="btn-outline" style={{ whiteSpace: "nowrap" }}>
            View Full Programme Guide →
          </button>
        </div>
        <div className="courses-grid">
          {PROGRAMMES.map((c) => (
            <div key={c.name} className="course-card">
              <div className="course-thumb">
                <img src={c.img} alt={c.name} className="course-thumb-img" />
                <div className="course-thumb-overlay">
                  <span className="course-code-badge">{c.code}</span>
                </div>
              </div>
              <div className="course-body">
                <div className="course-cat" style={{ color: c.accent }}>{c.cat}</div>
                <div className="course-name">{c.name}</div>
                <div className="course-meta">{c.meta}</div>
                <div className="course-footer">
                  <span className="course-tag">{c.tag}</span>
                </div>
              </div>
            </div>
          ))}
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
                <div key={l} className="footer-copy" style={{ cursor: "pointer", color: "#94A3B8" }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;