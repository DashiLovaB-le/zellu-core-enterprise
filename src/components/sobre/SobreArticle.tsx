import type { SobrePage } from "@/lib/sobre";

export function SobreArticle({ page }: { page: SobrePage }) {
  return (
    <article>
      <header className="mb-8 border-b border-[var(--clay-title)]/10 pb-6">
        <h1 className="font-display text-2xl text-[var(--clay-title)] md:text-3xl">{page.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--clay-text)]/80">
          {page.summary}
        </p>
      </header>

      <div className="space-y-8">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-lg text-[var(--clay-title)]">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-3 text-sm leading-relaxed text-[var(--clay-text)]">
                {p}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--clay-text)]">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
