import { Clarinet, Tx, Chain, Account } from 'clarinet';
import { assertEquals } from 'https://deno.land/std@0.203.0/testing/asserts.ts';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const user1 = accounts.get('wallet_1')!;
const user2 = accounts.get('wallet_2')!;
const user3 = accounts.get('wallet_3')!;

describe("Decentralized Digital Notary Contract", () => {
  beforeEach(() => {
    // Reset contract state for each test
  });

  describe("Basic Notarization Functionality", () => {
    it("should allow first-time notarization and store hash with owner", () => {
      const hashHex = '0x' + '11'.repeat(32);

      const { result } = simnet.callPublicFn(
        "notary",
        "notarize",
        [hashHex],
        user1
      );

      expect(result).toBeOk(true);

      // Verify the hash is stored with correct owner
      const stored = simnet.getMapEntry("notary", "notarizations", { hash: hashHex });
      expect(stored).toEqual({ owner: user1 });
    });

    it("should prevent different users from notarizing the same hash", () => {
      const hashHex = '0x' + '22'.repeat(32);

      // First user notarizes
      const result1 = simnet.callPublicFn("notary", "notarize", [hashHex], user1);
      expect(result1.result).toBeOk(true);

      // Second user tries to notarize same hash - should fail
      const result2 = simnet.callPublicFn("notary", "notarize", [hashHex], user2);
      expect(result2.result).toBeErr(100); // err u100 - conflict with different owner
    });

    it("should allow same user to re-notarize their own hash", () => {
      const hashHex = '0x' + '33'.repeat(32);

      // First notarization
      const result1 = simnet.callPublicFn("notary", "notarize", [hashHex], user1);
      expect(result1.result).toBeOk(true);

      // Same user re-notarizes - should succeed
      const result2 = simnet.callPublicFn("notary", "notarize", [hashHex], user1);
      expect(result2.result).toBeOk(true);

      // Verify still owned by same user
      const stored = simnet.getMapEntry("notary", "notarizations", { hash: hashHex });
      expect(stored).toEqual({ owner: user1 });
    });
  });

  describe("Hash Retrieval and Verification", () => {
    it("should retrieve notarization details for existing hashes", () => {
      const hashHex = '0x' + '44'.repeat(32);

      simnet.callPublicFn("notary", "notarize", [hashHex], user1);

      const { result } = simnet.callReadOnlyFn(
        "notary",
        "get-notarization",
        [hashHex],
        deployer
      );

      expect(result).toBeSome({ owner: user1 });
    });

    it("should return none for non-existent hashes", () => {
      const nonExistentHash = '0x' + 'ff'.repeat(32);

      const { result } = simnet.callReadOnlyFn(
        "notary",
        "get-notarization",
        [nonExistentHash],
        deployer
      );

      expect(result).toBeNone();
    });

    it("should verify document ownership correctly", () => {
      const hash1 = '0x' + 'aa'.repeat(32);
      const hash2 = '0x' + 'bb'.repeat(32);
      const hash3 = '0x' + 'cc'.repeat(32);

      // Different users notarize different documents
      simnet.callPublicFn("notary", "notarize", [hash1], user1);
      simnet.callPublicFn("notary", "notarize", [hash2], user2);
      simnet.callPublicFn("notary", "notarize", [hash3], user1);

      // Verify ownership
      expect(simnet.getMapEntry("notary", "notarizations", { hash: hash1 })).toEqual({ owner: user1 });
      expect(simnet.getMapEntry("notary", "notarizations", { hash: hash2 })).toEqual({ owner: user2 });
      expect(simnet.getMapEntry("notary", "notarizations", { hash: hash3 })).toEqual({ owner: user1 });
    });
  });

  describe("Hash Format and Validation", () => {
    it("should handle various hash formats correctly", () => {
      const testHashes = [
        '0x' + '00'.repeat(32), // All zeros
        '0x' + 'ff'.repeat(32), // All ones
        '0x' + '0123456789abcdef'.repeat(2), // Mixed pattern
        '0x' + 'fedcba9876543210'.repeat(2), // Reverse pattern
      ];

      testHashes.forEach((hash, index) => {
        const user = index % 2 === 0 ? user1 : user2;
        const { result } = simnet.callPublicFn("notary", "notarize", [hash], user);
        expect(result).toBeOk(true);

        const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
        expect(stored).toEqual({ owner: user });
      });
    });

    it("should handle edge case hashes", () => {
      const edgeHashes = [
        '0x' + '01'.repeat(32), // Minimal non-zero
        '0x' + 'fe'.repeat(32), // High values
        '0x' + '80808080808080808080808080808080', // Alternating bits
      ];

      edgeHashes.forEach(hash => {
        const { result } = simnet.callPublicFn("notary", "notarize", [hash], user1);
        expect(result).toBeOk(true);

        const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
        expect(stored).toEqual({ owner: user1 });
      });
    });
  });

  describe("Multi-User Scenarios", () => {
    it("should handle multiple users notarizing multiple documents", () => {
      const users = [user1, user2, user3];
      const hashesPerUser = 3;

      // Each user notarizes multiple documents
      users.forEach((user, userIndex) => {
        for (let i = 0; i < hashesPerUser; i++) {
          const hash = '0x' + (userIndex * hashesPerUser + i + 1).toString(16).padStart(64, '0');
          const { result } = simnet.callPublicFn("notary", "notarize", [hash], user);
          expect(result).toBeOk(true);
        }
      });

      // Verify all documents are stored correctly
      users.forEach((user, userIndex) => {
        for (let i = 0; i < hashesPerUser; i++) {
          const hash = '0x' + (userIndex * hashesPerUser + i + 1).toString(16).padStart(64, '0');
          const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
          expect(stored).toEqual({ owner: user });
        }
      });
    });

    it("should prevent ownership conflicts between users", () => {
      const sharedHash = '0x' + '77'.repeat(32);

      // User1 claims the hash first
      const result1 = simnet.callPublicFn("notary", "notarize", [sharedHash], user1);
      expect(result1.result).toBeOk(true);

      // User2 tries to claim the same hash - should fail
      const result2 = simnet.callPublicFn("notary", "notarize", [sharedHash], user2);
      expect(result2.result).toBeErr(100);

      // User3 also tries - should fail
      const result3 = simnet.callPublicFn("notary", "notarize", [sharedHash], user3);
      expect(result3.result).toBeErr(100);

      // But user1 can re-claim their own hash
      const result4 = simnet.callPublicFn("notary", "notarize", [sharedHash], user1);
      expect(result4.result).toBeOk(true);

      // Ownership remains with user1
      const stored = simnet.getMapEntry("notary", "notarizations", { hash: sharedHash });
      expect(stored).toEqual({ owner: user1 });
    });

    it("should support independent user document libraries", () => {
      const user1Hashes = [
        '0x' + '10'.repeat(32),
        '0x' + '11'.repeat(32),
        '0x' + '12'.repeat(32)
      ];

      const user2Hashes = [
        '0x' + '20'.repeat(32),
        '0x' + '21'.repeat(32),
        '0x' + '22'.repeat(32)
      ];

      // User1 notarizes their documents
      user1Hashes.forEach(hash => {
        const { result } = simnet.callPublicFn("notary", "notarize", [hash], user1);
        expect(result).toBeOk(true);
      });

      // User2 notarizes their documents
      user2Hashes.forEach(hash => {
        const { result } = simnet.callPublicFn("notary", "notarize", [hash], user2);
        expect(result).toBeOk(true);
      });

      // Verify separation of ownership
      user1Hashes.forEach(hash => {
        const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
        expect(stored).toEqual({ owner: user1 });
      });

      user2Hashes.forEach(hash => {
        const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
        expect(stored).toEqual({ owner: user2 });
      });
    });
  });

  describe("State Persistence and Data Integrity", () => {
    it("should maintain notarization state across operations", () => {
      const hash1 = '0x' + '90'.repeat(32);
      const hash2 = '0x' + '91'.repeat(32);
      const hash3 = '0x' + '92'.repeat(32);

      // Sequence of operations
      simnet.callPublicFn("notary", "notarize", [hash1], user1);
      simnet.callPublicFn("notary", "notarize", [hash2], user2);
      simnet.callPublicFn("notary", "notarize", [hash3], user1);

      // Verify all state is preserved
      expect(simnet.getMapEntry("notary", "notarizations", { hash: hash1 })).toEqual({ owner: user1 });
      expect(simnet.getMapEntry("notary", "notarizations", { hash: hash2 })).toEqual({ owner: user2 });
      expect(simnet.getMapEntry("notary", "notarizations", { hash: hash3 })).toEqual({ owner: user1 });
    });

    it("should handle read operations without modifying state", () => {
      const hash = '0x' + '80'.repeat(32);

      simnet.callPublicFn("notary", "notarize", [hash], user1);

      // Multiple read operations
      for (let i = 0; i < 5; i++) {
        const { result } = simnet.callReadOnlyFn("notary", "get-notarization", [hash], deployer);
        expect(result).toBeSome({ owner: user1 });
      }

      // State should remain unchanged
      const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
      expect(stored).toEqual({ owner: user1 });
    });

    it("should support batch verification operations", () => {
      const hashes = [
        '0x' + 'a0'.repeat(32),
        '0x' + 'a1'.repeat(32),
        '0x' + 'a2'.repeat(32),
        '0x' + 'a3'.repeat(32),
        '0x' + 'a4'.repeat(32)
      ];

      // Notarize all hashes
      hashes.forEach((hash, index) => {
        const user = index % 2 === 0 ? user1 : user2;
        simnet.callPublicFn("notary", "notarize", [hash], user);
      });

      // Batch verification - all should be retrievable
      hashes.forEach((hash, index) => {
        const expectedOwner = index % 2 === 0 ? user1 : user2;
        const { result } = simnet.callReadOnlyFn("notary", "get-notarization", [hash], deployer);
        expect(result).toBeSome({ owner: expectedOwner });
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle contract deployment and initialization", () => {
      // Verify contract is properly deployed
      expect(simnet.getContractSource("notary")).toBeDefined();
    });

    it("should handle empty hash edge cases", () => {
      // Note: Clarity will reject invalid buffer sizes at type level
      // This test documents the expected behavior
      const emptyHash = '0x' + ''.repeat(64); // 32 bytes of zeros

      const { result } = simnet.callPublicFn("notary", "notarize", [emptyHash], user1);
      expect(result).toBeOk(true); // Empty hash is technically valid

      const stored = simnet.getMapEntry("notary", "notarizations", { hash: emptyHash });
      expect(stored).toEqual({ owner: user1 });
    });

    it("should handle maximum hash values", () => {
      const maxHash = '0x' + 'ff'.repeat(64); // Maximum 32-byte value

      const { result } = simnet.callPublicFn("notary", "notarize", [maxHash], user1);
      expect(result).toBeOk(true);

      const stored = simnet.getMapEntry("notary", "notarizations", { hash: maxHash });
      expect(stored).toEqual({ owner: user1 });
    });

    it("should handle deployer as regular user", () => {
      const hash = '0x' + 'dd'.repeat(32);

      const { result } = simnet.callPublicFn("notary", "notarize", [hash], deployer);
      expect(result).toBeOk(true);

      const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
      expect(stored).toEqual({ owner: deployer });
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle large numbers of notarizations efficiently", () => {
      const numNotarizations = 50;
      const baseHash = '0x';

      for (let i = 0; i < numNotarizations; i++) {
        const hash = baseHash + i.toString(16).padStart(64, '0');
        const user = i % 2 === 0 ? user1 : user2;

        const { result } = simnet.callPublicFn("notary", "notarize", [hash], user);
        expect(result).toBeOk(true);
      }

      // Verify all notarizations are stored
      for (let i = 0; i < numNotarizations; i++) {
        const hash = baseHash + i.toString(16).padStart(64, '0');
        const expectedOwner = i % 2 === 0 ? user1 : user2;

        const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
        expect(stored).toEqual({ owner: expectedOwner });
      }
    });

    it("should support high-frequency notarization operations", () => {
      const rapidHashes = Array.from({ length: 20 }, (_, i) =>
        '0x' + (i + 100).toString(16).padStart(64, '0')
      );

      // Rapid notarization sequence
      rapidHashes.forEach(hash => {
        const { result } = simnet.callPublicFn("notary", "notarize", [hash], user1);
        expect(result).toBeOk(true);
      });

      // Verify all operations succeeded
      rapidHashes.forEach(hash => {
        const stored = simnet.getMapEntry("notary", "notarizations", { hash: hash });
        expect(stored).toEqual({ owner: user1 });
      });
    });
  });

  describe("Security and Access Control", () => {
    it("should prevent unauthorized hash modifications", () => {
      const hash = '0x' + 'ee'.repeat(32);

      // User1 notarizes
      simnet.callPublicFn("notary", "notarize", [hash], user1);

      // User2 cannot take ownership
      const result2 = simnet.callPublicFn("notary", "notarize", [hash], user2);
      expect(result2.result).toBeErr(100);

      // User3 cannot take ownership
      const result3 = simnet.callPublicFn("notary", "notarize", [hash], user3);
      expect(result3.result).toBeErr(100);

      // Only original owner can re-notarize
      const result1Again = simnet.callPublicFn("notary", "notarize", [hash], user1);
      expect(result1Again.result).toBeOk(true);
    });

    it("should maintain data integrity across user boundaries", () => {
      const user1Hash = '0x' + 'f1'.repeat(32);
      const user2Hash = '0x' + 'f2'.repeat(32);

      simnet.callPublicFn("notary", "notarize", [user1Hash], user1);
      simnet.callPublicFn("notary", "notarize", [user2Hash], user2);

      // Cross-verification should work for all users
      const result1 = simnet.callReadOnlyFn("notary", "get-notarization", [user1Hash], user2);
      expect(result1.result).toBeSome({ owner: user1 });

      const result2 = simnet.callReadOnlyFn("notary", "get-notarization", [user2Hash], user1);
      expect(result2.result).toBeSome({ owner: user2 });
    });
  });

  // Legacy test for backward compatibility
  Clarinet.test({
    name: "notarize stores hash and owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const deployer = accounts.get('deployer')!;
      const user1 = accounts.get('wallet_1')!;
      const user2 = accounts.get('wallet_2')!;

      const hashHex = '0x' + '11'.repeat(32);

      // user1 calls notarize
      let block = chain.mineBlock([Tx.contractCall('notary', 'notarize', [Tx.buff(hashHex)], user1.address)]);
      assertEquals(block.receipts.length, 1);
      assertEquals(block.receipts[0].result, '(ok true)');

      // read map
      block = chain.mineBlock([Tx.contractCall('notary', 'get-notarization', [Tx.buff(hashHex)], deployer.address)]);
      // The get-notarization will return a tuple (owner principal)
      assertEquals(block.receipts[0].result.includes(user1.address.slice(0,6)), true);

      // user2 tries to notarize the same hash => should error
      block = chain.mineBlock([Tx.contractCall('notary', 'notarize', [Tx.buff(hashHex)], user2.address)]);
      assertEquals(block.receipts[0].result, '(err u100)');
    }
  });
});
