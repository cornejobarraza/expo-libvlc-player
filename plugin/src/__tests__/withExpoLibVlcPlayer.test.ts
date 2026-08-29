import { type ExpoConfig } from "expo/config";
import { AndroidConfig, type ExportedConfigWithProps } from "expo/config-plugins";

import withExpoLibVlcPlayer, { type WithExpoLibVlcPlayerProps } from "../withExpoLibVlcPlayer";

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;
type InfoPlist = Record<string, any>;

const PIP_MANIFEST_ATTRIBUTE = "android:supportsPictureInPicture";
const AUDIO_BACKGROUND_MODE = "audio";
const OTHER_BACKGROUND_MODE = "location";

function createManifest(activityAttributes: Record<string, string> = {}): AndroidManifest {
  return {
    manifest: {
      $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
      application: [
        {
          $: { "android:name": ".MainApplication" },
          activity: [
            {
              $: { "android:name": ".MainActivity", ...activityAttributes },
            },
          ],
        },
      ],
    },
  } as AndroidManifest;
}

function getMainActivity(manifest: AndroidManifest) {
  return AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
}

async function applyPlugin(
  props: WithExpoLibVlcPlayerProps | undefined,
  { manifest = createManifest(), infoPlist = {} as InfoPlist } = {}
) {
  let config: ExpoConfig = { name: "test", slug: "test" };
  config = withExpoLibVlcPlayer(config, props as WithExpoLibVlcPlayerProps);

  const mods = (config as any).mods;

  const manifestResult = (await mods.android.manifest({
    ...config,
    modResults: manifest,
  } as ExportedConfigWithProps<AndroidManifest>)) as ExportedConfigWithProps<AndroidManifest>;

  const infoPlistResult = (await mods.ios.infoPlist({
    ...config,
    modResults: infoPlist,
  } as ExportedConfigWithProps<InfoPlist>)) as ExportedConfigWithProps<InfoPlist>;

  return {
    manifest: manifestResult.modResults,
    infoPlist: infoPlistResult.modResults,
  };
}

describe("withExpoLibVlcPlayer", () => {
  describe("Picture-in-Picture", () => {
    it("adds the manifest attribute and audio background mode when enabled", async () => {
      const { manifest, infoPlist } = await applyPlugin({ supportsPictureInPicture: true });

      expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBe("true");
      expect(infoPlist.UIBackgroundModes).toEqual([AUDIO_BACKGROUND_MODE]);
    });

    it("does not duplicate the audio background mode", async () => {
      const { infoPlist } = await applyPlugin(
        { supportsPictureInPicture: true },
        { infoPlist: { UIBackgroundModes: [AUDIO_BACKGROUND_MODE, OTHER_BACKGROUND_MODE] } }
      );

      expect(infoPlist.UIBackgroundModes).toEqual([OTHER_BACKGROUND_MODE, AUDIO_BACKGROUND_MODE]);
    });

    it("removes the manifest attribute and audio background mode when disabled", async () => {
      const { manifest, infoPlist } = await applyPlugin(
        { supportsPictureInPicture: false },
        {
          manifest: createManifest({ [PIP_MANIFEST_ATTRIBUTE]: "true" }),
          infoPlist: { UIBackgroundModes: [AUDIO_BACKGROUND_MODE, OTHER_BACKGROUND_MODE] },
        }
      );

      expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBeUndefined();
      expect(infoPlist.UIBackgroundModes).toEqual([OTHER_BACKGROUND_MODE]);
    });

    it("leaves the manifest and background modes untouched when not configured", async () => {
      const { manifest, infoPlist } = await applyPlugin(
        {},
        {
          manifest: createManifest({ [PIP_MANIFEST_ATTRIBUTE]: "true" }),
          infoPlist: { UIBackgroundModes: [AUDIO_BACKGROUND_MODE] },
        }
      );

      expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBe("true");
      expect(infoPlist.UIBackgroundModes).toEqual([AUDIO_BACKGROUND_MODE]);
    });
  });

  describe("local network permission", () => {
    it("sets a custom NSLocalNetworkUsageDescription message", async () => {
      const message = "Custom local network message";

      const { infoPlist } = await applyPlugin({ localNetworkPermission: message });

      expect(infoPlist.NSLocalNetworkUsageDescription).toBe(message);
    });

    it("sets the default NSLocalNetworkUsageDescription message when not configured", async () => {
      const { infoPlist } = await applyPlugin({});

      expect(infoPlist.NSLocalNetworkUsageDescription).toBe(
        "Allow $(PRODUCT_NAME) to access your local network"
      );
    });
  });

  it("works without props", async () => {
    const { manifest, infoPlist } = await applyPlugin(undefined);

    expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBeUndefined();
    expect(infoPlist.UIBackgroundModes).toBeUndefined();
  });
});
