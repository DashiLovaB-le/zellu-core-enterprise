# Exemplos

## Animações de Texto

### Efeito de Split (Caracteres Animados)
```typescript
import { motion } from 'framer-motion';

function SplitText({ text }) {
  const chars = text.split('');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.04
      }
    }
  };
  
  const charVariants = {
    hidden: { opacity: 0, y: -100 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {chars.map((char, i) => (
        <motion.span key={i} variants={charVariants}>
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}
```

### Hover Effect em Links
```typescript
function AnimatedLink({ href, children }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.1, color: '#ff6b6b' }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.a>
  );
}
```

## Animações de SVG

### Linha Desenhando (Draw SVG)
```typescript
function DrawSVG() {
  return (
    <svg viewBox="0 0 100 100" width={200} height={200}>
      <motion.path
        d="M 10 80 Q 50 10, 90 80"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2 }}
      />
    </svg>
  );
}
```

### Gráfico de Barras Animado
```typescript
function AnimatedBarChart({ data }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const barVariants = {
    hidden: { height: 0 },
    visible: { height: '100%' }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-2"
    >
      {data.map((value, i) => (
        <motion.div
          key={i}
          variants={barVariants}
          transition={{ duration: 0.5 }}
          style={{ flex: 1, backgroundColor: '#3498db' }}
        />
      ))}
    </motion.div>
  );
}
```

## Animações de Scroll

### Elemento Entrando na Tela com whileInView
```typescript
function ScrollReveal() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      Conteúdo que aparece ao rolar
    </motion.div>
  );
}
```

### Lista com Stagger ao Scroll
```typescript
function ScrollStaggerList({ items }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      });
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.fade-in').forEach(el => {
  observer.observe(el);
});
```

## Animações de Carregamento

### Loading Spinner
```javascript
animate({
  targets: '.spinner',
  rotate: 360,
  duration: 1000,
  easing: 'linear',
  loop: true
});
```

### Progress Bar
```javascript
const progressBar = document.querySelector('.progress');

animate({
  targets: progressBar,
  width: ['0%', '100%'],
  duration: 2000,
  easing: 'easeInOutQuad',
  complete: () => {
    console.log('Carregamento completo!');
  }
});
```

## Animações de Menu

### Hamburger Menu
```javascript
const menuBtn = document.querySelector('.menu-btn');
const lines = document.querySelectorAll('.menu-line');

menuBtn.addEventListener('click', () => {
  lines.forEach((line, i) => {
    animate({
      targets: line,
      rotate: i === 1 ? [0, 45] : [0, -45],
      translateY: i === 1 ? [0, -10] : [0, 10],
      duration: 200,
      easing: 'easeInOutQuad'
    });
  });
});
```

### Dropdown Menu
```javascript
const dropdown = document.querySelector('.dropdown');
const menu = document.querySelector('.menu-items');

dropdown.addEventListener('click', () => {
  animate({
    targets: menu,
    height: menu.style.height === '0px' ? [0, 200] : [200, 0],
    opacity: menu.style.height === '0px' ? [0, 1] : [1, 0],
    duration: 300,
    easing: 'easeInOutQuad'
  });
});
```
