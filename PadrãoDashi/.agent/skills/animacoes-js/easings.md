# Easings (Funções de Interpolação)

Os easings no Framer Motion definem como a animação acelera e desacelera ao longo do tempo.

## Tipos de Easing Pré-definidos

### Simples
- `'linear'` - Velocidade constante
- `'easeIn'` - Aceleração simples
- `'easeOut'` - Desaceleração simples
- `'easeInOut'` - Aceleração e desaceleração

### Cubic Bezier Nomeados
- `'easeInBack'`, `'easeOutBack'`, `'easeInOutBack'` - Efeito de volta
- `'easeInElastic'`, `'easeOutElastic'`, `'easeInOutElastic'` - Efeito elástico
- `'easeInBounce'`, `'easeOutBounce'`, `'easeInOutBounce'` - Efeito de quicada

## Uso com Framer Motion

### Easing Simples
```typescript
import { motion } from 'framer-motion';

// Easing simples
<motion.div
  animate={{ x: 300 }}
  transition={{ duration: 1, ease: 'easeInOut' }}
/>

// Easing elástico
<motion.div
  animate={{ scale: [0, 1.2, 1] }}
  transition={{ duration: 0.8, ease: 'easeOutElastic' }}
/>

// Easing customizado (cubic-bezier)
<motion.div
  animate={{ x: 300 }}
  transition={{ 
    duration: 1, 
    ease: [0.68, -0.55, 0.265, 1.55] // Bounce
  }}
/>
```

## Easings Personalizados com Cubic Bezier

Você pode usar cubic-bezier personalizados como arrays:

```typescript
// Bounce effect
[0.68, -0.55, 0.265, 1.55]

// EaseOutBack
[0.77, 0, 0.175, 1]

// Smooth acceleration
[0.25, 0.46, 0.45, 0.94]

// Spring-like
[0.34, 1.56, 0.64, 1]
```

### Exemplo Completo
```typescript
<motion.button
  whileHover={{ 
    scale: 1.1,
    transition: { 
      duration: 0.3, 
      ease: [0.34, 1.56, 0.64, 1] // Spring
    }
  }}
>
  Hover me
</motion.button>
```

## Lista de Easings Pré-definidos do Framer Motion

### Strings
```
'linear'
'easeIn', 'easeOut', 'easeInOut'
'easeInBack', 'easeOutBack', 'easeInOutBack'
'easeInElastic', 'easeOutElastic', 'easeInOutElastic'
'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
'circIn', 'circOut', 'circInOut'
```

### Spring Physics (para efeitos naturais)
```typescript
// Spring animation
transition={{ 
  type: 'spring',
  stiffness: 100,
  damping: 10
}}

// Mais rápido
transition={{ 
  type: 'spring',
  stiffness: 300,
  damping: 30
}}
```
