// @flow //

import type {
  BIP32Path,
  TxInput,
  TxOutput,
  Certificate,
  Withdrawal,
  Flags,
  GetVersionResponse,
  GetSerialResponse,
  DeriveAddressResponse,
  GetExtendedPublicKeyResponse,
  Witness,
  SignTransactionResponse,
  Network,
  ShowAddressRequest,
} from '@cardano-foundation/ledgerjs-hw-app-cardano';

export type {
  BIP32Path,
  TxInput,
  TxOutput,
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
import { AddressType } from '@cardano-foundation/ledgerjs-hw-app-cardano';

export const CONNECTION_TYPE = Object.freeze({
  WEB_AUTHN: 'webauthn',
  U2F: 'u2f',
  WEB_USB: 'webusb',
});
export type ConnectionType = $Values<typeof CONNECTION_TYPE>;

/* Response Types */
export type ExtendedPublicKeyResp<Response> = {|
  response: Response,
  deviceVersion: GetVersionResponse,
  deriveSerial: GetSerialResponse,
|};

export type GetVersionRequest = void;
export type GetSerialRequest = void;
export type ShowAddressRequestWrapper = {|
  ...ShowAddressRequest,
  expectedAddr: string,
|};

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