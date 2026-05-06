import { useState } from "react";

import DoualyCalculator from "@/components/doualy-calculator";

// ── Inline Icons ───────────────────────────────────────────────────────────────
const IconArrow = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#0d6e56] shrink-0 mt-0.5">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────────
const TRUST_BADGES = [
  { label: "DDA",      desc: "5 taux douaniers" },
  { label: "TVA",      desc: "0% · 9% · 19%"   },
  { label: "TIC+DAPS", desc: "Taxes spéciales"  },
  { label: "LF 2026",  desc: "Mis à jour"       },
];

const features = [
  { icon: "🧮", title: "Calcul exact du coût rendu",  desc: "DDA, TVA, TIC, DAPS, fret, assurance, frais portuaires et bancaires — tout dans une seule formule." },
  { icon: "📋", title: "Conformité 2025–2026",         desc: "Vérification automatique PPI, domiciliation bancaire et certificats requis." },
  { icon: "📦", title: "Suivi des containers",         desc: "Associez chaque calcul à une expédition et suivez l'état en temps réel." },
  { icon: "💳", title: "Gestion des créances",         desc: "Suivez paiements clients, dettes impayées et échéances depuis un tableau de bord." },
  { icon: "🗂️", title: "Gestion des commandes",       desc: "Liez vos commandes clients à vos importations et planifiez les livraisons." },
  { icon: "📊", title: "Historique & export",          desc: "Archivez, comparez vos importations et exportez en PDF ou Excel." },
];

const faqs = [
  { q: "Les taux DDA sont-ils à jour ?",        a: "Oui. Nous mettons à jour selon les lois de finances et arrêtés en vigueur. Vous pouvez aussi les saisir manuellement." },
  { q: "Fonctionne-t-il pour tous les produits ?", a: "Oui. Istrad couvre tous les codes HS. TIC et DAPS sont activables selon votre nomenclature." },
  { q: "Puis-je payer en DZD ?",                a: "Oui. Paiements acceptés en DZD via virement bancaire et Dahabia / CIB." },
  { q: "Mes données sont-elles sécurisées ?",   a: "Vos données sont stockées en Algérie sur des serveurs sécurisés et ne sont jamais partagées." },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function Welcome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-[#0e1117] font-['Sora',sans-serif] antialiased">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f5f4f0]/90 backdrop-blur-md border-b border-[rgba(14,17,23,0.07)]">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-['DM_Serif_Display',serif] text-[18px] tracking-tight text-[#0e1117]">Istrad</span>
            <span className="hidden sm:flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#0d6e56] bg-[#e0f4ed] px-2 py-0.5 rounded-full">
              DZ · LF 2026
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 text-[12px] text-[#6b7080]">
            <a href="#features" className="hover:text-[#0e1117] transition-colors">Fonctionnalités</a>
            <a href="#faq"      className="hover:text-[#0e1117] transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a href="#calculator"
              className="flex items-center gap-1.5 bg-[#0e1117] text-white text-[11px] font-semibold px-3 py-1.5 rounded-[6px] hover:bg-[#0d6e56] transition-colors">
              Calculer <IconArrow />
            </a>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex flex-col gap-[4px] p-1.5"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <span className={`block w-4 h-[2px] bg-[#0e1117] transition-transform origin-center ${menuOpen ? "rotate-45 translate-y-[6px]" : ""}`}/>
              <span className={`block w-4 h-[2px] bg-[#0e1117] transition-opacity ${menuOpen ? "opacity-0" : ""}`}/>
              <span className={`block w-4 h-[2px] bg-[#0e1117] transition-transform origin-center ${menuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`}/>
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="lg:hidden bg-[#f5f4f0] border-t border-[rgba(14,17,23,0.07)] px-4 py-3 flex flex-col gap-3">
            <a href="#features" onClick={() => setMenuOpen(false)}
              className="text-[13px] text-[#6b7080] hover:text-[#0e1117] py-1">Fonctionnalités</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}
              className="text-[13px] text-[#6b7080] hover:text-[#0e1117] py-1">FAQ</a>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="pt-17">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row">

          {/* Value proposition */}
          <div className="
            w-full lg:w-[360px] xl:w-[400px] shrink-0
            flex flex-col justify-top
            px-4 sm:px-6 lg:px-8
            pt-8 pb-6 lg:py-1
            lg:border-r border-[rgba(14,17,23,0.07)]
          ">
            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#0d6e56] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d6e56]" />
              Professionnel · Algérie 2026
            </div>

            <h1 className="font-['DM_Serif_Display',serif] text-[1.8rem] sm:text-[2.1rem] xl:text-[2.4rem] leading-[1.1] tracking-tight text-[#0e1117] mb-3">
              Maîtrisez le coût réel de vos importations
            </h1>

            <p className="text-[13px] text-[#6b7080] leading-relaxed mb-5 max-w-sm">
              Calculez DDA, TVA, TIC, DAPS, fret et dédouanement en quelques secondes — avec alertes de conformité LF 2026.
            </p>

            {/* Trust badges — 2×2 grid */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {TRUST_BADGES.map(b => (
                <div key={b.label} className="bg-white border border-[rgba(14,17,23,0.08)] rounded-[8px] px-3 py-2">
                  <p className="font-['DM_Mono',monospace] text-[11px] font-bold text-[#0e1117]">{b.label}</p>
                  <p className="text-[10px] text-[#9b9fa8] mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <ul className="flex flex-col gap-2 mb-4">
              {[
                "Résultats en temps réel",
                "Régime micro-importation LF 2026",
                "Alertes PPI & domiciliation",
                "Coût unitaire automatique",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-[#6b7080]">
                  <IconCheck /> {item}
                </li>
              ))}
            </ul>

            <a href="#calculator"
              className="inline-flex items-center justify-center gap-2 bg-[#0d6e56] text-white text-[12px] font-semibold px-5 py-2.5 rounded-[7px] hover:bg-[#0b5e49] transition-all w-full sm:w-auto">
              Accéder au calculateur <IconArrow />
            </a>
          </div>

          {/* Calculator panel */}
          <div id="calculator" className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 pt-4 pb-8 lg:pt-[1rem]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b9fa8]">
                Calculateur · Coût rendu Algérie
              </p>
              <span className="text-[9px] font-semibold text-[#0d6e56] bg-[#e0f4ed] px-2 py-0.5 rounded-full whitespace-nowrap">
                douane.gov.dz · JORADP N°88
              </span>
            </div>
            <DoualyCalculator />
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white border-t border-[rgba(14,17,23,0.07)] py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#0d6e56] mb-2">Fonctionnalités</p>
            <h2 className="font-['DM_Serif_Display',serif] text-[1.6rem] sm:text-[1.8rem] tracking-tight text-[#0e1117]">
              Tout ce dont un importateur algérien a besoin
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map(f => (
              <div key={f.title}
                className="bg-[#fafaf8] border border-[rgba(14,17,23,0.07)] rounded-[12px] p-4 sm:p-5 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                <span className="text-xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-[13px] text-[#0e1117] mb-1">{f.title}</h3>
                <p className="text-[12px] text-[#6b7080] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="bg-[#0e1117] py-12 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-7">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#5ee7b8] mb-2">Comment ça marche</p>
            <h2 className="font-['DM_Serif_Display',serif] text-[1.6rem] sm:text-[1.8rem] tracking-tight text-white">
              4 étapes, résultat en moins de 30 secondes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: "01", title: "Saisissez votre produit",   desc: "Code HS, incoterm, valeur, fret, assurance." },
              { n: "02", title: "Choisissez vos taxes",       desc: "DDA, TVA, TIC, DAPS selon votre nomenclature." },
              { n: "03", title: "Ajoutez les frais annexes",  desc: "Portuaires, dédouanement, transport, bancaires." },
              { n: "04", title: "Obtenez le résultat",        desc: "Coût total rendu + unitaire + alertes conformité." },
            ].map(s => (
              <div key={s.n} className="border border-white/10 rounded-[10px] p-4">
                <p className="font-['DM_Mono',monospace] text-[#5ee7b8] text-[9px] mb-2">{s.n}</p>
                <h3 className="font-semibold text-white text-[13px] mb-1">{s.title}</h3>
                <p className="text-[11px] text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-white border-t border-[rgba(14,17,23,0.07)] py-12 sm:py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-7">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#0d6e56] mb-2">FAQ</p>
            <h2 className="font-['DM_Serif_Display',serif] text-[1.6rem] sm:text-[1.8rem] tracking-tight text-[#0e1117]">
              Questions fréquentes
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {faqs.map((f, i) => (
              <div key={i} className="border border-[rgba(14,17,23,0.08)] rounded-[10px] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#fafaf8] transition-colors gap-3"
                >
                  <span className="font-semibold text-[13px] text-[#0e1117]">{f.q}</span>
                  <span className={`text-[#0d6e56] transition-transform duration-200 shrink-0 ${openFaq === i ? "rotate-45" : "rotate-0"}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-[12px] text-[#6b7080] leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0d6e56] py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-['DM_Serif_Display',serif] text-[1.6rem] sm:text-[1.8rem] text-white mb-3 tracking-tight">
            Calculez votre premier coût rendu maintenant
          </h2>
          <p className="text-[12px] text-white/60 mb-6">Gratuit, sans inscription. Résultat en moins de 30 secondes.</p>
          <a href="#calculator"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#0d6e56] font-bold text-[12px] px-5 py-2.5 rounded-[7px] hover:-translate-y-0.5 transition-all">
            Aller au calculateur <IconArrow />
          </a>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(14,17,23,0.07)] bg-[#f5f4f0]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="font-['DM_Serif_Display',serif] text-[17px] text-[#0e1117]">Istrad</span>
          <p className="text-[11px] text-[#9b9fa8]">Tableau de bord de l'importateur algérien · DDA · TVA · TIC · DAPS</p>
          <p className="text-[11px] text-[#9b9fa8]">© 2026 Istrad. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}