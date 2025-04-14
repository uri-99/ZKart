// Docs from: https://www.npmjs.com/package/@zk-email/sdk

import zkeSDK, { Proof } from "@zk-email/sdk";
import fs from "fs/promises";

async function main() {
    const sdk = zkeSDK();

    // Get blueprint from the registry
    const blueprint = await sdk.getBlueprint("uri-99/proof_of_product_receipt_self@v3");

    const prover = blueprint.createProver(); //Prover with the specified blueprint // Optional for generating proof locally: ({ isLocal: true });

    // Read email file
    const eml = await fs.readFile("./emls/self.eml", "utf-8");

    // Check if mail can be used with the Blueprint
    await blueprint.validateEmail(eml); // Throws err if not
    console.log("VK: ", await blueprint.getVkey());


    // Generate the proof
    const proof = await prover.generateProof(eml);
    console.log("Proof data: ", proof.props.proofData);
    console.log("Public outputs: ", proof.props.publicOutputs);
    console.log("props: ", proof.props);

    // // Verify the proof
    // // Off chain:
    // const verification = await blueprint.verifyProof(proof);

    // console.log("Verification: ", verification);

    // // If you only have the proof data:
    // // const verified = await blueprint.verifyProofData(
    // //     JSON.stringify(proof.props.publicOutputs),
    // //     JSON.stringify(proof.props.proofData)
    // // );
    // // console.log("Proof is valid: ", verified);
}

main();