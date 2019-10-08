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
  targetWindow: ?any; // $FlowIssue TODO fix type
  extensionPort: ?any; // $FlowIssue TODO fix type
  extensionTabId: number;

  /**
   * Use `connectorUrl` to use this library with your own website
   * 
   * @param {*} config { connectorUrl?: string, connectionType?: ConnectionType, locale?: string }
   */
  constructor (config? : Config) {
    this.connectionType = (config && config.connectionType) || DEFAULT_CONNECTION_TYPE;
    const connectorUrl = (config && config.connectorUrl) || CONNECTOR_URL;
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

  /**
   * Prepares and opens target WebSite
   * 
   * @param {*} connectorUrl: string
   * @param {*} locale      : string
   * @returns void
   */
  _setupTarget = (
    connectorUrl: string,
    locale: string
  ): void => {
    switch(this.connectionType) {
      case ConnectionTypeValue.U2F:
      case ConnectionTypeValue.WEB_AUTHN:
      case ConnectionTypeValue.WEB_USB:
        this.fullURL = _makeFullURL(connectorUrl, this.connectionType, locale);
        this._openTarget();
        break;
      default:
        throw new Error('[YLCH] Un-supported Transport protocol');
    }
  };

  /**
   * Opens target WebSite
   * 
   * @returns void
   */
  _openTarget = (): void => {
    if (!this.fullURL) {
      throw new Error(`[YLCH] Not a valid target URL: ${this.fullURL}`);
    }

    chrome.tabs.query({
      currentWindow: true,
      active: true,
    }, (tabs) => {
      const curTab = tabs[0];
      if (!curTab) {
        throw new Error(`[YLCH] Something wrong with browser tabs`);
      }
      this.extensionTabId = curTab.id;
      console.debug(`[YLCH] Opening: ${this.fullURL}`);

      // Opening new tab, right next to the Yoroi Extension
      chrome.tabs.create({
          url: this.fullURL,
          index: curTab.index + 1,
      }, tab => {
        this.targetWindow = tab;
        chrome.runtime.onConnect.addListener(this._onWebPageConnected);
      });
    });
  }

  /**
   * If extension port exists that means we are connected with the target WebSite
   * @returns boolean
   */
  isConnectorReady = (): boolean => {
    return this.extensionPort != null;
  };

  /**
   * Stores extension port of target WebPage
   * @param {*} port: any
   * @returns void
   */
  _onWebPageConnected = (
    port: any
  ): void => {
    if(port.name === YOROI_LEDGER_CONNECT_TARGET_NAME &&
      port.sender.id  === chrome.runtime.id &&
      port.sender.url === this.fullURL) {
      this.extensionPort = port;
    }
  };

  /**
   * Sends request to the target WebSite
   * TODO: https://app.clubhouse.io/emurgo/story/1829/yoroi-extension-ledger-bridge-better-event-handling
   * 
   * @param {*} msg: MessageType
   * @param {*} cb : FuncResp
   * @returns void
   */
  _sendMessage = (
    msg: MessageType,
    cb: FuncResp
  ): void => {
    msg.target = YOROI_LEDGER_CONNECT_TARGET_NAME;
    console.debug(`[YLCH]::_sendMessage::${this.connectionType}::${msg.action}`);

    if(!this.extensionPort) {
      throw new Error(`[YLCH]::extensionPort is null::action: ${msg.action}`);
    }
    this.extensionPort.postMessage(msg);

    if(!this.extensionPort || !this.extensionPort.onMessage) {
      throw new Error(`[YLCH]::extensionPort.onMessage is null::action: ${msg.action}`);
    }
    this.extensionPort.onMessage.addListener(this._handleResponse.bind(this, msg, cb));

    if(!this.extensionPort || !this.extensionPort.onDisconnect) {
      throw new Error(`[YLCH]::extensionPort.onDisconnect is null::action: ${msg.action}`);
    }
    this.extensionPort.onDisconnect.addListener(this._onextensionPortDisconnect.bind(this, cb));
  };

  /**
   * Handles response from WebSite, besically passes result back to Yoroi
   * 
   * @param {*} req : MessageType
   * @param {*} cb  : FuncResp
   * @param {*} resp: any
   * @returns void
   */
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
  };

  /**
   * If Website is closed forcefully then error will be thrown back to Yoroi
   * 
   * @param {*} cb: FuncResp
   * @returns void
   */
  _onextensionPortDisconnect = (cb: FuncResp): void => {
    console.debug(`[YLCH]::_onextensionPortDisconnect::extensionPort is Disconnected!!!`);
    cb({
      success:false,
      payload: {
        error: 'Forcefully cancelled by user'
      }}
    );
  };

  /**
   * This method must be called after success or failure,
   * this.extensionPort.disconnect() will close the target WebSite
   * @returns void
   */
  dispose = (): void => {
    if (this.extensionTabId) {
      chrome.tabs.update(this.extensionTabId, {
        active: true
      });
      this.extensionTabId = 0;
      console.debug('[YLCH] Made Yoroi Extension active');
    }

    if (this.targetWindow) {
      chrome.tabs.remove(this.targetWindow.id);
      this.targetWindow = undefined
      console.debug('[YLCH] closed target window');
    }    

    if(this.extensionPort) {
      this.extensionPort.disconnect();
      this.extensionPort = undefined;
      console.debug('[YLCH] disconnected extension port');
    }
  };
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
 * @returns string
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

/**
 * Restructures error object from payload
 * 
 * @param {*} payload 
 * @returns string
 */
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
 * @returns BIP32Path
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
 * 
 * @param {*} account
 * @returns BIP32Path
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

/**
 * Converts BIP32Path to string version (like m/44'/1815'/0'/0/0)
 * 
 * @param {*} derivationPath 
 * @returns string
 */
export function toDerivationPathString(derivationPath: BIP32Path): string {
  return `m/${derivationPath
    .map((item) => (item % HARDENED) + (item >= HARDENED ? "'" : ''))
    .join('/')}`
}
