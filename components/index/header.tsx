import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Avatar } from "components/common/avatar";
import { ThemedText } from "components/common/text";
import { getCurrentUser } from "utils/api";

export const Header = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (isMounted) setUserName(user.name || user.login);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-row justify-between px-4">
      <TouchableOpacity className="flex-row items-center gap-4" onPress={() => router.push("/profile")}>
        <Avatar />
        <View className="gap-1">
          <ThemedText className="text-white text-[16px]" weight="medium">
            {userName ? `Привет, ${userName}` : "Добро пожаловать"}
          </ThemedText>
          <ThemedText className="text-[#A29F9F] text-[12px]">
            Выберите книгу и продолжайте читать
          </ThemedText>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-main-graySecond w-10 h-10 rounded-full items-center justify-center"
        onPress={() => router.push("/search")}
      >
        <Feather name="search" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

