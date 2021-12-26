import request from "supertest";


test("GET / - base home endpoint", async () => {
    const result = await request("http://web:8081").get("/");
    expect(result.body['message']).toEqual("Welcome to RUMBus");
    expect(result.status).toEqual(200);
});
