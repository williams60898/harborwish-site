// Harborwish · 原型引擎（M1 · 纯函数 · 零依赖 · 端上本地运行）
// ---------------------------------------------------------------------------
// 真相源单向：Notion 库 → JSON → 本引擎读取。引擎永不联网、不认平台、不碰 UI。
//
// 这里的 bits 用「格位约定」（第二极 = 1，也就是测评里的「高分极」）：
//   效价 P=1 / N=0 ｜ 能量 H=1 / L=0 ｜ 主导 S=1 / D=0
//   社交 A=1 / W=0 ｜ 时间 F=1 / R=0 ｜ 清晰 U=1 / C=0
// 格位 slot(1..64) = 32·效价 + 16·能量 + 8·主导 + 4·社交 + 2·时间 + 1·清晰 + 1
// 象限偏移：N·L=0 ｜ N·H=16 ｜ P·L=32 ｜ P·H=48
// 已枚举自检：64 组合 → 64 唯一格位，满配覆盖 1..64（2026-06-21）。
//
// ⚠ 注意：这套 bits 和 JSON 里每条原型自带的 archetype.bits 字段「不是同一套」。
//   archetype.bits 走的是 meta.bit_convention（掌控/时间/清晰三轴极性相反），
//   那个只给雷达图画极性用。算格位、判象限请一律用本文件这套。
// ---------------------------------------------------------------------------

export const AXES = [
  { key: 'valence', name: '效价', one: 'P', zero: 'N', weight: 32 },
  { key: 'energy',  name: '能量', one: 'H', zero: 'L', weight: 16 },
  { key: 'control', name: '主导', one: 'S', zero: 'D', weight: 8 },
  { key: 'social',  name: '社交', one: 'A', zero: 'W', weight: 4 },
  { key: 'time',    name: '时间', one: 'F', zero: 'R', weight: 2 },
  { key: 'clarity', name: '清晰', one: 'U', zero: 'C', weight: 1 },
];

// 校验 bits 是长度 6 的 0/1 数组
function assertBits(bits) {
  if (!Array.isArray(bits) || bits.length !== 6) {
    throw new Error('bits 必须是长度 6 的数组 [效价,能量,主导,社交,时间,清晰]');
  }
}

/** 6 个二值答案 → 格位 (1..64)。bits=[效价,能量,主导,社交,时间,清晰]，1=第二极（高分极）。 */
export function slotOf(bits) {
  assertBits(bits);
  let s = 1;
  for (let i = 0; i < 6; i++) s += AXES[i].weight * (bits[i] ? 1 : 0);
  return s;
}

/** 6 个二值答案 → 六字编码，如 [0,0,0,0,0,0] → "NLDWRC"。 */
export function codeOf(bits) {
  assertBits(bits);
  return AXES.map((a, i) => (bits[i] ? a.one : a.zero)).join('');
}

/** 6 个二值答案 → 所属象限标签，如 "N·L" / "P·H"。 */
export function quadrantOf(bits) {
  assertBits(bits);
  return (bits[0] ? 'P' : 'N') + '·' + (bits[1] ? 'H' : 'L');
}

/**
 * 6 个二值答案 → 原型对象。
 * archetypes 为已按 slot 升序排列的 64 行数组（archetypes[slot-1]，O(1) 命中）。
 * 命中后返回的对象会带上 JSON 里那条原型的全部字段
 * （animal / code / quadrant / dims / bits / crisis / core_line / share_tagline /
 *  verb / neighbors / compare_raw 等）。其中 code/quadrant/slot 以 JSON 为准。
 * 未传 archetypes 时只返回 { slot, code, quadrant, bits }，便于无数据时跑通流程。
 */
export function decode(bits, archetypes) {
  const slot = slotOf(bits);
  const data = archetypes && archetypes[slot - 1];
  return {
    slot,
    code: codeOf(bits),
    quadrant: quadrantOf(bits),
    bits: bits.slice(),
    ...(data || {}),
  };
}

export default { AXES, slotOf, codeOf, quadrantOf, decode };
