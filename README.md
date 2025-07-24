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
