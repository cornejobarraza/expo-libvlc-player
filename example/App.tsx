import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { ALL_FORMATS, Input, type MetadataTags, UrlSource } from "mediabunny";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Text } from "./components/Text";
import { VlcPlayer } from "./components/VlcPlayer";
import { useFullScreen } from "./hooks/useFullScreen";

const BIG_BUCK_BUNNY =
  "https://mirror.umd.edu/xbmc/demo-files/BBB/bbb_sunflower_1080p_30fps_normal.mp4";

const input = new Input({
  formats: ALL_FORMATS,
  source: new UrlSource(BIG_BUCK_BUNNY),
});

type Metadata = MetadataTags & { duration: number };

export default function App() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [reading, setReading] = useState<boolean>(false);
  const fullScreen = useFullScreen();

  useEffect(() => {
    (async () => {
      try {
        setReading(true);
        const metadata = await input.getMetadataTags();
        const duration = await input.computeDuration();
        setMetadata({ ...metadata, duration });
        setReading(false);
      } catch {
        setReading(false);
      }
    })();
  }, []);

  const appPadding = !fullScreen ? styles.app.padding : undefined;
  const showLoading = !fullScreen && reading;
  const showTitle = !fullScreen && !!metadata?.title;
  const showArtist = !fullScreen && !!metadata?.artist;

  return (
    <SafeAreaProvider>
      <View style={{ ...styles.app, padding: appPadding }}>
        <StatusBar style="light" hidden={fullScreen} />
        <View style={styles.header}>
          {!showLoading ? (
            <>
              {showTitle && (
                <Text style={styles.title} numberOfLines={1}>
                  {metadata.title}
                </Text>
              )}
              {showArtist && (
                <Text style={styles.artist} numberOfLines={1}>
                  {metadata.artist}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text.Loading width="50%" height={styles.title.lineHeight} />
              <Text.Loading width="75%" height={styles.artist.lineHeight} />
            </>
          )}
        </View>
        <VlcPlayer source={BIG_BUCK_BUNNY} fullScreen={fullScreen} />
        <NavigationBar style="light" hidden={fullScreen} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    gap: 24,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    color: "#f1f1f1",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "bold",
  },
  artist: {
    color: "#f1f1f1",
    fontSize: 16,
    lineHeight: 20,
  },
});
