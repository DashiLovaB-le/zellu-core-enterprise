# TODO — Chat Personagem (Companion com Poses)

> Planejamento do módulo de chat como **personagem fixo** — não chat genérico + avatar solto.  
> **Ordem de implementação:** Chico → Amora → Pipoca → Zeca (um por vez, por dependência de assets).

---

## Visão geral

| Camada | O que é | Regra |
|---|---|---|
| **Companion** | Quem conversa (Chico, Amora, Pipoca, Zeca) | 1 por usuário, salvo no perfil |
| **Pose** | Expressão/corpo do companion no momento | Troca por **estado** da conversa, não a cada palavra |
| **Tom da IA** | Estilo da resposta | Derivado do companion escolhido |

**Objetivo do chat:** o usuário conversa *com o Chico* (ou outro companion), não com “urso genérico + foto de perfil”.

---

## Diagnóstico de assets — Chico

### O que já temos hoje

Os PNGs em `src/assets/mascote/` **já são o Chico** (urso marrom, óculos, boné azul, camiseta azul).  
Não é um mascote genérico separado do personagem.

| Asset atual | Pose | Uso no chat | Status |
|---|---|---|---|
| `transparent/wave-lg.png` | `wave` | Boas-vindas / retorno | ✅ pronto |
| `transparent/idlecalm-md.png` | `idle-calm` | Repouso / resposta neutra | ✅ pronto |
| `transparent/listen-sm.png` | `listen` | Usuário digitando | ✅ pronto |
| `transparent/think-sm.png` | `think` | IA processando | ✅ pronto |
| `transparent/encourage-md.png` | `encourage` | Apoio / sugestão leve | ✅ pronto |
| `transparent/breathe-lg.png` | `breathe` | Sugestão de respiro/pausa | ✅ pronto |
| `transparent/cheer-md.png` | `cheer` | Celebração / meta concluída | ✅ pronto |
| `transparent/empty-sm.png` | `empty` | Estado vazio (secundário) | ✅ pronto |
| `avatar/cabeca/Chico.png` | cabeça | Seleção de avatar / perfil | ✅ pronto |
| — | `concern` | Humor pesado / sobrecarga / acolhimento | ❌ **faltando** |

### Veredito — Chico

**Quase suficiente para MVP.**  
Com os **8 poses atuais**, dá para implementar o chat personagem do Chico sem bloquear.

**Recomendado antes de polish (não bloqueia MVP):**
- [ ] Criar **1 pose `concern`** (preocupado/acolhedor) — melhora muito check-in “sobrecarregado/ansioso”
- [ ] Padronizar tamanhos (`sm` / `md` / `lg`) por pose no chat (hoje os arquivos misturam `-sm`, `-md`, `-lg` no nome)

**Não precisa agora:**
- Animações frame-a-frame
- Poses extras (sentado, dormindo, etc.)
- Variantes com/sem fundo (usar só `transparent/` no chat)

---

## Diagnóstico de assets — outros personagens

| Personagem | Cabeça (`cabeca/`) | Poses corpo | Veredito |
|---|---|---|---|
| **Chico** | ✅ | ✅ 8 poses (em `mascote/`) | **Pronto para MVP** |
| **Amora** | ✅ | ❌ nenhuma | Precisa **8 poses** novas |
| **Pipoca** | ✅ | ❌ nenhuma | Precisa **8 poses** novas |
| **Zeca** | ✅ | ❌ nenhuma | Precisa **8 poses** novas |

Cada personagem futuro precisa do **mesmo kit de 8 poses** (+ `concern` se padronizarmos):
`wave`, `idle-calm`, `listen`, `think`, `encourage`, `breathe`, `cheer`, `empty`, `concern`

---

## Estrutura de pastas proposta

Reorganizar assets por companion (migrar Chico primeiro; outros vão entrando):

```text
src/assets/companions/
├── _shared/
│   └── poses.ts              # tipos, mapa pose → estado do chat
├── chico/
│   ├── cabeca.png            # ← mover de avatar/cabeca/Chico.png (ou reexport)
│   └── poses/
│       └── transparent/
│           ├── wave-lg.png
│           ├── idlecalm-md.png
│           ├── listen-sm.png
│           ├── think-sm.png
│           ├── encourage-md.png
│           ├── breathe-lg.png
│           ├── cheer-md.png
│           ├── empty-sm.png
│           └── concern-md.png   # a produzir
├── amora/
│   ├── cabeca.png
│   └── poses/transparent/    # vazio — aguardando artes
├── pipoca/
│   ├── cabeca.png
│   └── poses/transparent/
└── zeca/
    ├── cabeca.png
    └── poses/transparent/
```

**Compatibilidade:** manter reexports temporários em `mascote/` e `avatar/cabeca/` até migrar todos os imports (`Mascot.tsx`, `Avatar.tsx`, telas).

---

## Mapa de poses × interação no chat

| Estado / gatilho | Pose | Prioridade |
|---|---|---|
| Abrir chat (primeira vez do dia) | `wave` | P0 |
| Chat ocioso / resposta neutra | `idle-calm` | P0 |
| Usuário digitando | `listen` | P0 |
| Enviou mensagem / IA pensando | `think` | P0 |
| Resposta de apoio | `encourage` | P0 |
| Sugestão de respiro / pausa | `breathe` | P1 |
| Meta/hábito/check-in positivo | `cheer` | P1 |
| Humor pesado / sobrecarga (check-in) | `concern` | P1 — **asset faltando** |
| Histórico vazio | `empty` ou `wave` | P2 |

### Regras de UX
- Trocar pose no **máximo 1x por turno** (não a cada token da IA)
- Transição suave (fade 150–250 ms)
- No header do chat: **só o companion** — remover duplicata mascote + avatar genérico
- Nome exibido = nome do companion (ex.: “Chico”), não “Amora” hardcoded em timeline

---

## Personalidade por companion (referência)

### Chico — **primeiro a implementar**
- **Tom:** calmo, grounded, direto sem frieza
- **Quando usar:** ansiedade, sobrecarga, organização do dia
- **Poses dominantes:** `idle-calm`, `breathe`, `encourage`, `concern`
- **Frase-guia:** “Vamos com calma. Um passo de cada vez.”

### Amora — backlog
- **Tom:** acolhedora, empática, suave
- **Poses dominantes:** `encourage`, `concern`, `listen`

### Pipoca — backlog
- **Tom:** leve, animada, calorosa
- **Poses dominantes:** `cheer`, `wave`, `encourage`

### Zeca — backlog
- **Tom:** focado, motivador, prático
- **Poses dominantes:** `encourage`, `think`, `cheer`

---

# TODO por personagem

## Fase 0 — Fundação (compartilhada)

- [ ] **0.1** Criar `src/assets/companions/` e mover assets do Chico para `companions/chico/`
- [ ] **0.2** Criar `src/lib/companions/` (`types.ts`, `chico.ts`, registry)
- [ ] **0.3** Refatorar `Mascot.tsx` → `CompanionMascot` (aceita `companionId` + `pose`)
- [ ] **0.4** Criar hook `useCompanionPose(state)` — resolve pose a partir de UI + contexto
- [ ] **0.5** Ligar companion ao `profiles.avatar_url` (Amora/Chico/Pipoca/Zeca)
- [ ] **0.6** Ajustar prompt da IA por companion (`llm-config.server.ts`)
- [ ] **0.7** Remover referências hardcoded “Amora” fora do contexto de avatar (ex.: timeline)

---

## Chico — MVP do chat personagem

### Assets
- [X] **C.1** Migrar PNGs → `companions/chico/poses/transparent/`
- [X] **C.2** `companions/chico/cabeca.png`
- [ ] **C.3** Produzir `concern-md.png` *(em andamento — fallback: encourage)*
- [X] **C.4–C.12** UI chat com poses dinâmicas (mobile + desktop)
- [X] **C.13** Prompt específico do Chico no servidor
- [X] **C.14** Inferência de `messageKind` pós-resposta
- [X] **C.15** Pose inicial por humor do check-in
- [ ] **C.16** Quick replies com tom do Chico (“Vamos respirar”, “Preciso organizar o dia”)

### QA
- [ ] **C.17** Testar mobile + desktop
- [ ] **C.18** Testar troca de pose sem flicker
- [ ] **C.19** Testar usuário com avatar ≠ Chico (decidir: força Chico no chat MVP ou só se avatar = Chico)

> **Decisão pendente C.19:** no MVP, chat sempre Chico **ou** chat segue avatar do perfil?  
> Recomendação: **seguir avatar do perfil**, mas só renderizar poses se companion tiver assets (senão fallback Chico).

---

## Amora — após Chico

### Assets necessários (8 + concern)
- [ ] **A.1** `wave-lg.png`
- [ ] **A.2** `idlecalm-md.png`
- [ ] **A.3** `listen-sm.png`
- [ ] **A.4** `think-sm.png`
- [ ] **A.5** `encourage-md.png`
- [ ] **A.6** `breathe-lg.png`
- [ ] **A.7** `cheer-md.png`
- [ ] **A.8** `empty-sm.png`
- [ ] **A.9** `concern-md.png` *(recomendado)*

### Implementação
- [ ] **A.10** Registrar Amora em `companions/registry`
- [ ] **A.11** Prompt de personalidade Amora
- [ ] **A.12** QA chat com avatar Amora

---

## Pipoca — após Amora

### Assets necessários
- [ ] **P.1–P.9** Mesmo kit de 8–9 poses (lista igual Amora)

### Implementação
- [ ] **P.10** Registrar Pipoca no registry
- [ ] **P.11** Prompt de personalidade Pipoca
- [ ] **P.12** QA chat com avatar Pipoca

---

## Zeca — após Pipoca

### Assets necessários
- [ ] **Z.1–Z.9** Mesmo kit de 8–9 poses (lista igual Amora)

### Implementação
- [ ] **Z.10** Registrar Zeca no registry
- [ ] **Z.11** Prompt de personalidade Zeca
- [ ] **Z.12** QA chat com avatar Zeca

---

## Checklist de assets por personagem (resumo)

| Pose | Chico | Amora | Pipoca | Zeca |
|---|---|---|---|---|
| `wave` | ✅ | ❌ | ❌ | ❌ |
| `idle-calm` | ✅ | ❌ | ❌ | ❌ |
| `listen` | ✅ | ❌ | ❌ | ❌ |
| `think` | ✅ | ❌ | ❌ | ❌ |
| `encourage` | ✅ | ❌ | ❌ | ❌ |
| `breathe` | ✅ | ❌ | ❌ | ❌ |
| `cheer` | ✅ | ❌ | ❌ | ❌ |
| `empty` | ✅ | ❌ | ❌ | ❌ |
| `concern` | ❌ | ❌ | ❌ | ❌ |
| `cabeca` | ✅ | ✅ | ✅ | ✅ |

---

## Ordem sugerida de execução

1. Fase 0 (fundação técnica)
2. Chico C.1–C.18 (MVP chat personagem)
3. Produzir `concern` do Chico (C.3) + repetir pose para os demais
4. Amora → Pipoca → Zeca (assets + registro + prompt + QA)

---

## Referências no código atual

| Arquivo | Situação |
|---|---|
| `src/components/Mascot.tsx` | Poses fixas, sem `companionId` |
| `src/components/pages/*/ChatPage.tsx` | Mascote + Avatar duplicados no header |
| `src/components/Avatar.tsx` | Só cabeça (`cabeca/`) |
| `src/assets/mascote/transparent/*` | **São poses do Chico** |
| `src/lib/api/llm-config.server.ts` | Prompt genérico — precisa variante por companion |

---

*Última revisão: 2026-08-26 — assets inspecionados no repo local.*
