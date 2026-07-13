# API Principal

## animate()

Função principal para criar animações.

```javascript
import { animate } from 'animejs';

const animation = animate({
  targets: '.element',
  translateX: 250,
  duration: 1000
});
```

### Métodos do Objeto Animation

| Método | Descrição |
|--------|-----------|
| `play()` | Inicia a animação |
| `pause()` | Pausa a animação |
| `restart()` | Reinicia a animação |
| `finish()` | Finaliza a animação |
| `seek(time)` | Pula para um tempo específico (ms) |
| `reverse()` | Inverte a direção da animação |

### Exemplo com Controle

```javascript
const animation = animate({
  targets: '.box',
  translateX: 300,
  duration: 2000,
  loop: true
});

// Controles
animation.pause();
animation.play();
animation.reverse();
animation.seek(1000);
```

## timeline()

Cria uma linha do tempo para animações encadeadas.

```javascript
import { timeline } from 'animejs';

const tl = timeline({
  duration: 1000,
  easing: 'easeInOutQuad',
  loop: true
});

tl.add({
  targets: '.element1',
  translateX: 250
});

tl.add({
  targets: '.element2',
  translateY: 250
});

tl.add({
  targets: '.element3',
  rotate: 360
});
```

### Métodos do Timeline

| Método | Descrição |
|--------|-----------|
| `add(props)` | Adiciona uma animação à linha do tempo |
| `play()` | Inicia a linha do tempo |
| `pause()` | Pausa a linha do tempo |
| `restart()` | Reinicia a linha do tempo |
| `seek(time)` | Pula para um tempo específico |
| `reverse()` | Inverte a direção |

## useMotionValue

Hook para valores animados que podem ser sincronizados.

```typescript
import { motion, useMotionValue } from 'framer-motion';

function DynamicAnimation() {
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  
  return (
    <motion.div
      style={{ x, opacity }}
      drag
      dragConstraints={{ left: -100, right: 100 }}
    />
  );
}
```

## variants

Define estados reutilizáveis para animações.

```typescript
const variants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 },
  hover: { scale: 1.1 }
};

function StaggeredList() {
  return (
    <motion.ul>
      {items.map((item, i) => (
        <motion.li
          key={i}
          variants={variants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          transition={{ delay: i * 0.1 }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```
});
```

### Opções do Stagger

| Opção | Descrição | Valores |
|-------|-----------|---------|
| `from` | Ponto de início | 'first', 'last', 'center', número |
| `axis` | Eixo do stagger | 'x', 'y', 'xy' |
| `start` | Delay inicial | número |
| `end` | Delay final | número |
| `grid` | Grid para stagger 2D | [linhas, colunas] |
| `amount` | Quantidade total de delay | número |
| `direction` | Direção | 'normal', 'reverse' |
