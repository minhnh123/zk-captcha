from flask import Flask, send_from_directory, request, jsonify, redirect, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import random
import json
import subprocess

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.secret_key = os.urandom(24) 

limiter = Limiter(get_remote_address, app=app)

# Point to the verification key for the 'puzzle' circuit
VERIFICATION_KEY_PATH = os.path.join(os.path.dirname(__file__), '..', 'build', 'verification_key.json')

current_challenge = {
    "public_output": None
}

def generate_new_challenge():
    global current_challenge
    private_solution = random.randint(2, 10)
    public_output = private_solution ** 3
    current_challenge["public_output"] = public_output
    print(f"New challenge generated: Solve for {public_output} (answer: {private_solution})")
    return {"public_output": public_output}

def verify_proof(proof, public_signals):
    if not os.path.exists(VERIFICATION_KEY_PATH): return False
    proof_path = os.path.join(os.path.dirname(__file__), 'proof.json')
    public_signals_path = os.path.join(os.path.dirname(__file__), 'public.json')
    try:
        with open(proof_path, 'w') as f: json.dump(proof, f)
        with open(public_signals_path, 'w') as f: json.dump(public_signals, f)
        command = ['npx', 'snarkjs', 'groth16', 'verify', VERIFICATION_KEY_PATH, public_signals_path, proof_path]
        result = subprocess.run(command, capture_output=True, text=True, check=True, shell=(os.name == 'nt'))
        return "OK" in result.stdout
    except Exception as e:
        print(f"An error occurred during verification: {e}")
        return False
    finally:
        if os.path.exists(proof_path): os.remove(proof_path)
        if os.path.exists(public_signals_path): os.remove(public_signals_path)

@app.route('/')
def main_site(): return send_from_directory(os.path.join(app.root_path, '..', 'frontend'), 'main.html')
@app.route('/login')
def login_page():
    if session.get('verified'): return redirect('/members')
    return send_from_directory(os.path.join(app.root_path, '..', 'frontend'), 'index.html')
@app.route('/members')
def members_area():
    if session.get('verified'): return send_from_directory(os.path.join(app.root_path, '..', 'frontend'), 'members.html')
    else: return redirect('/login')
@app.route('/logout')
def logout():
    session.pop('verified', None)
    return redirect('/')

@app.route('/challenge')
@limiter.limit("20 per minute")
def get_challenge():
    return jsonify(generate_new_challenge())

@app.route('/verify', methods=['POST'])
@limiter.limit("5 per minute")
def verify_endpoint():
    data = request.get_json()
    proof = data.get('proof')
    public_signals = data.get('publicSignals')
    
    is_verified = False
    
    proof_public_output = public_signals[0] if public_signals else None
    
    if str(current_challenge['public_output']) == proof_public_output:
        print("Public signal matches challenge. Proceeding to full cryptographic verification...")
        is_verified = verify_proof(proof, public_signals)
    else:
        print("Proof is for a stale or incorrect challenge. Rejecting.")

    if is_verified:
        print("✅ Proof is valid!")
        session['verified'] = True
        return jsonify({"status": "success", "message": "CAPTCHA verified! Redirecting...", "redirect_url": "/members"})
    else:
        print("❌ Proof is invalid!")
        return jsonify({"status": "failure", "message": "Proof is invalid or for the wrong challenge."}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)
