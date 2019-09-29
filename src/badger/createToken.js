/*
  Create a new SLP token. Requires a wallet created with the create-wallet
  example. Also requires that wallet to have a small BCH balance.
*/

import SLPSDK from "slp-sdk";

// Set NETWORK to either testnet or mainnet
const NETWORK = process.env.NETWORK

// Used for debugging and investigating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// Instantiate SLP based on the network.
let SLP
if (NETWORK === `mainnet`)
  SLP = new SLPSDK({ restURL: `https://rest.bitcoin.com/v2/` })
else SLP = new SLPSDK({ restURL: `https://trest.bitcoin.com/v2/` })

export async function createToken(walletInfo, { tokenName, tokenSymbol, qty }) {
  try {
    const mnemonic = walletInfo.mnemonic

    // root seed buffer
    const rootSeed = SLP.Mnemonic.toSeed(mnemonic)
    // master HDNode
    let masterHDNode
    if (NETWORK === `mainnet`) masterHDNode = SLP.HDNode.fromSeed(rootSeed)
    else masterHDNode = SLP.HDNode.fromSeed(rootSeed, "testnet") // Testnet

    // HDNode of BIP44 account
    const account = SLP.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")

    const change = SLP.HDNode.derivePath(account, "0/0")

    // get the cash address and get some tBCH form our faucet https://developer.bitcoin.com/faucets/bch/
    const cashAddress = SLP.HDNode.toCashAddress(change)
    const slpAddress = SLP.Address.toSLPAddress(cashAddress)

    const fundingAddress = slpAddress
    const fundingWif = SLP.HDNode.toWIF(change) // <-- compressed WIF format
    const tokenReceiverAddress = slpAddress
    const batonReceiverAddress = slpAddress
    const bchChangeReceiverAddress = cashAddress

    // Create a config object defining the token to be created.
    const createConfig = {
      fundingAddress,
      fundingWif,
      tokenReceiverAddress,
      batonReceiverAddress,
      bchChangeReceiverAddress,
      decimals: 0,
      name: tokenName,
      symbol: tokenSymbol,
      documentUri: "developer.bitcoin.com",
      documentHash: null,
      initialTokenQty: qty
    }

    // Generate, sign, and broadcast a hex-encoded transaction for creating
    // the new token.
    const genesisTxId = await SLP.TokenType1.create(createConfig)

    console.log(`genesisTxID: ${util.inspect(genesisTxId)}`)
    console.log(
      `The genesis TxID above is used to uniquely identify your new class of SLP token. Save it and keep it handy.`
    )
    console.log(`View this transaction on the block explorer:`)
    if (NETWORK === `mainnet`)
      console.log(`https://explorer.bitcoin.com/bch/tx/${genesisTxId}`)
    else console.log(`https://explorer.bitcoin.com/tbch/tx/${genesisTxId}`)

    return genesisTxId;
  } catch (err) {
    console.error(`Error in createToken: `, err)
    console.log(`Error message: ${err.message}`)
    throw err;
  }
}