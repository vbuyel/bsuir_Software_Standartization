const set = (s) => new Set(s.split(" "));

export const NOT_FUNC = set("if for while switch catch else do");
export const TYPES = set(
  "int double float char bool void long short unsigned signed auto const volatile static string size_t wchar_t class struct enum int32_t int64_t uint32_t uint64_t"
);
export const STD_TYPES = set("string wstring vector map set size_t int");
export const STREAMS = set("cin cout cerr clog endl");
export const LIB_FUNCS = set(
  "abs fabs sin cos tan sqrt pow log exp printf scanf gets puts getline strlen atoi main"
);
export const MULTI_OPS = [
  ">>=", "<<=", "==", "!=", "<=", ">=", "&&", "||", "<<", ">>", "++", "--",
  "->", "::", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
];
export const PAIRS = { "(": "( )", "{": "{ }", "[": "[ ]" };
export const CLOSES = { "(": ")", "{": "}", "[": "]" };
