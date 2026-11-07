import { type ExpoConfig } from "expo/config";
import { AndroidConfig, type ExportedConfigWithProps } from "expo/config-plugins";

import withExpoLibVlcPlayer, { type WithExpoLibVlcPlayerProps } from "../withExpoLibVlcPlayer";

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;
type InfoPlist = Record<string, any>;

const PLAYBACK_SERVICE_NAME = "expo.modules.libvlcplayer.services.MediaPlaybackService";
const OTHER_SERVICE_NAME = "com.example.services.OtherService";
const PLAYBACK_SERVICE = {
  $: {
    "android:name": PLAYBACK_SERVICE_NAME,
    "android:exported": "false",
    "android:foregroundServiceType": "mediaPlayback",
  },
};
const PLAYBACK_SERVICE_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
];
const AUDIO_BACKGROUND_MODE = "audio";
const OTHER_BACKGROUND_MODE = "location";
const PIP_MANIFEST_ATTRIBUTE = "android:supportsPictureInPicture";

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

function getServiceNames(manifest: AndroidManifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  return (application.service ?? []).map((service) => service.$["android:name"]);
}

function getPlaybackServices(manifest: AndroidManifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  return (application.service ?? []).filter(
    (service) => service.$["android:name"] === PLAYBACK_SERVICE_NAME
  );
}

function getPermissions(manifest: AndroidManifest) {
  return AndroidConfig.Permissions.getPermissions(manifest);
}

function withServices(
  manifest: AndroidManifest,
  serviceNames: string[] = [PLAYBACK_SERVICE_NAME]
): AndroidManifest {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  application.service = serviceNames.map((name) => ({ $: { "android:name": name } }) as any);

  return manifest;
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
  describe("background playback", () => {
    it("adds the audio background mode without touching the main activity when enabled", async () => {
      const { manifest, infoPlist } = await applyPlugin({ supportsBackgroundPlayback: true });

      expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBeUndefined();
      expect(infoPlist.UIBackgroundModes).toEqual([AUDIO_BACKGROUND_MODE]);
    });

    it("removes the audio background mode when disabled", async () => {
      const { infoPlist } = await applyPlugin(
        { supportsBackgroundPlayback: false },
        { infoPlist: { UIBackgroundModes: [AUDIO_BACKGROUND_MODE, OTHER_BACKGROUND_MODE] } }
      );

      expect(infoPlist.UIBackgroundModes).toEqual([OTHER_BACKGROUND_MODE]);
    });

    it("keeps the audio background mode when Picture-in-Picture is enabled", async () => {
      const { manifest, infoPlist } = await applyPlugin({
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: true,
      });

      expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBe("true");
      expect(infoPlist.UIBackgroundModes).toEqual([AUDIO_BACKGROUND_MODE]);
    });

    it("keeps the audio background mode when Picture-in-Picture is disabled", async () => {
      const { manifest, infoPlist } = await applyPlugin(
        { supportsBackgroundPlayback: true, supportsPictureInPicture: false },
        { manifest: createManifest({ [PIP_MANIFEST_ATTRIBUTE]: "true" }) }
      );

      expect(getMainActivity(manifest).$[PIP_MANIFEST_ATTRIBUTE]).toBeUndefined();
      expect(infoPlist.UIBackgroundModes).toEqual([AUDIO_BACKGROUND_MODE]);
    });

    it("does not duplicate the audio background mode when both are enabled", async () => {
      const { infoPlist } = await applyPlugin(
        { supportsBackgroundPlayback: true, supportsPictureInPicture: true },
        { infoPlist: { UIBackgroundModes: [AUDIO_BACKGROUND_MODE] } }
      );

      expect(infoPlist.UIBackgroundModes).toEqual([AUDIO_BACKGROUND_MODE]);
    });

    it("declares the media playback service and its permissions when enabled", async () => {
      const { manifest } = await applyPlugin({ supportsBackgroundPlayback: true });

      expect(getPlaybackServices(manifest)).toEqual([PLAYBACK_SERVICE]);
      expect(getPermissions(manifest)).toEqual(
        expect.arrayContaining(PLAYBACK_SERVICE_PERMISSIONS)
      );
    });

    it("replaces an existing media playback service instead of duplicating it", async () => {
      const { manifest } = await applyPlugin(
        { supportsBackgroundPlayback: true },
        { manifest: withServices(createManifest()) }
      );

      expect(getPlaybackServices(manifest)).toEqual([PLAYBACK_SERVICE]);
    });

    it("removes the media playback service when disabled", async () => {
      const { manifest } = await applyPlugin(
        { supportsBackgroundPlayback: false },
        { manifest: withServices(createManifest()) }
      );

      expect(getPlaybackServices(manifest)).toHaveLength(0);
    });

    it("keeps the foreground service permissions when disabled", async () => {
      const manifest = withServices(createManifest());

      AndroidConfig.Permissions.ensurePermissions(manifest, PLAYBACK_SERVICE_PERMISSIONS);

      const { manifest: result } = await applyPlugin(
        { supportsBackgroundPlayback: false },
        { manifest }
      );

      expect(getPermissions(result)).toEqual(expect.arrayContaining(PLAYBACK_SERVICE_PERMISSIONS));
    });

    it("keeps other services when enabled", async () => {
      const { manifest } = await applyPlugin(
        { supportsBackgroundPlayback: true },
        { manifest: withServices(createManifest(), [OTHER_SERVICE_NAME]) }
      );

      expect(getServiceNames(manifest)).toEqual([OTHER_SERVICE_NAME, PLAYBACK_SERVICE_NAME]);
    });

    it("keeps other services when disabled", async () => {
      const { manifest } = await applyPlugin(
        { supportsBackgroundPlayback: false },
        {
          manifest: withServices(createManifest(), [OTHER_SERVICE_NAME, PLAYBACK_SERVICE_NAME]),
        }
      );

      expect(getServiceNames(manifest)).toEqual([OTHER_SERVICE_NAME]);
    });

    it("leaves the media playback service untouched when not configured", async () => {
      const { manifest } = await applyPlugin({}, { manifest: withServices(createManifest()) });

      expect(getPlaybackServices(manifest)).toHaveLength(1);
    });
  });

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
    expect(getPlaybackServices(manifest)).toHaveLength(0);
    expect(infoPlist.UIBackgroundModes).toBeUndefined();
  });
});
