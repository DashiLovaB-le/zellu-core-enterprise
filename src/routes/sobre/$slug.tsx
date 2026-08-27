import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { SobreArticle } from "@/components/sobre/SobreArticle";
import { getSobrePage, getSobreNavItems } from "@/lib/sobre";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/sobre/$slug")({
  head: ({ params }) => {
    const page = getSobrePage(params.slug);
    return {
      meta: [
        {
          title: page ? `${page.title} — Sobre ${BRANDING.shortName}` : `Sobre — ${BRANDING.shortName}`,
        },
        {
          name: "description",
          content: page?.summary ?? "Guia sobre o Zēllu.",
        },
      ],
    };
  },
  component: SobreSlugPage,
});

function SobreSlugPage() {
  const { slug } = useParams({ from: "/sobre/$slug" });
  const page = getSobrePage(slug);
  if (!page) throw notFound();

  const nav = getSobreNavItems();
  const currentIndex = nav.findIndex((item) => item.slug === page.slug);
  const prev = currentIndex > 0 ? nav[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < nav.length - 1 ? nav[currentIndex + 1] : null;

  return (
    <>
      <SobreArticle page={page} />

      <nav
        aria-label="Navegação entre páginas"
        className="mt-10 flex flex-col gap-3 border-t border-[var(--clay-title)]/10 pt-6 sm:flex-row sm:justify-between"
      >
        {prev ? (
          <Link
            to="/sobre/$slug"
            params={{ slug: prev.slug }}
            className="text-sm font-semibold text-[var(--clay-cta)] hover:underline"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/sobre/$slug"
            params={{ slug: next.slug }}
            className="text-sm font-semibold text-[var(--clay-cta)] hover:underline sm:text-right"
          >
            {next.title} →
          </Link>
        ) : null}
      </nav>
    </>
  );
}
