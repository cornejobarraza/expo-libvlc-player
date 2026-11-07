const mockNativeModule = {};

jest.mock("expo", () => ({
  requireNativeModule: jest.fn(() => mockNativeModule),
  requireNativeView: jest.fn(() => class MockNativeView {}),
}));

describe("index", () => {
  it("exports the module as default and the view component", () => {
    const { requireNativeView } = require("expo");
    const index = require("../index");

    expect(index.default).toBe(mockNativeModule);
    expect(index.LibVlcPlayerView).toBe(require("../LibVlcPlayerView").default);
    expect(requireNativeView).toHaveBeenCalledWith("ExpoLibVlcPlayer");
  });
});
