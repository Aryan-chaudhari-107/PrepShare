export type UUID = string;

// Auth
export interface TokenResponse {
  access_token: string;
  token_type: string;
  message: string;
}

export interface RequestOtpPayload {
  email: string;
}

export interface VerifyRegisterPayload {
  email: string;
  otp_code: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp_code: string;
  new_password: string;
}

// User Profile
export interface UserProfile {
  id: UUID;
  username: string;
  email: string;
  full_name?: string | null;
  profile_photo_url?: string | null;
  bio?: string | null;
  year_of_study?: number | null;
  contribution_score: number;
  is_email_verified: boolean;
  role?: string;
  created_at?: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string | null;
  bio?: string | null;
  profile_photo_url?: string | null;
}

export interface PublicProfile {
  id: UUID;
  username: string;
  full_name?: string | null;
  profile_photo_url?: string | null;
  bio?: string | null;
  year_of_study?: number | null;
  contribution_score: number;
  follower_count: number;
  following_count: number;
  role?: string;
}

export interface UserSearchItem {
  id: UUID;
  username: string;
  full_name?: string | null;
  profile_photo_url?: string | null;
}

export interface UserSettings {
  id: UUID;
  user_id: UUID;
  theme_preference: "light" | "dark" | "system";
}

// Education History
export interface EducationRecord {
  id: UUID;
  degree_level: string;
  institution_id: UUID;
  institution_name?: string;
  course: string;
  branch?: string;
  education_type?: string;
  start_year: number;
  end_year?: number;
  is_current: boolean;
  created_at: string;
}

// Company & Institution
export interface Company {
  id: UUID;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
}

export interface CompanyListResponse {
  items: Company[];
  total: number;
  page: number;
  total_pages: number;
}

export interface Institution {
  id: UUID;
  name: string;
  city: string;
  state?: string | null;
  country: string;
  type: string;
  website?: string | null;
}

export interface InstitutionListResponse {
  items: Institution[];
  total: number;
  page: number;
  total_pages: number;
}

// Posts
export type PostCategory =
  | "campus_placement"
  | "off_campus_placement"
  | "campus_hackathon"
  | "off_campus_hackathon";

export type PostStatus = "draft" | "published" | "flagged";

export interface AuthorInfo {
  user_id?: UUID;
  username?: string;
  profile_photo_url?: string | null;
}

export type AuthorOut = AuthorInfo;

export interface PostListItem {
  id: UUID;
  title: string;
  slug: string;
  post_category: PostCategory;
  company_id?: UUID | null;
  company_name?: string | null;
  institution_name?: string | null;
  course?: string | null;
  work_location?: string | null;
  is_anonymous: boolean;
  author: AuthorInfo;
  is_offer_received: boolean;
  job_role?: string | null;
  package_amount?: number | null;
  currency?: string | null;
  round_count: number;
  experience_excerpt: string;
  experience_text_excerpt?: string;
  view_count: number;
  share_count: number;
  published_at?: string | null;
  created_at: string;
}

export interface FilterMetadata {
  categories: { value: string; label: string }[];
  colleges: string[];
  courses: string[];
  companies: string[];
  locations: string[];
  industries: string[];
  roles: string[];
  round_tags: string[];
}

export interface PostFeedFilterParams {
  search?: string;
  post_category?: string;
  company_id?: string;
  company_name?: string;
  institution_id?: string;
  institution_name?: string;
  course?: string;
  work_location?: string;
  industry?: string;
  job_role?: string;
  round_tag?: string;
  is_offer_received?: boolean;
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  items: PostListItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface QuestionOut {
  id: UUID;
  post_id: UUID;
  post_round_id?: UUID | null;
  question_text?: string | null;
  attachment_url?: string | null;
  is_verified: boolean;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  tags?: string[];
}

export interface RoundOut {
  id: UUID;
  post_round_id?: UUID;
  round_number: number;
  name?: string | null;
  mode?: "online" | "offline";
  duration_minutes?: number | null;
  round_tags?: string | null;
  questions: QuestionOut[];
}

export interface PostOut {
  id: UUID;
  title: string;
  slug: string;
  post_category: PostCategory;
  company_id?: UUID | null;
  company_name?: string | null;
  education_id?: UUID | null;
  institution_name?: string | null;
  course_name?: string | null;
  year_of_study?: number | null;
  age?: number | null;
  experience_years?: number | null;
  current_status?: string | null;
  work_location?: string | null;
  work_mode?: string | null;
  is_offer_received: boolean;
  job_role?: string | null;
  package_amount?: number | null;
  currency?: string | null;
  experience_text: string;
  tips?: string | null;
  is_anonymous: boolean;
  status: PostStatus;
  published_at?: string | null;
  edit_count: number;
  view_count: number;
  share_count: number;
  created_at: string;
  author: AuthorInfo;
  rounds: RoundOut[];
}

// Comments
export interface CommentOut {
  id: UUID;
  post_id: UUID;
  user_id: UUID;
  author_username?: string;
  author_profile_photo?: string | null;
  author?: AuthorInfo;
  comment_text: string;
  parent_comment_id?: UUID | null;
  created_at: string;
  updated_at?: string | null;
  is_edited?: boolean;
  replies?: CommentOut[];
}

export interface CommentListResponse {
  items: CommentOut[];
  total: number;
  page: number;
  total_pages: number;
}

// Notifications
export interface NotificationItem {
  id: UUID;
  receiver_id: UUID;
  sender_id?: UUID | null;
  sender_username?: string | null;
  sender_profile_photo?: string | null;
  sender?: {
    username?: string;
    profile_photo_url?: string | null;
  };
  type: "LIKE" | "COMMENT" | "FOLLOW" | "NEW_POST";
  reference_id: UUID;
  reference_type: "post" | "comment" | "user";
  is_read: boolean;
  created_at: string;
}

export type NotificationOut = NotificationItem;

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  total_pages: number;
  unread_count: number;
}

// Completed Questions
export interface CompletedQuestionItem {
  id?: UUID;
  question_id: UUID;
  post_id: UUID;
  post_title: string;
  company_name?: string | null;
  question_text?: string | null;
  completed_at: string;
}

export interface CompletedQuestionListResponse {
  items: CompletedQuestionItem[];
  total: number;
  page: number;
  total_pages: number;
}

// Messaging / Direct Chat (V2)
export interface MessageOut {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageListResponse {
  items: MessageOut[];
  total: number;
  page: number;
  total_pages: number;
}

export interface ParticipantOut {
  id: UUID;
  username: string;
  full_name?: string | null;
  profile_photo_url?: string | null;
}

export interface ConversationOut {
  id: UUID;
  user_one_id: UUID;
  user_two_id: UUID;
  created_at: string;
  other_participant: ParticipantOut;
  last_message?: MessageOut | null;
  unread_count: number;
}

export interface ConversationListResponse {
  items: ConversationOut[];
  total: number;
}

// File Upload
export interface FileUploadResponse {
  url: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}
