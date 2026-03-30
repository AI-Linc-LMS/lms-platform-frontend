const UNARY_FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log10,
  ln: Math.log,
};

export function evaluateScientificExpression(raw: string): number {
  const s = raw.replace(/\s/g, "");
  if (!s) throw new Error("Empty");
  let i = 0;
  const end = () => i >= s.length;
  const peek = () => (end() ? "" : s[i]);

  function parseExpr(): number {
    let v = parseAddSub();
    return v;
  }

  function parseAddSub(): number {
    let v = parseMulDiv();
    while (peek() === "+" || peek() === "-") {
      const op = peek();
      i++;
      const r = parseMulDiv();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  function parseMulDiv(): number {
    let v = parsePow();
    while (peek() === "*" || peek() === "/") {
      const op = peek();
      i++;
      const r = parsePow();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }

  /** Right-associative exponentiation */
  function parsePow(): number {
    let v = parseUnary();
    if (peek() === "^") {
      i++;
      const r = parsePow();
      v = Math.pow(v, r);
    }
    return v;
  }

  function parseUnary(): number {
    if (peek() === "-") {
      i++;
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === "(") {
      i++;
      const v = parseExpr();
      if (peek() !== ")") throw new Error("Expected )");
      i++;
      return v;
    }

    if (/[0-9.]/.test(peek())) {
      const start = i;
      while (/[0-9.]/.test(peek())) i++;
      const n = parseFloat(s.slice(start, i));
      if (Number.isNaN(n)) throw new Error("Invalid number");
      return n;
    }

    const idStart = i;
    while (/[a-zA-Z]/.test(peek())) i++;
    const ident = s.slice(idStart, i);
    if (ident === "PI" || ident === "pi") return Math.PI;
    if (ident === "E") return Math.E;

    const fn = UNARY_FUNCS[ident];
    if (fn) {
      if (peek() !== "(") throw new Error("Expected (");
      i++;
      const arg = parseExpr();
      if (peek() !== ")") throw new Error("Expected )");
      i++;
      return fn(arg);
    }

    throw new Error("Unexpected token");
  }

  const result = parseExpr();
  if (i !== s.length) throw new Error("Trailing input");
  if (!Number.isFinite(result)) throw new Error("Invalid result");
  return result;
}
