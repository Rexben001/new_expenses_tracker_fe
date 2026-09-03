import { beforeEach, describe, expect, test, vi } from "vitest";
import { getTokens } from "./amplify";
import {
  API_BASE_URL,
  ApiError,
  createFoodItem,
  createWardrobeItem,
  deleteFoodItem,
  deleteWardrobeItem,
  getErrorMessage,
  getFoodStats,
  getTasks,
  getWardrobeItems,
  getWardrobePlan,
  requestWardrobeUploadUrl,
  saveWardrobePlan,
  updateFoodItem,
  updateWardrobeItem,
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

  test("uses authenticated food item CRUD endpoints", async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({ item: { id: "food-1" } }))
      .mockResolvedValueOnce(jsonResponse({ item: { id: "food-1" } }))
      .mockResolvedValueOnce(jsonResponse({ message: "deleted" }));

    await createFoodItem({ name: "Rice" }, "sub-1");
    await updateFoodItem("food-1", { quantity: 2 }, "sub-1");
    await deleteFoodItem("food-1", "sub-1");

    expect(mockedFetch).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}food-items?subId=sub-1`,
      expect.objectContaining({ method: "POST" })
    );
    expect(mockedFetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}food-items/food-1?subId=sub-1`,
      expect.objectContaining({ method: "PUT" })
    );
    expect(mockedFetch).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}food-items/food-1?subId=sub-1`,
      expect.objectContaining({ method: "DELETE" })
    );
  });

  test("loads account-scoped food savings stats", async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse({ estimatedSavings: 12, savedWeightKg: 2 })
    );

    await getFoodStats("sub-1");

    expect(mockedFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}food-items/stats?subId=sub-1`,
      expect.objectContaining({ method: "GET" })
    );
  });

  test("uses account-scoped wardrobe item, upload, and plan endpoints", async () => {
    mockedFetch.mockImplementation(async () => jsonResponse({ ok: true }));
    const itemPayload = {
      id: "item-1",
      imageKey: "users/user-1/sub-1/item-1.png",
      name: "Navy shirt",
      category: "shirt" as const,
      colorFamily: "blue" as const,
      colorHex: "#17345f",
      colorTone: "dark" as const,
      favorite: false,
    };
    const plan = {
      weekStart: "2026-09-07",
      generation: 1,
      days: [],
    };

    await getWardrobeItems("sub-1");
    await requestWardrobeUploadUrl("navy shirt.png", "sub-1");
    await createWardrobeItem(itemPayload, "sub-1");
    await updateWardrobeItem("item-1", { favorite: true }, "sub-1");
    await deleteWardrobeItem("item-1", "sub-1");
    await getWardrobePlan("2026-09-07", "sub-1");
    await saveWardrobePlan(plan, "sub-1");

    expect(mockedFetch.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      [`${API_BASE_URL}wardrobe/items?subId=sub-1`, "GET"],
      [`${API_BASE_URL}wardrobe/upload-url?subId=sub-1`, "POST"],
      [`${API_BASE_URL}wardrobe/items?subId=sub-1`, "POST"],
      [`${API_BASE_URL}wardrobe/items/item-1?subId=sub-1`, "PUT"],
      [`${API_BASE_URL}wardrobe/items/item-1?subId=sub-1`, "DELETE"],
      [`${API_BASE_URL}wardrobe/plans/2026-09-07?subId=sub-1`, "GET"],
      [`${API_BASE_URL}wardrobe/plans/2026-09-07?subId=sub-1`, "PUT"],
    ]);
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
