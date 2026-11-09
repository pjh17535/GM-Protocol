// Deploys GMBuyback v2, GMCheckIn v3.2 and a new GMPartner test instance, then rewires GMPool,
// GMSoulBound and the buyback authorisation. Dry run by default; pass --execute to send.
// Reads PRIVATE_KEY from .env (never printed). Arc Testnet only.
import { readFileSync } from 'node:fs'
import { createPublicClient, createWalletClient, http, parseAbi, type Abi, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from 'viem/chains'

const EXECUTE = process.argv.includes('--execute')
const POOL: Address = '0xC3832c0169C1602D581cC6816414Ad05A855e713'
const SBT: Address = '0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2'
const PAIR: Address = '0xc0e9695ab4e41f4477074845046b3d152c4c8958'
const OPERATOR: Address = '0x1697acD9b8B212705d4cDba6706F38DEd5A5FFc9'
const SITE = 'https://marvelous-lebkuchen-e5523d.netlify.app'

const raw = process.env.PRIVATE_KEY
if (!raw) throw new Error('PRIVATE_KEY missing in .env')
const account = privateKeyToAccount((raw.startsWith('0x') ? raw : `0x${raw}`) as Hex)
const pub = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.io', { retryCount: 5, retryDelay: 1000 }) })
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http('https://rpc.testnet.arc.io', { retryCount: 5, retryDelay: 1000 }) })

const art = (n: string) => JSON.parse(readFileSync(`contracts/out/${n}.sol/${n}.json`, 'utf8')) as { abi: Abi; bytecode: { object: Hex } }
const poolAbi = parseAbi(['function owner() view returns (address)', 'function checkinContract() view returns (address)', 'function buybackContract() view returns (address)', 'function setCheckinContract(address)', 'function setBuybackContract(address)'])
const sbtAbi = parseAbi(['function owner() view returns (address)', 'function minter() view returns (address)', 'function setMinter(address)'])
const buyAbi = parseAbi(['function setAuthorizedCaller(address,bool)', 'function authorizedCallers(address) view returns (bool)'])
const chkAbi = parseAbi(['function setSoulBoundContract(address)', 'function setPartnerRegistered(address,bool)', 'function registeredPartners(address) view returns (bool)', 'function soulBoundContract() view returns (address)', 'function lpPair() view returns (address)'])

async function send(label: string, p: Promise<Hex>) {
  const h = await p
  const r = await pub.waitForTransactionReceipt({ hash: h })
  if (r.status !== 'success') throw new Error(`${label} failed: ${h}`)
  console.log(`ok  ${label}  ${h}`)
  return r
}
async function deploy(name: string, args: unknown[]) {
  const a = art(name)
  const r = await send(`deploy ${name}`, wallet.deployContract({ abi: a.abi, bytecode: a.bytecode.object, args }))
  if (!r.contractAddress) throw new Error(`${name}: no address`)
  console.log(`    ${name} = ${r.contractAddress}`)
  return r.contractAddress
}

const tryRead = async (address: Address, abi: Abi, functionName: string) => {
  try { return String(await pub.readContract({ address, abi, functionName })) } catch { return '(unreadable)' }
}

console.log('deployer', account.address, EXECUTE ? '(EXECUTE)' : '(dry run)')
console.log('pool owner      ', await tryRead(POOL, poolAbi, 'owner'))
console.log('pool checkin    ', await tryRead(POOL, poolAbi, 'checkinContract'))
console.log('pool buyback    ', await tryRead(POOL, poolAbi, 'buybackContract'))
console.log('sbt owner       ', await tryRead(SBT, sbtAbi, 'owner'))
console.log('sbt minter      ', await tryRead(SBT, sbtAbi, 'minter'))
for (const n of ['GMBuyback', 'GMCheckIn', 'GMPartner']) console.log('artifact', n, art(n).bytecode.object.length > 100 ? 'ok' : 'EMPTY')
if ((await tryRead(POOL, poolAbi, 'owner')).toLowerCase() !== account.address.toLowerCase()) throw new Error('deployer is not pool owner')
if (!EXECUTE) { console.log('dry run complete. Re-run with --execute to send transactions.'); process.exit(0) }

const buyback = await deploy('GMBuyback', [account.address])
const checkin = await deploy('GMCheckIn', [account.address, POOL, buyback, PAIR])
await send('buyback.setAuthorizedCaller(checkin)', wallet.writeContract({ address: buyback, abi: buyAbi, functionName: 'setAuthorizedCaller', args: [checkin, true] }))
await send('checkin.setSoulBoundContract', wallet.writeContract({ address: checkin, abi: chkAbi, functionName: 'setSoulBoundContract', args: [SBT] }))
await send('pool.setCheckinContract', wallet.writeContract({ address: POOL, abi: poolAbi, functionName: 'setCheckinContract', args: [checkin] }))
await send('pool.setBuybackContract', wallet.writeContract({ address: POOL, abi: poolAbi, functionName: 'setBuybackContract', args: [buyback] }))
await send('sbt.setMinter', wallet.writeContract({ address: SBT, abi: sbtAbi, functionName: 'setMinter', args: [checkin] }))
const partner = await deploy('GMPartner', [account.address, OPERATOR, checkin, buyback, POOL, 'GM Protocol test', SITE, 2, [7n, 14n, 0n, 0n], true])
await send('checkin.setPartnerRegistered(partner)', wallet.writeContract({ address: checkin, abi: chkAbi, functionName: 'setPartnerRegistered', args: [partner, true] }))

console.log('--- verify ---')
console.log('pool.checkinContract ', await tryRead(POOL, poolAbi, 'checkinContract'))
console.log('pool.buybackContract ', await tryRead(POOL, poolAbi, 'buybackContract'))
console.log('sbt.minter           ', await tryRead(SBT, sbtAbi, 'minter'))
console.log('checkin.soulBound    ', await tryRead(checkin, chkAbi, 'soulBoundContract'))
console.log('checkin.lpPair       ', await tryRead(checkin, chkAbi, 'lpPair'))
const authd = await pub.readContract({ address: buyback, abi: buyAbi, functionName: 'authorizedCallers', args: [checkin] })
const reg = await pub.readContract({ address: checkin, abi: chkAbi, functionName: 'registeredPartners', args: [partner] })
console.log('buyback authorises checkin:', authd, '| partner registered:', reg)
console.log(JSON.stringify({ GMBuyback: buyback, GMCheckIn: checkin, GMPartner: partner }, null, 2))
