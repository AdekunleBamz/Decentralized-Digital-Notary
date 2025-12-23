import React, { useState } from 'react'
import { sha256 } from 'js-sha256'
import { showConnect, openContractCall } from '@stacks/connect'
import {
  uintCV, bufferCV, hexToCV, cvToHex, standardPrincipalCV, makeStandardSTXPostCondition
} from '@stacks/transactions'

// IMPORTANT: depending on @stacks/connect version you might use `openContractCall` from @stacks/connect
// or construct the transaction using @stacks/transactions + sign via the wallet. This file shows the
// canonical pattern using connect's openContractCall

const CONTRACT_ADDRESS = 'SP3FBR2AGK2Y3PT1ZQW9...'; // <--- replace with your mainnet contract principal (owner)
const CONTRACT_NAME = 'notary'; // contract filename without .clar
const NETWORK = 'mainnet' // used only for UI links

export default function NotarizeWithContract() {
  const [fileName, setFileName] = useState(null)
  const [hashHex, setHashHex] = useState('')
  const [status, setStatus] = useState('')
  const [txId, setTxId] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const digest = sha256(bytes)
    setHashHex(digest)
  }

  async function notarizeContract() {
    if (!hashHex) return alert('Select a file first')

    setStatus('Opening wallet...')
    try {
      await showConnect({ appName: 'Decentralized Notary', manifestPath: '/manifest.json' })

      setStatus('Requesting contract call...')

      // prepare function args: pass hash as a buffer (32 bytes) hex
      const args = [
        // bufferCV expects a hex string representing bytes
        // hexToCV is not available in all versions — passing a hex string works with openContractCall and will be encoded
        // Use bufferCV(hexToArray?) - different versions vary. openContractCall can accept `buffer` type via `hexToCV`.
        // We'll pass the data as a hex string and set the type to 'buffer' in the connect call args.
      ]

      // Using openContractCall from @stacks/connect
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'notarize',
        functionArgs: [{ type: 'buffer', buffer: hashHex }],
        postConditionMode: 'deny',
        onFinish: data => {
          setStatus('Submitted: ' + data.txId)
          setTxId(data.txId)
        },
        onCancel: () => {
          setStatus('User cancelled')
        },
      })
    } catch (err) {
      console.error(err)
      setStatus('Error: ' + (err.message || String(err)))
    }
  }

  return (
    <div className="contract">
      <input type="file" onChange={handleFile} />
      {fileName && <div>Selected: {fileName}</div>}
      {hashHex && <div><strong>SHA-256:</strong> {hashHex}</div>}
      <div style={{marginTop:8}}>
        <button onClick={notarizeContract} disabled={!hashHex}>Notarize (contract call)</button>
      </div>
      <div className="status">{status}</div>
      {txId && (
        <div style={{marginTop:8}}>
          <a href={`https://explorer.hiro.so/txid/${txId}?network=mainnet`} target="_blank" rel="noreferrer">View tx on Hiro Explorer</a>
        </div>
      )}
    </div>
  )
}
