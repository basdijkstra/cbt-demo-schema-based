import { describe, expect, it } from "vitest";
import { CustomerApiError, CustomerClient } from "../src/index.js";

// Runs against a Specmatic stub generated from specs/customer-api.yaml (see README).
const baseUrl = process.env.CUSTOMER_API_URL ?? "http://localhost:9000";
const client = new CustomerClient(baseUrl);

describe("CustomerClient", () => {
  it("gets an existing customer", async () => {
    const customer = await client.getCustomer(1);

    expect(customer).toEqual({
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    });
  });

  it("throws a 404 error for an unknown customer", async () => {
    await expect(client.getCustomer(999)).rejects.toMatchObject({
      status: 404,
      message: "Customer with id 999 not found",
    } satisfies Partial<CustomerApiError>);
  });

  it("creates a customer", async () => {
    const created = await client.createCustomer({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
    });

    expect(created).toEqual({
      id: 3,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
    });
  });

  it("deletes a customer", async () => {
    await expect(client.deleteCustomer(2)).resolves.toBeUndefined();
  });
});
