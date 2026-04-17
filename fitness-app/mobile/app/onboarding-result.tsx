import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

interface PersonaData {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
}

interface ProgramData {
  name: string;
  tagline: string;
  duration_weeks: number | null;
  is_continuous: boolean;
  frequency_per_week_min: number;
  frequency_per_week_max: number;
  session_duration_min: number;
  session_duration_max: number;
}

export default function OnboardingResultScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const router = useRouter();

  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: p } = await supabase
        .from("personas")
        .select("name, tagline, description, icon, color, primary_program_id")
        .eq("id", personaId)
        .single();

      if (p) {
        setPersona(p as PersonaData);

        const { data: prog } = await supabase
          .from("programs")
          .select(
            "name, tagline, duration_weeks, is_continuous, frequency_per_week_min, frequency_per_week_max, session_duration_min, session_duration_max",
          )
          .eq("id", p.primary_program_id)
          .single();

        if (prog) setProgram(prog);
      }
      setLoading(false);
    }
    fetchData();
  }, [personaId]);

  if (loading || !persona || !program) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  const durationLabel = program.is_continuous
    ? "Programme continu"
    : `${program.duration_weeks} semaines`;

  const frequencyLabel =
    program.frequency_per_week_min === program.frequency_per_week_max
      ? `${program.frequency_per_week_min}x / semaine`
      : `${program.frequency_per_week_min}-${program.frequency_per_week_max}x / semaine`;

  const durationSessionLabel =
    program.session_duration_min === program.session_duration_max
      ? `${program.session_duration_min} min`
      : `${program.session_duration_min}-${program.session_duration_max} min`;

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <View className="items-center mb-8">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: persona.color + "20" }}
        >
          <Text className="text-5xl">{persona.icon}</Text>
        </View>
        <Text className="text-2xl font-bold text-center mb-1">
          {persona.name}
        </Text>
        <Text className="text-base text-gray-500 text-center mb-4">
          {persona.tagline}
        </Text>
        <Text className="text-sm text-gray-600 text-center leading-5 px-4">
          {persona.description}
        </Text>
      </View>

      <View
        className="rounded-2xl p-5 mb-10"
        style={{ backgroundColor: persona.color + "10" }}
      >
        <Text
          className="text-lg font-bold mb-3"
          style={{ color: persona.color }}
        >
          Votre programme
        </Text>
        <Text className="text-base font-semibold mb-1">{program.name}</Text>
        {program.tagline ? (
          <Text className="text-sm text-gray-500 mb-3">{program.tagline}</Text>
        ) : null}

        <View className="flex-row flex-wrap gap-2">
          <View className="bg-white rounded-lg px-3 py-2">
            <Text className="text-xs text-gray-500">Durée</Text>
            <Text className="text-sm font-semibold">{durationLabel}</Text>
          </View>
          <View className="bg-white rounded-lg px-3 py-2">
            <Text className="text-xs text-gray-500">Fréquence</Text>
            <Text className="text-sm font-semibold">{frequencyLabel}</Text>
          </View>
          <View className="bg-white rounded-lg px-3 py-2">
            <Text className="text-xs text-gray-500">Séance</Text>
            <Text className="text-sm font-semibold">
              {durationSessionLabel}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        className="rounded-xl py-4 items-center"
        style={{ backgroundColor: persona.color }}
        onPress={() => router.replace("/dashboard")}
      >
        <Text className="text-white text-base font-bold">
          Démarrer mon programme
        </Text>
      </Pressable>
    </View>
  );
}
