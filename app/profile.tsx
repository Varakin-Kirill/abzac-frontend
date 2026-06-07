import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Avatar } from "components/common/avatar";
import { ThemedText } from "components/common/text";
import { getCurrentUser, getStats, logout, User, UserStats } from "utils/api";

const numberFormatter = new Intl.NumberFormat("ru-RU");

function formatNumber(value = 0) {
  return numberFormatter.format(value);
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async (refresh = false) => {
    setError("");
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [userData, statsData] = await Promise.all([
        getCurrentUser(),
        getStats(),
      ]);
      setUser(userData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить профиль");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <View className="bg-main-gray flex-1">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfile(true)}
          />
        }
      >
        <View className="mt-3 mb-6">
          <ThemedText className="text-white text-[24px]" weight="bold">
            Профиль
          </ThemedText>
        </View>

        {isLoading ? (
          <View className="h-72 items-center justify-center">
            <ActivityIndicator color="#F03A52" />
          </View>
        ) : error || !user || !stats ? (
          <View className="border border-[#3E4043] rounded-[8px] p-4 gap-4">
            <ThemedText className="text-main-brand text-[14px]">
              {error || "Не удалось загрузить профиль"}
            </ThemedText>
            <TouchableOpacity
              className="bg-main-brand rounded-[8px] py-3 items-center"
              onPress={() => loadProfile()}
            >
              <ThemedText className="text-white text-[14px]" weight="bold">
                Повторить
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View className="items-center gap-2 mb-7">
              <Avatar size="large" />
              <ThemedText className="text-white text-[22px]" weight="bold">
                {user.name}
              </ThemedText>
              <ThemedText className="text-main-textSecond text-[14px]">
                @{user.login}
              </ThemedText>
              <ThemedText className="text-main-textSecond text-[13px]">
                {user.email}
              </ThemedText>
            </View>

            <View className="flex-row border-y border-[#3E4043] py-4 mb-6">
              <StatItem value={stats.books_completed} label="Книг прочитано" />
              <StatItem value={stats.current_streak_days} label="Дней подряд" bordered />
              <StatItem value={stats.total_fragments_read} label="Фрагментов" />
            </View>

            <View className="gap-3 mb-7">
              <ThemedText className="text-white text-[17px]" weight="bold">
                Статистика чтения
              </ThemedText>
              <InfoRow label="Прочитано символов" value={formatNumber(stats.total_chars_read)} />
              <InfoRow label="Лучшая серия" value={`${stats.longest_streak_days} дн.`} />
              <InfoRow label="Верных ответов" value={stats.quiz_correct_total.toString()} />
            </View>

            <View className="gap-1">
              <TouchableOpacity
                className="flex-row items-center justify-between py-3"
                onPress={() => router.push("/achivements")}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-[8px] bg-main-brand items-center justify-center">
                    <MaterialIcons name="emoji-events" size={23} color="white" />
                  </View>
                  <ThemedText className="text-white text-[15px]">Достижения</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={28} color="#8E959C" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between py-3"
                onPress={handleLogout}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-[8px] bg-[#43464A] items-center justify-center">
                    <MaterialCommunityIcons name="logout" size={22} color="#F03A52" />
                  </View>
                  <ThemedText className="text-main-brand text-[15px]">Выйти из аккаунта</ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({
  value,
  label,
  bordered = false,
}: {
  value: number;
  label: string;
  bordered?: boolean;
}) {
  return (
    <View
      className={`w-1/3 items-center px-1 ${bordered ? "border-x border-[#3E4043]" : ""}`}
    >
      <ThemedText className="text-main-brand text-[20px]" weight="bold">
        {formatNumber(value)}
      </ThemedText>
      <ThemedText className="text-main-textSecond text-[12px] text-center" weight="bold">
        {label}
      </ThemedText>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-[#3E4043] py-3">
      <ThemedText className="text-main-textSecond text-[14px]">{label}</ThemedText>
      <ThemedText className="text-white text-[14px]" weight="bold">
        {value}
      </ThemedText>
    </View>
  );
}
