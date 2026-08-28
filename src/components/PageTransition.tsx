import { motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Fade-in do conteúdo em toda troca de rota (~1s).
 * Sem AnimatePresence/wait para não bloquear a navegação.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion || pathname === "/";

  return (
    <motion.div
      key={pathname}
      initial={instant ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduceMotion ? 0.01 : 1,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
