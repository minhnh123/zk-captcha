# zkCAPTCHA: A Zero-Knowledge Proof CAPTCHA

zkCAPTCHA is a proof-of-concept project demonstrating how Zero-Knowledge Proofs (ZKPs) can create a privacy-preserving, bot-resistant CAPTCHA. Instead of identifying images or solving visual puzzles, users solve a simple mathematical puzzle and generate a cryptographic proof that they know the answer—without revealing it.

---

## ✨ Features

- **Dynamic Challenges:** Each CAPTCHA attempt generates a new random mathematical puzzle.
- **Client-Side Proof Generation:** The browser generates a ZK-SNARK (Groth16 proof) locally using `snarkjs`. The answer never leaves the user's machine.
- **Secure Backend Verification:** A Python Flask server verifies proofs using the circuit's verification key.
- **Website Integration:** Protects a "members-only" area of a simple website.
- **Session Management:** Remembers users who have solved a CAPTCHA, granting access to protected content.
- **Logout Functionality:** Complete authentication flow.
- **Rate Limiting:** API endpoints are protected against denial-of-service attacks.

---

## 🛠 Tech Stack

- **ZK Circuit:** [Circom](https://docs.circom.io/) — Arithmetic circuit for the puzzle.
- **Proof System:** [snarkjs](https://github.com/iden3/snarkjs) — Circuit compilation, trusted setup, proof generation (client-side), and verification (backend).
- **Backend:** Python with Flask — Serves frontend, generates challenges, verifies proofs.
- **Frontend:** HTML, JavaScript, Tailwind CSS — UI and client-side logic.

---

## 📁 Project Structure

```
zkcaptcha/
├── backend/
│   └── app.py                  # Flask web server
├── build/
│   ├── puzzle.r1cs             # Compiled circuit constraint system
│   ├── puzzle_js/
│   │   └── puzzle.wasm         # WebAssembly circuit for browser
│   ├── puzzle_final.zkey       # Final proving key
│   └── verification_key.json   # Key for backend proof verification
├── circuits/
│   └── puzzle.circom           # ZK circuit source code
├── frontend/
│   ├── index.html              # CAPTCHA page
│   ├── main.html               # Public homepage
│   ├── members.html            # Members-only page
│   └── script.js               # Client-side proof generation
└── setup.mjs                   # Node.js script for circuit/key setup
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js & npm:** For setup script and `snarkjs`.
- **Python 3 & pip:** For Flask backend.
- **Circom:** Install globally:
  ```
  npm install -g circom
  ```
- **snarkjs:** (Optional, for CLI use)
  ```
  npm install -g snarkjs
  ```

### Installation & Setup

1. **Clone the repository** (or set up the files as provided).

2. **Install Python dependencies:**

   ```
   pip install Flask Flask-Limiter
   ```

3. **Download the Powers of Tau file:**

   - Go to [snarkjs Powers of Tau](https://github.com/iden3/snarkjs#7-powers-of-tau) and download a `.ptau` file (e.g., `pot12_final.ptau`).
   - Place it inside the `build/` directory.

4. **Run the setup script (CRITICAL):**
   ```
   node setup.mjs
   ```
   - This compiles the circuit, generates keys, and copies `.wasm` and `.zkey` files to the `frontend/` directory.

---

## 🏃 How to Run

1. **Start the backend server:**

   ```
   python backend/app.py
   ```

   - The server runs at [http://127.0.0.1:5001](http://127.0.0.1:5001).

2. **Access the website:**
   - Open your browser and go to [http://127.0.0.1:5001](http://127.0.0.1:5001).
   - Click the login button and solve the zkCAPTCHA to access the members-only area.
   - For testing, the correct answer to each puzzle is printed in the backend terminal.

---
workflow của ZK-CAPTCHA

Dưới đây là mô tả chi tiết các bước trong luồng hoạt động đó.
---
### ## Bước 1: Khởi tạo và Tạo Thử thách (Tương tác Client-Server)

1.  **Người dùng truy cập**: Người dùng mở trình duyệt và truy cập vào trang `/login`.
2.  **Yêu cầu Thử thách**: Ngay khi trang tải xong, `script.js` ở phía **frontend** sẽ tự động gửi một yêu cầu mạng đến endpoint `/challenge` của **backend**.
3.  **Server xử lý**: **Backend** (`app.py`) nhận được yêu cầu và thực thi hàm `generate_new_challenge`:
    * Nó tạo ra một lời giải bí mật (`private_solution`, ví dụ: `10`).
    * Từ đó, nó tạo ra một câu đố công khai (`display_puzzle`, ví dụ: `1000`).
    * Quan trọng nhất, nó tạo ra một **`secretKey`** ngẫu nhiên và duy nhất cho phiên làm việc này.
    * Nó lưu `secretKey` vào `session` của người dùng phía server để ghi nhớ.
4.  **Gửi lại Thử thách**: Server gửi lại cho frontend một đối tượng JSON chứa `display_puzzle` và `secretKey`.

### ## Bước 2: Tạo Bằng chứng (Hoàn toàn phía Client)

Đây là bước cốt lõi của ZK-SNARK và diễn ra hoàn toàn trên máy của người dùng.

1.  **Hiển thị câu đố**: `script.js` nhận dữ liệu từ server, hiển thị `display_puzzle` (`1000`) cho người dùng và lưu `secretKey` vào một biến JavaScript.
2.  **Người dùng giải đố**: Người dùng nhập câu trả lời (`10`) vào ô input.
3.  **Tạo Bằng chứng**: Khi người dùng nhấn nút "Generate Proof & Verify":
    * `script.js` lấy câu trả lời của người dùng (`solution`) và `secretKey` đã lưu.
    * Nó gọi hàm `snarkjs.groth16.fullProve` với các đầu vào này, cùng với file mạch `puzzle.wasm` và khóa chứng minh `puzzle_final.zkey`.
    * Hàm này thực hiện các phép toán phức tạp để tạo ra một **`proof`** (bằng chứng mật mã). Bằng chứng này chứng minh rằng người dùng biết một `solution` và `secretKey` khớp với logic trong mạch (`puzzle.circom`) mà không tiết lộ chúng là gì.

### ## Bước 3: Xác thực Bằng chứng và Cấp quyền (Tương tác Client-Server)

1.  **Gửi Bằng chứng**: `script.js` gửi đối tượng `proof` vừa tạo đến endpoint `/verify` của **backend**.
2.  **Server Xác thực**: **Backend** (`app.py`) nhận được `proof` và gọi hàm `verify_proof`:
    * Hàm này sử dụng `snarkjs` cùng với **`verification_key.json`** (khóa xác thực) để kiểm tra xem `proof` có hợp lệ về mặt toán học hay không.
3.  **Phản hồi và Cấp quyền**:
    * Nếu `proof` hợp lệ, backend sẽ thiết lập `session['verified'] = True`, và trả về một JSON thông báo thành công cùng với đường dẫn chuyển hướng đến `/members`.
    * Nếu không hợp lệ, nó sẽ trả về một JSON thông báo lỗi.
4.  **Hoàn tất**: Frontend nhận được phản hồi thành công và tự động chuyển hướng người dùng đến trang thành viên, hoàn tất quy trình xác thực.

Luồng hoạt động này đảm bảo rằng thông tin nhạy cảm nhất (lời giải của người dùng) không bao giờ rời khỏi trình duyệt của họ, qua đó thực hiện đúng mục tiêu bảo vệ quyền riêng tư.
