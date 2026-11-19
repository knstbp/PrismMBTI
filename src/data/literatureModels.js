(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MBTI_DATA = root.MBTI_DATA || {};
    root.MBTI_DATA.literature = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /**
   * 基於國際心理學與類型學經典文獻之進階架構資料：
   * 1. Myers-Briggs Step II (Form Q) 20 Facets (Quenk, Hammer & Majors, 2001)
   * 2. John Beebe 8-Function Archetypal Model (Beebe, 2016)
   * 3. Naomi Quenk "In the Grip" Inferior Function Stress Dynamics (Quenk, 2002)
   * 4. Linda V. Berens Interaction Styles & David Keirsey Four Temperaments
   */

  const STEP2_FACETS = [
    // E-I 5 facets
    { id: 'initiating_receiving', dim: 'EI', poleA: 'E', poleB: 'I', nameA: '主動破冰 (Initiating)', nameB: '沉靜接納 (Receiving)', desc: '在社交場合中習慣主動開啟對話，還是等待他人開啟連結。' },
    { id: 'expressive_contained', dim: 'EI', poleA: 'E', poleB: 'I', nameA: '外顯表達 (Expressive)', nameB: '內斂含蓄 (Contained)', desc: '情緒與想法傾向直接表露於外，或先保留於內心深處。' },
    { id: 'gregarious_intimate', dim: 'EI', poleA: 'E', poleB: 'I', nameA: '廣結社群 (Gregarious)', nameB: '深度小圈 (Intimate)', desc: '偏好擁有多樣廣泛的交友圈，或專注於少數知心深交。' },
    { id: 'active_reflective', dim: 'EI', poleA: 'E', poleB: 'I', nameA: '邊動邊想 (Active)', nameB: '深思後行 (Reflective)', desc: '習慣透過討論與現場互動釐清想法，或先獨自整理周全再發言。' },
    { id: 'enthusiastic_quiet', dim: 'EI', poleA: 'E', poleB: 'I', nameA: '熱情充電 (Enthusiastic)', nameB: '靜謐充電 (Quiet)', desc: '從熱鬧群聚獲得能量振奮，或透過獨處安靜恢復精神。' },
    // S-N 5 facets
    { id: 'concrete_abstract', dim: 'SN', poleA: 'S', poleB: 'N', nameA: '具體實證 (Concrete)', nameB: '抽象概念 (Abstract)', desc: '優先信賴可感測的具體數據細節，或關注隱含意義與抽象模式。' },
    { id: 'realistic_imaginative', dim: 'SN', poleA: 'S', poleB: 'N', nameA: '寫實經驗 (Realistic)', nameB: '想像願景 (Imaginative)', desc: '聚焦當下既有事實與過往經驗，或熱衷推演未來各種可能性。' },
    { id: 'practical_conceptual', dim: 'SN', poleA: 'S', poleB: 'N', nameA: '實用操作 (Practical)', nameB: '理論構想 (Conceptual)', desc: '重視立即派上用場的操作步驟，或追求背後的整體原理與架構。' },
    { id: 'experiential_theoretical', dim: 'SN', poleA: 'S', poleB: 'N', nameA: '直白體驗 (Experiential)', nameB: '系統推演 (Theoretical)', desc: '偏好從親身經驗直接歸納，或先建立概念模型再往下驗證。' },
    { id: 'traditional_original', dim: 'SN', poleA: 'S', poleB: 'N', nameA: '循序傳承 (Traditional)', nameB: '原創顛覆 (Original)', desc: '尊重並沿用驗證過的成熟方法，或渴望打破常規創造全新做法。' },
    // T-F 5 facets
    { id: 'logical_empathetic', dim: 'TF', poleA: 'T', poleB: 'F', nameA: '邏輯因果 (Logical)', nameB: '同理體察 (Empathetic)', desc: '決策時以客觀因果與利弊權重為首，或優先體察當事人感受。' },
    { id: 'reasonable_compassionate', dim: 'TF', poleA: 'T', poleB: 'F', nameA: '制度一致 (Reasonable)', nameB: '仁慈破例 (Compassionate)', desc: '強調規則對所有人的公平一致，或依個別處境給予體恤彈性。' },
    { id: 'questioning_accommodating', dim: 'TF', poleA: 'T', poleB: 'F', nameA: '思辨質疑 (Questioning)', nameB: '包容調和 (Accommodating)', desc: '重視論據是否站得住腳，或優先維持群體尊嚴與關係和諧。' },
    { id: 'critical_accepting', dim: 'TF', poleA: 'T', poleB: 'F', nameA: '能力檢視 (Critical)', nameB: '接納肯定 (Accepting)', desc: '看重客觀專業可靠性與漏洞修正，或看重善意動機與正面肯定。' },
    { id: 'tough_tender', dim: 'TF', poleA: 'T', poleB: 'F', nameA: '直指核心 (Tough)', nameB: '溫柔撫慰 (Tender)', desc: '面對問題直接剖析解方，或先安撫情緒照顧對方心情。' },
    // J-P 5 facets
    { id: 'systematic_casual', dim: 'JP', poleA: 'J', poleB: 'P', nameA: '系統條理 (Systematic)', nameB: '隨興自在 (Casual)', desc: '依賴外在空間與清單秩序建立清晰感，或在寬鬆彈性中運作最佳。' },
    { id: 'planful_open', dim: 'JP', poleA: 'J', poleB: 'P', nameA: '預先規劃 (Planful)', nameB: '開放選項 (Open-Ended)', desc: '傾向提早拍板並照表推進，或保留多個選項隨時捕捉新機會。' },
    { id: 'early_pressure', dim: 'JP', poleA: 'J', poleB: 'P', nameA: '提早啟動 (Early Starting)', nameB: '期限衝刺 (Pressure-Prompted)', desc: '習慣預留緩衝提早完工，或在死線臨近時爆發最高專注力。' },
    { id: 'scheduled_spontaneous', dim: 'JP', poleA: 'J', poleB: 'P', nameA: '排程穩定 (Scheduled)', nameB: '即興應變 (Spontaneous)', desc: '喜歡照既定安排掌握節奏，或享受臨時起意的變化與驚喜。' },
    { id: 'methodical_emergent', dim: 'JP', poleA: 'J', poleB: 'P', nameA: '收斂結案 (Methodical)', nameB: '多線湧現 (Emergent)', desc: '喜歡逐步收斂完成單一清單，或同時開啟多條興趣線自由切換。' }
  ];

  const QUESTION_FACET_MAP = {
    EI_01: 'enthusiastic_quiet', EI_02: 'enthusiastic_quiet', EI_12: 'enthusiastic_quiet',
    EI_03: 'initiating_receiving', EI_09: 'initiating_receiving',
    EI_04: 'active_reflective', EI_07: 'active_reflective',
    EI_05: 'gregarious_intimate', EI_06: 'gregarious_intimate', EI_10: 'gregarious_intimate',
    EI_08: 'expressive_contained', EI_11: 'expressive_contained',

    SN_01: 'concrete_abstract', SN_05: 'concrete_abstract', SN_11: 'concrete_abstract',
    SN_02: 'realistic_imaginative', SN_07: 'realistic_imaginative', SN_10: 'realistic_imaginative',
    SN_03: 'practical_conceptual', SN_09: 'practical_conceptual',
    SN_04: 'experiential_theoretical', SN_12: 'experiential_theoretical',
    SN_06: 'traditional_original', SN_08: 'traditional_original',

    TF_01: 'logical_empathetic', TF_04: 'logical_empathetic',
    TF_02: 'reasonable_compassionate', TF_05: 'reasonable_compassionate',
    TF_03: 'tough_tender', TF_09: 'tough_tender',
    TF_06: 'questioning_accommodating', TF_07: 'questioning_accommodating', TF_12: 'questioning_accommodating',
    TF_08: 'critical_accepting', TF_10: 'critical_accepting', TF_11: 'critical_accepting',

    JP_01: 'systematic_casual', JP_04: 'systematic_casual', JP_07: 'systematic_casual',
    JP_02: 'planful_open', JP_05: 'planful_open', JP_10: 'planful_open',
    JP_03: 'early_pressure', JP_08: 'early_pressure',
    JP_09: 'scheduled_spontaneous', JP_11: 'scheduled_spontaneous', JP_12: 'scheduled_spontaneous',
    JP_06: 'methodical_emergent'
  };

  const INTERACTION_STYLES = {
    in_charge: {
      key: 'in_charge',
      name: '掌控推進型 (In-Charge)',
      dimensions: '主導溝通 (Directing) × 主動發起 (Initiating) × 結果導向 (Outcome)',
      summary: '習慣在混亂中迅速站出來建立架構、直接說明期望並推動達成結果。溝通簡潔有力量，重視效率與明確問責。'
    },
    chart_the_course: {
      key: 'chart_the_course',
      name: '藍圖領航型 (Chart-the-Course)',
      dimensions: '主導溝通 (Directing) × 回應觀察 (Responding) × 進程導向 (Progression)',
      summary: '進入行動前習慣先看清路線圖與關鍵里程碑，說話直指重點但不愛搶奪舞台，重視事情照正確軌道穩健前行。'
    },
    get_things_going: {
      key: 'get_things_going',
      name: '催化號召型 (Get-Things-Going)',
      dimensions: '引導資訊 (Informing) × 主動發起 (Initiating) × 進程導向 (Progression)',
      summary: '用熱情、提問與故事把人捲入參與之中，擅長營造高參與度與共識動能，讓原本沉悶的任務快速熱絡起來。'
    },
    behind_the_scenes: {
      key: 'behind_the_scenes',
      name: '幕後協調型 (Behind-the-Scenes)',
      dimensions: '引導資訊 (Informing) × 回應觀察 (Responding) × 結果導向 (Outcome)',
      summary: '採取沉穩傾聽與先收集多元背景資訊的姿態，在幕後細心整合品質、意義與和諧，只為產出最經得起考驗的成果。'
    }
  };

  const KEIRSEY_TEMPERAMENTS = {
    NT: {
      name: '理性策略家 (Rational)',
      coreNeed: '精熟專業能力、知識自主權與系統合理性',
      coreFear: '顯得無能、受制於缺乏邏輯的愚蠢規則',
      leadershipArchetype: '策略設計師 — 用長期洞察與能力標準引領變革'
    },
    NF: {
      name: '理想外交家 (Idealist)',
      coreNeed: '追尋生命意義、真誠自我與深度人際共鳴',
      coreFear: '虛偽迎合、失去真實自我或傷害深層價值',
      leadershipArchetype: '願景催化師 — 透過啟發潛能與共同價值凝聚人心'
    },
    SJ: {
      name: '秩序守護者 (Guardian)',
      coreNeed: '歸屬安全感、盡責守信與穩固秩序傳承',
      coreFear: '混亂失控、失信於人或破壞應有責任倫理',
      leadershipArchetype: '穩定基石 — 透過明確制度、準備周全與可靠執行護航'
    },
    SP: {
      name: '自由探險家 (Artisan)',
      coreNeed: '當下行動自由、即時影響力與感官工藝精準',
      coreFear: '被死板規則囚禁、失去選擇彈性與現場刺激感',
      leadershipArchetype: '實戰談判家 — 在高變化現場迅速應變並抓住黃金機會'
    }
  };

  const BEEBE_POSITIONS = [
    { pos: 1, role: '英雄原型 (Hero)', sphere: '自我意識', desc: '最自然熟練的心理主場，賦予你自信與核心解決力。' },
    { pos: 2, role: '父母原型 (Parent)', sphere: '自我意識', desc: '成熟負責的輔助力量，用來引導自己與支持他人成長。' },
    { pos: 3, role: '永恆少年 (Eternal Child)', sphere: '自我意識', desc: '帶著好奇、玩心與靈感，但過度依賴時易顯幼稚防衛。' },
    { pos: 4, role: '靈魂劣勢 (Anima/Animus)', sphere: '意識門檻', desc: '既是渴望成長的靈感來源，也是高壓時被劫持的脆弱點。' },
    { pos: 5, role: '對立人格 (Opposing)', sphere: '陰影原型', desc: '當主導功能受質疑時，出現固執反駁、防禦或暗中抗拒。' },
    { pos: 6, role: '批判父母 (Critical Parent)', sphere: '陰影原型', desc: '內在最嚴厲的審判官，常苛責自己或無情挑剔他人錯誤。' },
    { pos: 7, role: '詭計盲點 (Trickster)', sphere: '陰影原型', desc: '最容易失足的盲區，壓力下易陷入「怎麼做都錯」的雙輸困局。' },
    { pos: 8, role: '魔鬼轉化 (Demon/Daimon)', sphere: '陰影原型', desc: '最深層無意識能量；失控時最具破壞力，整合後則是蛻變泉源。' }
  ];

  const TYPE_LITERATURE = {
    INTJ: {
      interactionStyle: 'chart_the_course',
      beebe8: ['Ni', 'Te', 'Fi', 'Se', 'Ne', 'Ti', 'Fe', 'Si'],
      shadowInsights: {
        opposing5: 'Ne 對立：當長遠藍圖（Ni）被他人打斷時，可能固執反駁所有替代點子，或懷疑他人只想製造混亂。',
        critical6: 'Ti 批判父母：在腦中無情拆解自己或他人論點的微細邏輯破綻，甚至苛責自己「怎麼犯這麼蠢的推論錯」。',
        trickster7: 'Fe 詭計盲點：常低估群體社交潛規則與人情溫度，無意間因太過就事論事陷入人際孤立困局。',
        demon8: 'Si 魔鬼轉化：極度挫折時沉溺於懊悔過去細節；但若接納過去經驗實證，能讓策略藍圖變得無懈可擊。'
      },
      cognitiveLoop: {
        name: 'Ni–Fi 內傾封閉迴圈',
        mechanism: '跳過客觀驗證的 Te，只在內在遠景（Ni）與主觀價值好惡（Fi）間反覆推演。',
        warningSigns: '對外部現實越來越抽離冷漠，認定「沒人夠格聽懂我的藍圖」，並將所有反對視為對個人原則的冒犯。',
        exitStrategy: '主動喚醒輔助 Te：寫下一個可被外部事實檢驗的小實驗、列出現實資源清單並找一位務實夥伴討論可行性。'
      },
      quenkGrip: {
        trigger: '長期處於感官混亂噪音、過度密集社交應酬或重大藍圖徹底失控。',
        behavior: '劣勢 Se 劫持：平時極度克制深謀的你，可能突然衝動暴食購物、過度執著微小物理瑕疵，或對噪音光線大發脾氣。',
        recoveryBridge: '先離開過度刺激環境，透過散步或運動安撫身體感官，再用 Te 寫下 3 件此刻能掌控的小步驟。'
      }
    },
    INTP: {
      interactionStyle: 'behind_the_scenes',
      beebe8: ['Ti', 'Ne', 'Si', 'Fe', 'Te', 'Ni', 'Se', 'Fi'],
      shadowInsights: {
        opposing5: 'Te 對立：被強迫接受「別管原理、照做就行」的效率指令時，容易陷入被動消極抗拒或挑剔制度漏洞。',
        critical6: 'Ni 批判父母：突然苛責自己缺乏長遠野心與人生方向，或用悲觀宿命論批判別人的遠大願景太天真。',
        trickster7: 'Se 詭計盲點：常忽略眼下物理空間細節、儀表或現場立即行動契機，直到東西撞倒或期限到了才驚覺。',
        demon8: 'Fi 魔鬼轉化：崩潰時可能感覺一切邏輯毫無意義並陷入道德虛無；整合後則能把純粹理性與真摯個人信念合而為一。'
      },
      cognitiveLoop: {
        name: 'Ti–Si 封閉驗證迴圈',
        mechanism: '跳過發散探索的 Ne，只困在內在邏輯（Ti）與過往負面記憶（Si）之間反覆反芻。',
        warningSigns: '不敢嘗試新可能，不斷用過去失敗的細節佐證「做什麼都不會成功」，整天陷入極度消極的自我分析。',
        exitStrategy: '主動喚醒輔助 Ne：接觸一個完全陌生領域的新知、找聰明朋友腦力激盪或允許自己做一件毫無包袱的有趣實驗。'
      },
      quenkGrip: {
        trigger: '被迫長時間處於高張力情緒衝突、或覺得自己的智力與善意遭到全面否定。',
        behavior: '劣勢 Fe 劫持：平常冷靜獨立的你，可能突然情緒失控爆發、極度敏感別人的微表情並覺得「全世界都不喜歡我」。',
        recoveryBridge: '先暫停處理人際對錯，找一個安靜空間把焦慮寫成客觀條目，再用 Ne 看見其他良性解釋。'
      }
    },
    ENTJ: {
      interactionStyle: 'in_charge',
      beebe8: ['Te', 'Ni', 'Se', 'Fi', 'Ti', 'Ne', 'Si', 'Fe'],
      shadowInsights: {
        opposing5: 'Ti 對立：遇到別人執著於理論純度而拖慢進度時，會強烈反感並直接否定對方「只會紙上談兵」。',
        critical6: 'Ne 批判父母：對毫無收斂的發散點子顯得極不耐煩，或嘲諷自己／他人「想這麼多沒用的替代方案幹嘛」。',
        trickster7: 'Si 詭計盲點：極易忘記過去身體疲勞警告與瑣碎日常細節，在細節維護與長期養生上反覆吃暗虧。',
        demon8: 'Fe 魔鬼轉化：極限壓力下可能感到對群體徹底疏離或憤怒批判他人虛偽；整合後能成就真正有溫度的領袖魅力。'
      },
      cognitiveLoop: {
        name: 'Te–Se 急躁衝刺迴圈',
        mechanism: '跳過深遠洞察的 Ni，只在外在效率成果（Te）與即時感官刺激（Se）之間高速空轉。',
        warningSigns: '變成只看短期數字與權力掌控的工作狂，不斷開新戰場搶勝果，卻失去了「這一切長期到底為了什麼」的方向感。',
        exitStrategy: '主動喚醒輔助 Ni：停下腳步留出半天獨處空白，重問自己 3 年後真正想留下的核心意義是什麼。'
      },
      quenkGrip: {
        trigger: '核心事業或團隊失控、長期過勞且感覺所有付出都被身邊人視為冷酷或不被感激。',
        behavior: '劣勢 Fi 劫持：向來強硬果斷的你，可能突然陷入極度孤立自憐、對一句小評價反應劇烈或深夜獨自落淚心寒。',
        recoveryBridge: '允許自己卸下指揮官盔甲休息，向最信任的一位朋友坦誠說出壓力，並用 Ni 重新對焦真正看重的價值。'
      }
    },
    ENTP: {
      interactionStyle: 'get_things_going',
      beebe8: ['Ne', 'Ti', 'Fe', 'Si', 'Ni', 'Te', 'Fi', 'Se'],
      shadowInsights: {
        opposing5: 'Ni 對立：當別人試圖用單一固定結論限制你的選項時，你會本能唱反調找出十個例外推翻他。',
        critical6: 'Te 批判父母：內心偶爾嚴厲批判自己「只會講點子卻沒實際成果／沒系統效率」，或苛責夥伴執行太慢。',
        trickster7: 'Fi 詭計盲點：常在辯論中沒意識到自己究竟真正相信什麼價值，或忽略這句話會踩到別人內心痛處。',
        demon8: 'Se 魔鬼轉化：長期失控時可能過度放縱感官刺激或魯莽冒險；整合後能把絕妙靈感紮實轉為驚豔現場行動。'
      },
      cognitiveLoop: {
        name: 'Ne–Fe 討好散漫迴圈',
        mechanism: '跳過冷靜檢驗的 Ti，只在討好現場氣氛（Fe）與不斷拋出新點子（Ne）之間討拍打轉。',
        warningSigns: '為了維持在團體裡的聰明有趣形象而過度承諾迎合，做了一堆博眼球卻邏輯鬆散、連自己都不相信的專案。',
        exitStrategy: '主動喚醒輔助 Ti：獨自安靜下來用冷靜的邏輯篩選表砍掉 70% 雜訊，只留下真正邏輯嚴謹且有價值的核心。'
      },
      quenkGrip: {
        trigger: '長期被困在枯燥重複細節裡無法脫身，或所有創意出口都被死板規定封鎖。',
        behavior: '劣勢 Si 劫持：平時灑脫樂觀的你，可能突然過度執著身體微恙（懷疑自己生重病）、懊悔過去小失誤或變得異常固執悲觀。',
        recoveryBridge: '補充足夠睡眠與規律飲食安頓身體，再用 Ti 理智分辨「想像出的災難」與「眼前真實事實」。'
      }
    },
    INFJ: {
      interactionStyle: 'chart_the_course',
      beebe8: ['Ni', 'Fe', 'Ti', 'Se', 'Ne', 'Fi', 'Te', 'Si'],
      shadowInsights: {
        opposing5: 'Ne 對立：當團隊不斷拋出沒有核心意義的零散點子時，內心會默默產生強烈質疑與抽離抗拒。',
        critical6: 'Fi 批判父母：用極高的道德純潔標準嚴厲審判自己「不夠真誠、不夠善良」，陷入隱性的自我愧疚感。',
        trickster7: 'Te 詭計盲點：面對冷酷的市場定價、商業指標或行政流程常感到頭暈無力，容易在資源分配上吃虧。',
        demon8: 'Si 魔鬼轉化：極度失望時可能陷入對過往創傷細節的冰冷翻舊帳；整合後能把遠見穩固地傳承為長久制度。'
      },
      cognitiveLoop: {
        name: 'Ni–Ti 孤島推演迴圈',
        mechanism: '跳過與人連結的 Fe，只困在內部洞察（Ni）與冷冰冰自我分析（Ti）的象牙塔裡。',
        warningSigns: '對人性徹底失望、過度批判身邊所有人的動機不純，把自己鎖進絕對正確卻無人能理解的孤立高塔。',
        exitStrategy: '主動喚醒輔助 Fe：找一位安全可信的摯友聊出真實感受，或去做一件微小卻具體幫助他人的溫暖行動。'
      },
      quenkGrip: {
        trigger: '長期無邊界地吸收他人負面情緒、價值觀被迫妥協且徹底缺乏獨處恢復空間。',
        behavior: '劣勢 Se 劫持：平時優雅克制的你，可能突然暴飲暴食、過度刷手機成癮、對環境噪音極度暴躁或完全麻木放縱。',
        recoveryBridge: '立刻退出高刺激社交場域，透過散步自然、熱水澡安撫感官，並用 Fe 向信任的人表達自己需要休息。'
      }
    },
    INFP: {
      interactionStyle: 'behind_the_scenes',
      beebe8: ['Fi', 'Ne', 'Si', 'Te', 'Fe', 'Ni', 'Se', 'Ti'],
      shadowInsights: {
        opposing5: 'Fe 對立：被迫配合虛偽的群體表面和諧或違心客套時，內心會立刻升起強烈的反感與疏離牆。',
        critical6: 'Ni 批判父母：突然用悲觀的單一預言審判自己「我這輩子註定做不出任何像樣作品／沒人真正懂我」。',
        trickster7: 'Se 詭計盲點：常低估現實物質條件、身體反應或當下衝突節奏，活在美感與想法裡直到現實賬單上門。',
        demon8: 'Ti 魔鬼轉化：崩潰時可能變得極度冷酷批判人性偽善；整合後能替溫柔的信念打造堅實清晰的邏輯護盾。'
      },
      cognitiveLoop: {
        name: 'Fi–Si 傷痛懷舊迴圈',
        mechanism: '跳過探索新可能的 Ne，只困在個人受傷感受（Fi）與過去遺憾回憶（Si）的迴響室裡。',
        warningSigns: '反覆重播過去被誤解或搞砸的畫面，把一次挫折泛化成「我就是不夠好」，不敢再踏出新一步。',
        exitStrategy: '主動喚醒輔助 Ne：換個新環境散步、跟朋友討論有趣的新故事或允許自己用玩耍心態畫／寫一點完全不求完美的草稿。'
      },
      quenkGrip: {
        trigger: '核心價值遭公開踐踏、長期處於嚴苛冷漠的效率壓迫或覺得所有理想皆破滅。',
        behavior: '劣勢 Te 劫持：向來溫柔寬容的你，可能突然變得異常尖銳挑剔、對身邊人發號施令並瘋狂挑細節毛病。',
        recoveryBridge: '先遠離批判源頭給自己安全感，找回內心真實感受（Fi），再透過 Ne 找出不只一條的溫和解方。'
      }
    },
    ENFJ: {
      interactionStyle: 'in_charge',
      beebe8: ['Fe', 'Ni', 'Se', 'Ti', 'Fi', 'Ne', 'Si', 'Te'],
      shadowInsights: {
        opposing5: 'Fi 對立：當有人只顧個人感受而不顧大局團隊和諧時，容易忍不住覺得對方自私並產生防禦心。',
        critical6: 'Ne 批判父母：腦中冒出無數「萬一別人不喜歡／萬一哪裡沒照顧到」的負面猜測不斷自我鞭策。',
        trickster7: 'Si 詭計盲點：常因太投入照顧大家與未來願景，忘記自己吃過藥沒、睡夠沒以及過往累積的疲勞極限。',
        demon8: 'Te 魔鬼轉化：極限崩潰時可能突然用冰冷的規章與效率手段強勢懲罰或切斷關係；整合後能兼顧溫情與清晰制度。'
      },
      cognitiveLoop: {
        name: 'Fe–Se 討好過載迴圈',
        mechanism: '跳過長遠洞察的 Ni，只在外在人情回應（Fe）與忙不完的現場活動招待（Se）間團團轉。',
        warningSigns: '為了讓身邊每個人當下都開心而把自己塞滿無止盡的聚會與救火任務，卻早已忘了長遠方向與自己真正想要什麼。',
        exitStrategy: '主動喚醒輔助 Ni：關掉通訊軟體通知獨處兩小時，誠實看清哪些人際連結值得深耕、哪些只是無謂消耗。'
      },
      quenkGrip: {
        trigger: '長期單向付出卻遭到公開誤解、孤立或陷入無法調解的親友撕裂衝突。',
        behavior: '劣勢 Ti 劫持：平時溫暖包容的你，可能突然極度冷漠抽離、用苛刻的邏輯懷疑身邊每個人是不是都在利用你。',
        recoveryBridge: '找回你真正認同的長遠意義（Ni），接受「不是每個人都能立刻被幫到」，重新用真實善意對待自己。'
      }
    },
    ENFP: {
      interactionStyle: 'get_things_going',
      beebe8: ['Ne', 'Fi', 'Te', 'Si', 'Ni', 'Fe', 'Ti', 'Se'],
      shadowInsights: {
        opposing5: 'Ni 對立：當別人斷言「只有唯一一條標準路可行」時，會本能抗拒並覺得自由與靈魂被關進牢籠。',
        critical6: 'Fe 批判父母：容易苛責自己「剛才是不是太沒禮貌、讓某個人尷尬了」，過度為所有群體氣氛負全責。',
        trickster7: 'Ti 詭計盲點：面對純粹冷冰冰的技術細節推導或嚴格定義拆解時容易感到混亂，不小心用感覺代替論證。',
        demon8: 'Se 魔鬼轉化：極端壓力下可能沉迷感官放縱或衝動逃離現實；整合後能讓豐沛創意在真實世界驚豔落地。'
      },
      cognitiveLoop: {
        name: 'Ne–Te 狂飆過勞迴圈',
        mechanism: '跳過內心價值羅盤 Fi，只在無限新點子（Ne）與盲目追求高產出控制（Te）間狂衝。',
        warningSigns: '同時開啟十幾個看起來能成功的大計畫、把自己行程排到窒息，卻感到內心越來越空虛、完全失去原本的熱情。',
        exitStrategy: '主動喚醒輔助 Fi：暫停一切外部比較，問自己「如果沒人鼓掌也沒有獎賞，我真正熱愛哪 1 件事？」'
      },
      quenkGrip: {
        trigger: '長期被囚禁於枯燥無聊的機械工作、選項被封死或摯愛關係出現深刻裂痕。',
        behavior: '劣勢 Si 劫持：平常陽光樂觀的你，可能突然變得極度悲觀執著過往小遺憾、過度放大身體不適或陷入固執牛角尖。',
        recoveryBridge: '先好好睡飽吃頓溫暖的飯安撫身體，再透過 Fi 找回自己真正重視的價值核心並與摯友傾訴。'
      }
    },
    ISTJ: {
      interactionStyle: 'chart_the_course',
      beebe8: ['Si', 'Te', 'Fi', 'Ne', 'Se', 'Ti', 'Fe', 'Ni'],
      shadowInsights: {
        opposing5: 'Se 對立：面對毫無計畫的即興亂衝或只圖當下刺激不顧後果的行為，會本能踩煞車強烈反對。',
        critical6: 'Ti 批判父母：常暗自嚴厲檢視系統或他人的邏輯不夠嚴密，或苛責自己沒有把規則條理做到 100% 完美。',
        trickster7: 'Fe 詭計盲點：常忽略職場或家庭中沒講出口的人情潛台詞，因一句太直白的提醒無意間引發對方委屈。',
        demon8: 'Ni 魔鬼轉化：極度挫折時可能陷入末日般的宿命論懷疑；整合後能為穩健經驗插上具前瞻性的策略翅膀。'
      },
      cognitiveLoop: {
        name: 'Si–Fi 固執懷舊迴圈',
        mechanism: '跳過客觀協調的 Te，只困在過往習慣經驗（Si）與個人主觀不滿認定（Fi）之間。',
        warningSigns: '對任何外部新變化抱持高度防備，固執認定「只有我以前這樣做才是對的、現在的人都不講規矩」，越活越封閉。',
        exitStrategy: '主動喚醒輔助 Te：用客觀事實檢視新方案的實際成效指標，並找回務實解決眼前問題的行動感。'
      },
      quenkGrip: {
        trigger: '賴以為生的秩序遭到無預警大破壞、他人失信導致失控或長期超負荷扛責。',
        behavior: '劣勢 Ne 劫持：向來沉穩務實的你，可能突然陷入失控災難化聯想，腦中不斷冒出「接下來全都要毀了」的極端負面可能。',
        recoveryBridge: '把焦慮從腦中移到紙上，用 Te 區分「已經發生的事實」與「尚未發生的猜測」，先解決眼前第一件可控小事。'
      }
    },
    ISFJ: {
      interactionStyle: 'behind_the_scenes',
      beebe8: ['Si', 'Fe', 'Ti', 'Ne', 'Se', 'Fi', 'Te', 'Ni'],
      shadowInsights: {
        opposing5: 'Se 對立：當環境突然變動太快、沒留準備緩衝時，內心會抗拒並想守住原本安全熟悉的方式。',
        critical6: 'Fi 批判父母：內心常嚴厲自責「是不是我不夠體貼、是不是我很自私」，背負了過多不屬於自己的道德罪惡感。',
        trickster7: 'Te 詭計盲點：在談判報酬、制定硬性淘汰標準或拒絕無理要求時常感到無措，容易讓自己的善意被白白消耗。',
        demon8: 'Ni 魔鬼轉化：崩潰時可能感到一切付出未來毫無希望；整合後能從默默補位升級為有遠見的溫暖守護者。'
      },
      cognitiveLoop: {
        name: 'Si–Ti 過度擔憂迴圈',
        mechanism: '跳過與外界真實交流的 Fe，只困在過去負面記憶（Si）與鑽牛角尖的內在懷疑（Ti）裡。',
        warningSigns: '反覆回想自己過去講錯的某句話，在腦中過度分析別人是不是偷偷討厭自己，卻不願直接開口確認。',
        exitStrategy: '主動喚醒輔助 Fe：勇敢與信任的朋友或伴侶輕鬆聊開確認事實，不要一個人躲在心裡推演最壞劇情。'
      },
      quenkGrip: {
        trigger: '長期無底線付出卻遭冷漠指責、突然面臨重大環境劇變或重要親友衝突。',
        behavior: '劣勢 Ne 劫持：平時溫婉踏實的你，可能突然對所有未知變化產生極端焦慮與災難化幻想，整個人緊繃失眠。',
        recoveryBridge: '回到熟悉安穩的日常小儀式（熱茶、散步、整理小物）穩住身心，再向值得信賴的人求助分擔。'
      }
    },
    ESTJ: {
      interactionStyle: 'in_charge',
      beebe8: ['Te', 'Si', 'Ne', 'Fi', 'Ti', 'Se', 'Ni', 'Fe'],
      shadowInsights: {
        opposing5: 'Ti 對立：當別人不斷拆解概念定義卻遲遲不肯行動交付時，會強烈煩躁並直接打斷「別再鑽牛角尖」。',
        critical6: 'Se 批判父母：對現場的拖延、混亂擺設或別人動作慢半拍容易展現嚴厲不耐，連自己累了都不准慢下來。',
        trickster7: 'Ni 詭計盲點：習慣看眼前實績與既有經驗，偶爾沒察覺產業大勢正在悄然轉向，直到舊模式撞牆才驚覺。',
        demon8: 'Fe 魔鬼轉化：極限壓力下可能覺得沒人真心感激你的辛苦而對大家冷言冷語；整合後能成就兼具魄力與仁心的大家長風範。'
      },
      cognitiveLoop: {
        name: 'Te–Ne 過度擴張控場迴圈',
        mechanism: '跳過踏實核對的 Si，只在外在效率追殺（Te）與不斷開出新目標要求（Ne）間疲於奔命。',
        warningSigns: '同時對團隊和自己下達過多不切實際的新指標，缺乏經驗打底驗證，讓自己跟身邊人都精疲力竭。',
        exitStrategy: '主動喚醒輔助 Si：停下來檢視過去真正有效且可持續的穩健節奏，尊重身體恢復與基本步驟。'
      },
      quenkGrip: {
        trigger: '團隊或家庭秩序徹底失控、苦心付出卻被當成冷血控制狂且無人理解。',
        behavior: '劣勢 Fi 劫持：向來剛強講理的你，可能突然感到極度委屈心寒、情緒潰堤覺得「沒人真正愛我只在利用我」。',
        recoveryBridge: '先暫時退出指揮位置休息，給自己獨處空間允許脆弱流淚，再找回「我其實也在乎這群人」的溫暖初衷。'
      }
    },
    ESFJ: {
      interactionStyle: 'get_things_going',
      beebe8: ['Fe', 'Si', 'Ne', 'Ti', 'Fi', 'Se', 'Ni', 'Te'],
      shadowInsights: {
        opposing5: 'Fi 對立：遇到堅持個人怪脾氣而完全不配合團體禮貌的人，心裡容易感到困惑與不認同。',
        critical6: 'Se 批判父母：對場合禮數、外表得體或別人有沒有即時表現出熱情禮貌常在心裡默默嚴格打分數。',
        trickster7: 'Ni 詭計盲點：容易只看眼前大家開不開心，而忽略某些關係或決定在兩年後可能帶來的隱性長遠代價。',
        demon8: 'Ti 魔鬼轉化：極端委屈時可能變得冷酷挑剔並用極端邏輯算清所有人情帳；整合後能學會兼顧善意與理性設限。'
      },
      cognitiveLoop: {
        name: 'Fe–Ne 過度揣測討好迴圈',
        mechanism: '跳過務實穩重的 Si，只在他人臉色（Fe）與腦補各種人際負面可能（Ne）之間焦慮打轉。',
        warningSigns: '別人沒回訊息就腦補十種是不是惹他生氣的劇本，不斷過度討好想修補根本不存在的裂痕。',
        exitStrategy: '主動喚醒輔助 Si：回到眼前已經驗證過的事實與日常穩固互動，相信你們過去長期累積的交情沒那麼脆弱。'
      },
      quenkGrip: {
        trigger: '長期在關係裡付出卻遭到冷漠否定，或陷入怎麼協調都兩面不是人的衝突夾縫。',
        behavior: '劣勢 Ti 劫持：平常溫暖圓融的你，可能突然變得尖銳批判、躲起來冷冰冰檢討自己是不是很蠢才一直當好人。',
        recoveryBridge: '找回你過往踏實的生活節律與安全親友圈，停止過度解讀未經證實的猜測。'
      }
    },
    ISTP: {
      interactionStyle: 'chart_the_course',
      beebe8: ['Ti', 'Se', 'Ni', 'Fe', 'Te', 'Si', 'Ne', 'Fi'],
      shadowInsights: {
        opposing5: 'Te 對立：被迫服從缺乏合理性、純粹為了交差的繁瑣官僚規定時，會產生極強反骨與冷眼旁觀態度。',
        critical6: 'Si 批判父母：偶爾對自己過去犯過的低級實作錯誤或缺乏長期穩定資歷產生苛刻懊惱。',
        trickster7: 'Ne 詭計盲點：對沒什麼實際根據的漫天幻想或情緒隱喻常感到一頭霧水，容易在複雜的辦公室話術裡吃暗虧。',
        demon8: 'Fi 魔鬼轉化：崩潰時可能感到與世徹底疏離、對一切價值麻木；整合後能展現靜默卻極為深情的守護力量。'
      },
      cognitiveLoop: {
        name: 'Ti–Ni 陰沉宿命迴圈',
        mechanism: '跳過與現實互動的 Se，只困在內在推導（Ti）與過度收斂的負面預感（Ni）之間。',
        warningSigns: '獨自悶在房間反覆推算某件事一定會朝最糟方向發展，切斷行動與社交，變得冷漠猜疑。',
        exitStrategy: '主動喚醒輔助 Se：立刻出門騎車、運動、修一件實體物品或走進現場，用真實物理行動打破腦內空轉。'
      },
      quenkGrip: {
        trigger: '私人獨立空間遭長期侵犯、被迫處理無解的情緒風暴或嚴重技術挫敗。',
        behavior: '劣勢 Fe 劫持：平時酷帥冷靜的你，可能突然感到莫名孤獨渴望被肯定，或因小事對身邊人情緒爆發後又後悔。',
        recoveryBridge: '先透過獨處運動或實作恢復掌控感，冷靜後再簡短真誠地向在乎的人說明剛才只是壓力太大。'
      }
    },
    ISFP: {
      interactionStyle: 'behind_the_scenes',
      beebe8: ['Fi', 'Se', 'Ni', 'Te', 'Fe', 'Si', 'Ne', 'Ti'],
      shadowInsights: {
        opposing5: 'Fe 對立：被迫在大場合跟著大家演戲附和虛偽口號時，內心會強烈抗拒並只想悄悄溜走。',
        critical6: 'Si 批判父母：容易在創作或工作受挫時，翻出過往失敗回憶苛責自己「我永遠不夠專業可靠」。',
        trickster7: 'Ne 詭計盲點：面對狡猾的話術推銷或充滿多重隱藏條件的複雜談判局時，常因單純信任當下感受而受騙吃虧。',
        demon8: 'Ti 魔鬼轉化：極限崩潰時可能用冰冷尖酸的邏輯徹底否定自己與世界；整合後能替細膩美感建立清晰結構。'
      },
      cognitiveLoop: {
        name: 'Fi–Ni 隱遁宿命迴圈',
        mechanism: '跳過活在當下的 Se，只困在內心受傷感受（Fi）與悲觀的自我預言（Ni）之間。',
        warningSigns: '覺得沒有人真正欣賞自己的價值、世界太粗糙醜陋，乾脆關起門逃避一切創作發表與人際聯絡。',
        exitStrategy: '主動喚醒輔助 Se：走進自然看陽光海風、去市場挑食材做頓美味料理或動手拍一張照片，回到五官當下。'
      },
      quenkGrip: {
        trigger: '長期處於冷酷高壓競爭、審美價值遭粗暴否定且必須配合毫無意義的數字壓迫。',
        behavior: '劣勢 Te 劫持：平時柔和寬容的你，可能突然變得異常焦躁批判、急著用冷硬指令控制一切卻又感到無力。',
        recoveryBridge: '遠離高壓比較場域，先安撫自己真實感受（Fi），再找一位務實友善夥伴幫忙梳理簡單可行的第一步。'
      }
    },
    ESTP: {
      interactionStyle: 'in_charge',
      beebe8: ['Se', 'Ti', 'Fe', 'Ni', 'Si', 'Te', 'Fi', 'Ne'],
      shadowInsights: {
        opposing5: 'Si 對立：當保守派只因「以前都這樣」而拒絕顯而易見的新機會時，會毫不留情當場挑戰突破。',
        critical6: 'Te 批判父母：對缺乏真實戰果的繁瑣制度極沒耐心，壓力大時也會苛責自己「怎麼還沒賺夠／贏不夠」。',
        trickster7: 'Fi 詭計盲點：不太容易察覺某個交易或玩笑背後的深層個人道德界線，有時不慎踩到別人最重視的尊嚴。',
        demon8: 'Ne 魔鬼轉化：徹底被困住時可能陷入失控的混亂幻想；整合後能在高變化現場依然保有長遠洞察定力。'
      },
      cognitiveLoop: {
        name: 'Se–Fe 炫耀失焦迴圈',
        mechanism: '跳過冷靜算計的 Ti，只在當下感官刺激（Se）與討好群眾掌聲（Fe）之間高速消耗。',
        warningSigns: '為了維持在場上的大哥／魅力焦點而過度吹牛請客、衝動冒險，忽略冷靜評估實際風險與自身真實利益。',
        exitStrategy: '主動喚醒輔助 Ti：獨自安靜一小時，像偵探一樣冷靜計算這件事真正的成本、勝率與因果邏輯。'
      },
      quenkGrip: {
        trigger: '長期被關在重複枯燥的規則裡動彈不得，或連續遭遇重大失敗失去所有掌控。',
        behavior: '劣勢 Ni 劫持：平常大膽樂觀的你，可能突然陷入陰沉宿命論，認定一切背後都有陰謀或未來完全沒有希望。',
        recoveryBridge: '去劇烈運動流汗重啟身體活力，再用 Ti 拆解眼前真正可控的事實，別被腦中過度悲觀的預感嚇住。'
      }
    },
    ESFP: {
      interactionStyle: 'get_things_going',
      beebe8: ['Se', 'Fi', 'Te', 'Ni', 'Si', 'Fe', 'Ti', 'Ne'],
      shadowInsights: {
        opposing5: 'Si 對立：被強迫照一成不變的傳統舊規矩過日子時，心裡會極度憋悶想立刻找點新鮮樂子打破它。',
        critical6: 'Fe 批判父母：嘴上看起來大方不在乎，其實內心偶爾苛責自己「是不是太任性、沒照顧好大家心情」。',
        trickster7: 'Ti 詭計盲點：在複雜的條文邏輯、財務複利計算或冷靜抽離辯論中容易暈頭轉向，不小心憑直覺簽下吃虧條件。',
        demon8: 'Ne 魔鬼轉化：極度低潮時可能被各種荒謬負面想像嚇到；整合後能讓豐沛的現場生命力擁有長遠美妙方向。'
      },
      cognitiveLoop: {
        name: 'Se–Te 衝動消耗迴圈',
        mechanism: '跳過內心真實感受 Fi，只在追逐外在新鮮刺激（Se）與急躁想證明自己能幹（Te）之間打轉。',
        warningSigns: '透過瘋狂購物、塞滿派對或瞎忙接一堆沒興趣的任務來逃避內心空虛，卻越來越不知道自己真正要什麼。',
        exitStrategy: '主動喚醒輔助 Fi：暫時推掉一場熱鬧聚會，安靜問自己內心「我真正珍惜的人與讓我有真實幸福感的事是什麼」。'
      },
      quenkGrip: {
        trigger: '長期孤立缺乏人群溫度、處於嚴厲冷漠環境且被迫面對繁瑣無趣的長期責任。',
        behavior: '劣勢 Ni 劫持：平時陽光開朗的你，可能突然陷入深沉的悲觀焦慮，覺得未來一片黑暗、自己只會玩卻毫無價值。',
        recoveryBridge: '找最信任的摯友傾訴並從具體小事重拾信心，別一個人躲在黑暗裡被消極預感吞沒。'
      }
    }
  };

  const LITERATURE_REFERENCES = [
    { author: 'C. G. Jung (1921)', work: '《心理類型》(Psychological Types)', role: '奠定內／外傾態度與思考、情感、實感、直覺四種心理功能之原型理論。' },
    { author: 'Naomi L. Quenk et al. (2001, 2002)', work: '《MBTI Step II 手冊》與《Was That Really Me?》', role: '建立 20 個細分面向（Step II Facets）與「In the Grip」劣勢功能壓力劫持復原模型。' },
    { author: 'John Beebe (2016)', work: '《心理類型的能量與模式》(Energies and Patterns in Psychological Type)', role: '提出意識四維＋陰影四維（對立、批判父母、詭計者、魔鬼轉化）之八維原型體系。' },
    { author: 'Linda V. Berens & David Keirsey', work: '《互動風格》(Interaction Styles) 與《請理解我 II》', role: '整合四大互動風格（掌控推進／藍圖領航／催化號召／幕後協調）與四大氣質核心需求。' }
  ];

  return {
    STEP2_FACETS,
    QUESTION_FACET_MAP,
    INTERACTION_STYLES,
    KEIRSEY_TEMPERAMENTS,
    BEEBE_POSITIONS,
    TYPE_LITERATURE,
    LITERATURE_REFERENCES
  };
}));
