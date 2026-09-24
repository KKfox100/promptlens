'use strict';

/**
 * PromptLens 示例图渲染器
 * ------------------------------------------------------------------
 * 术语是普通人理解 Prompt 最大的门槛：「浅景深」「侧逆光」「莫兰迪色系」
 * 「三分构图」—— 这些词对专业的人是常识，对其他人是天书。
 *
 * 所以这里用参数化的 SVG 画同一个场景：只改一个参数，画面就跟着变。
 * 每个选项旁边放一对「未选 / 选了」的缩略图，用户不需要看懂术语，
 * 看一眼就知道这个选择意味着什么。
 *
 * 为什么是 SVG 而不是位图：不需要任何图片资源、不依赖网络、
 * 任意尺寸都清晰、体积极小，而且完全可测试（同样的参数必然产出同样的图）。
 *
 * 图层结构：背景（天空 / 地面 / 远景 / 光束）与前景（主体 / 投影 / 运镜标注）
 * 分开画，这样「浅景深」可以直接把整层背景模糊掉。
 */

(function (root) {
  /* ================================================================ *
   * 一、基础工具
   * ================================================================ */

  let seq = 0;
  /** SVG 里的 id 必须全局唯一，否则多个缩略图会互相污染 */
  const uid = (p) => p + (seq += 1).toString(36);

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function hexToRgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
      parseInt(h.slice(0, 2), 16) || 0,
      parseInt(h.slice(2, 4), 16) || 0,
      parseInt(h.slice(4, 6), 16) || 0,
    ];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(hsl) {
    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const conv = (t) => {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    return [conv(h + 1 / 3) * 255, conv(h) * 255, conv(h - 1 / 3) * 255];
  }

  /** 变亮 / 变暗，t>0 变亮，t<0 变暗 */
  function shade(hex, t) {
    const hsl = rgbToHsl(hexToRgb(hex));
    hsl[2] = clamp(hsl[2] + t, 0, 1);
    return rgbToHex(hslToRgb(hsl));
  }

  /** 调整饱和度，t<0 变灰 */
  function sat(hex, t) {
    const hsl = rgbToHsl(hexToRgb(hex));
    hsl[1] = clamp(hsl[1] * (1 + t), 0, 1);
    return rgbToHex(hslToRgb(hsl));
  }

  /** 两个颜色按比例混合 */
  function mix(a, b, t) {
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    return rgbToHex([0, 1, 2].map((i) => ra[i] + (rb[i] - ra[i]) * t));
  }

  /** 往暖色 / 冷色偏 */
  function tint(hex, dir, t) {
    if (!t) return hex;
    return dir === 'warm' ? mix(hex, '#ffb066', t)
      : dir === 'cool' ? mix(hex, '#6aa9e0', t)
        : hex;
  }

  /* ================================================================ *
   * 二、场景参数
   * ================================================================ */

  /** 画幅比例 → viewBox 尺寸（统一高度 100，宽度按比例） */
  const RATIOS = {
    '1:1': [100, 100],
    '4:5': [80, 100],
    '3:4': [75, 100],
    '2:3': [67, 100],
    '9:16': [56, 100],
    '3:2': [150, 100],
    '16:9': [178, 100],
    '21:9': [233, 100],
  };

  /** 景别：主体占画面的高度比例 + 脚底位置（超过 1 表示被画框裁掉） */
  const SHOTS = {
    /**
     * default 不是任何一个选项，它代表「用户没提景别时模型自己给的取景」。
     * 有它，「中景 / 全景」这种相邻景别的对比图才不会退化成「没变」——
     * 未选时是一个不远不近的镜头，选了才落到具体的景别上。
     */
    default: { h: 0.325, feet: 0.76, label: '默认取景' },
    extreme: { h: 0.10, feet: 0.62, label: '大远景' },
    wide: { h: 0.24, feet: 0.68, label: '全景' },
    medium: { h: 0.44, feet: 0.80, label: '中景' },
    close: { h: 0.80, feet: 1.14, label: '近景' },
    cu: { h: 1.40, feet: 1.62, label: '特写' },
    macro: { h: 2.30, feet: 2.45, label: '极特写' },
  };

  /** 视角：地平线高度、主体缩放、旋转 */
  const ANGLES = {
    /** 同 SHOTS.default：用户没提视角时，模型给的是一个略低于人眼的高度 */
    default: { horizon: 0.68, scale: 1.08, yScale: 1.05, rotate: 0 },
    eye: { horizon: 0.58, scale: 1.00, yScale: 1.00, rotate: 0 },
    low: { horizon: 0.76, scale: 1.16, yScale: 1.10, rotate: 0 },
    high: { horizon: 0.34, scale: 0.84, yScale: 0.90, rotate: 0 },
    dutch: { horizon: 0.58, scale: 1.00, yScale: 1.00, rotate: -9 },
    aerial: { horizon: 0.20, scale: 0.58, yScale: 0.86, rotate: 0 },
    pov: { horizon: 0.64, scale: 1.12, yScale: 1.00, rotate: 0, foreground: true },
    over: { horizon: 0.56, scale: 1.60, yScale: 1.00, rotate: 0, offsetX: 0.62 },
  };

  /** 色彩方案 */
  const PALETTES = {
    natural: { sky: ['#cfe3f5', '#eef4fa'], ground: '#b3c39f', subject: '#4c5666', accent: '#f2c14e' },
    warm: { sky: ['#ffd9a0', '#ffb26b'], ground: '#c98b4b', subject: '#5a3a22', accent: '#ff9f43' },
    cool: { sky: ['#9fc7e8', '#5f86b8'], ground: '#3f5a78', subject: '#243447', accent: '#7fd4ff' },
    neon: { sky: ['#2b1055', '#7b4fd6'], ground: '#150c28', subject: '#0d0618', accent: '#ff2fb9' },
    morandi: { sky: ['#ddd7cd', '#c6c1b8'], ground: '#a9a396', subject: '#6b6660', accent: '#b9a48c' },
    mono: { sky: ['#e0e0e0', '#c4c4c4'], ground: '#9c9c9c', subject: '#414141', accent: '#efefef' },
    bw: { sky: ['#eaeaea', '#adadad'], ground: '#8a8a8a', subject: '#242424', accent: '#ffffff' },
    faded: { sky: ['#e8ddca', '#cdc0a7'], ground: '#a99c84', subject: '#6c6257', accent: '#d9c7a3' },
    contrast: { sky: ['#ff7a18', '#af002d'], ground: '#320a28', subject: '#0b0614', accent: '#00e5ff' },
    // 冷暖双色：天空暖、地面冷，两种色相在一张图里对撞
    dual: { sky: ['#ffd6a5', '#ff9f5a'], ground: '#33506e', subject: '#1e2c42', accent: '#7fd4ff' },
    bright: { sky: ['#ffffff', '#eaf3fb'], ground: '#dbe6f0', subject: '#8d9aa8', accent: '#ffffff' },
  };

  /**
   * 风格处理。每一项都是对基础画面的「改动量」，不是完全不同的画法 ——
   * 这样保证无论什么风格，用户看到的都是同一个场景，只对比处理方式的差别。
   */
  const STYLES = {
    /**
     * none 是「什么都没做」的原始画面。它必须存在，而且必须真的什么都不做 ——
     * 否则「写实摄影」这类选项的对比图会变成「未选 = 摄影，选了 = 摄影」，
     * 用户看不出自己选了什么。
     */
    none: {},
    photo: { grain: 0.12, sat: 0.10, contrast: 1.18, vignette: 0.18, clarity: true },
    cinema: { grain: 0.10, vignette: 0.36, sat: -0.12, letterbox: 0.07 },
    jp: { bright: 0.22, sat: -0.12, contrast: 0.82 },
    ink: { paper: true, ink: true, rough: 2.2 },
    '3d': { specular: true, sat: 0.10, dofBoost: 0.25, ao: true, bright: 0.05 },
    cyber: { neon: true, vignette: 0.34, grain: 0.04 },
    film: { grain: 0.30, vignette: 0.50, sat: -0.18, warm: 0.24 },
    flat: { flatFill: true, outline: 1.5, sat: 0.12 },
    oil: { rough: 3.0, sat: 0.22, grain: 0.06, canvas: 1 },
    concept: { rough: 2.2, sat: -0.08, vignette: 0.40, haze: 1, glow2: true },
    pixel: { pixel: true },
    vapor: { vapor: true },
    // 视频类
    documentary: { grain: 0.14, sat: -0.10, contrast: 1.06 },
    ad: { sat: 0.12, vignette: 0.14, bright: 0.06, dofBoost: 0.25, specular: true, ao: true },
    anime: { flatFill: true, outline: 1.7, sat: 0.32 },
    stopmotion: { rough: 2.6, grain: 0.20, sat: 0.05, brush: 0.55 },
    vhs: { grain: 0.42, sat: -0.28, vignette: 0.44 },
  };

  const BASE = {
    ratio: '3:2',
    shot: 'medium',
    angle: 'eye',
    lightDir: 'front',
    lightSoft: 0.55,
    lightTemp: 'neutral',
    key: 'normal',
    contrast: 0.5,
    palette: 'natural',
    style: 'none',
    dof: 0.18,
    grain: 0,
    rim: 0,
    rays: 0,
    glow: 0,
    move: '',
    backdrop: false,
    studio: false,
    horizonDetail: true,
    posX: 0.5,        // 主体横向位置，构图题靠它体现「居中 / 三分 / 留白」
    guides: '',       // 构图引导线：rule 三分 / symmetry 对称 / blank 留白区
    smear: 0,         // 长曝光拖影
    detail: 0,        // 前景细节密度
    fit: 'slice',     // 画幅题要用 meet，才看得见画框形状本身的变化
  };

  /* ================================================================ *
   * 三、场景绘制
   * ================================================================ */

  /** 主体：一个简化的人形。所有维度都在它身上体现得最清楚。 */
  const FIGURE_HEIGHT = 44;

  function figurePaths() {
    return [
      { d: 'M 0 -37 m -6.2 0 a 6.2 6.2 0 1 0 12.4 0 a 6.2 6.2 0 1 0 -12.4 0', part: 'head' },
      { d: 'M -2 -31.6 h 4 v 3.4 h -4 z', part: 'neck' },
      { d: 'M -7.6 -28.2 L 7.6 -28.2 L 5.4 -11 L -5.4 -11 Z', part: 'torso' },
      { d: 'M -10.2 -27.6 h 2.9 v 15.4 h -2.9 z', part: 'arm' },
      { d: 'M 7.3 -27.6 h 2.9 v 15.4 h -2.9 z', part: 'arm' },
      { d: 'M -5.2 -11 h 3.7 v 11 h -3.7 z', part: 'leg' },
      { d: 'M 1.5 -11 h 3.7 v 11 h -3.7 z', part: 'leg' },
    ];
  }

  /** 确定性伪随机：同一份参数必须画出同一张图，否则测试无法比对 */
  function prng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function lightVector(dir) {
    switch (dir) {
      case 'side': return { x: -0.92, y: -0.34 };
      case 'sideR': return { x: 0.92, y: -0.34 };
      case 'back': return { x: 0.10, y: -0.98 };
      case 'top': return { x: 0.0, y: -1.0 };
      default: return { x: -0.22, y: -0.96 };
    }
  }

  function render(rawParams) {
    const p = Object.assign({}, BASE, rawParams || {});
    const dims = RATIOS[p.ratio] || RATIOS['3:2'];
    const W = dims[0];
    const H = dims[1];
    const st = STYLES[p.style] || STYLES.none;
    const angle = ANGLES[p.angle] || ANGLES.eye;
    const shot = SHOTS[p.shot] || SHOTS.medium;

    /* ---- 颜色推导：调色板 → 色温 → 影调 → 风格 ---- */
    const pal = PALETTES[p.palette] || PALETTES.natural;
    const temp = p.lightTemp === 'warm' ? 0.26 : p.lightTemp === 'cool' ? 0.24 : 0;
    const tempDir = p.lightTemp === 'warm' ? 'warm' : p.lightTemp === 'cool' ? 'cool' : 'neutral';
    const palSat = (st.sat || 0);

    let skyTop = sat(tint(pal.sky[0], tempDir, temp), palSat);
    let skyBot = sat(tint(pal.sky[1], tempDir, temp), palSat);
    let ground = sat(tint(pal.ground, tempDir, temp * 0.7), palSat);
    let subject = sat(tint(pal.subject, tempDir, temp * 0.5), palSat);
    let accent = sat(pal.accent, palSat);

    if (st.warm) {
      skyTop = mix(skyTop, '#ffb066', st.warm);
      skyBot = mix(skyBot, '#ffb066', st.warm);
      ground = mix(ground, '#c98b4b', st.warm);
      subject = mix(subject, '#5a3a22', st.warm);
    }

    /* 影调：暗调 / 高调必须一眼能分辨，所以不只提亮压暗，
       而是同时改天空、地面和主体的明度，再补一层色彩混合 */
    const keyLift = p.key === 'high' ? 0.30 : 0;
    const keyDrop = p.key === 'low' ? 0.30 : 0;
    const bright = (st.bright || 0) + keyLift;

    skyTop = shade(skyTop, bright * 0.55 - keyDrop * 0.55);
    skyBot = shade(skyBot, bright * 0.42 - keyDrop * 0.48);
    ground = shade(ground, bright * 0.30 - keyDrop * 0.52);
    subject = shade(subject, bright * 0.20 - keyDrop * 0.30);

    if (p.key === 'low') {
      // 暗调：整体压向深色，只留一点亮部
      skyTop = mix(skyTop, '#04060b', 0.28);
      skyBot = mix(skyBot, '#04060b', 0.36);
      ground = mix(ground, '#04060b', 0.32);
      subject = mix(subject, '#0a0d14', 0.20);
    } else if (p.key === 'high') {
      // 高调：整体提亮，画面里几乎不留黑
      skyTop = mix(skyTop, '#ffffff', 0.34);
      skyBot = mix(skyBot, '#ffffff', 0.40);
      ground = mix(ground, '#ffffff', 0.28);
      subject = mix(subject, '#ffffff', 0.16);
    }

    if (st.paper) {
      // 水墨：纸底 + 墨色
      skyTop = '#f8f5ee';
      skyBot = '#efe9dd';
      ground = '#e6ddcc';
      subject = '#2b2b2b';
      accent = '#8c8377';
    }
    if (st.neon) {
      skyTop = mix(skyTop, '#2b1055', 0.55);
      skyBot = mix(skyBot, '#7b4fd6', 0.35);
      ground = mix(ground, '#150c28', 0.6);
      subject = mix(subject, '#0d0618', 0.7);
      accent = '#ff2fb9';
    }
    if (st.vapor) {
      skyTop = '#ffb6e6';
      skyBot = '#7b5bd6';
      ground = '#2a1b4d';
      subject = '#1a1030';
      accent = '#ff6ec7';
    }

    const soft = clamp(p.lightSoft, 0, 1);
    const hard = 1 - soft;                       // 硬光程度
    const studio = p.studio ? 1 : 0;             // 影棚布光：主光 / 补光比拉大
    const contrast = clamp(p.contrast + (st.contrast ? st.contrast - 1 : 0), 0, 1.4);
    const lv = lightVector(p.lightDir);
    const isBack = p.lightDir === 'back';

    /* ---- 画布 ---- */
    const defs = [];
    const bg = [];   // 背景层：浅景深会整层模糊
    const fg = [];   // 前景层：主体与标注，始终保持清晰
    const id = {
      sky: uid('sky'), subj: uid('sub'), vig: uid('vig'), shadow: uid('sh'),
      grain: uid('gr'), rough: uid('ro'), glow: uid('gl'), blur: uid('bl'),
      key: uid('ky'), haze: uid('hz'), ao: uid('ao'),
    };

    const horizonY = H * angle.horizon;

    /* 天空渐变 */
    defs.push(
      '<linearGradient id="' + id.sky + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="' + skyTop + '"/>'
      + '<stop offset="100%" stop-color="' + skyBot + '"/>'
      + '</linearGradient>'
    );

    /* 主体明暗：光从哪来，哪边就亮 */
    const gx = lv.x * 0.5 + 0.5;
    const gy = lv.y * 0.5 + 0.5;
    const lit = shade(subject, 0.24 + contrast * 0.18 + hard * 0.14 + studio * 0.14);
    const dark = isBack ? shade(subject, -0.34)
      : shade(subject, -0.08 - contrast * 0.20 - hard * 0.18 - studio * 0.12);
    /**
     * 明暗交界的位置决定「光硬不硬」：
     * 硬光 → 亮部占满，然后急速翻到暗部（转折点靠前）
     * 柔光 → 从亮到暗一路慢慢过渡（转折点靠后）
     */
    const midStop = isBack ? 30 : Math.round(24 + soft * 46);
    defs.push(
      '<linearGradient id="' + id.subj + '" x1="' + gx.toFixed(3) + '" y1="' + (1 - gy).toFixed(3)
      + '" x2="' + (1 - gx).toFixed(3) + '" y2="' + gy.toFixed(3) + '">'
      + '<stop offset="0%" stop-color="' + lit + '"/>'
      + '<stop offset="' + midStop + '%" stop-color="'
      + (isBack ? dark : mix(lit, dark, 0.55)) + '"/>'
      + '<stop offset="100%" stop-color="' + dark + '"/>'
      + '</linearGradient>'
    );

    /* ---------- 背景层 ---------- */
    if (p.backdrop || p.studio) {
      // 影棚无缝背景：没有地平线，只有一块会衰减的背景纸
      if (p.studio) {
        /* 背景纸上的光斑：灯打在哪，哪里就亮。
           这一点很关键 —— 只换背景不换打光的话，用户看不出「影棚布光」到底改了什么。 */
        const cx = clamp(0.5 + lv.x * 0.34, 0.08, 0.92) * W;
        const cy = clamp(0.5 + lv.y * 0.30, 0.06, 0.94) * H;
        defs.push('<radialGradient id="' + id.key + '" cx="' + cx.toFixed(2) + '" cy="'
          + cy.toFixed(2) + '" r="' + (H * 0.98).toFixed(2) + '" gradientUnits="userSpaceOnUse">'
          + '<stop offset="0%" stop-color="' + shade(skyBot, 0.36) + '"/>'
          + '<stop offset="52%" stop-color="' + skyBot + '"/>'
          + '<stop offset="100%" stop-color="' + shade(skyTop, -0.24) + '"/></radialGradient>');
        bg.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + id.key + ')"/>');
        // 灯具本身：画面上缘一个柔光箱的亮斑
        defs.push('<radialGradient id="' + id.haze + '" cx="50%" cy="50%" r="50%">'
          + '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>'
          + '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>');
        bg.push('<ellipse cx="' + (W * clamp(0.5 + lv.x * 0.44, 0.1, 0.9)).toFixed(2) + '" cy="'
          + (H * 0.10).toFixed(2) + '" rx="' + (W * 0.24).toFixed(2) + '" ry="'
          + (H * 0.15).toFixed(2) + '" fill="url(#' + id.haze + ')"/>');
      } else {
        bg.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + id.sky + ')"/>');
      }
    } else if (st.pixel) {
      // 像素风稍后整幅重绘，这里只铺底色
      bg.push('<rect x="0" y="0" width="' + W + '" height="' + horizonY.toFixed(2)
        + '" fill="' + skyBot + '"/>');
      bg.push('<rect x="0" y="' + horizonY.toFixed(2) + '" width="' + W + '" height="'
        + (H - horizonY).toFixed(2) + '" fill="' + ground + '"/>');
    } else {
      bg.push('<rect x="0" y="0" width="' + W + '" height="' + horizonY.toFixed(2)
        + '" fill="url(#' + id.sky + ')"/>');
      bg.push('<rect x="0" y="' + horizonY.toFixed(2) + '" width="' + W + '" height="'
        + (H - horizonY).toFixed(2) + '" fill="' + ground + '"/>');

      if (st.vapor) {
        // 蒸汽波：地平线上一个带横纹的落日 + 透视网格
        const sunR = H * 0.16;
        const sunCx = W * 0.5;
        const sunCy = horizonY - sunR * 0.35;
        defs.push('<clipPath id="' + id.glow + 'c"><circle cx="' + sunCx + '" cy="' + sunCy
          + '" r="' + sunR + '"/></clipPath>');
        bg.push('<circle cx="' + sunCx + '" cy="' + sunCy + '" r="' + sunR + '" fill="#ffd166"/>');
        for (let i = 0; i < 6; i += 1) {
          const y = sunCy + sunR * 0.1 + i * (sunR * 0.28);
          bg.push('<rect x="' + (sunCx - sunR) + '" y="' + y.toFixed(2) + '" width="' + (sunR * 2).toFixed(2)
            + '" height="' + (1.6 + i * 0.9).toFixed(2) + '" fill="' + skyBot
            + '" clip-path="url(#' + id.glow + 'c)"/>');
        }
        for (let i = 0; i < 7; i += 1) {
          const t = i / 6;
          const y = horizonY + (H - horizonY) * t * t;
          bg.push('<line x1="0" y1="' + y.toFixed(2) + '" x2="' + W + '" y2="' + y.toFixed(2)
            + '" stroke="' + accent + '" stroke-width="0.5" opacity="'
            + (0.5 - t * 0.3).toFixed(2) + '"/>');
        }
        for (let i = -3; i <= 3; i += 1) {
          bg.push('<line x1="' + (W / 2 + i * W * 0.14).toFixed(2) + '" y1="' + horizonY.toFixed(2)
            + '" x2="' + (W / 2 + i * W * 0.75).toFixed(2) + '" y2="' + H
            + '" stroke="' + accent + '" stroke-width="0.5" opacity="0.4"/>');
        }
      } else if (p.horizonDetail) {
        // 远景山脊：给「景别」和「视角」一个可参照的距离感
        const ridge = H * 0.10;
        bg.push('<path d="M 0 ' + horizonY.toFixed(2)
          + ' L ' + (W * 0.16).toFixed(2) + ' ' + (horizonY - ridge).toFixed(2)
          + ' L ' + (W * 0.30).toFixed(2) + ' ' + (horizonY - ridge * 0.42).toFixed(2)
          + ' L ' + (W * 0.52).toFixed(2) + ' ' + (horizonY - ridge * 0.82).toFixed(2)
          + ' L ' + (W * 0.72).toFixed(2) + ' ' + (horizonY - ridge * 0.30).toFixed(2)
          + ' L ' + W + ' ' + (horizonY - ridge * 0.62).toFixed(2)
          + ' L ' + W + ' ' + horizonY.toFixed(2) + ' Z" fill="'
          + shade(skyBot, -0.10) + '" opacity="0.75"/>');
      }
    }

    /* 光线的可见形态：丁达尔光束 */
    if (p.rays) {
      const lx = W * (0.5 + lv.x * 0.45);
      const ly = Math.max(0, H * (0.5 + lv.y * 0.5));
      const rg = uid('ray');
      const gs = uid('gs');
      // 光束从光源往地面淡出，越远越淡
      defs.push('<linearGradient id="' + rg + '" gradientUnits="userSpaceOnUse" x1="0" y1="'
        + ly.toFixed(2) + '" x2="0" y2="' + H + '">'
        + '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>'
        + '<stop offset="55%" stop-color="#ffffff" stop-opacity="0.2"/>'
        + '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>');
      // 光源本体：一个过曝的亮斑
      defs.push('<radialGradient id="' + gs + '" cx="50%" cy="50%" r="50%">'
        + '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>'
        + '<stop offset="55%" stop-color="#ffffff" stop-opacity="0.32"/>'
        + '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>');
      bg.push('<ellipse cx="' + lx.toFixed(2) + '" cy="' + ly.toFixed(2) + '" rx="'
        + (W * 0.15).toFixed(2) + '" ry="' + (H * 0.15).toFixed(2)
        + '" fill="url(#' + gs + ')"/>');
      for (let i = 0; i < 7; i += 1) {
        const spread = (i - 3) * W * 0.075;
        const wide = W * 0.045 * (1 + Math.abs(i - 3) * 0.25);
        bg.push('<polygon points="' + lx.toFixed(2) + ',' + ly.toFixed(2) + ' '
          + (lx + spread - wide).toFixed(2) + ',' + H + ' '
          + (lx + spread + wide).toFixed(2) + ',' + H
          + '" fill="url(#' + rg + ')"/>');
      }
    }

    /* 霓虹：地面上的彩色反光（属于环境，跟随背景一起虚化） */
    if (st.neon || p.glow) {
      defs.push('<filter id="' + id.glow + '" x="-40%" y="-40%" width="180%" height="180%">'
        + '<feGaussianBlur stdDeviation="' + (H * 0.045).toFixed(2) + '"/></filter>');
      bg.push('<ellipse cx="' + (W * 0.24).toFixed(2) + '" cy="'
        + (horizonY + (H - horizonY) * 0.55).toFixed(2) + '" rx="' + (W * 0.20).toFixed(2)
        + '" ry="' + (H * 0.10).toFixed(2) + '" fill="' + accent
        + '" opacity="0.42" filter="url(#' + id.glow + ')"/>');
      bg.push('<ellipse cx="' + (W * 0.76).toFixed(2) + '" cy="'
        + (horizonY + (H - horizonY) * 0.72).toFixed(2) + '" rx="' + (W * 0.16).toFixed(2)
        + '" ry="' + (H * 0.08).toFixed(2)
        + '" fill="#00e5ff" opacity="0.34" filter="url(#' + id.glow + ')"/>');
    }

    /* 概念艺术：环境大气 —— 一层横扫画面的雾 + 主体背后的一束光 */
    if (st.haze) {
      const hz = uid('hz2');
      const hzCol = mix(skyTop, '#ffffff', 0.5);
      defs.push('<linearGradient id="' + hz + '" x1="0" y1="0" x2="0" y2="1">'
        + '<stop offset="0%" stop-color="' + hzCol + '" stop-opacity="0.88"/>'
        + '<stop offset="100%" stop-color="' + hzCol + '" stop-opacity="0"/></linearGradient>');
      bg.push('<rect x="0" y="' + (horizonY * 0.08).toFixed(2) + '" width="' + W + '" height="'
        + (H * 0.48).toFixed(2) + '" fill="url(#' + hz + ')"/>');
    }
    if (st.glow2) {
      const gl = uid('gl2');
      defs.push('<radialGradient id="' + gl + '" cx="50%" cy="50%" r="50%">'
        + '<stop offset="0%" stop-color="' + mix(accent, '#ffffff', 0.45) + '" stop-opacity="0.8"/>'
        + '<stop offset="100%" stop-color="' + accent + '" stop-opacity="0"/></radialGradient>');
      bg.push('<ellipse cx="' + (W * 0.5).toFixed(2) + '" cy="' + (horizonY * 0.94).toFixed(2)
        + '" rx="' + (W * 0.30).toFixed(2) + '" ry="' + (H * 0.24).toFixed(2)
        + '" fill="url(#' + gl + ')"/>');
    }

    /* 浅景深：整层背景模糊，主体保持清晰 —— 这就是「背景虚化」的直观表达 */
    const dof = clamp(p.dof + (st.dofBoost || 0), 0, 1);
    let bgGroup = '<g>' + bg.join('') + '</g>';
    if (dof > 0.02) {
      defs.push('<filter id="' + id.blur + '" x="-12%" y="-12%" width="124%" height="124%">'
        + '<feGaussianBlur stdDeviation="' + (dof * H * 0.055).toFixed(2) + '"/></filter>');
      bgGroup = '<g filter="url(#' + id.blur + ')">' + bg.join('') + '</g>';
    }

    /* ---------- 前景层：主体 ---------- */
    const figH = H * shot.h * angle.scale;
    const s = figH / FIGURE_HEIGHT;
    const feetY = H * shot.feet;
    const baseX = W * (p.posX != null ? p.posX : (angle.offsetX || 0.5));
    const groundAt = Math.min(horizonY, feetY);

    /* 地面投影：光越硬，影子越长、越黑、边缘越锐 —— 这是「硬光 / 柔光」最直观的差别。
       形状用「脚边宽、远端窄」的楔形而不是椭圆：椭圆在缩略图里会变成一根横条，
       看着像贴纸，楔形才像是从人脚下铺出去的。 */
    if (!st.paper && (!p.backdrop || p.studio)) {
      const shadowBlur = (0.30 + soft * 5.2) * (H / 100) * 2.0;
      const shadowOpacity = clamp(0.12 + contrast * 0.38 + hard * 0.26, 0, 0.78) * (isBack ? 0.5 : 1);
      defs.push('<filter id="' + id.shadow + '" x="-40%" y="-900%" width="180%" height="1900%">'
        + '<feGaussianBlur stdDeviation="' + shadowBlur.toFixed(2) + '"/></filter>');

      // 影棚里主体离背景纸很近，影子拖不长
      const shLen = figH * (p.studio ? 0.36 : 0.22 + hard * 0.80) * (isBack ? 0.4 : 1);
      const shDir = isBack ? -0.2 : (lv.x < -0.5 ? 1 : lv.x > 0.5 ? -1 : 0.55);
      const shEnd = baseX + shLen * shDir;
      const w0 = figH * (0.19 + hard * 0.05);
      const w1 = w0 * 0.42;
      const t0 = figH * 0.05;
      const t1 = figH * 0.014;
      const sg = uid('sg');
      defs.push('<linearGradient id="' + sg + '" gradientUnits="userSpaceOnUse" x1="'
        + baseX.toFixed(2) + '" y1="0" x2="' + shEnd.toFixed(2) + '" y2="0">'
        + '<stop offset="0%" stop-color="#000000" stop-opacity="' + shadowOpacity.toFixed(3) + '"/>'
        + '<stop offset="100%" stop-color="#000000" stop-opacity="0"/></linearGradient>');
      fg.push('<path d="M ' + (baseX - w0).toFixed(2) + ' ' + (groundAt - t0).toFixed(2)
        + ' L ' + (baseX + w0).toFixed(2) + ' ' + (groundAt - t0).toFixed(2)
        + ' L ' + (shEnd + w1).toFixed(2) + ' ' + (groundAt + t1).toFixed(2)
        + ' L ' + (shEnd - w1).toFixed(2) + ' ' + (groundAt + t1).toFixed(2)
        + ' Z" fill="url(#' + sg + ')" filter="url(#' + id.shadow + ')"/>');
      // 影棚：脚边接触阴影收得很紧，否则主体像浮在背景纸前面
      if (p.studio) {
        fg.push('<ellipse cx="' + baseX.toFixed(2) + '" cy="' + groundAt.toFixed(2) + '" rx="'
          + (figH * 0.20).toFixed(2) + '" ry="' + (figH * 0.045).toFixed(2)
          + '" fill="#000000" opacity="0.38" filter="url(#' + id.shadow + ')"/>');
      }
    }

    // 3D 渲染：接触阴影（环境光遮蔽），让主体真的「站」在地上
    if (st.ao && !st.pixel) {
      fg.push('<ellipse cx="' + baseX.toFixed(2) + '" cy="' + groundAt.toFixed(2) + '" rx="'
        + (figH * 0.20).toFixed(2) + '" ry="' + (figH * 0.045).toFixed(2)
        + '" fill="#000000" opacity="0.44"/>');
    }

    const parts = figurePaths();
    const fig = [];
    parts.forEach((pt) => {
      // 扁平插画：整块纯色，不做明暗过渡
      fig.push('<path d="' + pt.d + '" fill="' + (st.flatFill ? subject : 'url(#' + id.subj + ')') + '"/>');
      if (st.outline) {
        fig.push('<path d="' + pt.d + '" fill="none" stroke="' + shade(subject, -0.45)
          + '" stroke-width="' + (st.outline / s).toFixed(2) + '" stroke-linejoin="round"/>');
      }
      if (st.specular) {
        // 3D 渲染：明确的镜面高光，材质感基本靠它
        if (pt.part === 'head') {
          fig.push('<ellipse cx="-2.1" cy="-39.8" rx="2.5" ry="1.6" fill="#ffffff" opacity="0.72"/>');
        } else if (pt.part === 'torso') {
          fig.push('<path d="M -5.4 -27.6 L -2.2 -27.6 L -3.6 -16 L -5.8 -16 Z" fill="#ffffff" opacity="0.26"/>');
        } else if (pt.part === 'arm') {
          fig.push('<rect x="-9.9" y="-27.2" width="1.2" height="12.4" fill="#ffffff" opacity="0.22"/>');
        }
      }
      if (st.ink) {
        fig.push('<path d="' + pt.d + '" fill="none" stroke="#1b1b1b" stroke-width="'
          + (1.1 / s).toFixed(2) + '" opacity="0.85"/>');
      }
    });

    /* 逆光：主体压暗 + 边缘亮线（轮廓光） */
    if (isBack || p.rim) {
      const rimW = (isBack ? 1.6 : 1.2) / s;
      fig.push('<g>' + parts.map((pt) => '<path d="' + pt.d + '" fill="none" stroke="'
        + (isBack ? mix(lit, '#ffffff', 0.5) : accent) + '" stroke-width="' + rimW.toFixed(2)
        + '" opacity="' + (isBack ? 0.95 : 0.8) + '"/>').join('') + '</g>');
      if (isBack) {
        fig.push('<g>' + parts.map((pt) => '<path d="' + pt.d + '" fill="'
          + shade(subject, -0.42) + '" opacity="0.72"/>').join('') + '</g>');
      }
    }

    if (st.pixel) {
      fg.push(pixelScene(W, H, horizonY, skyTop, skyBot, ground, subject, baseX, feetY, figH));
    } else {
      fg.push('<g transform="translate(' + baseX.toFixed(2) + ' ' + feetY.toFixed(2) + ') scale('
        + s.toFixed(3) + ' ' + (s * angle.yScale).toFixed(3) + ')">' + fig.join('') + '</g>');
    }

    /* 运镜示意：静态图用取景框 + 箭头表达「镜头怎么动」 */
    if (p.move) fg.push(moveOverlay(p.move, W, H, accent));

    /* 长曝光：运动的元素被拉成水平拖影 */
    if (p.smear) {
      const rnd = prng(4242);
      const n = Math.round(26 * p.smear);
      for (let i = 0; i < n; i += 1) {
        const y = H * (0.10 + rnd() * 0.84);
        const len = W * (0.12 + rnd() * 0.42);
        fg.push('<rect x="' + (rnd() * W - len * 0.3).toFixed(1) + '" y="' + y.toFixed(1)
          + '" width="' + len.toFixed(1) + '" height="' + (0.8 + rnd() * 1.8).toFixed(1)
          + '" rx="1" fill="' + (rnd() > 0.5 ? '#ffffff' : shade(accent, 0.1)) + '" opacity="'
          + (0.10 + rnd() * 0.20).toFixed(2) + '"/>');
      }
    }

    /* 构图引导线：把「三分法」「对称」这种抽象规则直接画出来，比解释快得多 */
    if (p.guides) {
      const gs = 'stroke="' + accent + '" stroke-width="0.6" fill="none" opacity="0.78" '
        + 'stroke-dasharray="3 2.5"';
      if (p.guides === 'rule') {
        fg.push('<path d="M ' + (W / 3).toFixed(2) + ' 0 L ' + (W / 3).toFixed(2) + ' ' + H
          + ' M ' + (W * 2 / 3).toFixed(2) + ' 0 L ' + (W * 2 / 3).toFixed(2) + ' ' + H
          + ' M 0 ' + (H / 3).toFixed(2) + ' L ' + W + ' ' + (H / 3).toFixed(2)
          + ' M 0 ' + (H * 2 / 3).toFixed(2) + ' L ' + W + ' ' + (H * 2 / 3).toFixed(2)
          + '" ' + gs + '/>');
        [[1, 1], [2, 1], [1, 2], [2, 2]].forEach(([cx, cy]) => {
          fg.push('<circle cx="' + (W * cx / 3).toFixed(2) + '" cy="' + (H * cy / 3).toFixed(2)
            + '" r="1.7" fill="none" stroke="' + accent + '" stroke-width="0.6" opacity="0.9"/>');
        });
      } else if (p.guides === 'symmetry') {
        fg.push('<path d="M ' + (W / 2).toFixed(2) + ' 0 L ' + (W / 2).toFixed(2) + ' ' + H
          + ' M 0 ' + (H / 2).toFixed(2) + ' L ' + W + ' ' + (H / 2).toFixed(2) + '" ' + gs + '/>');
        fg.push('<path d="M ' + (W * 0.30).toFixed(2) + ' ' + (H * 0.86).toFixed(2) + ' L '
          + (W / 2).toFixed(2) + ' ' + (H * 0.30).toFixed(2) + ' L ' + (W * 0.70).toFixed(2) + ' '
          + (H * 0.86).toFixed(2) + '" ' + gs + '/>');
      } else if (p.guides === 'blank') {
        const bx = W * 0.06;
        const by = H * 0.14;
        const bw = W * 0.42;
        const bh = H * 0.34;
        fg.push('<rect x="' + bx.toFixed(2) + '" y="' + by.toFixed(2) + '" width="' + bw.toFixed(2)
          + '" height="' + bh.toFixed(2) + '" rx="2" ' + gs + '/>');
        fg.push('<path d="M ' + (bx + bw * 0.12).toFixed(2) + ' ' + (by + bh * 0.34).toFixed(2)
          + ' L ' + (bx + bw * 0.80).toFixed(2) + ' ' + (by + bh * 0.34).toFixed(2) + ' M '
          + (bx + bw * 0.12).toFixed(2) + ' ' + (by + bh * 0.58).toFixed(2) + ' L '
          + (bx + bw * 0.62).toFixed(2) + ' ' + (by + bh * 0.58).toFixed(2) + '" stroke="' + accent
          + '" stroke-width="0.7" opacity="0.6" stroke-linecap="round"/>');
      }
    }

    /* 前景细节：给「高细节」一个看得见的东西 —— 地面上的碎石与草叶 */
    if (p.detail) {
      const rnd = prng(7717);
      const n = Math.round(90 * p.detail);
      const span = Math.max(1, H - horizonY);
      for (let i = 0; i < n; i += 1) {
        const x = rnd() * W;
        const t = 0.12 + rnd() * 0.86;
        const y = horizonY + span * t;
        const hgt = (1.4 + rnd() * 2.6) * (H / 100) * (0.55 + t);
        fg.push('<path d="M ' + x.toFixed(1) + ' ' + y.toFixed(1) + ' l '
          + (rnd() * 1.6 - 0.8).toFixed(2) + ' ' + (-hgt).toFixed(2) + '" stroke="'
          + (rnd() > 0.45 ? shade(ground, -0.26) : shade(ground, 0.18)) + '" stroke-width="'
          + (0.45 + rnd() * 0.5).toFixed(2) + '" opacity="' + (0.32 + rnd() * 0.32).toFixed(2)
          + '" stroke-linecap="round"/>');
      }
    }

    /* 油画 / 厚涂：画布肌理。
       做法是用湍流噪声生成一层起伏，再用漫反射把它「打光」成凹凸的颜料堆叠 ——
       比逐笔画笔触便宜得多（一个 filter 顶几百个矩形），而且放大缩小都成立。 */
    if (st.canvas) {
      const cv = uid('cv');
      defs.push('<filter id="' + cv + '" x="0" y="0" width="100%" height="100%">'
        /* 横向频率低、纵向频率高 → 噪声被拉成横向条纹，看起来才像一笔一笔刷上去的，
           两个方向都给同样的频率只会得到一片砂纸。 */
        + '<feTurbulence type="fractalNoise" baseFrequency="0.007 0.052" numOctaves="4" seed="11" result="t"/>'
        + '<feDiffuseLighting in="t" lighting-color="#ffffff" surfaceScale="5" '
        + 'diffuseConstant="1.15" result="l">'
        + '<feDistantLight azimuth="232" elevation="52"/></feDiffuseLighting>'
        + '</filter>');
      fg.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" filter="url(#' + cv
        + ')" opacity="' + clamp(0.30 * st.canvas, 0, 0.55).toFixed(2)
        + '" style="mix-blend-mode:multiply"/>');
    }

    /* 厚涂笔触：位置由固定种子决定，保证同一份参数永远画出同一张图 */
    if (st.brush) {
      const rnd = prng(20260918);
      const cols = [shade(skyBot, 0.14), skyTop, ground, shade(subject, 0.26), subject, accent];
      const n = Math.round(74 * st.brush);
      for (let i = 0; i < n; i += 1) {
        const x = rnd() * W;
        const y = rnd() * H;
        /* 笔触必须够宽够长才读得出来。缩略图只有一百多像素宽，
           细笔触会缩成一层噪点，反而像是画糊了。 */
        const len = (8 + rnd() * 15) * (H / 100);
        const th = (2.6 + rnd() * 3.0) * (H / 100);
        const rot = (rnd() * 30 - 15).toFixed(1);
        fg.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + len.toFixed(1)
          + '" height="' + th.toFixed(1) + '" rx="' + (th * 0.5).toFixed(1) + '" fill="'
          + cols[Math.floor(rnd() * cols.length)] + '" opacity="' + (0.10 + rnd() * 0.16).toFixed(2)
          + '" transform="rotate(' + rot + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>');
      }
    }

    /* 影调：暗角 + 高调提亮 */
    const vigStrength = (st.vignette || 0) + (p.key === 'low' ? 0.34 : 0)
      + (p.key === 'high' ? -0.24 : 0);
    if (vigStrength > 0.01) {
      defs.push('<radialGradient id="' + id.vig + '" cx="50%" cy="48%" r="72%">'
        + '<stop offset="45%" stop-color="#000000" stop-opacity="0"/>'
        + '<stop offset="100%" stop-color="#000000" stop-opacity="'
        + clamp(vigStrength, 0, 0.75).toFixed(2) + '"/></radialGradient>');
      fg.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + id.vig + ')"/>');
    }
    const highLift = (p.key === 'high' ? 0.22 : 0) + (st.bright || 0) * 0.35;
    if (highLift > 0.01) {
      fg.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#ffffff" opacity="'
        + clamp(highLift, 0, 0.3).toFixed(3) + '"/>');
    }

    /* 颗粒 */
    const grainAmt = Math.max(p.grain, st.grain || 0);
    if (grainAmt > 0.01) {
      defs.push('<filter id="' + id.grain + '" x="0" y="0" width="100%" height="100%">'
        + '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>'
        + '<feColorMatrix in="n" type="saturate" values="0"/>'
        + '</filter>');
      fg.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" filter="url(#' + id.grain
        + ')" opacity="' + clamp(grainAmt, 0, 0.5).toFixed(3) + '" style="mix-blend-mode:overlay"/>');
    }

    /* 电影感：上下黑边 */
    if (st.letterbox) {
      const bar = H * st.letterbox;
      fg.push('<rect x="0" y="0" width="' + W + '" height="' + bar.toFixed(2) + '" fill="#0a0a0a"/>');
      fg.push('<rect x="0" y="' + (H - bar).toFixed(2) + '" width="' + W + '" height="'
        + bar.toFixed(2) + '" fill="#0a0a0a"/>');
    }

    /* 粗糙边缘（油画 / 水墨 / 定格）—— 包住整幅画 */
    let content = bgGroup + '<g>' + fg.join('') + '</g>';
    if (st.rough) {
      defs.push('<filter id="' + id.rough + '" x="-8%" y="-8%" width="116%" height="116%">'
        + '<feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" result="t"/>'
        + '<feDisplacementMap in="SourceGraphic" in2="t" scale="'
        + (st.rough * H / 100 * 2).toFixed(2) + '" xChannelSelector="R" yChannelSelector="G"/></filter>');
      content = '<g filter="url(#' + id.rough + ')">' + content + '</g>';
    }

    const rotate = angle.rotate
      ? ' transform="rotate(' + angle.rotate + ' ' + (W / 2) + ' ' + (H / 2) + ')"'
      : '';

    /* 画幅题必须用 meet：否则 1:1 和 21:9 都会被拉伸填满同一个框，
       用户反而看不出「画幅变了」这件事 */
    const fit = p.fit === 'meet' ? 'xMidYMid meet' : 'xMidYMid slice';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H
      + '" preserveAspectRatio="' + fit + '" width="100%" height="100%" role="img">'
      + '<defs>' + defs.join('') + '</defs>'
      + '<g' + rotate + '>' + content + '</g>'
      + '</svg>';
  }

  /**
   * 像素风：整幅画用块状重绘。
   * 同一行里颜色相同的相邻格子会合并成一个矩形，否则一幅图要几百个 <rect>，
   * 一个问题上放十几对缩略图时体积会失控。
   */
  function pixelScene(W, H, horizonY, skyTop, skyBot, ground, subject, baseX, feetY, figH) {
    const cell = Math.max(4, Math.round(H / 14));
    const cols = Math.ceil(W / cell);
    const rows = Math.ceil(H / cell);
    const out = [];

    const colorAt = (cx, cy) => {
      const dx = cx - baseX;
      const dy = cy - (feetY - figH * 0.5);
      if (Math.abs(dx) < figH * 0.22 && Math.abs(dy) < figH * 0.5) {
        return Math.abs(dx) < figH * 0.10 && dy < -figH * 0.34 ? shade(subject, 0.20) : subject;
      }
      if (cy < horizonY) return cy < horizonY * 0.5 ? skyTop : skyBot;
      return ground;
    };

    for (let r = 0; r < rows; r += 1) {
      const cy = r * cell + cell / 2;
      let runStart = 0;
      let runColor = colorAt(cell / 2, cy);
      for (let c = 1; c <= cols; c += 1) {
        const nextColor = c < cols ? colorAt(c * cell + cell / 2, cy) : null;
        if (nextColor !== runColor) {
          out.push('<rect x="' + (runStart * cell) + '" y="' + (r * cell) + '" width="'
            + ((c - runStart) * cell) + '" height="' + cell + '" fill="' + runColor + '"/>');
          runStart = c;
          runColor = nextColor;
        }
      }
    }
    return out.join('');
  }

  /** 运镜：用「起幅 → 落幅」两个取景框 + 箭头表示 */
  function moveOverlay(move, W, H, accent) {
    const dash = 'stroke="' + accent + '" stroke-width="1.1" fill="none" opacity="0.95"';
    const arrow = 'stroke="' + accent + '" stroke-width="1.4" fill="none" opacity="0.95" '
      + 'stroke-linecap="round" stroke-linejoin="round"';
    const out = [];
    const inset = (k) => [W * k, H * k, W * (1 - k * 2), H * (1 - k * 2)];
    const midY = H / 2;

    if (move === 'static') {
      // 固定机位：四角取景标记 + 中心十字
      const c = Math.min(W, H) * 0.09;
      [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, sx, sy]) => {
        out.push('<path d="M ' + x + ' ' + (y + c * sy) + ' L ' + x + ' ' + y + ' L ' + (x + c * sx)
          + ' ' + y + '" ' + arrow + '/>');
      });
      out.push('<circle cx="' + (W / 2) + '" cy="' + midY + '" r="1.6" fill="' + accent + '"/>');
      return out.join('');
    }

    const [x1, y1, w1, h1] = inset(move === 'push' ? 0.20 : 0.08);
    const [x2, y2, w2, h2] = inset(move === 'push' ? 0.08 : move === 'pull' ? 0.24 : 0.08);
    out.push('<rect x="' + x1.toFixed(2) + '" y="' + y1.toFixed(2) + '" width="' + w1.toFixed(2)
      + '" height="' + h1.toFixed(2) + '" stroke="' + accent
      + '" stroke-width="1" fill="none" opacity="0.6" stroke-dasharray="3 3"/>');
    out.push('<rect x="' + x2.toFixed(2) + '" y="' + y2.toFixed(2) + '" width="' + w2.toFixed(2)
      + '" height="' + h2.toFixed(2) + '" stroke="' + accent
      + '" stroke-width="1.3" fill="none" opacity="0.95"/>');

    if (move === 'push' || move === 'pull') {
      const a = move === 'push' ? 1 : -1;
      out.push('<path d="M ' + (W / 2 - 7 * a).toFixed(2) + ' ' + midY + ' L ' + (W / 2 + 7 * a).toFixed(2)
        + ' ' + midY + ' M ' + (W / 2 + 2 * a).toFixed(2) + ' ' + (midY - 4) + ' L '
        + (W / 2 + 7 * a).toFixed(2) + ' ' + midY + ' L ' + (W / 2 + 2 * a).toFixed(2) + ' '
        + (midY + 4) + '" ' + arrow + '/>');
    } else if (move === 'pan') {
      out.push('<path d="M ' + (W * 0.22).toFixed(2) + ' ' + midY + ' L ' + (W * 0.78).toFixed(2)
        + ' ' + midY + ' M ' + (W * 0.72).toFixed(2) + ' ' + (midY - 4) + ' L '
        + (W * 0.78).toFixed(2) + ' ' + midY + ' L ' + (W * 0.72).toFixed(2) + ' '
        + (midY + 4) + '" ' + arrow + '/>');
    } else if (move === 'tilt') {
      out.push('<path d="M ' + (W / 2) + ' ' + (H * 0.24).toFixed(2) + ' L ' + (W / 2) + ' '
        + (H * 0.76).toFixed(2) + ' M ' + (W / 2 - 4) + ' ' + (H * 0.30).toFixed(2) + ' L '
        + (W / 2) + ' ' + (H * 0.24).toFixed(2) + ' L ' + (W / 2 + 4) + ' '
        + (H * 0.30).toFixed(2) + '" ' + arrow + '/>');
    } else if (move === 'orbit') {
      out.push('<ellipse cx="' + (W / 2) + '" cy="' + midY + '" rx="' + (W * 0.30).toFixed(2)
        + '" ry="' + (H * 0.16).toFixed(2) + '" ' + dash + ' stroke-dasharray="4 3"/>');
      out.push('<path d="M ' + (W / 2 + W * 0.30).toFixed(2) + ' ' + midY + ' l -4 -3.5 M '
        + (W / 2 + W * 0.30).toFixed(2) + ' ' + midY + ' l -4 3.5" ' + arrow + '/>');
    } else if (move === 'handheld') {
      for (let i = 0; i < 3; i += 1) {
        out.push('<path d="M ' + (W * 0.18 + i * W * 0.07).toFixed(2) + ' ' + (H * 0.20).toFixed(2)
          + ' q 3 5 0 10 q -3 5 0 10" ' + dash + ' opacity="0.7"/>');
      }
      out.push('<path d="M ' + (W * 0.30).toFixed(2) + ' ' + (H * 0.86).toFixed(2)
        + ' q 6 -4 12 0 q 6 4 12 0" ' + dash + '/>');
    } else if (move === 'crane') {
      out.push('<path d="M ' + (W * 0.24).toFixed(2) + ' ' + (H * 0.78).toFixed(2) + ' L '
        + (W * 0.24).toFixed(2) + ' ' + (H * 0.26).toFixed(2) + ' M ' + (W * 0.24 - 4).toFixed(2)
        + ' ' + (H * 0.32).toFixed(2) + ' L ' + (W * 0.24).toFixed(2) + ' ' + (H * 0.26).toFixed(2)
        + ' L ' + (W * 0.24 + 4).toFixed(2) + ' ' + (H * 0.32).toFixed(2) + '" ' + arrow + '/>');
    } else if (move === 'drone') {
      // 无人机：一条边飞边升的弧线
      out.push('<path d="M ' + (W * 0.12).toFixed(2) + ' ' + (H * 0.82).toFixed(2) + ' Q '
        + (W * 0.46).toFixed(2) + ' ' + (H * 0.80).toFixed(2) + ' ' + (W * 0.86).toFixed(2) + ' '
        + (H * 0.24).toFixed(2) + '" ' + dash + ' stroke-dasharray="4 3"/>');
      out.push('<path d="M ' + (W * 0.86).toFixed(2) + ' ' + (H * 0.24).toFixed(2) + ' l -5.5 1.5 M '
        + (W * 0.86).toFixed(2) + ' ' + (H * 0.24).toFixed(2) + ' l 1 -5.5" ' + arrow + '/>');
      out.push('<circle cx="' + (W * 0.12).toFixed(2) + '" cy="' + (H * 0.82).toFixed(2)
        + '" r="1.8" fill="' + accent + '"/>');
    } else if (move === 'pov') {
      // 第一人称：一串由远及近的脚印
      for (let i = 0; i < 5; i += 1) {
        const t = i / 4;
        const y = H * (0.60 + t * 0.32);
        const sc = 0.45 + t * 0.95;
        const x = W * (0.5 + (i % 2 ? 0.04 : -0.04));
        out.push('<ellipse cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" rx="'
          + (2.2 * sc).toFixed(2) + '" ry="' + (3.4 * sc).toFixed(2) + '" ' + dash
          + ' opacity="' + (0.9 - t * 0.35).toFixed(2) + '"/>');
      }
    } else if (move === 'track') {
      out.push('<path d="M ' + (W * 0.18).toFixed(2) + ' ' + (H * 0.88).toFixed(2) + ' L '
        + (W * 0.82).toFixed(2) + ' ' + (H * 0.88).toFixed(2) + '" ' + dash + '/>');
      out.push('<path d="M ' + (W * 0.76).toFixed(2) + ' ' + (H * 0.88 - 4) + ' L '
        + (W * 0.82).toFixed(2) + ' ' + (H * 0.88).toFixed(2) + ' L ' + (W * 0.76).toFixed(2)
        + ' ' + (H * 0.88 + 4) + '" ' + arrow + '/>');
    }
    return out.join('');
  }

  /* ================================================================ *
   * 四、导出
   * ================================================================ */

  const Scene = {
    BASE,
    RATIOS,
    SHOTS,
    ANGLES,
    PALETTES,
    STYLES,
    render,
    /** 以基础场景为底，叠加某个选项的改动 */
    withDemo: (base, demo) => render(Object.assign({}, BASE, base || {}, demo || {})),
  };

  root.PromptLensScene = Scene;
  if (typeof module !== 'undefined' && module.exports) module.exports = Scene;
})(typeof window !== 'undefined' ? window : globalThis);
