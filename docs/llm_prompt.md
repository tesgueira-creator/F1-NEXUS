Instruções ao ChatGPT (usar sempre)

- Tarefa: produzir UM JSON válido (sem texto extra) com a avaliação subjetiva por piloto, seguindo as rúbricas de docs/llm_guidelines.md.
- Não invente fontes. Inclua URLs diretas e recentes.
- Não inclua métricas objetivas; apenas os campos do bloco "subjective" + fontes + notes.

Entrada (exemplo que você fornece ao ChatGPT)
- Lista de pilotos e equipas alvo
- Contexto do evento (circuito, data)
- Link para docs/llm_guidelines.md (rubro e escalas)

Output obrigatório (apenas JSON):
[
  {
    "driver_name": "Max Verstappen",
    "team_name": "Red Bull",
    "as_of": "2025-09-09T14:00Z",
    "subjective": {
      "Confianca": 2,
      "Pressao": -1,
      "Emo": 1,
      "Rumores": 0,
      "Upgrades_Impact": 2
    },
    "sources": [
      {"title":"Team press","url":"https://…","type":"team"},
      {"title":"Pirelli preview","url":"https://press.pirelli.com/en/…","type":"pirelli"}
    ],
    "notes": "Upgrade confirmado para Monza."
  }
]

Critérios de qualidade
- As pontuações obedecem às escalas e trazem pelo menos 1 fonte credível.
- Notes resumidas e factuais.
- Datas/URLs recentes (7–14 dias) quando for rumor/upgrade.

