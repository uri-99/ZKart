package main

import(
	"log"
	"os"
	"fmt"

	"github.com/vocdoni/circom2gnark/parser"
	groth16_bn254 "github.com/consensys/gnark/backend/groth16/bn254"
)

func main() {
	proofFile := "proof.json"
	vkFile := "vk.json"
	pubFile := "pub.json"

	// Parse the proof, verification key, and public signals from JSON files
	proof, vk, pub, err := parse(proofFile, vkFile, pubFile)
	if err != nil {
		log.Fatalf("failed to parse inputs: %v", err)
	}

	// Convert the proof to a Gnark proof
	gnarkProof, err := convertToGnarkProof(proof, vk, pub)
	if err != nil {
		log.Fatalf("failed to convert Circom proof to Gnark proof: %v", err)
	}

	// Verify the proof using gnark with the parsed info
	verified := verify(gnarkProof)
	if !verified {
		log.Fatalf("proof verification failed")
	}

	// Export the proof to a file
	// proofFileOut := "groth16.proof"
	// pubFileOut := "groth16.pub"
	// vkFileOut := "groth16.vk"
	// writeToFile(gnarkProof, proofFileOut, pubFileOut, vkFileOut)
}

func writeToFile(gnarkProof *parser.GnarkProof, proofFileOut string, pubFileOut string, vkFileOut string) {
	proofFile, err := os.Create(proofFileOut)
	if err != nil {
		panic(err)
	}
	defer proofFile.Close()

	pubFile, err := os.Create(pubFileOut)
	if err != nil {
		panic(err)
	}
	defer pubFile.Close()

	vkFile, err := os.Create(vkFileOut)
	if err != nil {
		panic(err)
	}
	defer vkFile.Close()

	_, err = gnarkProof.Proof.WriteTo(proofFile)
	if err != nil {
		panic("could not serialize proof into file")
	}
	_, err = gnarkProof.VerifyingKey.WriteTo(vkFile)
	if err != nil {
		panic("could not serialize verification key into file")
	}
	// _, err = gnarkProof..WriteTo(pubFile)
	// if err != nil {
	// 	panic("could not serialize proof into file")
	// }

}


func parse(proofFile string, vkFile string, pubFile string) (*parser.CircomProof, *parser.CircomVerificationKey, []string, error) {
	// Read the proof, verification key, and public signals from files
	proofData, err := os.ReadFile(proofFile)
	if err != nil {
		log.Fatalf("failed to read proof: %v", err)
	}

	vkData, err := os.ReadFile(vkFile)
	if err != nil {
		log.Fatalf("failed to read verification key: %v", err)
	}

	publicSignalsData, err := os.ReadFile(pubFile)
	if err != nil {
		log.Fatalf("failed to read public signals: %v", err)
	}

	// Unmarshal the JSON data
	snarkProof, err := parser.UnmarshalCircomProofJSON(proofData)
	if err != nil {
		log.Fatalf("failed to unmarshal proof: %v", err)
	}

	snarkVk, err := parser.UnmarshalCircomVerificationKeyJSON(vkData)
	if err != nil {
		log.Fatalf("failed to unmarshal verification key: %v", err)
	}

	publicSignals, err := parser.UnmarshalCircomPublicSignalsJSON(publicSignalsData)
	if err != nil {
		log.Fatalf("failed to unmarshal public signals: %v", err)
	}
	return snarkProof, snarkVk, publicSignals, nil
}

func convertToGnarkProof(snarkProof *parser.CircomProof, snarkVk *parser.CircomVerificationKey, publicSignals []string) (*parser.GnarkProof, error) {
	gnarkProof, err := parser.ConvertCircomToGnark(snarkProof, snarkVk, publicSignals)
	if err != nil {
		log.Fatalf("failed to convert Circom proof to Gnark proof: %v", err)
	}
	return gnarkProof, nil
}

func verify(gnarkProof *parser.GnarkProof) bool {
	// Verify the proof using Gnark verifier
	// Verify the proof
	err := groth16_bn254.Verify(gnarkProof.Proof, gnarkProof.VerifyingKey, gnarkProof.PublicInputs)
	if err != nil {
		log.Fatalf("proof verification failed: %v", err)
	}
	fmt.Println("Proof verification succeeded!")
	return true
}