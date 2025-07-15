import { publicClient } from '@/lib/walletClient'
import { flapTokenAbi } from '@/lib/contracts'

interface GetPermitSignatureArgs {
  owner: `0x${string}`
  spender: `0x${string}`
  value: bigint
  tokenAddress: `0x${string}`
  chainId: number
  signTypedData: (params: {
    domain: any
    types: any
    primaryType: string
    message: any
  }) => Promise<`0x${string}`>
}

export async function getPermitSignatureClient({
  owner,
  spender,
  value,
  tokenAddress,
  chainId,
  signTypedData,
}: GetPermitSignatureArgs) {
  const deadline = Math.floor(Date.now() / 1000) + 60 * 60

  const nonce = await publicClient.readContract({
    address: tokenAddress,
    abi: flapTokenAbi.abi,
    functionName: 'nonces',
    args: [owner],
  }) as bigint

  const signature = await signTypedData({
    domain: {
      name: 'FLAPTOKEN',
      version: '1',
      chainId,
      verifyingContract: tokenAddress,
    },
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline: BigInt(deadline),
    },
  })

  return {
    signature,
    deadline,
  }
}
