import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email,
        onboarding_completed: false,
      });
    }

    router.replace("/questionnaire");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-2">
          Créer un compte
        </Text>
        <Text className="text-base text-gray-500 text-center mb-10">
          Commencez votre programme personnalisé
        </Text>

        {error ? (
          <Text className="text-red-500 text-sm text-center mb-4">
            {error}
          </Text>
        ) : null}

        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 text-base mb-4"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 text-base mb-6"
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        <Pressable
          className="bg-[#1565C0] rounded-xl py-4 items-center mb-4"
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              S'inscrire
            </Text>
          )}
        </Pressable>

        <Pressable
          className="py-4 items-center"
          onPress={() => router.back()}
        >
          <Text className="text-[#1565C0] text-base">
            Déjà un compte ? Se connecter
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
