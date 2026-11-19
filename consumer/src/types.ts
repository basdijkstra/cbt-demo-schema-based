// Mirrors the schemas in specs/customer-api.yaml.

export interface NewCustomer {
  firstName: string;
  lastName: string;
  email: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ErrorResponse {
  message: string;
}
