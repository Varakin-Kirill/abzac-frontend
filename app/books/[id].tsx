import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ProgressBar } from "components/common/progressBar";
import { ThemedText } from "components/common/text";
import {
  addFavoriteBook,
  Book,
  BookReadingProgress,
  getBook,
  getBookCoverUrl,
  getBookReadingProgress,
  getFavoriteStatus,
  removeFavoriteBook,
} from "utils/api";
import { getReadingFragmentSize, READING_FRAGMENT_SIZE_OPTIONS, setReadingFragmentSize } from "utils/readingPreferences";

function getAuthorName(book?: Book | null) {
  if (!book?.author) return "Автор не указан";
  return `${book.author.name} ${book.author.surname}`.trim();
}

export default function BookDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [readingProgress, setReadingProgress] = useState<BookReadingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReadingSizeVisible, setIsReadingSizeVisible] = useState(false);
  const [readingSize, setReadingSize] = useState(() => getReadingFragmentSize());
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
  const [hasCoverError, setHasCoverError] = useState(false);

  const handleStartReading = () => {
    setReadingFragmentSize(readingSize);
    setIsReadingSizeVisible(false);
    router.push(`/books/reader/${id}`);
  };

  const handleToggleFavorite = async () => {
    if (!id || isFavoriteUpdating) return;
    setIsFavoriteUpdating(true);
    try {
      const result = isFavorite
        ? await removeFavoriteBook(id)
        : await addFavoriteBook(id);
      setIsFavorite(result.is_favorite);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить избранное");
    } finally {
      setIsFavoriteUpdating(false);
    }
  };
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [router]);

  useEffect(() => {
    setHasCoverError(false);
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function loadBook() {
      if (!id) return;
      setIsLoading(true);
      setError("");
      try {
        const [bookData, progressData, favoriteData] = await Promise.all([
          getBook(id),
          getBookReadingProgress(id).catch(() => null),
          getFavoriteStatus(id).catch(() => ({ is_favorite: false })),
        ]);
        if (isMounted) {
          setBook(bookData);
          setReadingProgress(progressData);
          setIsFavorite(favoriteData.is_favorite);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Не удалось загрузить книгу");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBook();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <View className="bg-main-gray flex-1 items-center justify-center">
        <ActivityIndicator color="#F03A52" />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View className="bg-main-gray flex-1 px-6 justify-center gap-4">
        <ThemedText className="text-white text-[20px]">Книга не открылась</ThemedText>
        <ThemedText className="text-main-textSecond">{error}</ThemedText>
        <TouchableOpacity onPress={handleBack} className="h-12 bg-main-brand rounded-lg items-center justify-center">
          <ThemedText className="text-white">Назад</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-main-gray flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} className="bg-main-gray">
        <View className="items-center pb-10">
          <View className="flex-row w-full justify-between pl-3 px-6">
            <TouchableOpacity onPress={handleBack}>
              <MaterialIcons name="chevron-left" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/search")} className="w-9 h-9 items-center justify-center">
              <Feather name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="mt-4 flex-col items-center gap-6">
            <Image
              source={hasCoverError || !id ? require("../../assets/book.jpg") : { uri: getBookCoverUrl(id) }}
              style={{ width: 120, height: 175, borderRadius: 12 }}
              resizeMode="cover"
              onError={() => setHasCoverError(true)}
            />
            <View className="items-center px-6">
              <ThemedText className="text-white text-[24px] text-center" weight="medium">
                {book.name}
              </ThemedText>
              <ThemedText weight="medium" className="text-main-textSecond text-[16px] mt-1">
                {getAuthorName(book)}
              </ThemedText>
            </View>

            <View className="flex-row gap-6">
              <TouchableOpacity
                className="items-center flex-col gap-2"
                disabled={isFavoriteUpdating}
                onPress={handleToggleFavorite}
              >
                <View className="bg-[#0000004D] w-[54px] h-[54px] rounded-full items-center justify-center">
                  {isFavoriteUpdating ? (
                    <ActivityIndicator color="#F03A52" />
                  ) : (
                    <MaterialIcons name={isFavorite ? "favorite" : "favorite-border"} size={25} color={isFavorite ? "#F03A52" : "white"} />
                  )}
                </View>
                <ThemedText className="text-[12px] text-white" weight="medium">
                  {isFavorite ? "В избранном" : "В избранное"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity className="items-center flex-col gap-2" onPress={() => setIsReadingSizeVisible(true)}>
                <View className="bg-main-brand w-[54px] h-[54px] rounded-full items-center justify-center">
                  <Feather name="book-open" size={24} color="white" />
                </View>
                <ThemedText className="text-[12px] text-white" weight="medium">
                  {readingProgress?.has_started ? "Продолжить" : "Читать"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <BottomPart description={book.description} genre={book.genre} readingProgress={readingProgress} />
      </ScrollView>
      <ReadingSizeModal
        visible={isReadingSizeVisible}
        value={readingSize}
        onChange={setReadingSize}
        onClose={() => setIsReadingSizeVisible(false)}
        onStart={handleStartReading}
      />
    </View>
  );
}

function ReadingSizeModal({
  visible,
  value,
  onChange,
  onClose,
  onStart,
}: {
  visible: boolean;
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
  onStart: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable className="bg-main-gray border-t border-[#3E4043] px-5 pt-5 pb-8" onPress={() => {}}>
          <View className="flex-row items-center justify-between mb-5">
            <ThemedText className="text-white text-[20px]" weight="bold">
              Объем фрагмента
            </ThemedText>
            <TouchableOpacity onPress={onClose} className="w-9 h-9 items-center justify-center">
              <MaterialIcons name="close" size={26} color="white" />
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            {READING_FRAGMENT_SIZE_OPTIONS.map((option) => {
              const isSelected = option.value === value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onChange(option.value)}
                  className={`min-h-[62px] border px-4 py-3 flex-row items-center justify-between ${isSelected ? "border-main-brand bg-main-graySecond" : "border-[#3E4043]"}`}
                >
                  <View>
                    <ThemedText className="text-white text-[15px]" weight="bold">
                      {option.label}
                    </ThemedText>
                    <ThemedText className="text-main-textSecond text-[12px] mt-1">
                      {option.description} · ~{option.value} символов
                    </ThemedText>
                  </View>
                  <MaterialIcons name={isSelected ? "radio-button-checked" : "radio-button-unchecked"} size={22} color={isSelected ? "#F03A52" : "#8E959C"} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={onStart} className="h-14 mt-5 bg-main-brand items-center justify-center rounded-lg">
            <ThemedText className="text-white" weight="bold">
              Начать чтение
            </ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const BottomPart = ({
  description,
  genre,
  readingProgress,
}: {
  description?: string;
  genre?: string;
  readingProgress?: BookReadingProgress | null;
}) => {
  const [mode, setMode] = useState<"book" | "progress">("book");

  return (
    <View>
      <View className="rounded-t-[24px] border-t-2 border-l border-r border-[#3E4043]" />

      <View className="w-full flex-row -mt-3">
        <TouchableOpacity className="w-[50%] items-center py-3" onPress={() => setMode("book")}>
          <View className={mode === "book" ? "border-b-2 p-1 border-b-main-brand" : "p-1"}>
            <ThemedText weight="medium" className={`text-center text-[16px] ${mode === "book" ? "text-white" : "text-main-graySecond"}`}>
              О книге
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="w-[50%] items-center py-3" onPress={() => setMode("progress")}>
          <View className={mode === "progress" ? "border-b-2 p-1 border-b-main-brand" : "p-1"}>
            <ThemedText weight="medium" className={`text-center text-[16px] ${mode === "progress" ? "text-white" : "text-main-graySecond"}`}>
              Прогресс
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>

      {mode === "book" && (
        <View className="px-6 mt-4 gap-3">
          {genre ? <ThemedText className="text-main-brand text-[14px]">{genre}</ThemedText> : null}
          <ThemedText className="text-white text-[14px]" weight="medium" style={{ lineHeight: 20 }}>
            {description || "Описание пока не добавлено."}
          </ThemedText>
        </View>
      )}

      {mode === "progress" && (
        <View className="px-6 gap-8">
          <View className="gap-2">
            <View className="flex-row justify-between">
              <ThemedText className="text-main-textSecond text-[14px]" weight="medium">
                Прогресс чтения
              </ThemedText>
              <ThemedText className="text-main-textSecond text-[14px]" weight="medium">
                {readingProgress ? `${readingProgress.progress}%` : "0%"}
              </ThemedText>
            </View>
            <ProgressBar progress={readingProgress?.progress ?? 0} />
          </View>

          <View className="gap-3">
            <View className="flex-row gap-2 items-center">
              <MaterialCommunityIcons name="fire" color="#FF6600" size={22} />
              <ThemedText className="text-[16px] text-white" weight="medium">
                Серия дней: {readingProgress?.current_streak_days ?? 0}
              </ThemedText>
            </View>
            <View className="flex-row gap-2 items-center">
              <MaterialCommunityIcons name="book-open-page-variant" color="#F03A52" size={22} />
              <ThemedText className="text-[16px] text-white" weight="medium">
                Прочитано символов: {readingProgress?.total_chars_read ?? 0}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};





