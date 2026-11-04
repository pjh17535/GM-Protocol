// Daily snapshot keeper for GM Protocol (Arc Testnet).
//
// Why: a milestone claim is queued on day D and can only be claimed after
// executeSnapshot(D) has run. executeSnapshot is permissionless, so any wallet
// can call it. This script finds every finished day that has queued claims but
// no snapshot yet and executes it, for the main GMCheckIn and every live
// GMPartner contract.
//
// Safety rule: only days strictly BEFORE today (UTC) are executed. A claim can
// still be queued on today's day index, and a snapshot executed early would
// leave late claims of that day without funds. Run it shortly after 00:00 UTC.
//
// Usage:
//   bun run ./scripts/daily-snapshot.ts            # send transactions
//   bun run ./scripts/daily-snapshot.ts --dry-run  # read only
//
// Env: SNAPSHOT_PRIVATE_KEY (preferred, a dedicated low-balance wallet) or
//      PRIVATE_KEY. Optional: RPC_URL, LOOKBACK_DAYS (default 14).

import { createPublicClient, createWalletClient, formatUnits, http, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from 'viem/chains'
import { PARTNERS } from '../src/data/partners'

const GM_CHECKIN: Address = '0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8'
const RPC_URL = process.env.RPC_URL ?? 'https://rpc.testnet.arc.io'
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS ?? 14)
const DRY_RUN = process.argv.includes('--dry-run')

const ABI = [
  { name: 'snapshotTotalClaimUsdc', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'snapshotExecuted', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'executeSnapshot', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'dayIndex', type: 'uint256' }], outputs: [] },
] as const

const targets: { name: string; address: Address }[] = [
  { name: 'GMCheckIn v3.1', address: GM_CHECKIN },
  ...PARTNERS.filter(p => p.contractAddress).map(p => ({ name: `Partner: ${p.name}`, address: p.contractAddress as Address })),
]

const keyRaw = process.env.SNAPSHOT_PRIVATE_KEY ?? process.env.PRIVATE_KEY
if (!keyRaw && !DRY_RUN) {
  console.error('Set SNAPSHOT_PRIVATE_KEY (or PRIVATE_KEY) to send transactions, or pass --dry-run.')
  process.exit(1)
}

const publicClient = createPublicClient({ chain: arcTestnet, transport: http(RPC_URL) })
const account = keyRaw ? privateKeyToAccount((keyRaw.startsWith('0x') ? keyRaw : `0x${keyRaw}`) as Hex) : null
const wallet = account ? createWalletClient({ account, chain: arcTestnet, transport: http(RPC_URL) }) : null

async function main() {
  const block = await publicClient.getBlock()
  const today = Math.floor(Number(block.timestamp) / 86_400)
  console.log(`UTC day index today: ${today} | mode: ${DRY_RUN ? 'dry run' : 'execute'} | targets: ${targets.length}`)

  if (account) {
    const bal = await publicClient.getBalance({ address: account.address })
    console.log(`Keeper ${account.address} balance: ${formatUnits(bal, 18)} (native USDC)`)
    if (bal < 10n ** 16n) console.warn('Low keeper balance: top it up with test USDC so gas does not run out.')
  }

  let executed = 0
  let failed = 0

  for (const t of targets) {
    const days = Array.from({ length: LOOKBACK_DAYS }, (_, i) => today - LOOKBACK_DAYS + i) // today-N .. today-1
    const state = await Promise.all(days.map(async day => {
      const [total, done] = await Promise.all([
        publicClient.readContract({ address: t.address, abi: ABI, functionName: 'snapshotTotalClaimUsdc', args: [BigInt(day)] }),
        publicClient.readContract({ address: t.address, abi: ABI, functionName: 'snapshotExecuted', args: [BigInt(day)] }),
      ])
      return { day, total, done }
    }))

    const pending = state.filter(s => s.total > 0n && !s.done)
    console.log(`${t.name}: ${pending.length} day(s) waiting`)

    for (const p of pending) {
      const label = `${t.name} day ${p.day} (${formatUnits(p.total, 6)} USDC queued)`
      if (DRY_RUN || !wallet) {
        console.log(`  would execute: ${label}`)
        continue
      }
      try {
        const { request } = await publicClient.simulateContract({
          account, address: t.address, abi: ABI, functionName: 'executeSnapshot', args: [BigInt(p.day)],
        })
        const hash = await wallet.writeContract(request)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error('reverted')
        executed += 1
        console.log(`  executed: ${label} tx ${hash}`)
      } catch (e) {
        failed += 1
        console.error(`  FAILED: ${label}: ${(e as Error).message.split('\n')[0]}`)
      }
    }
  }

  console.log(`Done. executed=${executed} failed=${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
