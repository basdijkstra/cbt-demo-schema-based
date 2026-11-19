using System.Collections.Concurrent;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<CustomerStore>();

var app = builder.Build();

// Serve the OpenAPI contract so Specmatic (or anyone else) can fetch it from the running API.
app.MapGet("/openapi.yaml", () =>
    Results.File(Path.Combine(AppContext.BaseDirectory, "customer-api.yaml"), "application/yaml"));

app.MapGet("/customers/{id}", (string id, CustomerStore store) =>
{
    if (!int.TryParse(id, out var customerId))
        return Results.BadRequest(new Error($"'{id}' is not a valid customer id"));

    return store.TryGet(customerId, out var customer)
        ? Results.Ok(customer)
        : Results.NotFound(new Error($"Customer with id {customerId} not found"));
});

app.MapPost("/customers", async (HttpRequest request, CustomerStore store) =>
{
    NewCustomer? newCustomer;
    try
    {
        newCustomer = await JsonSerializer.DeserializeAsync<NewCustomer>(
            request.Body, JsonSerializerOptions.Web);
    }
    catch (JsonException)
    {
        return Results.BadRequest(new Error("Request body is not a valid customer"));
    }

    var validationError = Validate(newCustomer);
    if (validationError is not null)
        return Results.BadRequest(new Error(validationError));

    var created = store.Add(newCustomer!);
    return Results.Created($"/customers/{created.Id}", created);
});

app.MapDelete("/customers/{id}", (string id, CustomerStore store) =>
{
    if (!int.TryParse(id, out var customerId))
        return Results.BadRequest(new Error($"'{id}' is not a valid customer id"));

    return store.Remove(customerId)
        ? Results.NoContent()
        : Results.NotFound(new Error($"Customer with id {customerId} not found"));
});

app.Run();

static string? Validate(NewCustomer? customer)
{
    if (customer is null) return "Request body is required";
    if (string.IsNullOrEmpty(customer.FirstName)) return "firstName is required";
    if (string.IsNullOrEmpty(customer.LastName)) return "lastName is required";
    if (string.IsNullOrEmpty(customer.Email)) return "email is required";
    return null;
}

record NewCustomer(string? FirstName, string? LastName, string? Email);

record Customer(int Id, string FirstName, string LastName, string Email);

record Error(string Message);

class CustomerStore
{
    private readonly ConcurrentDictionary<int, Customer> _customers = new();
    private int _lastId;

    public CustomerStore()
    {
        // Seed data referenced by the examples in specs/customer-api.yaml.
        Add(new NewCustomer("John", "Doe", "john.doe@example.com"));       // id 1: GET example
        Add(new NewCustomer("Mary", "Johnson", "mary.johnson@example.com")); // id 2: DELETE example
    }

    public bool TryGet(int id, out Customer? customer) => _customers.TryGetValue(id, out customer);

    public Customer Add(NewCustomer newCustomer)
    {
        var id = Interlocked.Increment(ref _lastId);
        var customer = new Customer(id, newCustomer.FirstName!, newCustomer.LastName!, newCustomer.Email!);
        _customers[id] = customer;
        return customer;
    }

    public bool Remove(int id) => _customers.TryRemove(id, out _);
}
