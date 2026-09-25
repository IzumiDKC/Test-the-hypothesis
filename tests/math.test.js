const test = require("node:test");
const assert = require("node:assert/strict");
const { calculate, exactMultinomialPValue } = require("../math.js");

const pdfExample = {
  priors: [1 / 3, 1 / 3, 1 / 3],
  probabilities: [[0.8, 0.2], [0.5, 0.5], [0.2, 0.8]],
  counts: [1, 0],
  h0: 0,
  alpha: 0.05,
};

test("tái hiện đúng ví dụ Bayes ba hộp trong PDF", () => {
  const result = calculate(pdfExample);
  assert.ok(Math.abs(result.posteriors[0] - 8 / 15) < 1e-12);
  assert.ok(Math.abs(result.posteriors[1] - 5 / 15) < 1e-12);
  assert.ok(Math.abs(result.posteriors[2] - 2 / 15) < 1e-12);
  assert.equal(result.winnerIndex, 0);
  assert.ok(Math.abs(result.pValue - 1) < 1e-12);
  assert.equal(result.reject, false);
});

test("bác bỏ hộp C khi năm lần liên tiếp đều rút được bi đỏ", () => {
  const result = calculate({ ...pdfExample, counts: [5, 0], h0: 2 });
  assert.ok(Math.abs(result.pValue - 0.00032) < 1e-12);
  assert.equal(result.reject, true);
  assert.equal(result.winnerIndex, 0);
});

test("p-value chính xác cộng cả hai đuôi khi phân bố nhị thức cân bằng", () => {
  const result = exactMultinomialPValue([0.5, 0.5], [2, 0]);
  assert.ok(Math.abs(result.pValue - 0.5) < 1e-12);
  assert.equal(result.outcomes, 3);
});

test("kiểm định chính xác hỗ trợ nhiều hơn hai màu", () => {
  const result = calculate({
    priors: [0.5, 0.5],
    probabilities: [[0.2, 0.3, 0.5], [0.5, 0.3, 0.2]],
    counts: [1, 0, 0],
    h0: 0,
    alpha: 0.05,
  });
  assert.ok(Math.abs(result.pValue - 0.2) < 1e-12);
  assert.equal(result.outcomes, 3);
  assert.ok(Math.abs(result.posteriors[1] - 5 / 7) < 1e-12);
});

test("không chấp nhận xác suất bằng 1 hoặc tổng xác suất sai", () => {
  assert.throws(() => calculate({ ...pdfExample, probabilities: [[1, 0], [0.5, 0.5], [0.2, 0.8]] }), /Không nhập 1/);
  assert.throws(() => calculate({ ...pdfExample, priors: [0.2, 0.2, 0.2] }), /tổng bằng 1/);
});

test("chấp nhận sai số làm tròn nhỏ khi nhập tiên nghiệm", () => {
  const result = calculate({ ...pdfExample, priors: [0.3333, 0.3333, 0.3333] });
  assert.ok(Math.abs(result.posteriors.reduce((a, b) => a + b, 0) - 1) < 1e-12);
});
