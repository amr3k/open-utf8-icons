/**
 * Religious-glyph curation for the dataset extraction pipeline.
 *
 * The directory is intentionally religion-neutral apart from a small Islamic
 * set: `☪` STAR AND CRESCENT, `🕋` KAABA and `🕌` MOSQUE are kept, while the
 * distinct religious symbols, buildings, figures and cosmological signs of
 * every other tradition are dropped at generation time.
 *
 * Only glyphs whose Unicode identity *is* the religious symbol are listed
 * here. Generic shapes that merely resemble one — `⛑` HELMET WITH WHITE CROSS
 * (first aid), `🕊` DOVE OF PEACE, `🙏` PERSON WITH FOLDED HANDS, `📿` PRAYER
 * BEADS, `🧿` NAZAR AMULET, `🧘` PERSON IN LOTUS POSITION, `⚛` ATOM SYMBOL —
 * stay, because they carry secular, wellness or Islamicate everyday meaning.
 * Country flags are geography, not iconography, so `🇻🇦` VATICAN CITY stays.
 */

/** Islamic glyphs the dataset must always keep. */
export const ISLAMIC_CODEPOINTS: ReadonlySet<number> = new Set([
  0x262a, // ☪ STAR AND CRESCENT
  0x1f54b, // 🕋 KAABA
  0x1f54c, // 🕌 MOSQUE
]);

/**
 * Code points excluded from the dataset, grouped by the tradition they belong
 * to. The grouping is documentation only; extraction flattens it below.
 */
export const EXCLUDED_RELIGIOUS_CODEPOINTS: Readonly<
  Record<string, readonly number[]>
> = {
  Christianity: [
    0x2626, // ☦ ORTHODOX CROSS
    0x2627, // ☧ CHI RHO
    0x2628, // ☨ CROSS OF LORRAINE
    0x2629, // ☩ CROSS OF JERUSALEM
    0x2670, // ♰ WEST SYRIAC CROSS
    0x2671, // ♱ EAST SYRIAC CROSS
    0x26ea, // ⛪ CHURCH
    0x26e8, // ⛨ BLACK CROSS ON SHIELD
    0x2719, // ✙ OUTLINED GREEK CROSS
    0x271a, // ✚ HEAVY GREEK CROSS
    0x271b, // ✛ OPEN CENTRE CROSS
    0x271c, // ✜ HEAVY OPEN CENTRE CROSS
    0x271d, // ✝ LATIN CROSS
    0x271e, // ✞ SHADOWED WHITE LATIN CROSS
    0x271f, // ✟ OUTLINED LATIN CROSS
    0x2720, // ✠ MALTESE CROSS
    0x1f540, // 🕀 CIRCLED CROSS POMMEE
    0x1f541, // 🕁 CROSS POMMEE WITH HALF-CIRCLE BELOW
    0x1f542, // 🕂 CROSS POMMEE
    0x1f546, // 🕆 WHITE LATIN CROSS
    0x1f547, // 🕇 HEAVY LATIN CROSS
    0x1f548, // 🕈 CELTIC CROSS
    0x1f900, // 🤀 CIRCLED CROSS FORMEE WITH FOUR DOTS
    0x1f901, // 🤁 CIRCLED CROSS FORMEE WITH TWO DOTS
    0x1f902, // 🤂 CIRCLED CROSS FORMEE
    0x1f47c, // 👼 BABY ANGEL
    0x1f607, // 😇 SMILING FACE WITH HALO
  ],
  Judaism: [
    0x2721, // ✡ STAR OF DAVID
    0x1f52f, // 🔯 SIX POINTED STAR WITH MIDDLE DOT
    0x1f54d, // 🕍 SYNAGOGUE
    0x1f54e, // 🕎 MENORAH WITH NINE BRANCHES
  ],
  Buddhism: [
    0x2638, // ☸ WHEEL OF DHARMA
    0x1f6d4, // 🛔 PAGODA
  ],
  Hinduism: [
    0x1f549, // 🕉 OM SYMBOL
    0x1f6d5, // 🛕 HINDU TEMPLE
  ],
  Sikhism: [
    0x262c, // ☬ ADI SHAKTI
    0x1faaf, // 🪯 KHANDA
  ],
  Taoism: [
    0x262f, // ☯ YIN YANG
    0x2630, // ☰ TRIGRAM FOR HEAVEN
    0x2631, // ☱ TRIGRAM FOR LAKE
    0x2632, // ☲ TRIGRAM FOR FIRE
    0x2633, // ☳ TRIGRAM FOR THUNDER
    0x2634, // ☴ TRIGRAM FOR WIND
    0x2635, // ☵ TRIGRAM FOR WATER
    0x2636, // ☶ TRIGRAM FOR MOUNTAIN
    0x2637, // ☷ TRIGRAM FOR EARTH
    0x268a, // ⚊ MONOGRAM FOR YANG
    0x268b, // ⚋ MONOGRAM FOR YIN
    0x268c, // ⚌ DIGRAM FOR GREATER YANG
    0x268d, // ⚍ DIGRAM FOR LESSER YIN
    0x268e, // ⚎ DIGRAM FOR LESSER YANG
    0x268f, // ⚏ DIGRAM FOR GREATER YIN
  ],
  Shinto: [
    0x26e9, // ⛩ SHINTO SHRINE
  ],
  Zoroastrianism: [
    0x262b, // ☫ FARSI SYMBOL
  ],
  /** Ancient Egyptian religion — still a popular decorative sign. */
  "Ancient Egypt": [
    0x2625, // ☥ ANKH
  ],
  /** Not tied to one tradition; generic worship rather than Islam-specific. */
  "Generic worship": [
    0x1f6d0, // 🛐 PLACE OF WORSHIP
  ],
};

/** Flattened lookup used by the extraction pipeline. */
export const EXCLUDED_RELIGIOUS_LOOKUP: ReadonlySet<number> = new Set(
  Object.values(EXCLUDED_RELIGIOUS_CODEPOINTS).flat(),
);

/** True when any code point of a glyph is an excluded non-Islamic religious sign. */
export function isExcludedReligiousGlyph(
  codepoints: readonly number[],
): boolean {
  return codepoints.some((cp) => EXCLUDED_RELIGIOUS_LOOKUP.has(cp));
}
