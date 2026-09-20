const set = (s) => new Set(s.trim().split(/\s+/));

export const KEYWORDS = set(
  "if else while do for switch case default break continue return goto using namespace class struct enum try catch throw new delete typedef typename static const volatile auto"
);

export const TYPES = set(
  "int double float char bool void long short unsigned signed string wstring size_t wchar_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t vector map set list deque array"
);

export const STD_ENTITIES = set(
  "cin cout cerr clog endl std Math Console WriteLine Write ReadLine ReadKey Parse Abs abs fabs sin cos tan sqrt pow log exp printf scanf gets puts getline strlen atoi main"
);

export const LITERAL_CONSTS = set("true false null nullptr");

export const MULTI_OPS = [
  ">>=", "<<=", "==", "!=", "<=", ">=", "&&", "||", "<<", ">>", "++", "--",
  "->", "::", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
];

export const PAIRS = { "(": "( )", "{": "{ }", "[": "[ ]" };
export const CLOSES = { "(": ")", "{": "}", "[": "]" };
export const CLOSING_BRACKETS = new Set([")", "}", "]"]);
