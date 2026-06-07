import { FC, useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Link } from "expo-router";

import { getBookCoverUrl } from "utils/api";
import { ThemedText } from "./text";
import ProgressCircleBar from "./progress";

interface BookPreviewProps {
  author: string;
  name: string;
  progress: number;
  id: string;
  className?: string;
}

export const BookPreview: FC<BookPreviewProps> = ({
  author = "Автор не указан",
  name = "Без названия",
  progress = 0,
  className = "",
  id,
}) => {
  const [hasCoverError, setHasCoverError] = useState(false);
  const coverUrl = getBookCoverUrl(id);

  useEffect(() => {
    setHasCoverError(false);
  }, [id]);

  return (
    <Link href={`/books/${id}`}>
      <View className={`flex flex-col gap-2 w-[120px] ${className}`}>
        <Image
          source={hasCoverError ? require("../../assets/book.jpg") : { uri: coverUrl }}
          style={{ width: 120, height: 175 }}
          className="rounded-xl"
          resizeMode="cover"
          onError={() => setHasCoverError(true)}
        />
        <View className="flex flex-col gap-1 w-full">
          <ThemedText className="text-[12px] text-main-textSecond w-full" numberOfLines={1} ellipsizeMode="tail" weight="semibold">
            {author}
          </ThemedText>
          <ThemedText className="text-[14px] text-white w-full" numberOfLines={1} ellipsizeMode="tail" weight="medium">
            {name}
          </ThemedText>
        </View>
        <View className="flex flex-row gap-2 items-center">
          <ProgressCircleBar progress={progress} />
          <ThemedText weight="medium" className="text-white">
            {progress}%
          </ThemedText>
        </View>
      </View>
    </Link>
  );
};
