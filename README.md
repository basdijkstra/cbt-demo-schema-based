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

## Run

```bash
dotnet run --project provider/CustomerApi
```

API listens on `http://localhost:8080`.

## Notes for contract testing

- Examples are linked across request and response by name (e.g. `GET_CUSTOMER_SUCCESS` on the `id` path parameter and on the 200 response body), which is how Specmatic turns them into test cases.
- `DELETE_CUSTOMER_SUCCESS` removes customer 2, so restart the API before re-running the test suite.
