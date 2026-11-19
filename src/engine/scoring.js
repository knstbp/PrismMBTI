(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MBTI_ENGINE = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DIMENSIONS = {
    EI: { key: 'EI', label: '精力來源', poleA: 'E', poleB: 'I', nameA: '外向 (E)', nameB: '內向 (I)' },
    SN: { key: 'SN', label: '資訊接收', poleA: 'S', poleB: 'N', nameA: '實感 (S)', nameB: '直覺 (N)' },
    TF: { key: 'TF', label: '決策方式', poleA: 'T', poleB: 'F', nameA: '思考 (T)', nameB: '情感 (F)' },
    JP: { key: 'JP', label: '生活態度', poleA: 'J', poleB: 'P', nameA: '判斷 (J)', nameB: '感知 (P)' },
    AT: { key: 'AT', label: '自我認同', poleA: 'A', poleB: 'T', nameA: '果斷 (A)', nameB: '謹慎 (T)' }
  };

  const VALID_LIKERT_VALUES = new Set([-3, -2, -1, 0, 1, 2, 3]);

  function getQuestionsForMode(allQuestions, mode) {
    if (mode === 'quick') {
      return allQuestions.filter((q) => q.isQuick === true);
    }
    return allQuestions.slice();
  }

  function getClarityInfo(winnerPct) {
    if (winnerPct >= 80) {
      return { level: 'very-clear', label: '極明顯傾向' };
    }
    if (winnerPct >= 65) {
      return { level: 'clear', label: '明確傾向' };
    }
    if (winnerPct >= 55) {
      return { level: 'moderate', label: '溫和傾向' };
    }
    return { level: 'slight', label: '均衡 / 微弱傾向' };
  }

  function clamp(num, min, max) {
    return Math.min(max, Math.max(min, num));
  }

  function computeCognitiveFunctions(dimResults, stackCodes) {
    const pE = dimResults.EI.pctA / 100;
    const pI = 1 - pE;
    const pS = dimResults.SN.pctA / 100;
    const pN = 1 - pS;
    const pT = dimResults.TF.pctA / 100;
    const pF = 1 - pT;
    const pJ = dimResults.JP.pctA / 100;
    const pP = 1 - pJ;

    const rawScores = {
      Ni: pN * 58 + ((pI + pJ) / 2) * 22,
      Ne: pN * 58 + ((pE + pP) / 2) * 22,
      Si: pS * 58 + ((pI + pJ) / 2) * 22,
      Se: pS * 58 + ((pE + pP) / 2) * 22,
      Ti: pT * 58 + ((pI + pP) / 2) * 22,
      Te: pT * 58 + ((pE + pJ) / 2) * 22,
      Fi: pF * 58 + ((pI + pP) / 2) * 22,
      Fe: pF * 58 + ((pE + pJ) / 2) * 22
    };

    const stackBonus = {};
    if (Array.isArray(stackCodes)) {
      const bonuses = [18, 12, 6, 0];
      stackCodes.forEach((code, idx) => {
        if (idx < bonuses.length) {
          stackBonus[code] = bonuses[idx];
        }
      });
    }

    const result = {};
    Object.keys(rawScores).forEach((fnCode) => {
      const score = Math.round(clamp(rawScores[fnCode] + (stackBonus[fnCode] || 0), 12, 98));
      result[fnCode] = score;
    });

    return result;
  }

  function calculateMBTIResult(questions, answers, typeCatalog, literatureData) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('題庫不可為空');
    }

    const stats = {};
    Object.keys(DIMENSIONS).forEach((dimKey) => {
      stats[dimKey] = { raw: 0, count: 0, maxAbs: 0, itemScores: [] };
    });

    let answeredCount = 0;
    let neutralCount = 0;
    let extremeCount = 0;

    for (const q of questions) {
      const dim = DIMENSIONS[q.dimension];
      if (!dim) {
        throw new Error(`未知的維度: ${q.dimension}`);
      }
      const val = answers && Object.prototype.hasOwnProperty.call(answers, q.id)
        ? Number(answers[q.id])
        : null;

      if (val === null || Number.isNaN(val) || !VALID_LIKERT_VALUES.has(val)) {
        throw new Error(`題目 ${q.id} 尚未作答或數值無效`);
      }

      answeredCount += 1;
      if (val === 0) neutralCount += 1;
      if (Math.abs(val) === 3) extremeCount += 1;

      const direction = q.pole === dim.poleA ? 1 : -1;
      const aligned = val * direction;
      stats[q.dimension].raw += aligned;
      stats[q.dimension].count += 1;
      stats[q.dimension].maxAbs += 3;
      stats[q.dimension].itemScores.push(aligned);
    }

    const computeConsistency = (scores) => {
      if (!scores || scores.length <= 1) return 100;
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      return Math.round(clamp((1 - stdDev / 3) * 100, 0, 100));
    };

    const getConsistencyLabel = (pct) => {
      if (pct >= 75) return '高度穩定一致';
      if (pct >= 55) return '中度情境彈性';
      return '跨情境變動明顯';
    };

    const dimensions = {};
    Object.keys(DIMENSIONS).forEach((dimKey) => {
      const meta = DIMENSIONS[dimKey];
      const s = stats[dimKey];
      if (s.maxAbs === 0) {
        throw new Error(`維度 ${dimKey} 沒有對應題目`);
      }
      const pctA = Math.round(((s.raw + s.maxAbs) / (2 * s.maxAbs)) * 100);
      const pctB = 100 - pctA;
      const isBalanced = s.raw === 0;
      const winner = s.raw >= 0 ? meta.poleA : meta.poleB;
      const winnerPct = winner === meta.poleA ? pctA : pctB;
      const consistency = computeConsistency(s.itemScores);

      dimensions[dimKey] = {
        key: dimKey,
        label: meta.label,
        poleA: meta.poleA,
        poleB: meta.poleB,
        nameA: meta.nameA,
        nameB: meta.nameB,
        raw: s.raw,
        maxAbs: s.maxAbs,
        pctA,
        pctB,
        winner,
        winnerPct,
        isBalanced,
        clarity: getClarityInfo(winnerPct),
        consistency,
        consistencyLabel: getConsistencyLabel(consistency)
      };
    });

    const coreKeys = ['EI', 'SN', 'TF', 'JP'];
    const differentiationIndex = Math.round(
      coreKeys.reduce((sum, k) => sum + ((dimensions[k].winnerPct - 50) / 50) * 100, 0) /
        coreKeys.length
    );
    const allDimKeys = Object.keys(DIMENSIONS);
    const overallConsistency = Math.round(
      allDimKeys.reduce((sum, k) => sum + dimensions[k].consistency, 0) / allDimKeys.length
    );

    const baseType =
      dimensions.EI.winner +
      dimensions.SN.winner +
      dimensions.TF.winner +
      dimensions.JP.winner;
    const identity = dimensions.AT.winner;
    const fullType = `${baseType}-${identity}`;

    const stackCodes =
      typeCatalog && typeCatalog[baseType] ? typeCatalog[baseType].functions : null;
    const cognitiveFunctions = computeCognitiveFunctions(dimensions, stackCodes);

    const neutralRate = Math.round((neutralCount / answeredCount) * 100);
    const extremeRate = Math.round((extremeCount / answeredCount) * 100);

    const facetScores = computeFacetScores(questions, answers, literatureData);

    return {
      baseType,
      identity,
      fullType,
      dimensions,
      cognitiveFunctions,
      facetScores,
      quality: {
        answeredCount,
        totalCount: questions.length,
        neutralCount,
        neutralRate,
        extremeCount,
        extremeRate,
        hasHighNeutrality: neutralRate >= 50,
        differentiationIndex,
        overallConsistency
      }
    };
  }

  /** Computes MBTI Step II 20-facet raw & percentage breakdown when literature mappings are supplied. */
  function computeFacetScores(questions, answers, literatureData) {
    if (!literatureData || !literatureData.QUESTION_FACET_MAP) {
      return {};
    }
    const facetMap = literatureData.QUESTION_FACET_MAP;
    const facetsList = Array.isArray(literatureData.STEP2_FACETS)
      ? literatureData.STEP2_FACETS
      : [];
    const facetMetaById = {};
    const acc = {};

    facetsList.forEach((f) => {
      facetMetaById[f.id] = f;
      acc[f.id] = { raw: 0, maxAbs: 0, count: 0 };
    });

    questions.forEach((q) => {
      const val = Number(answers && answers[q.id]);
      if (!VALID_LIKERT_VALUES.has(val)) return;
      const facetId = facetMap[q.id];
      const meta = DIMENSIONS[q.dimension];
      if (!facetId || !meta || !acc[facetId]) return;
      const direction = q.pole === meta.poleA ? 1 : -1;
      acc[facetId].raw += val * direction;
      acc[facetId].maxAbs += 3;
      acc[facetId].count += 1;
    });

    const out = {};
    Object.keys(acc).forEach((facetId) => {
      const fMeta = facetMetaById[facetId];
      const bucket = acc[facetId];
      if (bucket.count > 0 && bucket.maxAbs > 0) {
        const pctA = Math.round(((bucket.raw + bucket.maxAbs) / (2 * bucket.maxAbs)) * 100);
        const pctB = 100 - pctA;
        out[facetId] = {
          raw: bucket.raw,
          maxAbs: bucket.maxAbs,
          count: bucket.count,
          pctA,
          pctB,
          winner: pctA >= 50 ? fMeta.poleA : fMeta.poleB,
          winnerPct: Math.max(pctA, pctB)
        };
      } else {
        out[facetId] = {
          raw: 0,
          maxAbs: 0,
          count: 0,
          pctA: null,
          pctB: null,
          winner: null,
          winnerPct: null
        };
      }
    });
    return out;
  }

  return {
    DIMENSIONS,
    getQuestionsForMode,
    getClarityInfo,
    computeCognitiveFunctions,
    calculateMBTIResult
  };
}));
