// @flow //

import type {
  BIP32Path,
  InputTypeUTxO,
  OutputTypeAddress,
  OutputTypeAddressParams,
  StakingBlockchainPointer,
  Certificate,
  Withdrawal,
  Flags,
  GetVersionResponse,
  GetSerialResponse,
  DeriveAddressResponse,
  GetExtendedPublicKeyResponse,
  Witness,
  SignTransactionResponse,
} from '@cardano-foundation/ledgerjs-hw-app-cardano';

export type {
  BIP32Path,
  InputTypeUTxO,
  OutputTypeAddress,
  OutputTypeAddressParams,
  StakingBlockchainPointer,
  Certificate,
  Withdrawal,
  Flags,
  GetVersionResponse,
  GetSerialResponse,
  DeriveAddressResponse,
  GetExtendedPublicKeyResponse,
  Witness,
  SignTransactionResponse,
};
import { AddressTypeNibbles } from '@cardano-foundation/ledgerjs-hw-app-cardano';

export const CONNECTION_TYPE = Object.freeze({
  WEB_AUTHN: 'webauthn',
  U2F: 'u2f',
  WEB_USB: 'webusb',
});
export type ConnectionType = $Values<typeof CONNECTION_TYPE>;

/* Response Types */
export type ExtendedPublicKeyResp = {|
  response: GetExtendedPublicKeyResponse,
  deviceVersion: GetVersionResponse,
  deriveSerial: GetSerialResponse,
|};

export type GetVersionRequest = void;
export type GetSerialRequest = void;
export type GetExtendedPublicKeyRequest = {|
  path: BIP32Path
|};
export type DeriveAddressRequest = {|
  addressTypeNibble: $Values<typeof AddressTypeNibbles>,
  networkIdOrProtocolMagic: number,
  spendingPath: BIP32Path,
  stakingPath: ?BIP32Path,
  stakingKeyHashHex: ?string,
  stakingBlockchainPointer: ?StakingBlockchainPointer,
|};
export type ShowAddressRequest = {|
  addressTypeNibble: $Values<typeof AddressTypeNibbles>,
  networkIdOrProtocolMagic: number,
  spendingPath: BIP32Path,
  stakingPath: ?BIP32Path,
  stakingKeyHashHex: ?string,
  stakingBlockchainPointer: ?StakingBlockchainPointer
|};
export type SignTransactionRequest = {|
  networkId: number,
  protocolMagic: number,
  inputs: Array<InputTypeUTxO>,
  outputs: Array<OutputTypeAddress | OutputTypeAddressParams>,
  feeStr: string,
  ttlStr: string,
  certificates: Array<Certificate>,
  withdrawals: Array<Withdrawal>,
  metadataHashHex: ?string
|};

export type VerifyAddressInfoType = {|
  address: string,
  ...ShowAddressRequest,
|}

export type MessageType = {|
  serial?: ?string,
  target?: string,
  extension: ?string,
  action: string,
  params: any,
|};

export type Config = {
  connectorUrl?: string,
  connectionType?: ConnectionType,
  locale?: string,
  ...
};

export type FuncResp = ({| success: boolean, payload: any |}) => void;