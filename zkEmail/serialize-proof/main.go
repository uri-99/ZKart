package main

import (
	"fmt"
	"log"
	"os"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	groth16_bn254 "github.com/consensys/gnark/backend/groth16/bn254"
	"github.com/consensys/gnark/backend/witness"
	"github.com/vocdoni/circom2gnark/parser"
)


func main() {
	proofFile := "proof.json"
	vkFile := "./constant/vk.json"
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
	verified, err := verify(gnarkProof)
	if err != nil {
		log.Fatalf("proof verification failed: %v", err)
	}
	if !verified {
		log.Fatalf("proof verification failed")
	}

	printData(gnarkProof)

	// Export the proof to a file
	proofFileOut := "groth16.proof"
	pubFileOut := "groth16.pub"
	vkFileOut := "groth16.vk"
	writeToFile(gnarkProof, proofFileOut, pubFileOut, vkFileOut)

	// Read back the generated files and try to verify them
	log.Println("\n--- Verifying generated files ---")
	err = readAndVerifyGeneratedFiles(proofFileOut, vkFileOut, pubFileOut, gnarkProof.Proof.CurveID())
	if err != nil {
		log.Fatalf("Verification of generated files failed: %v", err)
	} else {
		log.Println("Verification of generated files SUCCEEDED!")
	}
}

///

func parse(proofFile string, vkFile string, pubFile string) (*parser.CircomProof, *parser.CircomVerificationKey, []string, error) {
	// Read the proof, verification key, and public signals from files
	proofData, err := os.ReadFile(proofFile)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to read proof: %v", err)
	}
	vkData, err := os.ReadFile(vkFile)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to read verification key: %v", err)
	}
	publicSignalsData, err := os.ReadFile(pubFile)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to read public signals: %v", err)
	}

	// Unmarshal the JSON data
	snarkProof, err := parser.UnmarshalCircomProofJSON(proofData)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to unmarshal proof: %v", err)
	}
	snarkVk, err := parser.UnmarshalCircomVerificationKeyJSON(vkData)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to unmarshal verification key: %v", err)
	}
	publicSignals, err := parser.UnmarshalCircomPublicSignalsJSON(publicSignalsData)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to unmarshal public signals: %v", err)
	}
	return snarkProof, snarkVk, publicSignals, nil
}

func convertToGnarkProof(snarkProof *parser.CircomProof, snarkVk *parser.CircomVerificationKey, publicSignals []string) (*parser.GnarkProof, error) {
	gnarkProof, err := parser.ConvertCircomToGnark(snarkProof, snarkVk, publicSignals)
	if err != nil {
		return nil, fmt.Errorf("failed to convert Circom proof to Gnark proof: %v", err)
	}

	return gnarkProof, nil
}

func verify(gnarkProof *parser.GnarkProof) (bool, error) {
	// Verify the proof using Gnark verifier
	err := groth16_bn254.Verify(gnarkProof.Proof, gnarkProof.VerifyingKey, gnarkProof.PublicInputs)
	if err != nil {
		return false, fmt.Errorf("proof verification failed: %v", err)
	}
	fmt.Println("Proof verification succeeded!")
	return true, nil
}

func printData(gnarkProof *parser.GnarkProof) {
	// fmt.Println("Proof:", gnarkProof.Proof)
	// fmt.Println("Verifying Key:", gnarkProof.VerifyingKey)
	// fmt.Println("Verifying Key Commitment Keys:", gnarkProof.VerifyingKey.CommitmentKeys)
	// fmt.Println("Public Inputs:", gnarkProof.PublicInputs)
	// fmt.Println("Curve ID:", gnarkProof.Proof.CurveID())
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

	// Write proof
	proofBytes, err := gnarkProof.Proof.WriteTo(proofFile)
	if err != nil {
		panic("could not serialize proof into file")
	}
	fmt.Printf("Proof file size: %d bytes\n", proofBytes)

	// Log the state before writing
	log.Printf("VerifyingKey before WriteTo: %#v", gnarkProof.VerifyingKey)

	vkBytes, err := gnarkProof.VerifyingKey.WriteTo(vkFile)
	if err != nil {
		panic("could not serialize verification key into file")
	}
	fmt.Printf("VK file size: %d bytes\n", vkBytes)

	log.Printf("gnarkProof.VerifyingKey: %v", gnarkProof.VerifyingKey)

	// Create a witness from the public inputs
	witnessOriginal, err := witness.New(gnarkProof.Proof.CurveID().ScalarField())
	if err != nil {
		panic("could not create witness")
	}

	// Fill the witness with public inputs
	valuesChan := make(chan any, len(gnarkProof.PublicInputs))
	for _, val := range gnarkProof.PublicInputs {
		valuesChan <- val
	}
	close(valuesChan)

	err = witnessOriginal.Fill(len(gnarkProof.PublicInputs), 0, valuesChan)
	if err != nil {
		panic("could not fill witness")
	}

	pubBytes, err := witnessOriginal.WriteTo(pubFile)
	if err != nil {
		panic("could not serialize public inputs into file")
	}
	fmt.Printf("Public inputs file size: %d bytes\n", pubBytes)

	// Verify files were written correctly
	proofInfo, _ := os.Stat(proofFileOut)
	vkInfo, _ := os.Stat(vkFileOut)
	pubInfo, _ := os.Stat(pubFileOut)

	fmt.Printf("\nFile sizes after writing:\n")
	fmt.Printf("Proof file: %d bytes\n", proofInfo.Size())
	fmt.Printf("VK file: %d bytes\n", vkInfo.Size())
	fmt.Printf("Public inputs file: %d bytes\n", pubInfo.Size())

	// Add hex dump for the VK file
	vkBytesFromFile, err := os.ReadFile(vkFileOut)
	if err != nil {
		log.Fatalf("Failed to read back vkFileOut for hex dump: %v", err)
	}
	log.Printf("HEXDUMP of %s:\n%x\n", vkFileOut, vkBytesFromFile)
}

func readAndVerifyGeneratedFiles(proofFilePath, vkFilePath, pubFilePath string, curveID ecc.ID) error {
	// Read Proof
	proofFile, err := os.Open(proofFilePath)
	if err != nil {
		return fmt.Errorf("failed to open proof file %s: %w", proofFilePath, err)
	}
	defer proofFile.Close()
	// Create a concrete bn254.Proof and use its ReadFrom method.
	newProof := groth16.NewProof(curveID)
	if _, err := newProof.ReadFrom(proofFile); err != nil {
		return fmt.Errorf("failed to read proof from %s: %w", proofFilePath, err)
	}
	log.Println("Successfully read proof from generated file.")

	// Read Verifying Key
	vkFile, err := os.Open(vkFilePath)
	if err != nil {
		return fmt.Errorf("failed to open vk file %s: %w", vkFilePath, err)
	}
	defer vkFile.Close()
	// Create a concrete bn254.VerifyingKey and use its ReadFrom method.
	newVK := groth16.NewVerifyingKey(curveID)
	if _, err := newVK.ReadFrom(vkFile); err != nil {
		return fmt.Errorf("failed to read verifying key from %s: %w", vkFilePath, err)
	}
	log.Println("Successfully read verifying key from generated file.")
	log.Printf("Read VerifyingKey: %#v", newVK)

	// Read Public Inputs (Witness)
	pubFile, err := os.Open(pubFilePath)
	if err != nil {
		return fmt.Errorf("failed to open public inputs file %s: %w", pubFilePath, err)
	}
	defer pubFile.Close()

	newPubWitness, err := witness.New(curveID.ScalarField())
	if err != nil {
		return fmt.Errorf("failed to create new witness for curve %s: %w", curveID.String(), err)
	}
	if _, err := newPubWitness.ReadFrom(pubFile); err != nil {
		return fmt.Errorf("failed to read public inputs from %s: %w", pubFilePath, err)
	}
	log.Println("Successfully read public inputs from generated file.")

	// Verify the proof with the newly read objects
	log.Println("Attempting to verify proof with data read from generated files...")
	err = groth16.Verify(newProof, newVK, newPubWitness)
	if err != nil {
		return fmt.Errorf("verification using data from generated files failed: %w", err)
	}

	return nil
}
