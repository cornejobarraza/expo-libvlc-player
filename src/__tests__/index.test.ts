jest.mock("expo", () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn(() => () => null),
}));

describe("index", () => {
  it("exports the module as default and the view component", () => {
    const index = require("../index");

    expect(index.default).toBeDefined();
    expect(index.LibVlcPlayerView).toBeInstanceOf(Function);
  });
});
