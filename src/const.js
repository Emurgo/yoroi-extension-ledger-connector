// @flow

declare var chrome;

import { CONNECTION_TYPE } from './types';

// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
export const HARDENED = 0x80000000;

export const CONNECTOR_URL = 'https://emurgo.github.io/yoroi-extension-ledger-connect/#/v3';
export const YOROI_LEDGER_CONNECT_TARGET_NAME = 'YOROI-LEDGER-CONNECT' + (
  chrome.runtime.id != null
    ? ('-' + chrome.runtime.id)
    : '' 
);


export const DEFAULT_CONNECTION_TYPE = CONNECTION_TYPE.WEB_AUTHN;
export const DEFAULT_LOCALE = 'en-US';