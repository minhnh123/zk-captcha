zkCAPTCHA: A Zero-Knowledge Proof CAPTCHA
zkCAPTCHA is a proof-of-concept project that demonstrates how Zero-Knowledge Proofs (ZKPs) can be used to create a privacy-preserving, bot-resistant CAPTCHA. Instead of requiring users to identify images or solve complex visual puzzles, this project asks them to solve a simple mathematical puzzle and generate a cryptographic proof that they know the answer, without revealing the answer itself.

This project is built as a complete web application, featuring a ZK circuit, a Python backend, and a JavaScript frontend, integrated into a simple "members-only" website to demonstrate a real-world use case.

Features
Dynamic Challenges: The backend generates a new random mathematical puzzle for each CAPTCHA attempt.

Client-Side Proof Generation: The user's browser generates a ZK-SNARK (a groth16 proof) locally using snarkjs. The user's secret answer never leaves their machine.

Secure Backend Verification: A Python Flask server receives the proof and cryptographically verifies its validity using the circuit's verification key.

Website Integration: The zkCAPTCHA is used to protect a "members-only" area of a simple website, demonstrating a practical application.

Session Management: The backend uses sessions to remember users who have successfully solved a CAPTCHA, allowing them to access protected content.

Logout Functionality: A complete authentication flow is provided.

Rate Limiting: The API endpoints are protected against simple denial-of-service attacks.

Tech Stack
ZK Circuit: Circom - Used to write the arithmetic circuit for the mathematical puzzle.

Proof System: snarkjs - Used for compiling the circuit, trusted setup, generating proofs (client-side), and verifying proofs (backend).

Backend: Python with Flask - A micro web framework used to serve the frontend, generate challenges, and verify proofs.

Frontend: HTML, JavaScript, and Tailwind CSS - For creating the user interface and handling client-side logic.

Getting Started
Prerequisites
Node.js and npm: Required to run the setup script and install snarkjs.

Python 3 and pip: Required for the Flask backend.

Circom: You must have the Circom compiler installed globally.

npm install -g circom

snarkjs: It's helpful to have it installed globally for command-line use.

npm install -g snarkjs

Installation & Setup
Clone the repository (or set up the files as provided).

Install Python Dependencies:
Navigate to the project's root directory and run:

pip install Flask Flask-Limiter

Download the Powers of Tau File:
The snarkjs trusted setup requires a "Powers of Tau" file. You need to manually download one.

Go to https://github.com/iden3/snarkjs#7-powers-of-tau and download a .ptau file. The one used for this project is pot12_final.ptau.

Place the downloaded .ptau file inside the build/ directory.

Run the Setup Script (CRITICAL):
This script compiles the circuit and generates the proving and verification keys. From the project root, run:

node setup.mjs

This will populate the build/ directory with the necessary keys and copy the .wasm and .zkey files to the frontend/ directory.

How to Run
Start the Backend Server:
From the project root, run the following command:

python backend/app.py

The server will start, and you'll see output indicating it's running on http://127.0.0.1:5001.

Access the Website:
Open your web browser and navigate to:
http://127.0.0.1:5001

You can now interact with the website, click the login button, and solve the zkCAPTCHA to access the members-only area. The correct answer to each puzzle will be printed in the backend terminal for easy testing.
