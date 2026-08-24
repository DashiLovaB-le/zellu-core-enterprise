# Usuários de teste — Mundo Mental Care

Contas ativas na mesma empresa (**Empresa Demo Mundo Mental**) e equipe (**Equipe Demo**).  
E-mails confirmados · onboarding e LGPD 3.0 preenchidos · opt-in de **IA** e **RH** ligados nos colaboradores.

---

## RH (`manager`)

| | |
|---|---|
| **E-mail** | `rh.teste@mundomental.care` |
| **Senha** | `MmcTeste#2026` |
| **Nome** | RH Teste |
| **Papel** | `manager` |
| **Entra em** | `/manager` (painel RH) |

---

## Colaborador base (`companion`)

| | |
|---|---|
| **E-mail** | `colaborador.teste@mundomental.care` |
| **Senha** | `MmcTeste#2026` |
| **Nome** | Colaborador Teste |
| **Papel** | `companion` |
| **Entra em** | `/` |

---

## Colaboradores demo com dados fictícios (`companion`)

Cada um tem perfil distinto, **30 dias** de check-ins, hábitos do dia, plano de cuidado + checklist do período e 3 entradas de diário.

### Ana Silva — equilíbrio / bem

| | |
|---|---|
| **E-mail** | `ana.silva.demo@mundomental.care` |
| **Senha** | `Ana#Care2026` |
| **Avatar** | Amora |
| **Perfil** | Humor positivo (feliz, grato, calmo), sono ~7,6h, água ~1,9 L |
| **Plano** | Equilíbrio emocional |

### Bruno Costa — sobrecarga / ansiedade

| | |
|---|---|
| **E-mail** | `bruno.costa.demo@mundomental.care` |
| **Senha** | `Bruno#Care2026` |
| **Avatar** | Chico |
| **Perfil** | Sobrecarregado, ansioso, cansado; sono ~5,2h; água baixa |
| **Plano** | Reduzir ansiedade |

### Camila Rocha — sono / misto

| | |
|---|---|
| **E-mail** | `camila.rocha.demo@mundomental.care` |
| **Senha** | `Camila#Care2026` |
| **Avatar** | Pipoca |
| **Perfil** | Cansada/neutra/triste; sono ~6,1h; água média |
| **Plano** | Melhorar o sono |

### Diego Nunes — energia / foco

| | |
|---|---|
| **E-mail** | `diego.nunes.demo@mundomental.care` |
| **Senha** | `Diego#Care2026` |
| **Avatar** | Zeca |
| **Perfil** | Focado, motivado, feliz; sono ~8h; água ~2,3 L; mais movimento |
| **Plano** | Aumentar energia |

### Elisa Martins — autocuidado / oscilação

| | |
|---|---|
| **E-mail** | `elisa.martins.demo@mundomental.care` |
| **Senha** | `Elisa#Care2026` |
| **Avatar** | Amora |
| **Perfil** | Insegura/preocupada → calma/grata; sono ~6,8h; água média |
| **Plano** | Autocuidado na rotina |

---

## O que foi inserido no banco (por colaborador demo)

- Conta Auth com senha própria e e-mail confirmado  
- `profiles` (role companion, empresa, equipe, consentimento, opt-ins)  
- `checkins` (30 dias, humor/sono/água variados)  
- `habits` (registro do dia)  
- `wellness_plans` + `wellness_checklist` (30 dias)  
- `diary_entries` (3 textos fictícios no período)

---

## Observação (painel RH)

Com **6 colaboradores** na mesma equipe e opt-in de RH, o k-anonimato (≥ 5) fica atendido: gráficos de humor/tendência podem aparecer.

Login do RH: `rh.teste@mundomental.care` / `MmcTeste#2026` → `/manager`
