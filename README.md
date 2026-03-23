# ATS Resume Optimizer 🚀

O **ATS Resume Optimizer** é uma aplicação web de página única (SPA) projetada para ajudar candidatos a otimizar seus currículos para sistemas de rastreamento de candidatos (ATS). Ele analisa a lacuna (gap) entre a descrição de uma vaga e o seu currículo atual, gerando uma versão otimizada com alta densidade de palavras-chave e metadados estratégicos.

Este é um projeto **opinativo** criado para o meu próprio currículo, mas foi desenvolvido de forma modular para que possa ser facilmente adaptado por qualquer pessoa.

## 🌟 Funcionalidades

- **Análise de Gap em Tempo Real**: Identifica keywords presentes e ausentes.
* **Otimização Inteligente**: Integra automaticamente habilidades e tecnologias exigidas no texto do currículo.
- **Refatoração Estratégica**: Reescreve experiências profissionais para destacar tecnologias específicas da vaga.
- **Hacking de Metadados**: Configura campos internos do PDF (`DC.title`, `CP.keywords`, etc.) para maximizar o score em algoritmos de recrutamento.
- **Privacidade Total**: Suas API Keys e dados são armazenados localmente no seu navegador (`localStorage`). Nada é enviado para um servidor central, exceto para as APIs de IA configuradas.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + Vite + Tailwind CSS
- **PDF Processing**: `pdf-lib` e `pdfjs-dist`
- **IA**: OpenAI (GPT-4o), Google Gemini, ou qualquer modelo via OpenRouter

## 📄 Como Usar

1. Clone o repositório.
2. Configure sua API Key no painel de configurações (ícone de engrenagem).
3. Cole a descrição da vaga e faça o upload do seu currículo em PDF.
4. Clique em **Analisar e Otimizar**.
5. Baixe seu novo currículo pronto para o mercado!

## 🌍 Hospedagem na Netlify

O projeto é uma aplicação puramente estática, o que torna a hospedagem na Netlify extremamente simples:

1. **Conecte seu Repositório**: Vá ao painel da Netlify e conecte seu repositório do GitHub/GitLab.
2. **Configurações de Build**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. **Deploy**: Clique em "Deploy" e a Netlify gerará uma URL pública para você.

**Dica de Segurança**: Como o projeto armazena suas API Keys no `localStorage` do seu navegador, qualquer pessoa que acessar a sua URL terá que configurar a própria chave para usar. Isso garante que ninguém use os seus créditos de IA por engano.

## 🤝 Contribuições

Este projeto nasceu da ideia de ajudar pessoas que, assim como eu, estão em busca de novas oportunidades e querem aumentar suas chances de serem chamadas para entrevistas.

Aceitamos contribuições para melhorias na lógica de análise, novos designs ou suporte a mais formatos. Sinta-se à vontade para abrir uma issue ou enviar um pull request!

---

Desenvolvido com ❤️ para ajudar a comunidade de tecnologia.
