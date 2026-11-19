(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MBTI_DATA = root.MBTI_DATA || {};
    root.MBTI_DATA.questions = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /**
   * 60 題繁體中文 MBTI 五維度平衡題庫
   * dimensions:
   * - EI: E (外向 Extraversion) vs I (內向 Introversion)
   * - SN: S (實感 Sensing) vs N (直覺 Intuition)
   * - TF: T (思考 Thinking) vs F (情感 Feeling)
   * - JP: J (判斷 Judging) vs P (感知 Perceiving)
   * - AT: A (果斷 Assertive) vs T (謹慎 Turbulent)
   *
   * 每個維度共 12 題（正反極各 6 題）；快速版為每維度 6 題（正反極各 3 題），共 30 題。
   * 題目已依維度交錯編排，避免受測者連續面對同一向度題目而產生作答慣性。
   */
  const RAW_QUESTIONS = [
    // ================= 輪次 1 =================
    {
      id: 'EI_01',
      dimension: 'EI',
      pole: 'E',
      isQuick: true,
      context: '社交與精力',
      text: '參加完熱鬧的多人聚會或團隊活動後，我通常會覺得精神更振奮，而不是精力被耗盡。'
    },
    {
      id: 'SN_01',
      dimension: 'SN',
      pole: 'S',
      isQuick: true,
      context: '資訊處理',
      text: '認識新事物時，我更依賴實際經驗、具體數據與親眼所見的事實，而非抽象推論。'
    },
    {
      id: 'TF_01',
      dimension: 'TF',
      pole: 'T',
      isQuick: true,
      context: '決策標準',
      text: '做重要決定時，我優先考量客觀邏輯與利弊分析，即使結果可能讓人不太舒服。'
    },
    {
      id: 'JP_01',
      dimension: 'JP',
      pole: 'J',
      isQuick: true,
      context: '日常規劃',
      text: '出發旅行或開始一項專案前，我喜歡先排好明確的時程表與待辦清單，照表推進會讓我安心。'
    },
    {
      id: 'AT_01',
      dimension: 'AT',
      pole: 'A',
      isQuick: true,
      context: '情緒韌性',
      text: '即使面對突發壓力或外界批評，我通常也能保持內心穩定，不會反覆陷入自我懷疑。'
    },

    // ================= 輪次 2 =================
    {
      id: 'EI_02',
      dimension: 'EI',
      pole: 'I',
      isQuick: true,
      context: '社交與精力',
      text: '忙碌了一整週後，我最渴望的充電方式是一個人安靜地待在熟悉空間，做自己的事。'
    },
    {
      id: 'SN_02',
      dimension: 'SN',
      pole: 'N',
      isQuick: true,
      context: '思考方式',
      text: '我經常會被「未來可能發生什麼」或事物背後的隱藏意義吸引，腦中常冒出許多聯想。'
    },
    {
      id: 'TF_02',
      dimension: 'TF',
      pole: 'F',
      isQuick: true,
      context: '決策標準',
      text: '在團隊討論出現分歧時，我會特別在意每個人的感受與關係和諧，不希望有人覺得被忽略。'
    },
    {
      id: 'JP_02',
      dimension: 'JP',
      pole: 'P',
      isQuick: true,
      context: '日常規劃',
      text: '我喜歡保留計畫的彈性，因為旅途或工作途中臨時出現的新靈感，往往比原定行程更有趣。'
    },
    {
      id: 'AT_02',
      dimension: 'AT',
      pole: 'T',
      isQuick: true,
      context: '自我要求',
      text: '完成一件事之後，我常會忍不住回頭檢討哪裡還可以做得更好，並對小失誤耿耿於懷。'
    },

    // ================= 輪次 3 =================
    {
      id: 'EI_03',
      dimension: 'EI',
      pole: 'E',
      isQuick: true,
      context: '溝通習慣',
      text: '在陌生場合中，我通常不排斥主動開口破冰，與剛認識的人很快就能聊起來。'
    },
    {
      id: 'SN_03',
      dimension: 'SN',
      pole: 'S',
      isQuick: true,
      context: '工作偏好',
      text: '學習新軟體或工具時，我喜歡一步一步跟著明確的操作步驟做，勝過自己摸索理論架構。'
    },
    {
      id: 'TF_03',
      dimension: 'TF',
      pole: 'T',
      isQuick: true,
      context: '給予回饋',
      text: '當朋友犯錯並詢問我的意見時，我傾向直接指出問題核心，認為真誠分析比單純安慰更有幫助。'
    },
    {
      id: 'JP_03',
      dimension: 'JP',
      pole: 'J',
      isQuick: true,
      context: '截止時間',
      text: '我習慣把任務提早完成，把事情拖到最後一刻才趕工會讓我感到高度焦慮。'
    },
    {
      id: 'AT_03',
      dimension: 'AT',
      pole: 'A',
      isQuick: true,
      context: '決策自信',
      text: '一旦做出選擇並採取行動後，我很少再去煩惱「當初如果選另一條路會不會比較好」。'
    },

    // ================= 輪次 4 =================
    {
      id: 'EI_04',
      dimension: 'EI',
      pole: 'I',
      isQuick: true,
      context: '溝通習慣',
      text: '面對需要深入思考的問題時，我傾向先自己整理好想法，再與他人討論，而不是邊說邊想。'
    },
    {
      id: 'SN_04',
      dimension: 'SN',
      pole: 'N',
      isQuick: true,
      context: '思考方式',
      text: '聽別人描述一件事時，我更關心事情的大方向與背後動機，有時容易忽略細節數字。'
    },
    {
      id: 'TF_04',
      dimension: 'TF',
      pole: 'F',
      isQuick: true,
      context: '同理心',
      text: '身邊的人情緒低落時，即使對方沒說出口，我也很容易察覺並自然地想先接住對方的情緒。'
    },
    {
      id: 'JP_04',
      dimension: 'JP',
      pole: 'P',
      isQuick: true,
      context: '工作節奏',
      text: '在沒有太多條條框框限制、可以隨時依現況調整做法的環境裡，我的狀態反而最好。'
    },
    {
      id: 'AT_04',
      dimension: 'AT',
      pole: 'T',
      isQuick: true,
      context: '壓力反應',
      text: '當事情沒有按照預期發展時，我容易感到緊張或焦躁，擔心後續會連鎖出錯。'
    },

    // ================= 輪次 5 =================
    {
      id: 'EI_05',
      dimension: 'EI',
      pole: 'E',
      isQuick: true,
      context: '人際互動',
      text: '我享受擁有多樣化的社交圈，與不同背景的人互動交流能帶給我源源不絕的新鮮感。'
    },
    {
      id: 'SN_05',
      dimension: 'SN',
      pole: 'S',
      isQuick: true,
      context: '觀察細節',
      text: '我對周遭環境的實際變化相當敏銳，例如空間擺設微調、聲音氣味或細節上的小誤差。'
    },
    {
      id: 'TF_05',
      dimension: 'TF',
      pole: 'T',
      isQuick: true,
      context: '價值判斷',
      text: '我認為公平、一致的規則制度，比根據個人特殊情況破例通融更為重要。'
    },
    {
      id: 'JP_05',
      dimension: 'JP',
      pole: 'J',
      isQuick: true,
      context: '決定速度',
      text: '事情遲遲懸而未決會讓我渾身不自在，我喜歡盡快拍板定案並把項目從清單上劃掉。'
    },
    {
      id: 'AT_05',
      dimension: 'AT',
      pole: 'A',
      isQuick: true,
      context: '自我接納',
      text: '整體而言，我對目前的自己感到滿意，不需要靠別人的不斷肯定來證明自身價值。'
    },

    // ================= 輪次 6 =================
    {
      id: 'EI_06',
      dimension: 'EI',
      pole: 'I',
      isQuick: true,
      context: '人際互動',
      text: '比起認識一大群點頭之交，我更珍惜和一兩位知心好友進行長談、建立深度連結。'
    },
    {
      id: 'SN_06',
      dimension: 'SN',
      pole: 'N',
      isQuick: true,
      context: '創新視野',
      text: '與其沿用「一直以來都這樣做」的成熟方法，我更喜歡嘗試顛覆常規的新點子或替代方案。'
    },
    {
      id: 'TF_06',
      dimension: 'TF',
      pole: 'F',
      isQuick: true,
      context: '價值判斷',
      text: '即使一個方案在數字與效率上無懈可擊，只要會傷害到相關人員的權益或尊嚴，我就很難支持。'
    },
    {
      id: 'JP_06',
      dimension: 'JP',
      pole: 'P',
      isQuick: true,
      context: '生活風格',
      text: '我常同時開啟好幾個感興趣的計畫或閱讀好幾本書，喜歡視當下心情自由切換。'
    },
    {
      id: 'AT_06',
      dimension: 'AT',
      pole: 'T',
      isQuick: true,
      context: '他人評價',
      text: '如果感覺某人對我有些不滿或態度冷淡，我可能會花很多心思反覆猜測自己哪裡做得不夠好。'
    },

    // ================= 輪次 7 =================
    {
      id: 'EI_07',
      dimension: 'EI',
      pole: 'E',
      isQuick: false,
      context: '團隊合作',
      text: '在腦力激盪會議中，我很喜歡即時拋出想法、與大家你一言我一語地把概念越聊越完整。'
    },
    {
      id: 'SN_07',
      dimension: 'SN',
      pole: 'S',
      isQuick: false,
      context: '記憶特徵',
      text: '回憶過去的一段經歷時，我通常能清楚記得當時的具體畫面、對話內容與實際發生順序。'
    },
    {
      id: 'TF_07',
      dimension: 'TF',
      pole: 'T',
      isQuick: false,
      context: '衝突處理',
      text: '遇到爭論時，我更在意哪一方的論點站得住腳、證據更充分，而不容易被情緒化發言說服。'
    },
    {
      id: 'JP_07',
      dimension: 'JP',
      pole: 'J',
      isQuick: false,
      context: '空間秩序',
      text: '當桌面、電腦資料夾或生活空間處於井然有序的狀態時，我的思緒才會跟著清晰起來。'
    },
    {
      id: 'AT_07',
      dimension: 'AT',
      pole: 'A',
      isQuick: false,
      context: '抗壓心態',
      text: '朋友常形容我心態很穩、不容易被小事動搖，即使在緊急關頭也能冷靜處理。'
    },

    // ================= 輪次 8 =================
    {
      id: 'EI_08',
      dimension: 'EI',
      pole: 'I',
      isQuick: false,
      context: '表達方式',
      text: '在群組或公開場合中，我更常扮演觀察與傾聽的角色，通常只有真正必要時才發言。'
    },
    {
      id: 'SN_08',
      dimension: 'SN',
      pole: 'N',
      isQuick: false,
      context: '閱讀興趣',
      text: '我喜歡充滿隱喻、哲學思考、科幻設定或探討人性複雜度的作品，勝過單純寫實的紀實內容。'
    },
    {
      id: 'TF_08',
      dimension: 'TF',
      pole: 'F',
      isQuick: false,
      context: '自我認同',
      text: '我對工作或生活成就的滿足感，很大一部分來自於「我真正幫助到了別人」或「讓大家更開心」。'
    },
    {
      id: 'JP_08',
      dimension: 'JP',
      pole: 'P',
      isQuick: false,
      context: '任務收尾',
      text: '我在期限逼近時往往能爆發出驚人的專注力與創造力，太早把一切定死反而讓我失去動力。'
    },
    {
      id: 'AT_08',
      dimension: 'AT',
      pole: 'T',
      isQuick: false,
      context: '完美主義',
      text: '別人已經覺得表現得很好的成果，我自己心裡常常還是盯著那 5% 不夠完美的地方看。'
    },

    // ================= 輪次 9 =================
    {
      id: 'EI_09',
      dimension: 'EI',
      pole: 'E',
      isQuick: false,
      context: '生活節奏',
      text: '如果連續好幾天都沒有約人見面或參與外部活動，我會開始覺得無聊甚至有些悶。'
    },
    {
      id: 'SN_09',
      dimension: 'SN',
      pole: 'S',
      isQuick: false,
      context: '務實態度',
      text: '別人稱讚我是一個很務實、腳踏實地的人，做事注重眼下可行性勝過空泛的遠大願景。'
    },
    {
      id: 'TF_09',
      dimension: 'TF',
      pole: 'T',
      isQuick: false,
      context: '情感表達',
      text: '面對他人情緒激動或哭泣時，我常覺得不太自在，下意識想先幫對方分析怎麼解決問題。'
    },
    {
      id: 'JP_09',
      dimension: 'JP',
      pole: 'J',
      isQuick: false,
      context: '變動適應',
      text: '原定計畫如果臨時被他人更動，我會感到相當煩躁，需要花點時間重新建立掌控感。'
    },
    {
      id: 'AT_09',
      dimension: 'AT',
      pole: 'A',
      isQuick: false,
      context: '失敗調適',
      text: '遇到挫折或失敗時，我把它視為單純的經驗修正，很快就能翻篇繼續往前看。'
    },

    // ================= 輪次 10 =================
    {
      id: 'EI_10',
      dimension: 'EI',
      pole: 'I',
      isQuick: false,
      context: '隱私與界線',
      text: '我需要明確的個人時間與心理界線，即便是親近的家人或伴侶，也偶爾需要獨處空間。'
    },
    {
      id: 'SN_10',
      dimension: 'SN',
      pole: 'N',
      isQuick: false,
      context: '靈感直覺',
      text: '我經常會有「突然間就知道答案或趨勢」的直覺靈感，即便一時之間說不出完整推理過程。'
    },
    {
      id: 'TF_10',
      dimension: 'TF',
      pole: 'F',
      isQuick: false,
      context: '決策考量',
      text: '做選擇時，內心的價值觀與直覺上的「這件事對不對、善不善」，往往比冷冰冰的條列分析更有分量。'
    },
    {
      id: 'JP_10',
      dimension: 'JP',
      pole: 'P',
      isQuick: false,
      context: '探索心態',
      text: '做決定前我常希望能多保留幾個選項、再多收集一點可能性，不太喜歡過早把話說死。'
    },
    {
      id: 'AT_10',
      dimension: 'AT',
      pole: 'T',
      isQuick: false,
      context: '焦慮傾向',
      text: '我常會預想最壞的情況並提前感到擔憂，即使客觀上那些問題發生的機率並不高。'
    },

    // ================= 輪次 11 =================
    {
      id: 'EI_11',
      dimension: 'EI',
      pole: 'E',
      isQuick: false,
      context: '注意力方向',
      text: '我通常把注意力放在外在世界正在發生的大小事上，喜歡親身參與其中並獲得即時回饋。'
    },
    {
      id: 'SN_11',
      dimension: 'SN',
      pole: 'S',
      isQuick: false,
      context: '表達風格',
      text: '我習慣用精確、直白、不拐彎抹角的語言描述事物，不喜歡過於玄虛或模糊的比喻。'
    },
    {
      id: 'TF_11',
      dimension: 'TF',
      pole: 'T',
      isQuick: false,
      context: '評價標準',
      text: '比起「這個人人緣好不好、體不體貼」，我更重視對方在專業能力與邏輯上的可靠性。'
    },
    {
      id: 'JP_11',
      dimension: 'JP',
      pole: 'J',
      isQuick: false,
      context: '消費與安排',
      text: '就連週末怎麼過、晚餐吃什麼，我也傾向先有個大概安排，不喜歡到時候才漫無目的地找。'
    },
    {
      id: 'AT_11',
      dimension: 'AT',
      pole: 'A',
      isQuick: false,
      context: '公開表現',
      text: '在眾人面前發表意見或展現成果時，我通常相當從容自在，很少擔心別人會怎麼看我。'
    },

    // ================= 輪次 12 =================
    {
      id: 'EI_12',
      dimension: 'EI',
      pole: 'I',
      isQuick: false,
      context: '社交消耗',
      text: '連續進行多場社交或會議後，即便氣氛很愉快，我也會明顯感覺需要「關機」休息一下。'
    },
    {
      id: 'SN_12',
      dimension: 'SN',
      pole: 'N',
      isQuick: false,
      context: '學習偏好',
      text: '比起記住大量零碎的既有規則，我更想先搞懂背後的整體運作原理與核心概念。'
    },
    {
      id: 'TF_12',
      dimension: 'TF',
      pole: 'F',
      isQuick: false,
      context: '衝突避讓',
      text: '為了不傷及彼此感情或破壞氣氛，我有時會選擇退讓或用委婉的方式表達反對意見。'
    },
    {
      id: 'JP_12',
      dimension: 'JP',
      pole: 'P',
      isQuick: false,
      context: '隨興程度',
      text: '面對突如其來的邀約或新奇機會，我很容易放下原本手邊的小事，立刻說走就走。'
    },
    {
      id: 'AT_12',
      dimension: 'AT',
      pole: 'T',
      isQuick: false,
      context: '進步驅動力',
      text: '內心那股「還不夠好、還得再努力」的緊迫感，往往是推動我不斷往前進步的主要動力。'
    }
  ];

  return RAW_QUESTIONS;
}));
