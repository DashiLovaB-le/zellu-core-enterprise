import { motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Transição leve entre páginas.
 *
 * Motivo do micro-travamento anterior:
 * - AnimatePresence mode="wait" bloqueava a entrada até terminar a saída (~200ms+200ms)
 * - translateX em páginas pesadas forçava layout/paint a cada frame
 *
 * Aqui só fazemos um fade-in curto na página nova (sem esperar exit).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
