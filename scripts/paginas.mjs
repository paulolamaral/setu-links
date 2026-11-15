// Lista única das páginas do site (usada por CSP, versionamento, validação e gerador).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WEBHOOK_CADASTRO } from './config.mjs';

export function listarPaginas(raiz) {
  const paginas = [
    { arq: 'index.html' }, { arq: '404.html' }, { arq: 'sobre/index.html' }, { arq: 'sacola/index.html' },
    { arq: 'colecao/index.html', molde: true }, { arq: 'produto/index.html', molde: true },
    { arq: 'links/index.html', loja: false },
    { arq: 'cadastro/index.html', loja: false, conectar: [WEBHOOK_CADASTRO] },
  ];
  // páginas geradas: produto/<slug>/ e colecao/<id>/
  for (const dir of ['produto', 'colecao']) {
    const base = join(raiz, dir);
    if (!existsSync(base)) continue;
    for (const n of readdirSync(base).sort()) {
      if (statSync(join(base, n)).isDirectory() && existsSync(join(base, n, 'index.html'))) paginas.push({ arq: `${dir}/${n}/index.html`, gerada: true });
    }
  }
  return paginas;
}
