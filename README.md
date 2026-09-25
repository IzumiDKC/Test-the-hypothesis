# Kiểm định giả thuyết thống kê: Hộp bi và màu bi

Ứng dụng minh họa hai câu hỏi từ cùng một bộ dữ liệu:

1. **Bayes:** Sau khi quan sát màu bi, khả năng đã chọn từng hộp là bao nhiêu?
2. **Kiểm định giả thuyết:** Nếu giả sử bi được rút từ một hộp cụ thể, dữ liệu quan sát có đủ khác thường để bác bỏ giả sử đó ở mức ý nghĩa 5% không?

Ví dụ gốc nằm trong [Vi-du-Bayes-Ba-hop-bi.pdf](Vi-du-Bayes-Ba-hop-bi.pdf). Có ba hộp, mỗi hộp 10 viên: A có 8 đỏ, 2 xanh; B có 5 đỏ, 5 xanh; C có 2 đỏ, 8 xanh. Chọn ngẫu nhiên một hộp với xác suất như nhau rồi rút bi. Ứng dụng cho phép thay số hộp (2–8), số màu (2–5), tiên nghiệm, tỉ lệ màu trong từng hộp và số lần quan sát từng màu. Nhiều lần rút được hiểu là **rút có hoàn lại từ cùng một hộp**.

Ô số lần rút là **số đếm**, nên giá trị `1` ở ô này nghĩa là một lần rút được màu đó. Các ô xác suất phải nằm trong khoảng `(0, 1)`: không nhập `1` (100%). Tổng tiên nghiệm và tổng xác suất màu của mỗi hộp phải bằng 1; sai số làm tròn tối đa 0,001 được chuẩn hóa. Ứng dụng giới hạn tối đa 30 lượt rút để việc tính p-value chính xác vẫn nhanh.

## Ký hiệu và công thức

Gọi `k` là số hộp, `m` là số màu, `x꜀` là số lần quan sát màu `c`, và `pᵢ꜀` là xác suất rút màu `c` từ hộp `i` do người dùng nhập. Trong ví dụ PDF, `pᵢ꜀` bằng số bi màu `c` chia cho tổng số bi của hộp. Tổng số lần rút là `n = Σ꜀ x꜀`. Giả thuyết `Hᵢ` nghĩa là đã chọn hộp `i`.

Với dữ liệu là **số lần xuất hiện của từng màu** và các lần rút độc lập có điều kiện theo hộp:

```text
Lᵢ = P(D | Hᵢ) = [n! / ∏꜀ x꜀!] × ∏꜀ pᵢ꜀^x꜀
P(Hᵢ | D) = Lᵢ P(Hᵢ) / Σⱼ Lⱼ P(Hⱼ)
```

`D` là dữ liệu đã quan sát, `Lᵢ` là khả năng thấy dữ liệu nếu đã chọn hộp `i`, `P(Hᵢ)` là xác suất tiên nghiệm và `P(Hᵢ | D)` là xác suất hậu nghiệm. Như ví dụ trong PDF, các hộp được chọn đều nhau nên `P(Hᵢ) = 1/k`. Hệ số `n! / ∏꜀ x꜀!` giống nhau ở mọi hộp nên có thể bỏ khi tính hậu nghiệm.

Trong [math.js](math.js), hàm `logMultinomialProbability` tính `Lᵢ`, các biến `logWeights` và `posteriors` thực hiện công thức Bayes. Dùng logarit giúp phép nhân nhiều xác suất nhỏ không bị mất độ chính xác; giao diện vẫn hiển thị công thức gốc và giá trị thay số.

Để **kiểm định một hộp được chọn**, đặt `H₀`: dữ liệu tuân theo tỉ lệ màu của hộp đó; `H₁`: dữ liệu không tuân theo tỉ lệ ấy. Với `P₀(x)` là xác suất đa thức của một cách phân bố `n` lượt rút thành các số đếm màu `x`, p-value chính xác được tính bằng:

```text
p-value = Σ P₀(x), với Σ꜀ x꜀ = n và P₀(x) ≤ P₀(x_quan_sát)
```

Đây là cách xét “ít khả năng bằng hoặc hơn dữ liệu đã thấy” theo xác suất dưới `H₀`. Nếu `p-value ≤ α` thì bác bỏ `H₀`; ứng dụng đặt mặc định `α = 0,05` và cho phép người dùng đổi. Nếu p-value lớn hơn α, kết luận là **chưa đủ bằng chứng để bác bỏ `H₀`**. P-value **không phải** `P(H₀ | D)`; xác suất này do phần Bayes tính và phụ thuộc cả tiên nghiệm lẫn các hộp còn lại.

Hàm `exactMultinomialPValue` trong [math.js](math.js) duyệt các cách đếm màu có tổng bằng `n` rồi cộng xác suất của những cách thỏa điều kiện trên.

## Ví dụ để trình bày

- **Một bi đỏ:** Hậu nghiệm của A, B, C lần lượt là `8/15 ≈ 53,33%`, `5/15 ≈ 33,33%`, `2/15 ≈ 13,33%`, đúng với PDF. Nếu chọn `H₀ = C`, p-value là `0,2`; chưa bác bỏ ở mức 5%.
- **Năm bi đỏ liên tiếp:** Giả sử `H₀ = C`, xác suất quan sát 5 đỏ là `0,2⁵ = 0,00032`. Đây cũng là p-value chính xác trong trường hợp này, nên bác bỏ `H₀` ở mức 5%. Dữ liệu ủng hộ các hộp có nhiều bi đỏ hơn, nhưng p-value `0,00032` không có nghĩa là xác suất hộp C được chọn bằng `0,032%`.

## Chạy ứng dụng

Mở `index.html` bằng trình duyệt, nhập cấu hình hộp bi và số lần quan sát từng màu, sau đó chọn hộp cần kiểm định. Không cần máy chủ hay cài thư viện.

Để chạy phần kiểm tra phép tính (cần Node.js):

```text
node --test tests/math.test.js
```

## Phân chia thuyết trình 15 phút

| Người | Thời gian | Nội dung |
| --- | --- | --- |
| 1 | 0–3 phút | Giới thiệu bài toán ba hộp bi, dữ liệu nhập và hai câu hỏi cần giải. |
| 2 | 3–7 phút | Giải thích tiên nghiệm, khả năng dữ liệu, công thức Bayes; tính ví dụ một bi đỏ. |
| 3 | 7–11 phút | Nêu `H₀`, `H₁`, mức ý nghĩa 5%, cách cộng xác suất để tìm p-value chính xác. |
| 4 | 11–15 phút | Chạy demo một và năm bi đỏ, kết luận và nêu giới hạn của mô hình. |

**Giới hạn:** Các lượt rút phải độc lập và có hoàn lại; tỉ lệ màu của từng hộp được xem là đã biết. Kết quả kiểm định chỉ đánh giá hộp được chọn làm `H₀`, không tự chứng minh hộp nào khác là đúng. Với mẫu nhỏ, p-value có thể lớn dù phân bố thực tế khác `H₀`.
