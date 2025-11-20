import React, { useState } from "react";

const VAR_TYPES = [
  { value: "CONSTANT", label: "Constant" },
  { value: "DYNAMIC", label: "Dynamic" },
];

export default function VariablesSection({
  variables,
  setVariables,
  resolvedValues,
  variableErrors,
}) {
  const [formState, setFormState] = useState({
    id: null,
    name: "",
    type: "CONSTANT",
    expression: "",
  });
  const [error, setError] = useState("");

  const isEditing = formState.id !== null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "name" ? value.toUpperCase() : value,
    }));
  }

  function resetForm() {
    setFormState({
      id: null,
      name: "",
      type: "CONSTANT",
      expression: "",
    });
    setError("");
  }

  function validateExpression(expr, type) {
    const re =
      type === "CONSTANT"
        ? /^[0-9.\s]+$/
        : /^[0-9A-Z_+\-*/().\s]+$/;

    if (!re.test(expr)) {
      return "Expression contains invalid characters.";
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = formState.name.trim().toUpperCase();
    const type = formState.type;
    const expression = formState.expression.trim();

    if (!name) {
      setError("Variable name is required.");
      return;
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      setError(
        "Name must start with a letter and contain only A–Z, 0–9, and underscore."
      );
      return;
    }
    if (!expression) {
      setError("Expression / value is required.");
      return;
    }

    const exprError = validateExpression(expression, type);
    if (exprError) {
      setError(exprError);
      return;
    }

    const exists = variables.some(
      (v) => v.name === name && v.id !== formState.id
    );
    if (exists) {
      setError("Variable name already exists.");
      return;
    }

    if (isEditing) {
      setVariables((prev) =>
        prev.map((v) =>
          v.id === formState.id ? { ...v, name, type, expression } : v
        )
      );
    } else {
      setVariables((prev) => [
        ...prev,
        {
          id: Date.now(),
          name,
          type,
          expression,
        },
      ]);
    }

    resetForm();
  }

  function handleEdit(variable) {
    setFormState({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      expression: variable.expression,
    });
    setError("");
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this variable?")) return;
    setVariables((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div>
      <h2 className="section-title">Variables</h2>
      <p className="section-caption">
        Define constant numbers (like <span className="mono">BASIC = 10000</span>) and
        dynamic variables that are calculated from other variables (like{" "}
        <span className="mono">GROSS = BASIC + DA + HRA</span>).
      </p>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label>Variable Name</label>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="BASIC"
            />
            <p className="field-hint">
              Use UPPERCASE and underscores, for example:{" "}
              <span className="mono">GROSS_SALARY</span>.
            </p>
          </div>
          <div className="form-field">
            <label>Type</label>
            <select
              name="type"
              value={formState.type}
              onChange={handleChange}
            >
              {VAR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="field-hint">
              <strong>Constant</strong> = fixed number,{" "}
              <strong>Dynamic</strong> = expression using other variables.
            </p>
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>
              {formState.type === "CONSTANT"
                ? "Numeric Value"
                : "Expression"}
            </label>
            <input
              name="expression"
              value={formState.expression}
              onChange={handleChange}
              placeholder={
                formState.type === "CONSTANT"
                  ? "10000"
                  : "BASIC + DA + HRA"
              }
            />
            <p className="field-hint">
              Allowed: numbers, variable names, and + − * / with brackets.
            </p>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn primary">
            {isEditing ? "Update Variable" : "Add Variable"}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn ghost"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="card table-card">
        <div className="table-header-row">
          <span>Name</span>
          <span>Type</span>
          <span>Expression</span>
          <span>Resolved Value</span>
          <span>Actions</span>
        </div>
        {variables.length === 0 && (
          <div className="empty-state">
            No variables yet. Start by adding{" "}
            <span className="mono">BASIC</span>, <span className="mono">DA</span>,{" "}
            and <span className="mono">HRA</span>.
          </div>
        )}
        {variables.map((v) => {
          const resolved = resolvedValues[v.name];
          const err = variableErrors[v.name];
          return (
            <div className="table-row" key={v.id}>
              <span className="mono">{v.name}</span>
              <span>
                <span
                  className={
                    v.type === "CONSTANT"
                      ? "badge badge-constant"
                      : "badge badge-dynamic"
                  }
                >
                  {v.type}
                </span>
              </span>
              <span className="mono">{v.expression}</span>
              <span className="mono">
                {err
                  ? `⚠ ${err}`
                  : resolved !== undefined
                  ? resolved
                  : "-"}
              </span>
              <span className="row-actions">
                <button
                  className="btn small"
                  type="button"
                  onClick={() => handleEdit(v)}
                >
                  Edit
                </button>
                <button
                  className="btn small danger"
                  type="button"
                  onClick={() => handleDelete(v.id)}
                >
                  Delete
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
