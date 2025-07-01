import * as React from 'react'
import { Connector, useConnect } from 'wagmi'

export function WalletOptions() {
  const { connectors, connect } = useConnect()

  return connectors.map((connector) => (
    <button className="text-white font-bold text-3xl rounded-2xl p-4 cursor-pointer bg-gray-950" key={connector.uid} onClick={() => connect({ connector })}>
      {connector.name}
    </button>
  ))
}