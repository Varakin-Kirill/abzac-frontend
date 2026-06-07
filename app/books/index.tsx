import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { BookPreview } from "components/common/bookPreview";
import { ThemedText } from "components/common/text";
import { Book, getBooks, getReadingBooksProgress, hasAccessToken, ReadingBookProgress } from "utils/api";

function getAuthorName(book: Book) {
  if (!book.author) return "Автор не указан";
  return `${book.author.name} ${book.author.surname}`.trim();
}

export default function BooksCatalog() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [readingBooks, setReadingBooks] = useState<ReadingBookProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async (refresh = false) => {
    setError("");
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [bookData, progressData] = await Promise.all([getBooks(), getReadingBooksProgress()]);
      setBooks(bookData);
      setReadingBooks(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить каталог");
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

  return (
    <View className="bg-main-gray flex-1">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#3E4043]">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} className="w-9 h-9 items-center justify-center">
            <MaterialIcons name="chevron-left" size={30} color="white" />
          </TouchableOpacity>
          <ThemedText className="text-white text-[20px]" weight="bold">Библиотека</ThemedText>
        </View>
        <TouchableOpacity onPress={() => router.push("/search")} className="w-10 h-10 rounded-full bg-main-graySecond items-center justify-center">
          <Feather name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadBooks(true)} />}
      >
        <View className="flex-row items-center justify-between mt-6 mb-5">
          <ThemedText className="text-main-textSecond text-[14px]">Все книги</ThemedText>
          <ThemedText className="text-main-textSecond text-[13px]">{books.length} книг</ThemedText>
        </View>

        {isLoading ? (
          <View className="h-64 items-center justify-center"><ActivityIndicator color="#F03A52" /></View>
        ) : error ? (
          <View className="border border-[#3E4043] rounded-[8px] p-4 gap-4">
            <ThemedText className="text-main-brand">{error}</ThemedText>
            <TouchableOpacity className="bg-main-brand rounded-[8px] py-3 items-center" onPress={() => loadBooks()}>
              <ThemedText className="text-white" weight="bold">Повторить</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-x-5 gap-y-6">
            {books.map((book) => (
              <BookPreview
                key={book.book_id}
                id={book.book_id.toString()}
                author={getAuthorName(book)}
                name={book.name}
                progress={progressByBook.get(book.book_id) ?? 0}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
