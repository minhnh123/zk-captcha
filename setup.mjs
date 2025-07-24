import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const circuitsDir = './circuits';
const buildDir = './build';
const frontendDir = './frontend';
const circuitName = 'puzzle'; // We are back to the puzzle circuit

const ptauFinalPath = path.join(buildDir, 'pot12_final.ptau');

async function run() {
    try {
        console.log(`Starting setup for the "${circuitName}" circuit...`);

        if (!existsSync(buildDir)) mkdirSync(buildDir);
        if (!existsSync(frontendDir)) mkdirSync(frontendDir);
        console.log(`Directories ensured.`);

        console.log(`\n[1/4] Checking for ${ptauFinalPath}...`);
        if (!existsSync(ptauFinalPath)) {
            console.error(`\n❌ ERROR: File not found: ${ptauFinalPath}`);
            console.error("Please manually place 'pot12_final.ptau' in the 'build' directory.");
            process.exit(1);
        }
        console.log("✅ Powers of Tau file found!");

        console.log(`\n[2/4] Compiling ${circuitName}.circom...`);
        const { stdout: compileOut, stderr: compileErr } = await execAsync(
            `circom ${circuitsDir}/${circuitName}.circom --r1cs --wasm --sym -o ${buildDir}`
        );
        if (compileErr) console.error(compileErr);
        console.log(compileOut);
        console.log("✅ Circuit compiled successfully!");


        console.log(`\n[3/4] Generating .zkey file for ${circuitName}...`);
        const zkeyPath = `${buildDir}/${circuitName}_0000.zkey`;
        const { stdout: zkeyOut, stderr: zkeyErr } = await execAsync(
            `snarkjs groth16 setup ${buildDir}/${circuitName}.r1cs ${ptauFinalPath} ${zkeyPath}`
        );
        if (zkeyErr) throw new Error(zkeyErr);
        console.log(zkeyOut);

        const zkeyFinalPath = `${buildDir}/${circuitName}_final.zkey`;
        const { stdout: zkeyContribOut, stderr: zkeyContribErr } = await execAsync(
            `snarkjs zkey contribute ${zkeyPath} ${zkeyFinalPath} -v -e="some random text for puzzle"`
        );
        if (zkeyContribErr) throw new Error(zkeyContribErr);
        console.log(zkeyContribOut);
        console.log("✅ .zkey file generated.");

        console.log(`\n[4/4] Exporting verification key for ${circuitName}...`);
        const verificationKeyPath = `${buildDir}/verification_key.json`;
        const { stdout: exportOut, stderr: exportErr } = await execAsync(
            `snarkjs zkey export verificationkey ${zkeyFinalPath} ${verificationKeyPath}`
        );
        if (exportErr) throw new Error(exportErr);
        console.log(exportOut);
        console.log("✅ Verification key exported.");

        console.log("\nCopying new circuit files to frontend directory...");
        copyFileSync(`${buildDir}/${circuitName}_js/${circuitName}.wasm`, `${frontendDir}/${circuitName}.wasm`);
        copyFileSync(zkeyFinalPath, `${frontendDir}/${circuitName}_final.zkey`);
        console.log("✅ Files copied!");


        console.log(`\n🎉 Setup for "${circuitName}" complete!`);

    } catch (error) {
        console.error("\n❌ An error occurred during setup:", error.message);
        process.exit(1);
    }
}

run();
