import React, { useMemo, useState } from "react";
import { evaluateExpression } from "../utils/expressionEvaluator";

function extractContextVars(expression) {
  const regex = /\{\{#([^}]+)\}\}/g;
  const result = new Set();
  let match;
  while ((match = regex.exec(expression)) !== null) {
    result.add(match[1]);
  }
  return Array.from(result);
}

export default function FormulasSection({
  formulas,
  setFormulas,
  resolvedValues,
  variableErrors,
}) {
  const [formState, setFormState] = useState({
    name: "",
    expression: "",
  });
  const [error, setError] = useState("");

  const [execState, setExecState] = useState({
    open: false,
    formula: null,
    contextVars: [],
    contextValues: {},
    result: null,
    execError: "",
  });

  const formulaList = useMemo(
    () =>
      [...formulas].sort((a, b) => a.name.localeCompare(b.name)),
    [formulas]
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "name" ? value.toUpperCase() : value,
    }));
  }

  function validateExpression(expression) {
    const re = /^[0-9A-Za-z_+\-*/(){}#\s.]+$/;
    if (!re.test(expression)) {
      return "Expression contains invalid characters.";
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = formState.name.trim().toUpperCase();
    const expression = formState.expression.trim();

    if (!name) {
      setError("Formula name is required.");
      return;
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      setError(
        "Formula name must start with a letter and contain only A–Z, 0–9, and underscore."
      );
      return;
    }
    if (!expression) {
      setError("Expression is required.");
      return;
    }

    const exprError = validateExpression(expression);
    if (exprError) {
      setError(exprError);
      return;
    }

    const exists = formulas.some((f) => f.name === name);
    if (exists) {
      setError("Formula name already exists.");
      return;
    }

    setFormulas((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        expression,
      },
    ]);
    setFormState({ name: "", expression: "" });
    setError("");
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this formula?")) return;
    setFormulas((prev) => prev.filter((f) => f.id !== id));
  }

  function openExecuteModal(formula) {
    const ctxVars = extractContextVars(formula.expression);
    const ctxValues = {};
    ctxVars.forEach((v) => (ctxValues[v] = ""));
    setExecState({
      open: true,
      formula,
      contextVars: ctxVars,
      contextValues: ctxValues,
      result: null,
      execError: "",
    });
  }

  function closeExecuteModal() {
    setExecState((prev) => ({ ...prev, open: false }));
  }

  function handleContextChange(name, value) {
    setExecState((prev) => ({
      ...prev,
      contextValues: { ...prev.contextValues, [name]: value },
    }));
  }

  function performExecution() {
    const formula = execState.formula;
    if (!formula) return;

    try {
      let expr = formula.expression;

      // 1) Substitute contextual variables
      execState.contextVars.forEach((ctxName) => {
        const rawVal = execState.contextValues[ctxName].trim();
        if (rawVal === "") {
          throw new Error(`Context value for "${ctxName}" is required.`);
        }
        if (!/^[0-9.]+$/.test(rawVal)) {
          throw new Error(
            `Context value for "${ctxName}" must be numeric.`
          );
        }
        const re = new RegExp(
          "\\{\\{#" + ctxName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\}\\}",
          "g"
        );
        expr = expr.replace(re, rawVal);
      });

      // 2) Substitute variables
      expr = expr.replace(/\b[A-Z][A-Z0-9_]*\b/g, (token) => {
        if (resolvedValues[token] === undefined) {
          throw new Error(`Unknown variable "${token}" in formula.`);
        }
        if (variableErrors[token]) {
          throw new Error(
            `Variable "${token}" has error: ${variableErrors[token]}`
          );
        }
        return resolvedValues[token].toString();
      });

      // 3) Evaluate final result (PEMDAS)
      const result = evaluateExpression(expr);

      setExecState((prev) => ({
        ...prev,
        result,
        execError: "",
      }));
    } catch (err) {
      setExecState((prev) => ({
        ...prev,
        result: null,
        execError: err.message || String(err),
      }));
    }
  }

  return (
    <div>
      <h2 className="section-title">Formulas</h2>
      <p className="section-caption">
        Create formulas using variables and contextual placeholders like{" "}
        <code className="inline-code">{'{{#num_of_days}}'}</code>. Execute
        them with runtime inputs.
      </p>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-row vertical">
          <div className="form-field">
            <label>Formula Name</label>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="NET_SALARY"
            />
          </div>
          <div className="form-field">
            <label>Expression</label>
            <textarea
              name="expression"
              value={formState.expression}
              onChange={handleChange}
              rows={2}
              placeholder="GROSS - DEDUCTIONS"
            />
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="form-actions">
          <button type="submit" className="btn primary">
            Add Formula
          </button>
        </div>
      </form>

      <div className="formula-grid">
        {formulaList.length === 0 && (
          <div className="empty-state">No formulas defined yet.</div>
        )}

        {formulaList.map((f) => (
          <div className="card formula-card" key={f.id}>
            <div className="formula-header">
              <h3 className="formula-name">{f.name}</h3>
            </div>
            <p className="formula-expression mono">{f.expression}</p>
            <div className="formula-actions">
              <button
                type="button"
                className="btn primary small"
                onClick={() => openExecuteModal(f)}
              >
                Execute
              </button>
              <button
                type="button"
                className="btn danger small"
                onClick={() => handleDelete(f.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {execState.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Execute: {execState.formula?.name}</h3>
            <p className="mono modal-expression">
              {execState.formula?.expression}
            </p>

            {execState.contextVars.length > 0 ? (
              <div className="modal-section">
                <h4>Contextual Inputs</h4>
                {execState.contextVars.map((name) => (
                  <div className="form-field" key={name}>
                    <label>{name}</label>
                    <input
                      value={execState.contextValues[name] || ""}
                      onChange={(e) =>
                        handleContextChange(name, e.target.value)
                      }
                      placeholder="Enter numeric value"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="info-text">
                This formula has no contextual placeholders. It will be
                evaluated directly using variables.
              </p>
            )}

            <div className="modal-section">
              <button
                type="button"
                className="btn primary"
                onClick={performExecution}
              >
                Run Evaluation
              </button>
            </div>

            {execState.execError && (
              <div className="error-text">{execState.execError}</div>
            )}
            {execState.result !== null && !execState.execError && (
              <div className="result-box">
                Result: <span className="mono">{execState.result}</span>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn ghost"
                onClick={closeExecuteModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
