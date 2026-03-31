# Tá na Mão - PDV

## 💻 Instalador PC (Windows)

O arquivo de instalação para Windows está em:

```
release/Tá na Mão - PDV Setup 1.0.0.exe
```

1. Copie o arquivo `Tá na Mão - PDV Setup 1.0.0.exe` para o computador desejado
2. Execute o instalador e siga as instruções na tela
3. O programa será instalado e um atalho criado na área de trabalho

---

## 📱 Instalador Android (PWA)

Para usar no Android, o sistema funciona como um **PWA (Progressive Web App)** — um site que se comporta como um aplicativo nativo.

### Como hospedar e instalar:

1. **Hospede a pasta `dist/`** em qualquer servidor web ou serviço gratuito:
   - [Vercel](https://vercel.com) — arraste a pasta `dist/` e publique
   - [Netlify](https://netlify.com) — arraste a pasta `dist/` e publique
   - [GitHub Pages](https://pages.github.com)
   - Ou use qualquer hospedagem que suporte arquivos estáticos (com HTTPS)

2. **Acesse o link pelo Chrome no celular Android**

3. **Instale o app:**
   - O Chrome vai mostrar uma barra na parte inferior: **"Adicionar Tá na Mão - PDV à tela inicial"**
   - OU toque nos **3 pontinhos (⋮)** no Chrome → **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**
   - O ícone do app aparecerá na tela inicial como um aplicativo normal

4. **Pronto!** O app funciona offline, em tela cheia, igual a um app nativo.

### Hospedagem rápida com Vercel (grátis):

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Instale o CLI: `npm install -g vercel`
3. Na pasta do projeto, execute:
   ```
   npm run build
   vercel dist/
   ```
4. Copie o link gerado e acesse no celular

---

## 📋 Resumo

| Plataforma | Método | Arquivo/Pasta |
|---|---|---|
| **Windows PC** | Instalador EXE | `release/Tá na Mão - PDV Setup 1.0.0.exe` |
| **Android** | PWA (via navegador) | Hospede a pasta `dist/` em um servidor web |
