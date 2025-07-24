document.addEventListener('DOMContentLoaded', () => {
    const verifyBtn = document.getElementById('verify-btn');
    const privateInputEl = document.getElementById('private-input');
    const publicOutputEl = document.getElementById('public-output');
    const messageArea = document.getElementById('message-area');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');

    const wasmPath = "puzzle.wasm";
    const zkeyPath = "puzzle_final.zkey";

    async function getNewChallenge() {
        try {
            setLoading(true);
            showMessage('Fetching new challenge...', 'text-gray-400');
            publicOutputEl.textContent = '...';
            privateInputEl.value = '';

            const response = await fetch('/challenge');
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const data = await response.json();
            
            publicOutputEl.textContent = data.public_output;
            showMessage('New challenge loaded. Please solve.', 'text-cyan-400');

        } catch (error) {
            console.error('Failed to get new challenge:', error);
            showMessage('Could not load challenge. Please refresh.', 'text-red-400');
        } finally {
            setLoading(false);
        }
    }

    verifyBtn.addEventListener('click', async () => {
        const privateInput = privateInputEl.value;
        if (!privateInput) {
            showMessage('Please enter a number.', 'text-yellow-400');
            return;
        }

        setLoading(true);

        try {
            const publicOutput = publicOutputEl.innerText;
            const inputs = { in: privateInput };

            showMessage('Generating proof... this may take a moment.', 'text-blue-400');
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);

            if (publicSignals[0] !== publicOutput) {
                throw new Error("Input does not result in the correct public output. Please check your answer.");
            }

            showMessage('Proof generated! Sending for verification...', 'text-blue-400');
            
            const response = await fetch('/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proof: proof, publicSignals: publicSignals }),
            });

            const result = await response.json();
            showMessage(result.message, response.ok ? 'text-green-400' : 'text-red-400');

            if (response.ok && result.redirect_url) {
                setTimeout(() => { window.location.href = result.redirect_url; }, 1500);
            }

        } catch (error) {
            console.error('An error occurred:', error);
            showMessage(error.message, 'text-red-400');
        } finally {
            const isSuccess = messageArea.classList.contains('text-green-400');
            if (!isSuccess) { setLoading(false); }
        }
    });

    function showMessage(message, colorClass) {
        messageArea.textContent = message;
        messageArea.className = `mt-6 text-center text-sm ${colorClass}`;
    }

    function setLoading(isLoading) {
        verifyBtn.disabled = isLoading;
        buttonText.style.display = isLoading ? 'none' : 'inline';
        buttonSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    getNewChallenge();
});
