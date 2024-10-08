import { KC_AUTH_URL, KC_REALM, KC_CLIENT } from 'utils/env'
import Keycloak, { KeycloakInitOptions } from 'keycloak-js'

export const kcInitOptions: KeycloakInitOptions = {
  onLoad: 'login-required',
  checkLoginIframe: false,
  enableLogging: import.meta.env.MODE !== 'production',
  pkceMethod: 'S256'
}

export const getKeycloakInstance = (): Keycloak => {
  return new Keycloak({
    url: KC_AUTH_URL,
    realm: KC_REALM,
    clientId: KC_CLIENT
  })
}
