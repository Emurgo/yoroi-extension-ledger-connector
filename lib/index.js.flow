// @flow
declare var chrome;

import type {
  BIP32Path,
  InputTypeUTxO,
  OutputTypeAddress,
  OutputTypeChange,
  GetVersionResponse,
  DeriveAddressResponse,
  GetExtendedPublicKeyResponse,
  SignTransactionResponse
} from '@cardano-foundation/ledgerjs-hw-app-cardano';

// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const HARDENED = 0x80000000;
const PURPOSE = 44;
const COIN_TYPE = 1815; // Cardano

const CONNECTOR_URL = 'https://emurgo.github.io/yoroi-extension-ledger-connect';
export const YOROI_LEDGER_CONNECT_TARGET_NAME = 'YOROI-LEDGER-CONNECT';

export const ConnectionTypeValue = Object.freeze({
  WEB_AUTHN: 'webauthn',
  U2F: 'u2f',
  WEB_USB: 'webusb',
});
export type ConnectionType = $Values<typeof ConnectionTypeValue>;

const DEFAULT_CONNECTION_TYPE = ConnectionTypeValue.WEB_AUTHN;
const DEFAULT_LOCALE = 'en-US';

export type ExtendedPublicKeyResp = {
  ePublicKey: GetExtendedPublicKeyResponse,
  deviceVersion: GetVersionResponse
};
type MessageType = {
  target?: string,
  action: string,
  params: any
};
type Config = {
  connectorUrl?: string,
  connectionType?: ConnectionType,
  locale?: string
}
type FuncResp = ({ success: boolean, payload: any}) => void;

export class LedgerConnect {
  fullURL: string;
  connectionType: ConnectionType;
  browserPort: ?any; // $FlowIssue TODO fix type

  /**
   * Use `connectorUrl` to use this library with your own website
   * 
   * @param {*} config { connectorUrl?: string, connectionType?: ConnectionType, locale?: string }
   */
  constructor (config? : Config) {
    const connectorUrl = (config && config.connectorUrl) || CONNECTOR_URL;
    this.connectionType = (config && config.connectionType) || DEFAULT_CONNECTION_TYPE;
    const locale = (config && config.locale) || DEFAULT_LOCALE;
    this._setupTarget(connectorUrl, locale);
  }

  // ==============================
  //   Interface with Cardano app
  // ==============================

  getVersion = (): Promise<GetVersionResponse> => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-version',
        params: {
        },
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)))
        }
      });
    });
  };

  getExtendedPublicKey = (
    hdPath: BIP32Path
  ): Promise<ExtendedPublicKeyResp> => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-extended-public-key',
        params: {
          hdPath,
        },
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)))
        }
      })
    });
  };

  deriveAddress = (
    hdPath: BIP32Path
  ): Promise<DeriveAddressResponse> => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-derive-address',
        params: {
          hdPath,
        },
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)))
        }
      })
    });
  };

  showAddress = (
    hdPath: BIP32Path,
    address: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-show-address',
        params: {
          hdPath,
          address
        },
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)))
        }
      })
    });
  };

  signTransaction = (
    inputs: Array<InputTypeUTxO>,
    outputs: Array<OutputTypeAddress | OutputTypeChange>
  ): Promise<SignTransactionResponse> => {
    return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-sign-transaction',
          params: {
            inputs,
            outputs
          },
        },
        ({success, payload}) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(_prepareError(payload)))
          }
        })
    });
  };

  // ==============================
  //  Target Website Management
  // ==============================

  _setupTarget = (connectorUrl: string, locale: string): void => {
    switch(this.connectionType) {
      case ConnectionTypeValue.U2F:
      case ConnectionTypeValue.WEB_AUTHN:
      case ConnectionTypeValue.WEB_USB:
        const fullURL = _makeFullURL(connectorUrl, this.connectionType, locale);
        window.open(fullURL);

        chrome.runtime.onConnect.addListener(this._onWebPageConnected);
        break;
      default:
        throw new Error('[YLCH] Un-supported Transport protocol');
    }
  };

  isConnectorReady = (): boolean => {
    if (this.browserPort && this.browserPort.sender.tab.status) {
      return true;
    }
    return false;
  }

  _onWebPageConnected = (port: any): void => {
    if(port.name === YOROI_LEDGER_CONNECT_TARGET_NAME &&
      port.sender.id  === chrome.runtime.id &&
      port.sender.url === this.fullURL) {
      this.browserPort = port;
    }
  }

  _sendMessage = (
    msg: MessageType,
    cb: FuncResp
  ): void => {
    msg.target = YOROI_LEDGER_CONNECT_TARGET_NAME;
    console.debug(`[YLCH]::_sendMessage::${this.connectionType}::${msg.action}`);

    if(!this.browserPort) {
      throw new Error(`[YLCH]::browserPort is null::action: ${msg.action}`);
    }
    this.browserPort.postMessage(msg);

    // TODO: https://app.clubhouse.io/emurgo/story/1829/yoroi-extension-ledger-bridge-better-event-handling
    if(!this.browserPort || !this.browserPort.onMessage) {
      throw new Error(`[YLCH]::browserPort.onMessage is null::action: ${msg.action}`);
    }
    this.browserPort.onMessage.addListener(this._handleResponse.bind(this, msg, cb));

    if(!this.browserPort || !this.browserPort.onDisconnect) {
      throw new Error(`[YLCH]::browserPort.onDisconnect is null::action: ${msg.action}`);
    }
    this.browserPort.onDisconnect.addListener(this._onBrowserPortDisconnect.bind(this, cb));
  };

  _handleResponse = (
    req: MessageType,
    cb: FuncResp,
    resp: any,
  ): void => {
    console.debug(`[YLCH]::_handleResponse::${this.connectionType}::${req.action}::${resp.action}`);

    if (resp && resp.action === `${req.action}-reply`) {
      cb(resp);
    } else {
      console.debug(`[YLCH]::_handleResponse::${this.connectionType}::${req.action}::${resp.action}:: redundant handler`);
    }
  }

  _onBrowserPortDisconnect = (cb: FuncResp): void => {
    console.debug(`[YLCH]::_onBrowserPortDisconnect::browserPort is Disconnected!!!`);
    cb({
      success:false,
      payload: {
        error: 'Forcefully cancelled by user'
      }}
    );
  }

  dispose = (): void => {
    if(this.browserPort) {
      this.browserPort.disconnect();
    }
    this.browserPort = undefined;
  }
}

// ====================
//   Helper Functions
// ====================

/**
 * Makes target full URL like:
 * https://emurgo.github.io/yoroi-extension-ledger-connect/?transport=u2f&locale=ja-JP
 * 
 * @param {*} connectorUrl 
 * @param {*} connectionType 
 * @param {*} locale 
 */
function _makeFullURL(
  connectorUrl: string,
  connectionType: ConnectionType,
  locale: string
): string {
  const parms = {
    connectionType: (connectionType === DEFAULT_CONNECTION_TYPE)? '' : `transport=${connectionType}`,
    locale: (locale === DEFAULT_LOCALE)? '' : `locale=${locale}`
  }

  let fullURL = connectorUrl + (connectorUrl.endsWith('/')? '' : '/');

  let foundFirst = false;
  for (const prop in parms) {
    const value = parms[prop]
    // Check own property and escape empty values
    if (Object.prototype.hasOwnProperty.call(parms, prop) && value) {
      // choose to prepend ? or &
      if(!foundFirst) {
        foundFirst = true;
        fullURL = fullURL + `?${value}`;
      } else {
        fullURL = fullURL + `&${value}`;
      }
    }
  }

  return fullURL;
};

function _prepareError(payload): string {
  return (payload && payload.error)
    ? payload.error
    : 'SOMETHING_UNEXPECTED_HAPPENED';
}

/**
 * Get the Bip44 path required to specify an address
 *
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
 * Ledger (according to current security rules) denies any derivation path which does not start with
 *  `[HD+44, HD+1815, HD+(account), chain, address]`
 * 
 * @param {*} account account index eg: { 0 = first account , 1 = second account ...}
 * @param {*} chain 0 = external or 1 = change
 * @param {*} address address index eg: { 0 = first address , 1 = second address ...}
 */
export function makeCardanoBIP44Path (
  account: number,
  chain: number,
  address: number
): BIP32Path {
  return [
    HARDENED + PURPOSE,
    HARDENED + COIN_TYPE,
    HARDENED + account,
    chain,
    address
  ];
}

/**
 * Get the Bip44 path required to create an account
 *
 * See BIP44 for explanation
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
 * Ledger (according to current security rules) denies any derivation path which does not start with
 *  `[HD+44, HD+1815, HD+(account)]`
 */
export function makeCardanoAccountBIP44Path (
  account: number,
): BIP32Path {
  return [
    HARDENED + PURPOSE,
    HARDENED + COIN_TYPE,
    HARDENED + account
  ];
}

export function toDerivationPathString(derivationPath: BIP32Path): string {
  return `m/${derivationPath
    .map((item) => (item % HARDENED) + (item >= HARDENED ? "'" : ''))
    .join('/')}`
}
