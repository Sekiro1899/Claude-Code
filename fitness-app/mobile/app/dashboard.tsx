import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "./_layout";
import { supabase } from "../lib/supabase";

const PROTOCOL_SCHEDULE: Record<string, string[]> = {
  upper_lower: ["upper", "lower", "upper", "lower"],
  full_body: ["full_body", "full_body", "full_body"],
  push_pull: ["push", "pull", "push", "pull"],
  push_pull_legs: ["push", "pull", "legs", "push", "pull", "legs"],
};

const FOCUS_LABELS: Record<string, string> = {
  upper: "Upper Body",
  lower: "Lower Body",
  full_body: "Full Body",
  push: "Push",
  pull: "Pull",
  legs: "Legs",
};

interface UserProgram {
  id: string;
  program_id: string;
  protocol: string;
  current_week: number;
  total_sessions_completed: number;
  programs: {
    name: string;
    icon: string;
    color: string;
    duration_weeks: number | null;
    is_continuous: boolean;
  };
  program_phases: {
    name: string;
    phase_number: number;
  };
}

function computeStreak(dates: (string | null)[]): number {
  const uniqueDays = [
    ...new Set(
      dates
        .filter((d): d is string => d !== null)
        .map((d) => new Date(d).toISOString().split("T")[0]),
    ),
  ].sort((a, b) => b.localeCompare(a));

  if (uniqueDays.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  if (uniqueDays[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    if (uniqueDays[0] !== yesterday) return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]).getTime();
    const curr = new Date(uniqueDays[i]).getTime();
    if (prev - curr === 86400000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function DashboardScreen() {
  const { session } = useSession();
  const [userProgram, setUserProgram] = useState<UserProgram | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session) return;

    const { data: up } = await supabase
      .from("user_programs")
      .select(
        "id, program_id, protocol, current_week, total_sessions_completed, programs(name, icon, color, duration_weeks, is_continuous), program_phases(name, phase_number)",
      )
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (up) setUserProgram(up as unknown as UserProgram);

    const { data: completedSessions } = await supabase
      .from("sessions")
      .select("completed_at")
      .eq("user_id", session.user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (completedSessions) {
      setStreak(computeStreak(completedSessions.map((s) => s.completed_at)));
    }
  }, [session]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  if (!userProgram) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-xl font-bold mb-2">Aucun programme actif</Text>
        <Text className="text-gray-500 text-center">
          Complétez le questionnaire pour recevoir votre programme personnalisé.
        </Text>
      </SafeAreaView>
    );
  }

  const schedule =
    PROTOCOL_SCHEDULE[userProgram.protocol] ?? ["full_body"];
  const nextFocus =
    schedule[userProgram.total_sessions_completed % schedule.length];
  const sessionLabel = FOCUS_LABELS[nextFocus] ?? nextFocus;
  const programColor = userProgram.programs?.color ?? "#1565C0";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text className="text-2xl font-bold mb-1">Mon programme</Text>
        <Text className="text-sm text-gray-500 mb-6">
          Bienvenue dans votre espace
        </Text>

        {/* Programme card */}
        <View
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: programColor + "15" }}
        >
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">
              {userProgram.programs?.icon}
            </Text>
            <View className="flex-1">
              <Text className="text-lg font-bold">
                {userProgram.programs?.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {userProgram.program_phases?.name}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="bg-white/80 rounded-lg px-3 py-2 flex-1">
              <Text className="text-xs text-gray-500">Phase</Text>
              <Text className="text-sm font-semibold">
                {userProgram.program_phases?.phase_number ?? 1}
              </Text>
            </View>
            <View className="bg-white/80 rounded-lg px-3 py-2 flex-1">
              <Text className="text-xs text-gray-500">Semaine</Text>
              <Text className="text-sm font-semibold">
                {userProgram.current_week}
              </Text>
            </View>
          </View>
        </View>

        {/* Next session card */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
          <Text className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Prochaine séance
          </Text>
          <Text className="text-lg font-bold mb-1">{sessionLabel}</Text>
          <Text className="text-sm text-gray-500 capitalize">{nextFocus}</Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center">
            <Text className="text-3xl mb-1">🔥</Text>
            <Text className="text-2xl font-bold">{streak}</Text>
            <Text className="text-xs text-gray-500">Streak</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center">
            <Text className="text-3xl mb-1">✅</Text>
            <Text className="text-2xl font-bold">
              {userProgram.total_sessions_completed}
            </Text>
            <Text className="text-xs text-gray-500">Complétées</Text>
          </View>
        </View>

        {/* Start session button */}
        <Pressable
          className="rounded-xl py-4 items-center"
          style={{ backgroundColor: programColor }}
          onPress={() =>
            Alert.alert(
              "Bientôt disponible",
              "Session player — à venir en S6",
            )
          }
        >
          <Text className="text-white text-base font-bold">
            Démarrer la séance
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
