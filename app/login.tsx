import { useState } from "react";
import { ActivityIndicator, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "components/common/text";
import { login } from "utils/api";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-main-gray px-6 justify-center">
      <View className="mb-10">
        <View className="w-14 h-14 rounded-2xl bg-main-brand items-center justify-center mb-5">
          <MaterialIcons name="menu-book" size={30} color="white" />
        </View>
        <ThemedText className="text-white text-[32px]" weight="bold">
          ABZAC
        </ThemedText>
        <ThemedText className="text-main-textSecond text-[15px] mt-2" weight="regular">
          Войдите, чтобы продолжить чтение и сохранить прогресс
        </ThemedText>
      </View>

      <View className="gap-4">
        <View>
          <ThemedText className="text-main-textSecond mb-2 text-[13px]">Логин</ThemedText>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            className="h-14 rounded-lg bg-main-graySecond px-4 text-white text-[16px]"
            placeholder="Введите логин"
            placeholderTextColor="#8E959C"
          />
        </View>

        <View>
          <ThemedText className="text-main-textSecond mb-2 text-[13px]">Пароль</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="h-14 rounded-lg bg-main-graySecond px-4 text-white text-[16px]"
            placeholder="Введите пароль"
            placeholderTextColor="#8E959C"
          />
        </View>

        {error ? (
          <ThemedText className="text-main-brand text-[13px]">{error}</ThemedText>
        ) : null}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading || !username || !password}
          className="h-14 rounded-lg bg-main-brand items-center justify-center mt-2 opacity-100"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText className="text-white text-[16px]" weight="bold">
              Войти
            </ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="items-center py-3" onPress={() => router.push("/register")}>
          <ThemedText className="text-main-textSecond text-[14px]">
            Нет аккаунта? <ThemedText className="text-main-brand" weight="bold">Зарегистрироваться</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}



