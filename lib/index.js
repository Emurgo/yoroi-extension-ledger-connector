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
  WEB_USB: 'webusb'
});
const DEFAULT_CONNECTION_TYPE = ConnectionTypeValue.WEB_AUTHN;
const DEFAULT_LOCALE = 'en-US';
export class LedgerConnect {
  // $FlowIssue TODO fix type

  /**
   * Use `connectorUrl` to use this library with your own website
   * 
   * @param {*} config { connectorUrl?: string, connectionType?: ConnectionType, locale?: string }
   */
  constructor(config) {
    this.fullURL = void 0;
    this.connectionType = void 0;
    this.browserPort = void 0;

    this.getVersion = () => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-get-version',
          params: {}
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(_prepareError(payload)));
          }
        });
      });
    };

    this.getExtendedPublicKey = hdPath => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-get-extended-public-key',
          params: {
            hdPath
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(_prepareError(payload)));
          }
        });
      });
    };

    this.deriveAddress = hdPath => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-derive-address',
          params: {
            hdPath
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(_prepareError(payload)));
          }
        });
      });
    };

    this.showAddress = (hdPath, address) => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-show-address',
          params: {
            hdPath,
            address
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(_prepareError(payload)));
          }
        });
      });
    };

    this.signTransaction = (inputs, outputs) => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-sign-transaction',
          params: {
            inputs,
            outputs
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(_prepareError(payload)));
          }
        });
      });
    };

    this._setupTarget = (connectorUrl, locale) => {
      switch (this.connectionType) {
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

    this.isConnectorReady = () => {
      if (this.browserPort && this.browserPort.sender.tab.status) {
        return true;
      }

      return false;
    };

    this._onWebPageConnected = port => {
      if (port.name === YOROI_LEDGER_CONNECT_TARGET_NAME && port.sender.id === chrome.runtime.id && port.sender.url === this.fullURL) {
        this.browserPort = port;
      }
    };

    this._sendMessage = (msg, cb) => {
      msg.target = YOROI_LEDGER_CONNECT_TARGET_NAME;
      console.debug(`[YLCH]::_sendMessage::${this.connectionType}::${msg.action}`);

      if (!this.browserPort) {
        throw new Error(`[YLCH]::browserPort is null::action: ${msg.action}`);
      }

      this.browserPort.postMessage(msg); // TODO: https://app.clubhouse.io/emurgo/story/1829/yoroi-extension-ledger-bridge-better-event-handling

      if (!this.browserPort || !this.browserPort.onMessage) {
        throw new Error(`[YLCH]::browserPort.onMessage is null::action: ${msg.action}`);
      }

      this.browserPort.onMessage.addListener(this._handleResponse.bind(this, msg, cb));

      if (!this.browserPort || !this.browserPort.onDisconnect) {
        throw new Error(`[YLCH]::browserPort.onDisconnect is null::action: ${msg.action}`);
      }

      this.browserPort.onDisconnect.addListener(this._onBrowserPortDisconnect.bind(this, cb));
    };

    this._handleResponse = (req, cb, resp) => {
      console.debug(`[YLCH]::_handleResponse::${this.connectionType}::${req.action}::${resp.action}`);

      if (resp && resp.action === `${req.action}-reply`) {
        cb(resp);
      } else {
        console.debug(`[YLCH]::_handleResponse::${this.connectionType}::${req.action}::${resp.action}:: redundant handler`);
      }
    };

    this._onBrowserPortDisconnect = cb => {
      console.debug(`[YLCH]::_onBrowserPortDisconnect::browserPort is Disconnected!!!`);
      cb({
        success: false,
        payload: {
          error: 'Forcefully cancelled by user'
        }
      });
    };

    this.dispose = () => {
      if (this.browserPort) {
        this.browserPort.disconnect();
      }

      this.browserPort = undefined;
    };

    const _connectorUrl = config && config.connectorUrl || CONNECTOR_URL;

    this.connectionType = config && config.connectionType || DEFAULT_CONNECTION_TYPE;

    const _locale = config && config.locale || DEFAULT_LOCALE;

    this._setupTarget(_connectorUrl, _locale);
  } // ==============================
  //   Interface with Cardano app
  // ==============================


} // ====================
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

function _makeFullURL(connectorUrl, connectionType, locale) {
  const parms = {
    connectionType: connectionType === DEFAULT_CONNECTION_TYPE ? '' : `transport=${connectionType}`,
    locale: locale === DEFAULT_LOCALE ? '' : `locale=${locale}`
  };
  let fullURL = connectorUrl + (connectorUrl.endsWith('/') ? '' : '/');
  let foundFirst = false;

  for (const prop in parms) {
    const value = parms[prop]; // Check own property and escape empty values

    if (Object.prototype.hasOwnProperty.call(parms, prop) && value) {
      // choose to prepend ? or &
      if (!foundFirst) {
        foundFirst = true;
        fullURL = fullURL + `?${value}`;
      } else {
        fullURL = fullURL + `&${value}`;
      }
    }
  }

  return fullURL;
}

;

function _prepareError(payload) {
  return payload && payload.error ? payload.error : 'SOMETHING_UNEXPECTED_HAPPENED';
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


export function makeCardanoBIP44Path(account, chain, address) {
  return [HARDENED + PURPOSE, HARDENED + COIN_TYPE, HARDENED + account, chain, address];
}
/**
 * Get the Bip44 path required to create an account
 *
 * See BIP44 for explanation
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
 * Ledger (according to current security rules) denies any derivation path which does not start with
 *  `[HD+44, HD+1815, HD+(account)]`
 */

export function makeCardanoAccountBIP44Path(account) {
  return [HARDENED + PURPOSE, HARDENED + COIN_TYPE, HARDENED + account];
}
export function toDerivationPathString(derivationPath) {
  return `m/${derivationPath.map(item => item % HARDENED + (item >= HARDENED ? "'" : '')).join('/')}`;
}