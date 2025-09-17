Objetivo: Garantir consistência quando o ChatGPT gerar avaliações subjetivas para preencher o CSV de previsão.

Âmbito do ChatGPT (overlay subjetivo)
- Só pontua fatores subjetivos: Confiança, Pressão, Estado Emocional, Rumores, Upgrades_Impact e notas.
- Não altera métricas objetivas (grid, pace, deg, pit stops, etc.).

Fontes permitidas (fixas e consistentes)
- Oficial: https://www.formula1.com/, FIA, comunicados oficiais das equipas (media/team press).
- Pirelli: https://press.pirelli.com/en/ (prévias de pneus/compostos).
- Publicações reputadas (evitar paywall pesado): The Race, Autosport, Motorsport.com. Incluir URL direta.
- Não usar redes sociais sem confirmação oficial; não inventar fontes.

Como pesquisar (linha de raciocínio)
- “<driver/team> upgrade <circuit/country> press release site:teamdomain”
- “<driver> contract rumor last 14 days site:therace.com OR site:autosport.com”
- “<team> press release site:formula1.com”
- “Pirelli tyre choices <grand prix> press.pirelli.com”

Escalas e rúbricas (sempre estas, por piloto)
- Confianca: inteiro [-2..+2]
  - -2: queda clara de forma/erros recentes; +2: sequência forte validada por resultados/quali gaps.
- Pressao: inteiro [-2..+2]
  - -2: sem pressão externa; +2: chefia/imprensa a cobrar resultados/contrato incerto.
- Emo (estado emocional): inteiro [-2..+2]
  - -2: tensão pública/discordâncias; +2: coesão/otimismo visível.
- Rumores: inteiro [-2..+2]
  - -2: rumor credível negativo; +2: rumor/indício credível positivo (ex.: upgrade confirmado). Sem fonte → 0.
- Upgrades_Impact: inteiro [0..2]
  - 0: nada confirmado; 1: pacote pequeno; 2: pacote relevante confirmado.

Regras de consistência
- Cada pontuação deve ter pelo menos 1 fonte (URL) credível; sem fonte → Rumores=0; reduzir ±1 passo em Confianca/Pressao/Emo, se foram baseadas em boatos.
- Evitar saltos grandes entre corridas: mudanças máximas recomendadas de ±1 passo vs última avaliação.
- Notas: breve, factual, c/ referência explícita.

Formato de saída (JSON obrigatório)
- Array de objetos, 1 por piloto:
  {
    "driver_name": "Nome Sobrenome",
    "team_name": "Equipa",
    "as_of": "YYYY-MM-DDThh:mmZ",
    "subjective": {
      "Confianca": 0,
      "Pressao": 0,
      "Emo": 0,
      "Rumores": 0,
      "Upgrades_Impact": 0
    },
    "sources": [ {"title":"…","url":"https://…","type":"team|news|pirelli"} ],
    "notes": "Frase curta, com referência."
  }

Exemplos de pontuação
- Confianca=+2: Pódios sucessivos + gaps de qualificação reduzidos em pistas comparáveis com fonte.
- Pressao=+2: equipa/chefia cobra resultados + imprensa reporta pressão; fonte dupla.
- Upgrades_Impact=2: pacote de baixo arrasto confirmado pela equipa para Monza (fonte oficial).

