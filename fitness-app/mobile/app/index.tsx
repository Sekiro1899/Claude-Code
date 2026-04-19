import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "./_layout";
import { supabase } from "../lib/supabase";

export default function IndexScreen() {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)/login");
      return;
    }

    supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.onboarding_completed) {
          router.replace("/dashboard");
        } else {
          router.replace("/questionnaire");
        }
        setChecking(false);
      });
  }, [session, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#1565C0" />
    </View>
  );
}
