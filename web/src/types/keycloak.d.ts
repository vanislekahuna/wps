/*
 * MIT License
 *
 * Copyright 2017 Brett Epps <https://github.com/eppsilon>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Keycloak Type Definition copied from keycloak-js@8.0.0
 */

export as namespace Keycloak

export = Keycloak

/**
 * Creates a new Keycloak client instance.
 * @param config A configuration object or path to a JSON config file.
 */
declare function Keycloak<TPromise extends Keycloak.KeycloakPromiseType = 'legacy'>(
  config?: Keycloak.KeycloakConfig | string
): Keycloak.KeycloakInstance<TPromise>

declare namespace Keycloak {
  type KeycloakAdapterName = 'cordova' | 'cordova-native' | 'default' | any
  type KeycloakOnLoad = 'login-required' | 'check-sso'
  type KeycloakResponseMode = 'query' | 'fragment'
  type KeycloakResponseType = 'code' | 'id_token token' | 'code id_token token'
  type KeycloakFlow = 'standard' | 'implicit' | 'hybrid'
  type KeycloakPromiseType = 'legacy' | 'native'
  type KeycloakPkceMethod = 'S256'

  interface KeycloakConfig {
    /**
     * URL to the Keycloak server, for example: http://keycloak-server/auth
     */
    url?: string
    /**
     * Name of the realm, for example: 'myrealm'
     */
    realm: string
    /**
     * Client identifier, example: 'myapp'
     */
    clientId: string
  }

  interface KeycloakInitOptions {
    /**
     * Adds a [cryptographic nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce)
     * to verify that the authentication response matches the request.
     * @default true
     */
    useNonce?: boolean

    /**
     * Allows to use different adapter:
     *
     * - {string} default - using browser api for redirects
     * - {string} cordova - using cordova plugins
     * - {function} - allows to provide custom function as adapter.
     */
    adapter?: KeycloakAdapterName

    /**
     * Specifies an action to do on load.
     */
    onLoad?: KeycloakOnLoad

    /**
     * Set an initial value for the token.
     */
    token?: string

    /**
     * Set an initial value for the refresh token.
     */
    refreshToken?: string

    /**
     * Set an initial value for the id token (only together with `token` or
     * `refreshToken`).
     */
    idToken?: string

    /**
     * Set an initial value for skew between local time and Keycloak server in
     * seconds (only together with `token` or `refreshToken`).
     */
    timeSkew?: number

    /**
     * Set to enable/disable monitoring login state.
     * @default true
     */
    checkLoginIframe?: boolean

    /**
     * Set the interval to check login state (in seconds).
     * @default 5
     */
    checkLoginIframeInterval?: number

    /**
     * Set the OpenID Connect response mode to send to Keycloak upon login.
     * @default fragment After successful authentication Keycloak will redirect
     *                   to JavaScript application with OpenID Connect parameters
     *                   added in URL fragment. This is generally safer and
     *                   recommended over query.
     */
    responseMode?: KeycloakResponseMode

    /**
     * Specifies a default uri to redirect to after login or logout.
     * This is currently supported for adapter 'cordova-native' and 'default'
     */
    redirectUri?: string

    /**
     * Specifies an uri to redirect to after silent check-sso.
     * Silent check-sso will only happen, when this redirect uri is given and
     * the specified uri is available whithin the application.
     */
    silentCheckSsoRedirectUri?: string

    /**
     * Set the OpenID Connect flow.
     * @default standard
     */
    flow?: KeycloakFlow

    /**
     * Set the promise type. If set to `native` all methods returning a promise
     * will return a native JavaScript promise. If not not specified then
     * Keycloak specific legacy promise objects will be returned instead.
     *
     * Since native promises have become the industry standard it is highly
     * recommended that you always specify `native` as the promise type.
     *
     * Note that in upcoming versions of Keycloak the default will be changed
     * to `native`, and support for legacy promises will eventually be removed.
     *
     * @default legacy
     */
    promiseType?: KeycloakPromiseType

    /**
     * Configures the Proof Key for Code Exchange (PKCE) method to use.
     * The currently allowed method is 'S256'.
     * If not configured, PKCE will not be used.
     */
    pkceMethod?: KeycloakPkceMethod

    /**
     * Enables logging messages from Keycloak to the console.
     * @default false
     */
    enableLogging?: boolean
  }

  interface KeycloakLoginOptions {
    /**
     * @private Undocumented.
     */
    scope?: string

    /**
     * Specifies the uri to redirect to after login.
     */
    redirectUri?: string

    /**
     * By default the login screen is displayed if the user is not logged into
     * Keycloak. To only authenticate to the application if the user is already
     * logged in and not display the login page if the user is not logged in, set
     * this option to `'none'`. To always require re-authentication and ignore
     * SSO, set this option to `'login'`.
     */
    prompt?: 'none' | 'login'

    /**
     * If value is `'register'` then user is redirected to registration page,
     * otherwise to login page.
     */
    action?: 'register'

    /**
     * Used just if user is already authenticated. Specifies maximum time since
     * the authentication of user happened. If user is already authenticated for
     * longer time than `'maxAge'`, the SSO is ignored and he will need to
     * authenticate again.
     */
    maxAge?: number

    /**
     * Used to pre-fill the username/email field on the login form.
     */
    loginHint?: string

    /**
     * Used to tell Keycloak which IDP the user wants to authenticate with.
     */
    idpHint?: string

    /**
     * Sets the 'ui_locales' query param in compliance with section 3.1.2.1
     * of the OIDC 1.0 specification.
     */
    locale?: string

    /**
     * Specifies the desired Keycloak locale for the UI.  This differs from
     * the locale param in that it tells the Keycloak server to set a cookie and update
     * the user's profile to a new preferred locale.
     */
    kcLocale?: string

    /**
     * Specifies arguments that are passed to the Cordova in-app-browser (if applicable).
     * Options 'hidden' and 'location' are not affected by these arguments.
     * All available options are defined at https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-inappbrowser/.
     * Example of use: { zoom: "no", hardwareback: "yes" }
     */
    cordovaOptions?: { [optionName: string]: string }
  }

  type KeycloakPromiseCallback<T> = (result: T) => void

  interface KeycloakPromise<TSuccess, TError> {
    /**
     * Function to call if the promised action succeeds.
     */
    success(
      callback: KeycloakPromiseCallback<TSuccess>
    ): KeycloakPromise<TSuccess, TError>

    /**
     * Function to call if the promised action throws an error.
     */
    error(callback: KeycloakPromiseCallback<TError>): KeycloakPromise<TSuccess, TError>
  }

  interface KeycloakError {
    error: string
    error_description: string
  }

  interface KeycloakAdapter {
    login(options?: KeycloakLoginOptions): KeycloakPromise<void, void>
    logout(options?: any): KeycloakPromise<void, void>
    register(options?: KeycloakLoginOptions): KeycloakPromise<void, void>
    accountManagement(): KeycloakPromise<void, void>
    redirectUri(options: { redirectUri: string }, encodeHash: boolean): string
  }

  interface KeycloakProfile {
    id?: string
    username?: string
    email?: string
    firstName?: string
    lastName?: string
    enabled?: boolean
    emailVerified?: boolean
    totp?: boolean
    createdTimestamp?: number
  }

  interface KeycloakTokenParsed {
    exp?: number
    iat?: number
    nonce?: string
    sub?: string
    session_state?: string
    realm_access?: KeycloakRoles
    resource_access?: KeycloakResourceAccess
  }

  interface KeycloakResourceAccess {
    [key: string]: KeycloakRoles
  }

  interface KeycloakRoles {
    roles: string[]
  }

  // export interface KeycloakUserInfo {}

  /**
   * Conditional CompatPromise type in order to support
   * both legacy promises and native promises as return types.
   */
  type CompatPromise<
    TPromiseType extends KeycloakPromiseType,
    TSuccess,
    TError
  > = TPromiseType extends 'native'
    ? Promise<TSuccess>
    : KeycloakPromise<TSuccess, TError>

  /**
   * A client for the Keycloak authentication server.
   * @see {@link https://keycloak.gitbooks.io/securing-client-applications-guide/content/topics/oidc/javascript-adapter.html|Keycloak JS adapter documentation}
   */
  interface KeycloakInstance<TPromise extends KeycloakPromiseType = 'legacy'> {
    /**
     * Is true if the user is authenticated, false otherwise.
     */
    authenticated?: boolean

    /**
     * The user id.
     */
    subject?: string

    /**
     * Response mode passed in init (default value is `'fragment'`).
     */
    responseMode?: KeycloakResponseMode

    /**
     * Response type sent to Keycloak with login requests. This is determined
     * based on the flow value used during initialization, but can be overridden
     * by setting this value.
     */
    responseType?: KeycloakResponseType

    /**
     * Flow passed in init.
     */
    flow?: KeycloakFlow

    /**
     * The realm roles associated with the token.
     */
    realmAccess?: KeycloakRoles

    /**
     * The resource roles associated with the token.
     */
    resourceAccess?: KeycloakResourceAccess

    /**
     * The base64 encoded token that can be sent in the Authorization header in
     * requests to services.
     */
    token?: string

    /**
     * The parsed token as a JavaScript object.
     */
    tokenParsed?: KeycloakTokenParsed

    /**
     * The base64 encoded refresh token that can be used to retrieve a new token.
     */
    refreshToken?: string

    /**
     * The parsed refresh token as a JavaScript object.
     */
    refreshTokenParsed?: KeycloakTokenParsed

    /**
     * The base64 encoded ID token.
     */
    idToken?: string

    /**
     * The parsed id token as a JavaScript object.
     */
    idTokenParsed?: KeycloakTokenParsed

    /**
     * The estimated time difference between the browser time and the Keycloak
     * server in seconds. This value is just an estimation, but is accurate
     * enough when determining if a token is expired or not.
     */
    timeSkew?: number

    /**
     * @private Undocumented.
     */
    loginRequired?: boolean

    /**
     * @private Undocumented.
     */
    authServerUrl?: string

    /**
     * @private Undocumented.
     */
    realm?: string

    /**
     * @private Undocumented.
     */
    clientId?: string

    /**
     * @private Undocumented.
     */
    clientSecret?: string

    /**
     * @private Undocumented.
     */
    redirectUri?: string

    /**
     * @private Undocumented.
     */
    sessionId?: string

    /**
     * @private Undocumented.
     */
    profile?: KeycloakProfile

    /**
     * @private Undocumented.
     */
    userInfo?: {} // KeycloakUserInfo;

    /**
     * Called when the adapter is initialized.
     */
    onReady?(authenticated?: boolean): void

    /**
     * Called when a user is successfully authenticated.
     */
    onAuthSuccess?(): void

    /**
     * Called if there was an error during authentication.
     */
    onAuthError?(errorData: KeycloakError): void

    /**
     * Called when the token is refreshed.
     */
    onAuthRefreshSuccess?(): void

    /**
     * Called if there was an error while trying to refresh the token.
     */
    onAuthRefreshError?(): void

    /**
     * Called if the user is logged out (will only be called if the session
     * status iframe is enabled, or in Cordova mode).
     */
    onAuthLogout?(): void

    /**
     * Called when the access token is expired. If a refresh token is available
     * the token can be refreshed with Keycloak#updateToken, or in cases where
     * it's not (ie. with implicit flow) you can redirect to login screen to
     * obtain a new access token.
     */
    onTokenExpired?(): void

    /**
     * Called to initialize the adapter.
     * @param initOptions Initialization options.
     * @returns A promise to set functions to be invoked on success or error.
     */
    init(
      initOptions: KeycloakInitOptions
    ): CompatPromise<TPromise, boolean, KeycloakError>

    /**
     * Redirects to login form.
     * @param options Login options.
     */
    login(options?: KeycloakLoginOptions): CompatPromise<TPromise, void, void>

    /**
     * Redirects to logout.
     * @param options Logout options.
     * @param options.redirectUri Specifies the uri to redirect to after logout.
     */
    logout(options?: any): CompatPromise<TPromise, void, void>

    /**
     * Redirects to registration form.
     * @param options Supports same options as Keycloak#login but `action` is
     *                set to `'register'`.
     */
    register(options?: any): CompatPromise<TPromise, void, void>

    /**
     * Redirects to the Account Management Console.
     */
    accountManagement(): CompatPromise<TPromise, void, void>

    /**
     * Returns the URL to login form.
     * @param options Supports same options as Keycloak#login.
     */
    createLoginUrl(options?: KeycloakLoginOptions): string

    /**
     * Returns the URL to logout the user.
     * @param options Logout options.
     * @param options.redirectUri Specifies the uri to redirect to after logout.
     */
    createLogoutUrl(options?: any): string

    /**
     * Returns the URL to registration page.
     * @param options Supports same options as Keycloak#createLoginUrl but
     *                `action` is set to `'register'`.
     */
    createRegisterUrl(options?: KeycloakLoginOptions): string

    /**
     * Returns the URL to the Account Management Console.
     */
    createAccountUrl(): string

    /**
     * Returns true if the token has less than `minValidity` seconds left before
     * it expires.
     * @param minValidity If not specified, `0` is used.
     */
    isTokenExpired(minValidity?: number): boolean

    /**
     * If the token expires within `minValidity` seconds, the token is refreshed.
     * If the session status iframe is enabled, the session status is also
     * checked.
     * @returns A promise to set functions that can be invoked if the token is
     *          still valid, or if the token is no longer valid.
     * @example
     * ```js
     * keycloak.updateToken(5).success(function(refreshed) {
     *   if (refreshed) {
     *     alert('Token was successfully refreshed');
     *   } else {
     *     alert('Token is still valid');
     *   }
     * }).error(function() {
     *   alert('Failed to refresh the token, or the session has expired');
     * });
     */
    updateToken(minValidity: number): CompatPromise<TPromise, boolean, boolean>

    /**
     * Clears authentication state, including tokens. This can be useful if
     * the application has detected the session was expired, for example if
     * updating token fails. Invoking this results in Keycloak#onAuthLogout
     * callback listener being invoked.
     */
    clearToken(): void

    /**
     * Returns true if the token has the given realm role.
     * @param role A realm role name.
     */
    hasRealmRole(role: string): boolean

    /**
     * Returns true if the token has the given role for the resource.
     * @param role A role name.
     * @param resource If not specified, `clientId` is used.
     */
    hasResourceRole(role: string, resource?: string): boolean

    /**
     * Loads the user's profile.
     * @returns A promise to set functions to be invoked on success or error.
     */
    loadUserProfile(): CompatPromise<TPromise, KeycloakProfile, void>

    /**
     * @private Undocumented.
     */
    loadUserInfo(): CompatPromise<TPromise, {}, void>
  }
}
