/**
 * Search keyword derivation for the dataset extraction pipeline.
 *
 * Every glyph gets name-derived keywords (lowercased words of its official
 * Unicode name, minus stopwords), enriched with a hand-curated synonym map
 * for high-value glyphs so that searching "favorite", "tick", "reload",
 * "fire" or "coffee" actually finds ★, ✓, ↻, 🔥 and ☕.
 */

import { formatCodepoints } from "./formats.js"

/** Maximum number of keywords stored per glyph (bounds payload size). */
export const MAX_KEYWORDS = 8

/** Words dropped from official names — they add search noise, not signal. */
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "from",
  "sign",
  "symbol",
])

/** Curation key for a single code point: `0x2605` → `"U+2605"`. */
function curationKey(codepoint: number): string {
  return formatCodepoints([codepoint])
}

/**
 * Hand-curated search synonyms, keyed by code point label.
 * Only lowercase terms are allowed (enforced by unit tests).
 */
const CURATED_KEYWORDS: Record<string, string[]> = {
  // Arrows & direction
  "U+2190": ["back", "previous", "return"],
  "U+2191": ["up", "top"],
  "U+2192": ["forward", "next"],
  "U+2193": ["down", "bottom"],
  "U+2194": ["horizontal", "both", "resize"],
  "U+2195": ["vertical", "both", "resize"],
  "U+21A9": ["back", "return", "enter"],
  "U+21AA": ["forward", "reply"],
  "U+21BA": ["counterclockwise", "undo", "refresh", "reload", "sync"],
  "U+21BB": ["clockwise", "redo", "refresh", "reload", "sync"],
  "U+21C4": ["swap", "exchange", "switch", "sort"],
  "U+21C5": ["swap", "switch", "sort"],
  "U+21E7": ["shift", "keyboard"],
  "U+27A1": ["forward", "next"],
  "U+2934": ["turn", "curve", "corner"],
  "U+2935": ["turn", "curve", "corner"],
  "U+2B05": ["back", "previous"],
  "U+2B06": ["up", "top"],
  "U+2B07": ["down", "bottom"],
  "U+2B95": ["fast", "forward"],

  // Math
  "U+2200": ["forall", "every"],
  "U+2205": ["empty", "null", "void", "none"],
  "U+2208": ["element", "member", "contained"],
  "U+2209": ["not", "element", "member"],
  "U+220F": ["product", "multiply", "pi"],
  "U+2211": ["sum", "sigma", "total"],
  "U+2212": ["minus", "subtract", "negative"],
  "U+221A": ["sqrt", "root", "radical"],
  "U+221E": ["infinity", "forever", "unlimited"],
  "U+2227": ["and", "logical", "conjunction"],
  "U+2228": ["or", "logical", "disjunction"],
  "U+2229": ["intersection", "and", "overlap"],
  "U+222A": ["union", "or", "merge"],
  "U+222B": ["integral", "calculus"],
  "U+2248": ["approximately", "almost", "about", "approx"],
  "U+2260": ["not", "equal", "different", "neq"],
  "U+2261": ["identical", "exact", "equivalent"],
  "U+2264": ["less", "smaller", "lte"],
  "U+2265": ["greater", "bigger", "gte"],
  "U+226A": ["much", "less"],
  "U+226B": ["much", "greater"],
  "U+2286": ["subset", "contained"],
  "U+2287": ["superset", "contains"],
  "U+00AC": ["not", "negation", "logic"],
  "U+00B1": ["plus", "minus", "positive", "negative", "plusminus"],
  "U+00D7": ["multiply", "times", "product", "close"],
  "U+00F7": ["divide", "division", "obelus"],

  // Currency
  "U+0024": ["dollar", "usd", "money", "price", "currency"],
  "U+00A2": ["cent", "money", "currency"],
  "U+00A3": ["pound", "sterling", "gbp", "money", "british"],
  "U+00A4": ["currency", "generic", "money"],
  "U+00A5": ["yen", "yuan", "jpy", "cny", "money"],
  "U+20A8": ["rupee", "money"],
  "U+20A9": ["won", "krw", "korean", "money"],
  "U+20AA": ["shekel", "sheqel", "ils", "israeli", "money"],
  "U+20AB": ["dong", "vnd", "vietnamese", "money"],
  "U+20AC": ["euro", "eur", "money"],
  "U+20AE": ["tugrik", "mongolian", "money"],
  "U+20B1": ["peso", "php", "philippine", "money"],
  "U+20B2": ["guarani", "pyg", "money"],
  "U+20B4": ["hryvnia", "uah", "ukrainian", "money"],
  "U+20B5": ["cedi", "ghs", "money"],
  "U+20B8": ["tenge", "kzt", "kazakh", "money"],
  "U+20B9": ["rupee", "inr", "indian", "money"],
  "U+20BA": ["lira", "turkish", "try", "money"],
  "U+20BB": ["manat", "azn", "azeri", "money"],
  "U+20BC": ["lari", "georgian", "gel", "money"],
  "U+20BD": ["ruble", "rouble", "rub", "russian", "money"],
  "U+20BF": ["bitcoin", "btc", "crypto", "money"],

  // Letterlike & legal signs
  "U+00A7": ["section", "paragraph", "legal"],
  "U+00A9": ["copyright", "rights", "c"],
  "U+00AE": ["registered", "trademark", "rights", "r"],
  "U+00B0": ["degree", "temperature", "angle"],
  "U+00B5": ["micro", "mu"],
  "U+2103": ["celsius", "temperature", "centigrade"],
  "U+2105": ["care", "of", "mail"],
  "U+2109": ["fahrenheit", "temperature"],
  "U+2116": ["numero", "number", "no"],
  "U+2117": ["sound", "recording", "copyright", "phonograph"],
  "U+2120": ["service", "sm", "mark"],
  "U+2122": ["trademark", "tm", "brand"],
  "U+2126": ["ohm", "omega", "resistance"],
  "U+212A": ["kelvin", "temperature"],
  "U+212B": ["angstrom"],

  // Technical & keyboard
  "U+2302": ["house", "home", "building"],
  "U+2318": ["command", "cmd", "mac", "apple", "keyboard"],
  "U+231A": ["watch", "time", "clock"],
  "U+231B": ["hourglass", "time", "wait"],
  "U+2325": ["option", "alt", "mac", "keyboard"],
  "U+2327": ["x", "delete", "cancel"],
  "U+2328": ["keyboard", "typing"],
  "U+232B": ["delete", "backspace"],
  "U+2326": ["delete", "forward"],
  "U+23CF": ["eject", "media"],
  "U+23E9": ["fast", "forward", "skip"],
  "U+23EA": ["rewind", "back", "skip"],
  "U+23EB": ["up", "skip"],
  "U+23EC": ["down", "skip"],
  "U+23F0": ["alarm", "clock", "time", "morning", "wake"],
  "U+23F3": ["hourglass", "loading", "wait", "time", "sand"],

  // Weather & nature
  "U+2600": ["sun", "sunny", "weather", "day", "summer"],
  "U+2601": ["cloud", "cloudy", "weather", "sky"],
  "U+2602": ["umbrella", "rain", "weather"],
  "U+2603": ["snowman", "winter", "snow"],
  "U+2604": ["comet", "space", "star"],
  "U+2607": ["lightning", "storm", "bolt", "weather"],
  "U+2608": ["thunderstorm", "storm", "weather"],
  "U+2609": ["sun", "solar", "planet", "astronomy"],
  "U+2614": ["umbrella", "rain", "weather"],
  "U+2618": ["shamrock", "clover", "ireland", "luck"],
  "U+26C4": ["snowman", "winter", "cold"],
  "U+26C5": ["sun", "cloud", "partly", "weather"],
  "U+26C8": ["storm", "thunder", "rain", "weather"],
  "U+2744": ["snowflake", "cold", "winter", "snow"],
  "U+1F308": ["rainbow", "colors", "pride", "sky"],
  "U+1F320": ["shooting", "stars", "night", "space"],
  "U+1F338": ["blossom", "cherry", "sakura", "flower", "japan"],
  "U+1F334": ["palm", "tree", "tropical", "beach"],
  "U+1F341": ["leaf", "maple", "autumn", "fall", "canada"],
  "U+1F34E": ["apple", "fruit", "red"],

  // Stars
  "U+2605": ["star", "favorite", "favourite", "rating", "bookmark", "filled"],
  "U+2606": ["star", "outline", "empty", "unfilled", "rating"],
  "U+2726": ["star", "sparkle", "four", "pointed"],
  "U+2727": ["star", "sparkle", "four", "pointed"],
  "U+2728": ["sparkles", "sparkle", "shine", "glitter", "magic", "stars"],
  "U+2736": ["star", "six", "pointed"],
  "U+2739": ["star", "twelve", "pointed"],
  "U+2B50": ["star", "rating", "favorite", "review"],
  "U+1F31F": ["star", "glow", "glowing", "shiny"],
  "U+1F4AF": ["100", "hundred", "perfect", "score"],

  // Faces & people
  "U+263A": ["smile", "smiley", "happy", "face"],
  "U+2639": ["frown", "sad", "unhappy", "face"],
  "U+263B": ["smile", "smiley", "happy", "face"],
  "U+1F600": ["grin", "smile", "happy", "face"],
  "U+1F602": ["laugh", "lol", "tears", "joy", "crying"],
  "U+1F609": ["wink", "face"],
  "U+1F60A": ["blush", "happy", "smile", "face"],
  "U+1F60D": ["love", "heart", "eyes", "adore", "crush"],
  "U+1F618": ["kiss", "heart", "face"],
  "U+1F621": ["angry", "mad", "rage", "red", "face"],
  "U+1F62D": ["cry", "sad", "tears", "sob", "crying"],
  "U+1F641": ["frown", "sad", "face"],
  "U+1F642": ["smile", "happy", "face"],
  "U+1F916": ["robot", "bot", "ai", "android"],
  "U+1F44D": ["thumbs", "up", "like", "approve", "yes", "good"],
  "U+1F44E": ["thumbs", "down", "dislike", "no", "bad"],
  "U+1F44C": ["ok", "perfect", "hand"],
  "U+1F446": ["point", "up", "finger", "hand"],
  "U+1F447": ["point", "down", "finger", "hand"],
  "U+1F448": ["point", "left", "finger", "hand"],
  "U+1F449": ["point", "right", "finger", "hand"],
  "U+1F64F": ["pray", "thanks", "please", "namaste", "hands"],
  "U+1F464": ["user", "person", "profile", "account", "avatar"],
  "U+1F465": ["users", "people", "group", "team", "audience"],
  "U+1F9D1": ["person", "user", "standing"],
  "U+1F9D8": ["yoga", "meditation", "lotus", "person"],

  // Communication
  "U+260E": ["phone", "telephone", "call"],
  "U+2709": ["envelope", "email", "mail", "letter"],
  "U+1F4AC": ["speech", "bubble", "chat", "comment", "message"],
  "U+1F4E2": ["speaker", "announce", "loud", "megaphone"],
  "U+1F514": ["bell", "ring", "notification", "alert"],
  "U+1F515": ["bell", "off", "mute", "silent", "notification"],
  "U+1F5E8": ["speech", "bubble", "chat", "comment"],
  "U+1F680": ["rocket", "launch", "ship", "space", "startup"],

  // Objects & tools
  "U+2692": ["tools", "hammer", "pick", "mining"],
  "U+2699": ["gear", "settings", "cog", "options", "config"],
  "U+26A0": ["warning", "caution", "hazard", "alert", "attention"],
  "U+26A1": ["lightning", "bolt", "zap", "thunder", "power", "electric"],
  "U+26B0": ["coffin", "funeral", "death"],
  "U+2696": ["justice", "scales", "law", "balance", "court", "legal"],
  "U+2695": ["medical", "health", "doctor", "medicine"],
  "U+269B": ["atom", "science", "physics"],
  "U+2694": ["sword", "battle", "war", "crossed", "fight"],
  "U+2697": ["alchemy", "alembic", "distill"],
  "U+2615": ["coffee", "tea", "cup", "drink", "hot", "cafe"],
  "U+270E": ["pencil", "write", "edit", "lower"],
  "U+270F": ["pencil", "write", "edit", "pen"],
  "U+1F516": ["pin", "pushpin", "thumbtack", "save", "location"],
  "U+1F517": ["link", "chain", "url", "connect", "href"],
  "U+1F510": ["lock", "key", "secure", "private", "encrypted", "password"],
  "U+1F511": ["key", "unlock", "password", "secret"],
  "U+1F512": ["lock", "closed", "secure", "private", "https"],
  "U+1F513": ["lock", "open", "unlock", "insecure"],
  "U+1F50D": ["search", "magnify", "zoom", "find", "glass", "inspect"],
  "U+1F50E": ["search", "magnify", "zoom", "find", "glass"],
  "U+1F527": ["wrench", "tools", "fix", "settings", "maintenance"],
  "U+1F528": ["hammer", "tool", "build", "nail"],
  "U+1F6E0": ["tools", "build", "hammer", "wrench", "fix", "workshop"],
  "U+1F4C4": ["page", "document", "file", "paper"],
  "U+1F4C6": ["calendar", "date", "schedule"],
  "U+1F4DD": ["memo", "note", "write", "pencil"],
  "U+1F4CB": ["clipboard", "copy", "paste", "board"],
  "U+1F4BE": ["floppy", "disk", "save", "storage"],
  "U+1F4C1": ["folder", "directory", "file", "open"],
  "U+1F5A5": ["desktop", "computer", "monitor", "screen", "pc"],
  "U+1F4BB": ["laptop", "computer", "pc", "dev", "coding"],
  "U+1F4F1": ["phone", "mobile", "smartphone", "device", "iphone"],
  "U+1F50B": ["battery", "power", "charge"],
  "U+1F506": ["brightness", "high", "light", "sun"],
  "U+1F505": ["brightness", "low", "dim", "light"],
  "U+1F4E6": ["package", "box", "gift", "shipping"],
  "U+1F4B8": ["money", "wings", "flying", "spend"],
  "U+1F4A8": ["wind", "dash", "fast", "speed", "running"],
  "U+1F525": ["fire", "hot", "flame", "lit", "trending", "burn"],
  "U+1F4A9": ["poop", "poo", "shit"],
  "U+1F6A8": ["police", "light", "revolving", "alarm", "emergency", "beacon"],
  "U+1F695": ["taxi", "cab", "car", "uber"],
  "U+1F697": ["car", "auto", "vehicle", "drive"],
  "U+1F6B2": ["bike", "bicycle", "cycle", "cycling"],
  "U+1F3AF": ["target", "dart", "bullseye", "goal", "hit"],
  "U+1F3C1": ["checkered", "flag", "finish", "race", "goal"],
  "U+1F3C3": ["run", "runner", "running", "marathon", "jog"],
  "U+1F6A9": ["triangular", "flag", "post", "marker", "pin"],
  "U+1F3E0": ["house", "home", "building"],
  "U+1F5FB": ["mountain", "landscape", "map", "geo"],
  "U+1F5FA": ["map", "world", "geo", "travel"],

  // Status marks
  "U+2610": ["checkbox", "unchecked", "empty", "vote", "todo"],
  "U+2611": ["checkbox", "checked", "done", "complete", "vote", "select", "yes", "todo"],
  "U+2612": ["checkbox", "crossed", "cancel", "no", "wrong", "todo"],
  "U+2705": ["check", "done", "complete", "yes", "green", "success", "todo"],
  "U+2713": ["check", "tick", "done", "complete", "yes", "select", "confirm", "todo"],
  "U+2714": ["check", "tick", "bold", "heavy", "done", "yes", "todo"],
  "U+2715": ["x", "cross", "close", "cancel", "multiply", "delete"],
  "U+2716": ["x", "cross", "close", "cancel", "multiply", "heavy"],
  "U+2717": ["x", "cross", "wrong", "no", "reject", "fail", "error"],
  "U+2718": ["x", "cross", "wrong", "no", "reject", "fail", "heavy"],
  "U+274C": ["x", "cross", "no", "cancel", "wrong", "deny", "fail"],
  "U+274E": ["x", "cross", "no", "negative", "deny"],
  "U+2753": ["question", "help", "unknown", "what", "faq"],
  "U+2754": ["question", "white", "help", "unknown"],
  "U+2755": ["exclamation", "white", "wow", "alert"],
  "U+2757": ["exclamation", "important", "wow", "alert", "red"],
  "U+2795": ["plus", "add", "math", "positive", "new"],
  "U+2796": ["minus", "subtract", "math", "negative", "remove"],
  "U+2797": ["divide", "math", "division"],

  // Hearts & suits
  "U+2660": ["spade", "cards", "suit", "poker", "ace"],
  "U+2663": ["club", "clover", "cards", "suit", "poker"],
  "U+2665": ["heart", "love", "cards", "suit", "poker", "filled"],
  "U+2666": ["diamond", "cards", "suit", "poker"],
  "U+2764": ["heart", "love", "romance", "valentine", "red", "filled"],
  "U+2763": ["heart", "exclamation", "love"],
  "U+1F49B": ["heart", "yellow", "gold", "love", "friendship"],
  "U+1F49C": ["heart", "purple", "violet", "love"],
  "U+1F49D": ["heart", "ribbon", "gift", "love", "valentine"],
  "U+1F49E": ["heart", "revolving", "spinning", "love"],
  "U+1F49F": ["heart", "decoration", "love"],

  // Music
  "U+266A": ["music", "note", "song", "eighth", "single"],
  "U+266B": ["music", "notes", "song", "beamed", "double"],
  "U+1F3B5": ["music", "note", "song"],
  "U+1F3B6": ["music", "notes", "song"],

  // Recycling & eco
  "U+267B": ["recycle", "recycling", "green", "eco", "environment", "waste"],

  // Circles & shapes
  "U+25CB": ["circle", "outline", "empty", "white", "o"],
  "U+25CF": ["circle", "dot", "filled", "bullet", "black"],
  "U+26AA": ["circle", "white", "medium", "dot"],
  "U+26AB": ["circle", "black", "medium", "dot", "filled"],
  "U+2B55": ["circle", "o", "ring", "red", "heavy", "large"],
  "U+25A0": ["square", "filled", "box", "black"],
  "U+25A1": ["square", "outline", "empty", "white", "box"],
  "U+25AA": ["bullet", "square", "small", "black", "filled"],
  "U+25AB": ["bullet", "square", "small", "white", "outline"],
  "U+25FB": ["square", "white", "medium", "outline"],
  "U+25FC": ["square", "black", "medium", "filled"],
  "U+25B2": ["triangle", "up", "arrow", "filled", "caret"],
  "U+25BC": ["triangle", "down", "arrow", "filled", "caret"],
  "U+25B6": ["play", "triangle", "right", "arrow", "start", "media"],
  "U+25C0": ["rewind", "triangle", "left", "arrow", "back", "media"],
  "U+25B3": ["triangle", "up", "outline", "white"],
  "U+25BD": ["triangle", "down", "outline", "white"],
  "U+25B7": ["triangle", "right", "outline", "play"],
  "U+25C1": ["triangle", "left", "outline", "rewind"],
  "U+1F53A": ["triangle", "up", "red", "button"],
  "U+1F53B": ["triangle", "down", "red", "button"],
  "U+1F53C": ["triangle", "up", "small", "red"],
  "U+1F53D": ["triangle", "down", "small", "red"],
  "U+2B1B": ["square", "black", "large", "filled", "big"],
  "U+2B1C": ["square", "white", "large", "outline", "big"],

  // Religion & culture
  "U+271D": ["cross", "latin", "christian", "religion", "church"],
  "U+2721": ["star", "david", "jewish", "religion"],
  "U+2638": ["wheel", "dharma", "buddhist", "religion"],
  "U+262F": ["yin", "yang", "balance", "tao", "harmony"],
  "U+262A": ["star", "crescent", "islam", "muslim", "religion"],
  "U+262E": ["peace", "dove", "olive", "branch"],
  "U+262D": ["hammer", "sickle", "communism", "ussr"],
  "U+2622": ["radioactive", "danger", "nuclear", "warning"],
  "U+2623": ["biohazard", "danger", "warning", "virus"],
  "U+2620": ["skull", "crossbones", "poison", "danger", "death", "pirate"],
  "U+1F480": ["skull", "death", "bones", "dead", "halloween"],
  "U+1F549": ["om", "hindu", "religion", "mantra"],
  "U+1F54D": ["synagogue", "star", "david", "jewish", "temple"],
  "U+1F6D5": ["temple", "hindu", "religion"],

  // Sports
  "U+26BD": ["soccer", "football", "ball", "sports", "fifa"],
  "U+26BE": ["baseball", "ball", "sports"],
  "U+1F3C0": ["basketball", "ball", "sports", "hoops"],
  "U+1F3C8": ["football", "american", "ball", "sports", "nfl"],
  "U+1F3D0": ["volleyball", "ball", "sports"],
  "U+1F3CF": ["cricket", "bat", "ball", "sports"],
  "U+1F3D1": ["field", "hockey", "sports"],
  "U+1F3D2": ["ice", "hockey", "puck", "sports"],
  "U+1F3F8": ["badminton", "racket", "sports"],

  // Gender & zodiac (subset of Miscellaneous Symbols)
  "U+2640": ["female", "venus", "woman", "gender"],
  "U+2642": ["male", "mars", "man", "gender"],
  "U+264A": ["gemini", "zodiac", "twins", "astrology"],
  "U+264B": ["cancer", "zodiac", "crab", "astrology"],
  "U+264C": ["leo", "zodiac", "lion", "astrology"],
  "U+264D": ["virgo", "zodiac", "maiden", "astrology"],
  "U+264E": ["libra", "zodiac", "scales", "astrology"],
  "U+264F": ["scorpio", "zodiac", "scorpion", "astrology"],
  "U+2650": ["sagittarius", "zodiac", "archer", "astrology"],
  "U+2651": ["capricorn", "zodiac", "goat", "astrology"],
  "U+2652": ["aquarius", "zodiac", "water", "bearer", "astrology"],
  "U+2653": ["pisces", "zodiac", "fish", "astrology"],
  "U+2648": ["aries", "zodiac", "ram", "astrology"],
  "U+2649": ["taurus", "zodiac", "bull", "astrology"],

  // Travel & transport (Dingbats & Transport block)
  "U+2708": ["airplane", "flight", "travel", "plane", "airport"],
  "U+26EA": ["church", "temple", "building", "religion"],
  "U+26F0": ["mountain", "hill", "geo"],
  "U+26F1": ["beach", "umbrella", "parasol", "resort"],
  "U+26F2": ["fountain", "water", "park"],
  "U+26F3": ["golf", "flag", "hole", "sports"],
  "U+26F5": ["boat", "sail", "sailing", "yacht", "sea"],
  "U+26FD": ["fuel", "gas", "pump", "station", "petrol"],
  "U+2693": ["anchor", "ship", "sea", "nautical", "maritime"],
  "U+26F4": ["ferry", "boat", "ship"],

  // Keycap-style info
  "U+2139": ["info", "information", "i", "about"],
  "U+1F6AB": ["no", "prohibited", "forbidden", "banned", "deny", "stop"],
  "U+26D4": ["no", "entry", "forbidden", "stop", "prohibited", "banned"],
  "U+1F51E": ["no", "under", "18", "minor", "prohibited"],
  "U+1F6D1": ["stop", "end", "halt", "octagon"],

  // Misc pictographs
  "U+1F984": ["unicorn", "magic", "horse", "fantasy"],
  "U+1F415": ["dog", "puppy", "pet", "animal"],
  "U+1F408": ["cat", "kitty", "pet", "animal"],
  "U+1F4E1": ["satellite", "antenna", "dish", "signal"],
  "U+1F4A7": ["droplet", "water", "blue", "liquid"],
  "U+1F4A6": ["sweat", "droplets", "water"],
  "U+1F30B": ["volcano", "eruption", "mountain", "lava"],
  "U+1F31B": ["moon", "crescent", "night", "face"],
  "U+1F319": ["moon", "crescent", "night"],
  "U+1F31E": ["sun", "face", "day", "summer"],
  "U+1F31D": ["moon", "full", "night", "face"],

  // Emoticons & dingbats misc
  "U+270B": ["hand", "raised", "stop", "high", "five"],
  "U+270A": ["fist", "punch", "power", "hand", "bump"],
  "U+270C": ["victory", "peace", "hand", "two", "v"],
  "U+270D": ["hand", "writing", "pencil"],
}

/**
 * Adds Enclosed Alphanumeric keywords programmatically:
 * circled/parenthesized digits (①–⑳), digit keycaps with full stops and
 * circled/parenthesized letters, so that searching "3" or "a" finds ③ / ⓐ.
 */
function enclosedAlphanumericKeywords(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  const letters = "abcdefghijklmnopqrstuvwxyz".split("")
  for (let n = 1; n <= 20; n++) map[curationKey(0x2460 + n - 1)] = [String(n)] // CIRCLED ONE..TWENTY
  for (let n = 1; n <= 20; n++) map[curationKey(0x2474 + n - 1)] = [String(n)] // PARENTHESIZED ONE..TWENTY
  for (let n = 1; n <= 9; n++) map[curationKey(0x2488 + n - 1)] = [String(n)] // DIGIT ONE..NINE FULL STOP
  letters.forEach((letter, i) => {
    map[curationKey(0x249c + i)] = [letter] // PARENTHESIZED LATIN SMALL A..Z
    map[curationKey(0x24b6 + i)] = [letter] // CIRCLED LATIN CAPITAL A..Z
    map[curationKey(0x24d0 + i)] = [letter] // CIRCLED LATIN SMALL A..Z
  })
  map[curationKey(0x24ea)] = ["0"] // CIRCLED DIGIT ZERO
  return map
}

/** Complete curated map: hand-picked synonyms + programmatic enclosed alphanumerics. */
export const ALL_CURATED_KEYWORDS: Record<string, string[]> = {
  ...CURATED_KEYWORDS,
  ...enclosedAlphanumericKeywords(),
}

/** Words extracted from an official Unicode name, lowercased. */
export function keywordsFromName(name: string): string[] {
  const keywords: string[] = []
  const seen = new Set<string>()
  const push = (word: string) => {
    if (word.length < 2 || STOPWORDS.has(word) || seen.has(word)) return
    seen.add(word)
    keywords.push(word)
  }
  for (const word of name.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (word.length === 0) continue
    push(word)
    // Directional stem: "leftwards" also matches searches for "left".
    if (word.endsWith("wards")) push(word.slice(0, -5))
  }
  return keywords
}

/**
 * Merge name-derived keywords with curated synonyms (already lowercase),
 * deduplicate case-insensitively and cap at {@link MAX_KEYWORDS}.
 */
export function buildKeywords(name: string, extra?: string[]): string[] {
  const keywords: string[] = []
  const seen = new Set<string>()
  for (const word of keywordsFromName(name)) {
    seen.add(word)
    keywords.push(word)
  }
  for (const word of extra ?? []) {
    const lower = word.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    keywords.push(lower)
  }
  return keywords.slice(0, MAX_KEYWORDS)
}
