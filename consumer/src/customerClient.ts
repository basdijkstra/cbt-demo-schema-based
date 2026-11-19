import type { Customer, ErrorResponse, NewCustomer } from "./types.js";

/** Thrown when the Customer API answers with a non-success status code. */
export class CustomerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CustomerApiError";
  }
}

export class CustomerClient {
  constructor(private readonly baseUrl: string) {}

  /** GET /customers/{id} */
  async getCustomer(id: number): Promise<Customer> {
    const response = await fetch(this.url(`/customers/${id}`), {
      headers: { Accept: "application/json" },
    });
    await this.ensureSuccess(response);
    return (await response.json()) as Customer;
  }

  /** POST /customers */
  async createCustomer(customer: NewCustomer): Promise<Customer> {
    const response = await fetch(this.url("/customers"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(customer),
    });
    await this.ensureSuccess(response);
    return (await response.json()) as Customer;
  }

  /** DELETE /customers/{id} */
  async deleteCustomer(id: number): Promise<void> {
    const response = await fetch(this.url(`/customers/${id}`), { method: "DELETE" });
    await this.ensureSuccess(response);
  }

  private url(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }

  private async ensureSuccess(response: Response): Promise<void> {
    if (response.ok) return;

    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as Partial<ErrorResponse>;
      if (typeof body.message === "string") message = body.message;
    } catch {
      // Body is not JSON (e.g. Specmatic stub mismatch report): keep the status text.
    }
    throw new CustomerApiError(response.status, message);
  }
}
