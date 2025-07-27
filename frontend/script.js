// frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Lấy các element từ DOM
    const verifyBtn = document.getElementById('verify-btn');
    const privateInputEl = document.getElementById('private-input');
    const publicOutputEl = document.getElementById('public-output');
    const messageArea = document.getElementById('message-area');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');

    // Đường dẫn đến các file .wasm và .zkey đã được biên dịch
    const wasmPath = "puzzle.wasm";
    const zkeyPath = "puzzle_final.zkey";

    // Biến để lưu trữ khóa bí mật nhận được từ server cho thử thách hiện tại
    let currentSecretKey = null;

    /**
     * Lấy một thử thách mới từ server.
     * Server sẽ trả về câu đố để hiển thị và một khóa bí mật (secretKey).
     */
    async function getNewChallenge() {
        try {
            setLoading(true);
            showMessage('Fetching new challenge...', 'text-gray-400');
            publicOutputEl.textContent = '...';
            privateInputEl.value = '';
            currentSecretKey = null; // Reset khóa bí mật cũ

            const response = await fetch('/challenge');
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Cập nhật giao diện với câu đố và lưu lại secretKey
            publicOutputEl.textContent = data.display_puzzle;
            currentSecretKey = data.secretKey.toString(); // Lưu secretKey dưới dạng chuỗi

            showMessage('New challenge loaded. Please solve.', 'text-cyan-400');

        } catch (error) {
            console.error('Failed to get new challenge:', error);
            showMessage('Could not load challenge. Please refresh.', 'text-red-400');
        } finally {
            setLoading(false);
        }
    }

    // Gán sự kiện 'click' cho nút xác thực
    verifyBtn.addEventListener('click', async () => {
        const solutionInput = privateInputEl.value;

        // Kiểm tra xem người dùng đã nhập lời giải và đã có secretKey chưa
        if (!solutionInput) {
            showMessage('Please enter your answer.', 'text-yellow-400');
            return;
        }
        if (!currentSecretKey) {
            showMessage('Challenge not loaded yet. Please wait.', 'text-yellow-400');
            return;
        }

        setLoading(true);

        try {
            // Chuẩn bị các đầu vào cho mạch ZK, bao gồm cả solution và secretKey
            const inputs = {
                solution: solutionInput,
                secretKey: currentSecretKey
            };

            showMessage('Generating proof... this may take a moment.', 'text-blue-400');
            
            // Tạo bằng chứng ZK-SNARK ngay trên trình duyệt
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);

            showMessage('Proof generated! Sending for verification...', 'text-blue-400');
            
            // Gửi bằng chứng đến server để xác thực
            const response = await fetch('/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proof: proof, publicSignals: publicSignals }),
            });

            const result = await response.json();
            showMessage(result.message, response.ok ? 'text-green-400' : 'text-red-400');

            // Nếu xác thực thành công và có URL chuyển hướng, thực hiện chuyển hướng
            if (response.ok && result.redirect_url) {
                setTimeout(() => { window.location.href = result.redirect_url; }, 1500);
            }

        } catch (error) {
            console.error('An error occurred:', error);
            showMessage(error.message, 'text-red-400');
        } finally {
            // Chỉ tắt loading nếu không thành công, vì nếu thành công sẽ chuyển trang
            const isSuccess = messageArea.classList.contains('text-green-400');
            if (!isSuccess) {
                setLoading(false);
            }
        }
    });

    /**
     * Hiển thị thông báo cho người dùng
     * @param {string} message - Nội dung thông báo
     * @param {string} colorClass - Lớp màu của Tailwind CSS
     */
    function showMessage(message, colorClass) {
        messageArea.textContent = message;
        messageArea.className = `mt-6 text-center text-sm ${colorClass}`;
    }

    /**
     * Bật/tắt trạng thái loading của nút bấm
     * @param {boolean} isLoading - Trạng thái loading
     */
    function setLoading(isLoading) {
        verifyBtn.disabled = isLoading;
        buttonText.style.display = isLoading ? 'none' : 'inline';
        buttonSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    // Lấy thử thách đầu tiên khi trang được tải xong
    getNewChallenge();
});