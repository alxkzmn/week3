const chai = require("chai");

const wasm_tester = require("circom_tester").wasm;
const { buildPoseidon } = require("circomlibjs");
const { BigNumber } = require("ethers");
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);

const assert = chai.assert;

const poseidonHash = async (items) => {
  let poseidon = await buildPoseidon();
  return BigNumber.from(poseidon.F.toObject(poseidon(items)));
};

describe("Mastermind circuit test", function () {
  this.timeout(100000000);

  it("Should fail for out-of-range solution", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
    const hashedSoln = await poseidonHash([5337, 7, 8, 9, 9]);
    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["7", "8", "9", "9"],
      pubNumBlacks: "0",
      pubNumWhites: "0",
      pubSumClue: "33",
      pubSolnHash: hashedSoln,
      privSalt: "5337",
    };

    const witness = await circuit
      .calculateWitness(INPUT, true)
      .catch((error) => {
        errorString = error.toString();
      });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });

  it("Should fail for out-of-range guess", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
    const hashedSoln = await poseidonHash([5337, 1, 2, 3, 4]);
    const INPUT = {
      guess: ["9", "9", "9", "9"],
      soln: ["1", "2", "3", "4"],
      pubNumBlacks: "0",
      pubNumWhites: "0",
      pubSumClue: "10",
      pubSolnHash: hashedSoln,
      privSalt: "5337",
    };

    const witness = await circuit
      .calculateWitness(INPUT, true)
      .catch((error) => {
        errorString = error.toString();
      });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });

  it("Should compute correct solution", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const hashedSoln = await poseidonHash([5337, 2, 5, 3, 6]);
    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["2", "5", "3", "6"],
      pubNumBlacks: "1",
      pubNumWhites: "1",
      pubSumClue: "16",
      pubSolnHash: hashedSoln,
      privSalt: "5337",
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(
      Fr.eq(
        Fr.e(witness[1]),
        Fr.e(
          "15601710890404137714578592311602084730258675640458309158805211345379528430212"
        )
      )
    );
  });

  it("Should fail for incorrect sum clue", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const hashedSoln = await poseidonHash([5337, 2, 5, 3, 6]);
    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["2", "5", "3", "6"],
      pubNumBlacks: "1",
      pubNumWhites: "1",
      pubSumClue: "1",
      pubSolnHash: hashedSoln,
      privSalt: "5337",
    };

    await circuit.calculateWitness(INPUT, true).catch((error) => {
      errorString = error.toString();
    });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });

  it("Should fail for incorrect number of blacks", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const hashedSoln = await poseidonHash([5337, 2, 5, 3, 6]);
    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["2", "5", "3", "6"],
      pubNumBlacks: "0",
      pubNumWhites: "1",
      pubSumClue: "16",
      pubSolnHash: hashedSoln,
      privSalt: "5337",
    };

    await circuit.calculateWitness(INPUT, true).catch((error) => {
      errorString = error.toString();
    });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });

  it("Should fail for incorrect number of whites", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const hashedSoln = await poseidonHash([5337, 2, 5, 3, 6]);
    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["2", "5", "3", "6"],
      pubNumBlacks: "1",
      pubNumWhites: "0",
      pubSumClue: "16",
      pubSolnHash: hashedSoln,
      privSalt: "5337",
    };

    await circuit.calculateWitness(INPUT, true).catch((error) => {
      errorString = error.toString();
    });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });

  it("Should fail for mismatched hash", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["2", "5", "3", "6"],
      pubNumBlacks: "1",
      pubNumWhites: "0",
      pubSumClue: "16",
      pubSolnHash: "0",
      privSalt: "5337",
    };

    const witness = await circuit
      .calculateWitness(INPUT, true)
      .catch((error) => {
        errorString = error.toString();
      });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });

  it("Should fail for incorrect salt", async () => {
    const circuit = await wasm_tester(
      "./contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const hashedSoln = await poseidonHash([5337, 2, 5, 3, 6]);
    const INPUT = {
      guess: ["1", "2", "3", "4"],
      soln: ["2", "5", "3", "6"],
      pubNumBlacks: "1",
      pubNumWhites: "0",
      pubSumClue: "16",
      pubSolnHash: hashedSoln,
      privSalt: "1234",
    };

    await circuit.calculateWitness(INPUT, true).catch((error) => {
      errorString = error.toString();
    });

    assert(errorString.includes("Error: Error: Assert Failed."));
  });
});
