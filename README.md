# yoroi-extension-ledger-connect-handler
This library enables Yoroi extension to communicate with Ledger device, in process this library needs one web page that directly communicates with Ledger device.
This library is responsible for opening, sendind resquest, passing back response to Yoroi and closing the target web page.

# Message Passing
![ledger-content-script](https://user-images.githubusercontent.com/19986226/66384568-f77fff00-e9f9-11e9-9d1d-dfe4b8afc5fc.png)

**Flow:**
1. `Yoroi` requests `yoroi-extension-ledger-connect-handler`(Using function call).
2. `yoroi-extension-ledger-connect-handler` opens target Website.
3. `yoroi-extension-ledger-connect-handler` sends request message to `content-script`(Using extension port).
4. `content-script` passes request to the target Website app(Using `postMessage()`).
5. Target Website app processes the request and send response to `content-script`(Using `postMessage()`).
6. `content-script` passes response to `yoroi-extension-ledger-connect-handler`(Using extension port).
7. Finally, `yoroi-extension-ledger-connect-handler` passes response to `Yoroi`(Using function return).

# Supported Function
- [getExtendedPublicKey](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/a130d213ce4bfbb4f51e90d44345d2c32aab825b/src/ledgerConnect.js#L56) = (hdPath: BIP32Path): Promise\<ExtendedPublicKeyResp\>

  params:
  - hdPath: [BIP32Path](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L38)<br>
  HARDENED = 0x80000000;<br>
  PURPOSE = 44;<br>
  COIN_TYPE = 1815; // Cardano<br><br>
  BIP32Path = [<br>
    HARDENED + PURPOSE,<br>
    HARDENED + COIN_TYPE,<br>
    HARDENED + account,<br>
    chain,<br>
    address<br>
  ]

  returns:
  - [ExtendedPublicKeyResp](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/a130d213ce4bfbb4f51e90d44345d2c32aab825b/src/types.js#L39)<br>
  type ExtendedPublicKeyResp = {
    ePublicKey: [GetExtendedPublicKeyResponse](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L71),
    deviceVersion: [GetVersionResponse](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L60),
  }

- [signTransaction](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/a130d213ce4bfbb4f51e90d44345d2c32aab825b/src/ledgerConnect.js#L96) = (inputs: Array\<InputTypeUTxO>, outputs: Array<OutputTypeAddress | OutputTypeChange\>): Promise\<SignTransactionResponse\>

  params:
  - inputs: Array<[InputTypeUTxO](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L40)>
  - outputs: Array<[OutputTypeAddress](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L46) | [OutputTypeChange](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L51)>

  returns:
  - [SignTransactionResponse](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L84)

- [showAddress](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/3c14ffe02e0ba11740b8103d5e20b7cabbbe88db/src/ledgerConnect.js#L95) = (hdPath: BIP32Path, address: string): Promise\<void\>

  params:
  - hdPath: [BIP32Path](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L38)
  - address: string

  returns:
  - `void`  

- [deriveAddress](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/a130d213ce4bfbb4f51e90d44345d2c32aab825b/src/ledgerConnect.js#L115) = (hdPath: BIP32Path): Promise\<DeriveAddressResponse\>

  params:
  - hdPath: [BIP32Path](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L38)

  returns:
  - [DeriveAddressResponse](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L67)

- [getVersion](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/3c14ffe02e0ba11740b8103d5e20b7cabbbe88db/src/ledgerConnect.js#L132) = (): Promise\<GetVersionResponse\>

  params:
  - `void`

  returns:
  - [GetVersionResponse](https://github.com/cardano-foundation/ledgerjs-hw-app-cardano/blob/ac3ee1345506ab343a7159ebbcec8e616f8ac5d9/src/Ada.js#L60)

# Supported Ledger Transport
- [@ledgerhq/hw-transport-webauthn](https://www.npmjs.com/package/@ledgerhq/hw-transport-webauthn)
- [@ledgerhq/hw-transport-u2f](https://www.npmjs.com/package/@ledgerhq/hw-transport-u2f)
  - Has issues on `Windows 10 Version: >= 1903`. [Refer](https://github.com/Emurgo/yoroi-frontend/pull/696).
- [@ledgerhq/hw-transport-webusb](https://www.npmjs.com/package/@ledgerhq/hw-transport-webusb) [Incomplete]
  - Firefox does not supports [WebUSB](https://caniuse.com/#feat=webusb).
  - Needs `udev rules`(on Linux) or `drivers`(on Windows) to be pre-installed. [Refer](https://github.com/Emurgo/yoroi-frontend/pull/696) WebUSB section.

# Building up
- `nvm i`
- `yarn`
- `yarn run build`

# Publishing
[TBD]