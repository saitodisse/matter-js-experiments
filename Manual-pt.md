# Matter.js Ball Pool with Vite

Este é um joguinho divertido onde você pode jogar bolinhas e outras formas em uma tela e vê-las quicando por aí, como em uma piscina de bolinhas! Ele usa uma ferramenta chamada Matter.js para fazer a física parecer real.

## Como o Jogo Funciona? (Explicação do Código)

Imagina que o código do jogo é como uma receita de bolo bem grande. O arquivo `src/main.ts` é o começo dessa receita, o lugar onde tudo é organizado para o jogo funcionar.

### 1. O Pontapé Inicial: `window.onload`

Tudo começa quando você abre a página do jogo no seu navegador. Assim que a página termina de carregar, um comando especial chamado `window.onload` é ativado. É como se alguém dissesse: "Página pronta! Pode começar o jogo!".

```typescript
// Isso aqui fica lá no finalzinho do arquivo src/main.ts
window.onload = function () {
  // Cria o "cérebro" do nosso jogo
  const simulation = new BallPoolSimulation();
  // Manda o jogo começar a rodar
  simulation.start();
};
```

Esse comando cria uma coisa chamada `BallPoolSimulation`, que é como o grande organizador do nosso jogo, e depois manda ele começar (`simulation.start()`).

### 2. O Grande Organizador: `BallPoolSimulation`

A classe `BallPoolSimulation` é como o diretor de uma peça de teatro. Ela é responsável por chamar todos os "atores" (as outras partes do código) e garantir que cada um faça seu papel na hora certa.

Quando o `BallPoolSimulation` é criado, ele imediatamente chama uma função chamada `initializeGame()` para preparar tudo.

```typescript
class BallPoolSimulation {
  // ... (aqui dentro ficam guardadas todas as peças do jogo)

  constructor() {
    // Quando um BallPoolSimulation é criado, ele já começa a organizar o jogo
    this.initializeGame();
  }

  private initializeGame(): void {
    // Aqui dentro, ele cria e configura todas as partes importantes...
    // Vamos ver quais são elas!
  }

  // ... (outras funções como start, stop, restartGame)
}
```

### 3. As Peças do Quebra-Cabeça: Os Componentes

Dentro do `initializeGame()`, o `BallPoolSimulation` cria várias peças importantes (que chamamos de componentes ou classes) para o jogo funcionar:

- **`Engine` (O Motor da Física):**

  - **O que faz?** Essa é a parte mais mágica! É o motor que calcula a física do jogo: a gravidade que puxa as bolinhas para baixo, como elas quicam umas nas outras e nas paredes. Ele também desenha tudo na tela para você ver.
  - **Exemplo:**
    ```typescript
    // Cria o motor e diz onde ele vai desenhar (document.body) e o tamanho da tela
    this.engine = new Engine({
      element: document.body,
      width: window.innerWidth,
      height: window.innerHeight,
      background: "#F0F0F0", // Cor do fundo
      wireframes: false, // Mostra as formas coloridas, não só o contorno
    });
    ```

- **`DebugControl` (O Detetive):**

  - **O que faz?** Às vezes, quem está criando o jogo precisa ver o que está acontecendo "por dentro", como as linhas que formam as paredes invisíveis ou informações sobre a física. O `DebugControl` permite ligar e desligar essa "visão de raio-x" apertando uma tecla (geralmente 'D').
  - **Exemplo:**
    ```typescript
    // Cria o controle de debug, passando o motor e o renderizador para ele
    this.debugControl = new DebugControl(
      this.engine.getEngine(),
      this.engine.getRender()
    );
    ```

- **`BodyFactory` (A Fábrica de Formas):**

  - **O que faz?** Quando você clica na tela, quer que uma nova bolinha (ou outra forma) apareça, certo? A `BodyFactory` é responsável por criar essas novas formas, definindo seu tamanho, cor e como elas se comportam na física.
  - **Exemplo:**
    ```typescript
    // Cria a fábrica de formas, passando o controle de debug para ela
    this.bodyFactory = new BodyFactory(this.debugControl);
    ```

- **`GameManager` (O Gerente do Jogo):**

  - **O que faz?** Pense nele como o juiz ou o gerente da partida. Ele pode guardar informações importantes (como quantas bolinhas ainda estão na tela) e também sabe como reiniciar o jogo se você pedir. Ele é especial porque só existe _um_ gerente para o jogo todo (isso se chama _Singleton_).
  - **Exemplo:**
    ```typescript
    // Pega a única instância do gerente do jogo
    this.gameManager = GameManager.getInstance();
    // Diz ao gerente qual é o motor de física que ele deve usar
    this.gameManager.setEngine(this.engine);
    // Ensina ao gerente o que fazer para reiniciar o jogo (chamar a função restartGame)
    this.gameManager.setRestartCallback(() => this.restartGame());
    ```

- **`BoundaryWalls` (As Paredes Invisíveis):**

  - **O que faz?** Para as bolinhas não caírem para fora da tela, precisamos de paredes! Essa classe cria quatro paredes invisíveis: uma em cima, uma embaixo, uma na esquerda e uma na direita. Elas funcionam como as bordas da piscina de bolinhas.
  - **Exemplo:**
    ```typescript
    // Cria as paredes invisíveis, usando o motor e o tamanho da tela
    this.boundaryWalls = new BoundaryWalls(
      this.engine,
      window.innerWidth,
      window.innerHeight
    );
    ```

- **`BoundaryBox` (A Caixa em U):**

  - **O que faz?** Além das paredes externas, tem aquela estrutura em forma de "U" no meio da tela, certo? Essa classe é responsável por criar essas três paredes que formam o U.
  - **Exemplo:**
    ```typescript
    // Cria a caixa em U, também usando o motor e o tamanho da tela
    this.boundaryBox = new BoundaryBox(
      this.engine,
      window.innerWidth,
      window.innerHeight
    );
    ```

- **`InitialShapes` (As Formas Iniciais):**

  - **O que faz?** Quando o jogo começa, ele não está vazio. Já existem algumas bolinhas e talvez outras formas lá dentro. Essa classe é quem coloca essas formas iniciais na tela assim que o jogo carrega.
  - **Exemplo:**
    ```typescript
    // Cria as formas que aparecem no início do jogo
    this.initialShapes = new InitialShapes(this.engine);
    ```
  - Logo depois de criar as formas iniciais, o código conta quantas formas _que se movem_ foram criadas e avisa o `GameManager`.

- **`InputHandler` (O Ouvido do Jogo):**

  - **O que faz?** Como o jogo sabe que você clicou com o mouse ou apertou uma tecla? O `InputHandler` fica "ouvindo" essas ações. Quando você clica, ele pede para a `BodyFactory` criar uma nova forma naquele lugar. Quando você aperta a tecla de debug, ele avisa o `DebugControl`.
  - **Exemplo:**
    ```typescript
    // Cria o "ouvinte" de ações do usuário
    this.inputHandler = new InputHandler(
      this.engine, // Precisa saber do motor
      this.bodyFactory, // Precisa da fábrica para criar formas
      this.debugControl // Precisa do controle de debug para ligar/desligar
    );
    ```

- **`BodyWrapper` (O Teletransporte Mágico):**

  - **O que faz?** Já reparou que se uma bolinha sai pela direita da tela, ela aparece de volta na esquerda (e vice-versa)? Esse efeito de "dar a volta" é feito pelo `BodyWrapper`. Ele fica de olho nas formas e, se uma delas sai por um lado, ele a teletransporta para o outro lado!
  - **Exemplo:**

    ```typescript
    // Cria o "teletransportador"
    this.bodyWrapper = new BodyWrapper({
      min: { x: -100, y: 0 }, // Onde começa a área de teletransporte na esquerda
      max: { x: window.innerWidth + 100, y: window.innerHeight }, // Onde termina na direita
    });

    // Configura o motor para usar o teletransporte antes de cada cálculo de física
    this.setupBodyWrapping();
    ```

  - A função `setupBodyWrapping` avisa o motor de física (`Engine`) para, _antes_ de calcular o próximo movimento das peças, verificar se alguma precisa ser teletransportada pelo `BodyWrapper`.

### 4. Reiniciando a Brincadeira: `restartGame()`

Se o `GameManager` decidir que é hora de reiniciar (talvez porque você apertou um botão de "Reset"), ele vai usar a função `restartGame` que o `BallPoolSimulation` ensinou a ele.

```typescript
private restartGame(): void {
    console.log("Reiniciando o jogo..."); // Avisa no console que está reiniciando

    // 1. Tira todas as formas da tela
    Matter.Composite.clear(this.engine.getWorld(), false, true);

    // 2. Recria as paredes invisíveis
    this.boundaryWalls = new BoundaryWalls(...);

    // 3. Recria a caixa em U
    this.boundaryBox = new BoundaryBox(...);

    // 4. Recria as formas iniciais
    this.initialShapes = new InitialShapes(this.engine);

    // 5. Conta de novo quantas formas tem e avisa o GameManager
    this.countAndSetInitialBodies();

    console.log("Jogo reiniciado!"); // Avisa que terminou
}
```

Basicamente, ele limpa a tela e cria as paredes e as formas iniciais tudo de novo!

### 5. Luz, Câmera, Ação! `start()`

Depois que o `initializeGame()` preparou tudo, a última coisa que o `window.onload` faz é chamar `simulation.start()`.

```typescript
public start(): void {
    // Manda o motor de física e o desenhista começarem a trabalhar!
    this.engine.start();
}
```

Essa função simplesmente liga o motor de física (`Engine`), que começa a calcular os movimentos e a desenhar tudo na tela, fazendo o jogo ganhar vida!

E é assim que o arquivo `main.ts` organiza e inicia todo o nosso jogo de piscina de bolinhas! Cada classe tem seu papel, trabalhando juntas como uma grande equipe.

## Mergulhando nos Componentes: Um por Um

Agora que vimos como o `BallPoolSimulation` organiza tudo, vamos entender melhor o que cada uma daquelas peças (classes) faz.

### `Engine` (O Coração da Física e do Desenho)

Arquivo: `src/core/Engine.ts`

Pense na `Engine` como o coração e os olhos do nosso jogo. Ela usa a biblioteca Matter.js para fazer duas coisas super importantes:

1.  **Calcular a Física:** Ela sabe como a gravidade funciona, como as bolinhas devem quicar quando batem umas nas outras ou nas paredes, e como elas rolam e giram. É ela quem faz tudo parecer real!
2.  **Desenhar na Tela:** Não adianta calcular tudo se a gente não puder ver, né? A `Engine` também é responsável por desenhar todas as formas, as paredes e o fundo na tela do jogo.

**Como ela é criada?**

Lá no `BallPoolSimulation`, lembra? Ele passa algumas informações importantes:

```typescript
// Dentro do BallPoolSimulation.initializeGame()

this.engine = new Engine({
  element: document.body, // Onde o desenho vai aparecer (na página inteira)
  width: window.innerWidth, // Largura da tela
  height: window.innerHeight, // Altura da tela
  background: "#F0F0F0", // Cor de fundo
  wireframes: false, // Desenhar formas preenchidas (true = só contornos)
  // showAngleIndicator: false,   // Mostrar um risquinho indicando a rotação (opcional)
});
```

**O que tem dentro da `Engine`?**

Ela guarda as peças principais do Matter.js:

- `engine`: O cérebro que calcula a física.
- `world`: O "mundo" onde todas as formas (bolinhas, paredes) vivem.
- `render`: O "desenhista" que mostra o `world` na tela.
- `runner`: O "maestro" que diz para o `engine` e o `render` trabalharem juntos e atualizarem a física e o desenho muitas vezes por segundo, criando a animação.

**O que a `Engine` sabe fazer?**

Ela tem funções (métodos) para controlar a simulação:

- `start()`: Liga o `runner` e o `render`. O jogo começa a rodar!
  ```typescript
  public start(): void {
      Matter.Render.run(this.render); // Começa a desenhar
      Matter.Runner.run(this.runner, this.engine); // Começa a calcular a física
  }
  ```
- `stop()`: Desliga o `runner` e o `render`. O jogo pausa.
  ```typescript
  public stop(): void {
      Matter.Render.stop(this.render); // Para de desenhar
      Matter.Runner.stop(this.runner); // Para de calcular a física
  }
  ```
- `addBody(body)`: Adiciona uma nova forma (ou várias) no `world`. É assim que as paredes, a caixa U e as formas iniciais entram no jogo.
  ```typescript
  public addBody(body: Matter.Body | Matter.Body[]): void {
      Matter.Composite.add(this.world, body); // Adiciona ao mundo
  }
  ```
- `removeBody(body)`: Tira uma forma do `world`. (Não usamos muito neste jogo, mas é útil).
- `getAllBodies()`: Devolve uma lista de todas as formas que estão no `world` naquele momento. O `BallPoolSimulation` usa isso para contar as formas iniciais e o `BodyWrapper` usa para teletransportar todo mundo.
  ```typescript
  public getAllBodies(): Matter.Body[] {
      return Matter.Composite.allBodies(this.world); // Pega tudo do mundo
  }
  ```
- `lookAt(bounds)`: Ajusta a "câmera" do `render` para focar em uma área específica. Usamos isso no começo para garantir que toda a tela do jogo esteja visível.
- `getEngine()`, `getWorld()`, `getRender()`, `getRunner()`, `getCanvas()`: Funções para pegar as peças internas do Matter.js, caso outras partes do código precisem delas (como o `DebugControl` ou o `InputHandler`).

Resumindo: A `Engine` é a base de tudo. Ela cuida da física e do desenho, e oferece as ferramentas para controlar a simulação e adicionar/remover objetos. Sem ela, não teríamos nosso jogo de piscina de bolinhas!

### `DebugControl` (O Detetive do Jogo)

Arquivo: `src/components/DebugControl.ts`

Imagina que você é um detetive investigando como o jogo funciona por dentro. O `DebugControl` é a sua lupa mágica! Ele te ajuda a ver coisas que normalmente ficam escondidas.

**O que ele faz?**

1.  **Cria um Botão Secreto:** Ele adiciona um pequeno botão (na verdade, uma caixinha de marcar) na tela do jogo.
2.  **Liga/Desliga a Visão de Raio-X:** Quando você marca essa caixinha (ou aperta a tecla 'D', como configurado no `InputHandler`), ele ativa o "modo detetive" (debug mode). Isso faz a `Engine` mostrar informações extras na tela:
    - Contornos das formas (`wireframes`).
    - Indicadores de ângulo (para ver como as formas estão girando).
    - Linhas mostrando onde as colisões aconteceram.
    - Pontinhos mostrando a posição exata de cada forma.
    - Setinhas mostrando a velocidade das formas.
    - Números de identificação (ID) de cada forma.
3.  **Permite "Pegar" as Formas:** No modo detetive, você pode clicar e arrastar as bolinhas e outras formas com o mouse, como se tivesse uma mão mágica! Isso é feito adicionando uma coisa chamada `MouseConstraint` ao motor de física. Quando você desliga o modo detetive, essa "mão mágica" some.
4.  **Lembra da sua Escolha:** Se você ativar o modo detetive e depois fechar e abrir o jogo de novo, ele vai lembrar que você deixou ativado (ele guarda isso no `localStorage` do navegador).
5.  **Avisa os Outros:** Se alguma outra parte do código precisar saber se o modo detetive está ligado ou desligado (como a `BodyFactory`), ela pode pedir para o `DebugControl` avisar quando isso mudar (`onChange`).
6.  **Mostra Mensagens Secretas:** Ele também tem uma função `logEvent` que só mostra mensagens no "console" do navegador (uma área para mensagens de programador) se o modo detetive estiver ligado.

**Como ele é criado?**

Lá no `BallPoolSimulation`, ele é criado passando a `Engine` e o `Render` (o desenhista da Engine):

```typescript
// Dentro do BallPoolSimulation.initializeGame()

this.debugControl = new DebugControl(
  this.engine.getEngine(), // Precisa do motor para adicionar/remover a "mão mágica"
  this.engine.getRender() // Precisa do desenhista para mudar as opções de visualização
);
```

**Como ele funciona por dentro?**

Quando você clica na caixinha, a função `updateDebugMode()` é chamada:

```typescript
private updateDebugMode(): void {
    this.isDebugMode = this.checkbox.checked; // Vê se a caixa está marcada

    // Atualiza as opções do desenhista (render)
    this.render.options.showAngleIndicator = this.isDebugMode;
    this.render.options.wireframes = this.isDebugMode;
    // ... e todas as outras opções de visualização

    if (this.isDebugMode) {
        // Se ligou o modo detetive:
        // Cria o mouse e a "mão mágica" (MouseConstraint)
        this.mouse = Matter.Mouse.create(this.render.canvas);
        this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {...});
        // Adiciona a "mão mágica" no mundo da física
        Matter.Composite.add(this.engine.world, this.mouseConstraint);
        // Conecta o mouse ao desenhista
        this.render.mouse = this.mouse;
    } else {
        // Se desligou o modo detetive:
        // Remove a "mão mágica" do mundo
        if (this.mouseConstraint) {
            Matter.Composite.remove(this.engine.world, this.mouseConstraint);
        }
    }

    // Salva o estado (ligado/desligado) no localStorage
    localStorage.setItem("debugMode", String(this.isDebugMode));

    // Avisa quem pediu para ser avisado (callbacks)
    this.onChangeCallbacks.forEach((callback) => callback(this.isDebugMode));
}
```

Resumindo: O `DebugControl` é uma ferramenta super útil para quem está criando ou estudando o jogo. Ele permite ver os "bastidores" da física e interagir com as formas de um jeito diferente.

### `BodyFactory` (A Fábrica de Formas)

Arquivo: `src/components/BodyFactory.ts`

Sabe quando você clica na tela e uma nova bolinha, quadrado ou outra forma aparece magicamente? Quem faz essa mágica acontecer é a `BodyFactory`! Ela é como uma fábrica que sabe construir diferentes tipos de peças para o nosso jogo.

**O que ela faz?**

Ela tem "receitas" para criar as formas básicas que usamos no Matter.js:

1.  **`createCircle(x, y, raio, opcoes)`:** Cria uma bolinha redonda.

    - `x`, `y`: Onde o centro da bolinha vai aparecer na tela.
    - `raio`: O tamanho da bolinha.
    - `opcoes`: Coisas extras que você pode definir, como:
      - `restitution`: O quão "saltitante" a bolinha é (perto de 1.0 quica muito, perto de 0.0 quase não quica). O padrão é 0.9 (bem saltitante).
      - `friction`: O quanto ela "agarra" quando esfrega em outras coisas. O padrão é 0.1 (escorrega bastante).
      - `render`: Como a bolinha vai ser desenhada (cor de preenchimento, cor da borda, espessura da borda). Se você não escolher uma cor, ela escolhe um tom de vermelho aleatório!
    - **Exemplo:**
      ```typescript
      // Cria uma bolinha vermelha saltitante no ponto (100, 50) com raio 20
      const minhaBolinha = factory.createCircle(100, 50, 20, {
        restitution: 0.95,
        render: { fillStyle: "red" },
      });
      engine.addBody(minhaBolinha); // Não esqueça de adicionar no motor!
      ```

2.  **`createPolygon(x, y, lados, raio, opcoes)`:** Cria uma forma com vários lados retos (triângulo, quadrado, pentágono, etc.).

    - `x`, `y`: Onde o centro da forma vai aparecer.
    - `lados`: Quantos lados a forma vai ter (3 para triângulo, 4 para quadrado, etc.).
    - `raio`: A distância do centro até as pontas da forma.
    - `opcoes`: As mesmas opções extras da bolinha (restitution, friction, render). A cor padrão aqui é um tom de verde aleatório.
    - **Exemplo:**
      ```typescript
      // Cria um triângulo verde no ponto (200, 100) com "raio" 30
      const meuTriangulo = factory.createPolygon(200, 100, 3, 30);
      engine.addBody(meuTriangulo);
      ```

3.  **`createRectangle(x, y, largura, altura, opcoes)`:** Cria um retângulo (ou quadrado).

    - `x`, `y`: Onde o centro do retângulo vai aparecer.
    - `largura`, `altura`: O tamanho do retângulo.
    - `opcoes`: As mesmas opções extras. A cor padrão é um tom de azul aleatório.
    - **Exemplo:**
      ```typescript
      // Cria um retângulo azul de 50 de largura por 30 de altura em (300, 150)
      // que não quica muito (restitution baixa)
      const meuRetangulo = factory.createRectangle(300, 150, 50, 30, {
        restitution: 0.2,
      });
      engine.addBody(meuRetangulo);
      ```
    - **Importante:** As paredes invisíveis (`BoundaryWalls`) e a caixa U (`BoundaryBox`) também usam `createRectangle`, mas elas passam uma opção especial `isStatic: true` para que essas formas não se movam e não caiam com a gravidade.

4.  **`createRandomBody(x, y)`:** Cria uma forma aleatória!
    - `x`, `y`: Onde a forma vai aparecer.
    - Ela sorteia um número e decide se vai criar uma bolinha, um polígono (com número de lados e tamanho aleatórios) ou um retângulo (com tamanho aleatório). É essa função que o `InputHandler` usa quando você clica na tela!
    - **Exemplo (usado pelo `InputHandler`):**
      ```typescript
      // Quando o usuário clica no ponto (mouseX, mouseY)
      const novaForma = factory.createRandomBody(mouseX, mouseY);
      engine.addBody(novaForma);
      ```

**Conexão com o Detetive (`DebugControl`)**

Toda vez que a `BodyFactory` cria uma forma, ela avisa o `DebugControl` usando a função `logEvent`. Se o modo detetive estiver ligado, você verá uma mensagem no console do navegador dizendo qual tipo de forma foi criada, seu ID, posição e tamanho. Isso ajuda a entender o que está acontecendo!

```typescript
// Dentro de createCircle, por exemplo:
this.debugControl.logEvent("Circle Created", {
  /* detalhes da bolinha */
});
```

Resumindo: A `BodyFactory` é essencial para popular o nosso mundo com objetos. Ela sabe como construir diferentes formas com características físicas e visuais específicas, e ainda ajuda na depuração avisando o `DebugControl` sobre suas criações.

### `GameManager` (O Gerente do Jogo)

Arquivo: `src/core/GameManager.ts`

Pense no `GameManager` como o técnico ou o juiz do jogo. Ele não participa diretamente da física (como a `Engine`) nem cria as formas (como a `BodyFactory`), mas ele acompanha o que está acontecendo e gerencia as regras e o estado geral do jogo.

**Por que ele é especial (Singleton)?**

No nosso jogo, só precisamos de _um_ gerente. Não faz sentido ter vários juízes dando regras diferentes, certo? Por isso, o `GameManager` é feito de um jeito especial chamado **Singleton**. Isso significa que, não importa quantas vezes o código tente criar um `GameManager`, ele sempre vai dar a mesma instância (o mesmo objeto) que já existe.

```typescript
// Como o BallPoolSimulation pega o GameManager:
this.gameManager = GameManager.getInstance();

// Dentro do GameManager:
private static instance: GameManager; // Guarda a única instância

public static getInstance(): GameManager {
    if (!GameManager.instance) { // Se ainda não existe...
        GameManager.instance = new GameManager(); // ...cria uma nova.
    }
    return GameManager.instance; // Devolve a instância (nova ou a que já existia).
}

private constructor() {
    // O "construtor" é privado, ninguém de fora pode criar um novo GameManager diretamente.
    this.initializeUIElements();
}
```

**O que ele faz?**

1.  **Controla a Pontuação (`score`) e Tentativas (`attempts`):**

    - Ele guarda quantos pontos você fez (neste jogo, parece que a pontuação não está sendo usada ativamente, mas a estrutura está lá) e quantas vezes você tentou algo (como clicar para adicionar uma forma).
    - Tem funções como `addScore()` e `addAttempt()` para aumentar esses números.
    - Tem `getScore()` e `getAttempts()` para saber os valores atuais.
    - Tem `resetScore()`, `resetAttempts()` e `resetGame()` para zerar tudo quando o jogo reinicia.

2.  **Atualiza as Informações na Tela:**

    - Ele encontra os lugares na página HTML (usando `document.getElementById`) onde a pontuação e as tentativas devem ser mostradas (`score-display`, `attempts-display`).
    - Sempre que a pontuação ou as tentativas mudam, ele chama `updateScoreDisplay()` ou `updateAttemptsDisplay()` para mostrar os novos valores na tela.

    ```typescript
    private updateScoreDisplay(): void {
        this.scoreElement.textContent = `Score: ${this.score}`;
    }

    private updateAttemptsDisplay(): void {
        this.attemptsElement.textContent = `Attempts: ${this.attempts}`;
    }
    ```

3.  **Sabe Quantas Formas Tinham no Começo (`initialBodyCount`):**

    - O `BallPoolSimulation` conta quantas formas _que se movem_ foram criadas no início pela `InitialShapes` e avisa o `GameManager` usando `setInitialBodyCount()`. Isso é importante para saber quando o jogo acaba.

4.  **Verifica se o Jogo Acabou (`checkGameOver`):**

    - Essa função é chamada (por exemplo, quando a pontuação aumenta, embora neste jogo o fim seja pela ausência de corpos).
    - Ela pede para a `Engine` a lista de todas as formas que ainda estão no mundo e que _não_ são estáticas (ou seja, que podem se mover).
    - Se essa lista estiver vazia (e se tinha alguma forma no começo), significa que todas as formas móveis foram "coletadas" ou removidas. Fim de jogo!
    - Ele marca que o jogo acabou (`this.isGameOver = true;`) e chama a função para mostrar a tela de "Game Over".

    ```typescript
     public checkGameOver(): void {
         if (this.isGameOver || !this.engine) return; // Se já acabou ou não tem engine, sai

         const nonStaticBodies = this.engine.getAllBodies().filter(body => !body.isStatic);

         if (nonStaticBodies.length === 0 && this.initialBodyCount > 0) {
             this.isGameOver = true;
             console.log("Game over! All bodies collected.");
             this.showGameOverModal(); // Mostra a tela de fim de jogo
         }
     }
    ```

    *(Nota: No código atual, `checkGameOver` é chamado em `addScore`, mas faria mais sentido chamá-lo quando um corpo é removido ou em um loop de verificação. O importante é que ele sabe *como* verificar).*

5.  **Mostra a Tela de "Game Over":**

    - Ele encontra os elementos da tela de fim de jogo no HTML (`game-over-modal`, `final-score`, `restart-button`).
    - Quando o jogo acaba, ele chama `showGameOverModal()`, que atualiza as informações finais (pontuação, tentativas, talvez uma porcentagem de acerto) e torna essa tela visível.

6.  **Sabe Como Reiniciar o Jogo:**

    - O `BallPoolSimulation` ensina ao `GameManager` qual função chamar para reiniciar tudo, usando `setRestartCallback()`.
    - Quando o jogador clica no botão "Restart" na tela de "Game Over", o `GameManager` faz o seguinte:
      - Esconde a tela de "Game Over" (`hideGameOverModal()`).
      - Zera a pontuação e as tentativas (`resetGame()`).
      - Chama a função de reiniciar que o `BallPoolSimulation` ensinou (`this.restartCallback()`), que vai limpar o mundo e recriar tudo.

    ```typescript
    // No botão de restart:
    this.restartButton.addEventListener("click", () => {
        this.restartGame();
    });

    private restartGame(): void {
        this.hideGameOverModal();
        this.resetGame(); // Zera score, attempts, isGameOver
        if (this.restartCallback) {
            this.restartCallback(); // Chama a função do BallPoolSimulation
        }
    }
    ```

Resumindo: O `GameManager` é o centro de controle do estado do jogo. Ele não mexe diretamente com a física, mas acompanha o placar, as tentativas, sabe quando o jogo acaba e como reiniciá-lo, além de manter a interface do usuário atualizada.

### `BoundaryWalls` (As Paredes da Piscina)

Arquivo: `src/components/BoundaryWalls.ts`

Imagine a piscina de bolinhas: ela precisa ter paredes em volta para as bolinhas não saírem rolando por todo lado, certo? A classe `BoundaryWalls` faz exatamente isso no nosso jogo! Ela cria as quatro paredes invisíveis (ou quase invisíveis) nas bordas da tela.

**O que ela faz?**

1.  **Constrói as Paredes:** Assim que ela é criada, ela chama a função `createWalls()` para construir as quatro paredes.
2.  **Usa Retângulos Fixos:** Cada parede é, na verdade, um retângulo criado com `Matter.Bodies.rectangle` (a mesma função que a `BodyFactory` usa!). Mas tem um segredo: essas paredes recebem a opção `{ isStatic: true }`. Isso significa que elas são **estáticas**, ou seja, não se movem, não caem com a gravidade e não reagem a batidas (só fazem as outras coisas quicarem nelas).
3.  **Posiciona nas Bordas:** A função `createWalls` calcula direitinho onde cada retângulo deve ficar para formar as bordas da tela:
    - **Parede de Baixo:** Fica na parte de baixo (`y = height`), ocupando toda a largura (`width`).
    - **Parede da Esquerda:** Fica na borda esquerda (`x = 0`), ocupando toda a altura (`height`).
    - **Parede da Direita:** Fica na borda direita (`x = width`), ocupando toda a altura (`height`).
    - **Parede de Cima:** Fica na parte de cima (`y = 0`), ocupando toda a largura (`width`).
    - Elas têm uma pequena espessura (altura ou largura de `50.5`) para garantir que nada passe.
4.  **Adiciona no Jogo:** Depois de criar as quatro paredes, ela guarda elas em uma lista (`this.walls`) e manda a `Engine` adicioná-las ao mundo da física (`this.engine.addBody(this.walls)`).

**Como ela é criada?**

Lá no `BallPoolSimulation`, ela precisa saber qual é a `Engine` e qual o tamanho da tela (`width`, `height`):

```typescript
// Dentro do BallPoolSimulation.initializeGame()

this.boundaryWalls = new BoundaryWalls(
  this.engine, // Precisa da engine para adicionar as paredes
  window.innerWidth, // Largura da tela
  window.innerHeight // Altura da tela
);
```

**Exemplo de como uma parede é criada (a de baixo):**

```typescript
// Dentro de BoundaryWalls.createWalls()

const bottomWall = Matter.Bodies.rectangle(
  this.width / 2, // Posição X: Metade da largura da tela
  this.height, // Posição Y: Na base da tela
  this.width, // Largura: A largura inteira da tela
  50.5, // Altura: Uma espessura pequena
  {
    isStatic: true, // IMPORTANTE: Não se move!
    render: {
      fillStyle: "#060a19", // Cor azul escura (quase preta)
      // ... outras opções de desenho
    },
  }
);
```

As outras paredes (esquerda, direita, cima) são criadas de forma parecida, mudando as posições e trocando largura/altura.

**E se a tela mudar de tamanho?**

A classe tem uma função `resize(width, height)` que sabe como remover as paredes antigas e criar novas com o tamanho certo. No nosso jogo atual, isso não está sendo usado ativamente quando a janela muda de tamanho, mas a função existe!

Resumindo: A `BoundaryWalls` é fundamental para manter a "bagunça" dentro da tela. Ela cria as quatro barreiras fixas que definem a área de jogo.

### `BoundaryBox` (A Caixa Coletora em U)

Arquivo: `src/components/BoundaryBox.ts`

Além das paredes que cercam toda a tela, temos aquela caixa aberta em cima, em forma de U, que fica geralmente no canto inferior direito. Essa é a `BoundaryBox`! Ela não serve só de obstáculo, mas também como um "coletor" ou "gol".

**O que ela faz?**

1.  **Constrói a Caixa em U:** Assim como a `BoundaryWalls`, ela usa `Matter.Bodies.rectangle` com a opção `{ isStatic: true }` para criar as três paredes (fundo, esquerda e direita) que formam o U. A parte de cima fica aberta.
2.  **Posiciona no Canto:** Ela calcula a posição para que a caixa fique perto do canto inferior direito da tela, usando o tamanho da tela (`width`, `height`) e as dimensões definidas para a caixa (`BoxA_width`, `BoxA_height`).
3.  **Adiciona no Jogo:** As três partes da caixa são adicionadas à `Engine`.

**Como ela é criada?**

No `BallPoolSimulation`, ela também precisa da `Engine` e do tamanho da tela:

```typescript
// Dentro do BallPoolSimulation.initializeGame()

this.boundaryBox = new BoundaryBox(
  this.engine,
  window.innerWidth,
  window.innerHeight
);
```

**A Parte Especial: O Coletor!**

A `BoundaryBox` tem um trabalho extra muito importante: ela funciona como um "gol" ou um "coletor de bolinhas".

1.  **Fica de Olho:** Ela usa `Matter.Events.on` para "ouvir" dois tipos de eventos do motor de física:

    - `'afterUpdate'`: Depois que a física é calculada em cada passo, ela chama `checkBodiesInBox()`.
    - `'collisionStart'`: Quando uma colisão _começa_ a acontecer, ela chama `handleCollision()`. _(Nota: O código atual parece ter duas lógicas um pouco redundantes para detectar a entrada na caixa, uma em `checkBodiesInBox` e outra em `handleCollision`. A ideia principal é a mesma)._

2.  **Verifica se Entrou:** As funções `checkBodiesInBox` e `handleCollision` pegam as formas que estão se movendo ou colidindo e usam a função `isBodyInBox` (ou `isBodyInsideBox`) para ver se o _centro_ da forma entrou na área definida pela caixa U (`this.boxDimensions`).

    ```typescript
    // Dentro de isBodyInBox (simplificado)
    private isBodyInBox(body: Matter.Body): boolean {
        const { x, y } = body.position; // Pega a posição do centro da forma
        // Verifica se o X está entre a esquerda e a direita da caixa
        const dentroX = x > this.boxDimensions.x && x < this.boxDimensions.x + this.boxDimensions.width;
        // Verifica se o Y está entre o topo e a base da caixa (com um ajuste no código original)
        const dentroY = y > this.boxDimensions.y + 85 && y < this.boxDimensions.y + this.boxDimensions.height;
        return dentroX && dentroY; // Só está dentro se estiver dentro nos dois eixos
    }
    ```

    _(Observação: A condição `y > this.boxDimensions.y + 85` parece um pouco estranha, talvez fosse para detectar só se entrasse bem no fundo? A função `isBodyInsideBox` parece mais correta para a área total)._

3.  **Coleta a Forma:** Se a função `isBodyInBox` (ou `isBodyInsideBox`) diz que a forma entrou:
    - **Ponto!** Ela avisa o `GameManager` para adicionar um ponto: `this.gameManager.addScore()`.
    - **Some!** Ela remove a forma do jogo: `this.engine.removeBody(body)` ou `Matter.Composite.remove(this.engine.getWorld(), otherBody)`. A bolinha desaparece!
    - **Acabou?** Ela avisa o `GameManager` para verificar se o jogo acabou (se todas as formas foram coletadas): `this.gameManager.checkGameOver()`.

**E se a tela mudar de tamanho?**

Assim como as `BoundaryWalls`, ela também tem uma função `resize()` para recriar a caixa no lugar certo se a tela mudar de tamanho.

Resumindo: A `BoundaryBox` não é só um obstáculo, é o objetivo do jogo! Ela cria a estrutura em U e fica vigiando. Quando uma forma entra nela, a forma é removida, você ganha um ponto (teoricamente), e o jogo verifica se chegou ao fim.

### `InitialShapes` (As Primeiras Formas na Tela)

Arquivo: `src/components/InitialShapes.ts`

Quando o jogo começa, a tela não está vazia, certo? Já tem algumas formas lá esperando para você interagir. Quem coloca essas formas iniciais é a classe `InitialShapes`.

**O que ela faz?**

1.  **Cria as Formas Iniciais:** Assim que é criada, ela chama a função `createShapes()`.
2.  **Define as Formas:** Dentro de `createShapes()`, ela decide quais formas vão aparecer no começo. No nosso caso, são três:
    - Um triângulo verde (`Matter.Bodies.polygon` com 3 lados).
    - Um pentágono azul (`Matter.Bodies.polygon` com 5 lados).
    - Um quadrado amarelo (`Matter.Bodies.rectangle`).
3.  **Define Posição e Propriedades:** Para cada forma, ela define:
    - A posição inicial na tela (x, y).
    - O tamanho (raio para os polígonos, largura/altura para o retângulo).
    - Propriedades físicas como `restitution` (o quão saltitante é) e `friction` (atrito).
    - Propriedades visuais (`render`) como cor de preenchimento (`fillStyle`), cor da borda (`strokeStyle`) e espessura da borda (`lineWidth`).
4.  **Adiciona no Jogo:** Depois de criar as três formas, ela as guarda em uma lista (`this.shapes`) e manda a `Engine` adicioná-las ao mundo da física (`this.engine.addBody(this.shapes)`).

**Como ela é criada?**

No `BallPoolSimulation`, ela só precisa saber qual é a `Engine` para poder adicionar as formas:

```typescript
// Dentro do BallPoolSimulation.initializeGame()

this.initialShapes = new InitialShapes(this.engine);
```

**Exemplo de como uma forma inicial é criada (o triângulo):**

```typescript
// Dentro de InitialShapes.createShapes()

const triangle = Matter.Bodies.polygon(
  200, // Posição X
  460, // Posição Y
  3, // Número de lados
  60, // "Raio" (tamanho)
  {
    restitution: 0.9, // Bem saltitante
    friction: 0.1, // Escorrega fácil
    render: {
      fillStyle: "#4CAF50", // Verde
      strokeStyle: "#388E3C", // Borda verde escura
      lineWidth: 2,
    },
  }
);
```

O pentágono e o retângulo são criados de forma parecida.

**Importante:** Logo depois que o `BallPoolSimulation` cria as `InitialShapes`, ele chama a função `countAndSetInitialBodies()`. Essa função pega todas as formas que _não_ são estáticas (ou seja, as formas criadas aqui, e não as paredes) e avisa o `GameManager` quantas são. Isso é crucial para o `GameManager` saber quando o jogo termina (quando todas essas formas iniciais forem coletadas na `BoundaryBox`).

Resumindo: A `InitialShapes` é responsável por dar o pontapé inicial na "bagunça" da piscina de bolinhas, colocando as primeiras formas coloridas na tela para o jogador interagir.

### `InputHandler` (O Ouvido Atento do Jogo)

Arquivo: `src/components/InputHandler.ts`

Como o jogo sabe que você clicou em algum lugar, mexeu o mouse ou apertou uma tecla? É o `InputHandler` que faz esse trabalho! Ele fica "escutando" todas essas ações que você faz e decide o que fazer no jogo.

**O que ele faz?**

1.  **Escuta Eventos:** Assim que é criado, ele começa a prestar atenção (`addEventListener`) em vários eventos que podem acontecer na área do jogo (o `canvas`):

    - `mousedown`: Quando você aperta um botão do mouse.
    - `mouseup`: Quando você solta um botão do mouse.
    - `click`: Quando você completa um clique (apertar e soltar).
    - `contextmenu`: Quando você clica com o botão direito (para evitar que o menu normal do navegador apareça).
    - `mousemove`: Quando você mexe o mouse.
    - `keydown`: Quando você aperta uma tecla do teclado.

2.  **Sabe Onde Você Clicou:** Ele tem uma função `getMousePosition()` para calcular exatamente onde o ponteiro do mouse está dentro da área do jogo, mesmo que a página tenha rolado.

3.  **Reage aos Cliques:**

    - **Clique Esquerdo (`click` sem Ctrl):**
      - Verifica se você clicou em cima de alguma forma (`Matter.Query.point`).
      - Se clicou em uma forma que pode se mover (`!isStatic`):
        - Calcula uma força para "empurrar" a forma para longe do ponto onde você clicou (efeito de repulsão). A força é maior quanto mais longe você clica do centro da forma.
        - Aplica essa força na forma (`Matter.Body.applyForce`).
        - Avisa o `GameManager` que uma tentativa foi feita (`gameManager.addAttempt()`).
        - Se o modo detetive (`DebugControl`) estiver ligado, mostra detalhes sobre a força aplicada no console.
    - **Ctrl + Clique Esquerdo (`click` com Ctrl):**
      - Se você não clicou em nenhuma forma, ele pede para a `BodyFactory` criar uma forma aleatória (`createRandomBody`) no local do clique e a adiciona na `Engine`.

4.  **Reage ao Clique Direito:**

    - **Apertar Botão Direito (`mousedown` com botão 2):**
      - Verifica quais formas estão no ponto clicado (`Matter.Query.point`).
      - Para cada forma encontrada que _não_ seja estática, ele a remove do jogo (`engine.removeBody()`).
      - Se o modo detetive estiver ligado, mostra detalhes sobre a remoção no console.
    - **Menu de Contexto (`contextmenu`):**
      - Ele simplesmente impede que o menu normal do botão direito apareça (`event.preventDefault()`).

5.  **Reage ao Movimento do Mouse (com botão apertado):**

    - **Arrastar com Botão Direito (`mousemove` com botão direito apertado):**
      - Verifica se tem alguma forma _não estática_ embaixo do mouse a cada movimento.
      - Se tiver, remove a primeira que encontrar (`engine.removeBody()`). É como um "apagador" de formas.
    - **Arrastar com Ctrl + Botão Esquerdo (`mousemove` com Ctrl e botão esquerdo apertados):**
      - Cria formas aleatórias (`bodyFactory.createRandomBody`) continuamente por onde o mouse passa.
      - Tem um pequeno controle de tempo (`lastCreationTime`) para não criar _muitas_ formas de uma vez só e deixar o jogo lento.

6.  **Reage ao Teclado:**
    - **Tecla Delete (`keydown` com `event.key === "Delete"`):**
      - Procura a primeira forma _não estática_ que encontrar no jogo.
      - Remove essa forma (`engine.removeBody()`).
      - Se o modo detetive estiver ligado, mostra detalhes no console.

**Como ele é criado?**

No `BallPoolSimulation`, ele precisa de várias peças para funcionar:

```typescript
// Dentro do BallPoolSimulation.initializeGame()

this.inputHandler = new InputHandler(
  this.engine, // Precisa da engine para adicionar/remover formas e pegar o canvas
  this.bodyFactory, // Precisa da fábrica para criar formas aleatórias
  this.debugControl // Precisa do controle de debug para mostrar logs
);
// Ele também pega o GameManager internamente para contar as tentativas.
```

Resumindo: O `InputHandler` é a ponte entre você (o jogador) e o mundo do jogo. Ele traduz seus cliques e teclas em ações como criar, empurrar ou remover as formas, tornando a simulação interativa.

### `BodyWrapper` (O Teletransporte Mágico)

Arquivo: `src/utils/BodyWrapper.ts`

Lembra daqueles jogos antigos como Pac-Man ou Asteroids, onde o personagem saía por um lado da tela e aparecia do outro? O `BodyWrapper` faz algo parecido no nosso jogo! Ele é o responsável por fazer as formas "darem a volta" na tela.

**O que ele faz?**

1.  **Define a Área Mágica (`bounds`):** Quando ele é criado, ele recebe os limites (`bounds`) da área onde o teletransporte vai acontecer. Essa área é definida por coordenadas mínimas (canto superior esquerdo) e máximas (canto inferior direito). No nosso jogo, essa área é um pouco maior que a tela, para o teletransporte ficar mais suave.

    ```typescript
    // Dentro do BallPoolSimulation.initializeGame()
    this.bodyWrapper = new BodyWrapper({
      min: { x: -100, y: 0 }, // Começa um pouco *antes* da borda esquerda
      max: { x: window.innerWidth + 100, y: window.innerHeight }, // Termina um pouco *depois* da borda direita
    });
    ```

2.  **Verifica a Posição (`wrapBody`):** A principal função dele é a `wrapBody(body)`. Essa função recebe uma forma (um `body`) e faz quatro verificações:

    - A forma passou da borda esquerda (`body.position.x < this.bounds.min.x`)?
    - A forma passou da borda direita (`body.position.x > this.bounds.max.x`)?
    - A forma passou da borda de cima (`body.position.y < this.bounds.min.y`)?
    - A forma passou da borda de baixo (`body.position.y > this.bounds.max.y`)?

3.  **Teletransporta! (`Matter.Body.setPosition`):** Se alguma das verificações acima for verdadeira, ele usa a função `Matter.Body.setPosition(body, { x: novoX, y: novoY })` para teletransportar a forma instantaneamente para o lado oposto da área mágica.
    - Se saiu pela esquerda, aparece na direita.
    - Se saiu pela direita, aparece na esquerda.
    - Se saiu por cima, aparece embaixo.
    - Se saiu por baixo, aparece em cima.
    - Ele calcula a nova posição (`novoX`, `novoY`) com cuidado para que a forma apareça exatamente na borda oposta, continuando seu movimento como se o espaço fosse contínuo.

**Como ele é usado no jogo?**

Lá no `BallPoolSimulation`, depois de criar o `BodyWrapper`, ele chama a função `setupBodyWrapping()`:

```typescript
// Dentro do BallPoolSimulation.initializeGame()
this.setupBodyWrapping();

// O que a setupBodyWrapping faz:
private setupBodyWrapping(): void {
    // Avisa o motor de física para fazer algo ANTES de cada atualização
    Matter.Events.on(this.engine.getEngine(), "beforeUpdate", () => {
        // Pega TODAS as formas que estão no jogo
        const allBodies = this.engine.getAllBodies();
        // Para CADA forma...
        for (const body of allBodies) {
            // ...chama o teletransportador!
            this.bodyWrapper.wrapBody(body);
        }
    });
}
```

Isso significa que, _antes_ de a `Engine` calcular o próximo passo da física, o `BodyWrapper` verifica _todas_ as formas do jogo. Se alguma estiver fora da área mágica, ela é teletransportada para o outro lado _antes_ que a física seja calculada. Isso garante que o efeito de "dar a volta" funcione direitinho!

Resumindo: O `BodyWrapper` cria a ilusão de um espaço contínuo, fazendo com que as formas que saem por um lado da tela reapareçam magicamente no lado oposto, como em um passe de mágica!
