import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "./_layout";
import { supabase } from "../lib/supabase";

interface Question {
  id: string;
  question_number: number;
  text: string;
  type: string;
}

interface Option {
  id: string;
  question_id: string;
  label: string;
  value: string;
  score_smb: number;
  score_bf: number;
  score_aw: number;
  score_cr: number;
  score_sav: number;
}

const PERSONA_CODES = ["CR", "SMB", "AW", "BF", "SAV"] as const;

const CODE_TO_ID: Record<string, string> = {
  CR: "persona_cr",
  SMB: "persona_smb",
  AW: "persona_aw",
  BF: "persona_bf",
  SAV: "persona_sav",
};

export default function QuestionnaireScreen() {
  const { session } = useSession();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [qRes, oRes] = await Promise.all([
        supabase
          .from("questionnaire_questions")
          .select("*")
          .order("question_number"),
        supabase.from("questionnaire_options").select("*"),
      ]);
      if (qRes.data) setQuestions(qRes.data);
      if (oRes.data) setOptions(oRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  const question = questions[currentIndex];
  const questionOptions = options.filter(
    (o) => o.question_id === question?.id,
  );
  const isMultiple = question?.type === "multiple_choice";
  const isLast = currentIndex === questions.length - 1;
  const currentAnswer = answers[question?.id];

  function selectOption(value: string) {
    if (!question) return;
    if (isMultiple) {
      const current = (answers[question.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [question.id]: updated });
    } else {
      setAnswers({ ...answers, [question.id]: value });
    }
  }

  function isSelected(value: string): boolean {
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.includes(value);
    return currentAnswer === value;
  }

  function hasAnswer(): boolean {
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    return true;
  }

  async function handleNext() {
    if (!hasAnswer()) return;

    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    await submitQuestionnaire();
  }

  async function submitQuestionnaire() {
    if (!session) return;
    setSubmitting(true);

    try {
      const scores = { SMB: 0, BF: 0, AW: 0, CR: 0, SAV: 0 };

      for (const [qId, answer] of Object.entries(answers)) {
        const selectedValues = Array.isArray(answer) ? answer : [answer];
        for (const val of selectedValues) {
          const opt = options.find(
            (o) => o.question_id === qId && o.value === val,
          );
          if (opt) {
            scores.SMB += opt.score_smb ?? 0;
            scores.BF += opt.score_bf ?? 0;
            scores.AW += opt.score_aw ?? 0;
            scores.CR += opt.score_cr ?? 0;
            scores.SAV += opt.score_sav ?? 0;
          }
        }
      }

      const maxScore = Math.max(...Object.values(scores));
      const winner = PERSONA_CODES.find((p) => scores[p] === maxScore)!;
      const personaId = CODE_TO_ID[winner];

      const { data: persona } = await supabase
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .single();

      if (!persona) throw new Error("Persona not found");

      const { data: firstPhase } = await supabase
        .from("program_phases")
        .select("id")
        .eq("program_id", persona.primary_program_id)
        .order("phase_number")
        .limit(1)
        .single();

      const { data: program } = await supabase
        .from("programs")
        .select("default_protocol")
        .eq("id", persona.primary_program_id)
        .single();

      await supabase.from("users").upsert({
        id: session.user.id,
        email: session.user.email,
        persona_id: persona.id,
        questionnaire_answers: answers,
        questionnaire_scores: scores,
        onboarding_completed: true,
      });

      await supabase.from("user_programs").insert({
        user_id: session.user.id,
        program_id: persona.primary_program_id,
        persona_id: persona.id,
        protocol: program?.default_protocol,
        status: "active",
        current_phase_id: firstPhase?.id,
        current_week: 1,
        total_sessions_completed: 0,
      });

      router.replace({
        pathname: "/onboarding-result",
        params: { personaId: persona.id },
      });
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = (currentIndex + 1) / questions.length;

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-sm text-gray-500 mb-2 text-center">
          Question {currentIndex + 1} / {questions.length}
        </Text>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-[#1565C0] rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24 }}
      >
        <Text className="text-xl font-bold mb-6">{question?.text}</Text>

        {isMultiple && (
          <Text className="text-sm text-gray-500 mb-4">
            Plusieurs réponses possibles
          </Text>
        )}

        {questionOptions.map((opt) => (
          <Pressable
            key={opt.id}
            className={`border-2 rounded-xl py-4 px-4 mb-3 ${
              isSelected(opt.value)
                ? "border-[#1565C0] bg-blue-50"
                : "border-gray-200"
            }`}
            onPress={() => selectOption(opt.value)}
          >
            <Text
              className={`text-base ${
                isSelected(opt.value)
                  ? "text-[#1565C0] font-semibold"
                  : "text-gray-800"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="px-6 pb-8 pt-4 flex-row gap-3">
        {currentIndex > 0 && (
          <Pressable
            className="flex-1 border-2 border-gray-300 rounded-xl py-4 items-center"
            onPress={() => setCurrentIndex(currentIndex - 1)}
          >
            <Text className="text-gray-600 text-base font-semibold">
              Retour
            </Text>
          </Pressable>
        )}

        <Pressable
          className={`flex-1 rounded-xl py-4 items-center ${
            hasAnswer() ? "bg-[#1565C0]" : "bg-gray-300"
          }`}
          onPress={handleNext}
          disabled={!hasAnswer() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {isLast ? "Terminer" : "Suivant"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
