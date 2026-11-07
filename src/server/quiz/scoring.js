// Harborwish · 计分模块（M1 · 纯函数 · 零依赖）
// ---------------------------------------------------------------------------
// 对齐《测评题库 v1》（锁定 2026-06-26）的计分规格。
//
// 一道题 = 一个场景 + 4 个选项，从「强低分极」到「强高分极」。每个选项一律计分：
//   强〔高分极〕=3 ｜ 弱〔高分极〕=2 ｜ 弱〔低分极〕=1 ｜ 强〔低分极〕=0
// 每维随机抽 3 道，三道分数相加得 0~9。
//   过 5（≥5）偏高分极；不过 5（≤4）偏低分极。和落不到 4.5，永不打平。
//   折 0–10：sum/9×10（四舍五入到 1 位）→ 0,1.1,2.2,3.3,4.4,5.6,6.7,7.8,8.9,10.0
//   档（轻/中/重）：{4,5}=轻 ｜ {2,3,6,7}=中 ｜ {0,1,8,9}=重（可调旋钮，不影响 bit）
//
// 6 个高分极布尔 → 格位 bit（高分极=1），喂给 engine.js：
//   效价 暖P ｜ 能量 烧H ｜ 主导 人质S ｜ 社交 朝人A ｜ 时间 张望F ｜ 清晰 雾里U
// ---------------------------------------------------------------------------

import { decode, AXES } from './engine.js';

// 六维「人话标签」表（顺序同 engine.AXES：效价/能量/主导/社交/时间/清晰）
// low = 低分极（bit 0）；high = 高分极（bit 1）。letter 与 engine 完全一致。
export const DIMENSIONS = [
  { key: 'valence', name: '效价', low: { letter: 'N', label: '冷' }, high: { letter: 'P', label: '暖' } },
  { key: 'energy',  name: '能量', low: { letter: 'L', label: '沉' }, high: { letter: 'H', label: '烧' } },
  { key: 'control', name: '主导', low: { letter: 'D', label: '主人' }, high: { letter: 'S', label: '人质' } },
  { key: 'social',  name: '社交', low: { letter: 'W', label: '独处' }, high: { letter: 'A', label: '朝人' } },
  { key: 'time',    name: '时间', low: { letter: 'R', label: '回头' }, high: { letter: 'F', label: '张望' } },
  { key: 'clarity', name: '清晰', low: { letter: 'C', label: '看清' }, high: { letter: 'U', label: '雾里' } },
];

// 选项角色 → 分数。题库里每个选项都标了角色（〔强高〕〔弱高〕〔弱低〕〔强低〕）。
export const OPTION_SCORE = {
  strongHigh: 3, // 强〔高分极〕
  weakHigh: 2,   // 弱〔高分极〕
  weakLow: 1,    // 弱〔低分极〕
  strongLow: 0,  // 强〔低分极〕
};

/** 三道题之和(0~9) → 折 0–10 分。四舍五入 1 位。 */
export function fold(sum3) {
  return Math.round((sum3 / 9) * 10 * 10) / 10;
}

/** 三道题之和(0~9) → 档：轻/中/重。 */
export function tierOf(sum3) {
  if (sum3 === 4 || sum3 === 5) return '轻';
  if (sum3 === 0 || sum3 === 1 || sum3 === 8 || sum3 === 9) return '重';
  return '中';
}

/** 三道题之和(0~9) → 是否偏高分极（≥5）。 */
export function isHighPole(sum3) {
  return sum3 >= 5;
}

/**
 * 单维结算：传入该维抽中的 3 个选项分数 → 完整结果对象。
 * @param {object} dim DIMENSIONS 里的一项
 * @param {number[]} optionScores 长度 3，每个 0~3
 */
export function scoreDimension(dim, optionScores) {
  if (!Array.isArray(optionScores) || optionScores.length !== 3) {
    throw new Error(`${dim.name} 需要恰好 3 道题的分数`);
  }
  const sum = optionScores.reduce((a, b) => a + b, 0);
  const high = isHighPole(sum);
  const pole = high ? dim.high : dim.low;
  return {
    key: dim.key,
    name: dim.name,
    sum,                 // 0~9
    folded: fold(sum),   // 0~10
    tier: tierOf(sum),   // 轻/中/重
    highPole: high,      // true=偏高分极
    bit: high ? 1 : 0,   // 格位 bit（高分极=1）
    letter: pole.letter, // 该维取的字母，如 'P' / 'N'
    poleLabel: pole.label, // 人话，如 '暖' / '冷'
  };
}

/**
 * 全测评结算：传入 6 维各自抽中的 3 题分数 → 原型 + 六维明细。
 * @param {object} scoresByKey 形如 { valence:[3,2,3], energy:[...], ... } 六维齐全
 * @param {Array} archetypes 64 原型数组（按 slot 升序），用于命中具体原型
 * @returns {{ bits, slot, code, quadrant, dims, archetype }}
 */
export function computeResult(scoresByKey, archetypes) {
  const dims = DIMENSIONS.map((dim) => {
    const arr = scoresByKey[dim.key];
    if (!arr) throw new Error(`缺少 ${dim.name}(${dim.key}) 的答题分数`);
    return scoreDimension(dim, arr);
  });
  // bits 顺序严格按 engine.AXES（效价/能量/主导/社交/时间/清晰）
  const bits = dims.map((d) => d.bit);
  const decoded = decode(bits, archetypes); // 含 slot/code/quadrant + 命中原型全字段
  return {
    bits,
    slot: decoded.slot,
    code: decoded.code,
    quadrant: decoded.quadrant,
    dims,            // 六维明细（含 folded 折分，给雷达用）
    archetype: decoded, // 命中的原型对象（animal/share_tagline/crisis/neighbors...）
  };
}

export default {
  DIMENSIONS,
  OPTION_SCORE,
  fold,
  tierOf,
  isHighPole,
  scoreDimension,
  computeResult,
};
