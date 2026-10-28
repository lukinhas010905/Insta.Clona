# InstaSpy.Pro — reconstrução do funil

Reconstrução fiel do site `clonegram.shop`: as cinco telas, as animações, o layout e — o que
importa de verdade — **a busca do perfil real do Instagram**.

Digite `@mtheus.elias` e ele traz a foto, a bio, os seguidores, o seguinte e os posts de
verdade. Sem dados inventados.

---

## O fluxo

| # | Tela | O que acontece |
|---|---|---|
| 1 | **Hook** | Matrix rain no fundo. Título **digitado** a 50ms/char, cursor a 530ms. Subtítulo a 35ms/char. CTA sobe com fade 500ms. |
| 2 | **Usuário** | Campo com `@` fixo. Enter ou a seta dispara a busca → "Localizando perfil..." |
| 3 | **Confirmar** | **Perfil real do Instagram**: foto, nome, bio, posts, seguidores, seguindo. |
| 4 | **Invasão** | Login do Instagram com a fonte **Billabong**. 4 senhas de 8–12 chars a 80ms/char; 3 falham, a 4ª abre. |
| 5 | **Feed** | Feed falso do Instagram: header com a fonte Billabong, stories com anel verde, 4 posts com localização e "Conteúdo restrito", barra VIP fixa e nav inferior de 5 abas. |
| 6 | **Inbox** | Direct falso, aberto pelo ícone de mensagens do feed. Avatares borrados, nomes `Mar*****`, linhas bloqueadas. |
| 7 | **Oferta** | Banner "Espionagem 100% finalizada", card do alvo, **card de preço** com ancoragem, lista de bônus e o CTA que abre o gateway. |

---

## Como o perfil real é buscado

Isto é a parte que exige backend. Resumo do que foi descoberto testando:

| Tentativa | Resultado |
|---|---|
| `fetch` simples no HTML | ❌ Instagram devolve a casca com SSR desligado (`is_crawler_ssr_html_only_mode`) |
| `GET /api/v1/users/web_profile_info/` | ❌ HTTP 429 (rate limit por IP) |
| `?__a=1&__d=dis` | ❌ HTTP 400 (descontinuado) |
| **Chromium de verdade** | ✅ página completa, com tudo |

Com navegador real a página traz um `<script type="application/json">` contendo:

```json
{ "follower_count": 683, "following_count": 854,
  "biography": "...", "full_name": "...", "profile_pic_url": "..." }
```

`server/src/instagram.js` faz:

1. Abre um Chromium **único e reaproveitado** (abrir por busca custa ~1,5s e muita RAM)
2. Bloqueia imagem/fonte/mídia — não servem para extrair dados, só pesam
3. Espera o `follower_count` aparecer no HTML
4. Pega os números do JSON embutido
5. Pega a **bio completa no `<header>`** — o JSON corta a bio em 2 linhas
6. Cache de 10 min por `@`
7. **Teto de 12s** na busca: estourou, cai no perfil gerado

A foto vem do CDN do Instagram, que recusa hotlink sem `Referer`. Por isso ela passa por
`GET /api/imagem?url=...`, que busca no servidor e devolve em stream.

### Resultado medido

```
@mtheus.elias        3.0s   683 seg / 2 posts      REAL via json-embutido
@neymarjr            1.1s   241.812.464 seg        REAL via json-embutido
@nicole_martins_b    1.0s   1.318 seg / 40 posts   REAL via json-embutido
@mtheus.elias (cache) 2ms   idem
@naoexiste_xyz       12.0s  fallback gerado
```

---

## Rodando

```bash
npm install                   # instala tudo (usa package-lock.json)
npm start                     # builda e sobe em http://127.0.0.1:8787
```

Não precisa instalar Chromium. A busca de perfil usa HTTP puro (~600ms).

Só se você quiser a **bio completa** (todas as linhas, não só 2) vale instalar o navegador:

```bash
npm i -D playwright && npx playwright install chromium
PERFIL_MODO=completo npm run api
```

Para desenvolver com hot reload (dois terminais):

```bash
npm run api         # terminal A — API + dist/ na 8787
npm run dev         # terminal B — Vite na 5173, proxy /api pronto
```

**Deploy no Vercel:** já está configurado. `vercel.json` + as funções em `api/`.

```
api/perfil/[username].js   -> busca o perfil (sem navegador)
api/imagem.js              -> proxy da foto do CDN
vercel.json                -> build, SPA fallback e cache de borda
```

Não precisa configurar nada no painel. Só importar o repositório.

**A diferença entre os dois modos:**

| Modo | Como busca | Bio | Velocidade |
|---|---|---|---|
| **Vercel** (serverless) | HTTP puro: lê o JSON embutido de `instagram.com/{user}/` | 2 primeiras linhas | ~600ms |
| **Servidor próprio** (Node + Chromium) | Navegador renderiza a página | completa, todas as linhas | ~1–3s |

O Vercel não roda Chromium (limite de tamanho e cold start), então usa o caminho leve. Nome,
foto, seguidores, seguindo e posts vêm **completos e reais nos dois modos** — o que muda é só
quantas linhas da bio aparecem.

Se precisar da bio inteira em produção, suba o `server/` num host que rode Node (Railway,
Render, Fly.io, VPS) e aponte `VITE_API_URL` para ele.

---

## Trocar preço, marca, logo e link do checkout

Tudo isso vive em **um arquivo só**: `public/config.json` (ou `dist/config.json`, se você subiu
o build pronto). Editável direto no servidor, **sem rebuild** — lido em runtime com
`cache: 'no-store'`.

```json
{
  "marca": {
    "nome": "INSTASPY",
    "sufixo": ".PRO",
    "nomeCompleto": "InstaSpy.Pro",
    "logo": "/logo.png"
  },
  "oferta": {
    "ancora": "De: R$ 279,90",
    "preco": "R$ 29,90",
    "seguranca": "Pagamento seguro",
    "garantia": "30 dias de garantia",
    "beneficios": [
      "Todas as mensagens do direct de {nome}",
      "Todas as fotos sem censura (incluindo apagadas)",
      "Localização em tempo real e locais que esteve",
      "Alerta sempre que {nome} interagir com alguém",
      "2 bônus surpresa avaliados em R$ 120,00"
    ],
    "cta": "Acessar tudo agora mesmo",
    "rodape": "Acesso liberado em até 2 minutos"
  },
  "modo_checkout": "externo",
  "checkout": { "padrao": "https://pay.seudominio.com/instaspy" },
  "whatsapp": "5511999999999"
}
```

### Preço

| Campo | O que faz |
|---|---|
| `oferta.preco` | **o preço cobrado**, em texto livre: `"R$ 29,90"`. Os 2 últimos caracteres saem menores, como no original. |
| `oferta.ancora` | o preço riscado acima: `"De: R$ 279,90"` |
| `oferta.beneficios` | lista de bullets. Cada item aceita `{nome}`, trocado pelo nome do perfil. |
| `oferta.cta` | texto do botão que abre o gateway |
| `oferta.rodape` | a linha miúda abaixo do botão |

> **O preço do site é só vitrine.** Quem cobra é o gateway — o valor configurado lá é o que
> aparece no checkout e o que o cliente paga. Os dois precisam bater.

### Marca e logo

| Campo | O que faz |
|---|---|
| `marca.nome` | parte branca do lockup do topo |
| `marca.sufixo` | parte roxa — hoje `.PRO` |
| `marca.nomeCompleto` | como aparece no texto corrido |
| `marca.logo` | caminho da logo. **Vazio ou 404 → usa o ícone embutido.** |

Joga o arquivo em **`public/logo.png`** (e em `dist/logo.png` se estiver usando o build pronto)
e recarrega. Enquanto o arquivo não existir, a tela mostra o ícone embutido — nada quebra.

### Trocar o link do checkout

O botão **"Tornar-se VIP"** e o **"Adquirir Acesso VIP"** leem de:

```
dist/config.json          <- se subiu o build pronto
public/config.json        <- se roda do código-fonte
```

```json
{ "modo_checkout": "externo",
  "checkout": { "padrao": "https://pay.seudominio.com/instaspy" },
  "whatsapp": "5511999999999" }
```

**Sem rebuild** — lido em runtime com `cache: 'no-store'`. Se `padrao` estiver vazio, o botão
cai em `/obrigado`.

No painel do gateway, a página de retorno é `https://seudominio.com/obrigado`.

---

## Tokens de design (extraídos do original)

| Item | Valor |
|---|---|
| Roxo de destaque | `#a78bfa` · gradiente `#8b5cf6` → `#6d28d9` |
| Gradiente do botão | `linear-gradient(135deg, #7c3bed, #a73cdd)` |
| Card | `bg-[#0c1011]/95` · `rounded-[32px]` · `p-8` · `border-[#1f1f2e]/50` |
| Input | `h-[56px]` · `rounded-full` · `border-[#3a3a5e]` · foco `#8b5cf6` |
| Texto mudo | `#8b8b9e` · `#6b7280` · `#a8a8a8` |
| Instagram | `#0095f6` · borda `#363636` · campo `#121212` |
| Fonte | `Inter, -apple-system, BlinkMacSystemFont, sans-serif` |
| Fonte do logo | **Billabong** (`public/fonts/BILLABONG.woff2`) |

### Animações

| Nome | Efeito |
|---|---|
| `pulse-glow` | glow roxo pulsando no botão (2s, loop) |
| `btn-shine` | brilho branco varrendo o botão (3s, loop) |
| `scale-in` | toast verde e modal do paywall |
| — | cursor `\|` piscando a 530ms |

### Matrix rain

```
caracteres: "AEIOSTKLK.AEITSKLA"     coluna: 16px     intervalo: 50ms
rastro: fillRect rgba(0,0,0,0.05)    alpha: 0.3 + rand(0.3)
cores: #8b5cf6 #6366f1 #a78bfa #818cf8 #7c3aed
reset: y > altura && rand() > 0.975
```

---

## Estrutura

```
espiafacil-rebuild/
├── public/
│   ├── config.json              # <- LINK DO CHECKOUT
│   └── fonts/BILLABONG.woff2
├── src/
│   ├── flow/
│   │   ├── Fluxo.tsx            # máquina de estados das 5 telas
│   │   ├── MatrixRain.tsx       # canvas do fundo
│   │   ├── TelaHook.tsx         # 1 — máquina de escrever
│   │   ├── TelaUsuario.tsx      # 2 — input do @ + busca real
│   │   ├── TelaConfirmar.tsx    # 3 — perfil real
│   │   ├── TelaHack.tsx         # 4 — quebra de senha
│   │   ├── TelaInbox.tsx        # 5 — inbox + paywall
│   │   ├── perfil.ts            # fallback determinístico + formatadores
│   │   ├── dados.ts             # avatares, conversas, notas
│   │   └── Icons.tsx
│   ├── lib/perfilApi.ts         # cliente de /api/perfil e /api/imagem
│   ├── pages/Success.tsx        # /obrigado
│   └── index.css                # btn-premium + keyframes + @font-face
└── server/
    ├── index.js                 # rotas + host estático
    └── src/instagram.js         # Chromium + extração + proxy de imagem
```

### Rotas da API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/perfil/:username` | perfil público real (com fallback gerado) |
| GET | `/api/imagem?url=` | proxy da foto do CDN do Instagram |

---

## Notas

- **Fallback.** Se o Instagram recusar, demorar mais de 12s ou o Chromium não estiver
  instalado, o funil usa um perfil determinístico (mesmo `@` → mesmos números). Nunca trava.
- **Rate limit.** O Instagram limita por IP. Um servidor movimentado vai precisar de proxy
  residencial ou de um serviço de scraping (ScraperAPI, Bright Data, Apify). O cache de 10 min
  segura o volume do dia a dia.
- **Chromium.** `npx playwright install chromium` precisa rodar no servidor. Sem isso, a rota
  cai no fallback automaticamente — o funil continua de pé.
- **BILLABONG.woff2** é servida local, com `preload`, para o logo não piscar em cursive.
- **Imagens do inbox.** Os avatares das conversas são URLs do Unsplash (herdadas do original).
  A foto do alvo é real, vinda do Instagram.
- **Tela 6 (não implementada).** O original tem uma tela extra depois do inbox — explorador de
  perfil com abas (stories, posts, reels, curtidas, comentários, buscas). Mapeada, não construída.
