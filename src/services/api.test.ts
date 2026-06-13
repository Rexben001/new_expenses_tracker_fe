import { beforeEach, describe, expect, test, vi } from "vitest";
import { getTokens } from "./amplify";
import {
  API_BASE_URL,
  ApiError,
  getErrorMessage,
  getTasks,
  updateBudget,
} from "./api";

vi.mock("./amplify", () => ({
  getTokens: vi.fn(),
}));

const mockedGetTokens = vi.mocked(getTokens);
const mockedFetch = vi.fn();

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetTokens.mockResolvedValue({
      accessToken: "access-token",
      idToken: "id-token",
    });
    mockedFetch.mockResolvedValue(jsonResponse([{ id: "task-1" }]));
    vi.stubGlobal("fetch", mockedFetch);
  });

  test("sends authenticated GET requests with encoded sub account IDs", async () => {
    await expect(getTasks("sub account/1")).resolves.toEqual([
      { id: "task-1" },
    ]);

    expect(mockedFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}tasks?subId=sub%20account%2F1`,
      {
        headers: {
          Authorization: "Bearer id-token",
          "Content-Type": "application/json",
        },
        method: "GET",
      }
    );
  });

  test("sends request bodies and recurring budget query params", async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({ id: "budget-1" }));

    await updateBudget(
      "budget-1",
      { title: "June", amount: 250 },
      "sub-1",
      true
    );

    expect(mockedFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}budgets/budget-1?subId=sub-1&setIsRecurring=true`,
      {
        body: JSON.stringify({ title: "June", amount: 250 }),
        headers: {
          Authorization: "Bearer id-token",
          "Content-Type": "application/json",
        },
        method: "PUT",
      }
    );
  });

  test("throws ApiError with backend message and status code", async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          message: "Calendar entry ID is required",
          statusCode: 400,
        },
        { status: 400, statusText: "Bad Request" }
      )
    );

    await expect(getTasks()).rejects.toMatchObject({
      message: "Calendar entry ID is required",
      name: "ApiError",
      statusCode: 400,
    });
  });

  test("throws ApiError when auth token is missing", async () => {
    mockedGetTokens.mockResolvedValueOnce({
      accessToken: null,
      idToken: null,
    });

    await expect(getTasks()).rejects.toMatchObject({
      message: "No auth token available",
      statusCode: 401,
    });
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  test("formats unknown errors safely", () => {
    expect(getErrorMessage(new Error("Failed"))).toBe("Failed");
    expect(getErrorMessage("not an error", "Fallback")).toBe("Fallback");
    expect(new ApiError("Bad request", 400).statusCode).toBe(400);
  });
});
