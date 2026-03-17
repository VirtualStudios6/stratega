import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LanguageSwitcher from "../../components/shared/LanguageSwitcher"
import "./Landing.css"

const Landing = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [billing, setBilling] = useState("monthly")

  const prices = {
    monthly: {
      basic: "$6.99", basicP: t("pricing.per_month"),
      pro: "$11.99", proP: t("pricing.per_month"),
      basicUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364736",
      proUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364765"
    },
    annual: {
      basic: "$67", basicP: t("pricing.per_year"),
      pro: "$115", proP: t("pricing.per_year"),
      basicUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364756",
      proUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364779"
    }
  }

  const p = prices[billing]

  const features = [
    { icon: "📅", color: "rgba(245,166,35,0.15)", title: t("features.planner_title"), desc: t("features.planner_desc") },
    { icon: "🖼️", color: "rgba(255,107,122,0.15)", title: t("features.feed_title"),   desc: t("features.feed_desc") },
    { icon: "📄", color: "rgba(45,110,197,0.15)",  title: t("features.quotes_title"), desc: t("features.quotes_desc") },
    { icon: "💰", color: "rgba(96,34,236,0.15)",   title: t("features.accounting_title"), desc: t("features.accounting_desc") },
    { icon: "👥", color: "rgba(34,197,94,0.15)",   title: t("features.team_title"),   desc: t("features.team_desc") },
    { icon: "🔔", color: "rgba(245,166,35,0.15)",  title: t("features.reminders_title"), desc: t("features.reminders_desc") },
  ]

  const testimonials = [
    { initial: "M", grad: "135deg,#F5A623,#FF6B7A", name: "María González",  role: "Community Manager",   text: t("testimonials.t1") },
    { initial: "C", grad: "135deg,#6022EC,#8B5CF6", name: "Carlos Ramírez",  role: "Social Media Manager", text: t("testimonials.t2") },
    { initial: "A", grad: "135deg,#2D6EC5,#FF6B7A", name: "Andrea Morales",  role: "Directora de Agencia", text: t("testimonials.t3") },
  ]

  const faqs = [
    [t("faq.q1"), t("faq.a1")],
    [t("faq.q2"), t("faq.a2")],
    [t("faq.q3"), t("faq.a3")],
    [t("faq.q4"), t("faq.a4")],
    [t("faq.q5"), t("faq.a5")],
  ]

  return (
    <div className="lp">

      <nav className="lp-nav">
        <a href="/" className="lp-nav-logo">
          <img src="/logos/logo.png" alt="Stratega Planner" />
          Stratega Planner
        </a>
        <ul className="lp-nav-links">
          <li><a href="#features">{t("nav.features")}</a></li>
          <li><a href="#ia">{t("nav.ai")}</a></li>
          <li><a href="#pricing">{t("nav.pricing")}</a></li>
          <li><a href="#faq">{t("nav.faq")}</a></li>
        </ul>
        <div className="lp-nav-right">
          <LanguageSwitcher variant="landing" />
          <button className="lp-nav-cta" onClick={() => navigate("/login")}>{t("nav.login")}</button>
        </div>
      </nav>

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
                      <div key={i} className="lp-preview-bar" style={{height:`${h}%`, background: i===4 ? "rgba(245,166,35,0.6)" : "rgba(96,34,236,0.45)"}} />
                    ))}
                  </div>
                </div>
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-grid">
                    {["rgba(245,166,35,0.4)","rgba(255,107,122,0.4)","rgba(45,110,197,0.4)","rgba(96,34,236,0.4)","rgba(245,166,35,0.3)","rgba(255,107,122,0.3)"].map((bg,i) => (
                      <div key={i} className="lp-preview-grid-cell" style={{background:bg}} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-stats">
        {[["10+", t("stats.modules")],["100%", t("stats.cloud")],["AI", t("stats.ai")],["7", t("stats.trial")]].map(([n,l]) => (
          <div key={l} className="lp-stat">
            <div className="lp-stat-num">{n}</div>
            <div className="lp-stat-label">{l}</div>
          </div>
        ))}
      </div>

      <section className="lp-section" id="features">
        <div className="lp-section-tag">{t("features.tag")}</div>
        <h2 className="lp-section-title">{t("features.title")}</h2>
        <p className="lp-section-sub">{t("features.subtitle")}</p>
        <div className="lp-features-grid">
          {features.map(f => (
            <div key={f.title} className="lp-feat-card">
              <div className="lp-feat-icon" style={{background:f.color}}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="ia">
        <div className="lp-ai-card">
          <div>
            <div className="lp-section-tag" style={{textAlign:"left",marginBottom:"12px"}}>{t("ai_section.tag")}</div>
            <h2>{t("ai_section.title")}</h2>
            <p className="lp-ai-desc">{t("ai_section.subtitle")}</p>
            <div className="lp-ai-features">
              {[t("ai_section.feat1"),t("ai_section.feat2"),t("ai_section.feat3"),t("ai_section.feat4")].map(f => (
                <div key={f} className="lp-ai-feat">
                  <div className="lp-ai-check">✓</div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="lp-chat-box">
            <div className="lp-chat-label">Strat AI</div>
            <div className="lp-chat-bubble">
              <div className="lp-chat-avatar">🤖</div>
              <div className="lp-chat-msg">¡Hola! Analicé tu feed. Tienes 3 posts con bajo engagement. Te recomiendo alternar colores cálidos y fríos ✨</div>
            </div>
            <div className="lp-chat-bubble" style={{justifyContent:"flex-end"}}>
              <div className="lp-chat-msg user">¿Cuánto debería cobrar por un paquete de social media?</div>
            </div>
            <div className="lp-chat-bubble">
              <div className="lp-chat-avatar">🤖</div>
              <div className="lp-chat-msg">Básico $300–500/mes (3 redes, 12 posts), Pro $600–900/mes (5 redes, 20 posts + stories) 💡</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-pricing" id="pricing">
        <div className="lp-section-tag">{t("pricing.tag")}</div>
        <h2 className="lp-section-title">{t("pricing.title")}</h2>
        <p className="lp-section-sub">{t("pricing.subtitle")}</p>
        <div className="lp-toggle">
          <button className={`lp-toggle-btn ${billing === "monthly" ? "active" : ""}`} onClick={() => setBilling("monthly")}>{t("pricing.monthly")}</button>
          <button className={`lp-toggle-btn ${billing === "annual" ? "active" : ""}`} onClick={() => setBilling("annual")}>
            {t("pricing.annual")} <span className="lp-save-badge">{t("pricing.save")}</span>
          </button>
        </div>
        <div className="lp-plans">
          <div className="lp-plan">
            <div className="lp-plan-name">{t("pricing.basic_name")}</div>
            <div className="lp-plan-desc">{t("pricing.basic_desc")}</div>
            <div className="lp-plan-price">{p.basic}</div>
            <div className="lp-plan-period">{p.basicP}</div>
            <ul className="lp-plan-features">
              {[[true,t("pricing.feat_planner")],[true,t("pricing.feat_feed")],[true,t("pricing.feat_reminders")],[true,t("pricing.feat_folders")],[true,t("pricing.feat_members3")],[false,t("pricing.feat_quotes")],[false,t("pricing.feat_accounting")],[false,t("pricing.feat_ai")]].map(([yes,label]) => (
                <li key={label} className={yes ? "yes" : ""}><span className="lp-feat-ico">{yes ? "✅" : "❌"}</span>{label}</li>
              ))}
            </ul>
            <a href={p.basicUrl} target="_blank" rel="noreferrer" className="lp-plan-cta secondary">{t("pricing.start_free")}</a>
            <div className="lp-plan-trial">{t("pricing.trial_note")}</div>
          </div>
          <div className="lp-plan featured">
            <div className="lp-plan-badge">{t("pricing.popular")}</div>
            <div className="lp-plan-name">{t("pricing.pro_name")}</div>
            <div className="lp-plan-desc">{t("pricing.pro_desc")}</div>
            <div className="lp-plan-price">{p.pro}</div>
            <div className="lp-plan-period">{p.proP}</div>
            <ul className="lp-plan-features">
              {[[true,t("pricing.feat_all_basic")],[true,t("pricing.feat_quotes_pdf")],[true,t("pricing.feat_full_accounting")],[true,t("pricing.feat_ai_integrated")],[true,t("pricing.feat_unlimited_members")],[true,t("pricing.feat_storage")],[true,t("pricing.feat_support")],[true,t("pricing.feat_first")]].map(([yes,label]) => (
                <li key={label} className={yes ? "yes" : ""}><span className="lp-feat-ico">{yes ? "✅" : "❌"}</span>{label}</li>
              ))}
            </ul>
            <a href={p.proUrl} target="_blank" rel="noreferrer" className="lp-plan-cta primary">{t("pricing.start_free_arrow")}</a>
            <div className="lp-plan-trial">{t("pricing.trial_note")}</div>
          </div>
        </div>
        <div className="lp-guarantee">
          <span style={{fontSize:"26px"}}>🛡️</span>
          <h3>{t("pricing.guarantee_title")}</h3>
          <p>{t("pricing.guarantee_desc")}</p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-tag">{t("testimonials.tag")}</div>
        <h2 className="lp-section-title" style={{marginBottom:"44px"}}>{t("testimonials.title")}</h2>
        <div className="lp-testimonials-grid">
          {testimonials.map(tst => (
            <div key={tst.name} className="lp-testi">
              <div className="lp-stars">★★★★★</div>
              <p className="lp-testi-text">"{tst.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-author-avatar" style={{background:`linear-gradient(${tst.grad})`}}>{tst.initial}</div>
                <div>
                  <div className="lp-author-name">{tst.name}</div>
                  <div className="lp-author-role">{tst.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="faq">
        <div className="lp-section-tag">{t("faq.tag")}</div>
        <h2 className="lp-section-title" style={{marginBottom:"36px"}}>{t("faq.title")}</h2>
        <div className="lp-faq-wrap">
          {faqs.map(([q,a]) => (
            <div key={q} className="lp-faq-item">
              <div className="lp-faq-q">{q}</div>
              <div className="lp-faq-a">{a}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-cta-final">
        <h2>{t("cta_final.title1")} <span className="lp-gradient-text">{t("cta_final.title2")}</span></h2>
        <p className="lp-cta-desc">{t("cta_final.subtitle")}</p>
        <button className="lp-btn-primary" style={{fontSize:"15px",padding:"16px 36px"}} onClick={() => navigate("/register")}>
          {t("cta_final.btn")}
        </button>
        <p className="lp-sub-note">{t("cta_final.note")}</p>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <img src="/logos/logo.png" alt="Stratega Planner" />
          Stratega Planner
        </div>
        <ul className="lp-footer-links">
          <li><a href="#">{t("footer.terms")}</a></li>
          <li><a href="#">{t("footer.privacy")}</a></li>
          <li><a href="#">{t("footer.support")}</a></li>
          <li><a href="mailto:ceovirtualstudios@gmail.com">{t("footer.contact")}</a></li>
        </ul>
        <div className="lp-footer-copy">{t("footer.copy")}</div>
      </footer>
    </div>
  )
}

export default Landing
