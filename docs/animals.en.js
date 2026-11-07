// Harborwish · 64 mood animals · English names (server-side only)
// ---------------------------------------------------------------------------
// ANIMALS_EN[slot - 1]，按格位 1–64 升序，供 scoring.computeResult(scoresByKey, ANIMALS_EN) 命中。
// 来源：《Harborwish_64动物_英文全文_按格位_2026-11-01_去编码》每只的标题行（格位、英文名、编码、slug）
//       和免费章开头的副标题行；名字和副标题与 Notion《英文版地基三件套 v1》第一节 64 行逐字一致。
// 只改了标点：直撇号和单引号换成印刷体（’ ‘），共 14 条副标题。
// name ＝ 解读版名，结果页和网页一律用它；梗卡名不进本表。
// code ＝ 内部编码（与 engine.js 的字母一致：主导 D 低分极 / S 高分极），只供服务器端自检，绝不发给浏览器。
// 只许服务器端接口 import；任何页面、组件、浏览器脚本都不许 import。
// ---------------------------------------------------------------------------

export const ANIMALS_EN = [
  { slot: 1, slug: "snow-leopard", name: "The Gazing Snow Leopard", tagline: "Sees everything, touches nothing.", code: "N·L·D·W·R·C" },
  { slot: 2, slug: "polar-bear", name: "The Ice-Keeping Polar Bear", tagline: "Guards the ice that already melted.", code: "N·L·D·W·R·U" },
  { slot: 3, slug: "gray-wolf", name: "The Roaming Gray Wolf", tagline: "Knows the way, walks it alone.", code: "N·L·D·W·F·C" },
  { slot: 4, slug: "camel", name: "The Laden Camel", tagline: "Never says tired, never sets it down.", code: "N·L·D·W·F·U" },
  { slot: 5, slug: "elephant", name: "The Remembering Elephant", tagline: "Remembers everyone who left, keeps going back.", code: "N·L·D·A·R·C" },
  { slot: 6, slug: "humpback", name: "The Deep-Diving Humpback", tagline: "Sings a song too deep to fathom.", code: "N·L·D·A·R·U" },
  { slot: 7, slug: "brown-bear", name: "The Reaching Brown Bear", tagline: "Warm inside, frightening at the edges.", code: "N·L·D·A·F·C" },
  { slot: 8, slug: "moose", name: "The Fog-Treading Moose", tagline: "Walks on through the fog, unsure anyone waits.", code: "N·L·D·A·F·U" },
  { slot: 9, slug: "hermit-crab", name: "The Borrowed-Shell Hermit Crab", tagline: "Every home borrowed, none to keep.", code: "N·L·S·W·R·C" },
  { slot: 10, slug: "manatee", name: "The Sinking Manatee", tagline: "Sinks to the bottom, and can’t say why.", code: "N·L·S·W·R·U" },
  { slot: 11, slug: "wild-goose", name: "The Straggling Wild Goose", tagline: "Sees the flock, and can’t catch up.", code: "N·L·S·W·F·C" },
  { slot: 12, slug: "ostrich", name: "The Head-Burying Ostrich", tagline: "Buries its head so it won’t come true.", code: "N·L·S·W·F·U" },
  { slot: 13, slug: "british-shorthair", name: "The Listless British Shorthair", tagline: "Won’t fuss, won’t fight — just don’t go.", code: "N·L·S·A·R·C" },
  { slot: 14, slug: "akita", name: "The Waiting Akita", tagline: "Still waiting — not yet knowing he won’t return.", code: "N·L·S·A·R·U" },
  { slot: 15, slug: "stray-cat", name: "The Longing Stray Cat", tagline: "Knows no one may come, and hopes anyway.", code: "N·L·S·A·F·C" },
  { slot: 16, slug: "jellyfish", name: "The Drifting Jellyfish", tagline: "Carried by the current, never once its own.", code: "N·L·S·A·F·U" },
  { slot: 17, slug: "scorpion", name: "The Grudge-Bearing Scorpion", tagline: "Hurt me once, I’ll remember for life.", code: "N·H·D·W·R·C" },
  { slot: 18, slug: "wasp", name: "The Hair-Trigger Wasp", tagline: "Stings first — remembers how much last time hurt.", code: "N·H·D·W·R·U" },
  { slot: 19, slug: "rattlesnake", name: "The Warning Rattlesnake", tagline: "Rattles loud so it won’t have to bite.", code: "N·H·D·W·F·C" },
  { slot: 20, slug: "pufferfish", name: "The Startled Pufferfish", tagline: "Puffs into spines, and no one dares come close.", code: "N·H·D·W·F·U" },
  { slot: 21, slug: "swan", name: "The Poised Swan", tagline: "Effortless above, paddling for its life below.", code: "N·H·D·A·R·C" },
  { slot: 22, slug: "goose", name: "The Door-Blocking Goose", tagline: "The more it fears you’ll leave, the fiercer it gets.", code: "N·H·D·A·R·U" },
  { slot: 23, slug: "german-shepherd", name: "The On-Duty German Shepherd", tagline: "Never heard the word: stand down, you can rest.", code: "N·H·D·A·F·C" },
  { slot: 24, slug: "bull", name: "The Charging Bull", tagline: "Charges blind, sees the wreckage only after.", code: "N·H·D·A·F·U" },
  { slot: 25, slug: "octopus", name: "The Ruminating Octopus", tagline: "Sees it all clearly, can change none of it.", code: "N·H·S·W·R·C" },
  { slot: 26, slug: "squirrel", name: "The Jittery Squirrel", tagline: "Hoards ‘enough,’ never tastes a crumb of it.", code: "N·H·S·W·R·U" },
  { slot: 27, slug: "meerkat", name: "The Sentry Meerkat", tagline: "Its hardest task is believing it’s safe now.", code: "N·H·S·W·F·C" },
  { slot: 28, slug: "hedgehog", name: "The Bristling Hedgehog", tagline: "Every spine, an unspoken hug.", code: "N·H·S·W·F·U" },
  { slot: 29, slug: "goldfish", name: "The Voiceless Goldfish", tagline: "Screams ‘don’t go,’ and not one word gets through.", code: "N·H·S·A·R·C" },
  { slot: 30, slug: "kitten", name: "The Clinging Kitten", tagline: "Clings tight, afraid you’ll vanish like the last.", code: "N·H·S·A·R·U" },
  { slot: 31, slug: "chihuahua", name: "The Trembling Chihuahua", tagline: "Barks loudest, most afraid of being left.", code: "N·H·S·A·F·C" },
  { slot: 32, slug: "bee", name: "The Ceaseless Bee", tagline: "Can’t stop, and can’t say what for.", code: "N·H·S·A·F·U" },
  { slot: 33, slug: "panda", name: "The Boundary-Keeping Panda", tagline: "Gentle with everyone, until you cross the line.", code: "P·L·D·W·R·C" },
  { slot: 34, slug: "tiger", name: "The Languid Tiger", tagline: "Not weak, just done spending strength on the unworthy.", code: "P·L·D·W·R·U" },
  { slot: 35, slug: "capybara", name: "The Unflappable Capybara", tagline: "Sky could fall; it finishes its tea first.", code: "P·L·D·W·F·C" },
  { slot: 36, slug: "rhino", name: "The Thick-Skinned Rhino", tagline: "The hide keeps out the hurt, and everyone else.", code: "P·L·D·W·F·U" },
  { slot: 37, slug: "horse", name: "The Trail-Wise Horse", tagline: "Guides everyone home, led by no one.", code: "P·L·D·A·R·C" },
  { slot: 38, slug: "seal", name: "The Lazing Seal", tagline: "So comfortable it never noticed it stopped moving.", code: "P·L·D·A·R·U" },
  { slot: 39, slug: "great-dane", name: "The Careful Great Dane", tagline: "So big, so careful — afraid its strength will hurt someone.", code: "P·L·D·A·F·C" },
  { slot: 40, slug: "walrus", name: "The Basking Walrus", tagline: "Close enough is close enough — why get any nearer?", code: "P·L·D·A·F·U" },
  { slot: 41, slug: "sloth", name: "The Unhurried Sloth", tagline: "Not lazy — saving all its battery to love you.", code: "P·L·S·W·R·C" },
  { slot: 42, slug: "koala", name: "The Tree-Clinging Koala", tagline: "Not sleeping much — being awake just hurts.", code: "P·L·S·W·R·U" },
  { slot: 43, slug: "snail", name: "The Shell-Shy Snail", tagline: "Slow and shy, but never once stopped.", code: "P·L·S·W·F·C" },
  { slot: 44, slug: "seahorse", name: "The Coasting Seahorse", tagline: "At ease in the current, its own way forgotten.", code: "P·L·S·W·F·U" },
  { slot: 45, slug: "ragdoll", name: "The Melting Ragdoll", tagline: "Hands over all its trust, melts into your arms.", code: "P·L·S·A·R·C" },
  { slot: 46, slug: "golden-shorthair", name: "The Soft-Hearted Golden Shorthair", tagline: "A little kindness melts it; it never notices the slights.", code: "P·L·S·A·R·U" },
  { slot: 47, slug: "penguin", name: "The Faithful Penguin", tagline: "Stakes its whole life on one safe return.", code: "P·L·S·A·F·C" },
  { slot: 48, slug: "lamb", name: "The Flock-Following Lamb", tagline: "Follows the flock, its own road long lost.", code: "P·L·S·A·F·U" },
  { slot: 49, slug: "cheetah", name: "The Sprinting Cheetah", tagline: "Races only its old self, and finishes alone.", code: "P·H·D·W·R·C" },
  { slot: 50, slug: "hummingbird", name: "The Darting Hummingbird", tagline: "Too fast to be caught, too fast to get anywhere.", code: "P·H·D·W·R·U" },
  { slot: 51, slug: "eagle", name: "The High-Flying Eagle", tagline: "Flies highest, sees farthest, and flies alone.", code: "P·H·D·W·F·C" },
  { slot: 52, slug: "husky", name: "The House-Wrecking Husky", tagline: "Makes chaos to hide it has no direction.", code: "P·H·D·W·F·U" },
  { slot: 53, slug: "lion", name: "The Reigning Lion", tagline: "Adored by all, kin to none.", code: "P·H·D·A·R·C" },
  { slot: 54, slug: "parrot", name: "The Shape-Shifting Parrot", tagline: "Becomes anyone you like, forgets its own face.", code: "P·H·D·A·R·U" },
  { slot: 55, slug: "golden-retriever", name: "The Whole-Hearted Golden Retriever", tagline: "Gives its whole heart, hoping to be loved back the same.", code: "P·H·D·A·F·C" },
  { slot: 56, slug: "border-collie", name: "The Eager-to-Please Border Collie", tagline: "Does everything perfectly, never sure it’s enough.", code: "P·H·D·A·F·U" },
  { slot: 57, slug: "peacock", name: "The Fanning Peacock", tagline: "Dazzles for everyone, folds the fan alone.", code: "P·H·S·W·R·C" },
  { slot: 58, slug: "dragonfly", name: "The Skimming Dragonfly", tagline: "Skims the surface, never truly lands.", code: "P·H·S·W·R·U" },
  { slot: 59, slug: "groundhog", name: "The Half-Out Groundhog", tagline: "Pokes its head out, already planning the retreat.", code: "P·H·S·W·F·C" },
  { slot: 60, slug: "butterfly", name: "The Flitting Butterfly", tagline: "Sips every flower, and stays on none.", code: "P·H·S·W·F·U" },
  { slot: 61, slug: "corgi", name: "The Bustling Corgi", tagline: "Helps with everything, just to be taken along.", code: "P·H·S·A·R·C" },
  { slot: 62, slug: "swallow", name: "The Homing Swallow", tagline: "Brings back the spring, fearing the nest is empty.", code: "P·H·S·A·R·U" },
  { slot: 63, slug: "dolphin", name: "The Beaming Dolphin", tagline: "Hands joy to everyone — who catches it when it falls?", code: "P·H·S·A·F·C" },
  { slot: 64, slug: "monkey", name: "The Restless Monkey", tagline: "Touches everything, holds nothing.", code: "P·H·S·A·F·U" },
];

export default ANIMALS_EN;
