import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { BookPreview } from "components/common/bookPreview";
import { ThemedText } from "components/common/text";
import { Book, getReadingBooksProgress, ReadingBookProgress, searchBooks } from "utils/api";

function getAuthorName(book: Book) {
  if (!book.author) return "Автор не указан";
  return `${book.author.name} ${book.author.surname}`.trim();
}

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [readingBooks, setReadingBooks] = useState<ReadingBookProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getReadingBooksProgress().then(setReadingBooks).catch(() => setReadingBooks([]));
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setBooks([]);
      setError("");
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        setBooks(await searchBooks(term));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось выполнить поиск");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const progressByBook = new Map(readingBooks.map((item) => [item.book.book_id, item.progress]));

  return (
    <View className="bg-main-gray flex-1">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-[#3E4043]">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} className="w-9 h-9 items-center justify-center">
          <MaterialIcons name="chevron-left" size={30} color="white" />
        </TouchableOpacity>
        <View className="flex-1 h-11 rounded-[8px] bg-main-graySecond flex-row items-center px-3 gap-2">
          <Feather name="search" size={18} color="#8E959C" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Название книги или автор"
            placeholderTextColor="#8E959C"
            className="flex-1 text-white"
            style={{ fontFamily: "Rubik-Regular" }}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} className="w-7 h-7 items-center justify-center">
              <MaterialIcons name="close" size={20} color="#8E959C" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="flex-row items-center justify-between mt-6 mb-5">
          <ThemedText className="text-white text-[20px]" weight="bold">Поиск книг</ThemedText>
          {query.trim() && !isLoading ? <ThemedText className="text-main-textSecond text-[13px]">{books.length} найдено</ThemedText> : null}
        </View>

        {isLoading ? (
          <View className="h-52 items-center justify-center"><ActivityIndicator color="#F03A52" /></View>
        ) : error ? (
          <ThemedText className="text-main-brand">{error}</ThemedText>
        ) : !query.trim() ? (
          <View className="h-52 items-center justify-center gap-3">
            <Feather name="search" size={38} color="#8E959C" />
            <ThemedText className="text-main-textSecond text-center">Введите название книги или имя автора</ThemedText>
          </View>
        ) : books.length === 0 ? (
          <View className="h-52 items-center justify-center gap-3">
            <MaterialIcons name="menu-book" size={38} color="#8E959C" />
            <ThemedText className="text-main-textSecond text-center">Ничего не найдено. Попробуйте изменить запрос.</ThemedText>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-x-5 gap-y-6">
            {books.map((book) => (
              <BookPreview key={book.book_id} id={book.book_id.toString()} author={getAuthorName(book)} name={book.name} progress={progressByBook.get(book.book_id) ?? 0} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


