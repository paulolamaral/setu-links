# Sê Tu — loja vitrine com pedido via WhatsApp

Site estático (HTML + CSS + JavaScript puro) publicado no GitHub Pages em **https://setubrand.com.br**.
Não há pagamento no site: o cliente monta a sacola e o pedido segue formatado para o WhatsApp da marca.

## Como atualizar a loja

| Quero… | Faça |
|---|---|
| Mudar preço, nome, texto, estoque | edite `data/produtos.json` |
| Mudar WhatsApp, Instagram, FAQ, domínio, versículos | edite `data/loja.json` |
| Adicionar um produto | acrescente no `data/produtos.json`, ponha as fotos em `assets/produtos/<slug>/` |

Depois de **qualquer** alteração, rode (precisa de [Node 20+](https://nodejs.org) e, para as imagens, `pip install pillow`):

```bash
python scripts/otimizar_imagens.py   # só se mexeu em FOTOS: gera a versão leve dos cards
python scripts/gerar_og.py           # só se mexeu em produtos/coleções: gera a imagem de compartilhamento
node scripts/build.mjs               # SEMPRE: gera páginas e SEO, aplica CSP, versiona arquivos e valida
```

Depois é só enviar para o GitHub (`git add . && git commit && git push`). Se esquecer algum passo,
o GitHub Actions reprova a alteração e diz qual comando rodar.

## O que o `node scripts/build.mjs` faz

1. **`gerar-paginas.mjs`:** cria uma página real para cada produto (`/produto/<slug>/`) e coleção (`/colecao/<id>/`),
   com título, descrição, endereço canônico, Open Graph (prévia no WhatsApp/Instagram) e dados estruturados (JSON-LD de Produto, Breadcrumb, FAQ, Organização).
   Também gera o `sitemap.xml` (com as fotos dos produtos) e o `robots.txt`.
2. **`aplicar-csp.mjs`:** política de segurança em todas as páginas ([SEGURANCA.md](SEGURANCA.md)).
3. **`versionar.mjs`:** coloca `?v=...` nos arquivos para o navegador nunca misturar versões antigas e novas.
4. **`validar-dados.mjs`:** barra imagem externa, script suspeito, canonical errado, título/descrição fora do tamanho etc.

## Depois de publicar (uma vez só, no Google)

1. Abra o [Google Search Console](https://search.google.com/search-console) e adicione `setubrand.com.br` (verificação por DNS).
2. Em **Sitemaps**, envie `https://setubrand.com.br/sitemap.xml`.
3. Em **Inspeção de URL**, teste a home e um produto e clique em **Solicitar indexação**.
4. Teste a prévia de compartilhamento colando um link de produto no WhatsApp (se a imagem antiga aparecer, o WhatsApp guarda cache por alguns dias).
5. No Instagram, use `https://setubrand.com.br/` como link da bio.

## Estrutura

```
index.html  sobre/  colecao/<id>/  produto/<slug>/  sacola/      páginas
links/  cadastro/                                                páginas do evento (fora do índice do Google)
data/loja.json  data/produtos.json                               a única fonte de dados
assets/  js/  scripts/                                           imagens, código, ferramentas
```

`colecao/index.html` e `produto/index.html` (sem pasta de item) são moldes: ficam com `noindex` e servem de base para as páginas geradas.
Não apague.
