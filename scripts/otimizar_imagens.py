"""Gera a versão leve de cada foto de produto para os cards: <nome>-card.webp (560x700, recorte 4:5).
O card só mostra um recorte 4:5 da foto; baixar a foto inteira (616x1200) desperdiça dados no celular.
Rode depois de adicionar/trocar fotos:  python scripts/otimizar_imagens.py   (precisa de Pillow)
"""
import json
import os
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
W, H = 560, 700
POS_Y = 0.40  # mesmo object-position vertical do CSS (center 40%)


def cartao(origem, destino):
    im = Image.open(origem).convert('RGB')
    esc = max(W / im.width, H / im.height)
    im = im.resize((max(W, round(im.width * esc)), max(H, round(im.height * esc))), Image.LANCZOS)
    x0 = (im.width - W) // 2
    y0 = round((im.height - H) * POS_Y)
    im.crop((x0, y0, x0 + W, y0 + H)).save(destino, 'WEBP', quality=78, method=6)


def main():
    d = json.load(open(os.path.join(RAIZ, 'data/produtos.json'), encoding='utf8'))
    feitos = 0
    for p in d['produtos']:
        for c in p['cores']:
            for rel in c.get('imagens', []) + ([c['capa']] if c.get('capa') else []):
                if not rel.endswith('.webp') or rel.endswith('-card.webp'):
                    continue
                src = os.path.join(RAIZ, rel)
                if os.path.exists(src):
                    cartao(src, src[:-5] + '-card.webp')
                    feitos += 1
    print(f'{feitos} versões de card geradas.')


if __name__ == '__main__':
    main()
