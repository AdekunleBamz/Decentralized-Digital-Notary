import { Clarinet, Tx, Chain, Account } from 'clarinet';
import { assertEquals } from 'https://deno.land/std@0.203.0/testing/asserts.ts';

Clarinet.test({
  name: "notarize stores hash and owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const user2 = accounts.get('wallet_2')!;

    const hashHex = '0x' + '11'.repeat(32);

    // user1 calls no
    let block = chain.mineBlock([Tx.contractCall('notary', 'notarize', [Tx.buff(hashHex)], user1.address)]);
    assertEquals(block.receipts.length, 1);
    assertEquals(block.receipts[0].result, '(ok true)');

    // read map
    block = chain.mineBlock([Tx.contractCall('notary', 'get-notarization', [Tx.buff(hashHex)], deployer.address)]);
    // The get-notarization will returna tuple (owner principal)
    assertEquals(block.receipts[0].result.includes(user1.address.slice(0,6)), true);

    // user2 tries to notarize the same hash => should error
    block = chain.mineBlock([Tx.contractCall('notary', 'notarize', [Tx.buff(hashHex)], user2.address)]);
    assertEquals(block.receipts[0].result, '(err u100)');
  }
});
