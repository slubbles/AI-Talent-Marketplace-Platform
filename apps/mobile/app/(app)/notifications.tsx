import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTalentWorkflow } from "../providers/talent-workflow-provider";

export default function NotificationsScreen() {
  const { markNotificationRead, notifications, unreadCount } = useTalentWorkflow();

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <Text style={styles.eyebrow}>Notifications</Text>
      <Text style={styles.title}>Alerts synced from the platform</Text>
      <Text style={styles.copy}>Unread: {unreadCount}. New GraphQL notifications are also surfaced through Expo local alerts on supported devices.</Text>

      {notifications.length ? (
        notifications.map((notification) => (
          <View key={notification.id} style={[styles.card, !notification.read ? styles.cardUnread : null]}>
            <Text style={styles.cardTitle}>{notification.title}</Text>
            <Text style={styles.cardMeta}>{notification.type.replace(/_/g, " ")} • {new Date(notification.createdAt).toLocaleString()}</Text>
            <Text style={styles.cardCopy}>{notification.body}</Text>
            {!notification.read ? (
              <Pressable
                onPress={() => void markNotificationRead(notification.id).catch((mutationError) => {
                  Alert.alert("Could not mark notification", mutationError instanceof Error ? mutationError.message : "Try again.");
                })}
              >
                <Text style={styles.inlineAction}>Mark read</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No notifications yet</Text>
          <Text style={styles.cardCopy}>Match alerts, interview updates, and offers will appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617"
  },
  container: {
    padding: 24,
    paddingBottom: 40
  },
  eyebrow: {
    color: "#38bdf8",
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10
  },
  copy: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 16
  },
  card: {
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)"
  },
  cardUnread: {
    borderColor: "rgba(56, 189, 248, 0.5)"
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  cardMeta: {
    color: "#7dd3fc",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  cardCopy: {
    color: "#cbd5e1",
    lineHeight: 22
  },
  inlineAction: {
    color: "#38bdf8",
    fontWeight: "700",
    marginTop: 12
  }
});