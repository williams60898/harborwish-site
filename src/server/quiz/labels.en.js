// Harborwish · 六维英文极词 + 档位代码（服务器端 · 只读）
// ---------------------------------------------------------------------------
// 按维度 key 和 highPole 取英文极词，不靠匹配中文字符串。
// zh 列只供自检和 scoring.DIMENSIONS 的 low/high label 比对，不发给浏览器。
// 档位代码只进结果凭证，不上页面。
// 只许服务器端接口 import；任何页面、组件、浏览器脚本都不许 import。
// ---------------------------------------------------------------------------

export const POLE_LABELS = {
  valence: { low: { en: 'Cold', zh: '冷' }, high: { en: 'Warm', zh: '暖' } },
  energy: { low: { en: 'Low', zh: '沉' }, high: { en: 'High', zh: '烧' } },
  control: { low: { en: 'In Control', zh: '主人' }, high: { en: 'Carried Along', zh: '人质' } },
  social: { low: { en: 'Avoidant', zh: '独处' }, high: { en: 'Approaching', zh: '朝人' } },
  time: { low: { en: 'Past', zh: '回头' }, high: { en: 'Future', zh: '张望' } },
  clarity: { low: { en: 'Clear', zh: '看清' }, high: { en: 'Blurred', zh: '雾里' } },
};

/** 档位（scoring.tierOf 的返回值）→ 凭证里的单字母代码。 */
export const TIER_CODES = { 轻: 'l', 中: 'm', 重: 'h' };

/** 维度 key + 是否高分极 → 英文极词。 */
export function poleLabel(key, highPole) {
  const dim = POLE_LABELS[key];
  if (!dim) throw new Error(`unknown dimension: ${key}`);
  return (highPole ? dim.high : dim.low).en;
}

export default { POLE_LABELS, TIER_CODES, poleLabel };
