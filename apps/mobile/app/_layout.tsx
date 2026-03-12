import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./providers/auth-provider";

function MobileAuthNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isHydrating, session } = useAuth();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/login");
      return;
    }

    if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [isHydrating, router, segments, session]);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#082f49" },
        headerTintColor: "#f8fafc",
        contentStyle: { backgroundColor: "#020617" }
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <MobileAuthNavigator />
    </AuthProvider>
  );
}
