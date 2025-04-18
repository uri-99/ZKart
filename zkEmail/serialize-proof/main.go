package main

import (
	"encoding/json"
	"log"
	"math/big"
	"os"

	"github.com/consensys/gnark-crypto/ecc/bn254"

	"github.com/consensys/gnark-crypto/ecc/bn254/fr"
	"github.com/consensys/gnark/backend/witness"

	// "github.com/consensys/gnark/frontend"
	// "github.com/consensys/gnark/frontend/cs/r1cs"

	"github.com/consensys/gnark/backend/groth16"
	groth16_bn254 "github.com/consensys/gnark/backend/groth16/bn254"
)

// Struct matching your proof JSON format
type ProofJSON struct {
	Proof struct {
		PiA      [3]string    `json:"pi_a"`
		PiB      [2][2]string `json:"pi_b"`
		PiC      [3]string    `json:"pi_c"`
		Protocol string       `json:"protocol"`
	} `json:"proof"`
	// Public map[string][]string `json:"public"`
}

// Struct matching your VK JSON format
type VerifyingKeyJSON struct {
	Alfa1  [2]string    `json:"vk_alpha_1"` // G1 point
	Beta2  [2][2]string `json:"vk_beta_2"`  // G2 point
	Gamma2 [2][2]string `json:"vk_gamma_2"` // G2 point
	Delta2 [2][2]string `json:"vk_delta_2"` // G2 point
	IC     [][]string   `json:"IC"`         // List of G1 points
}

// Struct to hold the parsed public inputs from pub.json
type ParsedPublicInputs struct {
	Zero  string `json:"0"`
	One   string `json:"1"`
	Two   string `json:"2"`
	Three string `json:"3"`
	Four  string `json:"4"`
	Five  string `json:"5"`
	Six   string `json:"6"`
	Seven string `json:"7"`
	Eight string `json:"8"`
	Nine  string `json:"9"`
}

// Helper function to convert decimal string to *big.Int
func toBigInt(s string) big.Int {
	n := big.Int{}
	_, ok := n.SetString(s, 10)
	if !ok {
		log.Fatalf("failed to convert string '%s' to big.Int", s)
	}
	// n, ok := new(big.Int).SetString(s, 10)
	// if !ok {
	// 	log.Fatalf("failed to convert string '%s' to big.Int", s)
	// }
	return n
}

func main() {
	// --- Parse Proof ---
	log.Println("Parsing proof.json...")
	fProof, err := os.ReadFile("proof.json") // Assuming your proof file is named this
	if err != nil {
		log.Fatal("Error reading proof file:", err)
	}
	var parsedProof ProofJSON
	if err := json.Unmarshal(fProof, &parsedProof); err != nil {
		log.Fatal("Error unmarshalling proof JSON:", err)
	}

	// var proof groth16_bn254.Proof

	// // π_a is Ar in gnark's G1Affine struct
	// proof.Ar.X.SetString((parsedProof.Proof.PiA[0]))
	// proof.Ar.Y.SetString((parsedProof.Proof.PiA[1]))
	// // The third element PiA[2] is usually 1 for affine coordinates, gnark handles this.

	// // π_b is Bs in gnark's G2Affine struct
	// // Note the structure: Bs.X has A0, A1; Bs.Y has A0, A1
	// // π_b corresponds to the Solidity 'b' (G2Point)
	// proof.Bs.X.A0.SetString((parsedProof.Proof.PiB[0][0])) // X component 0 X.A0
	// proof.Bs.X.A1.SetString((parsedProof.Proof.PiB[0][1])) // X component 1 X.A1
	// proof.Bs.Y.A0.SetString((parsedProof.Proof.PiB[1][0])) // Y component 0 Y.A0
	// proof.Bs.Y.A1.SetString((parsedProof.Proof.PiB[1][1])) // Y component 1 Y.A1

	// // π_c is Krs in gnark's G1Affine struct
	// proof.Krs.X.SetString((parsedProof.Proof.PiC[0]))
	// proof.Krs.Y.SetString((parsedProof.Proof.PiC[1]))
	// // The third element PiC[2] is usually 1 for affine coordinates, gnark handles this.

	proof := groth16.NewProof(bn254.ID)
	proofConcrete, ok := proof.(*groth16_bn254.Proof)
	if !ok {
		log.Fatalf("Failed to cast proof to *bn254.Proof")
		return
	}

	// π_a is Ar in gnark's G1Affine struct
	proofConcrete.Ar.X.SetString((parsedProof.Proof.PiA[0]))
	proofConcrete.Ar.Y.SetString((parsedProof.Proof.PiA[1]))
	// The third element PiA[2] is usually 1 for affine coordinates, gnark handles this.

	// π_b is Bs in gnark's G2Affine struct
	// Note the structure: Bs.X has A0, A1; Bs.Y has A0, A1
	// π_b corresponds to the Solidity 'b' (G2Point)
	proofConcrete.Bs.X.A0.SetString((parsedProof.Proof.PiB[0][0])) // X component 0 X.A0
	proofConcrete.Bs.X.A1.SetString((parsedProof.Proof.PiB[0][1])) // X component 1 X.A1
	proofConcrete.Bs.Y.A0.SetString((parsedProof.Proof.PiB[1][0])) // Y component 0 Y.A0
	proofConcrete.Bs.Y.A1.SetString((parsedProof.Proof.PiB[1][1])) // Y component 1 Y.A1

	// π_c is Krs in gnark's G1Affine struct
	proofConcrete.Krs.X.SetString((parsedProof.Proof.PiC[0]))
	proofConcrete.Krs.Y.SetString((parsedProof.Proof.PiC[1]))
	// The third element PiC[2] is usually 1 for affine coordinates, gnark handles this.

	log.Println("Proof loaded into gnark struct.") // Removed proof details for brevity

	// Write proof
	outProofFile := "groth16.proof"
	outProof, err := os.Create(outProofFile)
	if err != nil {
		log.Fatal("Error creating proof output file:", err)
	}
	defer outProof.Close()
	_, err = proof.WriteTo(outProof)
	if err != nil {
		log.Fatal("Error writing proof to file:", err)
	}
	log.Println("Proof successfully written to", outProofFile)

	// --- Parse Verifying Key (VK) ---
	log.Println("\nParsing vk.json...")
	fVK, err := os.ReadFile("vk.json")
	if err != nil {
		log.Fatal("Error reading VK file:", err)
	}

	var parsedVK VerifyingKeyJSON
	if err := json.Unmarshal(fVK, &parsedVK); err != nil {
		log.Fatal("Error unmarshalling VK JSON:", err)
	}

	// var vk groth16_bn254.VerifyingKey
	vk := groth16.NewVerifyingKey(bn254.ID)
	vkConcrete, ok := vk.(*groth16_bn254.VerifyingKey)
	if !ok {
		log.Fatalf("Failed to cast vk to *bn254.VerifyingKey")
		return
	}

	// alfa1 -> vk.G1.Alpha (G1 point)
	vkConcrete.G1.Alpha.X.SetString((parsedVK.Alfa1[0]))
	vkConcrete.G1.Alpha.Y.SetString((parsedVK.Alfa1[1]))
	if !vkConcrete.G1.Alpha.IsOnCurve() {
		log.Fatalf("Error: Parsed Alpha point is not on the curve!")
	}

	// beta2 -> vk.G2.Beta (G2 point)
	vkConcrete.G2.Beta.X.A0.SetString((parsedVK.Beta2[0][0]))
	vkConcrete.G2.Beta.X.A1.SetString((parsedVK.Beta2[0][1]))
	vkConcrete.G2.Beta.Y.A0.SetString((parsedVK.Beta2[1][0]))
	vkConcrete.G2.Beta.Y.A1.SetString((parsedVK.Beta2[1][1]))
	if !vkConcrete.G2.Beta.IsOnCurve() {
		log.Fatalf("Error: Parsed Beta point is not on the curve!")
	}

	// gamma2 -> vk.G2.Gamma (G2 point)
	vkConcrete.G2.Gamma.X.A0.SetString((parsedVK.Gamma2[0][0]))
	vkConcrete.G2.Gamma.X.A1.SetString((parsedVK.Gamma2[0][1]))
	vkConcrete.G2.Gamma.Y.A0.SetString((parsedVK.Gamma2[1][0]))
	vkConcrete.G2.Gamma.Y.A1.SetString((parsedVK.Gamma2[1][1]))
	if !vkConcrete.G2.Gamma.IsOnCurve() {
		log.Fatalf("Error: Parsed Gamma point is not on the curve!")
	}

	// delta2 -> vk.G2.Delta (G2 point)
	vkConcrete.G2.Delta.X.A0.SetString((parsedVK.Delta2[0][0]))
	vkConcrete.G2.Delta.X.A1.SetString((parsedVK.Delta2[0][1]))
	vkConcrete.G2.Delta.Y.A0.SetString((parsedVK.Delta2[1][0]))
	vkConcrete.G2.Delta.Y.A1.SetString((parsedVK.Delta2[1][1]))
	if !vkConcrete.G2.Delta.IsOnCurve() {
		log.Fatalf("Error: Parsed Delta point is not on the curve!")
	}

	// IC -> vk.G1.K (Slice of G1 points)
	vkConcrete.G1.K = make([]bn254.G1Affine, len(parsedVK.IC)) // Pre-allocate the slice
	for i, pointStr := range parsedVK.IC {
		if len(pointStr) != 3 {
			log.Println("Invalid point structure in IC at index %d: expected 3 elements, got %d", i, len(pointStr))
		}
		vkConcrete.G1.K[i].X.SetString((pointStr[0]))
		vkConcrete.G1.K[i].Y.SetString((pointStr[1]))
		// vkConcrete.G1.K[i].Z.SetString((pointStr[2])) // Set Z coordinate to 1 for affine representation

		if !vkConcrete.G1.K[i].IsOnCurve() {
			log.Fatalf("Error: Parsed IC point at index %d is not on the curve!", i)
		}
	}

	log.Println("VK loaded into gnark struct.")

	// Write VK
	outVKFile := "groth16.vk"
	outVK, err := os.Create(outVKFile)
	if err != nil {
		log.Fatal("Error creating VK output file:", err)
	}
	defer outVK.Close()
	_, err = vk.WriteTo(outVK)
	if err != nil {
		log.Fatal("Error writing VK to file:", err)
	}
	log.Println("VK successfully written to", outVKFile)

	// --- Parse Pub Inputs ---
	// Read the content of the pub.json file
	pubJSONBytes, err := os.ReadFile("pub.json")
	if err != nil {
		log.Fatalf("Error reading pub.json file: %v", err)
		return
	}

	// Unmarshal the JSON content into the ParsedPublicInputs struct
	var parsedPublicInputs ParsedPublicInputs
	err = json.Unmarshal(pubJSONBytes, &parsedPublicInputs)
	if err != nil {
		log.Fatalf("Error unmarshalling pub.json: %v", err)
		return
	}

	// Create a slice to hold the *big.Int values
	publicInputSlice := make([]big.Int, 10)

	// Populate the slice from the parsed struct
	publicInputSlice[0] = toBigInt(parsedPublicInputs.Zero)
	publicInputSlice[1] = toBigInt(parsedPublicInputs.One)
	publicInputSlice[2] = toBigInt(parsedPublicInputs.Two)
	publicInputSlice[3] = toBigInt(parsedPublicInputs.Three)
	publicInputSlice[4] = toBigInt(parsedPublicInputs.Four)
	publicInputSlice[5] = toBigInt(parsedPublicInputs.Five)
	publicInputSlice[6] = toBigInt(parsedPublicInputs.Six)
	publicInputSlice[7] = toBigInt(parsedPublicInputs.Seven)
	publicInputSlice[8] = toBigInt(parsedPublicInputs.Eight)
	publicInputSlice[9] = toBigInt(parsedPublicInputs.Nine)

	pubInputWitness, err := witness.New(proof.CurveID().ScalarField())
	if err != nil {
		log.Printf("Error instantiating witness: %v", err)
		return
	}

	// Fill range over the provided chan to fill the underlying vector.
	// Will allocate the underlying vector with nbPublic + nbSecret elements.
	// This is typically call by internal APIs to fill the vector by walking a structure.
	// Fill(nbPublic, nbSecret int, values <-chan any) error

	nbPublic := len(publicInputSlice)
	nbSecret := 0 // Assuming no secret inputs for verification
	valuesChan := make(chan any, nbPublic)
	for _, val := range publicInputSlice {
		valuesChan <- val
	}
	close(valuesChan)

	err = pubInputWitness.Fill(nbPublic, nbSecret, valuesChan)
	if err != nil {
		log.Fatalf("Error filling witness: %v", err)
		return
	}

	// Print the witness vector explicitly
	vector := pubInputWitness.Vector()
	if vec, ok := vector.(fr.Vector); ok {
		log.Println("Witness vector:")
		for i := 0; i < len(vec); i++ {
			log.Printf("Element %d: %s", i, vec[i].String())
		}
	} else {
		log.Printf("Could not cast witness vector to expected type.")
	}

	// Write pubinputs to groth16.pub
	outPubInputFile := "groth16.pub"
	outPubInput, err := os.Create(outPubInputFile)
	if err != nil {
		log.Fatal("Error creating pubinput output file:", err)
	}
	defer outPubInput.Close()
	_, err = pubInputWitness.WriteTo(outPubInput)
	if err != nil {
		log.Fatal("Error writing pubinput to file:", err)
	}
	log.Println("Public inputs successfully written to", outPubInputFile)
	log.Println("Public inputs:", pubInputWitness)
	log.Println("Public inputs vector:", pubInputWitness.Vector())

	// --- Verification ---
	log.Println("\nVerifying the parsed proof...")
	// log.Println("Proof:", proof)
	// log.Println("Verifying Key:", vk)
	err = groth16.Verify(proof, vk, pubInputWitness)
	if err != nil {
		log.Fatalf("Could not verify Groth16 proof: %v", err)
		return
	}
	log.Println("Proof is valid!")

	log.Println("\nParsing and writing complete.")
}
