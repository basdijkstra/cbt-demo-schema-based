# Customer API – Specmatic demo

Small ASP.NET Core (.NET 10) minimal API with an OpenAPI contract, meant as an example for contract testing with the Specmatic CLI.

## Endpoints

| Method | Path              | Responses           |
|--------|-------------------|---------------------|
| GET    | `/customers/{id}` | 200, 400, 404       |
| POST   | `/customers`      | 201, 400            |
| DELETE | `/customers/{id}` | 204, 400, 404       |

The contract lives in [`specs/customer-api.yaml`](specs/customer-api.yaml). The running API also serves it at `http://localhost:8080/openapi.yaml`.

Data is kept in memory. On startup the API is seeded with:

| id | Customer     | Used by example           |
|----|--------------|---------------------------|
| 1  | John Doe     | `GET_CUSTOMER_SUCCESS`    |
| 2  | Mary Johnson | `DELETE_CUSTOMER_SUCCESS` |

Id `999` never exists and is used by the `*_NOT_FOUND` examples.

## Provider

```bash
dotnet run --project provider/CustomerApi
```

API listens on `http://localhost:8080`.

## Consumer

[`consumer/`](consumer) holds a typed TypeScript HTTP client for the Customer API (`CustomerClient`, Node 22+, native `fetch`). Its tests run against a Specmatic stub generated from the same contract, so they don't need the real provider:

```bash
java -jar specmatic/specmatic-executable-all-2.55.3.jar stub specs/customer-api.yaml --port 9000

cd consumer
npm install
npm test
```

Set `CUSTOMER_API_URL` to point the tests somewhere else (default `http://localhost:9000`).

## Demo script

Both sides are tested against the same contract, [`specs/customer-api.yaml`](specs/customer-api.yaml), and never against each other. Run all commands from the repository root unless stated otherwise.

Prerequisites: .NET 10 SDK, Java 17+, Node.js 22+. Run `npm install` in `consumer/` once before the demo.

### Part 1 – Happy path: both sides honour the contract

**Step 1 – Show the contract.** Open `specs/customer-api.yaml` and point out:

- the `Customer`, `NewCustomer` and `Error` schemas;
- the named examples (e.g. `GET_CUSTOMER_SUCCESS`) that appear both on the request (`id` parameter) and on the response. Specmatic turns each pair into a test case.

**Step 2 – Start the provider** (terminal 1):

```bash
dotnet run --project provider/CustomerApi
```

**Step 3 – Run the provider contract tests** (terminal 2):

```bash
java -jar specmatic/specmatic-executable-all-2.55.3.jar test specs/customer-api.yaml --testBaseURL http://localhost:8080
```

Specmatic sends a request per example to the real API and checks each response against the spec. Expected result:

```
Tests run: 5, Successes: 5, Failures: 0, WIP: 0, Errors: 0
```

An HTML report is written to `build/reports/specmatic/test/html/index.html`.

> The tests create and delete customers. Restart the provider (step 2) before running them again.

**Step 4 – Start a stub generated from the contract** (terminal 3):

```bash
java -jar specmatic/specmatic-executable-all-2.55.3.jar stub specs/customer-api.yaml --port 9000
```

The stub is a fake provider built purely from the spec: requests that match an example get that example's response, other valid requests get a generated response that fits the schema, and requests that violate the spec are rejected.

**Step 5 – Run the consumer tests against the stub** (terminal 2):

```bash
cd consumer
npm test
```

Expected result: `Tests  4 passed (4)`.

**Point to make:** the provider was verified against the spec, the consumer was verified against the spec, and neither test needed the other side. Because both pass, the integration works.

### Part 2 – Breaking the integration (optional)

**Step 6 – Make a change that compiles but breaks the contract.** In [`provider/CustomerApi/Program.cs`](provider/CustomerApi/Program.cs), rename the `Email` property of the `Customer` record:

```csharp
record Customer(int Id, string FirstName, string LastName, string EmailAddress);
```

To the provider this is a harmless refactoring: it compiles, and the API still works. But the JSON field in the responses is now `emailAddress` instead of `email`.

**Step 7 – Restart the provider and rerun the provider contract tests** (steps 2 and 3). Expected result:

```
Tests run: 5, Successes: 3, Failures: 2, WIP: 0, Errors: 0
```

Both scenarios that return a `Customer` (`GET_CUSTOMER_SUCCESS` and `CREATE_CUSTOMER_SUCCESS`) fail with:

```
>> RESPONSE.BODY.email
    Specification expected mandatory property "email" to be present but was missing from the response
```

**Point to make:** the consumer tests (step 5) still pass, because the consumer still honours the contract. The provider broke it, and the provider's own pipeline catches that before deployment, without running the consumer.

**Step 8 – Clean up:** revert the change.

```bash
git checkout provider/CustomerApi/Program.cs
```

## Notes for contract testing

- Examples are linked across request and response by name (e.g. `GET_CUSTOMER_SUCCESS` on the `id` path parameter and on the 200 response body), which is how Specmatic turns them into test cases.
- `DELETE_CUSTOMER_SUCCESS` removes customer 2, so restart the API before re-running the test suite.
