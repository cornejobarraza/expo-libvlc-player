import withExpoLibVlcPlayerEntry from "../index";

const PLUGIN_NAME = "expo-libvlc-player";

describe("plugin entry", () => {
  it("returns the plugin tuple with default props", () => {
    expect(withExpoLibVlcPlayerEntry()).toEqual([PLUGIN_NAME, {}]);
  });

  it("returns the plugin tuple with the given props", () => {
    const props = {
      localNetworkPermission: "Custom message",
      supportsPictureInPicture: true,
    };

    expect(withExpoLibVlcPlayerEntry(props)).toEqual([PLUGIN_NAME, props]);
  });
});
