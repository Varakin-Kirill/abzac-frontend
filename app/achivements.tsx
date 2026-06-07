import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "components/common/text";
import { ProgressBar } from "components/common/progressBar";
import { Achievement, getAchievements, getStats, UserStats } from "utils/api";

const METRIC_LABELS: Record<string, string> = {
  fragments_read: "фрагментов",
  chars_read: "символов",
  reading_streak: "дней подряд",
  books_completed: "книг",
  quiz_correct: "верных ответов",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getMetricLabel(metric: string) {
  return METRIC_LABELS[metric] ?? "очков";
}

function getProgress(achievement: Achievement) {
  const next = achievement.next_threshold;
  const levels = achievement.counter_levels ?? [];
  const max = next ?? levels[levels.length - 1] ?? 1;
  if (!max) return 0;
  return Math.min(100, Math.round((achievement.current_value / max) * 100));
}

function getAchievementStatus(achievement: Achievement) {
  if (!achievement.levels_total) return "Без уровней";
  if (achievement.levels_claimed >= achievement.levels_total) return "Завершено";
  if (achievement.levels_claimed > 0) return `Уровень ${achievement.levels_claimed}`;
  return "В процессе";
}

function getAchievementHint(achievement: Achievement) {
  const label = getMetricLabel(achievement.metric);
  if (achievement.next_threshold == null) {
    return `Все уровни получены: ${formatNumber(achievement.current_value)} ${label}`;
  }

  const remaining = Math.max(0, achievement.next_threshold - achievement.current_value);
  return `До следующего уровня: ${formatNumber(remaining)} ${label}`;
}

function StatCard({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-1 min-w-[145px] border border-[#3E4043] rounded-[8px] p-4 gap-2 bg-main-gray">
      <MaterialIcons name={icon} size={22} color="#F03A52" />
      <ThemedText className="text-white text-[19px]" weight="bold">
        {value}
      </ThemedText>
      <ThemedText className="text-main-textSecond text-[12px]">
        {label}
      </ThemedText>
    </View>
  );
}

export default function Achivements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (refresh = false) => {
    setError("");
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [achievementData, statsData] = await Promise.all([
        getAchievements(),
        getStats(),
      ]);
      setAchievements(achievementData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить достижения");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const claimedLevels = useMemo(
    () => achievements.reduce((sum, item) => sum + item.levels_claimed, 0),
    [achievements],
  );
  const totalLevels = useMemo(
    () => achievements.reduce((sum, item) => sum + item.levels_total, 0),
    [achievements],
  );

  return (
    <View className="bg-main-gray flex-1">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
      >
        <View className="gap-2 mt-2 mb-6">
          <ThemedText className="text-white text-[24px]" weight="bold">
            Достижения
          </ThemedText>
          <ThemedText className="text-main-textSecond text-[14px]">
            Следите за серией чтения, прогрессом и результатами самопроверки.
          </ThemedText>
        </View>

        {isLoading ? (
          <View className="h-60 items-center justify-center">
            <ActivityIndicator color="#F03A52" />
          </View>
        ) : error ? (
          <ThemedText className="text-main-brand">{error}</ThemedText>
        ) : (
          <View className="gap-5">
            <View className="flex-row flex-wrap gap-3">
              <StatCard icon="local-fire-department" label="Текущая серия" value={`${stats?.current_streak_days ?? 0} дн.`} />
              <StatCard icon="emoji-events" label="Уровней получено" value={`${claimedLevels}/${totalLevels}`} />
              <StatCard icon="menu-book" label="Прочитано символов" value={formatNumber(stats?.total_chars_read ?? 0)} />
              <StatCard icon="fact-check" label="Верных ответов" value={formatNumber(stats?.quiz_correct_total ?? 0)} />
            </View>

            <View className="border border-[#3E4043] p-4 rounded-[8px] gap-3">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="fire" color="#FF6600" size={22} />
                <ThemedText className="text-white text-[16px]" weight="bold">
                  Серия чтения
                </ThemedText>
              </View>
              <ThemedText className="text-main-textSecond text-[14px]">
                Лучшая серия: {stats?.longest_streak_days ?? 0} дн. · Прочитано фрагментов: {stats?.total_fragments_read ?? 0} · Завершено книг: {stats?.books_completed ?? 0}
              </ThemedText>
            </View>

            <View className="gap-4">
              {achievements.map((achievement) => {
                const progress = getProgress(achievement);
                const target = achievement.next_threshold ?? achievement.counter_levels.at(-1) ?? 0;
                const isCompleted = achievement.levels_claimed >= achievement.levels_total && achievement.levels_total > 0;

                return (
                  <View key={achievement.code} className="border border-[#3E4043] p-4 rounded-[8px] gap-3">
                    <View className="flex-row items-start gap-3">
                      <View className={`w-11 h-11 rounded-[8px] items-center justify-center ${isCompleted ? "bg-main-brand" : "bg-main-graySecond"}`}>
                        <MaterialIcons
                          name={isCompleted ? "check" : "emoji-events"}
                          size={23}
                          color={isCompleted ? "white" : "#F03A52"}
                        />
                      </View>

                      <View className="flex-1 gap-1">
                        <View className="flex-row justify-between gap-3">
                          <ThemedText className="text-white text-[16px] flex-1" weight="bold">
                            {achievement.name}
                          </ThemedText>
                          <ThemedText className="text-main-brand text-[12px]" weight="bold">
                            {getAchievementStatus(achievement)}
                          </ThemedText>
                        </View>
                        <ThemedText className="text-main-textSecond text-[13px]" style={{ lineHeight: 18 }}>
                          {achievement.description}
                        </ThemedText>
                      </View>
                    </View>

                    <View className="gap-2">
                      <ProgressBar progress={progress} height={12} />
                      <View className="flex-row justify-between gap-2">
                        <ThemedText className="text-main-textSecond text-[12px] flex-1">
                          {getAchievementHint(achievement)}
                        </ThemedText>
                        <ThemedText className="text-main-textSecond text-[12px]">
                          {formatNumber(achievement.current_value)}{target ? ` / ${formatNumber(target)}` : ""}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
