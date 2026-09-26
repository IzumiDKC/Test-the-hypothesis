/* Các phép tính độc lập với giao diện, dùng được cả trong trình duyệt và Node.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BallStats = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SUM_TOLERANCE = 0.001;

  function isProbability(value) {
    return Number.isFinite(value) && value > 0 && value < 1;
  }

  function normalizeDistribution(values, label) {
    if (!Array.isArray(values) || values.length < 2) {
      throw new Error(label + " cần ít nhất 2 giá trị.");
    }
    if (!values.every(isProbability)) {
      throw new Error(label + ": mỗi xác suất phải lớn hơn 0 và nhỏ hơn 1. Không nhập 1 (100%).");
    }
    const sum = values.reduce((total, value) => total + value, 0);
    if (Math.abs(sum - 1) > SUM_TOLERANCE + 1e-12) {
      throw new Error(label + " phải có tổng bằng 1 (hiện là " + sum.toFixed(6) + ").");
    }
    // Cho phép sai số làm tròn khi người dùng nhập 1/3 = 0,3333.
    return values.map((value) => value / sum);
  }

  function logFactorials(n) {
    const values = [0];
    for (let i = 1; i <= n; i += 1) values[i] = values[i - 1] + Math.log(i);
    return values;
  }

  function logMultinomialProbability(counts, probabilities, logFacts) {
    const n = counts.reduce((total, count) => total + count, 0);
    let logProbability = logFacts[n];
    for (let c = 0; c < counts.length; c += 1) {
      logProbability -= logFacts[counts[c]];
      if (counts[c] > 0) logProbability += counts[c] * Math.log(probabilities[c]);
    }
    return logProbability;
  }

  /**
   * Kiểm định đa thức chính xác: cộng P(K=k | H0) với mọi vector k có
   * xác suất không lớn hơn xác suất của vector quan sát.
   */
  function exactMultinomialPValue(probabilities, counts) {
    const n = counts.reduce((total, count) => total + count, 0);
    const logFacts = logFactorials(n);
    const observedLogP = logMultinomialProbability(counts, probabilities, logFacts);
    const candidate = new Array(counts.length).fill(0);
    let sum = 0;
    let compensation = 0;
    let outcomes = 0;

    function enumerate(colorIndex, remaining) {
      if (colorIndex === candidate.length - 1) {
        candidate[colorIndex] = remaining;
        outcomes += 1;
        const logP = logMultinomialProbability(candidate, probabilities, logFacts);
        if (logP <= observedLogP + 1e-10) {
          // Cộng Kahan để giảm sai số khi có nhiều vector kết quả.
          const term = Math.exp(logP) - compensation;
          const next = sum + term;
          compensation = (next - sum) - term;
          sum = next;
        }
        return;
      }
      for (let k = 0; k <= remaining; k += 1) {
        candidate[colorIndex] = k;
        enumerate(colorIndex + 1, remaining - k);
      }
    }

    enumerate(0, n);
    return {
      pValue: Math.min(1, Math.max(0, sum)),
      observedProbability: Math.exp(observedLogP),
      outcomes,
    };
  }

  function calculate(input) {
    const { priors, probabilities, counts, h0, alpha } = input;
    if (!Array.isArray(probabilities) || probabilities.length < 2 || probabilities.length > 8) {
      throw new Error("Số hộp phải từ 2 đến 8.");
    }
    if (!Array.isArray(counts) || counts.length < 2 || counts.length > 5) {
      throw new Error("Số màu phải từ 2 đến 5.");
    }
    if (!counts.every((count) => Number.isInteger(count) && count >= 0)) {
      throw new Error("Số bi quan sát của từng màu phải là số nguyên không âm.");
    }
    const n = counts.reduce((total, count) => total + count, 0);
    if (n < 1 || n > 30) {
      throw new Error("Tổng số lần rút phải từ 1 đến 30.");
    }
    if (!Number.isInteger(h0) || h0 < 0 || h0 >= probabilities.length) {
      throw new Error("Hãy chọn một hộp hợp lệ cho H₀.");
    }
    if (!isProbability(alpha)) {
      throw new Error("Mức ý nghĩa α phải lớn hơn 0 và nhỏ hơn 1.");
    }
    if (!Array.isArray(priors) || priors.length !== probabilities.length) {
      throw new Error("Mỗi hộp cần một xác suất chọn ban đầu.");
    }

    const normalizedPriors = normalizeDistribution(priors, "Xác suất chọn các hộp");
    const normalizedProbabilities = probabilities.map((row, index) => {
      if (!Array.isArray(row) || row.length !== counts.length) {
        throw new Error("Hộp " + (index + 1) + " cần xác suất cho đủ các màu.");
      }
      return normalizeDistribution(row, "Xác suất màu của hộp " + (index + 1));
    });

    const logFacts = logFactorials(n);
    const logLikelihoods = normalizedProbabilities.map((row) =>
      logMultinomialProbability(counts, row, logFacts)
    );
    const logWeights = logLikelihoods.map((value, index) => value + Math.log(normalizedPriors[index]));
    const highestLogWeight = Math.max(...logWeights);
    const scaledWeights = logWeights.map((value) => Math.exp(value - highestLogWeight));
    const scaledTotal = scaledWeights.reduce((total, value) => total + value, 0);
    const posteriors = scaledWeights.map((value) => value / scaledTotal);
    const exact = exactMultinomialPValue(normalizedProbabilities[h0], counts);

    return {
      n,
      priors: normalizedPriors,
      probabilities: normalizedProbabilities,
      counts: counts.slice(),
      likelihoods: logLikelihoods.map(Math.exp),
      posteriors,
      winnerIndex: posteriors.indexOf(Math.max(...posteriors)),
      h0,
      alpha,
      reject: exact.pValue <= alpha,
      ...exact,
    };
  }

  return { calculate, exactMultinomialPValue, normalizeDistribution };
});
