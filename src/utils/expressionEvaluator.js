export function evaluateExpression(expr) {
  const sanitized = expr.replace(/\s+/g, "");

  if (/[^0-9+\-*/().]/.test(sanitized)) {
    throw new Error("Expression contains invalid characters.");
  }

  const tokens = tokenize(sanitized);
  const rpn = toRPN(tokens);
  return evalRPN(rpn);
}

function tokenize(expr) {
  const tokens = [];
  let numberBuffer = "";

  const pushNumber = () => {
    if (numberBuffer.length > 0) {
      tokens.push(numberBuffer);
      numberBuffer = "";
    }
  };

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];

    if (/[0-9.]/.test(ch)) {
      numberBuffer += ch;
    } else if ("+-*/()".includes(ch)) {
      pushNumber();
      tokens.push(ch);
    } else {
      throw new Error("Invalid character in expression.");
    }
  }

  pushNumber();
  return tokens;
}

const precedence = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
};

function toRPN(tokens) {
  const output = [];
  const ops = [];

  tokens.forEach((token) => {
    if (!isNaN(token)) {
      output.push(token);
    } else if (token in precedence) {
      while (
        ops.length > 0 &&
        ops[ops.length - 1] in precedence &&
        precedence[ops[ops.length - 1]] >= precedence[token]
      ) {
        output.push(ops.pop());
      }
      ops.push(token);
    } else if (token === "(") {
      ops.push(token);
    } else if (token === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop());
      }
      if (ops.length === 0) {
        throw new Error("Mismatched parentheses.");
      }
      ops.pop(); // remove "("
    } else {
      throw new Error("Invalid token.");
    }
  });

  while (ops.length > 0) {
    const op = ops.pop();
    if (op === "(" || op === ")") {
      throw new Error("Mismatched parentheses.");
    }
    output.push(op);
  }

  return output;
}

function evalRPN(tokens) {
  const stack = [];

  tokens.forEach((token) => {
    if (!isNaN(token)) {
      stack.push(parseFloat(token));
    } else if (token in precedence) {
      if (stack.length < 2) {
        throw new Error("Invalid expression.");
      }
      const b = stack.pop();
      const a = stack.pop();
      let res;
      switch (token) {
        case "+":
          res = a + b;
          break;
        case "-":
          res = a - b;
          break;
        case "*":
          res = a * b;
          break;
        case "/":
          if (b === 0) {
            throw new Error("Division by zero.");
          }
          res = a / b;
          break;
        default:
          throw new Error("Unknown operator.");
      }
      stack.push(res);
    } else {
      throw new Error("Invalid token in RPN.");
    }
  });

  if (stack.length !== 1) {
    throw new Error("Invalid expression.");
  }

  return stack[0];
}
