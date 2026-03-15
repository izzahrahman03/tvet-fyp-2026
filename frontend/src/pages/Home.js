import "../css/pages/home.css";
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: "🎯", name: "Structured Learning Paths",  desc: "Curated curricula built by industry experts to take you from beginner to job-ready." },
  { icon: "🤝", name: "Live Mentorship",             desc: "Weekly 1-on-1 sessions with senior professionals who guide your progress." },
  { icon: "📊", name: "Progress Analytics",          desc: "Visual dashboards track your pace, streaks, and mastery across every subject." },
  { icon: "🏆", name: "Verified Certificates",       desc: "Earn credentials recognized by 500+ hiring partners worldwide." },
  { icon: "💬", name: "Peer Community",              desc: "Collaborate, study together, and get unstuck in our active learner forums." },
  { icon: "♾️", name: "Lifetime Access",             desc: "Pay once, revisit any time. Your learning doesn't expire." },
];

const COURSES = [
  { emoji: "💻", bg: "#EFF6FF", cat: "Engineering", name: "Full-Stack Web Development Bootcamp",          rating: "★★★★★ 4.9", price: "Free" },
  { emoji: "🤖", bg: "#F0FDF4", cat: "AI & ML",     name: "Machine Learning with Python & TensorFlow",   rating: "★★★★★ 4.8", price: "$49"  },
  { emoji: "📐", bg: "#FFF7ED", cat: "Design",       name: "Product Design: Figma to Prototype",          rating: "★★★★☆ 4.7", price: "$29"  },
];

const FOOTER_LINKS = [
  ["Platform", ["Courses", "Learning Paths", "Certifications", "Live Mentors"]],
  ["Company",  ["About Us", "Careers", "Blog", "Press"]],
  ["Support",  ["Help Center", "Community", "Contact", "Status"]],
];

const STATS = [
  ["200K+", "Active learners"],
  ["1,400+", "Expert courses"],
  ["96%",   "Job placement"],
];

const AVATAR_COLORS = ["#1A56DB", "#10B981", "#F59E0B"];
const AVATAR_INITIALS = ["JD", "AM", "SK"];

const HomePage = () => {
  
  const navigate = useNavigate();

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section">
        <div
          className="hero-bg-blob anim-pulse"
          style={{ width: 700, height: 700, top: -200, right: -200 }}
        />
        <div
          className="hero-bg-blob"
          style={{ width: 400, height: 400, bottom: 0, left: -100, opacity: 0.6 }}
        />

        <div className="hero-container">
          {/* Left copy */}
          <div>
            <div className="hero-badge anim-fade-up">
              <span className="hero-badge-dot" />
              #1 Rated Ed-Tech Platform 2024
            </div>

            <h1 className="hero-title anim-fade-up delay-1">
              Learn skills that <em>actually</em> get you hired.
            </h1>

            <p className="hero-sub anim-fade-up delay-2">
              Join 200,000+ learners mastering in-demand skills through hands-on
              projects, live mentors, and industry-vetted courses.
            </p>

            <div className="hero-actions anim-fade-up delay-3">
              <button className="btn-primary" onClick={() => navigate("signup")}>
                Start learning free →
              </button>
              <button className="btn-secondary">▶ Watch demo</button>
            </div>

            <div className="hero-stats anim-fade-up delay-4">
              {STATS.map(([num, label]) => (
                <div key={label}>
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual card */}
          <div className="hero-visual anim-fade-in delay-2">
            <div className="anim-float">
              <div className="hero-card-main">
                <div className="hero-card-tag">Currently Enrolled</div>
                <div className="hero-course-title">React & TypeScript Mastery</div>
                <div className="hero-course-meta">Module 7 of 12 · UI Components</div>

                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: "62%" }} />
                </div>
                <div className="progress-label">
                  <span>62% complete</span>
                  <span>3h left</span>
                </div>

                <div className="avatar-row">
                  <div className="avatar-stack">
                    {AVATAR_COLORS.map((color, i) => (
                      <div
                        key={i}
                        className="avatar"
                        style={{ background: color }}
                      >
                        {AVATAR_INITIALS[i]}
                      </div>
                    ))}
                  </div>
                  <div className="avatar-text">+14 studying now</div>
                </div>
              </div>

              {/* Floating stat cards */}
              <div className="hero-card-float float-top-right">
                <div className="float-label">This week</div>
                <div className="float-value">8.4h</div>
                <div className="float-sub">↑ 12% vs last week</div>
              </div>

              <div className="hero-card-float float-bottom-left">
                <div className="float-label">Certificates earned</div>
                <div className="float-value">3 🏆</div>
                <div className="float-sub">Keep going!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <div style={{ background: "#F8FAFF", borderTop: "1px solid #DBEAFE" }}>
        <div className="section">
          <div className="section-label anim-fade-up">Why K-Youth Development Programme?</div>
          <h2 className="section-title anim-fade-up delay-1">
            Everything you need to level up.
          </h2>
          <p className="section-sub anim-fade-up delay-2">
            We combine world-class content with the tools, community, and support
            that actually move the needle.
          </p>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.name} className={`feature-card anim-fade-up delay-${i + 1}`}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Courses ── */}
      <div className="section">
        <div className="courses-header">
          <div>
            <div className="section-label">Top courses</div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              Start with the best.
            </h2>
          </div>
          <button className="btn-secondary" style={{ whiteSpace: "nowrap" }}>
            Browse all courses →
          </button>
        </div>

        <div className="courses-grid">
          {COURSES.map((c) => (
            <div key={c.name} className="course-card">
              <div className="course-thumb" style={{ background: c.bg }}>
                {c.emoji}
              </div>
              <div className="course-body">
                <div className="course-cat">{c.cat}</div>
                <div className="course-name">{c.name}</div>
                <div className="course-footer">
                  <div className="course-rating">{c.rating}</div>
                  <div className="course-price">{c.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div className="cta-section">
        <svg
          className="cta-bg"
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="100" cy="150" r="200" fill="rgba(96,165,250,.15)" />
          <circle cx="700" cy="50"  r="150" fill="rgba(96,165,250,.1)"  />
        </svg>
        <h2 className="cta-title">Ready to transform your career?</h2>
        <p className="cta-sub">
          Join thousands of learners who've already made the leap. Your first
          course is free — no credit card needed.
        </p>
        <button
          className="btn-primary"
          style={{ fontSize: "1rem", padding: ".85rem 2.2rem", position: "relative" }}
          onClick={() => navigate("signup")}
        >
          Create free account →
        </button>
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand">Vitrox Academy</div>
              <div className="footer-tagline">
                Empowering curious minds with skills that shape the future.
                Learning starts here.
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
              © 2025 Vitrox Academy Inc. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: "1.2rem" }}>
              {["Privacy", "Terms", "Cookies"].map((l) => (
                <div
                  key={l}
                  className="footer-copy"
                  style={{ cursor: "pointer", color: "#94A3B8" }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;