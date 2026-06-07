import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";

import { Header } from "components/index/header";
import { BookPreview } from "components/common/bookPreview";
import { ProgressBar } from "components/common/progressBar";
import { ThemedText } from "components/common/text";
import { Book, getBookCoverUrl, getBooks, getReadingBooksProgress, hasAccessToken, ReadingBookProgress } from "utils/api";

function getAuthorName(book: Book) {
  if (!book.author) return "Автор не указан";
  return `${book.author.name} ${book.author.surname}`.trim();
}

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [readingBooks, setReadingBooks] = useState<ReadingBookProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hasContinueCoverError, setHasContinueCoverError] = useState(false);

  const loadBooks = useCallback(async (refresh = false) => {
    setError("");
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [bookData, progressData] = await Promise.all([getBooks(), getReadingBooksProgress()]);
      setBooks(bookData);
      setReadingBooks(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить библиотеку");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasAccessToken()) {
        router.replace("/login");
        return;
      }
      loadBooks();
    }, [loadBooks, router]),
  );

  const progressByBook = new Map(readingBooks.map((item) => [item.book.book_id, item.progress]));
  const continueReading = readingBooks.find((item) => !item.is_completed);

  useEffect(() => {
    setHasContinueCoverError(false);
  }, [continueReading?.book.book_id]);

  return (
    <View className="bg-main-gray flex-1">
      <Header />
      <ScrollView
        className="flex-1 mt-8"
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadBooks(true)} />}
      >
        {isLoading ? (
          <View className="h-72 items-center justify-center"><ActivityIndicator color="#F03A52" /></View>
        ) : error ? (
          <View className="px-6 gap-4">
            <ThemedText className="text-main-textSecond">{error}</ThemedText>
            <TouchableOpacity onPress={() => loadBooks()} className="h-12 bg-main-brand rounded-[8px] items-center justify-center">
              <ThemedText className="text-white">Повторить</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {continueReading ? (
              <View className="w-full self-stretch px-6 mb-8">
                <ThemedText className="text-white text-[20px] mb-3" weight="bold">Продолжить чтение</ThemedText>
                <TouchableOpacity className="w-full self-stretch flex-row gap-4 border border-[#3E4043] rounded-[8px] p-3" onPress={() => router.push(`/books/reader/${continueReading.book.book_id}`)}>
                  <Image
                    source={hasContinueCoverError ? require("../assets/book.jpg") : { uri: getBookCoverUrl(continueReading.book.book_id) }}
                    style={{ width: 72, height: 104, borderRadius: 6 }}
                    resizeMode="cover"
                    onError={() => setHasContinueCoverError(true)}
                  />
                  <View className="flex-1 justify-between py-1">
                    <View>
                      <ThemedText className="text-white text-[15px]" numberOfLines={2} weight="bold">{continueReading.book.name}</ThemedText>
                      <ThemedText className="text-main-textSecond text-[12px] mt-1" numberOfLines={1}>{getAuthorName(continueReading.book)}</ThemedText>
                    </View>
                    <View className="gap-2">
                      <View className="flex-row items-center justify-between">
                        <ThemedText className="text-main-textSecond text-[12px]">Прочитано</ThemedText>
                        <ThemedText className="text-main-brand text-[12px]" weight="bold">{continueReading.progress}%</ThemedText>
                      </View>
                      <ProgressBar progress={continueReading.progress} />
                    </View>
                  </View>
                  <View className="justify-center"><Feather name="book-open" size={20} color="#F03A52" /></View>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="flex-row items-center mb-2 px-6 justify-between">
              <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/books")}>
                <ThemedText className="text-[24px] text-white" weight="medium">Библиотека</ThemedText>
                <MaterialIcons className="mt-1" name="chevron-right" size={36} color="white" />
              </TouchableOpacity>
              <ThemedText className="text-main-textSecond text-[13px]">{books.length} книг</ThemedText>
            </View>
            <ScrollView horizontal alwaysBounceVertical={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ columnGap: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
              {books.map((book) => (
                <BookPreview id={book.book_id.toString()} key={book.book_id} author={getAuthorName(book)} name={book.name} progress={progressByBook.get(book.book_id) ?? 0} />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </View>
  );
}
