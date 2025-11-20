import React, { useMemo, useState } from "react";
import VariablesSection from "./components/VariablesSection";
import FormulasSection from "./components/FormulasSection";
import { resolveVariables } from "./utils/variableResolver";

const initialVariables = [
  { id: 1, name: "BASIC", type: "CONSTANT", expression: "10000" },
  { id: 2, name: "DA", type: "CONSTANT", expression: "2000" },
  { id: 3, name: "HRA", type: "CONSTANT", expression: "3000" },
  {
    id: 4,
    name: "GROSS",
    type: "DYNAMIC",
    expression: "BASIC + DA + HRA",
  },
  { id: 5, name: "PF", type: "CONSTANT", expression: "1200" },
  { id: 6, name: "TAX", type: "CONSTANT", expression: "500" },
  {
    id: 7,
    name: "DEDUCTIONS",
    type: "DYNAMIC",
    expression: "PF + TAX",
  },
];

const initialFormulas = [
  {
    id: 1,
    name: "NET_SALARY",
    expression: "GROSS - DEDUCTIONS",
  },
  {
    id: 2,
    name: "MONTHLY_SALARY",
    expression: "(GROSS / 30) * {{#num_of_days}}",
  },
  {
    id: 3,
    name: "BONUS",
    expression: "GROSS * {{#bonus_percentage}} / 100",
  },
];

export default function App() {
  const [variables, setVariables] = useState(initialVariables);
  const [formulas, setFormulas] = useState(initialFormulas);

  const { values: resolvedValues, errors: variableErrors } = useMemo(
    () => resolveVariables(variables),
    [variables]
  );

  const hasVariableErrors = Object.keys(variableErrors).length > 0;

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-main">
          <div>
            <div className="app-badge">Web Developer Intern · Assignment</div>
            <h1>Formula Builder Studio</h1>
            <p className="subtitle">
              Define salary components as variables, create reusable formulas,
              and evaluate them with runtime inputs and proper math precedence.
            </p>
          </div>

          <div className="app-header-actions">
            <button
              type="button"
              className="btn header-btn"
              onClick={() => scrollToSection("variables-section")}
            >
              Variables
            </button>
            <button
              type="button"
              className="btn header-btn"
              onClick={() => scrollToSection("formulas-section")}
            >
              Formulas
            </button>
          </div>
        </div>

        <div className="app-header-meta">
          <div className="meta-chip">
            <span className="meta-label">Example:</span>
            <span className="mono">BASIC = 10000, GROSS = BASIC + DA + HRA</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Contextual placeholder:</span>
            <span className="mono">{'{{#num_of_days}}'}</span>
          </div>
        </div>

        {hasVariableErrors && (
          <div className="banner banner-warning">
            Some variables could not be resolved. Check the error messages in the
            Variables section before executing formulas.
          </div>
        )}
      </header>

      <main className="app-main">
        <section className="panel" id="variables-section">
          <VariablesSection
            variables={variables}
            setVariables={setVariables}
            resolvedValues={resolvedValues}
            variableErrors={variableErrors}
          />
        </section>

        <section className="panel" id="formulas-section">
          <FormulasSection
            formulas={formulas}
            setFormulas={setFormulas}
            resolvedValues={resolvedValues}
            variableErrors={variableErrors}
          />
        </section>
      </main>

      <footer className="app-footer">
        <small>
          Built for evaluation purposes · React + Vite · Supports constants,
          dynamic variables, contextual inputs, and PEMDAS evaluation.
        </small>
      </footer>
    </div>
  );
}
