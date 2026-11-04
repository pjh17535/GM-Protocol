// One-off testnet repair: move the 5B gARC liquidity share out of GMPool v2 and
// re-seed the USDC/gARC pair at the intended price (38.56 USDC : 5,000,000,000 gARC).
//
// Usage:
//   bun run ./scripts/fix-lp.ts            # read-only dry run, prints state and plan
//   bun run ./scripts/fix-lp.ts --execute  # sends transactions
//
// Reads PRIVATE_KEY from .env (never printed). Arc Testnet only.
import { createPublicClient, createWalletClient, http, parseAbi, formatUnits, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from 'viem/chains'

const EXECUTE = process.argv.includes('--execute')

const POOL: Address    = '0xC3832c0169C1602D581cC6816414Ad05A855e713'
const CHECKIN: Address = '0xDb04Dd85fDbcE5b76d63230264475Fcb07c316A8'
const PAIR: Address    = '0xc0e9695ab4e41f4477074845046b3d152c4c8958'
const ROUTER: Address  = '0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9'
const USDC: Address    = '0x3600000000000000000000000000000000000000'
const GARC: Address    = '0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc'
const DEPLOYER: Address = '0xe5096Af190d36CBc4363699D561EE651C07c276a'

const LP_GARC  = 5_000_000_000n * 10n ** 18n  // 5B gARC
const LP_USDC  = 38_560_000n                  // 38.56 USDC (6 decimals)

const poolAbi = parseAbi([
  'function owner() view returns (address)',
  'function checkinContract() view returns (address)',
  'function gArcClaimBalance() view returns (uint256)',
  'function setCheckinContract(address)',
  'function withdrawGArc(uint256 amount, address to)',
])
const erc20Abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function approve(address,uint256) returns (bool)',
])
const pairAbi = parseAbi([
  'function getReserves() view returns (uint112,uint112,uint32)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function mint(address to) returns (uint256)',
])
const routerAbi = parseAbi([
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256, uint256)',
])

const pk = process.env.PRIVATE_KEY as Hex | undefined
if (!pk) throw new Error('PRIVATE_KEY missing in .env')
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : (`0x${pk}` as Hex))
if (account.address.toLowerCase() !== DEPLOYER.toLowerCase()) {
  throw new Error(`PRIVATE_KEY is not the deployer wallet (got ${account.address})`)
}

const transport = http('https://rpc.testnet.arc.io')
const pub = createPublicClient({ chain: arcTestnet, transport })
const wallet = createWalletClient({ account, chain: arcTestnet, transport })

const f6 = (v: bigint) => formatUnits(v, 6)
const f18 = (v: bigint) => formatUnits(v, 18)

async function state(label: string) {
  const [owner, cc, claim, [r0, r1], supply, lpBal, dGarc, dUsdc] = await Promise.all([
    pub.readContract({ address: POOL, abi: poolAbi, functionName: 'owner' }),
    pub.readContract({ address: POOL, abi: poolAbi, functionName: 'checkinContract' }),
    pub.readContract({ address: POOL, abi: poolAbi, functionName: 'gArcClaimBalance' }),
    pub.readContract({ address: PAIR, abi: pairAbi, functionName: 'getReserves' }).then(r => [r[0], r[1]] as const),
    pub.readContract({ address: PAIR, abi: pairAbi, functionName: 'totalSupply' }),
    pub.readContract({ address: PAIR, abi: pairAbi, functionName: 'balanceOf', args: [DEPLOYER] }),
    pub.readContract({ address: GARC, abi: erc20Abi, functionName: 'balanceOf', args: [DEPLOYER] }),
    pub.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [DEPLOYER] }),
  ])
  console.log(`\n== ${label}`)
  console.log(' GMPool owner        :', owner)
  console.log(' GMPool checkin addr :', cc)
  console.log(' GMPool gARC claim   :', f18(claim))
  console.log(' Pair reserves       :', f6(r0), 'USDC /', f18(r1), 'gARC (raw', r0.toString(), r1.toString() + ')')
  console.log(' Pair LP supply      :', supply.toString(), '| deployer LP:', lpBal.toString())
  console.log(' Deployer balances   :', f6(dUsdc), 'USDC /', f18(dGarc), 'gARC')
  return { owner, cc, claim, r0, r1, supply, lpBal, dGarc, dUsdc }
}

async function send(label: string, p: Parameters<typeof wallet.writeContract>[0]) {
  const hash = await wallet.writeContract(p)
  const rc = await pub.waitForTransactionReceipt({ hash })
  console.log(` ${rc.status === 'success' ? 'OK ' : 'FAIL'} ${label}  ${hash}`)
  if (rc.status !== 'success') throw new Error(`${label} reverted`)
  return hash
}

const s0 = await state('BEFORE')

if (s0.owner.toLowerCase() !== DEPLOYER.toLowerCase()) throw new Error('Deployer is not GMPool owner')
if (s0.cc.toLowerCase() !== CHECKIN.toLowerCase()) throw new Error('GMPool checkinContract is not the expected GMCheckIn v3.1')
if (s0.claim < LP_GARC) throw new Error('GMPool has less than 5B gARC claim balance')

console.log('\nPlan:')
console.log(' 1. GMPool.setCheckinContract(deployer)')
console.log(' 2. GMPool.withdrawGArc(5,000,000,000 gARC -> deployer)')
console.log(' 3. GMPool.setCheckinContract(GMCheckIn v3.1)   (restored immediately)')
console.log(' 4. Router.removeLiquidity(all LP) -> pair back to dust')
console.log(' 5. transfer 38.56 USDC + 5B gARC to pair, then pair.mint(deployer)')
console.log(' 6. verify reserves = 38.56 USDC : 5B gARC')

if (!EXECUTE) {
  console.log('\nDry run only. Re-run with --execute to send transactions.')
  process.exit(0)
}

// ── Steps 1-3: withdraw 5B gARC, always restore checkinContract ───────────────
let withdrawn = false
try {
  await send('1 setCheckinContract(deployer)', { address: POOL, abi: poolAbi, functionName: 'setCheckinContract', args: [DEPLOYER] })
  await send('2 withdrawGArc(5B)', { address: POOL, abi: poolAbi, functionName: 'withdrawGArc', args: [LP_GARC, DEPLOYER] })
  withdrawn = true
} finally {
  await send('3 setCheckinContract(GMCheckIn v3.1)', { address: POOL, abi: poolAbi, functionName: 'setCheckinContract', args: [CHECKIN] })
}
if (!withdrawn) throw new Error('withdraw did not complete')

const afterWithdraw = await state('AFTER WITHDRAW')
if (afterWithdraw.cc.toLowerCase() !== CHECKIN.toLowerCase()) throw new Error('checkinContract was not restored')
if (afterWithdraw.dGarc < LP_GARC) throw new Error('deployer did not receive 5B gARC')

// ── Step 4: remove the mispriced liquidity ────────────────────────────────────
if (afterWithdraw.lpBal > 0n) {
  await send('4a approve LP to router', { address: PAIR, abi: pairAbi, functionName: 'approve', args: [ROUTER, afterWithdraw.lpBal] })
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)
  await send('4b removeLiquidity', { address: ROUTER, abi: routerAbi, functionName: 'removeLiquidity', args: [USDC, GARC, afterWithdraw.lpBal, 0n, 0n, DEPLOYER, deadline] })
}
const dust = await state('AFTER REMOVE')
if (dust.supply > 10_000n) throw new Error(`pair LP supply ${dust.supply} is not dust, aborting before seeding`)
if (dust.dUsdc < LP_USDC) throw new Error('deployer has less than 38.56 USDC')
if (dust.dGarc < LP_GARC) throw new Error('deployer has less than 5B gARC')

// ── Step 5: seed directly into the pair, bypassing the router ratio logic ─────
await send('5a transfer gARC to pair', { address: GARC, abi: erc20Abi, functionName: 'transfer', args: [PAIR, LP_GARC] })
await send('5b transfer USDC to pair', { address: USDC, abi: erc20Abi, functionName: 'transfer', args: [PAIR, LP_USDC] })
await send('5c pair.mint(deployer)', { address: PAIR, abi: pairAbi, functionName: 'mint', args: [DEPLOYER] })

const end = await state('AFTER SEED')
const ok = end.r1 >= LP_GARC && end.r0 >= LP_USDC && end.r0 < LP_USDC + 10n
console.log(ok ? '\nVERIFIED: pair is 38.56 USDC : 5,000,000,000 gARC' : '\nWARNING: pair reserves differ from the target, check manually')
if (!ok) process.exit(1)
