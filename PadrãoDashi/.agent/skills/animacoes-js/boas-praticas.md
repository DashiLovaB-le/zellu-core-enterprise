# Boas Práticas

## Performance

### 1. Use transform e opacity
```typescript
// ✅ BOM - Usa GPU
<motion.div
  animate={{ x: 300, opacity: 1 }}
  transition={{ duration: 0.5 }}
/>

// ❌ RUIM - Força layout
<motion.div
  animate={{ left: 300, width: '200px' }}
  transition={{ duration: 0.5 }}
/>
```

### 2. Use will-change via Tailwind
```typescript
// ✅ BOM - Otimizado para GPU
<motion.div
  className="will-change-transform"
  animate={{ x: 300 }}
/>
```

### 3. Use layout animações com cuidado
```typescript
// ✅ Simples layout shift
<motion.div layout>
  Conteúdo dinâmico
</motion.div>

// ❌ Evite layout animações em muitos elementos
{items.map(item => (
  <motion.div key={item.id} layout>
    {item}
  </motion.div>
))}
```

## Código Limpo

### 1. Reutilize variants
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function AnimatedList() {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map(item => (
        <motion.li key={item.id} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 2. Extraia transições em constantes
```typescript
const TRANSITION_QUICK = { duration: 0.3 };
const TRANSITION_NORMAL = { duration: 0.5 };
const TRANSITION_SLOW = { duration: 1 };

<motion.div transition={TRANSITION_NORMAL} />
```

### 3. Crie componentes reutilizáveis
```typescript
function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}
```

## Acessibilidade

### 1. Respeite prefers-reduced-motion com Framer Motion
```typescript
import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={{ x: shouldReduceMotion ? 0 : 300 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    />
  );
}
```

### 2. Evite animações muito rápidas
```typescript
// ✅ BOM - Duração adequada
<motion.div transition={{ duration: 0.5 }} />

// ❌ RUIM - Muito rápido
<motion.div transition={{ duration: 0.05 }} />
  element.animate({ transform: 'translateX(300px)' }, { duration: 500 });
} else {
  // Fallback com CSS
  element.style.transition = 'transform 500ms';
  element.style.transform = 'translateX(300px)';
}
```

## Eventos e Callbacks

```javascript
animate({
  targets: '.box',
  translateX: 300,
  duration: 1000,
  begin: () => console.log('Iniciou'),
  update: () => console.log('Atualizando'),
  complete: () => console.log('Finalizou'),
  loop: true
});
```

### Eventos Disponíveis
- `begin` - Quando a animação começa
- `update` - A cada frame da animação
- `complete` - Quando a animação termina
- `loop` - A cada loop
- `change` - Quando um valor muda
