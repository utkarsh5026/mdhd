/**
 * Per-language rules for deciding where a source file splits into sections.
 *
 * The alternative — one union of every construct keyword across every language
 * — is what this replaces. That approach produced confident nonsense: `type` is
 * a declaration in TypeScript and a builtin in shell, `module` opens a Ruby
 * module and starts `module.exports` in Node. Correctness here means a heading
 * only appears where the language really has a top-level construct.
 *
 * Each language contributes:
 *
 * - `declarations` — ordered patterns; the first to match a line wins, so
 *   specific rules (a C++ constructor) come before general ones (a C++
 *   function).
 * - `docLine` — that language's comment, attribute, and decorator syntax, so a
 *   construct's doc block heads its own section instead of trailing the one
 *   above.
 * - `importLine` — how the language pulls in other modules, used only to decide
 *   whether a file's preamble is titled "Imports" or "Header".
 *
 * Patterns are tested against the line with its indentation removed, so no rule
 * has to spell out leading whitespace. Where a construct appears at column 0 the
 * rule is plain; where it is a class member one level in, the rule sets
 * `member` and the splitter matches it against the file's own indent unit.
 *
 * Languages with no entry fall back to {@link DEFAULT_RULES}, a deliberately
 * cautious set that only fires on shapes common to most curly-brace languages.
 */

/** Shared by every rule shape. */
interface BaseRule {
  /** Tested against the dedented line, anchored with `^`. */
  readonly match: RegExp;
  /**
   * Also recognize this construct one indent level in — for languages whose
   * real reading units are class members rather than top-level declarations.
   */
  readonly member?: boolean;
  /**
   * This construct holds the members that follow it.
   *
   * `class Parser {` on its own is three lines — too few to earn a heading, and
   * folding it backwards would file a class under "Imports". A container that
   * comes out short adopts the section after it instead, so the class heading
   * covers the class rather than whatever preceded it.
   *
   * Only set this for languages that also have `member` rules. Without them the
   * next section is a sibling, not a member, and adopting it would be wrong.
   */
  readonly container?: boolean;
}

/** A construct with a name: the heading becomes `<kind> <name>`. */
interface NamedRule extends BaseRule {
  /** Word placed before the name, e.g. `function` in `function parse`. */
  readonly kind: string;
  readonly wholeLine?: false;
}

/**
 * A construct identified by its whole signature rather than a single name —
 * `impl Display for Token`, a CSS selector list, a `[tool.poetry]` header.
 */
interface WholeLineRule extends BaseRule {
  readonly wholeLine: true;
}

/** One recognizable shape of declaration. */
export type DeclarationRule = NamedRule | WholeLineRule;

/** Everything the splitter needs to know about one language. */
export interface LanguageRules {
  readonly declarations: readonly DeclarationRule[];
  readonly docLine: RegExp;
  readonly importLine: RegExp;
}

/** Matches nothing — for languages with no import syntax to speak of. */
const NEVER = /(?!)/;

// ---------------------------------------------------------------------------
// Comment syntax, shared across language families
// ---------------------------------------------------------------------------

/** `//`, `/* … *\/`, and the `@Annotation` / `@decorator` lines that precede a construct. */
const SLASH_DOC = /^\s*(?:\/\/|\/\*|\*\/|\*|@)/;
/** `--` comments. SQL, Lua, Haskell, Elm. */
const DASH_DOC = /^\s*--/;

// ---------------------------------------------------------------------------
// JavaScript and TypeScript
// ---------------------------------------------------------------------------

/**
 * Class members are deliberately absent. JS and TS codebases put their reading
 * units at the top level — exported functions, components, hooks — and a member
 * rule here would also fire on the method shorthand inside a large object
 * literal, splitting a config table into nonsense.
 */
const jsRules: LanguageRules = {
  declarations: [
    {
      kind: 'class',
      match: /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(?<name>[A-Za-z_$][\w$]*)/,
    },
    {
      kind: 'interface',
      match: /^(?:export\s+)?(?:declare\s+)?interface\s+(?<name>[A-Za-z_$][\w$]*)/,
    },
    {
      kind: 'enum',
      match: /^(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s+(?<name>[A-Za-z_$][\w$]*)/,
    },
    { kind: 'type', match: /^(?:export\s+)?(?:declare\s+)?type\s+(?<name>[A-Za-z_$][\w$]*)/ },
    {
      kind: 'namespace',
      match: /^(?:export\s+)?(?:declare\s+)?(?:namespace|module)\s+(?<name>[A-Za-z_$][\w$]*)/,
    },
    {
      kind: 'function',
      match:
        /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*(?<name>[A-Za-z_$][\w$]*)/,
    },
    // `export const Button = ({ label }: Props) => {` — a function bound to a
    // name, which is how most of a modern codebase declares one.
    {
      kind: 'function',
      match:
        /^(?:export\s+)?(?:const|let|var)\s+(?<name>[A-Za-z_$][\w$]*)[^=]*=\s*(?:async\s+)?(?:function\b|\(|<[A-Za-z_$])/,
    },
    // A data table, recognized only when the brace ends the line, so ordinary
    // one-line constants stay with the code around them.
    {
      kind: 'const',
      match: /^(?:export\s+)?(?:const|let|var)\s+(?<name>[A-Za-z_$][\w$]*)[^=]*=\s*[[{]\s*$/,
    },
  ],
  docLine: SLASH_DOC,
  importLine: /^\s*(?:import\b|export\s+.*\bfrom\b|(?:const|let|var)\s+.*=\s*require\()/,
};

// ---------------------------------------------------------------------------
// Python
// ---------------------------------------------------------------------------

const PYTHON_DEF = /^(?:async\s+)?def\s+(?<name>[A-Za-z_]\w*)/;
const PYTHON_CLASS = /^class\s+(?<name>[A-Za-z_]\w*)/;

const pythonRules: LanguageRules = {
  declarations: [
    { kind: 'class', container: true, match: PYTHON_CLASS },
    { kind: 'function', match: PYTHON_DEF },
    { kind: 'const', match: /^(?<name>[A-Z_][A-Z0-9_]{2,})\s*(?::[^=]+)?=\s*[[{(]\s*$/ },
    { kind: 'method', member: true, match: PYTHON_DEF },
    { kind: 'class', member: true, container: true, match: PYTHON_CLASS },
  ],
  docLine: /^\s*(?:#|@|"""|''')/,
  importLine: /^\s*(?:import|from)\b/,
};

// ---------------------------------------------------------------------------
// Rust
// ---------------------------------------------------------------------------

/** `pub`, `pub(crate)`, `async`, `unsafe`, `extern "C"` — Rust's leading words. */
const RUST_MODIFIERS = /^(?:(?:pub(?:\([^)]*\))?|async|unsafe|const|extern(?:\s+"[^"]*")?)\s+)*/
  .source;
const RUST_FN = new RegExp(`${RUST_MODIFIERS}fn\\s+(?<name>[A-Za-z_]\\w*)`);

const rustRules: LanguageRules = {
  // `impl<T> Display for Token<T>` is identified by the trait and the type
  // together, so the whole signature is the heading.
  declarations: [
    { wholeLine: true, container: true, match: /^impl\b/ },
    { kind: 'function', match: RUST_FN },
    { kind: 'struct', match: /^(?:pub(?:\([^)]*\))?\s+)?struct\s+(?<name>[A-Za-z_]\w*)/ },
    { kind: 'enum', match: /^(?:pub(?:\([^)]*\))?\s+)?enum\s+(?<name>[A-Za-z_]\w*)/ },
    {
      kind: 'trait',
      match: /^(?:pub(?:\([^)]*\))?\s+)?(?:unsafe\s+)?trait\s+(?<name>[A-Za-z_]\w*)/,
    },
    { kind: 'union', match: /^(?:pub(?:\([^)]*\))?\s+)?union\s+(?<name>[A-Za-z_]\w*)/ },
    { kind: 'type', match: /^(?:pub(?:\([^)]*\))?\s+)?type\s+(?<name>[A-Za-z_]\w*)/ },
    // Only the inline form: `mod tests {`. A bare `mod foo;` is a declaration
    // of intent, not a body worth its own section.
    {
      kind: 'mod',
      container: true,
      match: /^(?:pub(?:\([^)]*\))?\s+)?mod\s+(?<name>[A-Za-z_]\w*)\s*\{/,
    },
    { kind: 'macro', match: /^macro_rules!\s+(?<name>[A-Za-z_]\w*)/ },
    {
      kind: 'const',
      match: /^(?:pub(?:\([^)]*\))?\s+)?(?:const|static)\s+(?:mut\s+)?(?<name>[A-Z_][A-Z0-9_]*)/,
    },
    { kind: 'function', member: true, match: RUST_FN },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*|#\[|#!)/,
  importLine: /^\s*(?:use|extern\s+crate|mod)\b/,
};

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------

const goRules: LanguageRules = {
  declarations: [
    // The optional `(s *Server)` receiver is skipped so a method's heading is
    // its own name rather than the receiver's.
    { kind: 'function', match: /^func\s+(?:\([^)]*\)\s*)?(?<name>[A-Za-z_]\w*)/ },
    { kind: 'type', match: /^type\s+(?<name>[A-Za-z_]\w*)/ },
    { kind: 'const', match: /^(?:var|const)\s+(?<name>[A-Za-z_]\w*)/ },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*)/,
  importLine: /^\s*(?:import|package)\b/,
};

// ---------------------------------------------------------------------------
// C, C++, Objective-C
// ---------------------------------------------------------------------------

const cRules: LanguageRules = {
  declarations: [
    { kind: 'namespace', match: /^namespace\s+(?<name>[A-Za-z_]\w*)/ },
    {
      kind: 'struct',
      match: /^(?:typedef\s+)?(?:struct|union|enum|class)\s+(?<name>[A-Za-z_]\w*)/,
    },
    { wholeLine: true, match: /^template\s*</ },
    { kind: 'define', match: /^#\s*define\s+(?<name>[A-Z_][A-Z0-9_]*)/ },
    // `- (void)viewDidLoad {` — an Objective-C method.
    { kind: 'method', match: /^[-+]\s*\([^)]*\)\s*(?<name>[A-Za-z_]\w*)/ },
    // `Parser::Parser(int cap) {` and `Parser::~Parser() {` — out-of-line
    // constructors, which have no return type for the general rule to consume.
    { kind: 'function', match: /^(?<name>[A-Za-z_]\w*::~?[A-Za-z_]\w*)\s*\([^;]*$/ },
    // `static inline int parse_line(const char *s) {` — a return type, then the
    // name, then an argument list that does not end in `;` (which would make it
    // a prototype rather than a definition).
    {
      kind: 'function',
      match:
        /^(?:(?:static|inline|extern|const|constexpr|virtual|explicit|friend|unsigned|signed|register|volatile)\s+)*[A-Za-z_][\w:<>,*&\s]*[\s*&]\s*(?<name>[A-Za-z_][\w:~]*)\s*\([^;]*$/,
    },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*)/,
  importLine: /^\s*#\s*(?:include|import)\b/,
};

// ---------------------------------------------------------------------------
// Java, C#, Groovy, Dart — class-based, with members one level in
// ---------------------------------------------------------------------------

const JAVA_TYPE =
  /^(?:(?:public|private|protected|internal|abstract|final|static|sealed|partial|strictfp)\s+)*(?:class|interface|enum|record|struct|@interface)\s+(?<name>[A-Za-z_]\w*)/;

const javaRules: LanguageRules = {
  declarations: [
    { kind: 'class', container: true, match: JAVA_TYPE },
    { kind: 'namespace', match: /^(?:namespace|package)\s+(?<name>[\w.]+)/ },
    { kind: 'class', member: true, container: true, match: JAVA_TYPE },
    // A constructor: visibility, then a capitalized name, then the arguments —
    // no return type in between.
    {
      kind: 'constructor',
      member: true,
      match: /^(?:(?:public|private|protected|internal)\s+)+(?<name>[A-Z]\w*)\s*\(/,
    },
    // `public static List<String> parseAll(String raw) {` — the whitespace
    // between the return type and the name is what keeps this off statements
    // like `super.init();` and `logger.warn(msg);`.
    {
      kind: 'method',
      member: true,
      match:
        /^(?:(?:public|private|protected|internal|static|final|abstract|override|virtual|async|synchronized|native|unsafe|extern|sealed|const)\s+)*[A-Za-z_][\w<>,.[\]?]*(?:\[\])?\s+(?<name>[A-Za-z_]\w*)\s*\(/,
    },
  ],
  docLine: SLASH_DOC,
  importLine: /^\s*(?:import|package|using)\b/,
};

// ---------------------------------------------------------------------------
// Kotlin, Scala, Swift
// ---------------------------------------------------------------------------

const KOTLIN_FUN =
  /^(?:(?:public|private|protected|internal|open|override|abstract|final|suspend|inline|operator|infix|tailrec|external|expect|actual)\s+)*fun\s+(?:<[^>]*>\s*)?(?:[\w.<>]+\.)?(?<name>[A-Za-z_]\w*)/;
const KOTLIN_TYPE =
  /^(?:(?:public|private|protected|internal|open|abstract|final|sealed|data|inner|enum|annotation|value|expect|actual)\s+)*(?:class|interface|object)\s+(?<name>[A-Za-z_]\w*)/;

const kotlinRules: LanguageRules = {
  declarations: [
    { kind: 'class', container: true, match: KOTLIN_TYPE },
    { kind: 'function', match: KOTLIN_FUN },
    { kind: 'typealias', match: /^typealias\s+(?<name>[A-Za-z_]\w*)/ },
    {
      kind: 'const',
      match: /^(?:(?:public|private|internal|const)\s+)*val\s+(?<name>[A-Z_][A-Z0-9_]{2,})/,
    },
    { kind: 'function', member: true, match: KOTLIN_FUN },
    { kind: 'class', member: true, container: true, match: KOTLIN_TYPE },
  ],
  docLine: SLASH_DOC,
  importLine: /^\s*(?:import|package)\b/,
};

const SCALA_DEF =
  /^(?:(?:private|protected|final|override|implicit|inline|lazy)\s+)*def\s+(?<name>[A-Za-z_]\w*)/;
const SCALA_TYPE =
  /^(?:(?:private|protected|final|sealed|abstract|implicit|case)\s+)*(?:class|trait|object|enum)\s+(?<name>[A-Za-z_]\w*)/;

const scalaRules: LanguageRules = {
  declarations: [
    { kind: 'class', container: true, match: SCALA_TYPE },
    { kind: 'function', match: SCALA_DEF },
    { kind: 'type', match: /^type\s+(?<name>[A-Za-z_]\w*)/ },
    { kind: 'function', member: true, match: SCALA_DEF },
    { kind: 'class', member: true, container: true, match: SCALA_TYPE },
  ],
  docLine: SLASH_DOC,
  importLine: /^\s*(?:import|package)\b/,
};

const SWIFT_FUNC =
  /^(?:(?:public|private|internal|fileprivate|open|final|static|class|override|mutating|nonmutating|convenience|required|@\w+)\s+)*func\s+(?<name>[A-Za-z_]\w*)/;
const SWIFT_TYPE =
  /^(?:(?:public|private|internal|fileprivate|open|final|indirect|@\w+)\s+)*(?:class|struct|enum|protocol|actor)\s+(?<name>[A-Za-z_]\w*)/;

const swiftRules: LanguageRules = {
  declarations: [
    {
      wholeLine: true,
      container: true,
      match: /^(?:(?:public|private|internal|fileprivate|open)\s+)*extension\s+/,
    },
    { kind: 'class', container: true, match: SWIFT_TYPE },
    { kind: 'function', match: SWIFT_FUNC },
    { kind: 'typealias', match: /^typealias\s+(?<name>[A-Za-z_]\w*)/ },
    { kind: 'function', member: true, match: SWIFT_FUNC },
    { kind: 'class', member: true, container: true, match: SWIFT_TYPE },
  ],
  docLine: SLASH_DOC,
  importLine: /^\s*import\b/,
};

// ---------------------------------------------------------------------------
// Ruby, PHP
// ---------------------------------------------------------------------------

/** Ruby method names may end in `?`, `!`, or `=`, and may be `self.`-qualified. */
const RUBY_DEF = /^def\s+(?<name>[\w.]+[?!=]?)/;
const RUBY_TYPE = /^(?:class|module)\s+(?<name>[A-Z][\w:]*)/;

const rubyRules: LanguageRules = {
  declarations: [
    { kind: 'class', container: true, match: RUBY_TYPE },
    { kind: 'function', match: RUBY_DEF },
    { kind: 'function', member: true, match: RUBY_DEF },
    { kind: 'class', member: true, container: true, match: RUBY_TYPE },
  ],
  docLine: /^\s*(?:#|=begin)/,
  importLine: /^\s*(?:require|require_relative|load|include|extend)\b/,
};

const PHP_FUNCTION =
  /^(?:(?:public|private|protected|static|final|abstract|readonly)\s+)*function\s+&?(?<name>[A-Za-z_]\w*)/;

const phpRules: LanguageRules = {
  declarations: [
    {
      kind: 'class',
      container: true,
      match:
        /^(?:(?:abstract|final|readonly)\s+)*(?:class|interface|trait|enum)\s+(?<name>[A-Za-z_]\w*)/,
    },
    { kind: 'function', match: PHP_FUNCTION },
    { kind: 'namespace', match: /^namespace\s+(?<name>[\w\\]+)/ },
    { kind: 'function', member: true, match: PHP_FUNCTION },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*|#\[|#)/,
  importLine: /^\s*(?:use|require|require_once|include|include_once|namespace)\b/,
};

// ---------------------------------------------------------------------------
// Shells and small scripting languages
// ---------------------------------------------------------------------------

const shellRules: LanguageRules = {
  declarations: [
    // `deploy() {` and `function deploy {` — both spellings, and the brace or
    // `()` is required so a bare command invocation never matches.
    { kind: 'function', match: /^(?:function\s+)?(?<name>[A-Za-z_][\w-]*)\s*\(\s*\)\s*\{?\s*$/ },
    { kind: 'function', match: /^function\s+(?<name>[A-Za-z_][\w-]*)\s*\{\s*$/ },
  ],
  docLine: /^\s*#/,
  importLine: /^\s*(?:source|\.)\s+/,
};

const powershellRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^function\s+(?<name>[\w-]+)/i },
    { kind: 'class', match: /^class\s+(?<name>\w+)/i },
  ],
  docLine: /^\s*(?:#|<#|\.[A-Z]+\s*$)/,
  importLine: /^\s*(?:Import-Module|using)\b/i,
};

const luaRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^(?:local\s+)?function\s+(?<name>[\w.:]+)/ },
    { kind: 'function', match: /^(?:local\s+)?(?<name>[\w.]+)\s*=\s*function\b/ },
    { kind: 'const', match: /^(?:local\s+)?(?<name>[A-Za-z_]\w*)\s*=\s*\{\s*$/ },
  ],
  docLine: DASH_DOC,
  importLine: /^\s*(?:local\s+[\w\s,]+=\s*)?require\b/,
};

const perlRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^sub\s+(?<name>[\w:]+)/ },
    { kind: 'package', match: /^package\s+(?<name>[\w:]+)/ },
  ],
  docLine: /^\s*(?:#|=\w)/,
  importLine: /^\s*(?:use|require|no)\b/,
};

const tclRules: LanguageRules = {
  declarations: [{ kind: 'function', match: /^proc\s+(?<name>[\w:]+)/ }],
  docLine: /^\s*#/,
  importLine: /^\s*(?:package\s+require|source)\b/,
};

const rRules: LanguageRules = {
  declarations: [{ kind: 'function', match: /^(?<name>[\w.]+)\s*(?:<-|=)\s*function\b/ }],
  docLine: /^\s*#/,
  importLine: /^\s*(?:library|require|source)\s*\(/,
};

const juliaRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^function\s+(?<name>[\w.!]+)/ },
    { kind: 'struct', match: /^(?:mutable\s+)?struct\s+(?<name>\w+)/ },
    { kind: 'module', match: /^module\s+(?<name>\w+)/ },
    { kind: 'macro', match: /^macro\s+(?<name>\w+)/ },
  ],
  docLine: /^\s*(?:#|"""|@)/,
  importLine: /^\s*(?:using|import|include)\b/,
};

// ---------------------------------------------------------------------------
// Functional languages
// ---------------------------------------------------------------------------

/**
 * Haskell and Elm. The type signature is the boundary — it sits directly above
 * the equations that implement it, so splitting there keeps a definition whole
 * and gives the section a name for free.
 */
const haskellRules: LanguageRules = {
  declarations: [
    { kind: 'type', match: /^(?:data|newtype|type)\s+(?<name>[A-Z]\w*)/ },
    { kind: 'class', match: /^class\s+(?:.*=>\s*)?(?<name>[A-Z]\w*)/ },
    { wholeLine: true, match: /^instance\b/ },
    { kind: 'function', match: /^(?<name>[a-z_]\w*'*)\s*::/ },
  ],
  docLine: /^\s*(?:--|\{-|\|)/,
  importLine: /^\s*(?:import|module)\b/,
};

const mlRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^let\s+(?:rec\s+)?(?:inline\s+)?(?<name>[a-zA-Z_]\w*)/ },
    { kind: 'type', match: /^(?:and\s+)?type\s+(?<name>[a-zA-Z_]\w*)/ },
    { kind: 'module', match: /^module\s+(?<name>[A-Z]\w*)/ },
    { kind: 'exception', match: /^exception\s+(?<name>[A-Z]\w*)/ },
  ],
  docLine: /^\s*(?:\(\*|\/\/)/,
  importLine: /^\s*open\b/,
};

/** Clojure, Common Lisp, and Scheme, whose forms all open with `(def…`. */
const lispRules: LanguageRules = {
  declarations: [
    {
      kind: 'function',
      match:
        /^\((?:defn|defun|defmacro|defmethod|define|defsubst|define-syntax)-?\S*\s+\(?(?<name>[^\s()]+)/,
    },
    {
      kind: 'type',
      match:
        /^\((?:defrecord|defprotocol|defstruct|deftype|defclass|define-record-type)\s+(?<name>[^\s()]+)/,
    },
    {
      kind: 'const',
      match: /^\((?:def|defvar|defparameter|defconst|defconstant)\s+(?<name>[^\s()]+)/,
    },
    { kind: 'namespace', match: /^\((?:ns|in-package|defpackage)\s+'?(?<name>[^\s()]+)/ },
  ],
  docLine: /^\s*;/,
  importLine: /^\s*\((?:ns|require|use|import|load|defpackage|in-package)\b/,
};

const erlangRules: LanguageRules = {
  // `-spec` and `-type` are treated as doc lines rather than boundaries so they
  // attach to the clause they annotate.
  declarations: [
    { kind: 'function', match: /^(?<name>[a-z]\w*)\s*\([^)]*\)\s*(?:when\b[^-]*)?->/ },
    { wholeLine: true, match: /^-(?:module|record|behaviour|behavior|callback)\b/ },
  ],
  docLine: /^\s*(?:%|-spec\b|-type\b)/,
  importLine: /^\s*-(?:module|include|include_lib|import|export)\b/,
};

const vbRules: LanguageRules = {
  declarations: [
    {
      kind: 'class',
      match:
        /^(?:(?:Public|Private|Protected|Friend|Partial|MustInherit|NotInheritable)\s+)*(?:Class|Module|Structure|Interface|Enum)\s+(?<name>\w+)/i,
    },
    {
      kind: 'function',
      match:
        /^(?:(?:Public|Private|Protected|Friend|Shared|Overrides|Overridable|Async)\s+)*(?:Sub|Function|Property)\s+(?<name>\w+)/i,
    },
  ],
  docLine: /^\s*'/,
  importLine: /^\s*Imports\b/i,
};

const zigRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^(?:(?:pub|export|extern|inline|noinline)\s+)*fn\s+(?<name>\w+)/ },
    {
      kind: 'type',
      container: true,
      match:
        /^(?:pub\s+)?const\s+(?<name>\w+)\s*=\s*(?:packed\s+|extern\s+)?(?:struct|enum|union|opaque)\b/,
    },
    { wholeLine: true, match: /^test\s+"/ },
    {
      kind: 'function',
      member: true,
      match: /^(?:(?:pub|export|extern|inline)\s+)*fn\s+(?<name>\w+)/,
    },
  ],
  docLine: /^\s*(?:\/\/|\/\/\/)/,
  importLine: /^\s*(?:pub\s+)?const\s+\w+\s*=\s*@import\b/,
};

// ---------------------------------------------------------------------------
// Schema, query, and configuration formats
// ---------------------------------------------------------------------------

const sqlRules: LanguageRules = {
  declarations: [
    {
      kind: 'table',
      match:
        /^CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+|UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<name>[\w."]+)/i,
    },
    {
      kind: 'view',
      match:
        /^CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<name>[\w."]+)/i,
    },
    {
      kind: 'function',
      match: /^CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+(?<name>[\w."]+)/i,
    },
    {
      kind: 'index',
      match:
        /^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(?<name>[\w."]+)/i,
    },
    { kind: 'type', match: /^CREATE\s+(?:TYPE|DOMAIN)\s+(?<name>[\w."]+)/i },
    { kind: 'trigger', match: /^CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+(?<name>[\w."]+)/i },
    { wholeLine: true, match: /^ALTER\s+TABLE\b/i },
  ],
  docLine: /^\s*(?:--|\/\*|\*)/,
  importLine: NEVER,
};

/**
 * CSS, SCSS, Less, and Sass. A rule is its selector list, so the whole line
 * becomes the heading — `.card, .card--wide` says more than any single name.
 */
const cssRules: LanguageRules = {
  declarations: [
    { kind: 'mixin', match: /^@(?:mixin|function)\s+(?<name>[\w-]+)/ },
    { wholeLine: true, match: /^[.#@:[*a-zA-Z][^{};]*\{\s*$/ },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*)/,
  importLine: /^\s*@(?:import|use|forward)\b/,
};

/** TOML, INI, and `.properties` — everything hangs off `[section]` headers. */
const sectionedConfigRules: LanguageRules = {
  declarations: [{ wholeLine: true, match: /^\[\[?[^\]]+\]\]?\s*$/ }],
  docLine: /^\s*[#;]/,
  importLine: NEVER,
};

const protobufRules: LanguageRules = {
  declarations: [
    { kind: 'message', match: /^message\s+(?<name>\w+)/ },
    { kind: 'service', match: /^service\s+(?<name>\w+)/ },
    { kind: 'enum', match: /^enum\s+(?<name>\w+)/ },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*)/,
  importLine: /^\s*(?:import|package|syntax|option)\b/,
};

const graphqlRules: LanguageRules = {
  declarations: [
    {
      kind: 'type',
      match: /^(?:extend\s+)?(?:type|input|interface|enum|union|scalar)\s+(?<name>\w+)/,
    },
    { kind: 'fragment', match: /^fragment\s+(?<name>\w+)/ },
    { kind: 'query', match: /^(?:query|mutation|subscription)\s+(?<name>\w+)/ },
  ],
  docLine: /^\s*(?:#|""")/,
  importLine: NEVER,
};

const dockerfileRules: LanguageRules = {
  declarations: [{ wholeLine: true, match: /^FROM\s+/i }],
  docLine: /^\s*#/,
  importLine: NEVER,
};

/** CMake functions and macros, plus plain Makefile targets. */
const makeRules: LanguageRules = {
  declarations: [
    { kind: 'function', match: /^(?:function|macro)\s*\(\s*(?<name>[\w-]+)/i },
    { kind: 'target', match: /^(?<name>[\w./$(){}%-]+)\s*:(?!=)/ },
  ],
  docLine: /^\s*#/,
  importLine: /^\s*(?:include|find_package)\b/i,
};

const nginxRules: LanguageRules = {
  declarations: [
    {
      wholeLine: true,
      match: /^(?:server|upstream|location|http|events|stream|map|geo)\b[^{}]*\{\s*$/,
    },
  ],
  docLine: /^\s*#/,
  importLine: /^\s*include\b/,
};

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

/**
 * Used for any language without an entry above — and for `text`, when a file's
 * extension told us nothing.
 *
 * Restricted to shapes that mean the same thing across essentially every
 * curly-brace language, because there is no way to know which language's rules
 * would apply. Anything more adventurous belongs in a real entry.
 */
export const DEFAULT_RULES: LanguageRules = {
  declarations: [
    {
      kind: 'class',
      match:
        /^(?:(?:export|public|private|protected|static|final|abstract|open)\s+)*(?:class|interface|enum|struct|trait|record)\s+(?<name>[A-Za-z_]\w*)/,
    },
    {
      kind: 'function',
      match:
        /^(?:(?:export|public|private|protected|static|async|inline)\s+)*(?:function|fn|func|def|sub|proc)\s+(?<name>[A-Za-z_]\w*)/,
    },
    { kind: 'function', match: /^(?<name>[A-Za-z_]\w*)\s*\(\s*\)\s*\{\s*$/ },
  ],
  docLine: /^\s*(?:\/\/|\/\*|\*|#|--|;|@)/,
  importLine: /^\s*(?:import|from|use|require|include|#include|using|package)\b/,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const RULES_BY_LANGUAGE: Readonly<Record<string, LanguageRules>> = {
  javascript: jsRules,
  jsx: jsRules,
  typescript: jsRules,
  tsx: jsRules,

  python: pythonRules,
  rust: rustRules,
  go: goRules,
  zig: zigRules,

  c: cRules,
  cpp: cRules,
  objectivec: cRules,

  java: javaRules,
  csharp: javaRules,
  groovy: javaRules,
  dart: javaRules,
  kotlin: kotlinRules,
  scala: scalaRules,
  swift: swiftRules,

  ruby: rubyRules,
  php: phpRules,
  perl: perlRules,
  lua: luaRules,
  tcl: tclRules,
  r: rRules,
  julia: juliaRules,
  shell: shellRules,
  powershell: powershellRules,

  haskell: haskellRules,
  elm: haskellRules,
  ocaml: mlRules,
  fsharp: mlRules,
  clojure: lispRules,
  commonlisp: lispRules,
  scheme: lispRules,
  erlang: erlangRules,
  vb: vbRules,

  sql: sqlRules,
  css: cssRules,
  scss: cssRules,
  sass: cssRules,
  less: cssRules,
  toml: sectionedConfigRules,
  properties: sectionedConfigRules,
  protobuf: protobufRules,
  graphql: graphqlRules,
  dockerfile: dockerfileRules,
  cmake: makeRules,
  nginx: nginxRules,
};

/**
 * Returns the splitting rules for a language id.
 *
 * @param language - An id from `detectCodeLanguage`, e.g. `rust`.
 * @returns That language's rules, or {@link DEFAULT_RULES} when it has none.
 */
export function rulesFor(language: string): LanguageRules {
  return RULES_BY_LANGUAGE[language.toLowerCase()] ?? DEFAULT_RULES;
}

/** Language ids with rules of their own, for tests and diagnostics. */
export const LANGUAGES_WITH_RULES: readonly string[] = Object.keys(RULES_BY_LANGUAGE);
