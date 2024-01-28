export type {
  AzureCloudInstance,
  Configuration as MsalConfiguration,
} from "@azure/msal-node";
export type GhaActionAuthMethod =
  | "ms-idp-federated-credential"
  | "ms-idp-temporary-certificate"
  | "ms-idp-temporary-secret"
  | "az-acs-temporary-secret";
