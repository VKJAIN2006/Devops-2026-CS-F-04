const { test } = require("node:test");
const assert = require("node:assert/strict");

const mongoose = require("mongoose");

// The root status route does not require a live database. Prevent the app's
// startup connection attempt from requiring MongoDB during this test.
mongoose.connect = () => Promise.resolve(mongoose);

const app = require("../app");

test("GET / returns the backend running message as JSON", async (t) => {
  const server = app.listen(0);

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/json/);
  assert.deepEqual(await response.json(), {
    message: "Event Management System Backend is running"
  });
});
