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

# Supported Functions

## getExtendedPublicKey

Inputs
```
{
  serial: ?string,
  params: {
    path: BIP32Path
  },
}
```
Outputs
```
{
  deriveSerial: {
    serial: string
  },
  deviceVersion: {
    flags: Flags,
    major: string,
    minor: string,
    patch: string
  },
  response: {
    chainCodeHex: string,
    publicKeyHex: string
  }
}
```

## signTransaction

Inputs
```
{
  serial: ?string,
  params: {
    networkId: number,
    protocolMagic: number,
    inputs: Array<InputTypeUTxO>,
    outputs: Array<TxOutputTypeAddress | TxOutputTypeAddressParams>,
    feeStr: string,
    ttlStr: string,
    certificates: Array<Certificate>,
    withdrawals: Array<Withdrawal>,
    metadataHashHex: ?string
  },
}
```
Outputs
```
{
  txHashHex: string,
  witnesses: Array<Witness>
}
```

## showAddress

Inputs
```
{|
  serial: ?string,
  params: {
    address: string,
    addressTypeNibble: $Values<typeof AddressTypeNibbles>,
    networkIdOrProtocolMagic: number,
    spendingPath: BIP32Path,
    stakingPath: ?BIP32Path,
    stakingKeyHashHex: ?string,
    stakingBlockchainPointer: ?StakingBlockchainPointer
  },
|}
```
Outputs
```
undefined
```

## deriveAddress

Inputs
```
{
  serial: ?string,
  params: {
    addressTypeNibble: $Values<typeof AddressTypeNibbles>,
    networkIdOrProtocolMagic: number,
    spendingPath: BIP32Path,
    stakingPath: ?BIP32Path,
    stakingKeyHashHex: ?string,
    stakingBlockchainPointer: ?StakingBlockchainPointer,
  },
}
```
Outputs
```
{
  addressHex: string
}
```

## getVersion

Inputs
```
{
  serial: ?string,
  params: undefined,
}
```
Outputs
```
{
  flags: Flags,
  major: string,
  minor: string,
  patch: string
}
```

## getSerial

Inputs
```
{
  serial: ?string,
  params: undefined,
}
```
Outputs
```
{
  serial: string
}
```

# Example
**Import**
```
import LedgerConnect from 'yoroi-extension-ledger-connect-handler';
```
**Create new instance**
```

const ledgerConnect = new LedgerConnect(config);
```
`config` is type of: [Config](https://github.com/Emurgo/yoroi-extension-ledger-connect-handler/blob/c88151a718c660ef63bbbcd563de452a29861348/src/types.js#L43)

**Calling function**
```
const deviceVersionResp = await ledgerConnect.getVersion();
```

# Supported Ledger Transport
- [@ledgerhq/hw-transport-webauthn](https://www.npmjs.com/package/@ledgerhq/hw-transport-webauthn) [Default]
- [@ledgerhq/hw-transport-u2f](https://www.npmjs.com/package/@ledgerhq/hw-transport-u2f)
  - Has issues on `Windows 10 Version: >= 1903`. [Refer](https://github.com/Emurgo/yoroi-frontend/pull/696).
- [@ledgerhq/hw-transport-webusb](https://www.npmjs.com/package/@ledgerhq/hw-transport-webusb) [Incomplete]
  - Firefox does not supports [WebUSB](https://caniuse.com/#feat=webusb).
  - Needs `udev rules`(on Linux) or `drivers`(on Windows) to be pre-installed. [Refer](https://github.com/Emurgo/yoroi-frontend/pull/696) WebUSB section.

# <a name="building-up">Building up</a>
- `nvm i`
- `yarn`
- `yarn run build`

# Publishing
Make sure you have followed [Building up](#building-up) steps before publishing.
- `npm publish`
