import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness App</Text>
      <Text style={styles.subtitle}>
        Programme sportif personnalisé
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/questionnaire")}
      >
        <Text style={styles.buttonText}>Commencer le questionnaire</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.push("/dashboard")}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
          Mon Dashboard
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 48,
  },
  button: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1565C0",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#1565C0",
  },
});
