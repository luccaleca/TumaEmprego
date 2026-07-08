# Extensão Chrome — Tuma Emprego

Detecta vaga na página aberta, classifica o melhor segmento de currículo e gera PDF via API local (`site/` na porta **3737**).

## Instalar (desenvolvimento)

1. Suba o site: `cd site && npm run dev`
2. Chrome → `chrome://extensions`
3. Ative **Modo do desenvolvedor**
4. **Carregar sem compactação** → pasta `extensao/`

## Uso

1. Abra a página de uma vaga (Gupy, LinkedIn, etc.)
2. Clique no botão **TE** (canto inferior direito) **ou** no ícone da extensão → **Detectar vaga**
3. Painel mostra segmento escolhido + link do **PDF**
4. Revise em [localhost:3737/vaga](http://localhost:3737/vaga)

## API usada

| Endpoint | Função |
|----------|--------|
| `GET /api/extensao/ping` | Site online |
| `POST /api/curriculo/vaga/pacote` | Classifica + adapta CV + PDF |

Corpo do pacote:

```json
{
  "vaga_titulo": "Estágio Desenvolvedor",
  "vaga_descricao": "…",
  "vaga_url": "https://…",
  "gerar_pdf": true
}
```

## Arquivos

```
extensao/
├── manifest.json
├── config.js       # URL do site local
├── extract.js      # Leitura da página (JSON-LD, LinkedIn, Gupy, genérico)
├── content.js      # Botão flutuante + painel
├── background.js   # Chamadas à API
├── popup.html/js/css
```

Usuário revisa e envia a candidatura — sem envio automático.
