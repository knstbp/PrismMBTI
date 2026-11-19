import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const questions = require('../src/data/questions.js');
const typeData = require('../src/data/types.js');
const extendedA = require('../src/data/extendedProfilesA.js');
const extendedB = require('../src/data/extendedProfilesB.js');
const extendedAll = { ...extendedA, ...extendedB };
const literature = require('../src/data/literatureModels.js');
const engine = require('../src/engine/scoring.js');
const advanced = require('../src/engine/advancedReport.js');
const reportImage = require('../src/engine/reportImage.js');

test('題庫結構與正反平衡檢查（60 題完整版 & 30 題快速版）', () => {
  assert.equal(questions.length, 60);

  const quickQuestions = engine.getQuestionsForMode(questions, 'quick');
  assert.equal(quickQuestions.length, 30);

  const dims = ['EI', 'SN', 'TF', 'JP', 'AT'];
  for (const dim of dims) {
    const dimFull = questions.filter((q) => q.dimension === dim);
    assert.equal(dimFull.length, 12, `${dim} 完整版應為 12 題`);

    const meta = engine.DIMENSIONS[dim];
    const fullA = dimFull.filter((q) => q.pole === meta.poleA).length;
    const fullB = dimFull.filter((q) => q.pole === meta.poleB).length;
    assert.equal(fullA, 6, `${dim} 完整版 poleA 應為 6 題`);
    assert.equal(fullB, 6, `${dim} 完整版 poleB 應為 6 題`);

    const dimQuick = quickQuestions.filter((q) => q.dimension === dim);
    assert.equal(dimQuick.length, 6, `${dim} 快速版應為 6 題`);
    const quickA = dimQuick.filter((q) => q.pole === meta.poleA).length;
    const quickB = dimQuick.filter((q) => q.pole === meta.poleB).length;
    assert.equal(quickA, 3, `${dim} 快速版 poleA 應為 3 題`);
    assert.equal(quickB, 3, `${dim} 快速版 poleB 應為 3 題`);
  }

  const ids = new Set(questions.map((q) => q.id));
  assert.equal(ids.size, 60, '所有題目 ID 不可重複');
});

test('16 型人格百科資料庫完整性驗證', () => {
  const expectedTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  for (const gKey of ['NT', 'NF', 'SJ', 'SP']) {
    const group = typeData.GROUPS[gKey];
    assert.ok(group.illustration, `群組 ${gKey} 缺少插畫路徑`);
    assert.ok(fs.existsSync(path.resolve(group.illustration)), `找不到群組插畫 ${group.illustration}`);
  }

  for (const code of expectedTypes) {
    const profile = typeData.TYPES[code];
    assert.ok(profile, `缺少類型 ${code}`);
    assert.equal(profile.code, code);
    assert.ok(typeData.GROUPS[profile.group], `${code} 氣質分類無效`);
    assert.ok(profile.illustration, `${code} 缺少插畫路徑`);
    assert.ok(fs.existsSync(path.resolve(profile.illustration)), `找不到類型插畫 ${profile.illustration}`);
    assert.equal(profile.functions.length, 4, `${code} 應有 4 個認知功能`);
    assert.ok(profile.keywords.length >= 4, `${code} 缺少關鍵字`);
    assert.ok(profile.thinkingStyle.length > 10, `${code} 缺少思維模式解析`);
    assert.ok(profile.strengths.length >= 4);
    assert.ok(profile.blindspots.length >= 4);
    assert.ok(profile.growth.length >= 3);
    assert.ok(profile.career.advantages && profile.career.pitfalls);
    assert.ok(profile.career.roles.length >= 4);
    assert.ok(profile.leadershipAndTeam.teamRole && profile.leadershipAndTeam.leadershipStyle);
    assert.ok(profile.relationships.loveStyle && profile.relationships.friendshipStyle && profile.relationships.conflictTips);
    assert.ok(profile.stressAndRecovery.triggers && profile.stressAndRecovery.gripSigns && profile.stressAndRecovery.rechargeWays);
    assert.ok(profile.learningAndHabits.learningStyle && profile.learningAndHabits.dailyHabit);
  }
});

test('計分引擎：極端作答應精準產出目標型態 (例如 INFJ-T 與 ESTP-A)', () => {
  const buildAnswersForTarget = (targetFullType) => {
    const [base, identity] = targetFullType.split('-');
    const desired = {
      EI: base[0],
      SN: base[1],
      TF: base[2],
      JP: base[3],
      AT: identity
    };
    const answers = {};
    for (const q of questions) {
      answers[q.id] = q.pole === desired[q.dimension] ? 3 : -3;
    }
    return answers;
  };

  const infjRes = engine.calculateMBTIResult(
    questions,
    buildAnswersForTarget('INFJ-T'),
    typeData.TYPES
  );
  assert.equal(infjRes.fullType, 'INFJ-T');
  assert.equal(infjRes.dimensions.EI.pctB, 100);
  assert.equal(infjRes.dimensions.SN.pctB, 100);
  assert.equal(infjRes.dimensions.TF.pctB, 100);
  assert.equal(infjRes.dimensions.JP.pctA, 100);
  assert.equal(infjRes.dimensions.AT.pctB, 100);
  assert.equal(infjRes.quality.neutralRate, 0);
  assert.equal(infjRes.quality.extremeRate, 100);

  const estpRes = engine.calculateMBTIResult(
    questions,
    buildAnswersForTarget('ESTP-A'),
    typeData.TYPES
  );
  assert.equal(estpRes.fullType, 'ESTP-A');
  assert.equal(estpRes.dimensions.EI.pctA, 100);
  assert.equal(estpRes.dimensions.SN.pctA, 100);
  assert.equal(estpRes.dimensions.TF.pctA, 100);
  assert.equal(estpRes.dimensions.JP.pctB, 100);
  assert.equal(estpRes.dimensions.AT.pctA, 100);
});

test('計分引擎：全部選擇中立時應回傳 50/50 均衡與高中立率警告', () => {
  const quickQuestions = engine.getQuestionsForMode(questions, 'quick');
  const neutralAnswers = {};
  for (const q of quickQuestions) {
    neutralAnswers[q.id] = 0;
  }

  const res = engine.calculateMBTIResult(quickQuestions, neutralAnswers, typeData.TYPES);
  for (const dimKey of Object.keys(res.dimensions)) {
    const dim = res.dimensions[dimKey];
    assert.equal(dim.pctA, 50);
    assert.equal(dim.pctB, 50);
    assert.equal(dim.isBalanced, true);
    assert.equal(dim.clarity.level, 'slight');
  }
  assert.equal(res.quality.hasHighNeutrality, true);
  assert.equal(res.quality.neutralRate, 100);
});

test('計分引擎：缺漏作答時應拋出明確錯誤', () => {
  const quickQuestions = engine.getQuestionsForMode(questions, 'quick');
  const partialAnswers = {};
  quickQuestions.slice(0, 29).forEach((q) => {
    partialAnswers[q.id] = 1;
  });

  assert.throws(() => {
    engine.calculateMBTIResult(quickQuestions, partialAnswers, typeData.TYPES);
  }, /尚未作答/);
});

test('報告圖片檔名產生器：應產出包含型態代碼與 .jpg 副檔名之標準檔名', () => {
  const name = reportImage.buildExportFilename({
    fullType: 'INFJ-T',
    createdAt: '2026-11-18T11:20:00+08:00'
  });
  assert.match(name, /^PrismMBTI_INFJ-T_\d{8}_\d{4}\.jpg$/);
});

test('16 型進階領域擴充資料庫（職業／成長／人際 6+8 項）完整性檢查', () => {
  const expectedTypes = Object.keys(typeData.TYPES);
  assert.equal(expectedTypes.length, 16);

  for (const code of expectedTypes) {
    const ext = extendedAll[code];
    assert.ok(ext, `缺少 ${code} 進階領域資料`);
    assert.equal(ext.career.strengths6.length, 6, `${code} career strengths6 應為 6 項`);
    assert.equal(ext.career.weaknesses6.length, 6, `${code} career weaknesses6 應為 6 項`);
    assert.equal(ext.career.workStyles6.length, 6, `${code} career workStyles6 應為 6 項`);
    assert.equal(ext.career.recommendedRoles8.length, 8, `${code} career recommendedRoles8 應為 8 項`);
    assert.equal(ext.growth.strengths6.length, 6, `${code} growth strengths6 應為 6 項`);
    assert.equal(ext.growth.weaknesses6.length, 6, `${code} growth weaknesses6 應為 6 項`);
    assert.equal(ext.growth.energizers6.length, 6, `${code} growth energizers6 應為 6 項`);
    assert.equal(ext.growth.drainers6.length, 6, `${code} growth drainers6 應為 6 項`);
    assert.equal(ext.relationships.strengths6.length, 6, `${code} relationships strengths6 應為 6 項`);
    assert.equal(ext.relationships.weaknesses6.length, 6, `${code} relationships weaknesses6 應為 6 項`);
    assert.equal(ext.relationships.superpowers6.length, 6, `${code} relationships superpowers6 應為 6 項`);
    assert.equal(ext.relationships.risks6.length, 6, `${code} relationships risks6 應為 6 項`);
  }
});

test('進階分析引擎：類型分化度、作答一致度、12 領域儀表與歷史對比', () => {
  const quickQuestions = engine.getQuestionsForMode(questions, 'quick');
  const answers = {};
  for (const q of quickQuestions) {
    if (q.dimension === 'JP') {
      answers[q.id] = 0; // force balanced 50/50 J/P borderline
    } else if (q.dimension === 'EI') {
      answers[q.id] = q.pole === 'I' ? 2 : -2;
    } else if (q.dimension === 'SN') {
      answers[q.id] = q.pole === 'N' ? 3 : -3;
    } else if (q.dimension === 'TF') {
      answers[q.id] = q.pole === 'F' ? 2 : -2;
    } else {
      answers[q.id] = q.pole === 'T' ? 2 : -2;
    }
  }

  const cur = engine.calculateMBTIResult(quickQuestions, answers, typeData.TYPES);
  assert.ok(cur.quality.differentiationIndex >= 0 && cur.quality.differentiationIndex <= 100);
  assert.equal(cur.quality.overallConsistency, 100);

  const prev = {
    fullType: 'INFP-T',
    createdAt: '2026-11-17T10:00:00+08:00',
    dimensions: {
      ...cur.dimensions,
      JP: { ...cur.dimensions.JP, pctA: 30, pctB: 70, winner: 'P', winnerPct: 70 }
    }
  };

  const adv = advanced.buildAdvancedAnalysis(
    { ...cur, createdAt: '2026-11-18T11:30:00+08:00' },
    typeData,
    prev
  );

  assert.ok(adv.executiveSummary.includes(cur.fullType));
  assert.ok(adv.psychometrics.borderlineAxes.some((b) => b.key === 'JP'));
  assert.ok(adv.psychometrics.neighborTypes.length >= 1);
  assert.equal(adv.domainSubTraits.career.length, 4);
  assert.equal(adv.domainSubTraits.growth.length, 4);
  assert.equal(adv.domainSubTraits.relationships.length, 4);
  assert.equal(adv.actionRoadmap.length, 3);
  assert.equal(adv.historyDelta.typeChanged, true);
  assert.equal(adv.historyDelta.prevType, 'INFP-T');
});

test('國際文獻資料庫驗證：Step II 20 面向、Beebe 8 功能原型翻轉、Loop 與 Quenk Grip', () => {
  assert.equal(literature.STEP2_FACETS.length, 20);
  const facetById = Object.fromEntries(literature.STEP2_FACETS.map((f) => [f.id, f]));

  const coreQuestions = questions.filter((q) => ['EI', 'SN', 'TF', 'JP'].includes(q.dimension));
  assert.equal(coreQuestions.length, 48);
  for (const q of coreQuestions) {
    const fId = literature.QUESTION_FACET_MAP[q.id];
    assert.ok(fId, `題目 ${q.id} 缺少 Step II 面向映射`);
    assert.ok(facetById[fId], `題目 ${q.id} 指向無效面向 ${fId}`);
    assert.equal(facetById[fId].dim, q.dimension, `題目 ${q.id} 與面向 ${fId} 向度不符`);
  }

  for (const dimKey of ['EI', 'SN', 'TF', 'JP']) {
    const dimFacets = literature.STEP2_FACETS.filter((f) => f.dim === dimKey);
    assert.equal(dimFacets.length, 5, `${dimKey} 應有 5 個 Step II 面向`);
  }

  assert.equal(literature.BEEBE_POSITIONS.length, 8);
  assert.ok(literature.LITERATURE_REFERENCES.length >= 4);

  const flipAttitude = (fn) => `${fn[0]}${fn[1] === 'i' ? 'e' : 'i'}`;
  for (const code of Object.keys(typeData.TYPES)) {
    const lit = literature.TYPE_LITERATURE[code];
    const profile = typeData.TYPES[code];
    assert.ok(lit, `缺少 ${code} 國際文獻深度模型`);
    assert.ok(literature.INTERACTION_STYLES[lit.interactionStyle], `${code} 互動風格無效`);
    assert.ok(literature.KEIRSEY_TEMPERAMENTS[profile.group], `${code} 氣質分類無效`);
    assert.equal(lit.beebe8.length, 8, `${code} 應有 8 個 Beebe 原型功能`);
    assert.deepEqual(lit.beebe8.slice(0, 4), profile.functions, `${code} 前 4 個功能應與主堆疊一致`);
    assert.deepEqual(
      lit.beebe8.slice(4, 8),
      profile.functions.map(flipAttitude),
      `${code} 第 5–8 陰影功能應精準對應前 4 功能內外傾翻轉`
    );
    assert.ok(lit.shadowInsights.opposing5 && lit.shadowInsights.critical6 && lit.shadowInsights.trickster7 && lit.shadowInsights.demon8);
    assert.ok(lit.cognitiveLoop.name && lit.cognitiveLoop.mechanism && lit.cognitiveLoop.warningSigns && lit.cognitiveLoop.exitStrategy);
    assert.ok(lit.quenkGrip.trigger && lit.quenkGrip.behavior && lit.quenkGrip.recoveryBridge);
  }
});

test('Step II 跨向度混合特質 (Out-of-Preference) 計分與快速版推估相容性', () => {
  // 構造 INTJ 整體偏向，但刻意在 EI 的 active_reflective (EI_04, EI_07) 作答極端 E（跨向度）
  const answers = {};
  for (const q of questions) {
    if (q.id === 'EI_04' || q.id === 'EI_07') {
      answers[q.id] = q.pole === 'E' ? 3 : -3;
    } else if (q.dimension === 'EI') {
      answers[q.id] = q.pole === 'I' ? 3 : -3;
    } else if (q.dimension === 'SN') {
      answers[q.id] = q.pole === 'N' ? 3 : -3;
    } else if (q.dimension === 'TF') {
      answers[q.id] = q.pole === 'T' ? 3 : -3;
    } else if (q.dimension === 'JP') {
      answers[q.id] = q.pole === 'J' ? 3 : -3;
    } else {
      answers[q.id] = q.pole === 'A' ? 3 : -3;
    }
  }

  const fullRes = engine.calculateMBTIResult(questions, answers, typeData.TYPES, literature);
  assert.equal(fullRes.fullType, 'INTJ-A');
  assert.equal(Object.keys(fullRes.facetScores).length, 20);
  assert.equal(fullRes.facetScores.active_reflective.winner, 'E');
  assert.equal(fullRes.facetScores.active_reflective.pctA, 100);

  const advFull = advanced.buildAdvancedAnalysis(
    { ...fullRes, createdAt: '2026-11-18T12:00:00+08:00' },
    typeData,
    null,
    literature
  );
  assert.ok(advFull.literatureProfile);
  assert.equal(advFull.literatureProfile.beebeStack.length, 8);
  assert.equal(advFull.step2Facets.groups.length, 4);
  const eiGroup = advFull.step2Facets.groups.find((g) => g.dimKey === 'EI');
  const activeFacet = eiGroup.facets.find((f) => f.id === 'active_reflective');
  assert.equal(activeFacet.winner, 'E');
  assert.equal(activeFacet.isOutOfPreference, true);
  assert.ok(advFull.step2Facets.outOfPreferenceCount >= 1);

  // 快速版 30 題跳過未涵蓋之面向（如 scheduled_spontaneous），應以主軸平順推估 isEstimated: true
  const quickQuestions = engine.getQuestionsForMode(questions, 'quick');
  const quickRes = engine.calculateMBTIResult(quickQuestions, answers, typeData.TYPES, literature);
  const advQuick = advanced.buildAdvancedAnalysis(
    { ...quickRes, createdAt: '2026-11-18T12:00:00+08:00' },
    typeData,
    null,
    literature
  );
  const jpGroup = advQuick.step2Facets.groups.find((g) => g.dimKey === 'JP');
  const scheduledFacet = jpGroup.facets.find((f) => f.id === 'scheduled_spontaneous');
  assert.equal(scheduledFacet.isEstimated, true);
  assert.equal(scheduledFacet.winner, 'J');
});

test('跨平台單檔版 HTML (PC+手機) 輸出驗證：完整內嵌 CSS/JS/插畫且無外部依賴路徑', () => {
  const htmlPath = path.resolve('dist/PrismMBTI.html');
  assert.ok(fs.existsSync(htmlPath), '應存在 dist/PrismMBTI.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');
  assert.ok(!/<script[^>]+src=/i.test(html), '單檔版不應殘留外部 <script src=...>');
  assert.ok(!/<link[^>]+rel=["']stylesheet["']/i.test(html), '單檔版不應殘留外部 stylesheet 連結');
  assert.ok(!/src=["']assets\//i.test(html), '單檔版不應殘留未內嵌的 assets/ 圖片路徑');
  assert.ok(html.includes('data:image/jpeg;base64,'), '應內嵌首頁 Hero JPG base64 圖片');
  assert.ok(html.includes('data:image/svg+xml;base64,'), '應內嵌 16 型人格 SVG 插畫');
  assert.ok(html.includes('openJpgExportSheet'), '應包含手機 JPG 預覽分享與下載流程');
});
