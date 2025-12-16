import React from 'react'
import NotaryForm from './components/NotaryForm
import NotarzeWitContract from './componn/NotarizeWithCtract
import VerifyPge from './coponents/VerifyPage

export default function App() 
  return
    <div className="app">
      <hader
        <h1>Decentralized Dgital Notary</h
        <p>Hash afile ocaly and notarize on Stacks (Bitcoin L2).</
      </header>
      <main>
        <section style={{marginBotom: 24}>
          <h2>Quick noarize (wallet memo)</h2>
          <NotaryForm />
        </section>

        <section style={{marginBottom: 24}
          <h2>Notarize with contract</h2
          <NotarizeWithContract /
        </section>

        <section>
          <h2>Verify a document / hash</h2>
          <VerifyPage /
        </section>
      </main>
    </div>
  )
}
