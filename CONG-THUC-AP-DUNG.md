# Công thức áp dụng cho bài toán kiểm định giả thuyết bằng hộp bi

Tài liệu này giải thích riêng phần toán học của ứng dụng. Ví dụ gốc có ba hộp A, B, C; chương trình mở rộng cho nhiều hộp và nhiều màu. **Ta chọn đúng một hộp, sau đó rút nhiều lần có hoàn lại từ chính hộp ấy.**

## 1. Ký hiệu và tham số

| Ký hiệu | Ý nghĩa trong bài toán |
| --- | --- |
| `k` | Số hộp, từ 2 đến 8 trong ứng dụng. |
| `m` | Số màu bi, từ 2 đến 5 trong ứng dụng. |
| `H_i` | Giả thuyết “hộp được chọn là hộp i”, với `i = 1, …, k`. Các `H_i` loại trừ nhau; phần Bayes giả định hộp thật thuộc danh sách đã nhập. |
| `π_i = P(H_i)` | Xác suất chọn hộp i **trước khi rút bi** (tiên nghiệm). Nếu chọn đều `k` hộp thì `π_i = 1/k`. |
| `p_{i,c} = P(màu c | H_i)` | Xác suất rút được màu c trong một lượt từ hộp i. Trong ví dụ PDF, đây là số bi màu c chia tổng số bi của hộp i. Ứng dụng cho nhập trực tiếp xác suất này. |
| `x_c` | Số lần quan sát được màu c. Đây là **số đếm**, không phải xác suất. |
| `n = Σ_c x_c` | Tổng số lần rút; từ 1 đến 30 trong ứng dụng. |
| `D = (x_1, …, x_m)` | Toàn bộ dữ liệu quan sát, chỉ ghi số lần xuất hiện của mỗi màu, không ghi thứ tự rút. |
| `L_i = P(D | H_i)` | Khả năng thấy dữ liệu D nếu đúng là đã chọn hộp i. |
| `α` | Mức ý nghĩa của kiểm định trong mã; mặc định `0,05`. Ô nhập α hiện được ẩn khỏi giao diện trình bày. |

**Điều kiện đầu vào:** `Σ_i π_i = 1` và với từng hộp `i`, `Σ_c p_{i,c} = 1`. Code cho phép sai số làm tròn tối đa `0,001`, sau đó chia lại cho tổng để chuẩn hóa. Mã yêu cầu `0 < π_i < 1`, `0 < p_{i,c} < 1`, `0 < α < 1`. Giá trị `1` bị cấm **ở ô xác suất** theo yêu cầu của bài; `1` trong ô số lần quan sát vẫn là một lần rút hợp lệ. Về mặt toán học, xác suất bằng 0 hoặc 1 vẫn có thể định nghĩa, nhưng chương trình loại các trường hợp ấy để tránh bài toán hiển nhiên.

## 2. Công thức khả năng dữ liệu `L_i`

Khi đã biết hộp i, các lượt rút **có hoàn lại** là độc lập và giữ nguyên xác suất màu. Với một thứ tự rút cụ thể, xác suất là:

```text
P(một thứ tự cụ thể | H_i) = ∏_{c=1}^m p_{i,c}^{x_c}.
```

Ta chỉ nhập **số lần mỗi màu xuất hiện**, nên nhiều thứ tự khác nhau cho cùng một dữ liệu D. Số thứ tự là hệ số đa thức:

```text
C(D) = n! / (x_1! × x_2! × ... × x_m!).
```

Vì vậy, công thức chương trình sử dụng là:

```text
L_i = P(D | H_i)
    = [n! / ∏_{c=1}^m x_c!] × ∏_{c=1}^m p_{i,c}^{x_c}.
```

Ở đây `!` là giai thừa, `0! = 1`; nếu một màu không xuất hiện thì thừa số của màu đó là `p^0 = 1`.

Ví dụ, `4 đỏ + 1 xanh` có `5!/(4!1!) = 5` thứ tự; `5 đỏ + 0 xanh` chỉ có `1` thứ tự. Với **2 màu**, đây là phân bố nhị thức; với **m màu**, đây là phân bố đa thức.

## 3. Từ khả năng dữ liệu đến hậu nghiệm Bayes

Vì chỉ một trong các hộp được chọn, công thức xác suất toàn phần cho dữ liệu là:

```text
P(D) = Σ_{j=1}^k P(D | H_j) P(H_j)
     = Σ_{j=1}^k L_j π_j.
```

Áp dụng định lý Bayes:

```text
P(H_i | D) = P(D | H_i) P(H_i) / P(D)
           = L_i π_i / Σ_{j=1}^k L_j π_j.
```

`P(H_i | D)` là xác suất **sau khi đã thấy dữ liệu**. Các hậu nghiệm cộng lại bằng 1. Hộp có hậu nghiệm lớn nhất được ứng dụng nêu là hộp được ủng hộ nhiều nhất **trong các hộp đã nhập**; điều này chưa chứng minh hộp ấy chắc chắn đúng.

Hệ số `C(D)` giống nhau cho mọi hộp nên có thể triệt tiêu **khi chỉ tính hậu nghiệm**:

```text
P(H_i | D) = [π_i × ∏_c p_{i,c}^{x_c}] / [Σ_j π_j × ∏_c p_{j,c}^{x_c}].
```

Nếu cần hiển thị `L_i = P(D | H_i)` hoặc tính p-value trên **vector số đếm**, vẫn phải dùng hệ số `C(D)`.

### Thay số cho slide 7–8: hai hộp bi

Slide 7 dùng **hai hộp**, khác cấu hình ba hộp mặc định của ứng dụng. Hộp A có 8 đỏ/2 xanh, hộp B có 2 đỏ/8 xanh, chọn đều nên `π_A = π_B = 0,5`. Quan sát một bi đỏ cho `L_A = 0,8`, `L_B = 0,2`:

```text
P(đỏ) = 0,8×0,5 + 0,2×0,5 = 0,5.
P(A | đỏ) = (0,8×0,5)/0,5 = 0,8 = 80%.
P(B | đỏ) = (0,2×0,5)/0,5 = 0,2 = 20%.
```

Để giao diện hiện đúng **80%**, giảm còn 2 hộp, đặt hộp B thành `0,2 đỏ / 0,8 xanh`, giữ tiên nghiệm `0,5 / 0,5` và số lần quan sát `1 đỏ / 0 xanh`.

Slide 8 diễn giải cùng kết quả bằng **100 ván chơi riêng biệt**, mỗi ván chọn lại hộp rồi rút một bi. Theo kỳ vọng, khoảng 50 ván chọn A và 50 ván chọn B; khoảng 40 ván từ A và 10 ván từ B cho bi đỏ. Theo tỉ lệ lý thuyết, phần bi đỏ đến từ A là `40/(40+10) = 80%`. Các số 50, 40, 10 là **giá trị kỳ vọng**, không bảo đảm đúng trong đúng 100 ván thực tế. Ứng dụng lại dùng **một hộp cố định** cho các lượt rút, nên không nhập 100 ván này vào ô số lần quan sát.

Mã còn tính kiểm định H₀, một phép tính **không có trên slide 7–8**; phần hiển thị của phép kiểm định đã được ẩn khỏi giao diện trình bày. Với chính dữ liệu một bi đỏ và chọn `H₀ = B`, p-value là `0,2 > 0,05`: chưa bác bỏ B ở mức 5% dù hậu nghiệm A bằng 80%. Hai kết quả trả lời hai câu hỏi khác nhau.

### Thay số đúng ví dụ PDF: một lần rút được bi đỏ

| Hộp | Thành phần | `p(đỏ | H_i)` | Tiên nghiệm `π_i` |
| --- | --- | ---: | ---: |
| A | 8 đỏ, 2 xanh | `0,8` | `1/3` |
| B | 5 đỏ, 5 xanh | `0,5` | `1/3` |
| C | 2 đỏ, 8 xanh | `0,2` | `1/3` |

Với `D = (1 đỏ, 0 xanh)`, hệ số `C(D) = 1`, nên `L_A = 0,8`, `L_B = 0,5`, `L_C = 0,2`.

```text
P(D) = (1/3)×0,8 + (1/3)×0,5 + (1/3)×0,2 = 0,5.

P(A | D) = [(1/3)×0,8] / 0,5 = 8/15 ≈ 53,33%.
P(B | D) = [(1/3)×0,5] / 0,5 = 5/15 ≈ 33,33%.
P(C | D) = [(1/3)×0,2] / 0,5 = 2/15 ≈ 13,33%.
```

Đây là phần **suy luận Bayes** của ví dụ ba hộp; trong mã vẫn có bước kiểm định dưới đây để tham khảo khi trả lời câu hỏi về đề tài “kiểm định giả thuyết thống kê”.

## 4. Giả thuyết kiểm định và p-value chính xác

Khi xét phép kiểm định trong mã, ta chọn một hộp, chẳng hạn C, làm giả thuyết gốc:

- `H₀`: dữ liệu được rút theo tỉ lệ màu của hộp C.
- `H₁`: phân bố màu tạo ra dữ liệu khác tỉ lệ của hộp C.

Với mọi vector số đếm có thể có `z = (z_1, …, z_m)` và `Σ_c z_c = n`, xác suất của nó **nếu H₀ đúng** là:

```text
P₀(z) = [n! / ∏_c z_c!] × ∏_c p_{0,c}^{z_c}.
```

`p_{0,c}` là xác suất màu c của **hộp đang chọn làm H₀**; chỉ số 0 chỉ giả thuyết gốc, không nhất thiết là hộp đầu tiên trong danh sách.

Ứng dụng định nghĩa một kết quả “cực đoan bằng hoặc hơn dữ liệu D” là kết quả có xác suất `P₀(z) ≤ P₀(D)`. Từ đó:

```text
p-value = Σ P₀(z)
          trên mọi z thỏa Σ_c z_c = n và P₀(z) ≤ P₀(D).
```

Đây là **kiểm định đa thức chính xác theo thứ tự xác suất**: liệt kê tất cả vector số đếm, so sánh với dữ liệu đã thấy, rồi cộng xác suất của các vector thỏa điều kiện. Nó là một cách định nghĩa độ cực đoan hợp lệ; các cách kiểm định hai phía khác có thể cho p-value khác.

Quy tắc quyết định được đặt trước khi xem kết quả:

```text
p-value ≤ α  →  bác bỏ H₀.
p-value > α  →  chưa đủ bằng chứng để bác bỏ H₀.
```

Với `α = 0,05`, ta kiểm soát xác suất bác bỏ nhầm khi H₀ đúng ở mức **không quá 5%**. Vì số đếm là dữ liệu rời rạc, mức sai lầm thực tế có thể nhỏ hơn 5%. `α = 0,05` **không** có nghĩa xác suất H₀ đúng là 95%.

### Thay số: vì sao một bi đỏ chưa bác bỏ C?

Nếu `H₀ = C` và chỉ rút một bi đỏ, dưới C có hai kết quả: `P₀(đỏ) = 0,2`, `P₀(xanh) = 0,8`. Chỉ kết quả đỏ có xác suất không lớn hơn `0,2`, nên `p-value = 0,2 > 0,05`. **Chưa bác bỏ C**, dù A có hậu nghiệm cao hơn C. Hai câu trả lời dùng hai câu hỏi thống kê khác nhau.

### Thay số: năm lần rút đều được bi đỏ

Vẫn dùng ba hộp ban đầu nhưng quan sát `D = (5 đỏ, 0 xanh)` và chọn `H₀ = C`. Rút **có hoàn lại**, nên năm lần đỏ từ C vẫn có thể xảy ra dù C ban đầu chỉ có hai bi đỏ.

```text
L_A = 0,8^5 = 0,32768;  L_B = 0,5^5 = 0,03125;  L_C = 0,2^5 = 0,00032.
P(D) = (0,32768 + 0,03125 + 0,00032)/3 = 0,11975.
```

Hậu nghiệm A/B/C xấp xỉ `91,21225% / 8,69868% / 0,08907%`. Để tính **p-value**, xét mọi số bi đỏ có thể thấy trong 5 lượt dưới `H₀ = C`:

| Số bi đỏ `r` | `P₀(r đỏ, 5-r xanh) = C(5,r)·0,2^r·0,8^(5-r)` | Có được cộng vào p-value? |
| ---: | ---: | --- |
| 0 | `0,32768` | Không |
| 1 | `0,40960` | Không |
| 2 | `0,20480` | Không |
| 3 | `0,05120` | Không |
| 4 | `0,00640` | Không |
| 5 | `0,00032` | Có |

Chỉ dòng cuối có xác suất `≤ P₀(D) = 0,00032`, vậy **p-value = 0,00032 ≤ 0,05**, nên bác bỏ `H₀ = C`. Kết luận này **không** khẳng định chắc chắn A là hộp thật.

## 5. Công thức tương ứng với code

| Phần toán học | Trong `math.js` |
| --- | --- |
| Kiểm tra `0 < xác suất < 1`, tổng xác suất bằng 1 và chuẩn hóa sai số làm tròn | `isProbability`, `normalizeDistribution` |
| `log L_i = log(n!) − Σ_c log(x_c!) + Σ_c x_c log(p_{i,c})` | `logFactorials`, `logMultinomialProbability` |
| `P(H_i | D) = π_i L_i / Σ_j π_j L_j` | `logWeights`, `scaledWeights`, `posteriors` trong `calculate` |
| Liệt kê mọi vector `z` có `Σ_c z_c = n`, cộng khi `P₀(z) ≤ P₀(D)` | `enumerate` trong `exactMultinomialPValue` |
| So sánh p-value với mức ý nghĩa `α` | `reject: exact.pValue <= alpha` |

Code dùng **logarit** để tránh tích của nhiều xác suất nhỏ bị làm tròn về 0. Cụ thể, `log(a×b) = log a + log b`; khi tính hậu nghiệm, code trừ log-trọng-số lớn nhất trước khi đổi lại thành xác suất. Đây chỉ là cách tính ổn định hơn của đúng công thức Bayes ở trên.

## 6. Câu hỏi thầy có thể hỏi

**Vì sao phải rút có hoàn lại?** Để mỗi lần rút từ cùng một hộp có cùng xác suất màu và độc lập có điều kiện theo hộp. Nếu không hoàn lại, tỉ lệ màu thay đổi sau mỗi lần và phải dùng phân bố siêu bội; ví dụ 5 đỏ từ hộp C có 2 đỏ khi đó là bất khả thi.

**Vì sao dùng phân bố đa thức thay vì nhị thức?** Ứng dụng cho phép nhiều màu. Nhị thức là trường hợp đặc biệt khi chỉ có 2 màu.

**Vì sao dùng kiểm định chính xác thay vì χ²?** Bài có thể chỉ có 1–5 lần rút, quá ít để dựa vào xấp xỉ mẫu lớn. Số vector đếm có thể có là tổ hợp `C(n+m-1,m-1)`; code duyệt nhiều nhất `C(34,4) = 46.376` vector với `n = 30`, `m = 5`.

**p-value có phải xác suất H₀ đúng không?** Không. `p-value` được tính **giả sử H₀ đúng**, còn `P(H₀ | D)` là hậu nghiệm Bayes cần tiên nghiệm và các hộp còn lại. Trong ví dụ 5 đỏ, hai số là `0,00032` và khoảng `0,0008907`.

**p-value có luôn bằng `P(D | H₀)` không?** Không. p-value cộng nhiều kết quả. Ví dụ `H₀ = C`, quan sát `4 đỏ, 1 xanh`: `P(D | H₀) = 0,0064`, còn p-value là `0,0064 + 0,00032 = 0,00672`.

**Không bác bỏ H₀ có nghĩa H₀ đúng không?** Không. Nó chỉ cho biết dữ liệu hiện tại chưa đủ mạnh để bác bỏ ở mức `α` đã chọn; với mẫu rất nhỏ, kiểm định thường khó phát hiện khác biệt.

**Có thể kết luận A vì A có hậu nghiệm lớn nhất không?** Chỉ có thể nói A được ủng hộ nhiều nhất **trong các hộp đã xét**. Nếu có hộp khác chưa đưa vào mô hình, phần Bayes không đánh giá hộp đó. Việc bác bỏ C cũng không tự chứng minh A là đúng.

**Vì sao cấm nhập 1?** `1` ở ô xác suất nghĩa là 100%; bài tập yêu cầu tránh trường hợp hiển nhiên. Đây là giới hạn giao diện, không phải định luật cấm xác suất 1. `1` ở ô số lần rút vẫn là một lần quan sát bình thường.
