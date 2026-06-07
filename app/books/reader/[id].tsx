import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "components/common/text";
import { SwipeButton } from "components/common/swipeButton";
import {
  completeReading,
  getQuizQuestions,
  getReading,
  NewAchievement,
  QuizQuestion,
  QuizSubmitResponse,
  ReadingResponse,
  submitQuiz,
} from "utils/api";
import { getReadingFragmentSize } from "utils/readingPreferences";

export default function Reader() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [fragmentSize] = useState(() => getReadingFragmentSize());
  const [fragments, setFragments] = useState<ReadingResponse[]>([]);
  const [currentFragmentIndex, setCurrentFragmentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [quizChapter, setQuizChapter] = useState<number | null>(null);
  const [isQuizPromptVisible, setIsQuizPromptVisible] = useState(false);
  const [achievements, setAchievements] = useState<NewAchievement[]>([]);

  const reading = fragments[currentFragmentIndex] ?? null;
  const canGoBack = currentFragmentIndex > 0;
  const canGoForward = currentFragmentIndex < fragments.length - 1;
  const isLatestFragment = currentFragmentIndex === fragments.length - 1;

  const scrollToTop = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  const loadReading = useCallback(async () => {
    if (!id) return;
    setError("");
    setIsLoading(true);
    try {
      const data = await getReading(id, fragmentSize);
      setFragments([data]);
      setCurrentFragmentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фрагмент");
    } finally {
      setIsLoading(false);
    }
  }, [fragmentSize, id]);

  useEffect(() => {
    loadReading();
  }, [loadReading]);

  useEffect(() => {
    scrollToTop();
  }, [currentFragmentIndex]);

  const handlePrevious = () => {
    if (!canGoBack) return;
    setCurrentFragmentIndex((value) => value - 1);
  };

  const handleNext = () => {
    if (!canGoForward) return;
    setCurrentFragmentIndex((value) => value + 1);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(id ? `/books/${id}` : "/");
  };

  const handleComplete = async () => {
    if (!id || isCompleting) return;

    if (canGoForward) {
      handleNext();
      return;
    }

    setError("");
    setIsCompleting(true);
    try {
      const data = await completeReading(id, fragmentSize);
      setFragments((items) => [...items, data]);
      setCurrentFragmentIndex((value) => value + 1);
      setAchievements(data.new_achievements ?? []);
      if (data.quiz_chapter != null) {
        setQuizChapter(data.quiz_chapter);
        setIsQuizPromptVisible(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить прогресс");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <View className="flex-1 bg-main-gray">
      <View className="p-4 flex-row items-center justify-between">
        <View className="w-8 h-8" />

        <View className="items-center">
          <ThemedText className="text-white text-[16px]" weight="bold">
            Абзац
          </ThemedText>
          {reading ? (
            <ThemedText className="text-main-textSecond text-[12px]">
              {reading.progress} · серия {reading.streak_days ?? 0}
            </ThemedText>
          ) : null}
        </View>

        <TouchableOpacity onPress={handleClose}>
          <MaterialIcons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F03A52" />
        </View>
      ) : error && !reading ? (
        <View className="flex-1 px-6 justify-center gap-4">
          <ThemedText className="text-white text-[20px]">Фрагмент не загрузился</ThemedText>
          <ThemedText className="text-main-textSecond">{error}</ThemedText>
          <TouchableOpacity onPress={loadReading} className="h-12 bg-main-brand rounded-lg items-center justify-center">
            <ThemedText className="text-white">Повторить</ThemedText>
          </TouchableOpacity>
        </View>
      ) : reading?.is_completed ? (
        <View className="flex-1 px-6 justify-center gap-5">
          <View className="items-center gap-3">
            <MaterialIcons name="check-circle" size={58} color="#F03A52" />
            <ThemedText className="text-white text-[24px] text-center" weight="bold">
              Книга прочитана
            </ThemedText>
            <ThemedText className="text-main-textSecond text-center" style={{ lineHeight: 20 }}>
              Отличная работа. Прогресс сохранен, а результат учтен в вашей статистике.
            </ThemedText>
          </View>

          <View className="border-y border-[#3E4043] py-4 flex-row">
            <View className="w-1/2 items-center border-r border-[#3E4043]">
              <ThemedText className="text-main-brand text-[20px]" weight="bold">100%</ThemedText>
              <ThemedText className="text-main-textSecond text-[12px]">Прогресс</ThemedText>
            </View>
            <View className="w-1/2 items-center">
              <ThemedText className="text-main-brand text-[20px]" weight="bold">
                {reading.streak_days ?? 0}
              </ThemedText>
              <ThemedText className="text-main-textSecond text-[12px]">Дней подряд</ThemedText>
            </View>
          </View>

          {canGoBack ? (
            <ReaderControls
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              currentIndex={currentFragmentIndex}
              total={fragments.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          ) : null}

          <View className="gap-3">
            <TouchableOpacity className="h-13 bg-main-brand rounded-[8px] flex-row items-center justify-center gap-2 py-4" onPress={() => router.replace("/")}>
              <MaterialIcons name="home" size={21} color="white" />
              <ThemedText className="text-white" weight="bold">В библиотеку</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity className="h-13 border border-[#3E4043] rounded-[8px] flex-row items-center justify-center gap-2 py-4" onPress={() => router.replace("/achivements")}>
              <MaterialIcons name="emoji-events" size={21} color="#F03A52" />
              <ThemedText className="text-white" weight="bold">Посмотреть достижения</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1 px-4">
          <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
            <View className="border border-[#3E4043] p-5 rounded-2xl">
              <ThemedText className="text-white text-[18px]" style={{ lineHeight: 28 }} weight="regular">
                {reading?.text || "Фрагмент пуст."}
              </ThemedText>
            </View>

            {error ? <ThemedText className="text-main-brand mt-4">{error}</ThemedText> : null}

            <View className="mt-6 gap-3">
              <ReaderControls
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                currentIndex={currentFragmentIndex}
                total={fragments.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />

              <View className="flex-row justify-between">
                <ThemedText className="text-main-textSecond text-[13px]">
                  {isLatestFragment ? "После подтверждения" : "Просмотренный фрагмент"}
                </ThemedText>
                <ThemedText className="text-main-brand text-[13px]">
                  {reading?.pending_progress ?? reading?.progress}
                </ThemedText>
              </View>

              {isCompleting ? (
                <View className="h-[64px] rounded-full bg-main-graySecond items-center justify-center">
                  <ActivityIndicator color="#F03A52" />
                </View>
              ) : isLatestFragment ? (
                <SwipeButton text="Отметить прочитанным" onSwipe={handleComplete} />
              ) : null}
            </View>
          </ScrollView>
        </View>
      )}

      <QuizPromptModal
        visible={isQuizPromptVisible}
        chapter={quizChapter}
        onSkip={() => setIsQuizPromptVisible(false)}
        onStart={() => {
          setIsQuizPromptVisible(false);
          setIsQuizVisible(true);
        }}
      />
      <QuizModal
        visible={isQuizVisible}
        bookId={id}
        reading={reading}
        quizChapter={quizChapter}
        onClose={() => setIsQuizVisible(false)}
        onAchievements={setAchievements}
      />
      <AchievementModal achievements={achievements} onClose={() => setAchievements([])} />
    </View>
  );
}

function ReaderControls({
  canGoBack,
  canGoForward,
  currentIndex,
  total,
  onPrevious,
  onNext,
}: {
  canGoBack: boolean;
  canGoForward: boolean;
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View className="h-[52px] flex-row items-center justify-between rounded-full bg-main-graySecond px-2">
      <TouchableOpacity
        disabled={!canGoBack}
        onPress={onPrevious}
        className={`w-11 h-11 items-center justify-center rounded-full ${canGoBack ? "bg-main-brand" : "bg-[#3E4043]"}`}
      >
        <MaterialIcons name="arrow-back" size={22} color={canGoBack ? "white" : "#8E959C"} />
      </TouchableOpacity>

      <ThemedText className="text-main-textSecond text-[13px]">
        {currentIndex + 1} / {Math.max(total, 1)}
      </ThemedText>

      <TouchableOpacity
        disabled={!canGoForward}
        onPress={onNext}
        className={`w-11 h-11 items-center justify-center rounded-full ${canGoForward ? "bg-main-brand" : "bg-[#3E4043]"}`}
      >
        <MaterialIcons name="arrow-forward" size={22} color={canGoForward ? "white" : "#8E959C"} />
      </TouchableOpacity>
    </View>
  );
}

function QuizPromptModal({
  visible,
  chapter,
  onSkip,
  onStart,
}: {
  visible: boolean;
  chapter: number | null;
  onSkip: () => void;
  onStart: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View className="flex-1 bg-black/60 px-5 items-center justify-center">
        <View className="bg-main-gray border border-[#3E4043] rounded-[8px] p-5 w-full gap-4">
          <View className="flex-row items-center gap-3">
            <MaterialIcons name="quiz" size={28} color="#F03A52" />
            <ThemedText className="text-white text-[19px]" weight="bold">
              Глава завершена
            </ThemedText>
          </View>
          <ThemedText className="text-main-textSecond" style={{ lineHeight: 21 }}>
            {chapter != null ? `Вы закончили главу ${chapter}. ` : ""}
            Хотите пройти короткую самопроверку по прочитанному?
          </ThemedText>
          <TouchableOpacity className="bg-main-brand rounded-[8px] py-3 items-center" onPress={onStart}>
            <ThemedText className="text-white" weight="bold">Пройти самопроверку</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity className="py-2 items-center" onPress={onSkip}>
            <ThemedText className="text-main-textSecond">Пропустить</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
function QuizModal({
  visible,
  bookId,
  reading,
  quizChapter,
  onClose,
  onAchievements,
}: {
  visible: boolean;
  bookId?: string;
  reading: ReadingResponse | null;
  quizChapter: number | null;
  onClose: () => void;
  onAchievements: (achievements: NewAchievement[]) => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadQuestions = useCallback(async () => {
    if (!bookId || !reading || quizChapter == null) return;
    setIsLoading(true);
    setError("");
    setQuestions([]);
    setAnswers({});
    setResult(null);
    try {
      const data = await getQuizQuestions(
        bookId,
        quizChapter,
        0,
      );
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить вопросы");
    } finally {
      setIsLoading(false);
    }
  }, [bookId, quizChapter, reading]);

  useEffect(() => {
    if (visible) loadQuestions();
  }, [loadQuestions, visible]);

  const handleSubmit = async () => {
    if (!bookId || !reading || quizChapter == null || isSubmitting) return;
    if (questions.some((question) => !answers[question.question_id])) {
      setError("Ответьте на все вопросы перед отправкой");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const data = await submitQuiz(bookId, {
        reading_id: reading.reading_id,
        chapter: quizChapter,
        current_paragraph: 0,
        paragraph_offset: 0,
        answers: questions.map((question) => ({
          question_id: question.question_id,
          option_id: answers[question.question_id],
        })),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить ответы");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result?.new_achievements.length) {
      onAchievements(result.new_achievements);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60 px-4 py-8 items-center justify-center">
        <View className="bg-main-gray rounded-[8px] w-full max-h-full border border-[#3E4043] overflow-hidden">
          <View className="flex-row items-center justify-between border-b border-[#3E4043] px-5 py-4">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="quiz" size={24} color="#F03A52" />
              <ThemedText className="text-white text-[18px]" weight="bold">
                Самопроверка
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} className="h-9 w-9 items-center justify-center">
              <MaterialIcons name="close" size={26} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5" contentContainerStyle={{ paddingVertical: 18 }}>
            {isLoading ? (
              <View className="h-44 items-center justify-center">
                <ActivityIndicator color="#F03A52" />
              </View>
            ) : result ? (
              <View className="gap-4">
                <View className="items-center gap-2 py-3">
                  <MaterialIcons name="fact-check" size={46} color="#F03A52" />
                  <ThemedText className="text-white text-[22px]" weight="bold">
                    {result.correct} из {result.total}
                  </ThemedText>
                  <ThemedText className="text-main-textSecond text-center">
                    Итог: {result.score_percent}%
                  </ThemedText>
                </View>
                <View className="rounded-[8px] bg-main-graySecond px-4 py-3">
                  <ThemedText className="text-white text-center" weight="bold">
                    {result.score_percent >= 80 ? "Материал усвоен" : result.score_percent >= 50 ? "Неплохо, но главу стоит повторить" : "Лучше перечитать главу"}
                  </ThemedText>
                </View>
                {result.results.some((item) => !item.is_correct) ? (
                  <View className="gap-3">
                    <ThemedText className="text-white text-[15px]" weight="bold">
                      Разбор ошибок
                    </ThemedText>
                    {result.results.map((item, index) =>
                      item.is_correct ? null : (
                        <View key={item.question_id} className="border-l-2 border-main-brand pl-3 py-1 gap-1">
                          <ThemedText className="text-white text-[14px]">
                            {index + 1}. {questions[index]?.question_text}
                          </ThemedText>
                          <ThemedText className="text-main-textSecond text-[13px]">
                            {item.explanation || "Попробуйте перечитать фрагмент"}
                          </ThemedText>
                        </View>
                      ),
                    )}
                  </View>
                ) : (
                  <ThemedText className="text-main-textSecond text-center">
                    Отличный результат: все ответы верные.
                  </ThemedText>
                )}
              </View>
            ) : questions.length ? (
              <View className="gap-6">
                <ThemedText className="text-main-textSecond text-[13px]">
                  Вопросы относятся к завершенной главе. Прохождение необязательно, но помогает закрепить материал.
                </ThemedText>
                {questions.map((question, index) => (
                  <View key={question.question_id} className="gap-3">
                    <ThemedText className="text-white text-[15px]" weight="bold">
                      {index + 1}. {question.question_text}
                    </ThemedText>
                    <View className="gap-2">
                      {question.options.map((option) => {
                        const selected = answers[question.question_id] === option.option_id;
                        return (
                          <TouchableOpacity
                            key={option.option_id}
                            className={`border rounded-[8px] px-4 py-3 ${
                              selected ? "border-main-brand bg-main-graySecond" : "border-[#3E4043]"
                            }`}
                            onPress={() =>
                              setAnswers((current) => ({
                                ...current,
                                [question.question_id]: option.option_id,
                              }))
                            }
                          >
                            <ThemedText className={selected ? "text-white" : "text-main-textSecond"}>
                              {option.option_text}
                            </ThemedText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="h-36 items-center justify-center gap-2">
                <MaterialIcons name="menu-book" size={36} color="#8E959C" />
                <ThemedText className="text-white text-center" weight="bold">
                  Для этой главы вопросов пока нет
                </ThemedText>
                <ThemedText className="text-main-textSecond text-[13px] text-center">
                  Продолжайте чтение: самопроверка появится для подготовленных глав.
                </ThemedText>
              </View>
            )}

            {error ? <ThemedText className="text-main-brand mt-4">{error}</ThemedText> : null}
          </ScrollView>

          <View className="border-t border-[#3E4043] px-5 py-4">
            {result ? (
              <TouchableOpacity className="bg-main-brand rounded-[8px] py-3 items-center" onPress={handleClose}>
                <ThemedText className="text-white" weight="bold">Готово</ThemedText>
              </TouchableOpacity>
            ) : questions.length ? (
              <TouchableOpacity
                className="bg-main-brand rounded-[8px] py-3 items-center"
                disabled={isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText className="text-white" weight="bold">Проверить ответы</ThemedText>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="bg-main-graySecond rounded-[8px] py-3 items-center" onPress={handleClose}>
                <ThemedText className="text-white">Закрыть</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
function AchievementModal({ achievements, onClose }: { achievements: NewAchievement[]; onClose: () => void }) {
  return (
    <Modal visible={achievements.length > 0} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-6" onPress={onClose}>
        <View className="bg-main-gray p-6 rounded-2xl w-full border border-main-brand" onStartShouldSetResponder={() => true}>
          <ThemedText className="text-white text-[20px] mb-4" weight="bold">
            Новое достижение
          </ThemedText>
          <View className="gap-3">
            {achievements.map((achievement) => (
              <View key={`${achievement.code}-${achievement.level_index}`} className="bg-main-graySecond rounded-lg p-4">
                <ThemedText className="text-white text-[16px]" weight="bold">
                  {achievement.name}
                </ThemedText>
                <ThemedText className="text-main-textSecond text-[13px] mt-1">
                  Порог: {achievement.threshold}
                </ThemedText>
              </View>
            ))}
          </View>
          <TouchableOpacity className="mt-6 bg-main-brand p-3 rounded-lg" onPress={onClose}>
            <ThemedText className="text-white text-center">Отлично</ThemedText>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}








