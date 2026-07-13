# Uso Básico

## Animação Simples com motion.div

```typescript
import { motion } from 'framer-motion';

function SimpleAnimation() {
  return (
    <motion.div
      initial={{ x: 0, opacity: 0 }}
      animate={{ x: 250, opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      Elemento animado
    </motion.div>
  );
}
```

## Props Principais

| Prop | Descrição | Tipo | Obrigatório |
|------|-----------|------|-------------|
| `initial` | Estado inicial da animação | object | Não |
| `animate` | Estado final da animação | object | Sim |
| `exit` | Estado ao sair (dentro de AnimatePresence) | object | Não |
| `transition` | Configuração de transição | object | Não |
| `whileHover` | Estado durante hover | object | Não |
| `whileTap` | Estado durante clique | object | Não |
| `whileInView` | Estado ao entrar na viewport | object | Não |

## Exemplos Práticos

### Mover Elemento
```typescript
import { motion } from 'framer-motion';

function MoveExample() {
  return (
    <motion.div
      initial={{ x: 0 }}
      animate={{ x: 300 }}
      transition={{ duration: 1.5 }}
      className="box"
    />
  );
}
```

### Rotacionar e Escalar
```typescript
function RotateScale() {
  return (
    <motion.div
      initial={{ rotate: 0, scale: 0 }}
      animate={{ rotate: 360, scale: 1 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      className="circle"
    />
  );
}
```

### Animação com Loop
```typescript
function PulseAnimation() {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      className="pulse"
    />
  );
}
```
