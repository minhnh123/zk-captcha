pragma circom 2.0.0;

/*
 * @title Puzzle
 * @notice This is the simple circuit for the zkCAPTCHA. The user must
 * provide a private input ('in') that results in a known public
 * output ('out') when cubed.
 */
template Puzzle() {
    // Private input signal from the user
    signal input in;

    // Public output signal
    signal output out;

    // Intermediate signal to hold the value of in * in
    signal in_squared;

    // First quadratic constraint: in_squared <== in * in
    in_squared <== in * in;

    // Second quadratic constraint: out <== in_squared * in
    out <== in_squared * in;
}

// The main component of the circuit
component main = Puzzle();
