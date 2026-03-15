import { graphQLRequest } from "./graphql";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("graphQLRequest", () => {
  it("sends a POST request with query and variables", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: { me: { id: "1", email: "test@example.com" } } })
    });

    const result = await graphQLRequest<{ me: { id: string; email: string } }>(
      "query { me { id email } }"
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/graphql");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      query: "query { me { id email } }",
      variables: undefined
    });
    expect(result.me.email).toBe("test@example.com");
  });

  it("includes Authorization header when access token is provided", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: { me: { id: "1" } } })
    });

    await graphQLRequest("query { me { id } }", undefined, "my-token-123");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer my-token-123");
  });

  it("throws when GraphQL response has errors", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        data: null,
        errors: [{ message: "Not authenticated" }]
      })
    });

    await expect(graphQLRequest("query { me { id } }")).rejects.toThrow("Not authenticated");
  });

  it("throws when data is missing from response", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({})
    });

    await expect(graphQLRequest("query { me { id } }")).rejects.toThrow(
      "GraphQL response did not include data"
    );
  });

  it("passes variables through to the request body", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: { demand: { id: "d1" } } })
    });

    await graphQLRequest(
      "mutation CreateDemand($input: CreateDemandInput!) { createDemand(input: $input) { id } }",
      { input: { title: "React Dev" } }
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ input: { title: "React Dev" } });
  });
});
