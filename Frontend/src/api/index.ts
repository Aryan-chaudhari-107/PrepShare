import { apiClient } from "./client";
import * as T from "../types";

export * from "./client";

// ── Auth APIs ─────────────────────────────────────────────────────────────
export const authApi = {
  requestOtp: (data: T.RequestOtpPayload) =>
    apiClient.post<{ message: string }>("/auth/request-otp", data),

  verifyAndRegister: (data: T.VerifyRegisterPayload) =>
    apiClient.post<T.TokenResponse>("/auth/verify-and-register", data),

  login: (data: T.LoginPayload) =>
    apiClient.post<T.TokenResponse>("/auth/login", data),

  forgotPassword: (input: string | { email: string }) => {
    const email = typeof input === "string" ? input : input.email;
    return apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  },

  resetPassword: (data: T.ResetPasswordPayload) =>
    apiClient.post<{ message: string }>("/auth/reset-password", data),
};

// ── Users APIs ────────────────────────────────────────────────────────────
export const usersApi = {
  getMyProfile: () =>
    apiClient.get<T.UserProfile>("/users/me"),

  updateMyProfile: (data: T.UserProfileUpdatePayload) =>
    apiClient.patch<T.UserProfile>("/users/me", data),

  searchUsers: (query: string, limit = 10) =>
    apiClient.get<{ items: T.UserSearchItem[] }>("/users/search", { params: { q: query, limit } }),

  getPublicProfile: (userId: T.UUID) =>
    apiClient.get<T.PublicProfile>(`/users/${userId}`),

  getPublicUserPosts: (userId: T.UUID, page = 1, limit = 10) =>
    apiClient.get<T.PostListResponse>(`/users/${userId}/posts`, {
      params: { page, limit },
    }),

  getMyDrafts: (page = 1, limit = 10) =>
    apiClient.get<T.PostListResponse>("/users/me/drafts", {
      params: { page, limit },
    }),

  getMySettings: () =>
    apiClient.get<T.UserSettings>("/users/me/settings"),

  updateMySettings: (data: { theme_preference: "light" | "dark" | "system" }) =>
    apiClient.patch<T.UserSettings>("/users/me/settings", data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.put<{ message: string }>("/users/change-password", data),
};

// ── Education History APIs ────────────────────────────────────────────────
export const educationApi = {
  getMyEducation: () =>
    apiClient.get<T.EducationRecord[]>("/users/me/education/"),

  addEducation: (data: Omit<T.EducationRecord, "id" | "created_at">) =>
    apiClient.post<T.EducationRecord>("/users/me/education/", data),

  editEducation: (id: T.UUID, data: Partial<Omit<T.EducationRecord, "id" | "created_at">>) =>
    apiClient.patch<T.EducationRecord>(`/users/me/education/${id}`, data),

  deleteEducation: (id: T.UUID) =>
    apiClient.delete<{ message: string }>(`/users/me/education/${id}`),
};

// ── Companies & Institutions APIs ─────────────────────────────────────────
export const companiesApi = {
  list: (search?: string, page = 1, limit = 20) =>
    apiClient.get<T.CompanyListResponse>("/companies/", {
      params: { search: search || undefined, page, limit },
    }),

  getById: (id: T.UUID) =>
    apiClient.get<T.Company>(`/companies/${id}`),

  create: (data: { name: string; logo_url?: string; website?: string; industry?: string }) =>
    apiClient.post<T.Company>("/companies/", data),
};

export const institutionsApi = {
  list: (search?: string, page = 1, limit = 20) =>
    apiClient.get<T.InstitutionListResponse>("/institutions/", {
      params: { search: search || undefined, page, limit },
    }),

  getById: (id: T.UUID) =>
    apiClient.get<T.Institution>(`/institutions/${id}`),
};

// ── Posts APIs ────────────────────────────────────────────────────────────
export interface PostFeedFilter {
  company_id?: string;
  company_name?: string;
  post_category?: string;
  institution_id?: string;
  institution_name?: string;
  course?: string;
  work_location?: string;
  industry?: string;
  job_role?: string;
  round_tag?: string;
  is_offer_received?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const postsApi = {
  getFiltersMetadata: () =>
    apiClient.get<T.FilterMetadata>("/posts/filters-metadata"),

  getFeed: (filter: PostFeedFilter = {}) =>
    apiClient.get<T.PostListResponse>("/posts/", {
      params: {
        company_id: filter.company_id || undefined,
        company_name: filter.company_name || undefined,
        post_category: filter.post_category || undefined,
        institution_id: filter.institution_id || undefined,
        institution_name: filter.institution_name || undefined,
        course: filter.course || undefined,
        work_location: filter.work_location || undefined,
        industry: filter.industry || undefined,
        job_role: filter.job_role || undefined,
        round_tag: filter.round_tag || undefined,
        is_offer_received: filter.is_offer_received !== undefined ? filter.is_offer_received : undefined,
        search: filter.search || undefined,
        page: filter.page || 1,
        limit: filter.limit || 10,
      },
    }),

  getById: (postId: T.UUID) =>
    apiClient.get<T.PostOut>(`/posts/${postId}`),

  createDraft: (data: {
    title: string;
    post_category: string;
    company_id?: string;
    education_id?: string;
    is_anonymous?: boolean;
    year_of_study?: number;
    age?: number;
    experience_years?: number;
    current_status?: string;
    work_location?: string;
    work_mode?: string;
  }) =>
    apiClient.post<{ post_id: T.UUID; slug: string; message: string }>("/posts/", data),

  addRound: (postId: T.UUID, data: {
    name: string;
    mode?: "online" | "offline";
    duration_minutes?: number;
    round_tags?: string;
    difficulty?: string;
    round_number?: number;
  }) =>
    apiClient.post<{ round_id: T.UUID; post_round_id: T.UUID; message: string }>(
      `/posts/${postId}/rounds`,
      data
    ),

  addQuestion: (postId: T.UUID, postRoundId: T.UUID, data: {
    question_text?: string;
    attachment_url?: string;
  }) =>
    apiClient.post<{ question_id: T.UUID; message: string }>(
      `/posts/${postId}/rounds/${postRoundId}/questions`,
      data
    ),

  publish: (postId: T.UUID, data: {
    experience_text: string;
    tips?: string;
    is_offer_received?: boolean;
    job_role?: string;
    package_amount?: number;
    currency?: string;
  }) =>
    apiClient.put<{ message: string; slug: string }>(`/posts/${postId}/publish`, data),

  publishDraft: (postId: T.UUID, data: {
    experience_text: string;
    tips?: string;
    is_offer_received?: boolean;
    job_role?: string;
    package_amount?: number;
    currency?: string;
  }) =>
    apiClient.put<{ message: string; slug: string }>(`/posts/${postId}/publish`, data),

  update: (postId: T.UUID, data: Partial<T.PostOut>) =>
    apiClient.patch<{ message: string }>(`/posts/${postId}`, data),

  incrementShare: (postId: T.UUID) =>
    apiClient.post<{ message: string; share_count: number }>(`/posts/${postId}/share`),

  sharePost: (postId: T.UUID) =>
    apiClient.post<{ message: string; share_count: number }>(`/posts/${postId}/share`),
};

// ── Comments APIs ─────────────────────────────────────────────────────────
export const commentsApi = {
  getByPost: (postId: T.UUID, page = 1, limit = 50) =>
    apiClient.get<T.CommentListResponse>(`/posts/${postId}/comments`, {
      params: { page, limit },
    }),

  listForPost: (postId: T.UUID, page = 1, limit = 50) =>
    apiClient.get<T.CommentListResponse>(`/posts/${postId}/comments`, {
      params: { page, limit },
    }),

  create: (postId: T.UUID, data: { comment_text: string; parent_comment_id?: string }) =>
    apiClient.post<T.CommentOut>(`/posts/${postId}/comments`, data),

  addComment: (postId: T.UUID, data: { comment_text: string; parent_comment_id?: string }) =>
    apiClient.post<T.CommentOut>(`/posts/${postId}/comments`, data),

  update: (commentId: T.UUID, data: { comment_text: string }) =>
    apiClient.patch<T.CommentOut>(`/comments/${commentId}`, data),

  editComment: (commentId: T.UUID, data: { comment_text: string }) =>
    apiClient.patch<T.CommentOut>(`/comments/${commentId}`, data),

  delete: (commentId: T.UUID) =>
    apiClient.delete<{ message: string }>(`/comments/${commentId}`),

  deleteComment: (commentId: T.UUID) =>
    apiClient.delete<{ message: string }>(`/comments/${commentId}`),
};

// ── Interactions & Engagement APIs ─────────────────────────────────────────
export const interactionsApi = {
  toggleLike: (postId: T.UUID) =>
    apiClient.post<{ liked: boolean; like_count: number; message: string }>(`/posts/${postId}/like`),

  getLikeStatus: (postId: T.UUID) =>
    apiClient.get<{ liked: boolean; like_count: number }>(`/posts/${postId}/like`),

  toggleBookmark: (postId: T.UUID) =>
    apiClient.post<{ bookmarked: boolean; message: string }>(`/posts/${postId}/bookmark`),

  getBookmarkStatus: (postId: T.UUID) =>
    apiClient.get<{ bookmarked: boolean }>(`/posts/${postId}/bookmark`),

  getMyBookmarks: (page = 1, limit = 10) =>
    apiClient.get<T.PostListResponse>("/users/me/bookmarks", { params: { page, limit } }),

  voteQuestionDifficulty: (questionId: T.UUID, difficulty: "easy" | "medium" | "hard") =>
    apiClient.post<{
      question_id: T.UUID;
      difficulty: "easy" | "medium" | "hard" | null;
      easy_count: number;
      medium_count: number;
      hard_count: number;
      message: string;
    }>(`/questions/${questionId}/vote`, { difficulty }),

  getQuestionDifficultyVote: (questionId: T.UUID) =>
    apiClient.get<{
      difficulty: "easy" | "medium" | "hard" | null;
      easy_count: number;
      medium_count: number;
      hard_count: number;
    }>(`/questions/${questionId}/vote`),

  toggleQuestionComplete: (questionId: T.UUID) =>
    apiClient.post<{ completed: boolean; message: string }>(`/questions/${questionId}/complete`),

  getMyCompletedQuestions: (companyId?: string, category?: string, page = 1, limit = 20) =>
    apiClient.get<T.CompletedQuestionListResponse>("/users/me/completed-questions", {
      params: { company_id: companyId || undefined, post_category: category || undefined, page, limit },
    }),

  getUserCompletedQuestions: (userId: T.UUID, companyId?: string, category?: string, page = 1, limit = 20) =>
    apiClient.get<T.CompletedQuestionListResponse>(`/users/${userId}/completed-questions`, {
      params: { company_id: companyId || undefined, post_category: category || undefined, page, limit },
    }),
};

// ── Follows APIs ──────────────────────────────────────────────────────────
export const followsApi = {
  toggleFollow: (userId: T.UUID) =>
    apiClient.post<{ following: boolean; follower_count: number; message: string }>(
      `/users/${userId}/follow`
    ),

  getFollowers: (userId: T.UUID, page = 1, limit = 20) =>
    apiClient.get<{ items: T.AuthorInfo[]; total: number }>(`/users/${userId}/followers`, {
      params: { page, limit },
    }),

  getFollowing: (userId: T.UUID, page = 1, limit = 20) =>
    apiClient.get<{ items: T.AuthorInfo[]; total: number }>(`/users/${userId}/following`, {
      params: { page, limit },
    }),
};

// ── Notifications APIs ────────────────────────────────────────────────────
export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    apiClient.get<T.NotificationListResponse>("/notifications/", {
      params: { page, limit },
    }),

  markRead: (id: T.UUID) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`),

  markAsRead: (id: T.UUID) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<{ message: string }>("/notifications/read-all"),

  markAllAsRead: () =>
    apiClient.patch<{ message: string }>("/notifications/read-all"),
};

// ── Moderation & Reports APIs ─────────────────────────────────────────────
export const reportsApi = {
  submitReport: (postId: T.UUID, reason: string) =>
    apiClient.post<T.ReportOut>("/reports/", {
      post_id: postId,
      reason,
    }),

  create: (data: { post_id: T.UUID; reason: string }) =>
    apiClient.post<T.ReportOut>("/reports/", data),
};

// ── Direct Messaging APIs (V2) ─────────────────────────────────────────────
export const chatApi = {
  listConversations: () =>
    apiClient.get<T.ConversationListResponse>("/conversations/"),

  startConversation: (targetUserId: T.UUID) =>
    apiClient.post<T.ConversationOut>("/conversations/", { target_user_id: targetUserId }),

  getMessages: (conversationId: T.UUID, page = 1, limit = 50) =>
    apiClient.get<T.MessageListResponse>(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    }),

  sendMessage: (conversationId: T.UUID, messageText: string) =>
    apiClient.post<T.MessageOut>(`/conversations/${conversationId}/messages`, {
      message_text: messageText,
    }),

  markRead: (conversationId: T.UUID) =>
    apiClient.patch<{ status: string; marked_read: number }>(`/conversations/${conversationId}/read`),

  getUnreadCount: () =>
    apiClient.get<{ unread_count: number }>("/messages/unread-count"),

  blockUser: (userId: T.UUID) =>
    apiClient.post<{ message: string }>(`/users/${userId}/block-messages`),

  unblockUser: (userId: T.UUID) =>
    apiClient.delete<{ message: string }>(`/users/${userId}/block-messages`),
};

// ── Uploads APIs ──────────────────────────────────────────────────────────
export const uploadsApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<T.FileUploadResponse>("/uploads/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
