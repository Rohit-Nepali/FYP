import request from "supertest";
import app from "../app.js";

describe("App Endpoints", () => {
  it("should return hello world from /api/", async () => {
    const res = await request(app).get("/api/");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Hello World!!!");
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
