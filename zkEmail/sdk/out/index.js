"use strict";
// Docs from: https://www.npmjs.com/package/@zk-email/sdk
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@zk-email/sdk"));
const promises_1 = __importDefault(require("fs/promises"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const sdk = (0, sdk_1.default)();
        // Get blueprint from the registry
        const blueprint = yield sdk.getBlueprint("uri-99/proof_of_product_receipt_self@v3");
        const prover = blueprint.createProver(); //Prover with the specified blueprint // Optional for generating proof locally: ({ isLocal: true });
        // Read email file
        const eml = yield promises_1.default.readFile("./emls/self.eml", "utf-8");
        // Check if mail can be used with the Blueprint
        yield blueprint.validateEmail(eml); // Throws err if not
        console.log("VK: ", yield blueprint.getVkey());
        // Generate the proof
        const proof = yield prover.generateProof(eml);
        console.log("Proof data: ", proof.props.proofData);
        console.log("Public outputs: ", proof.props.publicOutputs);
        console.log("props: ", proof.props);
        // Verify the proof
        // Off chain:
        const verification = yield blueprint.verifyProof(proof);
        console.log("Verification: ", verification);
        // If you only have the proof data:
        // const verified = await blueprint.verifyProofData(
        //     JSON.stringify(proof.props.publicOutputs),
        //     JSON.stringify(proof.props.proofData)
        // );
        // console.log("Proof is valid: ", verified);
    });
}
main();
