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
