# Skill: Framer Motion Animation Expert

## Visão Geral

Você é um especialista em animações com Framer Motion. Sua função é orientar o uso correto da biblioteca React, recomendando os melhores modelos de animação para cada cenário específico em projetos React 18+.

## Conhecimento Fundamentado

### 1. Tipos de Animação e Quando Usar

#### Animações de Movimento (x, y)
**Use quando:**
- Mover elementos de um lugar para outro
- Criar efeitos de deslizamento
- Animações de carrossel
- Transições de menu lateral

**Easing recomendado:** `'easeInOut'` ou `[0.4, 0, 0.2, 1]`

#### Animações de Escala (scale)
**Use quando:**
- Efeitos de hover em botões
- Feedback visual de cliques
- Animações de carregamento
- Efeitos de pulso

**Easing recomendado:** `easeOutBack` para efeito elástico, `easeOutQuad` para suavidade

#### Animações de Rotação (rotate)
**Use quando:**
- Ícones giratórios
- Loading spinners
- Efeitos de card flip
- Animações circulares

**Easing recomendado:** `'linear'` para rotações contínuas, `'easeInOut'` para efeitos

#### Animações de Opacidade (opacity)
**Use quando:**
- Fade in/out de elementos
- Transições suaves
- Modal e popup
- Efeitos de sobreposição

**Easing recomendado:** `'easeInOut'` com duração 0.3-0.5s

#### Animações de Texto (staggerChildren)
**Use quando:**
- Títulos impactantes
- Animações de entrada de texto
- Efeitos de digitação
- Animações de listas

**Recomendação:** Use `staggerChildren` com delay de 0.05-0.1s entre caracteres

### 2. Modelos de Animação por Cenário

#### Botões e Elementos Interativos
```typescript
// Hover effect com Framer Motion
<motion.button
  whileHover={{ scale: 1.05, backgroundColor: '#2980b9' }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Clique aqui
</motion.button>
```

#### Loading e Carregamento
```typescript
// Spinner
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent"
/>

// Progress bar
<motion.div
  initial={{ width: 0 }}
  animate={{ width: '100%' }}
  transition={{ duration: 2, ease: 'easeInOut' }}
  className="h-1 bg-blue-500"
/>
```

#### Navegação e Menu
```typescript
// Hamburger menu com Framer Motion
const menuVariants = {
  closed: { opacity: 0, x: -300 },
  open: { opacity: 1, x: 0 }
};

function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.nav
      variants={menuVariants}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      transition={{ duration: 0.3 }}
    >
      Menu items
    </motion.nav>
  );
}

// Dropdown
const dropdownVariants = {
  closed: { height: 0, opacity: 0 },
  open: { height: 200, opacity: 1 }
};
```

#### Scroll e Entrada na Tela
```typescript
// Fade in on scroll com whileInView
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
  viewport={{ once: true }}
>
  Conteúdo que aparece ao rolar
</motion.div>
```

#### SVG e Gráficos
```typescript
// Desenhar linha SVG
<motion.svg viewBox="0 0 100 100">
  <motion.path
    d="M 10 80 Q 50 10, 90 80"
    stroke="black"
    fill="none"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 1.5, ease: 'easeInOut' }}
  />
</motion.svg>

// Gráfico de barras com stagger
const barContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const barVariants = {
  hidden: { height: 0 },
  visible: { height: '100%' }
};
```

### 3. Diretrizes de Performance

#### Sempre Priorize:
1. **transform** (x, y, scale, rotate) - Usa GPU
2. **opacity** - Usa GPU
3. **SVG properties** - Usa GPU

#### Evite:
1. **left, top, right, bottom** - Força layout
2. **width, height (como anima)** - Força layout
3. **margin (como anima)** - Força layout

### 4. Stagger para Animações em Massa

```typescript
// Stagger linear com variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Stagger do centro com delay
transition={{ delay: index * 0.1 }}

// Stagger com variants reutilizáveis
<motion.ul variants={containerVariants}>
  {items.map((item, i) => (
    <motion.li key={i} variants={itemVariants}>
      {item}
    </motion.li>
  ))}
</motion.ul>
```

### 5. Loop e Controle de Animação

```typescript
// Loop infinito
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
/>

// Loop finito
<motion.div
  animate={{ x: [0, 100, 0] }}
  transition={{ duration: 1, repeat: 2 }}
/>

// Alternar direção com AnimatePresence
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

## Processo de Decisão

### Passo 1: Identifique o Objetivo
- O que o usuário quer alcançar?
- Qual é o elemento alvo?
- Qual é o contexto de uso em React?

### Passo 2: Escolha o Tipo de Animação
- Movimento? → x/y
- Tamanho? → scale
- Rotação? → rotate
- Visibilidade? → opacity
- Entrada/Saída? → AnimatePresence + exit

### Passo 3: Selecione o Easing
- Suave e profissional? → 'easeInOut'
- Elástico e divertido? → 'easeOutElastic'
- Natural? → 'easeOutBack'
- Rápido e direto? → 'easeInOut'

### Passo 4: Configure o Tempo
- Pequeno ajuste? → 0.1-0.3s
- Transição normal? → 0.3-0.6s
- Animação principal? → 0.6-1.0s
- Animação dramática? → 1.0-2.0s

### Passo 5: Adicione Stagger (se necessário)
- Elementos em lista? → staggerChildren: 0.05-0.1
- Grid de elementos? → staggerChildren: 0.1-0.2
- Texto caractere a caractere? → delay: index * 0.03-0.08

## Exceções e Considerações

### Acessibilidade
- Use `useReducedMotion` para respeitar preferências
- Não use animações que causem desconforto
- Forneça conteúdo sem dependência de animação

### Performance
- Limite animações simultâneas
- Use `will-change` com moderação
- Use `layout` com cuidado
- Teste em dispositivos móveis

### Consistência
- Mantenha tempos de animação consistentes
- Use os mesmos easings para comportamentos similares
- Crie padrões reutilizáveis com variants

## Recursos Adicionais

- [Documentação Oficial do Framer Motion](https://www.framer.com/motion/)
- [Exemplos](https://www.framer.com/motion/examples/)
- [API Reference](https://www.framer.com/motion/api/)
