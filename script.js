
const resultDisplay = document.getElementById("result");
const expressionDisplay = document.getElementById("expression");

const historyButton = document.getElementById("historyButton");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");

let currentInput = "0";
let previousInput = null;
let operator = null;
let waitingForOperand = false;
let expression = "";
let memory = 0;

// Load saved calculation history from the browser
function loadHistory() {
    try {
        const saved = localStorage.getItem("calculatorHistory");
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed)
            ? parsed.filter(item =>
                item &&
                typeof item.expression === "string" &&
                typeof item.result === "string"
            ).slice(0, 50)
            : [];
    } catch {
        return [];
    }
}

let calculationHistory = loadHistory();

// Save history in the browser
function saveHistory() {
    try {
        localStorage.setItem(
            "calculatorHistory",
            JSON.stringify(calculationHistory)
        );
    } catch (error) {
        console.warn("Could not save calculation history.", error);
    }
}

// Format numbers for the display
function formatNumber(number) {
    if (!Number.isFinite(number)) {
        return "Error";
    }

    if (number === 0) {
        return "0";
    }

    return String(Number(number.toPrecision(12)));
}

// Update the calculator display
function updateDisplay() {
    resultDisplay.textContent = currentInput;
    expressionDisplay.textContent = expression;
}

// Enter a digit
function enterDigit(digit) {
    if (currentInput === "Error" || waitingForOperand) {
        currentInput = digit;
        waitingForOperand = false;
    } else if (
        currentInput.replace(/[-.]/g, "").length < 15
    ) {
        currentInput =
            currentInput === "0"
                ? digit
                : currentInput + digit;
    }

    updateDisplay();
}

// Enter a decimal point
function enterDecimal() {
    if (currentInput === "Error" || waitingForOperand) {
        currentInput = "0.";
        waitingForOperand = false;
    } else if (!currentInput.includes(".")) {
        currentInput += ".";
    }

    updateDisplay();
}

// Perform arithmetic
function calculate(a, b, op) {
    switch (op) {
        case "+":
            return a + b;

        case "−":
            return a - b;

        case "×":
            return a * b;

        case "÷":
            return b === 0 ? NaN : a / b;

        default:
            return b;
    }
}

// Choose an arithmetic operator
function chooseOperator(nextOperator) {
    if (currentInput === "Error") {
        return;
    }

    const inputValue = Number(currentInput);

    if (operator !== null && !waitingForOperand) {
        const answer = calculate(
            previousInput,
            inputValue,
            operator
        );

        currentInput = formatNumber(answer);

        if (currentInput === "Error") {
            previousInput = null;
            operator = null;
            expression = "";
            waitingForOperand = true;
            updateDisplay();
            return;
        }

        previousInput = answer;
    } else {
        previousInput = inputValue;
    }

    operator = nextOperator;

    expression =
        `${formatNumber(previousInput)} ${operator}`;

    waitingForOperand = true;
    updateDisplay();
}

// Add a completed calculation to history
function addToHistory(calculationExpression, answer) {
    if (!Number.isFinite(answer)) {
        return;
    }

    calculationHistory.unshift({
        expression: calculationExpression,
        result: formatNumber(answer)
    });

    // Keep the latest 50 calculations
    calculationHistory = calculationHistory.slice(0, 50);

    saveHistory();
    renderHistory();
}

// Calculate the final result
function equals() {
    if (
        operator === null ||
        waitingForOperand ||
        currentInput === "Error"
    ) {
        return;
    }

    const first = previousInput;
    const second = Number(currentInput);
    const selectedOperator = operator;

    const answer = calculate(
        first,
        second,
        selectedOperator
    );

    const calculationExpression =
        `${formatNumber(first)} ${selectedOperator} ` +
        `${formatNumber(second)} =`;

    currentInput = formatNumber(answer);
    expression = calculationExpression;

    // Save only valid, finite results
    addToHistory(calculationExpression, answer);

    operator = null;
    previousInput = null;
    waitingForOperand = true;

    updateDisplay();
}

// Clear everything
function clearAll() {
    currentInput = "0";
    previousInput = null;
    operator = null;
    waitingForOperand = false;
    expression = "";

    updateDisplay();
}

// Clear the current entry
function clearEntry() {
    currentInput = "0";
    waitingForOperand = false;

    updateDisplay();
}

// Delete the last digit
function backspace() {
    if (waitingForOperand || currentInput === "Error") {
        return;
    }

    if (
        currentInput.length <= 1 ||
        (currentInput.length === 2 &&
         currentInput.startsWith("-"))
    ) {
        currentInput = "0";
    } else {
        currentInput = currentInput.slice(0, -1);
    }

    updateDisplay();
}

// Change the sign of a number
function changeSign() {
    if (currentInput === "Error") {
        return;
    }

    const value = Number(currentInput);

    if (value !== 0) {
        currentInput = currentInput.startsWith("-")
            ? currentInput.slice(1)
            : "-" + currentInput;
    }

    updateDisplay();
}

// Convert the current number to a percentage
function percentage() {
    if (currentInput === "Error") {
        return;
    }

    currentInput = formatNumber(
        Number(currentInput) / 100
    );

    waitingForOperand = false;
    updateDisplay();
}

// Square root
function squareRoot() {
    if (currentInput === "Error") {
        return;
    }

    const value = Number(currentInput);
    const answer = Math.sqrt(value);

    expression = `√(${formatNumber(value)})`;
    currentInput = formatNumber(answer);
    waitingForOperand = true;

    if (Number.isFinite(answer)) {
        addToHistory(expression + " =", answer);
    }

    updateDisplay();
}

// Square a number
function square() {
    if (currentInput === "Error") {
        return;
    }

    const value = Number(currentInput);
    const answer = value * value;

    expression = `sqr(${formatNumber(value)})`;
    currentInput = formatNumber(answer);
    waitingForOperand = true;

    if (Number.isFinite(answer)) {
        addToHistory(expression + " =", answer);
    }

    updateDisplay();
}

// Reciprocal: 1 divided by the current number
function reciprocal() {
    if (currentInput === "Error") {
        return;
    }

    const value = Number(currentInput);
    const answer = value === 0 ? NaN : 1 / value;

    expression = `1 / ${formatNumber(value)}`;
    currentInput = formatNumber(answer);
    waitingForOperand = true;

    if (Number.isFinite(answer)) {
        addToHistory(expression + " =", answer);
    }

    updateDisplay();
}

// Memory functions
function memoryAction(action) {
    if (currentInput === "Error") {
        return;
    }

    const value = Number(currentInput);

    switch (action) {
        case "MC":
            memory = 0;
            break;

        case "MR":
        case "M":
            currentInput = formatNumber(memory);
            waitingForOperand = true;
            break;

        case "M+":
            memory += value;
            break;

        case "M-":
            memory -= value;
            break;

        case "MS":
            memory = value;
            break;
    }

    // Enable memory recall and clear buttons
    document.querySelector(
        '[data-value="MC"]'
    ).disabled = false;

    document.querySelector(
        '[data-value="MR"]'
    ).disabled = false;

    updateDisplay();
}

// Display the calculation history
function renderHistory() {
    historyList.replaceChildren();

    if (calculationHistory.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "history-empty";
        emptyMessage.textContent = "No history yet";

        historyList.appendChild(emptyMessage);
        return;
    }

    calculationHistory.forEach((item) => {
        const entry = document.createElement("div");
        entry.className = "history-item";
        entry.tabIndex = 0;
        entry.setAttribute("role", "button");
        entry.setAttribute(
            "aria-label",
            `Use result ${item.result}`
        );

        const expressionText = document.createElement("div");
        expressionText.className = "history-expression";
        expressionText.textContent = item.expression;

        const resultText = document.createElement("div");
        resultText.className = "history-result";
        resultText.textContent = item.result;

        entry.append(expressionText, resultText);

        // Click a history item to reuse its result
        function useResult() {
            currentInput = item.result;
            previousInput = null;
            operator = null;
            waitingForOperand = true;
            expression = item.expression;

            updateDisplay();
            historyPanel.hidden = true;
        }

        entry.addEventListener("click", useResult);

        entry.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                useResult();
            }
        });

        historyList.appendChild(entry);
    });
}

// Open or close the history panel
historyButton.addEventListener("click", () => {
    historyPanel.hidden = !historyPanel.hidden;

    if (!historyPanel.hidden) {
        renderHistory();
    }
});

// Clear saved history
clearHistoryButton.addEventListener("click", () => {
    calculationHistory = [];

    saveHistory();
    renderHistory();
});

// Handle calculator button clicks
document.querySelector(".calculator").addEventListener(
    "click",
    function(event) {
        const button = event.target.closest("button");

        if (!button || button.disabled) {
            return;
        }

        const action = button.dataset.action;
        const value = button.dataset.value;

        switch (action) {
            case "digit":
                enterDigit(value);
                break;

            case "decimal":
                enterDecimal();
                break;

            case "operator":
                chooseOperator(value);
                break;

            case "equals":
                equals();
                break;

            case "clear":
                clearAll();
                break;

            case "clear-entry":
                clearEntry();
                break;

            case "backspace":
                backspace();
                break;

            case "sign":
                changeSign();
                break;

            case "percent":
                percentage();
                break;

            case "sqrt":
                squareRoot();
                break;

            case "square":
                square();
                break;

            case "reciprocal":
                reciprocal();
                break;

            case "memory":
                memoryAction(value);
                break;
        }
    }
);

// Keyboard support
document.addEventListener("keydown", function(event) {
    // Do not intercept browser shortcuts
    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        enterDigit(key);
    } else if (key === ".") {
        enterDecimal();
    } else if (key === "+") {
        chooseOperator("+");
    } else if (key === "-") {
        chooseOperator("−");
    } else if (key === "*") {
        chooseOperator("×");
    } else if (key === "/") {
        event.preventDefault();
        chooseOperator("÷");
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        equals();
    } else if (key === "Backspace") {
        backspace();
    } else if (key === "Escape") {
        clearAll();
    } else if (key === "%") {
        percentage();
    }
});

// Initialize the calculator and history
updateDisplay();
renderHistory();
