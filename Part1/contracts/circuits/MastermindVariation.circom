pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

//Number Mastermind with the sum of the digits as an extra clue. 6 digits (1-6), 4 holes
//https://cf.geekdo-images.com/xpwNC2HQKwyYUdDrF-wBHw__original/img/p6TMCPkOZDlZMa7Fl3bGEwy89eg=/0x0/filters:format(jpeg)/pic713036.jpg

template MastermindVariation() {
    // Public inputs
    signal input guess[4];
    signal input pubNumBlacks;
    signal input pubNumWhites;
    signal input pubSumClue;
    signal input pubSolnHash;

    // Private inputs
    signal input soln[4];
    signal input privSalt;

    // Output
    signal output solnHashOut;

    var j = 0;
    var k = 0;
    component rangeCheck[8];

    // Check that the solution and guess digits are in the range [1, 6].
    for (j=0; j<4; j++) {
        rangeCheck[j] = RangeProof(4);
        rangeCheck[j].in <== guess[j];
        rangeCheck[j].range[0] <== 1;
        rangeCheck[j].range[1] <== 6;
        rangeCheck[j].out === 1;
        rangeCheck[j+4] = RangeProof(4);
        rangeCheck[j+4].in <== soln[j];
        rangeCheck[j+4].range[0] <== 1;
        rangeCheck[j+4].range[1] <== 6;
        rangeCheck[j+4].out === 1;
    }

    // Count blacks & whites
    var blacks = 0;
    var whites = 0;
    component equalBW[16];

    for (j=0; j<4; j++) {
        for (k=0; k<4; k++) {
            equalBW[4*j+k] = IsEqual();
            equalBW[4*j+k].in[0] <== soln[j];
            equalBW[4*j+k].in[1] <== guess[k];
            whites += equalBW[4*j+k].out;
            if (j == k) {
                blacks += equalBW[4*j+k].out;
                whites -= equalBW[4*j+k].out;
            }
        }
    }

    // Create a constraint around the number of blacks
    component equalBlacks = IsEqual();
    equalBlacks.in[0] <== pubNumBlacks;
    equalBlacks.in[1] <== blacks;
    equalBlacks.out === 1;
    
    // Create a constraint around the number of whites
    component equalWhites = IsEqual();
    equalWhites.in[0] <== pubNumWhites;
    equalWhites.in[1] <== whites;
    equalWhites.out === 1;

    // Verify that the sum of the solution digits corresponds to the clue
    pubSumClue === soln[0] + soln[1] + soln[2] + soln[3];

    // Verify that the hash of the private solution matches pubSolnHash
    component poseidon = Poseidon(5);
    poseidon.inputs[0] <== privSalt;
    poseidon.inputs[1] <== soln[0];
    poseidon.inputs[2] <== soln[1];
    poseidon.inputs[3] <== soln[2];
    poseidon.inputs[4] <== soln[3];

    solnHashOut <== poseidon.out;
    pubSolnHash === solnHashOut;
}

template RangeProof(n) {
    assert(n <= 252);
    signal input in; // this is the number to be proved inside the range
    signal input range[2]; // the two elements should be the range, i.e. [lower bound, upper bound]
    signal output out;

    assert(range[0]<=range[1]);

    component lt = LessEqThan(n);
    component gt = GreaterEqThan(n);

    lt.in[0] <== in;
    lt.in[1] <== range[1];

    gt.in[0] <== in;
    gt.in[1] <== range[0];

    out <== lt.out * gt.out; 
}

component main {public [guess, pubNumBlacks, pubNumWhites, pubSumClue, pubSolnHash]} = MastermindVariation();