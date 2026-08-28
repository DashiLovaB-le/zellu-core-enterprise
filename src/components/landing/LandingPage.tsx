/**
 * THESIS: A página é uma carta do desenvolvedor; o produto demonstra na margem; recusa o herói SaaS + três cards.
 * OWN-WORLD: papel cream, tipo terracota, cruzes sage de registo, urso de feltro, formulário-cartão com linha.
 * STORY: A ausência é o problema; Zēllu é cuidado no ritmo do trabalho e RH sem o indivíduo; o RH pede para testar.
 * FIRST VIEWPORT: “Ausência” à escala do ecrã, letras apagadas que acendem; lockup à esquerda; Entrar à direita; mascote na calha.
 * FORM: Carta ao RH (lista fundamentada, 4.º), seed fafedcd0.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BRANDING } from "@/lib/branding";
import { CLINICAL_DISCLAIMER } from "@/lib/privacy";
import { submitLandingLead } from "@/lib/api/leads.server";
import { CompanionMascot } from "@/components/CompanionMascot";
import lockup from "@/assets/logo-zellu/lockup.svg";
import "./landing.css";

const ABSENCE = ["A", "u", "s", "ê", "n", "c", "i", "a"];

const VISTA_A = [
  { k: "Sono", v: "7 h" },
  { k: "Água", v: "ok" },
  { k: "Humor", v: "calmo" },
];

const VISTA_B = [
  { lit: false, label: "—" },
  { lit: false, label: "—" },
  { lit: false, label: "—" },
  { lit: true, label: "time" },
  { lit: true, label: "time" },
];

export function LandingPage() {
  const [lit, setLit] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLit(ABSENCE.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLit(i);
      if (i >= ABSENCE.length) window.clearInterval(id);
    }, 95);
    return () => window.clearInterval(id);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const result = await submitLandingLead({
        data: { name, email, company, website },
      });
      if (result.ok) {
        setStatus("ok");
        return;
      }
      setStatus("err");
      setError(result.error);
    } catch {
      setStatus("err");
      setError("Não foi possível enviar agora. Tente de novo em instantes.");
    }
  }

  return (
    <div className="lp-root" data-seed="fafedcd0">
      <span className="lp-mark lp-mark-tl" aria-hidden />
      <span className="lp-mark lp-mark-tr" aria-hidden />
      <span className="lp-mark lp-mark-bl" aria-hidden />
      <span className="lp-mark lp-mark-br" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="block">
          <img src={lockup} alt={BRANDING.appName} className="h-9 w-auto sm:h-10" />
        </Link>
        <Link
          to="/login"
          className="font-display text-sm font-semibold text-[var(--lp-ink)] underline decoration-[var(--lp-terra)] underline-offset-4"
        >
          Já tenho acesso
        </Link>
      </header>

      <section className="relative grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 items-end gap-6 px-6 pb-10 sm:px-10 lg:grid-cols-[1fr_minmax(140px,18%)]">
        <div>
          <h1 className="lp-absence" aria-label="Ausência">
            {ABSENCE.map((letter, i) => (
              <span key={`${letter}-${i}`} className={i < lit ? "is-on" : undefined} aria-hidden>
                {letter}
              </span>
            ))}
          </h1>
          <p className="mt-8 max-w-[22ch] font-display text-2xl font-semibold leading-tight text-[var(--lp-ink)] sm:text-3xl">
            A empresa ainda não acompanha o que o colaborador sente no meio da semana.
          </p>
          <a
            href="#responder"
            className="mt-8 inline-block font-display text-base font-semibold text-[var(--lp-ink)] underline decoration-[var(--lp-terra)] decoration-2 underline-offset-4"
          >
            Responder a carta
          </a>
        </div>
        <div className="hidden justify-self-end lg:block">
          <CompanionMascot pose="wave" size="lg" alt="" className="h-auto w-[min(220px,18vw)]" />
        </div>
      </section>

      <article className="relative mx-auto grid max-w-5xl gap-16 px-6 py-20 sm:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="lg:hidden">
          <CompanionMascot pose="listen" size="md" alt="" />
        </div>

        <div className="max-w-[62ch] space-y-6 text-[1.05rem] leading-[1.7] text-[var(--lp-ink-soft)]">
          <p>
            Eu sou desenvolvedor. Não sou de RH e não sou terapeuta. Tem uma coisa que eu via de perto e que não saía da
            cabeça.
          </p>
          <p>
            Tem vale, tem ginástica, tem o ramal do RH. Ferramenta para acompanhar o que a pessoa está sentindo no dia a
            dia — quase nunca. Saúde mental, quando aparece, aparece tarde: atestado, pedido de ajuda, alguém que já não
            está bem. Até lá, a pessoa carrega sozinha. E o RH só fica sabendo quando o problema já chegou na mesa.
          </p>
          <p>
            Foi essa ausência que me fez construir o {BRANDING.appName}: um companion no ritmo do trabalho. Check-in,
            conversa, respiro — sem fingir que isso substitui terapia. Do outro lado, tendência de equipe, nunca o diário
            de ninguém.
          </p>
          <p>
            Passei mais tempo pensando em privacidade do que em feature. Se a pessoa não confia, ela não usa. Se o RH vê
            demais, o produto deixa de fazer sentido.
          </p>
          <p>
            Agora estamos em validação. Validar isso sem quem vive o RH no dia a dia não faz sentido. Se a carta te
            encontrou, o cartão ao lado é o lugar de responder.
          </p>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <CompanionMascot pose="idle-calm" size="lg" alt="" className="h-auto w-full max-w-[240px]" />
        </aside>
      </article>

      <section className="mx-auto max-w-5xl px-6 pb-8 sm:px-10">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="lp-sheet lp-sheet-a p-6 sm:p-8">
            <p className="font-display text-5xl font-bold leading-none text-[var(--lp-terra)]">A</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--lp-ink)]">A pessoa, no meio do expediente</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
              Recorte sintético do check-in. O conteúdo real nunca atravessa para o RH.
            </p>
            <ul className="mt-6 space-y-3">
              {VISTA_A.map((row) => (
                <li key={row.k} className="lp-rule flex items-baseline justify-between pb-2">
                  <span className="font-display text-lg font-semibold text-[var(--lp-ink)]">{row.k}</span>
                  <span className="text-[var(--lp-terra-deep)]">{row.v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-sheet lp-sheet-b p-6 sm:p-8">
            <p className="font-display text-5xl font-bold leading-none text-[var(--lp-sage-deep)]">B</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--lp-ink)]">O RH, sem a pessoa</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-ink-soft)]">
              Recorte sintético. Com menos de cinco opt-ins, as células ficam apagadas de propósito.
            </p>
            <div className="mt-6 grid grid-cols-5 gap-2">
              {VISTA_B.map((cell, i) => (
                <div key={i} className={`lp-cell flex items-end p-1.5 ${cell.lit ? "is-lit" : ""}`}>
                  <span className={`text-[10px] font-display font-semibold ${cell.lit ? "text-[var(--lp-cream)]" : "text-[var(--lp-sage-deep)]"}`}>
                    {cell.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-10 max-w-[48ch] text-sm leading-relaxed text-[var(--lp-ink-soft)]">
          As duas vistas não registam. O desalinhamento é a privacidade.
        </p>
      </section>

      <section id="responder" className="mx-auto max-w-xl px-6 py-24 sm:px-10">
        <form className="lp-sheet relative px-7 py-8 sm:px-10 sm:py-10" onSubmit={onSubmit} noValidate>
          <div className="lp-stamp absolute -top-5 right-6 bg-[var(--lp-cream)]">
            <CompanionMascot pose="cheer" size="sm" alt="" className="h-full w-full object-contain" />
          </div>
          <h2 className="font-display text-3xl font-bold text-[var(--lp-ink)]">Resposta</h2>
          <p className="mt-2 max-w-[36ch] text-[var(--lp-ink-soft)]">
            Se você é de RH, topa validar isso com a gente? Sem pitch. A gente lê e chama.
          </p>

          <label className="sr-only" htmlFor="lp-website">
            Website
          </label>
          <input
            id="lp-website"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <div className="mt-8 space-y-6">
            <label className="block font-display text-sm font-semibold text-[var(--lp-ink)]">
              Nome
              <input
                className="lp-input mt-1"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="block font-display text-sm font-semibold text-[var(--lp-ink)]">
              E-mail corporativo
              <input
                className="lp-input mt-1"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block font-display text-sm font-semibold text-[var(--lp-ink)]">
              Empresa
              <input
                className="lp-input mt-1"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
                required
              />
            </label>
          </div>

          {status === "ok" ? (
            <p className="mt-8 font-display text-lg font-semibold text-[var(--lp-sage-deep)]" role="status">
              Chegou. A gente chama.
            </p>
          ) : (
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-8 inline-flex min-h-12 items-center bg-[var(--lp-terra)] px-6 font-display text-base font-bold text-[var(--lp-cream)] transition-colors hover:bg-[var(--lp-terra-deep)] disabled:opacity-60"
            >
              {status === "sending" ? "Enviando…" : "Quero testar"}
            </button>
          )}
          {error ? (
            <p className="mt-4 text-sm text-[var(--lp-terra-deep)]" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </section>

      <footer className="px-6 pb-16 sm:px-10">
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-[var(--lp-ink-soft)]">
          {CLINICAL_DISCLAIMER}{" "}
          <Link to="/privacidade" className="underline decoration-[var(--lp-sage)] underline-offset-2">
            Privacidade
          </Link>
          {" · "}
          <Link to="/sobre" className="underline decoration-[var(--lp-sage)] underline-offset-2">
            Sobre
          </Link>
        </p>
        <p className="mt-4 text-center font-display text-xs text-[var(--lp-sage-deep)]">{BRANDING.poweredBy}</p>
      </footer>
    </div>
  );
}
