import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen, Wallet, UserCheck, Wrench, Briefcase, TrendingUp,
  Building2, Users, GraduationCap, CheckCircle, ArrowRight,
  Clock, ChevronRight, Flag, Award,
  BadgeCheck, Layers, Target, Star
} from "lucide-react";
import Navbar from "../components/Navbar";

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  :root {
    --navy:     #0d2b6e;
    --blue:     #1a4fba;
    --blue-mid: #2563eb;
    --sky:      #3b82f6;
    --blue-lt:  #dbeafe;
    --blue-xlt: #eff6ff;
    --white:    #ffffff;
    --off:      #f8fafc;
    --gray:     #f1f5f9;
    --slate:    #64748b;
    --dark:     #0f172a;
    --border:   #e2e8f0;
    --fd:       'Outfit', sans-serif;
    --fb:       'Plus Jakarta Sans', sans-serif;
    --sh:       0 1px 3px rgba(15,43,110,.07), 0 1px 2px rgba(15,43,110,.05);
    --sm:       0 4px 16px rgba(15,43,110,.09), 0 2px 6px rgba(15,43,110,.06);
    --sl:       0 12px 40px rgba(15,43,110,.12), 0 4px 12px rgba(15,43,110,.07);
  }

  body, .vt {
    background: var(--white);
    color: var(--dark);
    font-family: var(--fb);
    font-size: 15px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  /* ── HERO ── */
  .hero {
    background: var(--navy);
    min-height: 100vh; padding-top: 68px;
    display: grid; grid-template-columns: 1fr 1fr;
    align-items: center; position: relative; overflow: hidden;
  }
  .hero-dots {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,.055) 1.5px, transparent 1.5px);
    background-size: 28px 28px;
  }
  .hero-glow {
    position: absolute; right: -80px; top: 50%; transform: translateY(-50%);
    width: 500px; height: 500px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(37,99,235,.22) 0%, transparent 68%);
  }
  .hero-left { padding: 80px 48px 80px 7%; position: relative; z-index: 2; }
  .hero-chip {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
    color: #93c5fd; font-size: 11.5px; font-weight: 600;
    letter-spacing: .09em; text-transform: uppercase; padding: 6px 14px; margin-bottom: 28px;
  }
  .hero-title {
    font-family: var(--fd); font-weight: 800;
    font-size: clamp(44px, 5.8vw, 74px);
    line-height: .97; letter-spacing: -.025em; color: #fff; margin-bottom: 10px;
  }
  .hero-title em { font-style: normal; color: #60a5fa; display: block; }
  .hero-sub { font-family: var(--fd); font-size: clamp(17px, 2vw, 22px); font-weight: 400; color: #93c5fd; margin-bottom: 24px; }
  .hero-desc { font-size: 15px; color: #bfdbfe; line-height: 1.8; max-width: 460px; margin-bottom: 40px; }
  .hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
  .btn-pri {
    background: #fff; color: var(--navy); border: 2px solid #fff;
    padding: 13px 30px; font-family: var(--fb); font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all .2s;
  }
  .btn-pri:hover { background: #dbeafe; border-color: #dbeafe; }
  .btn-ghost-white {
    background: transparent; color: #fff; border: 2px solid rgba(255,255,255,.3);
    padding: 13px 30px; font-family: var(--fb); font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all .2s;
  }
  .btn-ghost-white:hover { border-color: #fff; background: rgba(255,255,255,.07); }
  .hero-right {
    display: flex; align-items: center; justify-content: center;
    padding: 80px 7% 80px 20px; position: relative; z-index: 2;
  }
  .hcards { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 3px; }
  .hcard {
    background: rgba(255,255,255,.075); border: 1px solid rgba(255,255,255,.1);
    padding: 18px 22px; display: flex; align-items: center; gap: 16px; transition: background .2s;
  }
  .hcard:hover { background: rgba(255,255,255,.12); }
  .hcard-ico {
    width: 42px; height: 42px; background: rgba(96,165,250,.15);
    border: 1px solid rgba(96,165,250,.25); display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; color: #60a5fa;
  }
  .hcard-lbl { font-size: 11px; color: #7dd3fc; font-weight: 600; letter-spacing: .09em; text-transform: uppercase; margin-bottom: 2px; }
  .hcard-val { font-family: var(--fd); font-size: 19px; font-weight: 700; color: #fff; }

  /* ── MARQUEE ── */
  .mq { overflow: hidden; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--blue-xlt); padding: 11px 0; }
  .mq-inner { display: flex; gap: 52px; width: max-content; animation: mq 26s linear infinite; }
  .mq-item { font-size: 11.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--blue); white-space: nowrap; display: flex; align-items: center; gap: 12px; }
  @keyframes mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ── SECTIONS ── */
  .sec { padding: 96px 7%; }
  .sec-alt { background: var(--off); }
  .sec-navy { background: var(--navy); }
  .sec-gray { background: var(--gray); }

  .pill {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: var(--blue-mid); background: var(--blue-lt); padding: 5px 13px; margin-bottom: 14px;
  }
  .pill-wh { color: #93c5fd; background: rgba(255,255,255,.1); }
  .bar { width: 44px; height: 4px; background: var(--blue-mid); margin-bottom: 20px; }
  .bar-c { margin: 0 auto 20px; }
  .bar-wh { background: #60a5fa; }
  .h2 { font-family: var(--fd); font-weight: 800; font-size: clamp(28px, 3.6vw, 46px); line-height: 1.06; letter-spacing: -.02em; color: var(--dark); margin-bottom: 14px; }
  .h2-wh { color: #fff; }
  .lead { font-size: 15px; color: var(--slate); line-height: 1.82; max-width: 580px; }
  .lead-wh { color: #bfdbfe; }
  .txt-c { text-align: center; }
  .mx-a { margin-left: auto; margin-right: auto; }
  .mb-56 { margin-bottom: 56px; }

  /* ── TVET SPLIT ── */
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
  .split-top { align-items: start; }
  .body-text { font-size: 15px; color: var(--slate); line-height: 1.85; margin-bottom: 20px; }
  .ratio-row { display: flex; gap: 16px; margin-top: 28px; }
  .ratio-box { flex: 1; background: var(--blue-xlt); border: 1px solid var(--blue-lt); padding: 20px 16px; text-align: center; }
  .ratio-num { font-family: var(--fd); font-size: 36px; font-weight: 800; color: var(--navy); line-height: 1; }
  .ratio-lbl { font-size: 12px; color: var(--slate); margin-top: 4px; font-weight: 500; }
  .path-card { background: var(--white); border: 1px solid var(--border); border-top: 3px solid var(--blue-mid); padding: 32px 34px; box-shadow: var(--sm); }
  .path-card-title { font-family: var(--fd); font-weight: 700; font-size: 16px; color: var(--navy); margin-bottom: 20px; }
  .path-item { display: flex; align-items: center; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--border); }
  .path-item:last-child { border: none; }
  .path-ico { width: 36px; height: 36px; background: var(--blue-lt); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--blue-mid); }
  .path-txt strong { display: block; font-weight: 700; font-size: 14px; color: var(--dark); }
  .path-txt span { font-size: 12.5px; color: var(--slate); }
  .note-box { margin-top: 20px; padding: 16px 18px; background: var(--blue-xlt); border-left: 3px solid var(--blue-mid); }
  .note-box p { font-size: 13px; color: var(--slate); line-height: 1.75; }

  /* ── TVET IMAGE ── */
  .tvet-img-wrap {
    position: relative; display: flex; align-items: center; justify-content: center;
  }
  .tvet-img-frame {
    position: relative; width: 100%;
    border: 1px solid var(--border);
    box-shadow: var(--sl);
    overflow: hidden;
    background: var(--blue-xlt);
  }
  .tvet-img-frame img {
    width: 100%; height: auto; display: block;
    object-fit: cover;
    transition: transform .45s ease;
  }
  .tvet-img-frame:hover img { transform: scale(1.03); }

  /* ── BENEFIT CARDS ── */
  .cards6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .bcard {
    background: var(--white); border: 1px solid var(--border);
    padding: 30px 26px; position: relative; overflow: hidden;
    transition: transform .25s, box-shadow .25s, border-color .25s; cursor: default;
  }
  .bcard::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--blue-mid); transform: scaleX(0); transform-origin: left; transition: transform .3s;
  }
  .bcard:hover { transform: translateY(-4px); box-shadow: var(--sl); border-color: var(--blue-lt); }
  .bcard:hover::before { transform: scaleX(1); }
  .bcard-ico { width: 50px; height: 50px; background: var(--blue-lt); display: flex; align-items: center; justify-content: center; color: var(--blue-mid); margin-bottom: 18px; }
  .bcard-bg { position: absolute; right: 16px; top: 12px; font-family: var(--fd); font-size: 54px; font-weight: 800; color: rgba(15,43,110,.04); line-height: 1; user-select: none; }
  .bcard-title { font-family: var(--fd); font-size: 17px; font-weight: 700; color: var(--navy); margin-bottom: 8px; line-height: 1.2; }
  .bcard-desc { font-size: 13.5px; color: var(--slate); line-height: 1.75; }

  /* ── IMPACT ── */
  .impact3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
  .icard {
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
    padding: 44px 32px; text-align: center; transition: background .2s;
  }
  .icard:hover { background: rgba(255,255,255,.11); }
  .icard-ico { color: #60a5fa; display: flex; justify-content: center; margin-bottom: 14px; }
  .icard-num { font-family: var(--fd); font-size: 58px; font-weight: 800; color: #fff; line-height: 1; margin-bottom: 6px; }
  .icard-plus { color: #60a5fa; }
  .icard-lbl { font-size: 14px; color: #93c5fd; font-weight: 500; }
  .impact-quote { text-align: center; margin-top: 56px; padding: 0 8%; }
  .iq-text { font-family: var(--fd); font-size: clamp(20px, 2.5vw, 30px); font-weight: 700; color: #fff; line-height: 1.35; margin-bottom: 14px; }
  .iq-text em { font-style: normal; color: #60a5fa; }
  .iq-sub { font-size: 13.5px; color: #7dd3fc; }

  /* ── ELIGIBILITY ── */
  .elig4 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 40px; }
  .ecard {
    display: flex; align-items: flex-start; gap: 16px;
    background: var(--white); border: 1px solid var(--border);
    padding: 22px 22px; transition: border-color .2s, box-shadow .2s;
  }
  .ecard:hover { border-color: var(--blue-mid); box-shadow: var(--sh); }
  .ecard-num {
    width: 36px; height: 36px; flex-shrink: 0;
    background: var(--navy); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--fd); font-size: 15px; font-weight: 800;
  }
  .ecard-body strong { display: block; font-size: 14px; font-weight: 700; color: var(--dark); margin-bottom: 3px; }
  .ecard-body span { font-size: 13px; color: var(--slate); }

  /* ── JOURNEY ── */
  .journey { position: relative; margin-top: 60px; }
  .jline {
    position: absolute; top: 42px; left: calc(4% + 21px); right: calc(4% + 21px);
    height: 2px; background: var(--border); z-index: 0;
  }
  .jline-fill { height: 100%; background: linear-gradient(90deg, var(--navy), var(--blue-mid)); }
  .steps4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; position: relative; z-index: 1; padding: 0 4%; }
  .step { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .step-dot {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--navy); border: 3px solid var(--white);
    box-shadow: 0 0 0 3px var(--navy);
    display: flex; align-items: center; justify-content: center;
    color: #fff; margin-bottom: 22px; flex-shrink: 0; transition: transform .2s;
  }
  .step:hover .step-dot { transform: scale(1.13); }
  .step-dot.final { background: var(--blue-mid); box-shadow: 0 0 0 3px var(--blue-mid); }
  .scard {
    background: var(--white); border: 1px solid var(--border);
    padding: 22px 18px; width: 100%;
    box-shadow: var(--sh); transition: box-shadow .25s, transform .25s;
  }
  .step:hover .scard { box-shadow: var(--sm); transform: translateY(-3px); }
  .step-n { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--blue-mid); margin-bottom: 5px; }
  .step-t { font-family: var(--fd); font-size: 15px; font-weight: 800; color: var(--navy); margin-bottom: 8px; line-height: 1.2; }
  .step-dur {
    display: inline-block; background: var(--blue-lt); color: var(--blue);
    font-size: 11px; font-weight: 700; padding: 3px 10px; margin-bottom: 10px; letter-spacing: .04em;
  }
  .step-dur.gold { background: #fef3c7; color: #92400e; }
  .step-d { font-size: 12.5px; color: var(--slate); line-height: 1.65; }
  .total-pill {
    display: flex; justify-content: center; margin-top: 40px;
  }
  .total-inner {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--blue-lt); border: 1px solid var(--blue-mid);
    padding: 14px 28px; color: var(--navy); font-size: 14.5px; font-weight: 600;
  }

  /* ── CTA BANNER ── */
  .cta-banner {
    background: var(--blue-mid); padding: 72px 7%;
    display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: center;
  }
  .cta-t { font-family: var(--fd); font-size: clamp(24px, 3vw, 40px); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 8px; }
  .cta-s { font-size: 14.5px; color: rgba(255,255,255,.75); }
  .btn-wh {
    background: #fff; color: var(--blue-mid); border: 2px solid #fff;
    padding: 14px 36px; font-family: var(--fb); font-size: 14px; font-weight: 700;
    cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 8px; transition: all .2s;
  }
  .btn-wh:hover { background: var(--navy); color: #fff; border-color: var(--navy); }

  /* ── CONTACT ── */
  .contact2 { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; }
  .ci-row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 26px; }
  .ci-ico { width: 42px; height: 42px; background: var(--blue-lt); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--blue-mid); }
  .ci-body label { font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: var(--slate); font-weight: 600; }
  .ci-body p { font-size: 14.5px; color: var(--dark); margin-top: 2px; font-weight: 500; }
  .form-box { background: var(--off); border: 1px solid var(--border); padding: 34px 30px; }
  .form-title { font-family: var(--fd); font-size: 19px; font-weight: 700; color: var(--navy); margin-bottom: 22px; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .field label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--slate); }
  .field input, .field select, .field textarea {
    background: var(--white); border: 1.5px solid var(--border);
    color: var(--dark); font-family: var(--fb); font-size: 14px;
    padding: 10px 13px; outline: none; transition: border-color .2s;
    -webkit-appearance: none; border-radius: 0;
  }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--blue-mid); }
  .field select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 13px center; padding-right: 36px; cursor: pointer;
  }
  .field select option { background: #fff; }
  .btn-sub {
    background: var(--navy); color: #fff; border: none;
    padding: 13px 0; width: 100%; font-family: var(--fb); font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: .03em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .2s; margin-top: 4px;
  }
  .btn-sub:hover { background: var(--blue-mid); }

  /* ── FOOTER ── */
  .footer { background: var(--dark); padding: 60px 7% 32px; }
  .ft-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 44px; }
  .ft-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .ft-wname { font-family: var(--fd); font-weight: 800; font-size: 16px; color: #fff; }
  .ft-desc { font-size: 13px; color: #64748b; line-height: 1.75; max-width: 220px; }
  .ft-col h4 { font-family: var(--fd); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 14px; }
  .ft-col ul { list-style: none; display: flex; flex-direction: column; gap: 9px; }
  .ft-col ul a { font-size: 13px; color: #64748b; text-decoration: none; transition: color .2s; }
  .ft-col ul a:hover { color: #e2e8f0; }
  .ft-bot { border-top: 1px solid #1e293b; padding-top: 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .ft-bot p { font-size: 12px; color: #475569; }
  .socials { display: flex; gap: 8px; }
  .soc { width: 32px; height: 32px; border: 1px solid #1e293b; display: flex; align-items: center; justify-content: center; color: #475569; cursor: pointer; transition: all .2s; }
  .soc:hover { border-color: var(--blue-mid); color: var(--blue-mid); }
  .soc svg { width: 13px; height: 13px; }

  /* ── FADE-IN ── */
  .fi { opacity: 0; transform: translateY(18px); transition: opacity .55s ease, transform .55s ease; }
  .fi.in { opacity: 1; transform: translateY(0); }

  /* ── RESPONSIVE ── */
  @media (max-width: 960px) {
    .hero { grid-template-columns: 1fr; }
    .hero-right { display: none; }
    .split, .contact2 { grid-template-columns: 1fr; }
    .cards6, .impact3 { grid-template-columns: 1fr 1fr; }
    .steps4 { grid-template-columns: 1fr 1fr; }
    .jline { display: none; }
    .ft-top { grid-template-columns: 1fr 1fr; }
    .cta-banner { grid-template-columns: 1fr; }
    .cta-banner > div:last-child { display: flex; justify-content: center; }
    .sec { padding: 72px 6%; }
    .hero-left { padding: 64px 6%; }
  }
  @media (max-width: 600px) {
    .cards6, .impact3, .steps4, .elig4 { grid-template-columns: 1fr; }
    .row2, .ratio-row { grid-template-columns: 1fr; display: flex; flex-direction: column; }
    .ft-top { grid-template-columns: 1fr; }
  }
`;

/* ─── UTILS ─────────────────────────────────────────────────── */
function useCount(target, active, dur = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t0 = null;
    const frame = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setN(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [active, target, dur]);
  return n;
}

function FI({ children, delay = 0, style: s }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => el.classList.add("in"), delay); ob.disconnect(); } },
      { threshold: 0.07 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [delay]);
  return <div className="fi" ref={ref} style={s}>{children}</div>;
}

function ImpactCard({ target, label, Icon }) {
  const [active, setActive] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); ob.disconnect(); } },
      { threshold: 0.3 }
    );
    ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  const n = useCount(target, active);
  return (
    <div className="icard" ref={ref}>
      <div className="icard-ico"><Icon size={30} /></div>
      <div className="icard-num">{n}<span className="icard-plus">+</span></div>
      <div className="icard-lbl">{label}</div>
    </div>
  );
}

/* ─── DATA ───────────────────────────────────────────────────── */
const BENEFITS = [
  { Icon: BookOpen,   title: "Free Education" },
  { Icon: Wallet,     title: "Monthly Allowance RM 1,700" },
  { Icon: UserCheck,  title: "No Experience Required" },
  { Icon: Wrench,     title: "Hands-On Industry Experience" },
  { Icon: Briefcase,  title: "Career Opportunities" },
  { Icon: TrendingUp, title: "Clear Career Pathway" },
];

const ELIGIBILITY = [
  { title: "Malaysian Citizen",             desc: "Open to all Malaysian citizens regardless of race or background." },
  { title: "Aged 18 – 23 Years",            desc: "Applicants must be between 18 and 23 years old at the time of application." },
  { title: "Possess SPM Certificate",       desc: "Minimum qualification is Sijil Pelajaran Malaysia (SPM) or equivalent." },
  { title: "Attendance Above 80%",          desc: "A minimum attendance rate of 80% must be maintained throughout the programme." },
];

const STEPS = [
  { num: "Phase 1",    title: "Registration",                 dur: "Week 1-2",    gold: false, Icon: BookOpen,       desc: "Applicant registration." },
  { num: "Phase 2",    title: "Interview & Selection",        dur: "Week 3-4",    gold: false, Icon: Wrench,         desc: "Interview and selection process." },
  { num: "Phase 3",    title: "Active Learning Period",       dur: "6 Months",    gold: false, Icon: Award,          desc: "Learning and internship for 6 months." },
  { num: "Completion", title: "Evaluation & Certification",   dur: "Final Month", gold: true,  Icon: GraduationCap,  desc: "Final evaluation and certification." },
];

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function Homepage() {
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  

  return (
    <div className="vt">
      <style>{css}</style>

      {/* ── NAV — use your own Navbar component ─────────── */}
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-dots" />
        <div className="hero-glow" />

        <div className="hero-left">
          <div className="hero-chip">
            <BadgeCheck size={12} /> Industry-Driven Academy (ADI)
          </div>
          <h1 className="hero-title">
            NOT A
            <em>SECOND</em>
            CHOICE.
          </h1>
          <p className="hero-sub">K-Youth Programme Management System</p>
          <p className="hero-desc">
            A technical and vocational education pathway that combines direct industry-based learning —
            with monthly allowances, no tuition fees and no prior experience required.
          </p>
          <div className="hero-btns">
            <button className="btn-pri" onClick={() => { setOpen(false); navigate("/signup"); }}>
              Apply Now <ArrowRight size={15} />
            </button>
            <button className="btn-ghost-white" onClick={() => scrollTo("tvet")}>
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-right">
          <div className="hcards">
            {[
              { Icon: BookOpen,  lbl: "Tuition Fees",      val: "Fully Free" },
              { Icon: Wallet,    lbl: "Monthly Allowance", val: "RM 1,700" },
              { Icon: Building2, lbl: "Industry Partners", val: "40+ Companies" },
              { Icon: Clock,     lbl: "Total Duration",    val: "3 Years" },
            ].map(({ Icon, lbl, val }) => (
              <div className="hcard" key={lbl}>
                <div className="hcard-ico"><Icon size={19} /></div>
                <div>
                  <div className="hcard-lbl">{lbl}</div>
                  <div className="hcard-val">{val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS TVET ───────────────────────────────────── */}
      <section className="sec" id="tvet">
        <div className="split">

          {/* ── Left: text content ── */}
          <FI>
            <div className="pill"><BookOpen size={12} /> About Programme</div>
            <div className="bar" />
            <h2 className="h2">What is K-Youth Programme Management System?</h2>

            <p className="body-text">
              The K-Youth Programme Management System is a collaborative initiative by Khazanah Nasional
              with Vitrox Academy designed to streamline the management and delivery of technical and
              vocational education and training programs for young individuals.
            </p>

            <p className="body-text">
              The K-Youth Programme Management System journey provides basic technical knowledge, soft skills,
              and workplace readiness through the <strong>"Work While Learning"</strong> approach.
              Upon completion, students can continue towards nationally recognised qualifications.
            </p>

            <div className="ratio-row">
              {[
                { n: "2 months", lbl: "Theoretical Sessions at Academy" },
                { n: "4 months", lbl: "Learning in Industry" },
              ].map(({ n, lbl }) => (
                <div className="ratio-box" key={n}>
                  <div className="ratio-num">{n}</div>
                  <div className="ratio-lbl">{lbl}</div>
                </div>
              ))}
            </div>
          </FI>

          {/* ── Right: Khazanah K-Youth image ── */}
          <FI delay={120}>
            <div className="tvet-img-wrap">
              <div className="tvet-img-frame">
                <img
                  src="https://www.khazanah.com.my/media/uploads/2026/03/kyouth-en.png"
                  alt="K-Youth Programme by Khazanah Nasional"
                  loading="auto"
                />
              </div>
            </div>
          </FI>

        </div>
      </section>

      {/* ── BENEFIT CARDS ─────────────────────────────────── */}
      <section className="sec sec-alt" id="benefits">
        <FI>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="pill" style={{ justifyContent: "center" }}>
              <Target size={12} /> Program Benefits
            </div>
            <div className="bar bar-c" />
            <h2 className="h2 txt-c">Why Choose K-Youth Programme Management System?</h2>
            <p className="lead txt-c mx-a">
              Our program is designed to give you everything you need — without barriers,
              without financial pressure.
            </p>
          </div>
        </FI>
        <div className="cards6">
          {BENEFITS.map(({ Icon, title }, i) => (
            <FI key={i} delay={i * 65}>
              <div className="bcard">
                <div className="bcard-bg">0{i + 1}</div>
                <div className="bcard-ico"><Icon size={22} /></div>
                <div className="bcard-title">{title}</div>
              </div>
            </FI>
          ))}
        </div>
      </section>

      {/* ── OUR IMPACT ────────────────────────────────────── */}
      <section className="sec sec-navy" id="impact">
        <FI>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="pill pill-wh" style={{ justifyContent: "center" }}>
              <Star size={12} /> Our Impact
            </div>
            <div className="bar bar-c bar-wh" />
            <h2 className="h2 h2-wh txt-c">Not a Second Choice.</h2>
            <p className="lead lead-wh txt-c mx-a">
              These numbers reflect the industry's confidence and the success of our students
              who have chosen the TVET pathway with ViTrox.
            </p>
          </div>
        </FI>
        <div className="impact3">
          <ImpactCard target={40}  label="Industry Partners"    Icon={Building2} />
          <ImpactCard target={750} label="Registered Students"  Icon={Users} />
          <ImpactCard target={15}  label="Skilled Instructors"  Icon={GraduationCap} />
        </div>
        <FI delay={180}>
          <div className="impact-quote">
            <p className="iq-text">
              We believe TVET is the <em>first choice</em> — not an alternative — for those who want to build a strong and meaningful technical career.
            </p>
            <p className="iq-sub">— ViTrox Academy, Batu Kawan, Pulau Pinang</p>
          </div>
        </FI>
      </section>

      {/* ── ELIGIBILITY ───────────────────────────────────── */}
      <section className="sec">
        <div className="split split-top">
          <FI>
            <div className="pill"><CheckCircle size={12} /> Eligibility Criteria</div>
            <div className="bar" />
            <h2 className="h2">Are You Eligible?</h2>
            <p className="lead">
              This programme is open to SPM graduates who are passionate about building a technical career.
              Check the minimum requirements below.
            </p>
          </FI>
          <div />
        </div>
        <div className="elig4">
          {ELIGIBILITY.map(({ title, desc }, i) => (
            <FI key={i} delay={i * 60}>
              <div className="ecard">
                <div className="ecard-num">{i + 1}</div>
                <div className="ecard-body">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            </FI>
          ))}
        </div>
      </section>

      {/* ── JOURNEY ───────────────────────────────────────── */}
      <section className="sec sec-gray" id="journey">
        <FI>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="pill" style={{ justifyContent: "center" }}>
              <Flag size={12} /> Your Journey
            </div>
            <div className="bar bar-c" />
            <h2 className="h2 txt-c">From Student to Graduate</h2>
            <p className="lead txt-c mx-a">
              Three years. Four steps. A strong technical career in Malaysia's industry.
            </p>
          </div>
        </FI>

        <div className="journey">
          <div className="jline"><div className="jline-fill" /></div>
          <div className="steps4">
            {STEPS.map(({ num, title, dur, gold, Icon, desc }, i) => (
              <FI key={i} delay={i * 90}>
                <div className="step">
                  <div className={`step-dot${i === 3 ? " final" : ""}`}>
                    <Icon size={19} />
                  </div>
                  <div className="scard">
                    <div className="step-n">{num}</div>
                    <div className="step-t">{title}</div>
                    <div className={`step-dur${gold ? " gold" : ""}`}>{dur}</div>
                    <p className="step-d">{desc}</p>
                  </div>
                </div>
              </FI>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="footer">
        <div className="ft-top">
          <div>
            <div className="ft-logo">
              <div className="ft-wname">ViTrox TVET</div>
            </div>
            <p className="ft-desc">
              Industry-Driven Academy (ADI) — developing highly skilled technicians
              for Malaysia's technology industry through work-based education.
            </p>
          </div>
          <div className="ft-col">
            <h4>Program</h4>
            <ul>
              <li><a href="#">TVET Programme</a></li>
              <li><a href="#">ADI — SKM 2 & 3</a></li>
              <li><a href="#">DKM Diploma</a></li>
              <li><a href="#">K-Youth BOLTS</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Academy</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Teaching Staff</a></li>
              <li><a href="#">ViTrox College</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">News & Updates</a></li>
              <li><a href="#">STEM Education</a></li>
              <li><a href="#">HRDCorp Training</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="ft-bot">
          <p>© 2025 ViTrox Academy Sdn Bhd 202001005007 (1361327-U) · DK350(P) · Batu Kawan, Pulau Pinang</p>
          <div className="socials">
            {[
              { label: "Instagram", d: "M17.5 0C19.43 0 21.23.8 22.53 2.11 23.8 3.38 24.61 5.14 24.61 7.07v10.86c0 1.93-.81 3.69-2.08 4.96C21.23 24.2 19.43 25 21.28 25H7.14C5.21 25 3.41 24.2 2.11 22.89.8 21.62 0 19.86 0 17.93V7.07C0 5.14.8 3.38 2.11 2.11 3.41.8 5.21 0 7.14 0zM12.3 6.3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm6.6-.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm-6.6 2.6a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" },
              { label: "Facebook",  d: "M22.68 0H2.32C1.04 0 0 1.04 0 2.32v20.36C0 23.96 1.04 25 2.32 25h11V15.33H9.97V11.5h3.35V8.73c0-3.33 2.04-5.14 5-5.14 1.42 0 2.64.1 3 .15v3.5h-2.06c-1.62 0-1.93.77-1.93 1.9V11.5h3.85l-.5 3.83h-3.35V25h6.56C23.96 25 25 23.96 25 22.68V2.32C25 1.04 23.96 0 22.68 0z" },
              { label: "YouTube",   d: "M24.5 7.4s-.24-1.68-.99-2.42c-.95-.99-2-.99-2.49-1.05C18.04 3.75 12.5 3.75 12.5 3.75s-5.54 0-8.52.18c-.49.06-1.54.06-2.49 1.05C.74 5.72.5 7.4.5 7.4S.25 9.36.25 11.32v1.85c0 1.96.25 3.92.25 3.92s.24 1.68.99 2.42c.95.99 2.19.96 2.74 1.06C5.32 20.75 12.5 20.75 12.5 20.75s5.54 0 8.52-.2c.49-.06 1.54-.06 2.49-1.04.75-.74.99-2.42.99-2.42s.25-1.96.25-3.92v-1.85C24.75 9.36 24.5 7.4 24.5 7.4zM10.2 14.98V9.77l6.71 2.62-6.71 2.59z" },
              { label: "LinkedIn",  d: "M.56 3.13C.56 1.4 1.97 0 3.72 0h17.56C23.03 0 24.44 1.4 24.44 3.13v18.74C24.44 23.6 23.03 25 21.28 25H3.72C1.97 25 .56 23.6.56 21.87V3.13zM7.87 21.07V9.69H4.23v11.38h3.64zm-1.82-12.93c1.27 0 2.06-.85 2.06-1.9-.02-1.08-.79-1.9-2.04-1.9S3.99 5.19 3.99 6.24c0 1.05.79 1.9 2.04 1.9h.02zm5.37 12.93V15c0-.33.02-.65.12-.88.27-.65.87-1.32 1.89-1.32 1.33 0 1.86.99 1.86 2.44v5.83h3.64v-6.25c0-3.37-1.8-4.94-4.2-4.94-1.97 0-2.83 1.1-3.31 1.84v.04h-.02l.02-.04V9.69H8.25c.05 1.04 0 11.38 0 11.38h3.17z" },
            ].map(({ label, d }) => (
              <div className="soc" key={label} role="button" aria-label={label}>
                <svg viewBox="0 0 25 25" fill="currentColor"><path d={d} /></svg>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}