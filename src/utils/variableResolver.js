import { evaluateExpression } from "./expressionEvaluator";

export function resolveVariables(variables) {
  const values = {};
  const errors = {};
  const map = {};

  variables.forEach((v) => {
    map[v.name] = v;
  });

  const resolving = new Set();

  function resolve(name) {
    if (values[name] !== undefined) return values[name];

    const variable = map[name];
    if (!variable) {
      throw new Error(`Variable "${name}" is not defined.`);
    }

    if (resolving.has(name)) {
      throw new Error(`Circular dependency detected at "${name}".`);
    }

    resolving.add(name);

    let expr = variable.expression.trim();

    if (variable.type === "CONSTANT") {
      const value = parseFloat(expr);
      if (isNaN(value)) {
        throw new Error(
          `Invalid constant value for "${name}". Expected numeric.`
        );
      }
      values[name] = value;
      resolving.delete(name);
      return value;
    }

    // DYNAMIC: substitute variable references
    expr = expr.replace(/\b[A-Z][A-Z0-9_]*\b/g, (token) => {
      if (!map[token]) {
        throw new Error(
          `Unknown variable "${token}" in expression of "${name}".`
        );
      }
      const val = resolve(token);
      return val.toString();
    });

    const result = evaluateExpression(expr);
    values[name] = result;
    resolving.delete(name);
    return result;
  }

  Object.keys(map).forEach((name) => {
    try {
      resolve(name);
    } catch (err) {
      errors[name] = err.message || String(err);
    }
  });

  return { values, errors };
}
