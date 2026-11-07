const mockNativeModule = {};

jest.mock("expo", () => ({
  requireNativeModule: jest.fn(() => mockNativeModule),
}));

describe("LibVlcPlayerModule", () => {
  it("requires the ExpoLibVlcPlayer native module", () => {
    const { requireNativeModule } = require("expo");
    const LibVlcPlayerModule = require("../LibVlcPlayerModule").default;

    expect(requireNativeModule).toHaveBeenCalledWith("ExpoLibVlcPlayer");
    expect(LibVlcPlayerModule).toBe(mockNativeModule);
  });
});
