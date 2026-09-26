(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const colorSuggestions = ["Đỏ", "Xanh", "Vàng", "Tím", "Trắng"];
  const letter = (index) => String.fromCharCode(65 + index);
  const viNumber = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 });
  const viPercent = new Intl.NumberFormat("vi-VN", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function defaultState() {
    return {
      colors: ["Đỏ", "Xanh"],
      priors: ["0.333333", "0.333333", "0.333333"],
      probabilities: [["0.8", "0.2"], ["0.5", "0.5"], ["0.2", "0.8"]],
      counts: ["1", "0"],
      h0: 0,
      alpha: "0.05",
    };
  }

  let state = defaultState();

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function parseDecimal(raw) {
    const cleaned = String(raw).trim().replace(",", ".");
    if (!cleaned || !/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)) return NaN;
    return Number(cleaned);
  }

  function formatted(value) {
    if (value > 0 && value < 0.000001) return value.toExponential(3).replace(".", ",");
    if (value < 1 && value >= 0.9999995) return value.toString().replace(".", ",");
    return viNumber.format(value);
  }

  function factorial(value) {
    let product = 1;
    for (let k = 2; k <= value; k += 1) product *= k;
    return product;
  }

  function probabilityInput(value, label, onChange) {
    const input = element("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.value = value;
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => {
      onChange(input.value);
      const numeric = parseDecimal(input.value);
      input.setAttribute("aria-invalid", String(!(numeric > 0 && numeric < 1)));
      invalidateResults();
      if (numeric === 1) {
        $("error").textContent = "Không nhập 1 ở ô xác suất vì 1 tương đương 100%.";
        $("error").hidden = false;
      }
    });
    return input;
  }

  function invalidateResults() {
    $("results").hidden = true;
    $("error").hidden = true;
  }

  function renderInputs() {
    const boxCount = state.probabilities.length;
    const colorCount = state.colors.length;
    $("box-count").value = String(boxCount);
    $("color-count").value = String(colorCount);
    $("remove-box").disabled = boxCount <= 2;
    $("add-box").disabled = boxCount >= 8;
    $("remove-color").disabled = colorCount <= 2;
    $("add-color").disabled = colorCount >= 5;

    const head = $("probability-head");
    head.replaceChildren();
    const headingRow = element("tr");
    headingRow.append(element("th", "", "Giả thuyết"));
    headingRow.append(element("th", "", "Tiên nghiệm πᵢ"));
    state.colors.forEach((name, colorIndex) => {
      const cell = element("th");
      const label = element("label", "", "Màu " + (colorIndex + 1));
      const input = element("input");
      input.type = "text";
      input.maxLength = 25;
      input.value = name;
      input.setAttribute("aria-label", "Tên màu " + (colorIndex + 1));
      input.addEventListener("input", () => {
        state.colors[colorIndex] = input.value;
        const updatedName = input.value.trim() || "Màu " + (colorIndex + 1);
        const observationLabel = document.querySelector('[data-observation-label="' + colorIndex + '"]');
        if (observationLabel) observationLabel.textContent = updatedName;
        document.querySelectorAll('[data-prob-color="' + colorIndex + '"]').forEach((field) => {
          field.setAttribute("aria-label", "Xác suất màu " + updatedName + " của hộp " + letter(Number(field.dataset.probBox)));
        });
        const observationInput = document.querySelector('[data-observation-input="' + colorIndex + '"]');
        if (observationInput) observationInput.setAttribute("aria-label", "Số lần rút được màu " + updatedName);
        invalidateResults();
      });
      label.append(input);
      cell.append(label);
      headingRow.append(cell);
    });
    head.append(headingRow);

    const body = $("probability-body");
    body.replaceChildren();
    state.probabilities.forEach((row, boxIndex) => {
      const tr = element("tr");
      tr.append(element("th", "", "H" + letter(boxIndex) + " · Hộp " + letter(boxIndex)));
      const priorCell = element("td");
      priorCell.append(probabilityInput(state.priors[boxIndex], "Tiên nghiệm hộp " + letter(boxIndex), (value) => {
        state.priors[boxIndex] = value;
      }));
      tr.append(priorCell);
      row.forEach((value, colorIndex) => {
        const cell = element("td");
        const field = probabilityInput(value, "Xác suất màu " + (state.colors[colorIndex] || colorIndex + 1) + " của hộp " + letter(boxIndex), (newValue) => {
          state.probabilities[boxIndex][colorIndex] = newValue;
        });
        field.dataset.probColor = String(colorIndex);
        field.dataset.probBox = String(boxIndex);
        cell.append(field);
        tr.append(cell);
      });
      body.append(tr);
    });

    const observations = $("observation-fields");
    observations.replaceChildren();
    state.colors.forEach((name, colorIndex) => {
      const label = element("label");
      const span = element("span", "", name.trim() || "Màu " + (colorIndex + 1));
      span.dataset.observationLabel = String(colorIndex);
      const input = element("input");
      input.type = "number";
      input.min = "0";
      input.max = "30";
      input.step = "1";
      input.inputMode = "numeric";
      input.value = state.counts[colorIndex];
      input.dataset.observationInput = String(colorIndex);
      input.setAttribute("aria-label", "Số lần rút được màu " + (name.trim() || colorIndex + 1));
      input.addEventListener("input", () => {
        state.counts[colorIndex] = input.value;
        const numeric = Number(input.value);
        input.setAttribute("aria-invalid", String(!input.value || !Number.isInteger(numeric) || numeric < 0));
        invalidateResults();
      });
      label.append(span, input);
      observations.append(label);
    });

    const select = $("h0-select");
    select.replaceChildren();
    for (let index = 0; index < boxCount; index += 1) {
      const option = element("option", "", "H" + letter(index) + " · Hộp " + letter(index));
      option.value = String(index);
      select.append(option);
    }
    select.value = String(state.h0);
    $("alpha-input").value = state.alpha;
    invalidateResults();
  }

  function balancedRow(rawValues, targetLength, added) {
    let values = rawValues.map(parseDecimal);
    if (added) {
      const oldSum = values.reduce((total, value) => total + value, 0);
      values.push(oldSum / values.length);
    }
    else values = values.slice(0, targetLength);
    if (values.length !== targetLength || values.some((value) => !Number.isFinite(value) || value <= 0)) {
      values = new Array(targetLength).fill(1);
    }
    const sum = values.reduce((total, value) => total + value, 0);
    return values.map((value) => String(Number((value / sum).toPrecision(10))));
  }

  function changeBoxCount(delta) {
    const next = state.probabilities.length + delta;
    if (next < 2 || next > 8) return;
    if (delta > 0) {
      state.probabilities.push(new Array(state.colors.length).fill(String(1 / state.colors.length)));
    } else {
      state.probabilities.pop();
      state.h0 = Math.min(state.h0, next - 1);
    }
    state.priors = new Array(next).fill(String(Number((1 / next).toPrecision(10))));
    $("shape-note").textContent = "Đã chia đều lại tiên nghiệm cho " + next + " hộp.";
    renderInputs();
  }

  function changeColorCount(delta) {
    const next = state.colors.length + delta;
    if (next < 2 || next > 5) return;
    if (delta > 0) {
      state.colors.push(colorSuggestions[next - 1]);
      state.counts.push("0");
    } else {
      state.colors.pop();
      state.counts.pop();
    }
    state.probabilities = state.probabilities.map((row) => balancedRow(row, next, delta > 0));
    $("shape-note").textContent = "Đã chuẩn hóa lại xác suất màu trong từng hộp.";
    renderInputs();
  }

  function readState() {
    const colorNames = state.colors.map((name) => name.trim());
    if (colorNames.some((name) => !name)) throw new Error("Hãy đặt tên cho tất cả các màu.");
    if (new Set(colorNames.map((name) => name.toLocaleLowerCase("vi-VN"))).size !== colorNames.length) {
      throw new Error("Tên các màu không được trùng nhau.");
    }
    const priors = state.priors.map(parseDecimal);
    const probabilities = state.probabilities.map((row) => row.map(parseDecimal));
    const counts = state.counts.map((value) => value === "" ? NaN : Number(value));
    const alpha = parseDecimal(state.alpha);
    return { colorNames, priors, probabilities, counts, alpha, h0: state.h0 };
  }

  function appendLine(parent, text) {
    parent.append(element("p", "", text));
  }

  function renderResult(result, colorNames) {
    $("decision-card").classList.toggle("reject", result.reject);
    $("decision-title").textContent = result.reject
      ? "Bác bỏ H₀: hộp " + letter(result.h0)
      : "Chưa đủ bằng chứng bác bỏ H₀";
    $("decision-text").textContent = result.reject
      ? "Dữ liệu ít có khả năng xảy ra nếu chọn hộp " + letter(result.h0) + ". Kết luận này dùng mức ý nghĩa đã chọn, không khẳng định chắc chắn một hộp khác."
      : "Với " + result.n + " lần rút, dữ liệu chưa đủ hiếm dưới giả thuyết chọn hộp " + letter(result.h0) + ".";
    $("p-value").textContent = formatted(result.pValue);
    $("alpha-value").textContent = formatted(result.alpha);
    $("observed-probability").textContent = formatted(result.observedProbability);
    $("winner-text").textContent = "Hộp " + letter(result.winnerIndex) + " có hậu nghiệm lớn nhất: " + viPercent.format(result.posteriors[result.winnerIndex]) + ". Đây là so sánh Bayes giữa các hộp đã nhập.";

    const bars = $("posterior-bars");
    bars.replaceChildren();
    result.posteriors.forEach((posterior, index) => {
      const row = element("div", "bar-row" + (index === result.winnerIndex ? " winner" : ""));
      row.append(element("strong", "", "H" + letter(index)));
      const track = element("div", "bar-track");
      const fill = element("div", "bar-fill");
      fill.style.width = (posterior * 100).toFixed(4) + "%";
      track.append(fill);
      row.append(track, element("span", "", viPercent.format(posterior)));
      bars.append(row);
    });

    const worked = $("worked-formula");
    worked.replaceChildren();
    appendLine(worked, "D = " + colorNames.map((name, index) => result.counts[index] + " " + name.toLowerCase()).join(", ") + "; n = " + result.n + ".");
    const coefficient = factorial(result.n) / result.counts.reduce((product, count) => product * factorial(count), 1);
    appendLine(worked, "Hệ số chung C = " + result.n + "! / (" + result.counts.map((count) => count + "!").join(" × ") + ") ≈ " + formatted(coefficient) + ".");
    result.probabilities.forEach((row, index) => {
      const product = row.map((value, colorIndex) => formatted(value) + "^" + result.counts[colorIndex]).join(" × ");
      appendLine(worked, "L" + letter(index) + " = C × " + product + " = " + formatted(result.likelihoods[index]) + ".");
    });
    const evidence = result.likelihoods.reduce((total, likelihood, index) => total + result.priors[index] * likelihood, 0);
    appendLine(worked, "P(D) = Σ πⱼLⱼ = " + result.priors.map((prior, index) => formatted(prior) + " × " + formatted(result.likelihoods[index])).join(" + ") + " = " + formatted(evidence) + ".");
    result.posteriors.forEach((posterior, index) => {
      appendLine(worked, "P(H" + letter(index) + " | D) = (" + formatted(result.priors[index]) + " × " + formatted(result.likelihoods[index]) + ") / " + formatted(evidence) + " = " + viPercent.format(posterior) + ".");
    });
    $("results").hidden = false;
  }

  function calculate() {
    try {
      const input = readState();
      const result = BallStats.calculate(input);
      $("error").hidden = true;
      renderResult(result, input.colorNames);
    } catch (error) {
      $("results").hidden = true;
      $("error").textContent = error.message;
      $("error").hidden = false;
    }
  }

  $("remove-box").addEventListener("click", () => changeBoxCount(-1));
  $("add-box").addEventListener("click", () => changeBoxCount(1));
  $("remove-color").addEventListener("click", () => changeColorCount(-1));
  $("add-color").addEventListener("click", () => changeColorCount(1));
  $("h0-select").addEventListener("change", (event) => {
    state.h0 = Number(event.target.value);
    invalidateResults();
  });
  $("alpha-input").addEventListener("input", (event) => {
    state.alpha = event.target.value;
    const numeric = parseDecimal(state.alpha);
    event.target.setAttribute("aria-invalid", String(!(numeric > 0 && numeric < 1)));
    invalidateResults();
    if (numeric === 1) {
      $("error").textContent = "Không nhập 1 cho mức ý nghĩa α; hãy chọn một giá trị nhỏ hơn 1.";
      $("error").hidden = false;
    }
  });
  $("calculate").addEventListener("click", calculate);
  $("load-example").addEventListener("click", () => {
    state = defaultState();
    $("shape-note").textContent = "Đã điền ví dụ 3 hộp: quan sát 1 bi đỏ.";
    renderInputs();
    calculate();
  });

  renderInputs();
  calculate();
})();
