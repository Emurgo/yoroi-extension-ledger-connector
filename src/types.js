// @flow //

import type {
  GetVersionResponse,
  DeriveAddressResponse,
  GetExtendedPublicKeyResponse,
  SignTransactionResponse
} from '@cardano-foundation/ledgerjs-hw-app-cardano';

export type {
  BIP32Path,
  InputTypeUTxO,
  OutputTypeAddress,
  OutputTypeChange,  
} from '@cardano-foundation/ledgerjs-hw-app-cardano';

export const CONNECTION_TYPE = Object.freeze({
  WEB_AUTHN: 'webauthn',
  U2F: 'u2f',
  WEB_USB: 'webusb',
});
export type ConnectionType = $Values<typeof CONNECTION_TYPE>;

export const DEVICE_CODE = Object.freeze({
  NONE: 'none',
  NANO_S: 's',
  NANO_X: 'x',
});
export type DeviceCodeType = $Values<typeof DEVICE_CODE>;

/* Response Types */
export type ExtendedPublicKeyResp = {
  ePublicKey: GetExtendedPublicKeyResponse,
  deviceVersion: GetVersionResponse,
  deviceCode: DeviceCodeType,
};
export type SignTxResp = {
  signedTx: SignTransactionResponse,
  deviceCode: DeviceCodeType,
};
export type ShowAddressResp = {
  showAddress: void,
  deviceCode: DeviceCodeType,
};
export type DeriveAddressResp = {
  derivedAddress: DeriveAddressResponse,
  deviceCode: DeviceCodeType,
};
export type DeviceVersionResp = {
  deviceVersion: GetVersionResponse,
  deviceCode: DeviceCodeType,
};

export type MessageType = {
  target?: string,
  action: string,
  params: any
};

export type Config = {
  connectorUrl?: string,
  connectionType?: ConnectionType,
  locale?: string
};

export type FuncResp = ({ success: boolean, payload: any}) => void;