# Segurança do site Sê Tu

O site é estático (GitHub Pages): não tem servidor nem banco de dados, então quase não há o que invadir.
O risco real é **alguém colocar conteúdo errado nos arquivos** (um link falso, uma imagem imprópria, um script).
A defesa tem três camadas, e cada uma funciona mesmo que a outra falhe.

## Camada 1. O navegador só aceita o que é nosso (CSP)

Cada página tem uma Política de Segurança de Conteúdo (`Content-Security-Policy`). Na prática:

- **Scripts:** só os arquivos de `js/` do próprio site. Script embutido na página ou injetado não roda.
- **Imagens:** só do próprio site. Uma imagem de endereço externo não carrega.
- **Envio de dados:** só para o próprio site e para o webhook declarado em `data/loja.json`.
- **Páginas:** não aceitam receber formulários de fora, objetos embutidos nem mudança de `<base>`.

Para mudar webhook, Pixel ou GA4 em `data/loja.json`, rode **`node scripts/aplicar-csp.mjs`**.
Depois de editar qualquer arquivo de `js/` ou o CSS, rode **`node scripts/versionar.mjs`** (evita o navegador misturar versões antigas e novas).
Ele reescreve a política em todas as páginas liberando só o que foi declarado.

## Camada 2. O código desconfia de tudo que lê (`js/seguranca.js`)

Todo dado passa por validação antes de virar texto, link ou imagem:

| Entrada | Regra |
|---|---|
| Imagens (`produtos.json`) | só `assets/…/arquivo.webp|jpg|png|svg`. Bloqueia `http://`, `//`, `data:`, `javascript:` e `..` |
| Links (`loja.json`) | só `https`. Instagram só de `instagram.com`. Bloqueia `javascript:`, senha na URL e host parecido (`instagram.com.evil.com`) |
| WhatsApp | só dígitos (10 a 15) |
| Textos | sem caracteres de controle nem de inversão de texto, com limite de tamanho |
| Cores, preços, estoque | formato e faixa validados; tamanhos desconhecidos descartados |
| Sacola (localStorage) | o usuário pode alterá-la: só entram itens bem formados, com quantidade de 1 a 99. Preço sempre vem do catálogo, nunca da sacola |
| Formulário do pedido | limite de tamanho, texto limpo; tudo vai codificado para o WhatsApp |

## Camada 3. Nada errado chega a ser publicado

`.github/workflows/validar.yml` roda a cada alteração e **reprova** se encontrar:
imagem externa ou acima de 700 KB, caminho suspeito, `<script>`/`onerror` em textos, arquivo estranho em `assets/`,
script inline, recurso externo não previsto ou CSP desatualizado.
Rode no seu computador antes de subir: **`node scripts/validar-dados.mjs`**.

Em Pull Requests, o fluxo também lista as **imagens novas ou alteradas**, para você abrir e olhar uma a uma.
O computador confere formato e tamanho, mas **só uma pessoa confere se a foto é apropriada**.

## O que falta fazer no GitHub (só você consegue)

O ponto mais fraco é quem tem permissão de escrita no repositório. Em *Settings*:

1. **Ative a verificação em duas etapas** na sua conta e em quem tiver acesso.
2. **Branches → Branch protection rule** para `main`: exigir Pull Request, exigir a aprovação de uma pessoa e exigir o check "Validar site".
3. **Collaborators:** deixe acesso de escrita só para quem realmente precisa.
4. **Code security:** ative *Secret scanning* e *Push protection* (impedem subir senhas e chaves por engano).
5. Opcional: crie `.github/CODEOWNERS` exigindo sua aprovação em `data/` e `assets/`.

## Limites conhecidos

- **Cabeçalhos HTTP:** o GitHub Pages não deixa configurá-los. Por isso o CSP vai em `<meta>`, que **não cobre** `frame-ancestors`
  (proteção contra o site ser embutido em outra página). Se isso for necessário, coloque o domínio atrás do Cloudflare.
- **Fontes do Google:** são o único recurso externo (liberado no CSP). Hospedar as fontes no próprio site elimina essa dependência.
- **Páginas `links/` e `cadastro/`:** agora seguem o mesmo padrão (CSP, sem script ou estilo embutido, versão nos arquivos, validação no GitHub).
  O `cadastro/` só pode enviar dados para o webhook do evento (`scripts/config.mjs`). Trocou o endereço? Atualize lá e rode `node scripts/aplicar-csp.mjs`.
  O formulário tem limite de tamanho, texto limpo e um **campo-isca** contra robôs: se um robô o preencher, o site finge sucesso e não envia nada.
  Não há proteção contra alguém que envie o formulário manualmente várias vezes; para isso, limite no próprio webhook (n8n).
- **Pedidos:** nome e cidade vão para o WhatsApp e, se configurado, para o webhook. Não há pagamento nem dados de cartão no site.
