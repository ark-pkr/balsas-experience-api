"""Aplica cabeçalho institucional e numeração sem rasterizar o documento."""
from pathlib import Path
from io import BytesIO
import pdfplumber
import json
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
from PIL import Image, ImageOps, ImageDraw

out=Path('output/pdf')
temp=Path('tmp/pdfs/formatado')
temp.mkdir(parents=True,exist_ok=True)
source=PdfReader(temp/'sem-cabecalho.pdf')
banner=Image.open(out/'cabecalho-unibalsas.png').convert('RGB')
buffer=BytesIO()
banner.save(buffer,format='PDF',resolution=72)
buffer.seek(0)
overlay=PdfReader(buffer).pages[0]
writer=PdfWriter()
mm=72/25.4
for i,source_page in enumerate(source.pages):
 page=writer.add_page(source_page)
 page.merge_transformed_page(overlay,Transformation().scale(198*mm/float(overlay.mediabox.width),29*mm/float(overlay.mediabox.height)).translate(6*mm,262*mm),over=True)
 if i>=2:
  resources=page['/Resources'].get_object()
  fonts=resources.get('/Font',DictionaryObject()).get_object()
  resources[NameObject('/Font')]=fonts
  fonts[NameObject('/PageNumberFont')]=writer._add_object(DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica')}))
  stream=DecodedStreamObject()
  stream.set_data(page.get_contents().get_data()+f'\nq BT /PageNumberFont 10 Tf 0 0 0 rg 535 725 Td ({i+1}) Tj ET Q\n'.encode('ascii'))
  page[NameObject('/Contents')]=writer._add_object(stream)
writer.add_metadata({'/Title':'Balsas Experience API - Relatório de entrega','/Author':'Carinne da Silva Borges; Júlio César Lima dos Reis; João Pedro Strasser Santos; Rogério Mota de Melo','/Subject':'Programação para Web - UNIBALSAS'})
final=out/'balsas-experience-api-equipe-carinne-julio-joao-pedro-rogerio.pdf'
with final.open('wb') as f:writer.write(f)
thumbs=[]
with pdfplumber.open(final) as pdf:
 text='\n'.join(p.extract_text() or '' for p in pdf.pages)
 members=json.loads(Path('docs/equipe-sugestoes.json').read_text(encoding='utf-8'))
 assert 'matrícula' in text.lower()
 assert all(m['matricula'] in text for m in members if m.get('matricula'))
 assert 'Carinne da Silva Borges' in text and 'Programação para Web' in text
 assert 'balsas-experience-api-lgdm.onrender.com' in ''.join(text.split())
 for i,page in enumerate(pdf.pages):
  img=page.to_image(resolution=110).original.convert('RGB')
  img.save(temp/f'page-{i+1}.png')
  tile=Image.new('RGB',(260,385),'#e3e3e3')
  tile.paste(ImageOps.contain(img,(244,353)),(8,7))
  ImageDraw.Draw(tile).text((10,365),f'Página {i+1}',fill='black')
  thumbs.append(tile)
 print('Páginas:',len(pdf.pages),'| Texto selecionável e conteúdo conferido.')
sheet=Image.new('RGB',(1040,385*((len(thumbs)+3)//4)),'white')
for i,tile in enumerate(thumbs):sheet.paste(tile,((i%4)*260,(i//4)*385))
sheet.save(temp/'contact.png')
print(final)
