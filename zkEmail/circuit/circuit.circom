pragma circom 2.1.6;
include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/utils/regex.circom";
include "./regex/product_nameRegex.circom";
include "./regex/delivery_addressRegex.circom";
template proof_of_product_receipt_self(maxHeaderLength, maxBodyLength, n, k, packSize) {
    assert(n * k > 1024); // constraints for 1024 bit RSA
    signal input emailHeader[maxHeaderLength]; // prehashed email data, includes up to 512 + 64 bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input emailHeaderLength;
    signal input pubkey[k]; // RSA pubkey, verified with smart contract + DNSSEC proof. Split up into k parts of n bits each.
    signal input signature[k]; // RSA signature. Split up into k parts of n bits each.
    signal input proverETHAddress;
    
    // DKIM Verification
    component EV = EmailVerifier(maxHeaderLength, maxBodyLength, n, k, 0, 0, 0, 1);
    EV.emailHeader <== emailHeader;
    EV.emailHeaderLength <== emailHeaderLength;
    EV.pubkey <== pubkey;
    EV.signature <== signature;
    
    signal input bodyHashIndex;
    signal input precomputedSHA[32];
    signal input emailBody[maxBodyLength];
    signal input emailBodyLength;
    EV.bodyHashIndex <== bodyHashIndex;
    EV.precomputedSHA <== precomputedSHA;
    EV.emailBody <== emailBody;
    EV.emailBodyLength <== emailBodyLength;
    
    signal input decodedEmailBodyIn[maxBodyLength];
    EV.decodedEmailBodyIn <== decodedEmailBodyIn;
    
    
    
    
    signal output pubkeyHash;
    pubkeyHash <== EV.pubkeyHash;
    
    
    // Used for nullifier later
    signal output headerHashHi <== EV.shaHi;
    signal output headerHashLo <== EV.shaLo;
    
    // PRODUCT_NAME Extraction
    
    var product_nameMaxLength = 64;
    signal input product_nameRegexIdx;
    
    signal product_nameRegexOut, product_nameRegexReveal[2048];
    (product_nameRegexOut, product_nameRegexReveal) <== product_nameRegex(maxBodyLength)(decodedEmailBodyIn);
    product_nameRegexOut === 1;
    
    
    
    
    signal output product_namePackedOut[computeIntChunkLength(product_nameMaxLength)];
    product_namePackedOut <== PackRegexReveal(maxBodyLength, product_nameMaxLength)(product_nameRegexReveal, product_nameRegexIdx);
    
    
    
    
    
    
    // DELIVERY_ADDRESS Extraction
    
    var delivery_addressMaxLength = 64;
    signal input delivery_addressRegexIdx;
    
    signal delivery_addressRegexOut, delivery_addressRegexReveal[2048];
    (delivery_addressRegexOut, delivery_addressRegexReveal) <== delivery_addressRegex(maxBodyLength)(decodedEmailBodyIn);
    delivery_addressRegexOut === 1;
    
    
    
    
    signal output delivery_addressPackedOut[computeIntChunkLength(delivery_addressMaxLength)];
    delivery_addressPackedOut <== PackRegexReveal(maxBodyLength, delivery_addressMaxLength)(delivery_addressRegexReveal, delivery_addressRegexIdx);
    
    
    
    
    
    
}
component main { public [proverETHAddress] } = proof_of_product_receipt_self(1024, 2048, 121, 17, 7);
