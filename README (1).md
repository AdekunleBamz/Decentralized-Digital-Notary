# Decentralized Digital Notary (Stacks + Bitcoin)

A fully on-chain document notarization dApp built on **Stacks**,
providing immutable timestamping, proof of existence, and integrity
verification for digital files. The application generates a SHA-256 hash
of any document and anchors it on Bitcoin through a Clarity smart
contract, ensuring permanent, verifiable, tamper-proof records.

## 🚀 Features

-   Blockchain-anchored proofs using Stacks + Bitcoin finality
-   Client-side file hashing (SHA-256)
-   Clarity smart contract for recording document hashes
-   @stacks/connect authentication
-   Document lookup & verification UI
-   Immutable, censorship-resistant time-stamping

## 🧱 Tech Stack

-   Stacks (Bitcoin finality layer)
-   Clarity Smart Contract
-   Next.js / React frontend
-   Hiro API
-   Stacks.js (transactions, wallets, contract calls)

## 📦 Smart Contract

A minimal Clarity contract storing document hashes immutably:

    (define-data-var documents (list 100 (buff 32)) (list))
    (define-public (notarize (file-hash (buff 32)))
      (begin
        (var-set documents (cons file-hash (var-get documents)))
        (ok file-hash)))

## 🖥️ How It Works

1.  User uploads a file.
2.  App computes its SHA-256 hash locally.
3.  User signs a transaction via Hiro Wallet.
4.  Hash is written to the blockchain.
5.  Anyone can verify the file later by hashing it again and checking
    its presence in the contract.

## 🔍 Verification Page

Includes: - File re-upload hashing - On-chain hash search -
Human-readable verification results

## 📁 Project Highlights

This repository demonstrates: - Practical use of Stacks smart
contracts - Real-world Bitcoin-anchored notarization - Secure
client-side cryptography - Production-ready dApp architecture -
Full-stack integration with Stacks.js

## 🏷️ Keywords (SEO)

Stacks, Clarity, Bitcoin, Proof of Existence, Blockchain Notary, Digital
Notary, Decentralization, Web3, Smart Contract, Hiro Wallet, Stacks.js,
Hash Verification, Immutable Records, Document Timestamping

## 📜 License

MIT License.
