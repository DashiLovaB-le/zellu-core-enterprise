# Importação

## Componente motion (Mais Comum)

```typescript
import { motion } from 'framer-motion';

function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Conteúdo animado
    </motion.div>
  );
}
```

## AnimatePresence (Para Animações de Entrada/Saída)

```typescript
import { motion, AnimatePresence } from 'framer-motion';

function MyComponent({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Conteúdo
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## useMotionTemplate & useMotionValue (Hooks Avançados)

```typescript
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

function Advanced() {
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  
  return <motion.div style={{ x, opacity }} />;
}
```

## Tipos TypeScript Automáticos

O Framer Motion fornece tipos automaticamente inferidos:

```typescript
import { motion, HTMLMotionProps } from 'framer-motion';

interface MyProps extends HTMLMotionProps<'div'> {
  customProp?: string;
}

function MyComponent(props: MyProps) {
  return <motion.div {...props} />;
}
```
