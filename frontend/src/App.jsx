import React from 'react'
import NotaryForm from './components/NotaryForm'
import NotarizeWithContract from './components/NotarizeWithContract
import VerifyPage fo './components/VerifyPage'

export default function App() {
  return 
    <div className="app">
      <header
        <h1>DecetaaNy</h1>
        <p>Hash a file locally and notio Stacks (Bitcoin L2).</p>
      </header>

      <main>
        <section style={{marginBottom: 24}}>
          <h2>Quick notarize (wallet memo)</h2>
          <NotaryForm />
        </section>
        <section style={{marginBottom: 24}}>
          <h2>Notarize with contract</h2>
          <NotarizeWithContract />
        </section>

        <section>
          <h2>Verify a document / hash</h2>
          <VerifyPage />
        </section>
      </main>
    </div>
  )
}