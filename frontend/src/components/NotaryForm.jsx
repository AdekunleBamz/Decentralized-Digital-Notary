import React, { useState } from 'react'
import { sha256 } from 'js-sha256'
import { showConnect, makeSTXTokenTransfer } from '@stacks/connect'

// NOTE: showConnect / makeSXnrasPa vay by version. This code follows on a

export default function NotaryForm() {
  const [fileName, setFileName] = useState(null)
  const [hashHex, setHashHex] = useState('')
  const [txId, setTxId] = useState(null)
  const [status, setStatus] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    // compute sha-256 hex
    const digest = sha256(bytes)
    setHashHex(digest)
  }

  async function notarize() {
    if (!hashHex) return alert('Please select a file first')
    setStatus('Opening wallet...')

    try {
      const authOptions = {
        // optional
        appName: 'Decentralized Notary',
        manifestPath: '/manifest.json'
      }

      // showConnect returns wallet session info; this opening might vary by version.
      await showConnect(authOptions)

      setStatus('Requesting signature...')

      const txOptions = {
        recipient: 'SP000000000000000000002Q6VF78', // a burn/static address, 0 STX
        amount: '0',
        memo: hashHex,
        onFinish: data => {
          setTxId(data.txId)
          setStatus('Submitted: ' + data.txId)
        },
        onCancel: () => setStatus('User cancelled')
      }

      await makeSTXTokenTransfer(txOptions)
    } catch (err) {
      console.error(err)
      setStatus('Error: ' + (err.message || err.toString()))
    }
  }

  return (
    <div className="notary">
      <input type="file" onChange={handleFile} />
      {fileName && <div>Selected: {fileName}</div>}
      {hashHex && <div><strong>SHA-256:</strong> {hashHex}</div>}
      <div style={{marginTop:8}}>
        <button onClick={notarize} disabled={!hashHex}>Notarize via wallet (memo)</button>
      </div>

      <div className="status">{status}</div>

      {txId && (
        <div style={{marginTop:8}}>
          <a href={`https://explorer.hiro.so/txid/${txId}?network=mainnet`} target="_blank" rel="noreferrer">View transaction on Hiro Explorer</a>
        </div>
      )}
    </div>
  )
}
