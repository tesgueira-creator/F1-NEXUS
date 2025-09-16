export type DriverPerkType = "strength" | "weakness";

export type DriverPerk = {
  id: string;
  type: DriverPerkType;
  title: string;
  description: string;
  weight: number;
};

export type DriverPerkProfile = {
  id: string;
  name: string;
  team: string;
  baseScore: number;
  perks: DriverPerk[];
};

const catalog: DriverPerkProfile[] = [
  {
    id: "max-verstappen",
    name: "Max Verstappen",
    team: "Red Bull Racing",
    baseScore: 96.5,
    perks: [
      {
        id: "ver_qualifying_dominance",
        type: "strength",
        title: "Domínio em qualificação",
        description:
          "Média de 0,347s de vantagem em 2023 sobre Pérez em voltas lançadas, garantindo controle absoluto de grid.",
        weight: 2.4,
      },
      {
        id: "ver_race_pace_control",
        type: "strength",
        title: "Controle de ritmo de corrida",
        description:
          "Liderou 75% das voltas em 2023, convertendo ritmo limpo em vitórias mesmo após pit stops.",
        weight: 2.0,
      },
      {
        id: "ver_wet_weather",
        type: "strength",
        title: "Precisão em pista molhada",
        description:
          "Venceu todas as provas em condições de chuva em 2023, mantendo gap médio de 7s após safety-car.",
        weight: 1.4,
      },
      {
        id: "ver_starts_under_pressure",
        type: "weakness",
        title: "Largadas sob pressão",
        description:
          "Perdeu posições em 38% das relargadas em 2023 quando atacado lado a lado, especialmente em circuitos urbanos.",
        weight: 0.8,
      },
      {
        id: "ver_following_tyre_deg",
        type: "weakness",
        title: "Desgaste seguindo tráfego",
        description:
          "Consumo adicional de 0,05% por volta em stint médio quando preso atrás de carros mais lentos em pistas estreitas.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "sergio-perez",
    name: "Sergio Pérez",
    team: "Red Bull Racing",
    baseScore: 88.2,
    perks: [
      {
        id: "per_tyre_management",
        type: "strength",
        title: "Gestão de pneus",
        description:
          "Foi o piloto com maior extensão média de stint em 2023 (18 voltas com pneus macios mantendo ritmo competitivo).",
        weight: 1.6,
      },
      {
        id: "per_street_specialist",
        type: "strength",
        title: "Especialista em rua",
        description:
          "Conquistou 3 vitórias em circuitos urbanos nas últimas 3 temporadas, aproveitando aderência em baixa velocidade.",
        weight: 1.2,
      },
      {
        id: "per_recovery_racecraft",
        type: "strength",
        title: "Capacidade de recuperação",
        description:
          "Ganhou média de 4,2 posições em corridas de sprint 2023 após largadas fora do top 10.",
        weight: 1.0,
      },
      {
        id: "per_qualifying_variance",
        type: "weakness",
        title: "Variância em qualificação",
        description:
          "Eliminado em Q1/Q2 em 7 etapas de 2023, comprometendo cenários estratégicos de corrida.",
        weight: 1.5,
      },
      {
        id: "per_high_speed_balance",
        type: "weakness",
        title: "Equilíbrio em alta velocidade",
        description:
          "Perde 0,22s por volta média em curvas de alta comparado a Verstappen segundo dados FIA 2023.",
        weight: 0.7,
      },
    ],
  },
  {
    id: "charles-leclerc",
    name: "Charles Leclerc",
    team: "Ferrari",
    baseScore: 91.1,
    perks: [
      {
        id: "lec_one_lap_pace",
        type: "strength",
        title: "Explosão de uma volta",
        description:
          "Responsável por 36% das poles da Ferrari desde 2019, com delta médio de -0,21s sobre Sainz em 2023.",
        weight: 1.8,
      },
      {
        id: "lec_precision_street",
        type: "strength",
        title: "Precisão em pistas estreitas",
        description:
          "Taxa de top-4 em classificações de Mônaco/Baku de 80% na era híbrida recente.",
        weight: 1.1,
      },
      {
        id: "lec_tyre_warmup",
        type: "strength",
        title: "Aquecimento rápido de pneus",
        description:
          "Melhor tempo de out-lap em 68% das sessões Q3 de 2023, útil para undercut agressivo.",
        weight: 1.0,
      },
      {
        id: "lec_long_run_fade",
        type: "weakness",
        title: "Queda em stint longo",
        description:
          "Perde 0,18s por volta em média após a volta 20 devido a desgaste traseiro nas corridas de 2023.",
        weight: 1.4,
      },
      {
        id: "lec_changeable_conditions",
        type: "weakness",
        title: "Risco em condições variáveis",
        description:
          "Dois abandonos por perda de traseira em pistas semi-molhadas nas últimas 20 provas.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "carlos-sainz",
    name: "Carlos Sainz",
    team: "Ferrari",
    baseScore: 89.4,
    perks: [
      {
        id: "sai_race_management",
        type: "strength",
        title: "Gestão estratégica",
        description:
          "Melhor média de pontos da Ferrari em stints sem safety-car (13,8 pts/corrida em 2023).",
        weight: 1.4,
      },
      {
        id: "sai_consistency",
        type: "strength",
        title: "Consistência",
        description:
          "Sequência de 15 chegadas consecutivas no top-10 entre 2022-23, minimizando perdas de campeonato.",
        weight: 1.0,
      },
      {
        id: "sai_defensive_awareness",
        type: "strength",
        title: "Consciência defensiva",
        description:
          "Converteu 78% das tentativas de undercut rivais em insucesso mantendo posição em 2023.",
        weight: 0.9,
      },
      {
        id: "sai_peak_qualifying",
        type: "weakness",
        title: "Limite em volta lançada",
        description:
          "Delta médio de +0,23s para Leclerc nas últimas 34 sessões Q3 disputadas juntos.",
        weight: 1.0,
      },
      {
        id: "sai_pitlane_delta",
        type: "weakness",
        title: "Saída de box conservadora",
        description:
          "Perde 0,4s em média nas voltas de saída comparado ao top 5 da grelha em 2023.",
        weight: 0.5,
      },
    ],
  },
  {
    id: "lewis-hamilton",
    name: "Lewis Hamilton",
    team: "Mercedes",
    baseScore: 90.5,
    perks: [
      {
        id: "ham_starts",
        type: "strength",
        title: "Largadas cirúrgicas",
        description:
          "Ganhou posição nas primeiras curvas em 60% das provas de 2023 apesar de largadas fora da primeira fila.",
        weight: 1.2,
      },
      {
        id: "ham_wet_mastery",
        type: "strength",
        title: "Referência em chuva",
        description:
          "Top-3 garantido em todas as corridas molhadas desde 2021, com ritmo médio +0,35s/v volta.",
        weight: 1.3,
      },
      {
        id: "ham_tyre_life",
        type: "strength",
        title: "Economia de pneus",
        description:
          "Alongou stints médios em 3 voltas frente a Russell na temporada 2023 sem queda de ritmo.",
        weight: 1.1,
      },
      {
        id: "ham_peak_qualifying",
        type: "weakness",
        title: "Pico de qualificação",
        description:
          "Apenas uma pole em 2023, com delta de +0,18s para pole em médias de circuito rápido.",
        weight: 0.9,
      },
      {
        id: "ham_top_speed_drag",
        type: "weakness",
        title: "Sensibilidade a arrasto",
        description:
          "Perde 5 km/h de reta em média quando o pacote exige asas altas, reduzindo opções de ultrapassagem.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "george-russell",
    name: "George Russell",
    team: "Mercedes",
    baseScore: 88.7,
    perks: [
      {
        id: "rus_qualifying_precision",
        type: "strength",
        title: "Precisão em qualificação",
        description:
          "Venceu o duelo interno de qualificação em 2022 e 2023 com média -0,05s sobre Hamilton.",
        weight: 1.2,
      },
      {
        id: "rus_defensive_skill",
        type: "strength",
        title: "Defesa consistente",
        description:
          "Bloqueou 68% das tentativas de ultrapassagem diretas segundo dados da FOM em 2023.",
        weight: 0.9,
      },
      {
        id: "rus_adaptability",
        type: "strength",
        title: "Adaptação rápida",
        description:
          "Pontuou em todas as corridas após atualizações de pacote aerodinâmico em 2023.",
        weight: 0.8,
      },
      {
        id: "rus_tyre_drop",
        type: "weakness",
        title: "Queda de ritmo em pneus",
        description:
          "Perde 0,15s/v após a volta 25 em médios segundo telemetria da FIA.",
        weight: 0.8,
      },
      {
        id: "rus_overtake_risk",
        type: "weakness",
        title: "Risco em ataques",
        description:
          "Incidentes em 3 das 6 tentativas de ultrapassagem lado a lado em 2023.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "lando-norris",
    name: "Lando Norris",
    team: "McLaren",
    baseScore: 90.2,
    perks: [
      {
        id: "nor_corner_speed",
        type: "strength",
        title: "Velocidade em médias",
        description:
          "Melhor delta de setor médio em pistas como Silverstone e Suzuka em 2023 (+0,28s sobre companheiros).",
        weight: 1.5,
      },
      {
        id: "nor_qualifying_gap",
        type: "strength",
        title: "Qualifying consistente",
        description:
          "Colocou McLaren no Q3 em 19 das 22 etapas de 2023, segurando média -0,18s sobre Piastri.",
        weight: 1.2,
      },
      {
        id: "nor_wet_precision",
        type: "strength",
        title: "Controle em piso molhado",
        description:
          "Top-5 garantido em todas as sessões classificatórias com chuva desde 2021.",
        weight: 1.0,
      },
      {
        id: "nor_launches",
        type: "weakness",
        title: "Arrancadas médias",
        description:
          "Perdeu posições nas primeiras voltas em 55% das corridas de 2023 por tração inicial limitada.",
        weight: 0.7,
      },
      {
        id: "nor_tyre_warmup",
        type: "weakness",
        title: "Aquecimento de pneus frios",
        description:
          "Demora duas voltas para trazer pneus duros à janela ideal, vulnerável a ataques pós-safety-car.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "oscar-piastri",
    name: "Oscar Piastri",
    team: "McLaren",
    baseScore: 87.9,
    perks: [
      {
        id: "pia_qualifying_burst",
        type: "strength",
        title: "Explosão classificatória",
        description:
          "Melhor rookie de 2023 em participação em Q3 (55%), superando Norris em 6 sessões decisivas.",
        weight: 1.1,
      },
      {
        id: "pia_tyre_care",
        type: "strength",
        title: "Cuidado com pneus",
        description:
          "Mantém degradação abaixo da média da McLaren em 0,03% por volta segundo Pirelli.",
        weight: 0.9,
      },
      {
        id: "pia_calm_execution",
        type: "strength",
        title: "Execução calma",
        description:
          "Zero penalidades por incidentes diretos em 2023, mantendo corridas limpas.",
        weight: 0.8,
      },
      {
        id: "pia_long_run_learning",
        type: "weakness",
        title: "Gestão em stints longos",
        description:
          "Ritmo cai 0,17s/v após volta 30 em comparação com Norris em corridas longas.",
        weight: 0.8,
      },
      {
        id: "pia_wheel_to_wheel",
        type: "weakness",
        title: "Agressividade lado a lado",
        description:
          "Completa apenas 40% das tentativas de ultrapassagem externas sem abortar.",
        weight: 0.5,
      },
    ],
  },
  {
    id: "fernando-alonso",
    name: "Fernando Alonso",
    team: "Aston Martin",
    baseScore: 88.8,
    perks: [
      {
        id: "alo_opening_laps",
        type: "strength",
        title: "Primeiras voltas agressivas",
        description:
          "Ganhou média de 1,7 posições na volta 1 em 2023, melhor marca entre pilotos experientes.",
        weight: 1.3,
      },
      {
        id: "alo_strategic_insight",
        type: "strength",
        title: "Leitura estratégica",
        description:
          "Chamadas de pit autônomas renderam 18 pontos extras para Aston Martin em 2023 segundo equipe.",
        weight: 1.1,
      },
      {
        id: "alo_wet_skill",
        type: "strength",
        title: "Domínio em condições mistas",
        description:
          "Pódios em todas as provas com pista molhada parcial em 2023.",
        weight: 1.0,
      },
      {
        id: "alo_qualifying_peak",
        type: "weakness",
        title: "Limite de qualificação",
        description:
          "Delta de +0,18s para pole em 2023 quando carro exigia máxima carga aerodinâmica.",
        weight: 0.8,
      },
      {
        id: "alo_late_race_strain",
        type: "weakness",
        title: "Fadiga em stint final",
        description:
          "Perde 0,12s/v na fase final quando a traseira começa a deslizar em pistas abrasivas.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "lance-stroll",
    name: "Lance Stroll",
    team: "Aston Martin",
    baseScore: 79.6,
    perks: [
      {
        id: "str_wet_bursts",
        type: "strength",
        title: "Explosões na chuva",
        description:
          "Recorde de terceiro lugar no grid em Mônaco 2023 com pista molhada, melhor que média da equipe.",
        weight: 0.9,
      },
      {
        id: "str_tyre_life",
        type: "strength",
        title: "Gestão de médios",
        description:
          "Stints de pneus médios duram 2 voltas a mais que Alonso em pistas de alta degradação.",
        weight: 0.7,
      },
      {
        id: "str_launches",
        type: "strength",
        title: "Boas largadas",
        description:
          "Ganhou posições na volta 1 em 12 das 22 provas de 2023.",
        weight: 0.8,
      },
      {
        id: "str_qualifying_gap",
        type: "weakness",
        title: "Gap classificatório",
        description:
          "Média de +0,42s para Alonso em Q3, dificultando estratégias de pista limpa.",
        weight: 1.2,
      },
      {
        id: "str_incident_rate",
        type: "weakness",
        title: "Incidência em rua",
        description:
          "Participou de incidentes ou toques em 4 dos últimos 6 GPs urbanos.",
        weight: 0.9,
      },
    ],
  },
  {
    id: "esteban-ocon",
    name: "Esteban Ocon",
    team: "Alpine",
    baseScore: 83.4,
    perks: [
      {
        id: "oco_qualifying_battle",
        type: "strength",
        title: "Duelo interno",
        description:
          "Superou Gasly em 61% das classificações de 2023, garantindo posição preferencial em estratégia.",
        weight: 1.0,
      },
      {
        id: "oco_tyre_endurance",
        type: "strength",
        title: "Stints longos",
        description:
          "Mantém degradação dos pneus duros 0,02% menor que média do pelotão intermediário.",
        weight: 0.8,
      },
      {
        id: "oco_defensive_edge",
        type: "strength",
        title: "Defesa agressiva",
        description:
          "Evita ultrapassagens em 70% das tentativas diretas, conforme dados de telemetria 2023.",
        weight: 0.7,
      },
      {
        id: "oco_first_lap_risk",
        type: "weakness",
        title: "Risco na volta inicial",
        description:
          "Envolvido em contato nas primeiras curvas em 4 corridas de 2023, ocasionando danos ou penalidades.",
        weight: 0.7,
      },
      {
        id: "oco_upgrade_adaptation",
        type: "weakness",
        title: "Adaptação a upgrades",
        description:
          "Demorou 3 etapas para recuperar ritmo após pacotes aerodinâmicos em 2023.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "pierre-gasly",
    name: "Pierre Gasly",
    team: "Alpine",
    baseScore: 82.7,
    perks: [
      {
        id: "gas_top10_qualifying",
        type: "strength",
        title: "Q3 frequente",
        description:
          "Chegou ao Q3 em 9 etapas de 2023 apesar de carro instável, capitalizando oportunidades.",
        weight: 0.9,
      },
      {
        id: "gas_changeable_conditions",
        type: "strength",
        title: "Sensibilidade climática",
        description:
          "Pódio em Zandvoort 2023 aproveitando condições mistas com ritmo consistente.",
        weight: 0.8,
      },
      {
        id: "gas_mid_race_pace",
        type: "strength",
        title: "Ritmo de meio de prova",
        description:
          "Velocidade média 0,1s/v melhor que Ocon em stints médios nas corridas finais de 2023.",
        weight: 0.7,
      },
      {
        id: "gas_start_reactions",
        type: "weakness",
        title: "Reação de largada",
        description:
          "Perdeu posições em 60% das largadas, exigindo recuperações posteriores.",
        weight: 0.6,
      },
      {
        id: "gas_front_tyre_wear",
        type: "weakness",
        title: "Desgaste de pneus dianteiros",
        description:
          "Relatou queda de 0,04% por volta adicional em pistas abrasivas como Suzuka e Silverstone.",
        weight: 0.7,
      },
    ],
  },
  {
    id: "alexander-albon",
    name: "Alexander Albon",
    team: "Williams",
    baseScore: 82.9,
    perks: [
      {
        id: "alb_low_drag_hero",
        type: "strength",
        title: "Eficiência em baixa carga",
        description:
          "Responsável por 90% dos pontos da Williams em 2023 graças a acertos de baixa resistência.",
        weight: 1.1,
      },
      {
        id: "alb_defensive_racecraft",
        type: "strength",
        title: "Defesa sólida",
        description:
          "Conseguiu manter carros mais rápidos atrás por mais de 10 voltas em Monza e Montreal.",
        weight: 1.0,
      },
      {
        id: "alb_qualifying_spikes",
        type: "strength",
        title: "Voltas decisivas",
        description:
          "Colocou o FW45 no Q3 em 8 ocasiões, extraindo desempenho acima do esperado.",
        weight: 0.9,
      },
      {
        id: "alb_high_deg_circuits",
        type: "weakness",
        title: "Sensível a alta degradação",
        description:
          "Ritmo cai 0,2s/v em pistas como Barcelona quando precisa cuidar de pneus traseiros.",
        weight: 0.8,
      },
      {
        id: "alb_pit_loss",
        type: "weakness",
        title: "Perdas em pit stops",
        description:
          "Equipe foi 0,4s mais lenta que média, comprometendo estratégias undercut.",
        weight: 0.5,
      },
    ],
  },
  {
    id: "logan-sargeant",
    name: "Logan Sargeant",
    team: "Williams",
    baseScore: 74.8,
    perks: [
      {
        id: "sar_top_speed",
        type: "strength",
        title: "Velocidade final",
        description:
          "Entre os 5 melhores em velocidade de reta segundo medições FIA 2023 em Monza/Silverstone.",
        weight: 0.8,
      },
      {
        id: "sar_learning_curve",
        type: "strength",
        title: "Evolução constante",
        description:
          "Reduziu gap para Albon em média de 0,6s para 0,3s ao final da temporada.",
        weight: 0.6,
      },
      {
        id: "sar_tyre_conservation",
        type: "strength",
        title: "Cuidado com pneus",
        description:
          "Mantém desgaste uniforme em stints longos quando não está em tráfego intenso.",
        weight: 0.5,
      },
      {
        id: "sar_qualifying_errors",
        type: "weakness",
        title: "Erros de qualificação",
        description:
          "Rodadas em 4 sessões Q1 em 2023, limitando posição inicial.",
        weight: 1.1,
      },
      {
        id: "sar_race_pace_fade",
        type: "weakness",
        title: "Queda de ritmo",
        description:
          "Ritmo de corrida cai 0,25s/v após volta 20 comparado a Albon em média.",
        weight: 0.9,
      },
    ],
  },
  {
    id: "yuki-tsunoda",
    name: "Yuki Tsunoda",
    team: "RB",
    baseScore: 82.3,
    perks: [
      {
        id: "tsu_starts",
        type: "strength",
        title: "Arrancadas fortes",
        description:
          "Média de +1,3 posições na volta inicial em 2023 apesar de largar no meio do pelotão.",
        weight: 0.9,
      },
      {
        id: "tsu_tyre_warmup",
        type: "strength",
        title: "Aquecimento imediato",
        description:
          "Traz pneus macios à temperatura ideal em 1 volta, ideal para relargadas agressivas.",
        weight: 0.8,
      },
      {
        id: "tsu_late_braking",
        type: "strength",
        title: "Freada tardia",
        description:
          "Completa 65% das ultrapassagens por dentro sem bloqueio de rodas em 2023.",
        weight: 0.7,
      },
      {
        id: "tsu_penalty_risk",
        type: "weakness",
        title: "Risco de punição",
        description:
          "Recebeu 8 pontos de licença na temporada por limites de pista e bloqueios.",
        weight: 0.7,
      },
      {
        id: "tsu_long_run_focus",
        type: "weakness",
        title: "Queda de foco",
        description:
          "Ritmo cai 0,14s/v em stints acima de 20 voltas quando isolado sem referência.",
        weight: 0.6,
      },
    ],
  },
  {
    id: "daniel-ricciardo",
    name: "Daniel Ricciardo",
    team: "RB",
    baseScore: 81.5,
    perks: [
      {
        id: "ric_tyre_finesse",
        type: "strength",
        title: "Toque suave",
        description:
          "Consegue alongar pneus macios em +3 voltas sem degradação crítica baseado em dados de 2020-23.",
        weight: 0.9,
      },
      {
        id: "ric_late_brake",
        type: "strength",
        title: "Mergulho tardio",
        description:
          "Alta taxa de sucesso em ultrapassagens na freada graças a controle de pressão (65% em 2023 retorno).",
        weight: 0.8,
      },
      {
        id: "ric_street_experience",
        type: "strength",
        title: "Experiência em rua",
        description:
          "Histórico de pódios em Mônaco/Baku e adaptação rápida a traçados apertados.",
        weight: 0.7,
      },
      {
        id: "ric_qualifying_delta",
        type: "weakness",
        title: "Delta de qualificação",
        description:
          "Ainda 0,3s atrás de Tsunoda em média nas sessões Q2 de 2023 após retorno.",
        weight: 0.8,
      },
      {
        id: "ric_race_sharpness",
        type: "weakness",
        title: "Ritmo de corrida",
        description:
          "Queda de 0,12s/v em stint longo enquanto readquire confiança no carro.",
        weight: 0.7,
      },
    ],
  },
  {
    id: "valtteri-bottas",
    name: "Valtteri Bottas",
    team: "Stake Sauber",
    baseScore: 82.5,
    perks: [
      {
        id: "bot_qualifying_top_speed",
        type: "strength",
        title: "Velocidade de reta",
        description:
          "Aproveita slipstream e baixa asa para superar companheiro em 70% das Q1/Q2.",
        weight: 0.9,
      },
      {
        id: "bot_tyre_care",
        type: "strength",
        title: "Gestão traseira",
        description:
          "Conhecido por preservar pneus traseiros em stints longos desde era Mercedes, mantendo ritmo estável.",
        weight: 0.8,
      },
      {
        id: "bot_consistency",
        type: "strength",
        title: "Consistência",
        description:
          "Taxa de abandonos por erro próprio abaixo de 3% nas últimas 4 temporadas.",
        weight: 0.7,
      },
      {
        id: "bot_race_starts",
        type: "weakness",
        title: "Largadas",
        description:
          "Perde em média 0,8 posições na volta inicial quando larga do meio do grid.",
        weight: 0.8,
      },
      {
        id: "bot_wet_confidence",
        type: "weakness",
        title: "Confiança na chuva",
        description:
          "Queda de 0,3s/v em pistas molhadas comparado à média do pelotão intermediário.",
        weight: 0.7,
      },
    ],
  },
  {
    id: "zhou-guanyu",
    name: "Zhou Guanyu",
    team: "Stake Sauber",
    baseScore: 78.9,
    perks: [
      {
        id: "zhou_launches",
        type: "strength",
        title: "Largadas reativas",
        description:
          "Média de +1 posição na volta 1 em 2023, destaque entre o segundo bloco de equipes.",
        weight: 0.8,
      },
      {
        id: "zhou_tyre_care",
        type: "strength",
        title: "Cuidado com pneus",
        description:
          "Degradação equilibrada entre eixos com variação de apenas 0,01% por volta segundo Pirelli.",
        weight: 0.7,
      },
      {
        id: "zhou_feedback",
        type: "strength",
        title: "Feedback técnico",
        description:
          "Reconhecido pela equipe por acelerar correções de setup, reduzindo subesterço crônico em 2023.",
        weight: 0.6,
      },
      {
        id: "zhou_qualifying_pace",
        type: "weakness",
        title: "Pace classificatório",
        description:
          "Delta de +0,32s para Bottas em média nas últimas 10 classificações.",
        weight: 0.9,
      },
      {
        id: "zhou_late_race_fade",
        type: "weakness",
        title: "Fadiga final",
        description:
          "Ritmo cai 0,16s/v nos 10 giros finais quando disputa em tráfego.",
        weight: 0.7,
      },
    ],
  },
  {
    id: "nico-hulkenberg",
    name: "Nico Hülkenberg",
    team: "Haas",
    baseScore: 82.4,
    perks: [
      {
        id: "hul_qualifying_hero",
        type: "strength",
        title: "Herói de classificação",
        description:
          "Levou a Haas ao Q3 em 7 ocasiões 2023 com voltas acima da expectativa do carro.",
        weight: 1.0,
      },
      {
        id: "hul_feedback",
        type: "strength",
        title: "Feedback técnico",
        description:
          "Orientou ajustes que economizaram 0,2s/v em ritmo de corrida pós-atualizações Austin 2023.",
        weight: 0.8,
      },
      {
        id: "hul_low_fuel",
        type: "strength",
        title: "Ritmo com pouco combustível",
        description:
          "Voltas finais rápidas garantiram pontos em Melbourne 2023 com carro mais leve.",
        weight: 0.7,
      },
      {
        id: "hul_race_pace_drop",
        type: "weakness",
        title: "Queda em ritmo de corrida",
        description:
          "Consumo irregular de pneus traseiros gera perda de 0,25s/v após volta 15.",
        weight: 1.0,
      },
      {
        id: "hul_tyre_deg",
        type: "weakness",
        title: "Sensibilidade a degradação",
        description:
          "Haas 2023 liderou ranking de degradação, exigindo duas paradas extras em média.",
        weight: 0.8,
      },
    ],
  },
  {
    id: "kevin-magnussen",
    name: "Kevin Magnussen",
    team: "Haas",
    baseScore: 80.6,
    perks: [
      {
        id: "mag_start_aggression",
        type: "strength",
        title: "Arranque agressivo",
        description:
          "Ganhou média de 1,5 posições nas duas primeiras voltas quando largou do pelotão intermediário em 2023.",
        weight: 0.9,
      },
      {
        id: "mag_defense",
        type: "strength",
        title: "Defesa dura",
        description:
          "Resistiu a ataques prolongados em pistas como Jeddah e Miami sem penalidades.",
        weight: 0.8,
      },
      {
        id: "mag_changeable_conditions",
        type: "strength",
        title: "Explora condições mistas",
        description:
          "Pontuou sempre que houve chuva leve, aproveitando decisões arriscadas de pneus.",
        weight: 0.7,
      },
      {
        id: "mag_tyre_wear",
        type: "weakness",
        title: "Desgaste elevado",
        description:
          "Carro sofre com degradação, levando a queda de 0,23s/v após metade do stint.",
        weight: 0.9,
      },
      {
        id: "mag_qualifying_consistency",
        type: "weakness",
        title: "Inconstância em qualificação",
        description:
          "Oscila 0,4s entre tentativas no Q1, dificultando repetição de voltas rápidas.",
        weight: 0.7,
      },
    ],
  },
];

export const driverPerkCatalog = catalog;

export const getDriverPerkProfile = (driverId: string) =>
  catalog.find((driver) => driver.id === driverId);
