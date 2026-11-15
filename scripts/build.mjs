// Roda tudo na ordem certa:  node scripts/build.mjs        (gera e aplica)
//                            node scripts/build.mjs --verificar   (só confere; usado no GitHub Actions)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const v = process.argv.includes('--verificar') ? ['--verificar'] : [];
const passos = [['gerar-paginas.mjs', v], ['aplicar-csp.mjs', v], ['versionar.mjs', v], ['validar-dados.mjs', []]];
let falhou = false;
for (const [arq, args] of passos) {
  const r = spawnSync(process.execPath, [`scripts/${arq}`, ...args], { cwd: raiz, stdio: 'inherit' });
  if (r.status !== 0) { falhou = true; break; }
}
process.exit(falhou ? 1 : 0);
