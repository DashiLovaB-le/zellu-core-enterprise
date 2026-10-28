/**
 * THESIS: A página responde, na ordem, às perguntas que um RH faz antes de comprar, cada uma com a tela real do Zēllu rodando; recusa o herói SaaS com três cards de feature.
 * OWN-WORLD: creme da marca com campos inteiros de tinta e terracota; telas reais do app em molduras com o fundo clay; Quicksand e Nunito; urso só onde o produto fala com a pessoa.
 * STORY: o RH vê onde o trabalho pesa por equipe, entende o check-in de um minuto, comprova que ninguém é exposto, vê o resumo mensal e agenda uma demonstração.
 * FIRST VIEWPORT: título comercial e botão Agendar demonstração à esquerda; à direita o painel real de fatores de trabalho com o guia aberto; régua das cinco perguntas embaixo.
 * FORM: Perguntas do RH, 5.º da lista fundamentada, seed ce65901c.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
 */
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BRANDING } from "@/lib/branding";
import { CLINICAL_DISCLAIMER } from "@/lib/privacy";
import { submitLandingLead } from "@/lib/api/leads.server";
import { COMPANY_SIZES, COMPANY_SIZE_LABEL, type CompanySize } from "@/lib/landing-leads";
import { calendarDayKey, factorForDayKey, type WorkFactorScore } from "@/lib/work-factors";
import { CompanionMascot } from "@/components/CompanionMascot";
import { Mascot } from "@/components/Mascot";
import { WorkFactorQuestion, WorkFactorRecap } from "@/components/checkin/WorkFactorQuestion";
import { RhWorkFactorsSection } from "@/components/manager/RhWorkFactorsSection";
import lockup from "@/assets/logo-zellu/lockup.svg";
import pdfPreview from "@/assets/landing/relatorio-pdf.webp";
import {
  DEMO_PANEL,
  DEMO_TEAM_FOR_GUIDE,
  REVEAL_MAX,
  REVEAL_TEAM,
  demoMonthlyEmail,
  revealReport,
} from "./landing-demo";
import "./landing.css";

const QUESTIONS = [
  { id: "colaborador", label: "O que o colaborador faz?" },
  { id: "privacidade", label: "O RH vê o que cada pessoa respondeu?" },
  { id: "rotina", label: "Quanto trabalho isso dá para o RH?" },
  { id: "nr01", label: "E a NR-01?" },
  { id: "agendar", label: "Como começamos?" },
] as const;

/** Mesma curva de `--lp-ease` em landing.css */
const LP_EASE = [0.16, 1, 0.3, 1] as const;

function ScrollIn({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0.01 : 0.45, ease: LP_EASE }}
    >
      {children}
    </motion.div>
  );
}

function AppFrame({
  title,
  children,
  className = "",
  flush = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <figure className={`lp-frame ${className}`}>
      <div className="lp-frame-bar">
        <span className="lp-frame-title">{title}</span>
        <span className="lp-frame-demo">Dados de exemplo</span>
      </div>
      <div className={flush ? "lp-frame-flush" : "lp-frame-body"}>{children}</div>
    </figure>
  );
}

function CheckinDemo() {
  const factor = useMemo(() => factorForDayKey(calendarDayKey(new Date())), []);
  const [score, setScore] = useState<WorkFactorScore | null>(null);
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();
  const swap = {
    duration: reduce ? 0.01 : 0.24,
    ease: LP_EASE,
  };

  return (
    <div className="lp-phone" aria-label="Demonstração do check-in do colaborador">
      <div className="lp-phone-screen">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              transition={swap}
              className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center"
            >
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduce ? 0 : 0.05,
                  duration: reduce ? 0.01 : 0.22,
                  ease: LP_EASE,
                }}
              >
                <Mascot pose="cheer" size="md" />
              </motion.div>
              <p className="font-display text-lg font-semibold text-[var(--clay-title)]">
                Check-in completo!
              </p>
              <WorkFactorRecap factorId={factor.id} score={score} />
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setScore(null);
                }}
                className="mt-2 text-xs font-semibold text-[var(--clay-title)] underline underline-offset-4"
              >
                Responder de novo
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="ask"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              transition={swap}
            >
              <div className="mb-3 flex items-center gap-3">
                <Mascot pose="encourage" size="sm" />
                <div>
                  <p className="font-display text-base font-semibold text-[var(--clay-title)]">
                    Check-in Matinal
                  </p>
                  <p className="text-[11px] text-[var(--clay-text)]/70">Como você está hoje?</p>
                </div>
              </div>
              <div className="mb-3 flex gap-1.5" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1]"
                  />
                ))}
              </div>
              <WorkFactorQuestion variant="mobile" factor={factor} score={score} onScore={setScore} />
              <button
                type="button"
                disabled={score === null}
                onClick={() => setDone(true)}
                className="mt-3 w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
              >
                Finalizar check-in
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PrivacyReveal() {
  const [count, setCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);
  const report = useMemo(() => revealReport(count), [count]);
  const revealed = count >= 5;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return;
        started.current = true;
        if (reduce) {
          setCount(5);
          return;
        }
        let n = 0;
        const id = window.setInterval(() => {
          n += 1;
          setCount(n);
          if (n >= 5) window.clearInterval(id);
        }, 650);
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--lp-cream)]">
          Equipe {REVEAL_TEAM}: {REVEAL_MAX} pessoas autorizaram. {count}{" "}
          {count === 1 ? "respondeu" : "responderam"} sobre carga de trabalho.
        </p>
        <div className="lp-dots mt-4" role="img" aria-label={`${count} de 5 respostas necessárias`}>
          {Array.from({ length: REVEAL_MAX }, (_, i) => (
            <span
              key={i}
              className={i < count ? "is-on" : undefined}
              data-limit={i === 4 || undefined}
            />
          ))}
        </div>
        <p
          className="mt-4 max-w-[38ch] text-sm leading-relaxed text-[var(--lp-cream)]/80"
          aria-live="polite"
        >
          {revealed
            ? "Com 5 respostas, a média da equipe aparece. Nenhuma resposta individual."
            : `Faltam ${5 - count} ${5 - count === 1 ? "resposta" : "respostas"} para a carga de trabalho aparecer no painel.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="lp-btn lp-btn-cream"
            disabled={count >= REVEAL_MAX}
            onClick={() => {
              started.current = true;
              setCount((c) => Math.min(REVEAL_MAX, c + 1));
            }}
          >
            Adicionar uma resposta
          </button>
          <button
            type="button"
            className="lp-btn lp-btn-line"
            onClick={() => {
              started.current = true;
              setCount(0);
            }}
          >
            Recomeçar
          </button>
        </div>
      </div>
      <AppFrame title="Painel RH · Fatores de trabalho">
        <div className={`lp-reveal ${revealed ? "is-revealed" : ""}`}>
          <RhWorkFactorsSection report={report} error={null} stacked className="" />
        </div>
      </AppFrame>
    </div>
  );
}

function MonthlyEmailPreview() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(1180);
  const html = useMemo(() => demoMonthlyEmail("").html, []);

  const measure = () => {
    const content = frameRef.current?.contentDocument?.body?.firstElementChild;
    if (content) setHeight(Math.ceil(content.getBoundingClientRect().height));
  };

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <AppFrame title="Resumo mensal por e-mail" flush>
      <div className="lp-mail" inert>
        <iframe
          ref={frameRef}
          title="Exemplo do resumo mensal enviado ao RH, com dados de exemplo"
          srcDoc={html}
          sandbox="allow-same-origin"
          onLoad={measure}
          style={{ height }}
          loading="lazy"
        />
      </div>
    </AppFrame>
  );
}

export function LandingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companySize) {
      setStatus("err");
      setError("Escolha o número de colaboradores.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const result = await submitLandingLead({
        data: { name, email, company, companySize, website },
      });
      if (result.ok) {
        setStatus("ok");
        return;
      }
      setStatus("err");
      setError(result.error);
    } catch {
      setStatus("err");
      setError("Não foi possível enviar agora. Confira os campos e tente de novo.");
    }
  }

  return (
    <div className="lp-root" data-seed="ce65901c">
      <header className="lp-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" className="block shrink-0">
            <img src={lockup} alt={BRANDING.appName} className="h-8 w-auto sm:h-9" />
          </Link>
          <nav
            className="hidden items-center gap-7 text-sm font-semibold md:flex"
            aria-label="Seções"
          >
            <a href="#colaborador" className="lp-navlink">
              Como funciona
            </a>
            <a href="#privacidade" className="lp-navlink">
              Privacidade
            </a>
            <a href="#nr01" className="lp-navlink">
              NR-01
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="lp-navlink hidden text-sm font-semibold sm:inline">
              Entrar
            </Link>
            <a href="#agendar" className="lp-btn lp-btn-terra">
              Agendar demonstração
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:items-center lg:pb-20 lg:pt-16">
          <div>
            <h1 className="lp-h1">
              Veja onde o trabalho está pesando enquanto ainda dá para agir.
            </h1>
            <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[var(--lp-ink-soft)]">
              O {BRANDING.appName} acompanha o bem-estar do seu time com um check-in de um minuto
              por dia e mostra ao RH, por equipe, carga de trabalho, autonomia, apoio da liderança e
              relações. Sem expor ninguém.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#agendar" className="lp-btn lp-btn-terra lp-btn-lg">
                Agendar demonstração
              </a>
              <a href="#colaborador" className="lp-navlink text-base font-semibold">
                Ver como funciona
              </a>
            </div>
          </div>
          <AppFrame title="Painel RH · Fatores de trabalho" className="lp-frame-hero">
            <RhWorkFactorsSection
              report={DEMO_PANEL}
              error={null}
              stacked
              hideIntro
              className=""
              defaultOpen={{ teamName: DEMO_TEAM_FOR_GUIDE, factorId: "carga" }}
            />
          </AppFrame>
        </section>

        <nav id="perguntas" className="lp-index" aria-label="Perguntas respondidas nesta página">
          <ol className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-3 px-5 py-5 sm:px-8">
            {QUESTIONS.map((q) => (
              <li key={q.id}>
                <a href={`#${q.id}`}>{q.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="colaborador" className="lp-section">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <h2 className="lp-h2">O que o colaborador faz?</h2>
              <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-[var(--lp-ink-soft)]">
                Um check-in de um minuto: sono, água, humor e uma pergunta sobre o trabalho, que
                muda a cada dia. Esta é a pergunta de hoje, com o mesmo componente do app.
                Experimente.
              </p>
              <ul className="lp-list mt-8 max-w-[56ch]">
                <li>
                  <strong>Companion para conversar,</strong> com IA só para quem autorizar.
                </li>
                <li>
                  <strong>Respiro guiado, diário e plano de cuidado</strong> para o dia a dia.
                </li>
                <li>
                  <strong>Orientação imediata em crise,</strong> com o CVV (188) na tela.
                </li>
                <li>
                  <strong>Nada disso chega ao RH.</strong> Diário e conversas ficam com a pessoa.
                </li>
              </ul>
            </div>
            <ScrollIn className="flex items-end justify-center gap-4">
              <CheckinDemo />
            </ScrollIn>
          </div>
        </section>

        <section id="privacidade" className="lp-section lp-field-ink">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="lp-h2 text-[var(--lp-cream)]">O RH vê o que cada pessoa respondeu?</h2>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[var(--lp-cream)]/85">
              Não. O RH vê a média da equipe, e só quando pelo menos 5 pessoas que autorizaram
              responderam. Antes disso, a equipe aparece oculta. Diário, conversas e humor de cada
              um nunca chegam ao painel. A simulação abaixo usa a mesma regra do painel.
            </p>
            <div className="mt-12">
              <PrivacyReveal />
            </div>
          </div>
        </section>

        <section id="rotina" className="lp-section lp-field-sage">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <h2 className="lp-h2">Quanto trabalho isso dá para o RH?</h2>
              <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-[var(--lp-ink-soft)]">
                Pouco. No dia 1 de cada mês, cada gestor recebe por e-mail o resumo do mês anterior:
                adesão, equipes que pedem atenção, fatores de trabalho e o que melhorou.
              </p>
              <ul className="lp-list mt-8 max-w-[50ch]">
                <li>
                  <strong>Guia "Como agir"</strong> em cada fator em atenção ou risco, com ações
                  para a liderança.
                </li>
                <li>
                  <strong>Relatório em PDF</strong> do painel, pronto para levar à reunião.
                </li>
                <li>
                  <strong>Convites e equipes</strong> organizados pelo próprio RH.
                </li>
              </ul>
            </div>
            <ScrollIn>
              <MonthlyEmailPreview />
            </ScrollIn>
          </div>
        </section>

        <section id="nr01" className="lp-section">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div>
              <h2 className="lp-h2">E a NR-01?</h2>
              <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-[var(--lp-ink-soft)]">
                Com a atualização da NR-01, a empresa precisa identificar e acompanhar os riscos
                psicossociais do trabalho. O {BRANDING.appName} apoia esse acompanhamento no dia a
                dia, e o relatório do painel leva esse histórico para a reunião.
              </p>
              <div className="mt-10 grid gap-10 sm:grid-cols-2">
                <div>
                  <h3 className="lp-h3">O que o {BRANDING.appName} faz</h3>
                  <ul className="lp-list lp-list-tight mt-4">
                    <li>Mede todo dia carga, autonomia, apoio da liderança e relações.</li>
                    <li>Mostra a tendência por equipe, sem expor ninguém.</li>
                    <li>Sugere ações quando um fator pede atenção.</li>
                    <li>Guarda o histórico mês a mês e exporta em PDF.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="lp-h3">O que continua com a sua equipe</h3>
                  <ul className="lp-list lp-list-tight mt-4">
                    <li>A avaliação de riscos do programa de gerenciamento de riscos (PGR).</li>
                    <li>Laudos e documentos técnicos de segurança do trabalho.</li>
                    <li>A decisão sobre as medidas adotadas.</li>
                  </ul>
                </div>
              </div>
            </div>
            <ScrollIn>
              <AppFrame title="Relatório em PDF · Painel RH" flush className="lp-frame-pdf">
                <img
                  src={pdfPreview}
                  alt="Primeira página do relatório em PDF do Painel RH, com indicadores gerais, alertas e status por equipe, em dados de exemplo"
                  width={952}
                  height={1347}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              </AppFrame>
            </ScrollIn>
          </div>
        </section>

        <section id="agendar" className="lp-section lp-field-terra">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div>
              <h2 className="lp-h2">Como começamos?</h2>
              <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-[var(--lp-ink)]">
                Com uma demonstração de 30 minutos. Você vê o app do colaborador e o painel do RH
                funcionando com dados de exemplo e tira as dúvidas sobre implantação.
              </p>
              <ol className="lp-steps mt-8">
                <li>Você preenche o formulário com seus dados.</li>
                <li>A gente responde por e-mail para marcar a conversa.</li>
                <li>Se fizer sentido, montamos uma proposta para o tamanho da sua empresa.</li>
              </ol>
              <CompanionMascot
                pose="wave"
                size="md"
                alt=""
                className="mt-10 hidden h-auto w-36 lg:block"
              />
            </div>

            <form className="lp-form" onSubmit={onSubmit} noValidate>
              <AnimatePresence mode="wait" initial={false}>
                {status === "ok" ? (
                  <motion.div
                    key="ok"
                    role="status"
                    className="py-6"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0.01 : 0.28,
                      ease: LP_EASE,
                    }}
                  >
                    <p className="font-display text-2xl font-bold text-[var(--lp-ink)]">
                      Pedido recebido.
                    </p>
                    <p className="mt-3 text-[var(--lp-ink-soft)]">
                      Vamos escrever para {email} para marcar a demonstração.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="fields"
                    initial={false}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, transition: { duration: 0.18, ease: LP_EASE } }
                    }
                  >
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
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="lp-label sm:col-span-2">
                        Nome
                        <input
                          className="lp-input"
                          name="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                          required
                        />
                      </label>
                      <label className="lp-label sm:col-span-2">
                        E-mail corporativo
                        <input
                          className="lp-input"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </label>
                      <label className="lp-label">
                        Empresa
                        <input
                          className="lp-input"
                          name="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          autoComplete="organization"
                          required
                        />
                      </label>
                      <label className="lp-label">
                        Número de colaboradores
                        <select
                          className="lp-input"
                          name="companySize"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                          required
                        >
                          <option value="" disabled>
                            Escolha
                          </option>
                          {COMPANY_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {COMPANY_SIZE_LABEL[size]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="lp-btn lp-btn-ink lp-btn-lg mt-7 w-full"
                    >
                      {status === "sending" ? "Enviando…" : "Agendar demonstração"}
                    </button>
                    {error ? (
                      <p className="mt-4 text-sm font-semibold text-[#8A3A22]" role="alert">
                        {error}
                      </p>
                    ) : null}
                    <p className="mt-4 text-xs leading-relaxed text-[var(--lp-ink-soft)]">
                      Usamos esses dados só para responder ao seu pedido.{" "}
                      <Link to="/privacidade" className="underline underline-offset-2">
                        Privacidade
                      </Link>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
          <div>
            <img src={lockup} alt={BRANDING.appName} className="h-8 w-auto" />
            <p className="mt-3 text-sm text-[var(--lp-ink-soft)]">{BRANDING.tagline}</p>
          </div>
          <nav
            className="flex max-w-xl flex-wrap justify-start gap-x-6 gap-y-3 text-sm font-semibold md:justify-end"
            aria-label="Rodapé"
          >
            <Link to="/privacidade" className="lp-navlink">
              Privacidade
            </Link>
            <Link to="/termos" className="lp-navlink">
              Termos de Uso
            </Link>
            <Link to="/governanca" className="lp-navlink">
              Política de Governança
            </Link>
            <Link to="/dpa" className="lp-navlink">
              DPA
            </Link>
            <Link to="/sobre" className="lp-navlink">
              Sobre
            </Link>
            <Link to="/login" className="lp-navlink">
              Entrar
            </Link>
          </nav>
        </div>
        <div className="mx-auto max-w-7xl border-t border-[var(--lp-hairline)] px-5 py-6 sm:px-8">
          <p className="max-w-[90ch] text-xs leading-relaxed text-[var(--lp-ink-soft)]">
            {CLINICAL_DISCLAIMER}
          </p>
          <p className="mt-3 text-xs font-semibold text-[var(--lp-sage-deep)]">
            {BRANDING.poweredBy}
          </p>
        </div>
      </footer>
    </div>
  );
}
