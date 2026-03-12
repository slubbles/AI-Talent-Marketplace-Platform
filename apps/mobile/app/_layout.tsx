import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#082f49" },
          headerTintColor: "#f8fafc",
          contentStyle: { backgroundColor: "#020617" }
        }}
      />
    </>
  );
}
