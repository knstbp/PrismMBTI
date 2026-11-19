(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MBTI_ADVANCED = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BORDERLINE_EXPLANATIONS = {
    EI: '你的精力來源介於外向與內向之間（雙向切換型），既能投入團隊熱烈討論，也需要定期退回安靜空間深度沉澱，依情境對象切換最自在。',
    SN: '你在務實細節（S）與宏觀抽象（N）之間保有良好平衡，能同時看懂長遠趨勢與眼下執行細節，不易流於空談也不會只見樹不見林。',
    TF: '你的決策兼顧客觀邏輯（T）與人情感受（F），分析利弊時不會完全忽略他人處境，同理對方時也能保有理性底線，極適合擔任跨立場橋樑。',
    JP: '你在秩序規劃（J）與靈活彈性（P）之間位於均衡區，大事與重要時程偏好有明確節點，但執行過程願意視新資訊隨時調整做法。',
    AT: '你的自我認同界於果斷（A）與謹慎（T）的平衡點，既有追求精進的敏銳度，又能在壓力過後較快恢復情緒基準線。'
  };

  function getDifferentiationTier(index) {
    if (index >= 60) {
      return {
        label: '高度鮮明型',
        summary: '你在多數維度上都有非常明確的傾向，思考習慣與處事風格穩定一致，是該人格型態的經典代表。'
      };
    }
    if (index >= 30) {
      return {
        label: '中度分化型',
        summary: '你有清晰的主軸偏好，同時在部分情境保有適度彈性，能依據職場或人際需求做出調整。'
      };
    }
    return {
      label: '均衡彈性型',
      summary: '你的多個向度分數接近中線，代表跨類型適應力極高，行為表現會隨環境與角色切換而不受單一標籤侷限。'
    };
  }

  function flipCharInType(baseType, dimIndex, newChar) {
    const chars = baseType.split('');
    chars[dimIndex] = newChar;
    return chars.join('');
  }

  function clampScore(v) {
    return Math.min(96, Math.max(8, Math.round(v)));
  }

  function getLevelLabel(score) {
    if (score >= 65) return '偏高';
    if (score >= 36) return '中等';
    return '偏低';
  }

  function computeDomainSubTraits(dims) {
    const pE = dims.EI.pctA;
    const pI = dims.EI.pctB;
    const pS = dims.SN.pctA;
    const pN = dims.SN.pctB;
    const pT = dims.TF.pctA;
    const pF = dims.TF.pctB;
    const pJ = dims.JP.pctA;
    const pP = dims.JP.pctB;
    const pA = dims.AT.pctA;
    const pTurb = dims.AT.pctB;

    const makeTrait = (key, title, score, color, copyMap) => {
      const s = clampScore(score);
      const level = getLevelLabel(s);
      const bucket = level === '偏高' ? copyMap.high : level === '中等' ? copyMap.mid : copyMap.low;
      return { key, title, score: s, level, color, tip: bucket };
    };

    return {
      career: [
        makeTrait('perfectionism', '完美主義', pJ * 0.48 + pTurb * 0.52, '#3B82F6', {
          high: '你對作品品質與細節極度講究，能確保極高完成度；建議設定「85 分先發布」原則避免過度打磨拖延。',
          mid: '你在追求高品質與準時交付之間拿捏得宜，重要環節嚴謹、次要細節懂得適度放手。',
          low: '你重視快速推進與彈性試錯勝過死磕細節，搭配一位細心型夥伴複核能大幅減少疏漏。'
        }),
        makeTrait('ambition', '職場志向', pN * 0.36 + pT * 0.34 + pE * 0.3, '#F59E0B', {
          high: '你渴望挑戰更大影響力與舞台，對目標高度專注；留意別把自我價值完全與頭銜成就綁定。',
          mid: '你在職涯成長與生活品質之間追求平衡，對真正有興趣的目標才願意全力衝刺。',
          low: '比起向上爭奪權位，你更重視工作的自在感、人際溫度或專業工藝本身的純粹樂趣。'
        }),
        makeTrait('intrinsicDrive', '內在動力', pI * 0.3 + pJ * 0.36 + pN * 0.34, '#10B981', {
          high: '不需他人緊迫盯人就能自我驅動持續推進，當任務與你的核心信念對齊時耐力驚人。',
          mid: '你既有自我要求，也需要適度的外部節點或團隊回饋來維持穩定推進節奏。',
          low: '你的動力高度仰賴當下氣氛、即時回饋與好玩程度，善用小獎勵與夥伴陪跑能大幅提升執行率。'
        }),
        makeTrait('leadership', '領導傾向', pE * 0.38 + pT * 0.32 + pA * 0.3, '#8B5CF6', {
          high: '你樂於站出來協調方向、設定標準並扛起決策責任，記得同時預留空間讓內向夥伴發聲。',
          mid: '需要時你能勝任協調帶領角色，平時也自在於擔任專業核心貢獻者。',
          low: '你更享受深耕個人專業或協助他人發光，不必勉強自己硬套強勢型領導模板。'
        })
      ],
      growth: [
        makeTrait('resilience', '心理復原力', pA * 0.65 + pT * 0.35, '#3B82F6', {
          high: '面對挫折或批評後能較快重整心態繼續向前，將你的經驗復盤分享給他人會很有幫助。',
          mid: '遇到打擊時需要一點沉澱消化時間，只要找到情緒出口就能重新站穩腳步。',
          low: '你的情感雷達非常敏銳，挫折容易在心裡反芻較久；練習區分「事件失誤」與「自我否定」是關鍵課題。'
        }),
        makeTrait('confidence', '自信基線', pA * 0.6 + pE * 0.4, '#F59E0B', {
          high: '你在多數場合都能從容展現想法與行動力，偶爾刻意驗證自己假設能避免過度樂觀盲點。',
          mid: '在熟悉擅長的領域非常有自信，進入全新未知環境時則保有健康謹慎。',
          low: '你常低估自己已具備的實力，建議建立「個人成就紀錄本」隨時提醒自己其實做得很好。'
        }),
        makeTrait('perseverance', '長期毅力', pJ * 0.56 + pS * 0.44, '#10B981', {
          high: '面對長週期枯燥累積依然能一步一腳印堅持到底，注意別在明顯不合適的方向上硬撐過久。',
          mid: '對明確有感的目標能穩定堅持，偶爾需要把大目標拆成 2 週一個小里程碑維持熱度。',
          low: '你喜歡新鮮探索與快速迭代，用「短週期衝刺＋允許換軌」比硬逼自己一成不變更有效。'
        }),
        makeTrait('control', '內在掌控感', pA * 0.52 + pJ * 0.48, '#8B5CF6', {
          high: '面對變數時仍感覺自己握有選擇權與主導力，能穩定替自己與團隊定錨方向。',
          mid: '能掌握可控制部分、同時對外在環境變化保持合理警覺與彈性調整空間。',
          low: '環境混亂或他人失控時容易感到焦慮被動，把焦點拉回「今天我能主動決定的三件小事」能快速回穩。'
        })
      ],
      relationships: [
        makeTrait('authenticity', '真誠本真', pF * 0.45 + pI * 0.55, '#3B82F6', {
          high: '在親近關係裡極為忠於真實感受、不愛虛偽迎合，也記得用溫暖方式表達真實立場。',
          mid: '既能真實表達自我，又懂得依社交場合拿捏禮貌與圓融分寸。',
          low: '你很擅長配合群體氣氛調整表現，偶爾停下來問自己「我真實的感受與需求是什麼」很重要。'
        }),
        makeTrait('loyalty', '關係忠誠投入', pJ * 0.42 + pS * 0.34 + pF * 0.24, '#F59E0B', {
          high: '對承諾、家庭與長久友誼極為重視，不會輕易因小磨擦放棄一段重要關係。',
          mid: '重視關係裡的信任與互惠，既投入心力也保留彼此應有的獨立成長空間。',
          low: '你更看重當下關係是否自由快樂、共同成長，長期關係記得多補充一點穩定承諾儀式感。'
        }),
        makeTrait('altruism', '利他共情', pF * 0.65 + pE * 0.35, '#10B981', {
          high: '天生樂於照顧與支持他人需求，務必同步替自己的時間與情緒設好界線以免過勞。',
          mid: '懂得在幫助他人與照顧自己需求之間取得平衡，給予溫暖卻不至於過度承擔。',
          low: '你習慣用就事論事與尊重邊界對待他人，偶爾多一句主觀暖心問候能讓關係更親密。'
        }),
        makeTrait('emotionalAttunement', '情緒覺察', pF * 0.54 + pN * 0.26 + pA * 0.2, '#8B5CF6', {
          high: '你能迅速讀懂空氣中的細微情緒張力並給予適切回應，是極讓人感到被理解的夥伴。',
          mid: '多數時候能體察他人感受，同時不至於完全被他人情緒風暴牽著走。',
          low: '你偏好直接、不拐彎抹角的溝通，遇到感性型對象時記得先確認對方情緒而非直接講道理。'
        })
      ]
    };
  }

  function buildCanonicalDimensions(baseType) {
    return {
      EI: { key: 'EI', label: '精力來源', poleA: 'E', poleB: 'I', nameA: '外向 (E)', nameB: '內向 (I)', pctA: baseType[0] === 'E' ? 78 : 22, pctB: baseType[0] === 'E' ? 22 : 78, winner: baseType[0], winnerPct: 78, clarity: { label: '典型傾向' } },
      SN: { key: 'SN', label: '資訊接收', poleA: 'S', poleB: 'N', nameA: '實感 (S)', nameB: '直覺 (N)', pctA: baseType[1] === 'S' ? 78 : 22, pctB: baseType[1] === 'S' ? 22 : 78, winner: baseType[1], winnerPct: 78, clarity: { label: '典型傾向' } },
      TF: { key: 'TF', label: '決策方式', poleA: 'T', poleB: 'F', nameA: '思考 (T)', nameB: '情感 (F)', pctA: baseType[2] === 'T' ? 78 : 22, pctB: baseType[2] === 'T' ? 22 : 78, winner: baseType[2], winnerPct: 78, clarity: { label: '典型傾向' } },
      JP: { key: 'JP', label: '生活態度', poleA: 'J', poleB: 'P', nameA: '判斷 (J)', nameB: '感知 (P)', pctA: baseType[3] === 'J' ? 78 : 22, pctB: baseType[3] === 'J' ? 22 : 78, winner: baseType[3], winnerPct: 78, clarity: { label: '典型傾向' } },
      AT: { key: 'AT', label: '自我認同', poleA: 'A', poleB: 'T', nameA: '果斷 (A)', nameB: '謹慎 (T)', pctA: 55, pctB: 45, winner: 'A', winnerPct: 55, clarity: { label: '均衡參考' } }
    };
  }

  function buildStep2Facets(dims, facetScores, literatureData) {
    if (!literatureData || !Array.isArray(literatureData.STEP2_FACETS)) {
      return null;
    }
    const groupsOrder = ['EI', 'SN', 'TF', 'JP'];
    const groups = groupsOrder.map((dimKey) => {
      const parentDim = dims[dimKey];
      const facets = literatureData.STEP2_FACETS.filter((f) => f.dim === dimKey).map((f) => {
        const measured = facetScores && facetScores[f.id];
        const hasMeasured = Boolean(measured && measured.count > 0 && measured.pctA !== null);
        const pctA = hasMeasured ? measured.pctA : parentDim.pctA;
        const pctB = 100 - pctA;
        const winner = pctA >= 50 ? f.poleA : f.poleB;
        const winnerPct = Math.max(pctA, pctB);
        const winnerName = winner === f.poleA ? f.nameA : f.nameB;
        const isOutOfPreference = winner !== parentDim.winner;
        return {
          id: f.id,
          dim: f.dim,
          poleA: f.poleA,
          poleB: f.poleB,
          nameA: f.nameA,
          nameB: f.nameB,
          desc: f.desc,
          pctA,
          pctB,
          winner,
          winnerPct,
          winnerName,
          isOutOfPreference,
          isBalanced: winnerPct <= 54,
          isEstimated: !hasMeasured,
          count: hasMeasured ? measured.count : 0
        };
      });
      return {
        dimKey,
        dimLabel: parentDim.label,
        parentWinner: parentDim.winner,
        parentWinnerPct: parentDim.winnerPct,
        facets
      };
    });

    const outOfPreferenceList = [];
    groups.forEach((g) => {
      g.facets.forEach((f) => {
        if (f.isOutOfPreference) {
          outOfPreferenceList.push(f);
        }
      });
    });

    return {
      groups,
      outOfPreferenceCount: outOfPreferenceList.length,
      outOfPreferenceList
    };
  }

  function buildLiteratureSummary(baseType, typeData, literatureData, cognitiveFunctions) {
    if (!literatureData || !literatureData.TYPE_LITERATURE || !literatureData.TYPE_LITERATURE[baseType]) {
      return null;
    }
    const profile = typeData.TYPES[baseType];
    const fnCatalog = (typeData && typeData.COGNITIVE_FUNCTIONS) || {};
    const litType = literatureData.TYPE_LITERATURE[baseType];
    const interactionStyle =
      (literatureData.INTERACTION_STYLES && literatureData.INTERACTION_STYLES[litType.interactionStyle]) || null;
    const temperament =
      (literatureData.KEIRSEY_TEMPERAMENTS && profile && literatureData.KEIRSEY_TEMPERAMENTS[profile.group]) || null;

    const shadowFieldByPos = { 5: 'opposing5', 6: 'critical6', 7: 'trickster7', 8: 'demon8' };
    const positions = Array.isArray(literatureData.BEEBE_POSITIONS) ? literatureData.BEEBE_POSITIONS : [];
    const beebeStack = positions.map((posObj, idx) => {
      const fnCode = litType.beebe8[idx];
      const fnMeta = fnCatalog[fnCode] || { name: fnCode, short: '' };
      const score =
        cognitiveFunctions && typeof cognitiveFunctions[fnCode] === 'number'
          ? cognitiveFunctions[fnCode]
          : null;
      const shadowKey = shadowFieldByPos[posObj.pos];
      const shadowInsight = shadowKey && litType.shadowInsights ? litType.shadowInsights[shadowKey] : '';
      return {
        pos: posObj.pos,
        role: posObj.role,
        sphere: posObj.sphere,
        roleDesc: posObj.desc,
        fnCode,
        fnName: fnMeta.name,
        fnShort: fnMeta.short,
        score,
        shadowInsight
      };
    });

    return {
      interactionStyle,
      temperament,
      beebeStack,
      cognitiveLoop: litType.cognitiveLoop,
      quenkGrip: litType.quenkGrip,
      references: literatureData.LITERATURE_REFERENCES || []
    };
  }

  function buildAdvancedAnalysis(record, typeData, previousRecord, literatureData) {
    const profile = typeData.TYPES[record.baseType];
    const group = typeData.GROUPS[profile.group];
    const mod = typeData.IDENTITY_MODIFIERS[record.identity];
    const fnCatalog = typeData.COGNITIVE_FUNCTIONS;
    const dims = record.dimensions;

    const coreKeys = ['EI', 'SN', 'TF', 'JP'];
    const differentiationIndex =
      record.quality && typeof record.quality.differentiationIndex === 'number'
        ? record.quality.differentiationIndex
        : Math.round(
            coreKeys.reduce((sum, k) => sum + ((dims[k].winnerPct - 50) / 50) * 100, 0) / 4
          );
    const diffTier = getDifferentiationTier(differentiationIndex);

    const allDimKeys = ['EI', 'SN', 'TF', 'JP', 'AT'];
    const overallConsistency =
      record.quality && typeof record.quality.overallConsistency === 'number'
        ? record.quality.overallConsistency
        : Math.round(
            allDimKeys.reduce(
              (sum, k) => sum + (typeof dims[k].consistency === 'number' ? dims[k].consistency : 70),
              0
            ) / 5
          );

    const consistencyInterpretation =
      overallConsistency >= 75
        ? '你在各向度題目上的作答方向高度一致，代表你的性格偏好在工作、社交與獨處等不同場合都相當穩定。'
        : overallConsistency >= 55
          ? '你的作答反映出適度的情境調節力，在核心原則上一致，但面對不同場合會微調表現方式。'
          : '你的同一向度內不同情境題作答落差較大，顯示你在「職場角色」與「私下真實偏好」之間經常進行動態切換。';

    const borderlineAxes = allDimKeys
      .filter((k) => dims[k].winnerPct <= 58)
      .map((k) => ({
        key: k,
        label: dims[k].label,
        pctA: dims[k].pctA,
        pctB: dims[k].pctB,
        nameA: dims[k].nameA,
        nameB: dims[k].nameB,
        explanation: BORDERLINE_EXPLANATIONS[k]
      }));

    // Neighbor types: flip up to 2 lowest-margin core axes if winnerPct <= 65
    const sortedCoreByMargin = coreKeys
      .map((k, idx) => ({ key: k, idx, dim: dims[k] }))
      .sort((a, b) => a.dim.winnerPct - b.dim.winnerPct);

    const neighborTypes = [];
    for (const item of sortedCoreByMargin) {
      if (item.dim.winnerPct <= 65 && neighborTypes.length < 2) {
        const altPole = item.dim.winner === item.dim.poleA ? item.dim.poleB : item.dim.poleA;
        const neighborCode = flipCharInType(record.baseType, item.idx, altPole);
        const neighborProfile = typeData.TYPES[neighborCode];
        if (neighborProfile) {
          neighborTypes.push({
            code: neighborCode,
            name: neighborProfile.name,
            groupName: typeData.GROUPS[neighborProfile.group].name,
            color: typeData.GROUPS[neighborProfile.group].color,
            flippedLabel: `${item.dim.label}（${item.dim.winner} ${item.dim.winnerPct}% / ${altPole} ${100 - item.dim.winnerPct}%）`
          });
        }
      }
    }

    // Strongest core axis for executive summary
    const strongestCore = sortedCoreByMargin[sortedCoreByMargin.length - 1];
    const borderlineNote =
      borderlineAxes.length > 0
        ? `同時你在「${borderlineAxes.map((b) => b.label).join('、')}」呈現均衡邊緣特徵，使你的實際表現比典型 ${record.baseType} 更具跨界適應彈性。`
        : `各向度皆呈現清晰的偏好輪廓，尤其以「${strongestCore.dim.label}（${strongestCore.dim.winner} ${strongestCore.dim.winnerPct}%）」最為鮮明。`;

    const executiveSummary =
      `你的整體測評型態為 ${record.fullType}（${profile.name}，屬於${group.name}氣質群組），類型分化明確度為 ${differentiationIndex}%（${diffTier.label}）。` +
      `${borderlineNote}${mod.name}（-${mod.code}）特質讓你在面對外界回饋與壓力時，展現出「${mod.code === 'A' ? '情緒穩健、行動後少反芻內耗' : '敏銳察覺細節與持續自我鞭策'}」的調節模式。`;

    // Cognitive Function Dynamics
    const stack = profile.functions;
    const dominantCode = stack[0];
    const inferiorCode = stack[3];
    const cog = record.cognitiveFunctions;
    const domScore = cog[dominantCode] || 75;
    const infScore = cog[inferiorCode] || 30;
    const gap = domScore - infScore;

    const axisTensionTitle = `主導 ${dominantCode}（${domScore}%）↔ 劣勢 ${inferiorCode}（${infScore}%）動力軸`;
    const axisTensionDesc =
      gap >= 40
        ? `你的主導功能 ${fnCatalog[dominantCode].name}（${dominantCode}）非常強勢且純熟，平時能為你帶來極高效率；但也因此與劣勢功能 ${fnCatalog[inferiorCode].name}（${inferiorCode}）差距達 ${gap}%，在長期高壓時較容易忽然出現與平常反差極大的疲態反應。建議日常刻意進行小劑量 ${inferiorCode} 練習以維持平衡。`
        : `你的主導 ${fnCatalog[dominantCode].name}（${dominantCode}）與劣勢 ${fnCatalog[inferiorCode].name}（${inferiorCode}）差距為 ${gap}%，屬於相對均衡的整合狀態，代表你在面對盲區情境時仍保有一部分的補償與自我覺察能力。`;

    const iSum = (cog.Ni || 0) + (cog.Si || 0) + (cog.Ti || 0) + (cog.Fi || 0);
    const eSum = (cog.Ne || 0) + (cog.Se || 0) + (cog.Te || 0) + (cog.Fe || 0);
    const totalIE = iSum + eSum || 1;
    const introvertedEnergyPct = Math.round((iSum / totalIE) * 100);
    const extravertedEnergyPct = 100 - introvertedEnergyPct;

    const topTwoSet = new Set([stack[0], stack[1]]);
    const shadowCandidate = Object.entries(cog)
      .filter(([code]) => !topTwoSet.has(code))
      .sort((a, b) => b[1] - a[1])[0];

    const shadowStandout = shadowCandidate
      ? {
          code: shadowCandidate[0],
          score: shadowCandidate[1],
          name: fnCatalog[shadowCandidate[0]].name,
          insight: `在你的前兩位核心功能（${stack[0]}、${stack[1]}）之外，${shadowCandidate[0]}（${fnCatalog[shadowCandidate[0]].name}，${shadowCandidate[1]}%）分數最為突出，為你的處事增添了「${fnCatalog[shadowCandidate[0]].short}」的輔助視角。`
        }
      : null;

    // Communication Playbook tailored by real axis winners + margins
    const isE = dims.EI.winner === 'E';
    const isS = dims.SN.winner === 'S';
    const isT = dims.TF.winner === 'T';
    const isJ = dims.JP.winner === 'J';

    const preferredStyle =
      `溝通時偏好「${isS ? '具體案例與明確步驟' : '先講大方向、背後理念與趨勢脈絡'}」，決策互動看重「${isT ? '客觀邏輯與因果證據' : '彼此感受尊重與價值共鳴'}」，節奏上傾向「${isE ? '即時對話腦力激盪' : '先看過重點資料、消化後再深入對談'}」。`;

    const dos = [
      isE
        ? '開場先用口頭交流暖身並歡迎即時討論，能快速激發你的參與感。'
        : '重要會議前先提供議程或書面背景資料，讓你有機會先沉澱出高品質觀點。',
      isS
        ? '清楚說明預期產出規格、實際案例與執行資源，減少模糊不清的口號。'
        : '先對齊「為什麼做這件事」的願景與意義，再展開細節會讓你更有動力。',
      isT
        ? '直接就事論事、提出數據與推理依據，不必過度鋪陳客套委婉詞。'
        : '給予建議前先肯定立場與付出，用合作而非批判的語氣提出調整方案。'
    ];

    const avoids = [
      isJ
        ? '避免在沒有緩衝或說明原因的情況下，反覆臨時更動已經拍板的時程。'
        : '避免過度微觀控制每個小步驟或過早封死其他可行替代方案。',
      isT
        ? '避免只用情緒訴求施壓而忽略問題本身的因果邏輯。'
        : '避免用冷冰冰或帶有指責意味的否定句直接否定對方的善意動機。',
      mod.code === 'T'
        ? '避免曖昧不清的負面評價（例如只說「不太對」卻不說哪裡可改進），容易引發過度反芻。'
        : '避免在危機討論時低估你的敏銳度，保持真誠對等交流最能獲得你的信任。'
    ];

    // 30-day Personalized Action Roadmap
    const lowestCore = sortedCoreByMargin[0];
    const lowestAlt = lowestCore.dim.winner === lowestCore.dim.poleA ? lowestCore.dim.poleB : lowestCore.dim.poleA;

    const actionRoadmap = [
      {
        stage: '第 1 週｜自我覺察與高耗能掃描',
        focus: `觀察「${strongestCore.dim.label}（${strongestCore.dim.winner}）」過度運作時的疲勞訊號`,
        action: `連續 7 天記錄每天最讓你耗電與充電的事件，並留意「${profile.stressAndRecovery.triggers.split('、')[0]}」出現時，提早做 10 分鐘的「${profile.stressAndRecovery.rechargeWays.split('、')[0]}」。`
      },
      {
        stage: '第 2–3 週｜跨向度彈性微調實驗',
        focus: `針對「${lowestCore.dim.label}」嘗試接納 ${lowestAlt} 視角（目前 ${lowestCore.dim.winner} ${lowestCore.dim.winnerPct}%）`,
        action: profile.growth[0] || `本週刻意練習一次與平常習慣相反的小做法，觀察這份跨向度練習如何補足你的盲點。`
      },
      {
        stage: '第 4 週｜盲點護欄與優勢複利',
        focus: `${mod.name}（-${mod.code}）心態校準與主導優勢聚焦`,
        action: `${mod.tips} 同時將你最擅長的「${fnCatalog[dominantCode].short}」應用在一項可累積長期成果的專案或關係習慣上。`
      }
    ];

    // History Comparison (if previousRecord exists)
    let historyDelta = null;
    if (previousRecord && previousRecord.dimensions) {
      const dimShifts = allDimKeys.map((k) => {
        const cur = dims[k];
        const prev = previousRecord.dimensions[k];
        if (!prev) return null;
        const deltaA = cur.pctA - prev.pctA;
        return {
          key: k,
          label: cur.label,
          prevWinner: prev.winner,
          prevWinnerPct: prev.winnerPct,
          curWinner: cur.winner,
          curWinnerPct: cur.winnerPct,
          shiftedPole: cur.winner !== prev.winner,
          deltaA
        };
      }).filter(Boolean);

      historyDelta = {
        prevType: previousRecord.fullType,
        prevDate: previousRecord.createdAt,
        typeChanged: previousRecord.fullType !== record.fullType,
        dimShifts
      };
    }

    return {
      executiveSummary,
      psychometrics: {
        differentiationIndex,
        differentiationLabel: diffTier.label,
        differentiationSummary: diffTier.summary,
        overallConsistency,
        consistencyInterpretation,
        borderlineAxes,
        neighborTypes
      },
      cognitiveDynamics: {
        dominantCode,
        inferiorCode,
        axisTensionTitle,
        axisTensionDesc,
        introvertedEnergyPct,
        extravertedEnergyPct,
        shadowStandout
      },
      communicationPlaybook: {
        preferredStyle,
        dos,
        avoids
      },
      domainSubTraits: computeDomainSubTraits(dims),
      step2Facets: buildStep2Facets(dims, record.facetScores, literatureData),
      literatureProfile: buildLiteratureSummary(
        record.baseType,
        typeData,
        literatureData,
        record.cognitiveFunctions
      ),
      actionRoadmap,
      historyDelta
    };
  }

  return {
    buildAdvancedAnalysis,
    buildLiteratureSummary,
    computeDomainSubTraits,
    buildCanonicalDimensions
  };
}));
