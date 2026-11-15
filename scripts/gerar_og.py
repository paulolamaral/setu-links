"""Gera as imagens de compartilhamento (Open Graph, 1200x630) em assets/og/.
Aparecem quando o link é colado no WhatsApp, Instagram, Facebook, etc.
Uso (precisa de Pillow):  python scripts/gerar_og.py
"""
import json
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
W, H = 1200, 630
CAFE, PERG, BRASA, TERRA = (58, 35, 24), (250, 244, 236), (232, 149, 106), (192, 90, 54)
FONTES = r'C:\Windows\Fonts'


def fonte(nome, tam):
    for pasta in (FONTES, '/usr/share/fonts/truetype/dejavu', '/Library/Fonts'):
        for n in (nome, 'DejaVuSerif.ttf'):
            try:
                return ImageFont.truetype(os.path.join(pasta, n), tam)
            except OSError:
                continue
    return ImageFont.load_default()


def foto_lado(caminho, largura=520):
    """Foto à direita, preenchendo a altura toda, com borda suave à esquerda."""
    im = Image.open(os.path.join(RAIZ, caminho)).convert('RGB')
    esc = max(largura / im.width, H / im.height)
    im = im.resize((int(im.width * esc) + 1, int(im.height * esc) + 1), Image.LANCZOS)
    x0 = (im.width - largura) // 2
    y0 = max(0, int((im.height - H) * 0.35))
    return im.crop((x0, y0, x0 + largura, y0 + H))


def compor(saida, titulo, subtitulo, foto, selo='EDIÇÃO LIMITADA'):
    img = Image.new('RGB', (W, H), CAFE)
    d = ImageDraw.Draw(img)
    f = foto_lado(foto)
    img.paste(f, (W - f.width, 0))
    # transição suave da foto para o fundo (sem corte seco)
    degrade = Image.new('L', (160, H))
    for x in range(160):
        degrade.paste(int(255 * (1 - x / 160)), (x, 0, x + 1, H))
    cor = Image.new('RGB', (160, H), CAFE)
    img.paste(cor, (W - f.width, 0), degrade)

    pad = 64
    d.text((pad, 58), 'SÊ TU', font=fonte('georgiab.ttf', 30), fill=BRASA, spacing=2)
    d.rectangle((pad, 104, pad + 56, 107), fill=TERRA)
    linhas = textwrap.wrap(titulo, width=17 if len(titulo) > 28 else 14) or [titulo]
    tam = 76 if len(linhas) <= 2 else 62
    ft = fonte('georgiab.ttf', tam)
    y = 170
    for ln in linhas[:4]:
        d.text((pad, y), ln, font=ft, fill=PERG)
        y += int(tam * 1.12)
    if subtitulo:
        d.text((pad, H - 150), subtitulo, font=fonte('georgiai.ttf', 34), fill=BRASA)
    fs = fonte('georgiab.ttf', 22)
    larg = int(d.textlength(selo, font=fs)) + 36
    d.rectangle((pad, H - 84, pad + larg, H - 40), fill=TERRA)
    d.text((pad + 18, H - 74), selo, font=fs, fill=PERG)
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    img.save(saida, 'JPEG', quality=84, optimize=True, progressive=True)
    print('gerado', os.path.relpath(saida, RAIZ), os.path.getsize(saida) // 1024, 'KB')


def main():
    d = json.load(open(os.path.join(RAIZ, 'data/produtos.json'), encoding='utf8'))
    og = os.path.join(RAIZ, 'assets/og')
    compor(os.path.join(og, 'home.jpg'), 'Sê Tu.', 'Camisetas cristãs', 'assets/brand/hero.webp', 'EDIÇÃO LIMITADA')
    for c in d['colecoes']:
        if c.get('capa'):
            compor(os.path.join(og, f"colecao-{c['id']}.jpg"), c['nome'], c.get('descricao', '')[:44], c['capa'], 'COLEÇÃO')
    for p in d['produtos']:
        cor = p['cores'][0]
        foto = cor.get('capa') or cor['imagens'][0]
        ov = p.get('modelagem') == 'oversize'
        compor(os.path.join(og, f"{p['slug']}.jpg"), p['nome'], 'Camiseta cristã oversize' if ov else 'Camiseta cristã', foto, 'OVERSIZE · EDIÇÃO LIMITADA' if ov else 'EDIÇÃO LIMITADA')


if __name__ == '__main__':
    main()
