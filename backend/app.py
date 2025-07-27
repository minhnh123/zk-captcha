# backend/app.py

from flask import Flask, send_from_directory, request, jsonify, redirect, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import random
import json
import subprocess
# Thêm thư viện time để tạo định danh duy nhất
import time

# Khởi tạo ứng dụng Flask và cấu hình đường dẫn cho các file frontend
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Cần một khóa bí mật để sử dụng session an toàn
app.secret_key = os.urandom(24)

# Cấu hình giới hạn yêu cầu để chống spam
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

# Đường dẫn tới khóa xác thực được tạo từ bước setup
VERIFICATION_KEY_PATH = os.path.join(os.path.dirname(__file__), '..', 'build', 'verification_key.json')


def generate_new_challenge():
    """
    Tạo một thử thách CAPTCHA mới.
    """
    private_solution = random.randint(2, 10)
    display_puzzle = private_solution ** 3
    secret_key = random.randint(1_000_000, 1_000_000_000)
    session['secret_key'] = secret_key

    # Sửa lỗi: Loại bỏ session.sid vì nó không tồn tại trong session mặc định
    print(f"New challenge generated: Puzzle is {display_puzzle} (Answer: {private_solution}), Secret Key is {secret_key}")

    return {"display_puzzle": display_puzzle, "secretKey": secret_key}


def verify_proof(proof, public_signals):
    """
    Xác thực bằng chứng ZK-SNARK bằng cách gọi `snarkjs`.
    """
    if not os.path.exists(VERIFICATION_KEY_PATH):
        print("Verification key not found!")
        return False

    # Sửa lỗi: Thay thế session.sid bằng một định danh duy nhất để tạo file tạm
    unique_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
    proof_path = os.path.join(os.path.dirname(__file__), f'proof_{unique_id}.json')
    public_signals_path = os.path.join(os.path.dirname(__file__), f'public_{unique_id}.json')

    try:
        with open(proof_path, 'w') as f:
            json.dump(proof, f)
        with open(public_signals_path, 'w') as f:
            json.dump(public_signals, f)

        command = [
            'npx', 'snarkjs', 'groth16', 'verify',
            VERIFICATION_KEY_PATH,
            public_signals_path,
            proof_path
        ]
        
        use_shell = (os.name == 'nt')
        result = subprocess.run(command, capture_output=True, text=True, check=True, shell=use_shell)

        return "OK" in result.stdout

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        return False
    finally:
        if os.path.exists(proof_path):
            os.remove(proof_path)
        if os.path.exists(public_signals_path):
            os.remove(public_signals_path)

# --- Các Route của ứng dụng ---

@app.route('/')
def main_site():
    return send_from_directory(os.path.join(app.root_path, '..', 'frontend'), 'main.html')

@app.route('/login')
def login_page():
    if session.get('verified'):
        return redirect('/members')
    return send_from_directory(os.path.join(app.root_path, '..', 'frontend'), 'index.html')

@app.route('/members')
def members_area():
    if session.get('verified'):
        return send_from_directory(os.path.join(app.root_path, '..', 'frontend'), 'members.html')
    else:
        return redirect('/login')

@app.route('/logout')
def logout():
    session.pop('verified', None)
    session.pop('secret_key', None)
    return redirect('/')

@app.route('/challenge')
@limiter.limit("20 per minute")
def get_challenge():
    return jsonify(generate_new_challenge())

@app.route('/verify', methods=['POST'])
@limiter.limit("5 per minute")
def verify_endpoint():
    data = request.get_json()
    if not data or 'proof' not in data or 'publicSignals' not in data:
        return jsonify({"status": "failure", "message": "Invalid request format."}), 400

    proof = data.get('proof')
    public_signals = data.get('publicSignals')
    
    is_verified = verify_proof(proof, public_signals)

    if is_verified:
        print("✅ Proof is valid!")
        session['verified'] = True
        return jsonify({"status": "success", "message": "CAPTCHA verified! Redirecting...", "redirect_url": "/members"})
    else:
        print("❌ Proof is invalid!")
        return jsonify({"status": "failure", "message": "Proof is invalid."}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5001)