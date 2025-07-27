pragma circom 2.0.0;

// Import hàm băm Poseidon từ thư viện circomlib
include "circomlib/circuits/poseidon.circom";
/*
 * @title Puzzle
 * @notice Mạch này xác minh rằng người dùng biết một 'solution' và một 'secretKey'
 * mà khi băm chúng bằng Poseidon sẽ cho ra một 'out' công khai đã biết.
 */
template Puzzle() {
    // Đầu vào riêng tư 1: Lời giải của người dùng
    signal input solution;

    // Đầu vào riêng tư 2: Khóa bí mật do server cung cấp
    signal input secretKey;

    // Đầu ra công khai: Kết quả của hàm băm
    signal output out;

    // Khởi tạo component Poseidon với 2 đầu vào
    // Poseidon(2) có nghĩa là nó sẽ băm 2 giá trị.
    component hasher = Poseidon(2);

    // Cung cấp 2 đầu vào riêng tư cho hàm băm
    hasher.inputs[0] <== solution;
    hasher.inputs[1] <== secretKey;

    // Gán kết quả của hàm băm cho đầu ra công khai của mạch
    out <== hasher.out;
}

// Component chính của mạch
component main = Puzzle();