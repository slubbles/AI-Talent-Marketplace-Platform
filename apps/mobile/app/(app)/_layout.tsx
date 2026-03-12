import { Stack } from "expo-router";

export default function AppStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#082f49" },
        headerTintColor: "#f8fafc",
        contentStyle: { backgroundColor: "#020617" }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="applications" options={{ title: "My Applications" }} />
      <Stack.Screen name="interviews" options={{ title: "Interviews" }} />
      <Stack.Screen name="offers" options={{ title: "Offers" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="matches/[id]" options={{ title: "Role Match" }} />
      <Stack.Screen name="onboarding/resume" options={{ title: "Upload Resume" }} />
      <Stack.Screen name="onboarding/profile-review" options={{ title: "Profile Review" }} />
      <Stack.Screen name="profile" options={{ title: "My Profile" }} />
    </Stack>
  );
}