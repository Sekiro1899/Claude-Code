import { View, Text, StyleSheet } from "react-native";

export default function QuestionnaireScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Questionnaire de Profilage</Text>
      <Text style={styles.subtitle}>
        9 questions pour identifier votre profil sportif
      </Text>
      <Text style={styles.placeholder}>
        Placeholder — sera implémenté en Session 2
      </Text>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});
