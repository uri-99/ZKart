package main

import (
	"encoding/json"
	"log"
	"math/big"
	"os"

	"github.com/consensys/gnark-crypto/ecc/bn254"
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
	Public map[string][]string `json:"public"`
}

// Struct matching your VK JSON format
type VerifyingKeyJSON struct {
	Alfa1  [2]string    `json:"alfa1"` // G1 point
	Beta2  [2][2]string `json:"beta2"` // G2 point
	Gamma2 [2][2]string `json:"gamma2"` // G2 point
	Delta2 [2][2]string `json:"delta2"` // G2 point
	IC     [][]string   `json:"IC"`    // List of G1 points
}

// Helper function to convert decimal string to *big.Int
func toBigInt(s string) *big.Int {
	n, ok := new(big.Int).SetString(s, 10)
	if !ok {
		log.Fatalf("failed to convert string '%s' to big.Int", s)
	}
	return n
}

func main() {
	// --- Parse Proof ---
	log.Println("Parsing proof.json...")
	fProof, err := os.ReadFile("pretty-proof.json") // Assuming your proof file is named this
	if err != nil {
		log.Fatal("Error reading proof file:", err)
	}
	var parsedProof ProofJSON
	if err := json.Unmarshal(fProof, &parsedProof); err != nil {
		log.Fatal("Error unmarshalling proof JSON:", err)
	}

	var proof groth16_bn254.Proof

	// π_a is Ar in gnark's G1Affine struct
	proof.Ar.X.SetBigInt(toBigInt(parsedProof.Proof.PiA[0]))
	proof.Ar.Y.SetBigInt(toBigInt(parsedProof.Proof.PiA[1]))
	// The third element PiA[2] is usually 1 for affine coordinates, gnark handles this.

	// π_b is Bs in gnark's G2Affine struct
	// Note the structure: Bs.X has A0, A1; Bs.Y has A0, A1
	// π_b corresponds to the Solidity 'b' (G2Point)
	proof.Bs.X.A0.SetBigInt(toBigInt(parsedProof.Proof.PiB[0][0])) // X component 0 X.A0
	proof.Bs.X.A1.SetBigInt(toBigInt(parsedProof.Proof.PiB[0][1])) // X component 1 X.A1
	proof.Bs.Y.A0.SetBigInt(toBigInt(parsedProof.Proof.PiB[1][0])) // Y component 0 Y.A0
	proof.Bs.Y.A1.SetBigInt(toBigInt(parsedProof.Proof.PiB[1][1])) // Y component 1 Y.A1

	// π_c is Krs in gnark's G1Affine struct
	proof.Krs.X.SetBigInt(toBigInt(parsedProof.Proof.PiC[0]))
	proof.Krs.Y.SetBigInt(toBigInt(parsedProof.Proof.PiC[1]))
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
	fVK, err := os.ReadFile("vk.json") // Assuming your VK file is named this
	if err != nil {
		log.Fatal("Error reading VK file:", err)
	}

	var parsedVK VerifyingKeyJSON
	if err := json.Unmarshal(fVK, &parsedVK); err != nil {
		log.Fatal("Error unmarshalling VK JSON:", err)
	}

	var vk groth16_bn254.VerifyingKey

	// alfa1 -> vk.G1.Alpha (G1 point)
	vk.G1.Alpha.X.SetBigInt(toBigInt(parsedVK.Alfa1[0]))
	vk.G1.Alpha.Y.SetBigInt(toBigInt(parsedVK.Alfa1[1]))
	if !vk.G1.Alpha.IsOnCurve(){
        log.Fatalf("Error: Parsed Alpha point is not on the curve!")
    }

	// beta2 -> vk.G2.Beta (G2 point)
	vk.G2.Beta.X.A1.SetBigInt(toBigInt(parsedVK.Beta2[0][0]))
	vk.G2.Beta.X.A0.SetBigInt(toBigInt(parsedVK.Beta2[0][1]))
	vk.G2.Beta.Y.A1.SetBigInt(toBigInt(parsedVK.Beta2[1][0]))
	vk.G2.Beta.Y.A0.SetBigInt(toBigInt(parsedVK.Beta2[1][1]))
	if !vk.G2.Beta.IsOnCurve(){
        log.Fatalf("Error: Parsed Beta point is not on the curve!")
    }

	// gamma2 -> vk.G2.Gamma (G2 point)
	vk.G2.Gamma.X.A1.SetBigInt(toBigInt(parsedVK.Gamma2[0][0]))
	vk.G2.Gamma.X.A0.SetBigInt(toBigInt(parsedVK.Gamma2[0][1]))
	vk.G2.Gamma.Y.A1.SetBigInt(toBigInt(parsedVK.Gamma2[1][0]))
	vk.G2.Gamma.Y.A0.SetBigInt(toBigInt(parsedVK.Gamma2[1][1]))
	if !vk.G2.Gamma.IsOnCurve(){
        log.Fatalf("Error: Parsed Gamma point is not on the curve!")
    }

	// delta2 -> vk.G2.Delta (G2 point)
	vk.G2.Delta.X.A1.SetBigInt(toBigInt(parsedVK.Delta2[0][0]))
	vk.G2.Delta.X.A0.SetBigInt(toBigInt(parsedVK.Delta2[0][1]))
	vk.G2.Delta.Y.A1.SetBigInt(toBigInt(parsedVK.Delta2[1][0]))
	vk.G2.Delta.Y.A0.SetBigInt(toBigInt(parsedVK.Delta2[1][1]))
	if !vk.G2.Delta.IsOnCurve(){
        log.Fatalf("Error: Parsed Delta point is not on the curve!")
    }

    // IC -> vk.G1.K (Slice of G1 points)
    vk.G1.K = make([]bn254.G1Affine, len(parsedVK.IC)) // Pre-allocate the slice
    for i, pointStr := range parsedVK.IC {
        if len(pointStr) != 2 {
            log.Fatalf("Invalid point structure in IC at index %d: expected 2 elements, got %d", i, len(pointStr))
        }
        vk.G1.K[i].X.SetBigInt(toBigInt(pointStr[0]))
        vk.G1.K[i].Y.SetBigInt(toBigInt(pointStr[1]))

        if !vk.G1.K[i].IsOnCurve() {
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
	

	log.Println("\nParsing and writing complete.")

	log.Println("\nVerifying the parsed proof...")
	// Verify the proof

}