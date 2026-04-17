import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}

export interface WorkoutRequest {
  user_id: string;
  user_program_id: string;
  persona_id: string;
  program_id: string;
  phase_id?: string;
  week_number?: number;
  day_number?: number;
  protocol?: string;
  focus?: string;
  energy_level?: number;
  available_equipment?: string[];
}

export interface ExerciseBlock {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  load_pct_1rm: number | null;
  rest_sec: number | null;
  superset_with: string | null;
  notes: string | null;
}

export interface WorkoutResponse {
  session_id: string;
  program_id: string;
  phase_id: string;
  protocol: string;
  focus: string;
  session_label: string;
  warmup_block: ExerciseBlock[];
  main_block: ExerciseBlock[];
  core_block: ExerciseBlock[];
  finisher_block: ExerciseBlock[];
}

export async function generateWorkout(
  params: WorkoutRequest,
): Promise<WorkoutResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/workout/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}
