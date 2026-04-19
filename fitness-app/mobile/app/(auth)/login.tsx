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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-2">
          Strength App
        </Text>
        <Text className="text-base text-gray-500 text-center mb-10">
          Programme sportif personnalisé
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
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <Pressable
          className="bg-[#1565C0] rounded-xl py-4 items-center mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Se connecter
            </Text>
          )}
        </Pressable>

        <Pressable
          className="border-2 border-[#1565C0] rounded-xl py-4 items-center"
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text className="text-[#1565C0] text-base font-semibold">
            Créer un compte
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
