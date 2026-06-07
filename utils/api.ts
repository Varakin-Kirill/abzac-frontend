const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "abzac_access_token";

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export type Author = {
  author_id: number;
  name: string;
  surname: string;
  description?: string;
};

export type Book = {
  book_id: number;
  name: string;
  description: string;
  genre: string;
  book_path: string;
  author_id?: number | null;
  author?: Author | null;
  meta?: Record<string, unknown>;
};

export type User = {
  user_id: number;
  name: string;
  login: string;
  email: string;
};

export type ReadingResponse = {
  reading_id: number;
  message?: string;
  text: string;
  next_text: string;
  current_chapter: number;
  current_paragraph: number;
  paragraph_offset: number;
  next_chapter?: number;
  next_paragraph?: number;
  next_paragraph_offset?: number;
  fragment_chars?: number;
  completed_fragment_chars?: number;
  quiz_chapter?: number | null;
  total_chars_read: number;
  prev_chars_read?: number;
  is_completed: boolean;
  will_complete?: boolean;
  progress: string;
  pending_progress?: string;
  streak_days?: number | null;
  new_achievements: NewAchievement[];
};


export type ReadingBookProgress = {
  book: Book;
  progress: number;
  total_chars_read: number;
  is_completed: boolean;
  updated_at: string;
};
export type BookReadingProgress = {
  has_started: boolean;
  progress: number;
  total_chars_read: number;
  current_streak_days: number;
  is_completed: boolean;
};

export type NewAchievement = {
  code: string;
  name: string;
  level_index: number;
  threshold: number;
};

export type UserStats = {
  user_id: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_reading_date: string | null;
  total_fragments_read: number;
  total_chars_read: number;
  books_completed: number;
  quiz_correct_total: number;
};


export type QuizOption = {
  option_id: number;
  option_text: string;
};

export type QuizQuestion = {
  question_id: number;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "short_answer";
  options: QuizOption[];
};

export type QuizAnswer = {
  question_id: number;
  option_id?: number;
  answer_text?: string;
};

export type QuizSubmitResponse = {
  total: number;
  correct: number;
  results: {
    question_id: number;
    is_correct: boolean;
    explanation?: string | null;
  }[];
  score_percent: number;
  new_achievements: NewAchievement[];
};
export type Achievement = {
  achievement_id: number;
  code: string;
  name: string;
  description: string;
  image_url: string;
  metric: string;
  counter_levels: number[];
  current_value: number;
  last_claimed_level_index: number;
  next_threshold: number | null;
  levels_claimed: number;
  levels_total: number;
};

function getStoredToken() {
  if (accessToken) return accessToken;
  if (typeof localStorage === "undefined") return null;
  accessToken = localStorage.getItem(TOKEN_KEY);
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(getStoredToken());
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      setAccessToken(null);
      unauthorizedHandler?.();
    }

    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}


export async function register(payload: {
  name: string;
  login: string;
  email: string;
  password: string;
}) {
  return request<User>("/user/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    auth: false,
  });
}
export async function login(username: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);

  const result = await request<{ access_token: string; token_type: string }>(
    "/user/login",
    {
      method: "POST",
      body: body.toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: false,
    },
  );

  setAccessToken(result.access_token);
  return result;
}

export function logout() {
  setAccessToken(null);
}

export function getCurrentUser() {
  return request<User>("/user/");
}

export function getBooks() {
  return request<Book[]>("/book/?limit=100", { auth: false });
}

export function getBook(bookId: string | number) {
  return request<Book>(`/book/${bookId}`, { auth: false });
}

export function getBookReadingProgress(bookId: string | number) {
  return request<BookReadingProgress>(`/book/${bookId}/reading-progress`);
}

export function getReading(bookId: string | number, fragmentChars = 3000) {
  return request<ReadingResponse>(`/book/${bookId}/read?fragment_chars=${fragmentChars}`);
}

export function completeReading(bookId: string | number, fragmentChars = 3000) {
  return request<ReadingResponse>(`/book/${bookId}/read/complete?fragment_chars=${fragmentChars}`, {
    method: "POST",
  });
}

export function getAchievements() {
  return request<Achievement[]>("/achievement/");
}

export function getStats() {
  return request<UserStats>("/achievement/stats");
}

export function getQuizQuestions(
  bookId: string | number,
  chapter: number,
  currentParagraph: number,
) {
  return request<QuizQuestion[]>(
    `/quiz/book/${bookId}/questions?chapter=${chapter}&current_paragraph=${currentParagraph}&limit=5`,
  );
}

export function submitQuiz(
  bookId: string | number,
  payload: {
    reading_id: number;
    chapter: number;
    current_paragraph: number;
    paragraph_offset: number;
    answers: QuizAnswer[];
  },
) {
  return request<QuizSubmitResponse>(`/quiz/book/${bookId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


export function getFavoriteBooks() {
  return request<Book[]>("/book/favorites");
}

export function getFavoriteStatus(bookId: string | number) {
  return request<{ book_id: number; is_favorite: boolean }>(`/book/${bookId}/favorite`);
}

export function addFavoriteBook(bookId: string | number) {
  return request<{ book_id: number; is_favorite: boolean }>(`/book/${bookId}/favorite`, {
    method: "POST",
  });
}

export function removeFavoriteBook(bookId: string | number) {
  return request<{ book_id: number; is_favorite: boolean }>(`/book/${bookId}/favorite`, {
    method: "DELETE",
  });
}

export function getReadingBooksProgress() {
  return request<ReadingBookProgress[]>("/book/reading-progress");
}

export function searchBooks(query: string) {
  return request<Book[]>(`/book/search?query=${encodeURIComponent(query)}&limit=20`, { auth: false });
}
export function getBookCoverUrl(bookId: string | number) {
  return `${API_URL}/book/${bookId}/cover`;
}
