import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LanguageSwitcher from "../../components/shared/LanguageSwitcher"
import { CalendarDays, Image, FileText, Wallet, Users, Bell, Bot, Check, X, ChevronDown, Menu, Shield } from "lucide-react"
import "./Landing.css"

const Landing = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [billing, setBilling] = useState("monthly")
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal")
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("lp-revealed"); io.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [menuOpen])

  const prices = {
    monthly: {
      basic: "$6.99", basicP: t("pricing.per_month"),
      pro: "$11.99", proP: t("pricing.per_month"),
    },
    annual: {
      basic: "$67", basicP: t("pricing.per_year"),
      pro: "$115", proP: t("pricing.per_year"),
    }
  }

  const p = prices[billing]

  const features = [
    { icon: CalendarDays, stroke: "#F5A623", bg: "rgba(245,166,35,0.12)", title: t("features.planner_title"),    desc: t("features.planner_desc")    },
    { icon: Image,        stroke: "#FF6B7A", bg: "rgba(255,107,122,0.12)", title: t("features.feed_title"),       desc: t("features.feed_desc")       },
    { icon: FileText,     stroke: "#3B7DE8", bg: "rgba(59,125,232,0.12)",  title: t("features.quotes_title"),     desc: t("features.quotes_desc")     },
    { icon: Wallet,       stroke: "#c18c35", bg: "rgba(193,140,53,0.12)",  title: t("features.accounting_title"), desc: t("features.accounting_desc") },
    { icon: Users,        stroke: "#22C55E", bg: "rgba(34,197,94,0.12)",   title: t("features.team_title"),       desc: t("features.team_desc")       },
    { icon: Bell,         stroke: "#F59E0B", bg: "rgba(245,158,11,0.12)",  title: t("features.reminders_title"),  desc: t("features.reminders_desc")  },
  ]

  const testimonials = [
    { initial: "M", name: "María G.",  role: "Community Manager",    text: t("testimonials.t1") },
    { initial: "C", name: "Carlos R.", role: "Social Media Manager",  text: t("testimonials.t2") },
    { initial: "A", name: "Andrea M.", role: "Directora de Agencia",  text: t("testimonials.t3") },
  ]

  const faqs = [
    [t("faq.q1"), t("faq.a1")],
    [t("faq.q2"), t("faq.a2")],
    [t("faq.q3"), t("faq.a3")],
    [t("faq.q4"), t("faq.a4")],
    [t("faq.q5"), t("faq.a5")],
  ]

  const navLinks = [
    { href: "#features", label: t("nav.features") },
    { href: "#ia",       label: t("nav.ai")       },
    { href: "#pricing",  label: t("nav.pricing")  },
    { href: "#faq",      label: t("nav.faq")      },
  ]

  return (
    <div className="lp">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? "scrolled" : ""}`}>
        <a href="/" className="lp-nav-logo">
          <img src="/logos/logo.png" alt="Stratega Planner" />
          Stratega Planner
        </a>

        <ul className="lp-nav-links">
          {navLinks.map(l => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>

        <div className="lp-nav-right">
          <LanguageSwitcher variant="landing" />
          <a className="lp-nav-login" onClick={() => navigate("/login")}>{t("nav.login")}</a>
          <button className="lp-nav-cta" onClick={() => navigate("/register")}>{t("nav.start")}</button>
          {/* Hamburger — solo visible en mobile */}
          <button
            className="lp-hamburger"
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lp-mobile-menu" onClick={e => e.stopPropagation()}>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
          ))}
          <div className="lp-mobile-menu-actions">
            <button className="lp-mobile-login" onClick={() => { setMenuOpen(false); navigate("/login") }}>{t("nav.login")}</button>
            <button className="lp-mobile-cta" onClick={() => { setMenuOpen(false); navigate("/register") }}>{t("nav.start")}</button>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          {t("hero.badge")}
        </div>
        <h1>{t("hero.title1")}<br />{t("hero.title2")} <span className="lp-gradient-text">{t("hero.title3")}</span></h1>
        <p>{t("hero.subtitle")}</p>
        <div className="lp-hero-btns">
          <button className="lp-btn-primary" onClick={() => navigate("/register")}>{t("hero.cta_primary")}</button>
          <a href="#features" className="lp-btn-secondary">{t("hero.cta_secondary")}</a>
        </div>
        <p className="lp-hero-trust">{t("hero.trust")}</p>

        <div className="lp-download-badges">
          <a href="#" className="lp-download-btn" aria-label="Descargar en App Store">
            <svg width="22" height="22" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.6 136.4-317 270.5-317 99.5 0 182.4 65.4 238.4 65.4 54.3 0 140.4-69 248.3-69 37.1 0 166.3 3.2 247.5 137.9zm-136.9-130.2c-10.9-52.5-31.6-107-68.1-150.7-51-58.7-120.9-97.5-185.3-97.5-4.5 0-9.1.4-13.6.9 0 0 .6 50.4 26.1 100.3 18.5 36.2 49.2 75.8 91.7 103.7 38.9 25.9 90.8 42.3 149.2 43.3z"/>
            </svg>
            <div>
              <span className="lp-download-sub">Disponible en</span>
              <span className="lp-download-store">App Store</span>
            </div>
          </a>
          <a href="#" className="lp-download-btn" aria-label="Descargar en Google Play">
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
              <path fill="#4CAF50" d="M42.6 20.3c2.4 1.4 2.4 4.9 0 6.4L34.2 31.6l-9.2-7.6 9.2-7.6 8.4 3.9z"/>
              <path fill="#F44336" d="M5.4 4.5C5 4.7 4.7 5.1 4.7 5.6v37c0 .5.3.9.7 1.1L24 24 5.4 4.5z"/>
              <path fill="#2196F3" d="M34.2 15.4L5.4 4.5c-.3-.1-.7-.1-1 .1L24 24l10.2-8.6z"/>
              <path fill="#FFC107" d="M5.4 43.7c.3.2.7.2 1 .1l28.8-10.9L24 24 5.4 43.7z"/>
            </svg>
            <div>
              <span className="lp-download-sub">Disponible en</span>
              <span className="lp-download-store">Google Play</span>
            </div>
          </a>
        </div>

        <div className="lp-preview">
          <div className="lp-preview-frame">
            <div className="lp-preview-dots">
              <div className="lp-preview-dot" style={{background:"#FF5F57"}} />
              <div className="lp-preview-dot" style={{background:"#FEBC2E"}} />
              <div className="lp-preview-dot" style={{background:"#28C840"}} />
            </div>
            <div className="lp-preview-inner">
              <div className="lp-preview-sidebar">
                <div className="lp-preview-logo">
                  <img src="/logos/logo.png" alt="" />
                  <span>Stratega</span>
                </div>
                {[t("sidebar.dashboard"),t("sidebar.planner"),t("sidebar.feed"),t("sidebar.quotes"),t("sidebar.accounting"),t("sidebar.team")].map((item, i) => (
                  <div key={item} className={`lp-preview-item ${i === 0 ? "active" : ""}`}>
                    <div className="lp-preview-item-icon" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="lp-preview-main">
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-stat" style={{color:"#F5A623"}}>$2,450</div>
                  <div className="lp-preview-sublabel">{t("dashboard.monthly_balance")}</div>
                </div>
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-stat" style={{color:"#8B5CF6"}}>18</div>
                  <div className="lp-preview-sublabel">{t("dashboard.posts_planned")}</div>
                </div>
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-stat" style={{color:"#FF6B7A"}}>5</div>
                  <div className="lp-preview-sublabel">{t("dashboard.reminders_active")}</div>
                </div>
                <div className="lp-preview-card wide">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-bars">
                    {[70,45,85,60,90,55,75].map((h,i) => (
                      <div key={i} className="lp-preview-bar" style={{height:`${h}%`, background: i===4 ? "rgba(245,166,35,0.55)" : "rgba(96,34,236,0.35)"}} />
                    ))}
                  </div>
                </div>
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-grid">
                    {["rgba(245,166,35,0.35)","rgba(255,107,122,0.35)","rgba(45,110,197,0.35)","rgba(96,34,236,0.35)","rgba(245,166,35,0.25)","rgba(255,107,122,0.25)"].map((bg,i) => (
                      <div key={i} className="lp-preview-grid-cell" style={{background:bg}} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href="#features" className="lp-scroll-hint" aria-label="Scroll">
          <ChevronDown size={18} strokeWidth={1.5} />
        </a>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="lp-stats">
        {[["10+", t("stats.modules")],["100%", t("stats.cloud")],["AI", t("stats.ai")],["7", t("stats.trial")]].map(([n,l], i) => (
          <div key={l} className={`lp-stat lp-reveal lp-reveal--d${i+1}`}>
            <div className="lp-stat-num">{n}</div>
            <div className="lp-stat-label">{l}</div>
          </div>
        ))}
      </div>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-section-tag lp-reveal">{t("features.tag")}</div>
        <h2 className="lp-section-title lp-reveal lp-reveal--d1">{t("features.title")}</h2>
        <p className="lp-section-sub lp-reveal lp-reveal--d2">{t("features.subtitle")}</p>
        <div className="lp-features-grid">
          {features.map((f, i) => (
            <div key={f.title} className={`lp-feat-card lp-reveal lp-reveal--d${i+1}`}>
              <div className="lp-feat-icon" style={{background:f.bg}}>
                <f.icon size={20} color={f.stroke} strokeWidth={1.7} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI ───────────────────────────────────────────────────────── */}
      <section className="lp-section" id="ia">
        <div className="lp-ai-card">
          <div className="lp-reveal lp-reveal--left">
            <div className="lp-section-tag" style={{textAlign:"left",marginBottom:"12px"}}>{t("ai_section.tag")}</div>
            <h2>{t("ai_section.title")}</h2>
            <p className="lp-ai-desc">{t("ai_section.subtitle")}</p>
            <div className="lp-ai-features">
              {[t("ai_section.feat1"),t("ai_section.feat2"),t("ai_section.feat3"),t("ai_section.feat4")].map(f => (
                <div key={f} className="lp-ai-feat">
                  <div className="lp-ai-check"><Check size={10} strokeWidth={2.5} /></div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="lp-chat-box lp-reveal lp-reveal--right">
            <div className="lp-chat-label">Strat AI</div>
            <div className="lp-chat-bubble">
              <div className="lp-chat-avatar"><Bot size={14} color="white" strokeWidth={1.8} /></div>
              <div className="lp-chat-msg">{t("ai_section.chat_msg1")}</div>
            </div>
            <div className="lp-chat-bubble lp-chat-bubble--user">
              <div className="lp-chat-msg user">{t("ai_section.chat_user1")}</div>
            </div>
            <div className="lp-chat-bubble">
              <div className="lp-chat-avatar"><Bot size={14} color="white" strokeWidth={1.8} /></div>
              <div className="lp-chat-msg">{t("ai_section.chat_msg2")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="lp-section lp-pricing" id="pricing">
        <div className="lp-section-tag lp-reveal">{t("pricing.tag")}</div>
        <h2 className="lp-section-title lp-reveal lp-reveal--d1">{t("pricing.title")}</h2>
        <p className="lp-section-sub lp-reveal lp-reveal--d2">{t("pricing.subtitle")}</p>
        <div className="lp-toggle lp-reveal lp-reveal--d3">
          <button className={`lp-toggle-btn ${billing === "monthly" ? "active" : ""}`} onClick={() => setBilling("monthly")}>{t("pricing.monthly")}</button>
          <button className={`lp-toggle-btn ${billing === "annual" ? "active" : ""}`} onClick={() => setBilling("annual")}>
            {t("pricing.annual")} <span className="lp-save-badge">{t("pricing.save")}</span>
          </button>
        </div>
        <div className="lp-plans">
          <div className="lp-plan lp-reveal lp-reveal--d4">
            <div className="lp-plan-name">{t("pricing.basic_name")}</div>
            <div className="lp-plan-desc">{t("pricing.basic_desc")}</div>
            <div className="lp-plan-price">{p.basic}</div>
            <div className="lp-plan-period">{p.basicP}</div>
            <ul className="lp-plan-features">
              {[[true,t("pricing.feat_planner")],[true,t("pricing.feat_feed")],[true,t("pricing.feat_reminders")],[true,t("pricing.feat_folders")],[true,t("pricing.feat_members3")],[false,t("pricing.feat_quotes")],[false,t("pricing.feat_accounting")],[false,t("pricing.feat_ai")]].map(([yes,label]) => (
                <li key={label} className={yes ? "yes" : ""}><span className="lp-feat-ico">{yes ? <Check size={13} color="#22c55e" strokeWidth={2.5} /> : <X size={13} color="#CBD5E1" strokeWidth={2} />}</span>{label}</li>
              ))}
            </ul>
            <button onClick={() => navigate("/subscription")} className="lp-plan-cta secondary">{t("pricing.start_free")}</button>
            <div className="lp-plan-trial">{t("pricing.trial_note")}</div>
          </div>
          <div className="lp-plan featured lp-reveal lp-reveal--d5">
            <div className="lp-plan-badge">{t("pricing.popular")}</div>
            <div className="lp-plan-name">{t("pricing.pro_name")}</div>
            <div className="lp-plan-desc">{t("pricing.pro_desc")}</div>
            <div className="lp-plan-price">{p.pro}</div>
            <div className="lp-plan-period">{p.proP}</div>
            <ul className="lp-plan-features">
              {[[true,t("pricing.feat_all_basic")],[true,t("pricing.feat_quotes_pdf")],[true,t("pricing.feat_full_accounting")],[true,t("pricing.feat_ai_integrated")],[true,t("pricing.feat_unlimited_members")],[true,t("pricing.feat_storage")],[true,t("pricing.feat_support")],[true,t("pricing.feat_first")]].map(([yes,label]) => (
                <li key={label} className={yes ? "yes" : ""}><span className="lp-feat-ico">{yes ? <Check size={13} color="#22c55e" strokeWidth={2.5} /> : <X size={13} color="#CBD5E1" strokeWidth={2} />}</span>{label}</li>
              ))}
            </ul>
            <button onClick={() => navigate("/subscription")} className="lp-plan-cta primary">{t("pricing.start_free_arrow")}</button>
            <div className="lp-plan-trial">{t("pricing.trial_note")}</div>
          </div>
        </div>

        {/* Garantía */}
        <div className="lp-guarantee lp-reveal lp-reveal--d6">
          <Shield size={22} color="#c18c35" strokeWidth={1.5} />
          <h3>{t("pricing.guarantee_title")}</h3>
          <p>{t("pricing.guarantee_desc")}</p>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-section-tag lp-reveal">{t("testimonials.tag")}</div>
        <h2 className="lp-section-title lp-reveal lp-reveal--d1" style={{marginBottom:"44px"}}>{t("testimonials.title")}</h2>
        <div className="lp-testimonials-grid">
          {testimonials.map((tst, i) => (
            <div key={tst.name} className={`lp-testi lp-reveal lp-reveal--d${i+1}`}>
              <p className="lp-testi-text">"{tst.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-author-initial">{tst.initial}</div>
                <div>
                  <div className="lp-author-name">{tst.name}</div>
                  <div className="lp-author-role">{tst.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="lp-section" id="faq">
        <div className="lp-section-tag lp-reveal">{t("faq.tag")}</div>
        <h2 className="lp-section-title lp-reveal lp-reveal--d1" style={{marginBottom:"40px"}}>{t("faq.title")}</h2>
        <div className="lp-faq-wrap">
          {faqs.map(([q, a], i) => (
            <div
              key={q}
              className={`lp-faq-item lp-reveal lp-reveal--d${Math.min(i+1,6)} ${openFaq === i ? "open" : ""}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="lp-faq-header">
                <span className="lp-faq-q">{q}</span>
                <span className="lp-faq-chevron">
                  <ChevronDown size={16} strokeWidth={2} />
                </span>
              </div>
              <div className="lp-faq-body">
                <div className="lp-faq-a">{a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────── */}
      <div className="lp-cta-final lp-reveal">
        <h2>{t("cta_final.title1")} <span className="lp-gradient-text">{t("cta_final.title2")}</span></h2>
        <p className="lp-cta-desc">{t("cta_final.subtitle")}</p>
        <button className="lp-btn-primary" style={{fontSize:"15px",padding:"16px 36px"}} onClick={() => navigate("/register")}>
          {t("cta_final.btn")}
        </button>
        <p className="lp-sub-note">{t("cta_final.note")}</p>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <img src="/logos/logo.png" alt="Stratega Planner" />
          Stratega Planner
        </div>
        <ul className="lp-footer-links">
          <li><a href="/terms">{t("footer.terms")}</a></li>
          <li><a href="/privacy">{t("footer.privacy")}</a></li>
          <li><a href="/refunds">{t("footer.refunds") || "Reembolsos"}</a></li>
          <li><a href="/support">{t("footer.support")}</a></li>
          <li><a href="/contact">{t("footer.contact")}</a></li>
        </ul>
        <div className="lp-footer-copy">{t("footer.copy")}</div>
      </footer>
    </div>
  )
}

export default Landing
