import { useState } from "react"
import { useNavigate } from "react-router-dom"

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .lp * { margin: 0; padding: 0; box-sizing: border-box; }

  .lp {
    font-family: 'DM Sans', sans-serif;
    background: #080810;
    color: #F0F0F8;
    overflow-x: hidden;
    min-height: 100vh;
  }

  .lp h1, .lp h2, .lp h3, .lp h4 {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .lp-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 18px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(8,8,16,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .lp-nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 17px;
    color: #F0F0F8;
    text-decoration: none;
  }

  .lp-nav-logo img { width: 34px; height: 34px; object-fit: contain; }

  .lp-nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
    list-style: none;
  }

  .lp-nav-links a {
    color: #6B6B9A;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }
  .lp-nav-links a:hover { color: #F0F0F8; }

  .lp-nav-cta {
    background: #6022EC;
    color: white;
    padding: 10px 22px;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 20px rgba(96,34,236,0.35);
    font-family: 'DM Sans', sans-serif;
  }
  .lp-nav-cta:hover { background: #8B5CF6; transform: translateY(-1px); }

  .lp-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 120px 20px 80px;
    position: relative;
    overflow: hidden;
  }

  .lp-hero-glow {
    position: absolute;
    width: 700px; height: 700px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(96,34,236,0.15) 0%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .lp-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(96,34,236,0.15);
    border: 1px solid rgba(96,34,236,0.3);
    color: #8B5CF6;
    padding: 7px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 28px;
    animation: lpFadeDown 0.6s ease both;
  }

  .lp-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #8B5CF6;
    animation: lpPulse 2s infinite;
  }

  @keyframes lpPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes lpFadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lpFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .lp-hero h1 {
    font-size: clamp(38px, 6vw, 74px);
    font-weight: 800;
    line-height: 1.06;
    margin-bottom: 22px;
    animation: lpFadeUp 0.7s ease 0.1s both;
  }

  .lp-gradient-text {
    background: linear-gradient(135deg, #F5A623, #FF6B7A, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .lp-hero p {
    font-size: clamp(15px, 2vw, 18px);
    color: #6B6B9A;
    max-width: 520px;
    line-height: 1.75;
    margin-bottom: 36px;
    animation: lpFadeUp 0.7s ease 0.2s both;
  }

  .lp-hero-btns {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
    animation: lpFadeUp 0.7s ease 0.3s both;
  }

  .lp-btn-primary {
    background: #6022EC;
    color: white;
    padding: 15px 30px;
    border-radius: 13px;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 0 28px rgba(96,34,236,0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    border: none;
    display: inline-block;
  }
  .lp-btn-primary:hover { background: #8B5CF6; transform: translateY(-2px); }

  .lp-btn-secondary {
    background: rgba(255,255,255,0.05);
    color: #F0F0F8;
    padding: 15px 30px;
    border-radius: 13px;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    border: 1px solid #1E1E38;
    transition: all 0.2s;
    display: inline-block;
  }
  .lp-btn-secondary:hover { background: rgba(255,255,255,0.08); }

  .lp-hero-trust {
    margin-top: 14px;
    font-size: 12px;
    color: #6B6B9A;
    animation: lpFadeUp 0.7s ease 0.4s both;
  }

  .lp-preview {
    margin-top: 56px;
    width: 100%;
    max-width: 860px;
    animation: lpFadeUp 0.8s ease 0.5s both;
  }

  .lp-preview-frame {
    background: #0E0E1C;
    border: 1px solid #1E1E38;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 40px 90px rgba(0,0,0,0.6), 0 0 50px rgba(96,34,236,0.08);
  }

  .lp-preview-dots { display: flex; gap: 7px; margin-bottom: 14px; }
  .lp-preview-dot { width: 10px; height: 10px; border-radius: 50%; }

  .lp-preview-inner {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 10px;
    min-height: 240px;
  }

  .lp-preview-sidebar {
    background: rgba(8,8,16,0.7);
    border-radius: 10px;
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .lp-preview-logo {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 6px 10px;
    border-bottom: 1px solid #1E1E38;
    margin-bottom: 6px;
  }

  .lp-preview-logo img { width: 20px; height: 20px; object-fit: contain; border-radius: 4px; }
  .lp-preview-logo span { font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; }

  .lp-preview-item {
    height: 30px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 8px;
    font-size: 11px;
    color: #6B6B9A;
  }

  .lp-preview-item.active { background: rgba(96,34,236,0.2); color: #8B5CF6; }
  .lp-preview-item-icon { width: 13px; height: 13px; border-radius: 3px; background: #1E1E38; }
  .lp-preview-item.active .lp-preview-item-icon { background: #6022EC; }

  .lp-preview-main {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .lp-preview-card {
    background: rgba(8,8,16,0.7);
    border: 1px solid #1E1E38;
    border-radius: 10px;
    padding: 12px;
  }

  .lp-preview-card.wide { grid-column: span 2; }
  .lp-preview-card-label { height: 7px; width: 55%; border-radius: 3px; background: #1E1E38; margin-bottom: 8px; }
  .lp-preview-stat { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; }
  .lp-preview-sublabel { font-size: 9px; color: #6B6B9A; margin-top: 2px; }

  .lp-preview-bars { display: flex; align-items: flex-end; gap: 3px; height: 44px; margin-top: 6px; }
  .lp-preview-bar { flex: 1; border-radius: 3px 3px 0 0; }

  .lp-preview-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; margin-top: 6px; }
  .lp-preview-grid-cell { aspect-ratio:1; border-radius: 3px; }

  .lp-stats {
    display: flex;
    justify-content: center;
    gap: 56px;
    flex-wrap: wrap;
    padding: 36px 20px;
    border-top: 1px solid #1E1E38;
    border-bottom: 1px solid #1E1E38;
  }

  .lp-stat { text-align: center; }

  .lp-stat-num {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 34px;
    font-weight: 800;
    background: linear-gradient(135deg, #F5A623, #FF6B7A);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .lp-stat-label { font-size: 12px; color: #6B6B9A; margin-top: 3px; }

  .lp-section {
    padding: 90px 40px;
    max-width: 1160px;
    margin: 0 auto;
  }

  .lp-section-tag {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #8B5CF6;
    text-align: center;
    margin-bottom: 14px;
  }

  .lp-section-title {
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 800;
    text-align: center;
    line-height: 1.15;
    margin-bottom: 14px;
  }

  .lp-section-sub {
    text-align: center;
    color: #6B6B9A;
    font-size: 16px;
    max-width: 480px;
    margin: 0 auto 52px;
    line-height: 1.7;
  }

  .lp-features-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 18px;
  }

  .lp-feat-card {
    background: #0E0E1C;
    border: 1px solid #1E1E38;
    border-radius: 18px;
    padding: 26px;
    transition: border-color 0.2s, transform 0.2s;
  }

  .lp-feat-card:hover { border-color: rgba(96,34,236,0.45); transform: translateY(-4px); }

  .lp-feat-icon {
    width: 46px; height: 46px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 16px;
  }

  .lp-feat-card h3 { font-size: 17px; font-weight: 700; margin-bottom: 9px; }
  .lp-feat-card p { font-size: 13px; color: #6B6B9A; line-height: 1.7; }

  .lp-ai-card {
    background: linear-gradient(135deg, rgba(96,34,236,0.12), rgba(139,92,246,0.06));
    border: 1px solid rgba(96,34,236,0.28);
    border-radius: 26px;
    padding: 56px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 52px;
    align-items: center;
  }

  .lp-ai-card h2 { font-size: clamp(26px,3vw,38px); font-weight: 800; line-height: 1.2; margin-bottom: 18px; }
  .lp-ai-desc { color: #6B6B9A; font-size: 15px; line-height: 1.7; margin-bottom: 26px; }

  .lp-ai-features { display: flex; flex-direction: column; gap: 11px; }

  .lp-ai-feat {
    display: flex;
    align-items: center;
    gap: 11px;
    font-size: 14px;
  }

  .lp-ai-check {
    width: 20px; height: 20px;
    border-radius: 7px;
    background: rgba(96,34,236,0.25);
    color: #8B5CF6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
  }

  .lp-chat-box {
    background: #0E0E1C;
    border: 1px solid #1E1E38;
    border-radius: 18px;
    padding: 22px;
  }

  .lp-chat-label { font-size: 10px; color: #6B6B9A; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px; }

  .lp-chat-bubble { display: flex; gap: 9px; margin-bottom: 14px; align-items: flex-start; }

  .lp-chat-avatar {
    width: 30px; height: 30px;
    border-radius: 9px;
    background: linear-gradient(135deg, #6022EC, #8B5CF6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
  }

  .lp-chat-msg {
    background: #16162A;
    border: 1px solid #1E1E38;
    border-radius: 11px;
    padding: 10px 14px;
    font-size: 12px;
    line-height: 1.6;
    color: #F0F0F8;
  }

  .lp-chat-msg.user {
    background: rgba(96,34,236,0.13);
    border-color: rgba(96,34,236,0.2);
    color: #8B5CF6;
    margin-left: auto;
  }

  .lp-pricing { max-width: 860px !important; }

  .lp-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 44px;
  }

  .lp-toggle-btn {
    padding: 9px 22px;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #1E1E38;
    background: transparent;
    color: #6B6B9A;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lp-toggle-btn.active { background: rgba(96,34,236,0.18); color: #8B5CF6; border-color: rgba(96,34,236,0.4); }

  .lp-save-badge {
    background: rgba(34,197,94,0.13);
    color: #4ade80;
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid rgba(34,197,94,0.3);
  }

  .lp-plans { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }

  .lp-plan {
    background: #0E0E1C;
    border: 1px solid #1E1E38;
    border-radius: 22px;
    padding: 34px;
    position: relative;
    transition: transform 0.2s;
  }

  .lp-plan:hover { transform: translateY(-4px); }

  .lp-plan.featured {
    border-color: rgba(96,34,236,0.5);
    background: linear-gradient(160deg, rgba(96,34,236,0.1), #0E0E1C);
    box-shadow: 0 0 40px rgba(96,34,236,0.12);
  }

  .lp-plan-badge {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    background: #6022EC;
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 999px;
    white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 0 18px rgba(96,34,236,0.4);
  }

  .lp-plan-name { font-size: 19px; font-weight: 700; margin-bottom: 5px; }
  .lp-plan-desc { font-size: 12px; color: #6B6B9A; margin-bottom: 22px; line-height: 1.5; }
  .lp-plan-price { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; font-weight: 800; line-height: 1; margin-bottom: 3px; }
  .lp-plan-period { font-size: 12px; color: #6B6B9A; margin-bottom: 26px; }

  .lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 9px; margin-bottom: 28px; }

  .lp-plan-features li { font-size: 13px; color: #6B6B9A; display: flex; align-items: center; gap: 7px; }
  .lp-plan-features li.yes { color: #F0F0F8; }
  .lp-feat-ico { font-size: 11px; width: 16px; flex-shrink: 0; }

  .lp-plan-cta {
    display: block;
    width: 100%;
    padding: 13px;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.2s;
  }

  .lp-plan-cta.primary { background: #6022EC; color: white; box-shadow: 0 0 18px rgba(96,34,236,0.3); }
  .lp-plan-cta.primary:hover { background: #8B5CF6; }
  .lp-plan-cta.secondary { background: rgba(255,255,255,0.05); color: #F0F0F8; border: 1px solid #1E1E38; }
  .lp-plan-cta.secondary:hover { background: rgba(255,255,255,0.08); }

  .lp-plan-trial { text-align: center; font-size: 11px; color: #6B6B9A; margin-top: 9px; }

  .lp-guarantee {
    background: #0E0E1C;
    border: 1px solid #1E1E38;
    border-radius: 18px;
    padding: 28px;
    text-align: center;
    margin-top: 22px;
  }

  .lp-guarantee h3 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 10px 0 7px; font-size: 17px; }
  .lp-guarantee p { font-size: 13px; color: #6B6B9A; }

  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }

  .lp-testi { background: #0E0E1C; border: 1px solid #1E1E38; border-radius: 18px; padding: 26px; }

  .lp-stars { color: #F5A623; font-size: 13px; margin-bottom: 14px; letter-spacing: 2px; }
  .lp-testi-text { font-size: 13px; color: #6B6B9A; line-height: 1.7; margin-bottom: 18px; }
  .lp-testi-author { display: flex; align-items: center; gap: 10px; }

  .lp-author-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .lp-author-name { font-size: 13px; font-weight: 600; }
  .lp-author-role { font-size: 11px; color: #6B6B9A; }

  .lp-faq-wrap { max-width: 660px; margin: 0 auto; }
  .lp-faq-item { border-bottom: 1px solid #1E1E38; padding: 22px 0; }
  .lp-faq-q { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; margin-bottom: 10px; }
  .lp-faq-a { font-size: 13px; color: #6B6B9A; line-height: 1.7; }

  .lp-cta-final { padding: 80px 40px; text-align: center; max-width: 660px; margin: 0 auto; }
  .lp-cta-final h2 { font-size: clamp(30px,5vw,52px); font-weight: 800; line-height: 1.1; margin-bottom: 18px; }
  .lp-cta-desc { font-size: 16px; color: #6B6B9A; margin-bottom: 32px; line-height: 1.7; }
  .lp-sub-note { margin-top: 14px; font-size: 12px; color: #6B6B9A; }

  .lp-footer {
    padding: 36px 40px;
    border-top: 1px solid #1E1E38;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .lp-footer-logo { display: flex; align-items: center; gap: 9px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; }
  .lp-footer-logo img { width: 26px; height: 26px; object-fit: contain; }
  .lp-footer-links { display: flex; gap: 22px; list-style: none; }
  .lp-footer-links a { font-size: 12px; color: #6B6B9A; text-decoration: none; transition: color 0.2s; }
  .lp-footer-links a:hover { color: #F0F0F8; }
  .lp-footer-copy { font-size: 12px; color: #6B6B9A; }

  @media (max-width: 768px) {
    .lp-nav { padding: 14px 18px; }
    .lp-nav-links { display: none; }
    .lp-features-grid, .lp-testimonials-grid, .lp-plans { grid-template-columns: 1fr; }
    .lp-ai-card { grid-template-columns: 1fr; padding: 28px; gap: 28px; }
    .lp-preview-inner { grid-template-columns: 1fr; }
    .lp-section { padding: 60px 20px; }
    .lp-footer { flex-direction: column; text-align: center; }
    .lp-footer-links { justify-content: center; }
  }
`

const Landing = () => {
  const navigate = useNavigate()
  const [billing, setBilling] = useState("monthly")

  const prices = {
    monthly: {
      basic: "$6.99", basicP: "/mes · 7 días gratis",
      pro: "$11.99", proP: "/mes · 7 días gratis",
      basicUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364736",
      proUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364765"
    },
    annual: {
      basic: "$67", basicP: "/año · Ahorra 20%",
      pro: "$115", proP: "/año · Ahorra 20%",
      basicUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364756",
      proUrl: "https://strategaplanner.lemonsqueezy.com/checkout/buy/1364779"
    }
  }

  const p = prices[billing]

  const features = [
    { icon: "📅", color: "rgba(245,166,35,0.15)", title: "Planner & Calendario", desc: "Planifica y organiza tu contenido con un calendario visual interactivo. Arrastra, suelta y gestiona tus publicaciones con facilidad." },
    { icon: "🖼️", color: "rgba(255,107,122,0.15)", title: "Organizador de Feed", desc: "Visualiza y reordena tu feed de Instagram antes de publicar. Mantén una estética cohesiva con drag & drop en tiempo real." },
    { icon: "📄", color: "rgba(45,110,197,0.15)", title: "Cotizaciones Profesionales", desc: "Genera cotizaciones con diseño profesional y expórtalas en PDF. Impresiona a tus clientes desde el primer contacto." },
    { icon: "💰", color: "rgba(96,34,236,0.15)", title: "Contabilidad Simple", desc: "Controla ingresos, gastos y balance mensual con gráficas claras. Olvídate de hojas de cálculo desordenadas." },
    { icon: "👥", color: "rgba(34,197,94,0.15)", title: "Gestión de Equipo", desc: "Invita a colaboradores, asigna roles y trabaja en equipo sin perder el control de tus proyectos." },
    { icon: "🔔", color: "rgba(245,166,35,0.15)", title: "Recordatorios Inteligentes", desc: "Nunca olvides una entrega o reunión. Recibe notificaciones en el navegador con prioridades personalizables." },
  ]

  const testimonials = [
    { initial: "M", grad: "135deg,#F5A623,#FF6B7A", name: "María González", role: "Community Manager", text: "Stratega Planner cambió completamente cómo manejo mis clientes. Antes usaba 5 apps distintas, ahora todo está en un solo lugar." },
    { initial: "C", grad: "135deg,#6022EC,#8B5CF6", name: "Carlos Ramírez", role: "Social Media Manager", text: "La función de Strat AI es increíble. Me sugiere ideas de contenido y las cotizaciones en PDF lucen muy profesionales." },
    { initial: "A", grad: "135deg,#2D6EC5,#FF6B7A", name: "Andrea Morales", role: "Directora de Agencia", text: "Por fin puedo ver cómo va a quedar mi feed antes de publicar. El organizador drag & drop es exactamente lo que necesitaba." },
  ]

  const faqs = [
    ["¿Necesito tarjeta de crédito para la prueba gratis?", "No. Puedes comenzar tu prueba de 7 días completamente gratis sin necesidad de tarjeta de crédito."],
    ["¿Puedo cancelar en cualquier momento?", "Sí, puedes cancelar tu suscripción en cualquier momento sin penalizaciones. Mantendrás el acceso hasta el final del período facturado."],
    ["¿Qué métodos de pago aceptan?", "Aceptamos todas las tarjetas de crédito y débito internacionales (Visa, Mastercard, American Express)."],
    ["¿Hay diferencia entre pago mensual y anual?", "Con el plan anual ahorras un 20% comparado con el pago mensual. Ideal si usarás Stratega Planner a largo plazo."],
    ["¿Puedo cambiar de plan después?", "Sí, puedes subir o bajar de plan en cualquier momento. Los cambios se aplican al siguiente ciclo de facturación."],
  ]

  return (
    <div className="lp">
      <style>{styles}</style>

      <nav className="lp-nav">
        <a href="/" className="lp-nav-logo">
          <img src="/logos/logo.png" alt="Stratega Planner" />
          Stratega Planner
        </a>
        <ul className="lp-nav-links">
          <li><a href="#features">Funciones</a></li>
          <li><a href="#ia">IA</a></li>
          <li><a href="#pricing">Precios</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <button className="lp-nav-cta" onClick={() => navigate("/register")}>Empezar gratis</button>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          7 días gratis · Sin tarjeta de crédito
        </div>
        <h1>La plataforma todo-en-uno<br />para <span className="lp-gradient-text">Community Managers</span></h1>
        <p>Planifica contenido, organiza tu feed, gestiona clientes y deja que la IA trabaje contigo. Todo desde un solo lugar.</p>
        <div className="lp-hero-btns">
          <button className="lp-btn-primary" onClick={() => navigate("/register")}>Comenzar prueba gratis →</button>
          <a href="#features" className="lp-btn-secondary">Ver funciones</a>
        </div>
        <p className="lp-hero-trust">✓ 7 días gratis &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Sin compromisos</p>

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
                {["Dashboard","Planner","Feed","Cotizaciones","Contabilidad","Equipo"].map((item, i) => (
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
                  <div className="lp-preview-sublabel">Balance del mes</div>
                </div>
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-stat" style={{color:"#8B5CF6"}}>18</div>
                  <div className="lp-preview-sublabel">Posts planificados</div>
                </div>
                <div className="lp-preview-card">
                  <div className="lp-preview-card-label" />
                  <div className="lp-preview-stat" style={{color:"#FF6B7A"}}>5</div>
                  <div className="lp-preview-sublabel">Recordatorios</div>
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
        {[["10+","Módulos integrados"],["100%","En la nube"],["IA","Asistente integrado"],["7","Días gratis"]].map(([n,l]) => (
          <div key={l} className="lp-stat">
            <div className="lp-stat-num">{n}</div>
            <div className="lp-stat-label">{l}</div>
          </div>
        ))}
      </div>

      <section className="lp-section" id="features">
        <div className="lp-section-tag">Funciones</div>
        <h2 className="lp-section-title">Todo lo que necesitas<br/>en un solo lugar</h2>
        <p className="lp-section-sub">Diseñado especialmente para community managers y agencias de marketing digital.</p>
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
            <div className="lp-section-tag" style={{textAlign:"left",marginBottom:"12px"}}>Inteligencia Artificial</div>
            <h2>Strat AI — Tu asistente<br/>de redes sociales</h2>
            <p className="lp-ai-desc">Potenciado por IA avanzada, Strat analiza tu estrategia, sugiere contenido y te ayuda a crecer más rápido.</p>
            <div className="lp-ai-features">
              {["Ideas de contenido personalizadas para tu nicho","Análisis de tu feed de Instagram con sugerencias","Resumen diario inteligente de tu productividad","Sugerencias de precios para tus servicios"].map(f => (
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
        <div className="lp-section-tag">Precios</div>
        <h2 className="lp-section-title">Planes para cada etapa</h2>
        <p className="lp-section-sub">Empieza gratis 7 días. Sin tarjeta de crédito requerida.</p>
        <div className="lp-toggle">
          <button className={`lp-toggle-btn ${billing === "monthly" ? "active" : ""}`} onClick={() => setBilling("monthly")}>Mensual</button>
          <button className={`lp-toggle-btn ${billing === "annual" ? "active" : ""}`} onClick={() => setBilling("annual")}>
            Anual <span className="lp-save-badge">Ahorra 20%</span>
          </button>
        </div>
        <div className="lp-plans">
          <div className="lp-plan">
            <div className="lp-plan-name">Básico</div>
            <div className="lp-plan-desc">Para community managers que están comenzando</div>
            <div className="lp-plan-price">{p.basic}</div>
            <div className="lp-plan-period">{p.basicP}</div>
            <ul className="lp-plan-features">
              {[[true,"Planner y Calendario"],[true,"Organizador de Feed"],[true,"Recordatorios"],[true,"Carpetas (5GB)"],[true,"Hasta 3 miembros"],[false,"Cotizaciones"],[false,"Contabilidad"],[false,"Strat AI"]].map(([yes,label]) => (
                <li key={label} className={yes ? "yes" : ""}><span className="lp-feat-ico">{yes ? "✅" : "❌"}</span>{label}</li>
              ))}
            </ul>
            <a href={p.basicUrl} target="_blank" rel="noreferrer" className="lp-plan-cta secondary">Empezar gratis</a>
            <div className="lp-plan-trial">✓ 7 días sin cargo</div>
          </div>
          <div className="lp-plan featured">
            <div className="lp-plan-badge">⭐ Más popular</div>
            <div className="lp-plan-name">Pro</div>
            <div className="lp-plan-desc">Para profesionales y agencias que quieren todo</div>
            <div className="lp-plan-price">{p.pro}</div>
            <div className="lp-plan-period">{p.proP}</div>
            <ul className="lp-plan-features">
              {[[true,"Todo lo del plan Básico"],[true,"Cotizaciones + PDF"],[true,"Contabilidad completa"],[true,"Strat AI integrada"],[true,"Miembros ilimitados"],[true,"20GB almacenamiento"],[true,"Soporte prioritario"],[true,"Nuevas funciones primero"]].map(([yes,label]) => (
                <li key={label} className={yes ? "yes" : ""}><span className="lp-feat-ico">{yes ? "✅" : "❌"}</span>{label}</li>
              ))}
            </ul>
            <a href={p.proUrl} target="_blank" rel="noreferrer" className="lp-plan-cta primary">Empezar gratis →</a>
            <div className="lp-plan-trial">✓ 7 días sin cargo</div>
          </div>
        </div>
        <div className="lp-guarantee">
          <span style={{fontSize:"26px"}}>🛡️</span>
          <h3>Garantía de 30 días</h3>
          <p>Si no estás satisfecho en los primeros 30 días, te devolvemos el dinero sin preguntas.</p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-tag">Testimonios</div>
        <h2 className="lp-section-title" style={{marginBottom:"44px"}}>Lo que dicen nuestros usuarios</h2>
        <div className="lp-testimonials-grid">
          {testimonials.map(t => (
            <div key={t.name} className="lp-testi">
              <div className="lp-stars">★★★★★</div>
              <p className="lp-testi-text">"{t.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-author-avatar" style={{background:`linear-gradient(${t.grad})`}}>{t.initial}</div>
                <div>
                  <div className="lp-author-name">{t.name}</div>
                  <div className="lp-author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="faq">
        <div className="lp-section-tag">FAQ</div>
        <h2 className="lp-section-title" style={{marginBottom:"36px"}}>Preguntas frecuentes</h2>
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
        <h2>Empieza a crecer hoy con <span className="lp-gradient-text">Stratega Planner</span></h2>
        <p className="lp-cta-desc">Únete a los community managers que ya organizan su trabajo de forma inteligente. 7 días gratis, sin compromisos.</p>
        <button className="lp-btn-primary" style={{fontSize:"15px",padding:"16px 36px"}} onClick={() => navigate("/register")}>
          Comenzar prueba gratis →
        </button>
        <p className="lp-sub-note">✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Garantía 30 días</p>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <img src="/logos/logo.png" alt="Stratega Planner" />
          Stratega Planner
        </div>
        <ul className="lp-footer-links">
          <li><a href="#">Términos</a></li>
          <li><a href="#">Privacidad</a></li>
          <li><a href="#">Soporte</a></li>
          <li><a href="mailto:ceovirtualstudios@gmail.com">Contacto</a></li>
        </ul>
        <div className="lp-footer-copy">© 2025 Stratega Planner. Todos los derechos reservados.</div>
      </footer>
    </div>
  )
}

export default Landing
