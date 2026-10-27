# Diretriz de Desenvolvimento — Sistema com Spatial UI

## Objetivo

Quero desenvolver um sistema empresarial utilizando uma abordagem de **Spatial UI / 3D Interactive UI**.

O objetivo não é criar um software de logística, um jogo ou simplesmente colocar elementos 3D em uma aplicação tradicional. A intenção é utilizar o **ambiente tridimensional como parte da própria interface do sistema**, tornando a experiência mais visual, intuitiva, contextual e interessante.

A aplicação deve permitir que o usuário compreenda e opere partes do sistema visualmente, interagindo diretamente com objetos, ambientes e elementos representados na cena 3D.

O conceito central é:

> **Transformar entidades e processos do negócio em elementos visuais interativos dentro de um ambiente 3D.**

Por exemplo, dependendo do domínio da aplicação, uma entidade pode ser representada por uma sala, máquina, veículo, mesa, pessoa, equipamento, prédio, produto, setor ou outro objeto visual.

Ao clicar ou interagir com esse elemento, o sistema deve apresentar as informações, ações e funcionalidades relacionadas àquela entidade.

---

## Princípio fundamental

O 3D **não deve ser utilizado apenas como decoração**.

Cada elemento visual precisa possuir significado dentro do sistema.

Por exemplo:

* um objeto representa uma entidade;
* sua cor pode representar seu status;
* sua posição pode representar localização ou organização;
* sua animação pode representar atividade;
* sua aparência pode mudar conforme seu estado;
* clicar nele deve permitir acessar informações ou executar ações;
* o ambiente pode representar a estrutura real ou lógica do negócio.

Dessa maneira, o usuário não está simplesmente "olhando para um cenário 3D".

Ele está **utilizando o cenário como interface de navegação e operação do sistema**.

---

# Arquitetura conceitual

A aplicação deverá ser construída em camadas.

### 1. Ambiente 3D

O ambiente representa visualmente o contexto do negócio.

Pode ser:

* uma empresa;
* uma fábrica;
* um escritório;
* uma clínica;
* uma loja;
* um condomínio;
* um centro de operações;
* uma cidade;
* um mapa;
* uma representação abstrata dos dados.

O ambiente deve possuir uma estética moderna, limpa e profissional, evitando aparência excessivamente semelhante a um jogo.

---

### 2. Objetos interativos

Os objetos da cena devem ser componentes independentes.

Cada objeto poderá possuir:

* `id`
* `type`
* `status`
* `position`
* `rotation`
* `metadata`
* ações disponíveis
* relacionamento com entidades do banco de dados

Exemplo conceitual:

```text
Object
 ├── id
 ├── type
 ├── status
 ├── position
 ├── entityId
 └── actions[]
```

Isso permitirá que o mesmo sistema de interação seja reutilizado em diferentes projetos.

---

### 3. Sistema de interação

Os objetos deverão responder a eventos como:

* hover;
* click;
* double click;
* seleção;
* foco;
* zoom;
* movimentação;
* mudança de estado.

Quando o usuário passar o mouse sobre um objeto, deve existir feedback visual.

Quando selecionar um objeto, a aplicação poderá:

1. destacar o objeto;
2. aproximar a câmera;
3. abrir um painel contextual;
4. carregar informações;
5. disponibilizar ações.

A interação deve transmitir claramente ao usuário que aquele objeto é utilizável.

---

# Interface híbrida

A aplicação não deve tentar colocar absolutamente tudo dentro do ambiente 3D.

O sistema deverá combinar:

**3D + interface 2D tradicional.**

O ambiente 3D será utilizado principalmente para:

* navegação;
* contexto;
* visualização;
* localização;
* seleção;
* status;
* relacionamento entre entidades;
* operações rápidas.

A interface 2D será utilizada para:

* formulários;
* configurações;
* tabelas;
* relatórios;
* filtros;
* edição detalhada;
* configurações administrativas;
* informações extensas.

Por exemplo:

```text
                 AMBIENTE 3D
        ┌───────────────────────────┐
        │                           │
        │      [OBJETO]             │
        │          ↓                │
        │     [OBJETO]      [OBJETO]│
        │                           │
        └───────────────────────────┘
                         │
                         ↓
                 PAINEL CONTEXTUAL
                 ┌─────────────────┐
                 │ Nome             │
                 │ Status           │
                 │ Informações      │
                 │                  │
                 │ [Editar] [Abrir] │
                 └─────────────────┘
```

---

# Stack tecnológica

A implementação deverá priorizar:

* **React**
* **TypeScript**
* **Three.js**
* **React Three Fiber**
* **Drei**
* **Tailwind CSS**
* **Supabase**
* **GLB/GLTF**
* **Blender**, quando houver necessidade de criação ou edição dos modelos 3D.

O React Three Fiber deverá ser utilizado para transformar a cena Three.js em uma estrutura de componentes React reutilizáveis.

A aplicação deverá evitar código monolítico.

Objetos, ambientes, câmeras, painéis e comportamentos devem ser componentes independentes.

---

# Sistema de componentes

A arquitetura deve permitir a criação de uma espécie de **Design System 3D**.

Exemplos:

```text
/components
    /3d
        InteractiveObject
        InteractiveBuilding
        InteractiveVehicle
        InteractiveRoom
        InteractiveMachine
        StatusIndicator
        SceneCamera
        SceneEnvironment

    /panels
        DetailPanel
        ActionPanel
        InformationPanel
        StatusPanel

    /ui
        Button
        Card
        Modal
        Badge
        Tooltip
```

O objetivo é que novos projetos possam reutilizar a estrutura desenvolvida.

Não quero construir uma aplicação descartável.

Quero construir uma **base tecnológica reutilizável para desenvolver diferentes sistemas empresariais utilizando Spatial UI**.

---

# Estados visuais

Os objetos deverão possuir estados visuais.

Por exemplo:

```text
AVAILABLE
ACTIVE
WARNING
ERROR
OFFLINE
SELECTED
DISABLED
```

Cada estado poderá alterar:

* cor;
* iluminação;
* material;
* animação;
* ícones;
* indicadores;
* efeitos visuais.

O usuário deverá conseguir compreender parte da situação do sistema apenas observando o ambiente.

---

# Câmera e navegação

A navegação deve ser simples e intuitiva.

Priorizar:

* câmera isométrica ou perspectiva controlada;
* zoom;
* pan;
* rotação limitada quando apropriado;
* foco automático em objetos;
* transições suaves;
* possibilidade de retornar à visão geral.

Evitar uma câmera excessivamente livre que faça o sistema parecer um jogo.

A câmera deve servir à compreensão do sistema.

---

# Experiência do usuário

A experiência deve seguir um princípio:

> **O usuário deve entender o sistema visualmente antes mesmo de ler todos os dados.**

O ambiente deve comunicar:

* onde estão as coisas;
* o que está acontecendo;
* o que precisa de atenção;
* quais elementos podem ser selecionados;
* quais ações estão disponíveis.

O sistema deve utilizar:

* microanimações;
* transições de câmera;
* feedback de seleção;
* indicadores visuais;
* iluminação;
* hierarquia visual;
* tooltips;
* painéis contextuais.

Entretanto, os efeitos devem ser utilizados com moderação.

O objetivo é criar uma experiência **premium, intuitiva e profissional**, e não uma demonstração tecnológica cheia de efeitos.

---

# Dados reais

O ambiente 3D deverá estar conectado aos dados reais da aplicação.

Por exemplo:

```text
Banco de dados
      ↓
Entidade
      ↓
Componente React
      ↓
Objeto 3D
      ↓
Interação do usuário
      ↓
Ação no sistema
      ↓
Banco de dados
```

O 3D deve ser uma representação visual do estado atual do sistema.

Quando o dado mudar, o ambiente poderá refletir essa mudança visualmente.

---

# Responsividade e acessibilidade

O sistema deve continuar funcional em diferentes tamanhos de tela.

Em dispositivos menores, a experiência 3D poderá ser simplificada.

Também deve existir uma alternativa tradicional para informações e operações que sejam difíceis de realizar exclusivamente através do ambiente 3D.

A interface deve continuar sendo utilizável mesmo quando:

* WebGL estiver limitado;
* o dispositivo possuir baixo desempenho;
* a tela for pequena;
* o usuário preferir uma navegação tradicional.

---

# Performance

Performance é prioridade.

A aplicação deve evitar:

* excesso de polígonos;
* modelos 3D desnecessariamente pesados;
* excesso de luzes e sombras;
* dezenas de componentes complexos renderizando continuamente;
* texturas gigantes;
* animações desnecessárias.

Priorizar:

* modelos GLB/GLTF otimizados;
* reutilização de geometria e materiais;
* carregamento sob demanda;
* instancing quando apropriado;
* níveis de detalhe quando necessário;
* redução de objetos quando estiverem fora da visão.

O sistema deve parecer sofisticado sem exigir hardware de alto desempenho.

---

# Objetivo arquitetural de longo prazo

A aplicação atual deverá ser tratada como o primeiro experimento de uma arquitetura maior.

A meta é desenvolver uma espécie de:

**"Spatial Business UI Framework"**

interno.

Esse framework deverá permitir futuramente criar sistemas diferentes reutilizando:

* componentes 3D;
* componentes 2D;
* sistema de seleção;
* sistema de estados;
* câmera;
* navegação;
* painéis contextuais;
* animações;
* padrões de interação;
* carregamento de modelos;
* integração com dados.

Assim, um novo sistema poderá mudar principalmente:

**domínio + entidades + ambiente + modelos + regras de negócio**

sem precisar reconstruir toda a infraestrutura de interação.

---

# Primeiro MVP

Para validar a metodologia, construir primeiro um ambiente pequeno.

Não iniciar com um sistema empresarial completo.

Criar:

1. um ambiente 3D;
2. 5–10 objetos interativos;
3. diferentes estados visuais;
4. seleção por clique;
5. hover;
6. câmera com foco automático;
7. painel lateral contextual;
8. dados simulados;
9. alteração de estado;
10. uma ação real conectada ao backend.

Depois disso, conectar o ambiente ao Supabase.

O objetivo do primeiro MVP é responder:

> **É possível utilizar o ambiente 3D como uma interface real de um sistema empresarial, e não apenas como uma apresentação visual?**

Se a resposta for positiva, a arquitetura deverá ser evoluída para suportar um produto real.

---

# Direção visual

A estética desejada é:

**premium + moderna + tecnológica + intuitiva + minimalista + espacial.**

Evitar:

* aparência de videogame;
* excesso de neon;
* interfaces cyberpunk;
* excesso de elementos flutuantes;
* gráficos desnecessários;
* ambientes visualmente poluídos.

Priorizar:

* formas simples;
* modelos estilizados;
* iluminação sofisticada;
* sombras suaves;
* boa profundidade;
* materiais consistentes;
* animações discretas;
* excelente hierarquia visual.

O resultado final deve transmitir:

> **"Este é um sistema empresarial, mas parece muito mais natural e interessante de utilizar do que um dashboard convencional."**

---

# Filosofia do projeto

O princípio central deste projeto é:

> **Não criar um dashboard que possui 3D. Criar um sistema cuja interface utiliza o espaço, os objetos e o contexto visual como parte da experiência de operação.**

A tecnologia 3D deve existir para melhorar a compreensão, navegação e interação do usuário.

O objetivo final é desenvolver uma metodologia que possa ser aplicada a diferentes segmentos e transformada em uma vantagem competitiva para a criação de sistemas sob medida.
