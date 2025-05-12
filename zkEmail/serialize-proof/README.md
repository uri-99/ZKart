This is a program that serializes a circom proof to a valid format for GNARK

Currently, main.go has:
```go
	proofFile := "proof.json"
	vkFile := "vk.json"
	pubFile := "pub.json"
```

Then it parses the proof with `parse()` and then it verifies it using GNARK.

Now i need to export the working GNARK proof to a file.

