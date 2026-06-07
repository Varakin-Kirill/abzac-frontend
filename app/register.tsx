import { useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "components/common/text";
import { login, register } from "utils/api";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedUsername || !trimmedEmail || !password) {
      setError("Заполните все поля");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Введите корректный email");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Пароли не совпадают");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await register({ name: trimmedName, login: trimmedUsername, email: trimmedEmail, password });
      await login(trimmedUsername, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось зарегистрироваться");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-main-gray" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
      <View className="mb-8">
        <TouchableOpacity className="w-10 h-10 items-center justify-center mb-4" onPress={() => router.replace("/login")}>
          <MaterialIcons name="chevron-left" size={32} color="white" />
        </TouchableOpacity>
        <View className="w-14 h-14 rounded-[8px] bg-main-brand items-center justify-center mb-5">
          <MaterialIcons name="person-add" size={28} color="white" />
        </View>
        <ThemedText className="text-white text-[28px]" weight="bold">Создать аккаунт</ThemedText>
        <ThemedText className="text-main-textSecond text-[14px] mt-2" weight="regular">
          Сохраняйте прогресс чтения и открывайте достижения
        </ThemedText>
      </View>

      <View className="gap-3">
        <Input label="Имя" value={name} onChangeText={setName} placeholder="Как к вам обращаться" />
        <Input label="Логин" value={username} onChangeText={setUsername} placeholder="Придумайте логин" autoCapitalize="none" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" />
        <Input label="Пароль" value={password} onChangeText={setPassword} placeholder="Минимум 6 символов" secureTextEntry />
        <Input label="Повторите пароль" value={passwordConfirmation} onChangeText={setPasswordConfirmation} placeholder="Введите пароль еще раз" secureTextEntry />

        {error ? <ThemedText className="text-main-brand text-[13px]">{error}</ThemedText> : null}

        <TouchableOpacity className="h-14 rounded-[8px] bg-main-brand items-center justify-center mt-2" disabled={isLoading} onPress={handleRegister}>
          {isLoading ? <ActivityIndicator color="white" /> : <ThemedText className="text-white text-[16px]" weight="bold">Зарегистрироваться</ThemedText>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Input({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View>
      <ThemedText className="text-main-textSecond mb-2 text-[13px]">{label}</ThemedText>
      <TextInput {...props} className="h-13 rounded-[8px] bg-main-graySecond px-4 text-white text-[15px]" placeholderTextColor="#8E959C" />
    </View>
  );
}
