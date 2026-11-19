(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MBTI_REPORT_IMAGE = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const FONT_FAMILY = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Segoe UI", system-ui, sans-serif';
  const CANVAS_WIDTH = 1200;
  const OUTER_PAD = 40;
  const CARD_W = CANVAS_WIDTH - OUTER_PAD * 2;
  const CARD_PAD = 28;
  const INNER_W = CARD_W - CARD_PAD * 2;
  const NO_LINE_START_PUNCT = new Set(['。', '，', '、', '；', '：', '！', '？', '）', '」', '』', '】', '》', '〉', '.', ',', '!', '?']);

  const PALETTE = {
    textMain: '#18181B',
    textSub: '#52525B',
    textMuted: '#71717A',
    border: '#E4E2DC',
    bg: '#F8F7F4',
    cardBg: '#FFFFFF',
    innerBox: '#FAF9F6'
  };

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function wrapLines(ctx, text, maxWidth) {
    if (!text) return [];
    const paragraphs = String(text).split('\n');
    const lines = [];
    for (const para of paragraphs) {
      const tokens = para.match(/[A-Za-z0-9%._-]+|./g) || [];
      let current = '';
      for (const tok of tokens) {
        const test = current + tok;
        if (ctx.measureText(test).width > maxWidth && current.length > 0) {
          if (tok.length === 1 && NO_LINE_START_PUNCT.has(tok) && current.length > 1) {
            lines.push(current.slice(0, -1));
            current = current.slice(-1) + tok;
          } else {
            lines.push(current);
            current = tok === ' ' ? '' : tok;
          }
        } else {
          current = test;
        }
      }
      if (current.length > 0) lines.push(current);
    }
    return lines;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1.5) {
    roundRectPath(ctx, x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function drawWrappedBlock(ctx, text, x, y, maxWidth, font, color, lineHeight) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    const lines = wrapLines(ctx, text, maxWidth);
    lines.forEach((line, idx) => ctx.fillText(line, x, y + idx * lineHeight));
    return lines.length * lineHeight;
  }

  function measureWrappedHeight(ctx, text, maxWidth, font, lineHeight) {
    ctx.font = font;
    return wrapLines(ctx, text, maxWidth).length * lineHeight;
  }

  function drawChipRow(ctx, items, x, y, maxWidth, bg, fg, borderColor) {
    ctx.font = `600 14px ${FONT_FAMILY}`;
    let cx = x;
    let cy = y;
    const chipH = 28;
    const gap = 8;
    for (const label of items) {
      const chipW = ctx.measureText(label).width + 22;
      if (cx + chipW > x + maxWidth && cx > x) {
        cx = x;
        cy += chipH + gap;
      }
      fillRoundRect(ctx, cx, cy, chipW, chipH, 14, bg, borderColor, 1);
      ctx.fillStyle = fg;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx + 11, cy + chipH / 2 + 0.5);
      cx += chipW + gap;
    }
    ctx.textBaseline = 'top';
    return cy - y + chipH;
  }

  function measureChipRowHeight(ctx, items, maxWidth) {
    ctx.font = `600 14px ${FONT_FAMILY}`;
    let cx = 0;
    let cy = 0;
    const chipH = 28;
    const gap = 8;
    for (const label of items) {
      const chipW = ctx.measureText(label).width + 22;
      if (cx + chipW > maxWidth && cx > 0) {
        cx = 0;
        cy += chipH + gap;
      }
      cx += chipW + gap;
    }
    return cy + chipH;
  }

  function formatReportDate(iso) {
    try {
      return new Date(iso).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  function buildExportFilename(record) {
    const d = record && record.createdAt ? new Date(record.createdAt) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = Number.isNaN(d.getTime())
      ? 'report'
      : `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `PrismMBTI_${record.fullType}_${stamp}.jpg`;
  }

  function drawCanvasRadar(ctx, cogScores, cx, cy, maxR, accent) {
    const order = ['Ni', 'Ne', 'Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si'];
    const pointAt = (idx, pct) => {
      const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / order.length;
      const r = (pct / 100) * maxR;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    for (const rPct of [25, 50, 75, 100]) {
      ctx.beginPath();
      order.forEach((_, i) => {
        const [px, py] = pointAt(i, rPct);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = '#D4D1C8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    order.forEach((_, i) => {
      const [px, py] = pointAt(i, 100);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.strokeStyle = '#E4E2DC';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.beginPath();
    order.forEach((code, i) => {
      const [px, py] = pointAt(i, cogScores[code] || 20);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    order.forEach((code, i) => {
      const val = cogScores[code] || 0;
      const [dx, dy] = pointAt(i, val);
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const [lx, ly] = pointAt(i, 126);
      ctx.font = `700 12px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textSub;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${code} ${val}%`, lx, ly);
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  function drawCanvasDonut(ctx, cx, cy, trait) {
    const r = 28;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ECEAE4';
    ctx.lineWidth = 7;
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * trait.score) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = trait.color;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.font = `800 14px ${FONT_FAMILY}`;
    ctx.fillStyle = PALETTE.textMain;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${trait.score}%`, cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  function measureGaugesRowHeight(ctx, traits) {
    const gap = 12;
    const colW = (INNER_W - gap * 3) / 4;
    let maxH = 0;
    for (const tr of traits) {
      const tipH = measureWrappedHeight(ctx, tr.tip, colW - 26, `400 12.5px ${FONT_FAMILY}`, 18);
      maxH = Math.max(maxH, 134 + tipH + 14);
    }
    return maxH;
  }

  function drawGaugesRow(ctx, traits, x, y) {
    const gap = 12;
    const colW = (INNER_W - gap * 3) / 4;
    const rowH = measureGaugesRowHeight(ctx, traits);
    traits.forEach((tr, idx) => {
      const gx = x + idx * (colW + gap);
      fillRoundRect(ctx, gx, y, colW, rowH, 10, PALETTE.innerBox, PALETTE.border, 1);
      drawCanvasDonut(ctx, gx + colW / 2, y + 44, tr);

      ctx.font = `700 15px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.textAlign = 'center';
      ctx.fillText(tr.title, gx + colW / 2, y + 82);

      const lvlLabel = `${tr.title}：${tr.level}`;
      ctx.font = `700 12px ${FONT_FAMILY}`;
      const lw = ctx.measureText(lvlLabel).width + 16;
      fillRoundRect(ctx, gx + (colW - lw) / 2, y + 104, lw, 20, 10, '#ECEAE4', null);
      ctx.fillStyle = PALETTE.textSub;
      ctx.fillText(lvlLabel, gx + colW / 2, y + 107);
      ctx.textAlign = 'left';

      drawWrappedBlock(ctx, tr.tip, gx + 13, y + 132, colW - 26, `400 12.5px ${FONT_FAMILY}`, PALETTE.textSub, 18);
    });
    return rowH;
  }

  function measureTwoColCardsHeight(ctx, items, isRoleStyle) {
    const gap = 12;
    const colW = (INNER_W - gap) / 2;
    const padX = 14;
    const textOffsetX = isRoleStyle ? padX : padX + 32;
    const textW = colW - textOffsetX - padX;
    let total = 0;

    for (let i = 0; i < items.length; i += 2) {
      let rowH = 0;
      for (let j = 0; j < 2 && i + j < items.length; j += 1) {
        const it = items[i + j];
        const title = isRoleStyle ? it.role : it.title;
        const body = isRoleStyle ? it.reason : it.desc;
        const tH = measureWrappedHeight(ctx, title, textW, `700 14.5px ${FONT_FAMILY}`, 20);
        const bH = measureWrappedHeight(ctx, body, textW, `400 13.5px ${FONT_FAMILY}`, 19);
        rowH = Math.max(rowH, 12 + tH + 4 + bH + 12);
      }
      total += rowH + (i + 2 < items.length ? 10 : 0);
    }
    return total;
  }

  function drawTwoColCards(ctx, items, x, y, tone, accent) {
    const isRoleStyle = tone === 'role';
    const gap = 12;
    const colW = (INNER_W - gap) / 2;
    const padX = 14;
    const textOffsetX = isRoleStyle ? padX : padX + 32;
    const textW = colW - textOffsetX - padX;
    const iconChar = tone === 'pos' ? '✓' : tone === 'neg' ? '!' : '★';
    const iconBg = tone === 'pos' ? 'rgba(5, 150, 105, 0.14)' : tone === 'neg' ? 'rgba(217, 119, 6, 0.14)' : 'rgba(15, 118, 110, 0.12)';
    const iconFg = tone === 'pos' ? '#059669' : tone === 'neg' ? '#D97706' : accent;

    let cy = y;
    for (let i = 0; i < items.length; i += 2) {
      let rowH = 0;
      for (let j = 0; j < 2 && i + j < items.length; j += 1) {
        const it = items[i + j];
        const title = isRoleStyle ? it.role : it.title;
        const body = isRoleStyle ? it.reason : it.desc;
        const tH = measureWrappedHeight(ctx, title, textW, `700 14.5px ${FONT_FAMILY}`, 20);
        const bH = measureWrappedHeight(ctx, body, textW, `400 13.5px ${FONT_FAMILY}`, 19);
        rowH = Math.max(rowH, 12 + tH + 4 + bH + 12);
      }

      for (let j = 0; j < 2 && i + j < items.length; j += 1) {
        const it = items[i + j];
        const cx = x + j * (colW + gap);
        fillRoundRect(ctx, cx, cy, colW, rowH, 10, PALETTE.innerBox, PALETTE.border, 1);

        if (isRoleStyle) {
          ctx.fillStyle = accent;
          ctx.fillRect(cx, cy + 8, 4, rowH - 16);
        } else {
          fillRoundRect(ctx, cx + padX, cy + 13, 22, 22, 6, iconBg, null);
          ctx.font = `800 13px ${FONT_FAMILY}`;
          ctx.fillStyle = iconFg;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(iconChar, cx + padX + 11, cy + 24);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
        }

        const title = isRoleStyle ? it.role : it.title;
        const body = isRoleStyle ? it.reason : it.desc;
        const tH = drawWrappedBlock(ctx, title, cx + textOffsetX, cy + 12, textW, `700 14.5px ${FONT_FAMILY}`, PALETTE.textMain, 20);
        drawWrappedBlock(ctx, body, cx + textOffsetX, cy + 12 + tH + 4, textW, `400 13.5px ${FONT_FAMILY}`, PALETTE.textSub, 19);
      }

      cy += rowH + (i + 2 < items.length ? 10 : 0);
    }
    return cy - y;
  }

  function measureInfoBoxHeight(ctx, title, body, width) {
    const tH = title ? 26 : 0;
    const bH = measureWrappedHeight(ctx, body, width - 32, `400 14px ${FONT_FAMILY}`, 22);
    return 14 + tH + bH + 14;
  }

  function drawInfoBox(ctx, title, body, x, y, width, bg, border) {
    const h = measureInfoBoxHeight(ctx, title, body, width);
    fillRoundRect(ctx, x, y, width, h, 10, bg, border, 1);
    let cy = y + 14;
    if (title) {
      ctx.font = `700 15px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.fillText(title, x + 16, cy);
      cy += 26;
    }
    drawWrappedBlock(ctx, body, x + 16, cy, width - 32, `400 14px ${FONT_FAMILY}`, PALETTE.textSub, 22);
    return h;
  }

  function measureSubheadHeight() {
    return 28;
  }

  function drawSubhead(ctx, title, x, y) {
    ctx.font = `700 17px ${FONT_FAMILY}`;
    ctx.fillStyle = PALETTE.textMain;
    ctx.fillText(title, x, y);
    return 28;
  }

  function drawChapterBadge(ctx, label, x, y, softBg, accent) {
    ctx.font = `700 12px ${FONT_FAMILY}`;
    const w = ctx.measureText(label).width + 20;
    fillRoundRect(ctx, x, y, w, 24, 12, softBg, null);
    ctx.fillStyle = accent;
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 10, y + 12.5);
    ctx.textBaseline = 'top';
    return 32;
  }

  function renderDomainChapter(ctx, y, measureOnly, cfg) {
    const { badge, title, intro, traits, sections, extraRows, accent, softAccent } = cfg;
    const introH = measureWrappedHeight(ctx, intro, INNER_W, `400 15.5px ${FONT_FAMILY}`, 24);
    const gaugesH = measureGaugesRowHeight(ctx, traits);

    let sectionsH = 0;
    for (const sec of sections) {
      sectionsH += 18 + measureSubheadHeight() + measureTwoColCardsHeight(ctx, sec.items, sec.tone === 'role');
    }

    let extrasH = 0;
    const halfGap = 14;
    const halfW = (INNER_W - halfGap) / 2;
    for (const ex of extraRows) {
      extrasH += 16;
      if (ex.type === 'twoCol') {
        const h1 = measureInfoBoxHeight(ctx, ex.left.title, ex.left.body, halfW);
        const h2 = measureInfoBoxHeight(ctx, ex.right.title, ex.right.body, halfW);
        extrasH += Math.max(h1, h2);
      } else {
        extrasH += measureInfoBoxHeight(ctx, ex.title, ex.body, INNER_W);
      }
    }

    const totalH = CARD_PAD * 2 + 32 + 34 + introH + 16 + measureSubheadHeight() + gaugesH + sectionsH + extrasH;

    if (!measureOnly) {
      fillRoundRect(ctx, OUTER_PAD, y, CARD_W, totalH, 18, PALETTE.cardBg, PALETTE.border, 1.5);
      const ax = OUTER_PAD + CARD_PAD;
      let cy = y + CARD_PAD;

      cy += drawChapterBadge(ctx, badge, ax, cy, softAccent, accent);
      ctx.font = `700 22px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.fillText(title, ax, cy);
      cy += 34;

      cy += drawWrappedBlock(ctx, intro, ax, cy, INNER_W, `400 15.5px ${FONT_FAMILY}`, PALETTE.textSub, 24);
      cy += 16;

      cy += drawSubhead(ctx, '具有影響力的特質指標', ax, cy);
      cy += drawGaugesRow(ctx, traits, ax, cy);

      for (const sec of sections) {
        cy += 18;
        cy += drawSubhead(ctx, sec.heading, ax, cy);
        cy += drawTwoColCards(ctx, sec.items, ax, cy, sec.tone, accent);
      }

      for (const ex of extraRows) {
        cy += 16;
        if (ex.type === 'twoCol') {
          const h1 = measureInfoBoxHeight(ctx, ex.left.title, ex.left.body, halfW);
          const h2 = measureInfoBoxHeight(ctx, ex.right.title, ex.right.body, halfW);
          const rowH = Math.max(h1, h2);
          fillRoundRect(ctx, ax, cy, halfW, rowH, 10, PALETTE.innerBox, PALETTE.border, 1);
          drawInfoBox(ctx, ex.left.title, ex.left.body, ax, cy, halfW, PALETTE.innerBox, PALETTE.border);
          fillRoundRect(ctx, ax + halfW + halfGap, cy, halfW, rowH, 10, PALETTE.innerBox, PALETTE.border, 1);
          drawInfoBox(ctx, ex.right.title, ex.right.body, ax + halfW + halfGap, cy, halfW, PALETTE.innerBox, PALETTE.border);
          cy += rowH;
        } else {
          cy += drawInfoBox(ctx, ex.title, ex.body, ax, cy, INNER_W, ex.accent ? softAccent : PALETTE.innerBox, ex.accent ? accent : PALETTE.border);
        }
      }
    }

    return totalH;
  }

  function renderLiteratureChapter(ctx, y, measureOnly, cfg) {
    const { litProfile, step2Facets, accent, softAccent } = cfg;
    if (!litProfile) return 0;

    const halfGap = 14;
    const halfW = (INNER_W - halfGap) / 2;
    const inter = litProfile.interactionStyle;
    const temp = litProfile.temperament;
    const interTitle = inter ? `Berens 互動風格｜${inter.name}` : 'Berens 互動風格';
    const interBody = inter ? `${inter.dimensions}\n${inter.summary}` : '';
    const tempTitle = temp ? `Keirsey 氣質動力｜${temp.name}` : 'Keirsey 氣質動力';
    const tempBody = temp
      ? `領導原型：${temp.leadershipArchetype}\n核心需求：${temp.coreNeed}\n深層忌憚：${temp.coreFear}`
      : '';
    const metaRowH = Math.max(
      measureInfoBoxHeight(ctx, interTitle, interBody, halfW),
      measureInfoBoxHeight(ctx, tempTitle, tempBody, halfW)
    );

    const stack = Array.isArray(litProfile.beebeStack) ? litProfile.beebeStack : [];
    const col4Gap = 10;
    const col4W = (INNER_W - col4Gap * 3) / 4;
    const rowHeights = [0, 0];
    for (let r = 0; r < 2; r += 1) {
      let maxR = 0;
      for (let c = 0; c < 4; c += 1) {
        const item = stack[r * 4 + c];
        if (!item) continue;
        const txt = item.pos >= 5 && item.shadowInsight ? item.shadowInsight : `${item.fnShort} — ${item.roleDesc}`;
        const dH = measureWrappedHeight(ctx, txt, col4W - 22, `400 12px ${FONT_FAMILY}`, 17);
        maxR = Math.max(maxR, 12 + 20 + 22 + dH + 12);
      }
      rowHeights[r] = maxR;
    }
    const beebeGridH = rowHeights[0] + 10 + rowHeights[1];

    const loop = litProfile.cognitiveLoop || {};
    const grip = litProfile.quenkGrip || {};
    const loopTitle = `防衛迴圈｜${loop.name || ''}`;
    const loopBody = `機制：${loop.mechanism || ''}\n警訊：${loop.warningSigns || ''}\n破局：${loop.exitStrategy || ''}`;
    const gripTitle = 'Quenk 劣勢壓力劫持（In the Grip）';
    const gripBody = `觸發：${grip.trigger || ''}\n表徵：${grip.behavior || ''}\n復原：${grip.recoveryBridge || ''}`;
    const lgRowH = Math.max(
      measureInfoBoxHeight(ctx, loopTitle, loopBody, halfW),
      measureInfoBoxHeight(ctx, gripTitle, gripBody, halfW)
    );

    const hasStep2 = Boolean(step2Facets && Array.isArray(step2Facets.groups) && step2Facets.groups.length === 4);
    const step2BannerText = hasStep2
      ? step2Facets.outOfPreferenceCount > 0
        ? `偵測到 ${step2Facets.outOfPreferenceCount} 項「跨向度混合特質 (Out-of-Preference)」，例如：${step2Facets.outOfPreferenceList.slice(0, 4).map((f) => f.winnerName).join('、')}。`
        : '20 個細分面向皆與四大主偏好一致，呈現高度典型且集中的表現輪廓。'
      : '';
    const step2BannerH = hasStep2 ? measureWrappedHeight(ctx, step2BannerText, INNER_W - 28, `600 13.5px ${FONT_FAMILY}`, 20) + 20 : 0;
    const step2CardH = 192;
    const step2GridH = hasStep2 ? step2BannerH + 12 + step2CardH * 2 + 12 : 0;

    const refsBody = (litProfile.references || [])
      .map((r) => `• ${r.author} — ${r.work}：${r.role}`)
      .join('\n');
    const refsH = measureInfoBoxHeight(ctx, '參考國際心理學與類型學文獻', refsBody, INNER_W);

    const totalH =
      CARD_PAD * 2 +
      32 +
      36 +
      metaRowH +
      18 +
      measureSubheadHeight() +
      beebeGridH +
      18 +
      measureSubheadHeight() +
      lgRowH +
      (hasStep2 ? 18 + measureSubheadHeight() + step2GridH : 0) +
      16 +
      refsH;

    if (!measureOnly) {
      fillRoundRect(ctx, OUTER_PAD, y, CARD_W, totalH, 18, PALETTE.cardBg, PALETTE.border, 1.5);
      const ax = OUTER_PAD + CARD_PAD;
      let cy = y + CARD_PAD;

      cy += drawChapterBadge(ctx, 'CHAPTER 6 · 國際文獻深度模型', ax, cy, softAccent, accent);
      ctx.font = `700 22px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.fillText('Beebe 八維原型・Quenk 壓力劫持・Step II 二十面向', ax, cy);
      cy += 36;

      fillRoundRect(ctx, ax, cy, halfW, metaRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
      drawInfoBox(ctx, interTitle, interBody, ax, cy, halfW, PALETTE.innerBox, PALETTE.border);
      fillRoundRect(ctx, ax + halfW + halfGap, cy, halfW, metaRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
      drawInfoBox(ctx, tempTitle, tempBody, ax + halfW + halfGap, cy, halfW, PALETTE.innerBox, PALETTE.border);
      cy += metaRowH + 18;

      cy += drawSubhead(ctx, 'John Beebe 八維心理原型全圖譜（意識 1–4 ＋ 陰影 5–8）', ax, cy);
      for (let r = 0; r < 2; r += 1) {
        const rh = rowHeights[r];
        for (let c = 0; c < 4; c += 1) {
          const item = stack[r * 4 + c];
          if (!item) continue;
          const bx = ax + c * (col4W + col4Gap);
          const isShadow = item.pos >= 5;
          const cardBg = isShadow ? '#F6F3FF' : PALETTE.innerBox;
          const cardBorder = isShadow ? '#DDD6FE' : PALETTE.border;
          fillRoundRect(ctx, bx, cy, col4W, rh, 10, cardBg, cardBorder, 1);

          ctx.font = `700 11.5px ${FONT_FAMILY}`;
          ctx.fillStyle = isShadow ? '#6D28D9' : accent;
          ctx.fillText(`第 ${item.pos} 位 · ${item.sphere}`, bx + 11, cy + 12);

          ctx.font = `800 13.5px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textMain;
          const fnStr = typeof item.score === 'number' ? `${item.fnCode} ${item.score}%` : item.fnCode;
          ctx.fillText(fnStr, bx + col4W - 11 - ctx.measureText(fnStr).width, cy + 11);

          ctx.font = `700 13px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textMain;
          ctx.fillText(item.role, bx + 11, cy + 32);

          const txt = isShadow && item.shadowInsight ? item.shadowInsight : `${item.fnShort} — ${item.roleDesc}`;
          drawWrappedBlock(ctx, txt, bx + 11, cy + 54, col4W - 22, `400 12px ${FONT_FAMILY}`, PALETTE.textSub, 17);
        }
        cy += rh + (r === 0 ? 10 : 0);
      }
      cy += 18;

      cy += drawSubhead(ctx, '認知防衛迴圈與 Quenk 劣勢壓力復原（In the Grip）', ax, cy);
      fillRoundRect(ctx, ax, cy, halfW, lgRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
      drawInfoBox(ctx, loopTitle, loopBody, ax, cy, halfW, PALETTE.innerBox, PALETTE.border);
      fillRoundRect(ctx, ax + halfW + halfGap, cy, halfW, lgRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
      drawInfoBox(ctx, gripTitle, gripBody, ax + halfW + halfGap, cy, halfW, PALETTE.innerBox, PALETTE.border);
      cy += lgRowH;

      if (hasStep2) {
        cy += 18;
        cy += drawSubhead(ctx, 'MBTI Step II (Form Q) 二十個細分面向實測光譜', ax, cy);
        fillRoundRect(ctx, ax, cy, INNER_W, step2BannerH, 10, 'rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.28)', 1);
        drawWrappedBlock(ctx, step2BannerText, ax + 14, cy + 10, INNER_W - 28, `600 13.5px ${FONT_FAMILY}`, PALETTE.textMain, 20);
        cy += step2BannerH + 12;

        step2Facets.groups.forEach((grp, gIdx) => {
          const colIdx = gIdx % 2;
          const rowIdx = Math.floor(gIdx / 2);
          const gx = ax + colIdx * (halfW + halfGap);
          const gy = cy + rowIdx * (step2CardH + 12);
          fillRoundRect(ctx, gx, gy, halfW, step2CardH, 10, PALETTE.innerBox, PALETTE.border, 1);

          ctx.font = `700 14px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textMain;
          ctx.fillText(`${grp.dimLabel} (${grp.dimKey}) · 主偏好 ${grp.parentWinner} ${grp.parentWinnerPct}%`, gx + 14, gy + 12);

          grp.facets.forEach((f, fIdx) => {
            const fy = gy + 38 + fIdx * 29;
            ctx.font = f.isOutOfPreference ? `700 12px ${FONT_FAMILY}` : `600 12px ${FONT_FAMILY}`;
            ctx.fillStyle = f.isOutOfPreference ? '#B45309' : PALETTE.textMain;
            const label = `${f.winnerName} (${f.winnerPct}%)${f.isOutOfPreference ? ' [跨向度]' : ''}`;
            ctx.fillText(label, gx + 14, fy);

            const barX = gx + 14;
            const barY = fy + 16;
            const barW = halfW - 28;
            fillRoundRect(ctx, barX, barY, barW, 6, 3, '#ECEAE4', null);
            fillRoundRect(
              ctx,
              barX,
              barY,
              Math.max(8, (barW * f.pctA) / 100),
              6,
              3,
              f.isOutOfPreference ? '#F59E0B' : accent,
              null
            );
          });
        });
        cy += step2CardH * 2 + 12;
      }

      cy += 16;
      drawInfoBox(ctx, '參考國際心理學與類型學文獻', refsBody, ax, cy, INNER_W, PALETTE.innerBox, PALETTE.border);
    }

    return totalH;
  }

  function renderReportScene(ctx, payload, avatarImg, measureOnly) {
    const { record, profile, group, mod, ext, adv, cognitiveFunctionsMeta } = payload;
    const accent = group.color;
    const softAccent = group.softBg || 'rgba(15, 118, 110, 0.12)';

    if (!measureOnly) {
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, ctx.canvas.height);
    }

    let y = 34;

    // Top Header
    if (!measureOnly) {
      ctx.font = `700 20px ${FONT_FAMILY}`;
      ctx.fillStyle = '#0F766E';
      ctx.textBaseline = 'top';
      ctx.fillText('PrismMBTI｜五維人格與榮格八維完整分析報告', OUTER_PAD, y);

      const modeText = record.mode === 'quick' ? '快速精簡版 (30 題)' : '標準完整版 (60 題)';
      const metaRight = `${modeText} · ${formatReportDate(record.createdAt)}`;
      ctx.font = `500 15px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMuted;
      ctx.fillText(metaRight, CANVAS_WIDTH - OUTER_PAD - ctx.measureText(metaRight).width, y + 3);
    }
    y += 40;

    // 1. Hero Card
    const heroTextX = OUTER_PAD + CARD_PAD + 206 + 26;
    const heroTextW = CARD_W - CARD_PAD * 2 - 206 - 26;
    const taglineH = measureWrappedHeight(ctx, profile.tagline, heroTextW, `500 18px ${FONT_FAMILY}`, 26);
    const kwItems = profile.keywords.map((k) => `# ${k}`);
    const kwH = measureChipRowHeight(ctx, kwItems, heroTextW);
    const heroH = CARD_PAD * 2 + Math.max(206, 36 + 58 + 36 + taglineH + 12 + kwH);

    if (!measureOnly) {
      fillRoundRect(ctx, OUTER_PAD, y, CARD_W, heroH, 20, PALETTE.cardBg, PALETTE.border, 1.5);
      ctx.save();
      roundRectPath(ctx, OUTER_PAD, y, CARD_W, heroH, 20);
      ctx.clip();
      ctx.fillStyle = accent;
      ctx.fillRect(OUTER_PAD, y, CARD_W, 8);
      ctx.restore();

      const illuX = OUTER_PAD + CARD_PAD;
      const illuY = y + CARD_PAD;
      fillRoundRect(ctx, illuX, illuY, 206, 206, 18, '#FAF8F4', PALETTE.border, 2);
      if (avatarImg) {
        ctx.save();
        roundRectPath(ctx, illuX, illuY, 206, 206, 18);
        ctx.clip();
        ctx.drawImage(avatarImg, illuX, illuY, 206, 206);
        ctx.restore();
      }

      let hy = y + CARD_PAD;
      drawChipRow(ctx, [`${group.name} (${group.enName})`, `${mod.name} (${mod.enName})`], heroTextX, hy, heroTextW, softAccent, accent, 'transparent');
      hy += 38;
      ctx.font = `800 50px ${FONT_FAMILY}`;
      ctx.fillStyle = accent;
      ctx.fillText(record.fullType, heroTextX, hy);
      hy += 58;
      ctx.font = `700 25px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.fillText(`${profile.name} · ${profile.enName}`, heroTextX, hy);
      hy += 36;
      hy += drawWrappedBlock(ctx, profile.tagline, heroTextX, hy, heroTextW, `500 18px ${FONT_FAMILY}`, PALETTE.textSub, 26);
      hy += 12;
      drawChipRow(ctx, kwItems, heroTextX, hy, heroTextW, '#F1EFE9', PALETTE.textMain, PALETTE.border);
    }
    y += heroH + 20;

    // 2. Chapter 1: Traits, Psychometrics, Spectrum, Summary, Borderline & Neighbors
    const dimKeys = ['EI', 'SN', 'TF', 'JP', 'AT'];
    const execText = adv ? adv.executiveSummary : profile.summary;
    const execH = measureWrappedHeight(ctx, execText, INNER_W - 28, `400 15.5px ${FONT_FAMILY}`, 24) + 22;
    const metricsRowH = adv ? 84 : 0;
    const overviewBoxH = measureInfoBoxHeight(ctx, `${profile.code} 性格總覽與思維模式`, `${profile.summary}\n思維與決策模式：${profile.thinkingStyle}`, INNER_W);
    const borderlineText = adv && adv.psychometrics.borderlineAxes.length > 0
      ? adv.psychometrics.borderlineAxes.map((b) => `• ${b.label}（${b.nameA} ${b.pctA}% / ${b.nameB} ${b.pctB}%）：${b.explanation}`).join('\n')
      : '';
    const borderlineBoxH = borderlineText ? 14 + measureInfoBoxHeight(ctx, '邊緣均衡向度與跨類型彈性', borderlineText, INNER_W) : 0;
    const neighborText = adv && adv.psychometrics.neighborTypes.length > 0
      ? adv.psychometrics.neighborTypes.map((n) => `${n.code} ${n.name}（${n.flippedLabel}）`).join(' ｜ ')
      : '';
    const neighborBoxH = neighborText ? 14 + measureInfoBoxHeight(ctx, '最相近臨界人格參考', neighborText, INNER_W) : 0;

    const ch1H =
      CARD_PAD * 2 +
      32 + 36 +
      execH + 16 +
      (adv ? metricsRowH + 20 : 0) +
      dimKeys.length * 62 +
      10 + overviewBoxH +
      borderlineBoxH +
      neighborBoxH;

    if (!measureOnly) {
      fillRoundRect(ctx, OUTER_PAD, y, CARD_W, ch1H, 18, PALETTE.cardBg, PALETTE.border, 1.5);
      const ax = OUTER_PAD + CARD_PAD;
      let sy = y + CARD_PAD;

      sy += drawChapterBadge(ctx, 'CHAPTER 1 · 人格特徵與心理計量', ax, sy, softAccent, accent);
      ctx.font = `700 22px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.fillText('專業測評綜述與五大維度光譜', ax, sy);
      sy += 36;

      fillRoundRect(ctx, ax, sy, INNER_W, execH, 10, softAccent, null);
      ctx.fillStyle = accent;
      ctx.fillRect(ax, sy, 5, execH);
      drawWrappedBlock(ctx, execText, ax + 18, sy + 11, INNER_W - 28, `400 15.5px ${FONT_FAMILY}`, PALETTE.textMain, 24);
      sy += execH + 16;

      if (adv) {
        const mGap = 14;
        const mW = (INNER_W - mGap * 2) / 3;
        const metricItems = [
          { label: '類型分化明確度', val: `${adv.psychometrics.differentiationIndex}%`, sub: adv.psychometrics.differentiationLabel },
          { label: '題組作答一致度', val: `${adv.psychometrics.overallConsistency}%`, sub: adv.psychometrics.overallConsistency >= 75 ? '跨情境穩定一致' : '具情境調適彈性' },
          { label: '表態鮮明度 / 中立率', val: `${record.quality.extremeRate}% / ${record.quality.neutralRate}%`, sub: `明確 ${record.quality.extremeCount} 題 · 中立 ${record.quality.neutralCount} 題` }
        ];
        metricItems.forEach((m, i) => {
          const mx = ax + i * (mW + mGap);
          fillRoundRect(ctx, mx, sy, mW, metricsRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
          ctx.font = `600 13px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textMuted;
          ctx.fillText(m.label, mx + 14, sy + 12);
          ctx.font = `800 24px ${FONT_FAMILY}`;
          ctx.fillStyle = accent;
          ctx.fillText(m.val, mx + 14, sy + 32);
          ctx.font = `500 13px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textSub;
          ctx.fillText(m.sub, mx + 14, sy + 60);
        });
        sy += metricsRowH + 20;
      }

      for (const k of dimKeys) {
        const d = record.dimensions[k];
        const leftWin = d.winner === d.poleA;
        const consStr = typeof d.consistency === 'number' ? ` · 一致度 ${d.consistency}%` : '';
        const badgeText = d.isBalanced
          ? `50% / 50% 均衡邊緣${consStr}`
          : `${d.winner} ${d.winnerPct}% · ${d.clarity.label}${consStr}`;

        ctx.font = `700 15.5px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textMain;
        ctx.fillText(d.label, ax, sy);

        ctx.font = `600 13.5px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textSub;
        ctx.fillText(badgeText, ax + INNER_W - ctx.measureText(badgeText).width, sy + 1);

        const barY = sy + 24;
        const labelW = 140;
        const barX = ax + labelW + 14;
        const barW = INNER_W - (labelW + 14) * 2;
        const barH = 14;

        ctx.font = `${leftWin ? '700' : '500'} 14.5px ${FONT_FAMILY}`;
        ctx.fillStyle = leftWin ? PALETTE.textMain : PALETTE.textSub;
        ctx.fillText(`${d.nameA} ${d.pctA}%`, ax, barY - 2);

        const rightLabel = `${d.pctB}% ${d.nameB}`;
        ctx.font = `${!leftWin ? '700' : '500'} 14.5px ${FONT_FAMILY}`;
        ctx.fillStyle = !leftWin ? PALETTE.textMain : PALETTE.textSub;
        ctx.fillText(rightLabel, ax + INNER_W - ctx.measureText(rightLabel).width, barY - 2);

        fillRoundRect(ctx, barX, barY, barW, barH, 7, '#ECEAE4', null);
        const leftW = Math.max(0, (barW * d.pctA) / 100);
        ctx.save();
        roundRectPath(ctx, barX, barY, barW, barH, 7);
        ctx.clip();
        ctx.fillStyle = leftWin ? accent : '#CBD5E1';
        ctx.fillRect(barX, barY, leftW, barH);
        ctx.fillStyle = !leftWin ? accent : '#CBD5E1';
        ctx.fillRect(barX + leftW, barY, barW - leftW, barH);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(barX + barW / 2 - 1, barY, 2, barH);
        ctx.restore();

        sy += 62;
      }

      sy += 10;
      sy += drawInfoBox(ctx, `${profile.code} 性格總覽與思維模式`, `${profile.summary}\n思維與決策模式：${profile.thinkingStyle}`, ax, sy, INNER_W, PALETTE.innerBox, PALETTE.border);
      if (borderlineText) {
        sy += 14;
        sy += drawInfoBox(ctx, '邊緣均衡向度與跨類型彈性', borderlineText, ax, sy, INNER_W, PALETTE.innerBox, PALETTE.border);
      }
      if (neighborText) {
        sy += 14;
        drawInfoBox(ctx, '最相近臨界人格參考', neighborText, ax, sy, INNER_W, PALETTE.innerBox, PALETTE.border);
      }
    }
    y += ch1H + 20;

    // 3. Chapters 2–4: Career, Personal Growth, Relationships (100% Complete Content)
    if (ext && adv && adv.domainSubTraits) {
      const ch2H = renderDomainChapter(ctx, y, measureOnly, {
        badge: 'CHAPTER 2 · 你的職業道路',
        title: '職場競爭力、工作風格與職涯建議',
        intro: `${ext.career.intro} ${profile.career.style}`,
        traits: adv.domainSubTraits.career,
        sections: [
          { heading: '你的職場強項（6 大優勢）', items: ext.career.strengths6, tone: 'pos' },
          { heading: '你的職場短板（6 個需留意盲區）', items: ext.career.weaknesses6, tone: 'neg' },
          { heading: '適合你的工作風格', items: ext.career.workStyles6, tone: 'accent' },
          { heading: '你可能會喜歡的職涯建議（8 大方向）', items: ext.career.recommendedRoles8, tone: 'role' }
        ],
        extraRows: [
          {
            type: 'single',
            title: '團隊協作與領導模式',
            body: `團隊角色：${profile.leadershipAndTeam.teamRole}\n領導風格：${profile.leadershipAndTeam.leadershipStyle}\n協作叮嚀：${profile.leadershipAndTeam.collaborationTip}`
          }
        ],
        accent,
        softAccent
      });
      y += ch2H + 20;

      const ch3H = renderDomainChapter(ctx, y, measureOnly, {
        badge: 'CHAPTER 3 · 你的個人成長',
        title: '成長潛能、活力來源與能量耗損分析',
        intro: ext.growth.intro,
        traits: adv.domainSubTraits.growth,
        sections: [
          { heading: '你的成長強項', items: ext.growth.strengths6, tone: 'pos' },
          { heading: '你的成長短板', items: ext.growth.weaknesses6, tone: 'neg' },
          { heading: '什麼讓你充滿活力', items: ext.growth.energizers6, tone: 'accent' },
          { heading: '什麼讓你感到疲憊', items: ext.growth.drainers6, tone: 'neg' }
        ],
        extraRows: [
          {
            type: 'twoCol',
            left: {
              title: '壓力失衡警訊（Grip）與回血指南',
              body: `警訊：${profile.stressAndRecovery.gripSigns}\n充電：${profile.stressAndRecovery.rechargeWays}`
            },
            right: {
              title: '學習風格與日常微習慣',
              body: `學習：${profile.learningAndHabits.learningStyle}\n習慣：${profile.learningAndHabits.dailyHabit}`
            }
          },
          {
            type: 'single',
            accent: true,
            title: `${mod.name} (-${mod.code}) 自我認同調節建議`,
            body: `${mod.summary} ${mod.tips}`
          }
        ],
        accent,
        softAccent
      });
      y += ch3H + 20;

      const ch4H = renderDomainChapter(ctx, y, measureOnly, {
        badge: 'CHAPTER 4 · 你的人際關係',
        title: '情感連結、人際超能力與潛在風險',
        intro: `${ext.relationships.intro} ${profile.relationships.style}`,
        traits: adv.domainSubTraits.relationships,
        sections: [
          { heading: '你的關係強項', items: ext.relationships.strengths6, tone: 'pos' },
          { heading: '你的關係短板', items: ext.relationships.weaknesses6, tone: 'neg' },
          { heading: '你的人際關係超能力', items: ext.relationships.superpowers6, tone: 'accent' },
          { heading: '人際關係潛在風險', items: ext.relationships.risks6, tone: 'neg' }
        ],
        extraRows: [
          {
            type: 'twoCol',
            left: {
              title: '愛情觀與友情相處模式',
              body: `愛情：${profile.relationships.loveStyle}\n友情：${profile.relationships.friendshipStyle}`
            },
            right: {
              title: '衝突提醒與契合類型',
              body: `溝通叮嚀：${profile.relationships.conflictTips}\n互動契合類型：${profile.relationships.compatible.join(' / ')}｜代表原型：${profile.examples.join('、')}`
            }
          }
        ],
        accent,
        softAccent
      });
      y += ch4H + 20;
    }

    // 4. Chapter 5: Jungian 8 Functions, Radar, Dynamics, Communication Playbook & 30-Day Roadmap
    const cogEntries = Object.entries(record.cognitiveFunctions).sort((a, b) => b[1] - a[1]);
    const stackRoles = ['主導功能 Dominant', '輔助功能 Auxiliary', '第三功能 Tertiary', '劣勢功能 Inferior'];
    const stackCardH = 120;
    const radarBoxW = 280;
    const radarBoxH = 290;
    const halfGap = 14;
    const halfW = (INNER_W - halfGap) / 2;

    const dynLeftBody = adv
      ? `${adv.cognitiveDynamics.axisTensionDesc}\n內傾認知能量：${adv.cognitiveDynamics.introvertedEnergyPct}% ｜ 外傾認知能量：${adv.cognitiveDynamics.extravertedEnergyPct}%`
      : '';
    const dynLeftH = adv ? measureInfoBoxHeight(ctx, adv.cognitiveDynamics.axisTensionTitle, dynLeftBody, halfW) : 0;
    const shadowInfo = adv && adv.cognitiveDynamics.shadowStandout;
    const dynRightH = shadowInfo ? measureInfoBoxHeight(ctx, `非典型高分發展功能：${shadowInfo.code}（${shadowInfo.name} ${shadowInfo.score}%）`, shadowInfo.insight, halfW) : 0;
    const dynRowH = adv ? Math.max(dynLeftH, dynRightH) : 0;

    const commPrefH = adv ? measureInfoBoxHeight(ctx, '溝通偏好總覽', adv.communicationPlaybook.preferredStyle, INNER_W) : 0;
    const dosBody = adv ? adv.communicationPlaybook.dos.map((d) => `• ${d}`).join('\n') : '';
    const avoidsBody = adv ? adv.communicationPlaybook.avoids.map((a) => `• ${a}`).join('\n') : '';
    const commTwoH = adv ? Math.max(measureInfoBoxHeight(ctx, '最佳協作方式（Do\'s）', dosBody, halfW), measureInfoBoxHeight(ctx, '溝通避雷提醒（Avoids）', avoidsBody, halfW)) : 0;

    const roadGap = 12;
    const roadColW = (INNER_W - roadGap * 2) / 3;
    let roadH = 0;
    if (adv) {
      for (const step of adv.actionRoadmap) {
        const fH = measureWrappedHeight(ctx, step.focus, roadColW - 28, `700 14px ${FONT_FAMILY}`, 20);
        const aH = measureWrappedHeight(ctx, step.action, roadColW - 28, `400 13px ${FONT_FAMILY}`, 19);
        roadH = Math.max(roadH, 16 + 22 + fH + 8 + aH + 16);
      }
    }

    const ch5H =
      CARD_PAD * 2 +
      32 + 36 +
      stackCardH + 20 +
      radarBoxH +
      (adv ? 18 + dynRowH + 18 + measureSubheadHeight() + commPrefH + 12 + commTwoH + 18 + measureSubheadHeight() + roadH : 0);

    if (!measureOnly) {
      fillRoundRect(ctx, OUTER_PAD, y, CARD_W, ch5H, 18, PALETTE.cardBg, PALETTE.border, 1.5);
      const ax = OUTER_PAD + CARD_PAD;
      let cy = y + CARD_PAD;

      cy += drawChapterBadge(ctx, 'CHAPTER 5 · 榮格八維與行動方案', ax, cy, softAccent, accent);
      ctx.font = `700 22px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMain;
      ctx.fillText('榮格八維認知雷達與 30 天成長路線圖', ax, cy);
      cy += 36;

      const sGap = 14;
      const colW = (INNER_W - sGap * 3) / 4;
      profile.functions.forEach((fnCode, idx) => {
        const fnMeta = cognitiveFunctionsMeta[fnCode];
        const bx = ax + idx * (colW + sGap);
        fillRoundRect(ctx, bx, cy, colW, stackCardH, 12, PALETTE.innerBox, PALETTE.border, 1);
        ctx.font = `700 12px ${FONT_FAMILY}`;
        ctx.fillStyle = accent;
        ctx.fillText(stackRoles[idx], bx + 14, cy + 12);
        ctx.font = `800 24px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textMain;
        ctx.fillText(fnMeta.code, bx + 14, cy + 32);
        ctx.font = `700 15px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textMain;
        ctx.fillText(fnMeta.name, bx + 14, cy + 62);
        drawWrappedBlock(ctx, fnMeta.short, bx + 14, cy + 84, colW - 28, `400 13px ${FONT_FAMILY}`, PALETTE.textSub, 18);
      });
      cy += stackCardH + 20;

      fillRoundRect(ctx, ax, cy, radarBoxW, radarBoxH, 14, PALETTE.innerBox, PALETTE.border, 1);
      drawCanvasRadar(ctx, record.cognitiveFunctions, ax + radarBoxW / 2, cy + radarBoxH / 2, 82, accent);

      const barsX = ax + radarBoxW + 26;
      const barsW = INNER_W - radarBoxW - 26;
      cogEntries.forEach(([code, score], idx) => {
        const by = cy + idx * 36;
        const fnMeta = cognitiveFunctionsMeta[code];
        ctx.font = `700 14px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textMain;
        ctx.fillText(`${code} · ${fnMeta.name}`, barsX, by);
        const pctStr = `${score}%`;
        ctx.fillText(pctStr, barsX + barsW - ctx.measureText(pctStr).width, by);
        fillRoundRect(ctx, barsX, by + 20, barsW, 9, 4.5, '#ECEAE4', null);
        fillRoundRect(ctx, barsX, by + 20, Math.max(8, (barsW * score) / 100), 9, 4.5, accent, null);
      });
      cy += radarBoxH;

      if (adv) {
        cy += 18;
        fillRoundRect(ctx, ax, cy, halfW, dynRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
        drawInfoBox(ctx, adv.cognitiveDynamics.axisTensionTitle, dynLeftBody, ax, cy, halfW, PALETTE.innerBox, PALETTE.border);
        if (shadowInfo) {
          fillRoundRect(ctx, ax + halfW + halfGap, cy, halfW, dynRowH, 10, PALETTE.innerBox, PALETTE.border, 1);
          drawInfoBox(ctx, `非典型高分發展功能：${shadowInfo.code}（${shadowInfo.name} ${shadowInfo.score}%）`, shadowInfo.insight, ax + halfW + halfGap, cy, halfW, PALETTE.innerBox, PALETTE.border);
        }
        cy += dynRowH + 18;

        cy += drawSubhead(ctx, '專屬溝通手冊（如何與你高效合作）', ax, cy);
        cy += drawInfoBox(ctx, '溝通偏好總覽', adv.communicationPlaybook.preferredStyle, ax, cy, INNER_W, PALETTE.innerBox, PALETTE.border);
        cy += 12;
        fillRoundRect(ctx, ax, cy, halfW, commTwoH, 10, PALETTE.innerBox, PALETTE.border, 1);
        drawInfoBox(ctx, '最佳協作方式（Do\'s）', dosBody, ax, cy, halfW, PALETTE.innerBox, PALETTE.border);
        fillRoundRect(ctx, ax + halfW + halfGap, cy, halfW, commTwoH, 10, PALETTE.innerBox, PALETTE.border, 1);
        drawInfoBox(ctx, '溝通避雷提醒（Avoids）', avoidsBody, ax + halfW + halfGap, cy, halfW, PALETTE.innerBox, PALETTE.border);
        cy += commTwoH + 18;

        cy += drawSubhead(ctx, '30 天個人化成長行動路線圖', ax, cy);
        adv.actionRoadmap.forEach((step, idx) => {
          const rx = ax + idx * (roadColW + roadGap);
          fillRoundRect(ctx, rx, cy, roadColW, roadH, 10, PALETTE.innerBox, PALETTE.border, 1);
          ctx.fillStyle = accent;
          ctx.fillRect(rx, cy, roadColW, 3);
          ctx.font = `700 12px ${FONT_FAMILY}`;
          ctx.fillStyle = accent;
          ctx.fillText(step.stage, rx + 14, cy + 14);
          const fH = drawWrappedBlock(ctx, step.focus, rx + 14, cy + 36, roadColW - 28, `700 14px ${FONT_FAMILY}`, PALETTE.textMain, 20);
          drawWrappedBlock(ctx, step.action, rx + 14, cy + 36 + fH + 8, roadColW - 28, `400 13px ${FONT_FAMILY}`, PALETTE.textSub, 19);
        });
      }
    }
    y += ch5H + 20;

    // 4b. Chapter 6: International Literature Models
    if (adv && adv.literatureProfile) {
      const ch6H = renderLiteratureChapter(ctx, y, measureOnly, {
        litProfile: adv.literatureProfile,
        step2Facets: adv.step2Facets,
        accent,
        softAccent
      });
      if (ch6H > 0) {
        y += ch6H + 20;
      }
    }

    // 5. History Comparison Card (if available)
    if (adv && adv.historyDelta) {
      const deltaH = CARD_PAD * 2 + 64 + 78;
      if (!measureOnly) {
        fillRoundRect(ctx, OUTER_PAD, y, CARD_W, deltaH, 18, PALETTE.cardBg, PALETTE.border, 1.5);
        const ax = OUTER_PAD + CARD_PAD;
        let dy = y + CARD_PAD;
        ctx.font = `700 20px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textMain;
        ctx.fillText('與前一次測驗變化對比', ax, dy);
        dy += 28;
        ctx.font = `400 14px ${FONT_FAMILY}`;
        ctx.fillStyle = PALETTE.textMuted;
        ctx.fillText(`對比基準：${adv.historyDelta.prevType}（${formatReportDate(adv.historyDelta.prevDate)}）`, ax, dy);
        dy += 30;

        const dGap = 10;
        const dW = (INNER_W - dGap * 4) / 5;
        adv.historyDelta.dimShifts.forEach((s, i) => {
          const dx = ax + i * (dW + dGap);
          fillRoundRect(ctx, dx, dy, dW, 74, 10, PALETTE.innerBox, PALETTE.border, 1);
          ctx.textAlign = 'center';
          ctx.font = `500 12.5px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textMuted;
          ctx.fillText(s.label, dx + dW / 2, dy + 10);
          ctx.font = `800 16px ${FONT_FAMILY}`;
          ctx.fillStyle = PALETTE.textMain;
          ctx.fillText(`${s.curWinner} ${s.curWinnerPct}%`, dx + dW / 2, dy + 29);
          ctx.font = `600 12px ${FONT_FAMILY}`;
          ctx.fillStyle = accent;
          const arrow = s.deltaA > 0 ? `+${s.deltaA}%` : s.deltaA < 0 ? `${s.deltaA}%` : '持平';
          ctx.fillText(s.shiftedPole ? `自 ${s.prevWinner} 轉向` : `較前次 ${arrow}`, dx + dW / 2, dy + 52);
          ctx.textAlign = 'left';
        });
      }
      y += deltaH + 20;
    }

    // 6. Footer
    if (!measureOnly) {
      ctx.font = `500 14px ${FONT_FAMILY}`;
      ctx.fillStyle = PALETTE.textMuted;
      ctx.fillText(
        `PrismMBTI 完整測評報告｜中立作答率：${record.quality.neutralRate}%（${record.quality.neutralCount}/${record.quality.totalCount} 題）｜本報告僅供自我探索與溝通反思參考`,
        OUTER_PAD,
        y
      );
    }
    y += 42;

    return y;
  }

  function dataUrlToBlob(dataUrl) {
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bin = atob(parts[1]);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) {
        bytes[i] = bin.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } catch {
      return null;
    }
  }

  async function generateReportJpg(payload) {
    const avatarImg = await loadImage(payload.illustrationSrc);
    const probeCanvas = document.createElement('canvas');
    probeCanvas.width = CANVAS_WIDTH;
    probeCanvas.height = 100;
    const probeCtx = probeCanvas.getContext('2d');
    const totalHeight = renderReportScene(probeCtx, payload, avatarImg, true);

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isMobileEnv = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);

    // Render at 200% (2x -> 2400px wide) by default for Retina/print sharpness.
    // On iOS WebKit (hard 16.7M px canvas area cap), fit safely inside area & dimension limits.
    // On desktop / Android, try 200% first with clean fallback steps if a GPU caps max canvas size.
    const iosSafeScale = Math.min(2, Math.sqrt(15500000 / (CANVAS_WIDTH * totalHeight)), 7800 / totalHeight);
    let candidates = [
      2,
      Math.min(1.65, 16000 / totalHeight),
      1,
      Math.min(0.82, 7600 / totalHeight)
    ];
    if (isIOS) {
      candidates = [iosSafeScale, Math.min(0.62, 5800 / totalHeight)];
    } else if (isMobileEnv) {
      candidates = [
        2,
        Math.min(1.65, 15800 / totalHeight),
        Math.min(0.82, 7600 / totalHeight),
        Math.min(0.62, 5800 / totalHeight)
      ];
    }

    let finalCanvas = null;
    let dataUrl = '';
    let targetW = CANVAS_WIDTH * 2;
    let targetH = totalHeight * 2;

    for (const scale of candidates) {
      if (!(scale > 0)) continue;
      targetW = Math.max(1, Math.round(CANVAS_WIDTH * scale));
      targetH = Math.max(1, Math.round(totalHeight * scale));
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.save();
        ctx.scale(scale, scale);
        renderReportScene(ctx, payload, avatarImg, false);
        ctx.restore();

        const candidateUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (candidateUrl && candidateUrl.startsWith('data:image/jpeg') && candidateUrl.length > 5000) {
          finalCanvas = canvas;
          dataUrl = candidateUrl;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!finalCanvas || !dataUrl) {
      throw new Error('Failed to render JPEG canvas');
    }

    let blob = await new Promise((resolve) => {
      if (typeof finalCanvas.toBlob === 'function') {
        finalCanvas.toBlob(resolve, 'image/jpeg', 0.91);
      } else {
        resolve(null);
      }
    });
    if (!blob) {
      blob = dataUrlToBlob(dataUrl);
    }

    return {
      filename: buildExportFilename(payload.record),
      dataUrl,
      blob,
      width: targetW,
      height: targetH
    };
  }

  return {
    generateReportJpg,
    buildExportFilename
  };
}));
