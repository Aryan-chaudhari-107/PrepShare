import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import {
  User,
  ShieldCheck,
  Edit3,
  Settings,
  MessageSquare,
  UserPlus,
  Check,
  School,
  Building2,
  Award,
  BookOpen,
  Trash2,
  Plus,
  Camera,
  Key,
  Sun,
  Moon,
  Monitor,
  LayoutDashboard,
  FileText,
  CheckCircle2,
} from "lucide-react";

import { PageContainer } from "../components/layout/AppShell";
import { Modal } from "../components/common/Modal";
import { PostCard } from "../components/feed/PostCard";

import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card, Stat } from "../components/ui/Card";
import { Field, FieldControl, PasswordInput, Select, Textarea } from "../components/ui/Field";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/Feedback";
import { Tabs } from "../components/ui/Tabs";

import { DURATION, EASE, Focus, Reveal, RevealGroup, Scene, Section, Tilt } from "../motion";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

import {
  usersApi,
  followsApi,
  educationApi,
  interactionsApi,
  institutionsApi,
  uploadsApi,
  chatApi,
} from "../api";
import {
  PublicProfile,
  PostListItem,
  EducationRecord,
  Institution,
  CompletedQuestionItem,
} from "../types";

import { cn } from "../lib/cn";
import { absoluteDate, errorMessage } from "../lib/format";

type ProfileTab = "overview" | "posts" | "solved";
type ThemeChoice = "light" | "dark" | "system";

const EMPTY_POSTS: { items: PostListItem[] } = { items: [] };
const EMPTY_QUESTIONS: { items: CompletedQuestionItem[] } = { items: [] };

/**
 * The hero numeral counts up once as the identity plane lands, so the
 * contribution score feels earned rather than merely printed.
 *
 * Reduced motion is checked explicitly instead of inherited:
 * <MotionConfig reducedMotion="user"> only neutralises transform animations,
 * and this count is plain JS driving a MotionValue — so it opts itself out.
 */
const CountUp: React.FC<{ value: number }> = ({ value }) => {
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(() => (reduce ? value : 0));

  useMotionValueEvent(count, "change", (latest) => setDisplay(Math.round(latest)));

  useEffect(() => {
    if (reduce) {
      count.set(value);
      setDisplay(value);
      return;
    }
    // One token tier: fast enough to read as a flourish, never as something
    // the user has to wait for.
    const controls = animate(count, value, { duration: DURATION.slow, ease: EASE.enter });
    return () => controls.stop();
  }, [count, value, reduce]);

  return <>{display.toLocaleString()}</>;
};

/**
 * Public / own profile.
 *
 * Changes from the original:
 *  - the previous code fell through to a hard-coded "User Not Found" for EVERY
 *    failure — a dropped connection, a 500, or a signed-out visitor all read
 *    the same message. Failures, signed-out and genuinely-missing are now
 *    three visually distinct states with their own recovery actions;
 *  - theme preference now actually applies (it was read from
 *    `GET /users/me/settings` and then thrown away);
 *  - `window.confirm()` replaced with the app's ConfirmDialog;
 *  - every label associated with its control, every icon button named.
 */
export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, openAuthModal, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  const isSelf = !userId || Boolean(currentUser && currentUser.id === userId);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState<CompletedQuestionItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Settings modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [themePref, setThemePref] = useState<ThemeChoice>(theme);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Edit profile modal
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [nameError, setNameError] = useState("");

  // Education modal
  const [addEduModalOpen, setAddEduModalOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [eduForm, setEduForm] = useState({
    degree_level: "Bachelors",
    institution_id: "",
    course: "Computer Science",
    branch: "Computer Engineering",
    education_type: "full_time",
    start_year: 2021,
    end_year: 2025,
    is_current: true,
  });
  const [eduError, setEduError] = useState("");
  const [eduToDelete, setEduToDelete] = useState<EducationRecord | null>(null);
  const [deletingEdu, setDeletingEdu] = useState(false);

  /* ── Loading ─────────────────────────────────────────────────────────── */

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    if (isSelf && !isAuthenticated) {
      // Guest viewing "my profile": offer sign-in instead of a spinner that
      // can never resolve into content.
      setLoading(false);
      openAuthModal("login");
      return;
    }

    try {
      if (isSelf && currentUser) {
        const [meRes, draftsRes, eduRes, setRes, compRes] = await Promise.all([
          usersApi.getMyProfile(),
          usersApi.getPublicUserPosts(currentUser.id, 1, 50),
          educationApi.getMyEducation().catch(() => ({ data: [] as EducationRecord[] })),
          usersApi.getMySettings().catch(() => ({ data: null })),
          interactionsApi
            .getMyCompletedQuestions(undefined, undefined, 1, 50)
            .catch(() => ({ data: EMPTY_QUESTIONS })),
        ]);

        const me = meRes.data;
        let followers = 0;
        let following = 0;
        try {
          const pubRes = await usersApi.getPublicProfile(me.id);
          followers = pubRes.data.follower_count || 0;
          following = pubRes.data.following_count || 0;
        } catch {
          // Follower totals are non-critical — the profile still renders.
        }

        setProfile({
          id: me.id,
          username: me.username,
          full_name: me.full_name,
          profile_photo_url: me.profile_photo_url,
          bio: me.bio,
          year_of_study: me.year_of_study,
          contribution_score: me.contribution_score,
          follower_count: followers,
          following_count: following,
        });
        setEditFullName(me.full_name || "");
        setEditBio(me.bio || "");
        setEditPhotoUrl(me.profile_photo_url || "");
        setFollowerCount(followers);
        setFollowingCount(following);
        setPosts(draftsRes.data?.items || EMPTY_POSTS.items);
        setEducation(eduRes.data || []);
        setCompletedQuestions(compRes.data.items || []);

        // The stored preference is now applied, not merely displayed.
        const serverTheme = setRes.data?.theme_preference;
        if (serverTheme === "light" || serverTheme === "dark" || serverTheme === "system") {
          setThemePref(serverTheme);
          setTheme(serverTheme);
        }
      } else if (userId) {
        const [pubRes, postRes, compRes] = await Promise.all([
          usersApi.getPublicProfile(userId),
          usersApi.getPublicUserPosts(userId, 1, 50),
          interactionsApi
            .getUserCompletedQuestions(userId, undefined, undefined, 1, 50)
            .catch(() => ({ data: EMPTY_QUESTIONS })),
        ]);

        setProfile(pubRes.data);
        setFollowerCount(pubRes.data.follower_count || 0);
        setFollowingCount(pubRes.data.following_count || 0);
        setPosts(postRes.data.items || []);
        setCompletedQuestions(compRes.data.items || []);

        if (isAuthenticated && currentUser) {
          try {
            const folRes = await followsApi.getFollowing(currentUser.id, 1, 100);
            const target = pubRes.data.id;
            setIsFollowing(Boolean(folRes.data.items?.some((item) => item.user_id === target)));
          } catch {
            // Follow state is cosmetic; leaving it false is honest.
          }
        }
      }
    } catch (err: unknown) {
      setLoadFailed(true);
      error(errorMessage(err, "Failed to load user profile."));
    } finally {
      setLoading(false);
    }
  }, [isSelf, userId, isAuthenticated, currentUser, openAuthModal, error, setTheme]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!addEduModalOpen || institutions.length > 0) return;
    let cancelled = false;
    setInstitutionsLoading(true);
    institutionsApi
      .list("", 1, 50)
      .then((res) => {
        if (cancelled) return;
        const items = res.data.items || [];
        setInstitutions(items);
        if (items.length > 0) {
          setEduForm((prev) => ({ ...prev, institution_id: prev.institution_id || items[0].id }));
        }
      })
      .catch(() => {
        /* the select stays empty and the submit path reports it */
      })
      .finally(() => {
        if (!cancelled) setInstitutionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addEduModalOpen, institutions.length]);

  // Keep the settings modal in sync with whatever the header toggle chose.
  useEffect(() => {
    setThemePref(theme);
  }, [theme, settingsModalOpen]);

  /* ── Actions (endpoints, payloads and response fields unchanged) ─────── */

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!profile) return;
    try {
      const res = await followsApi.toggleFollow(profile.id);
      setIsFollowing(res.data.following);
      setFollowerCount(res.data.follower_count);
      success(res.data.message || (res.data.following ? "Following user" : "Unfollowed"));
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to update follow state."));
    }
  };

  const handleMessageUser = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!profile) return;
    try {
      await chatApi.startConversation(profile.id);
      navigate("/messages");
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to open conversation."));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file after a failed attempt.
    event.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadsApi.uploadFile(file);
      await usersApi.updateMyProfile({ profile_photo_url: res.data.url });
      setEditPhotoUrl(res.data.url);
      success("Profile photo updated!", "Photo Saved");
      if (refreshUser) refreshUser();
      loadData();
    } catch (err: unknown) {
      error(errorMessage(err, "Photo upload failed."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution_id) {
      setEduError("Please select an institution.");
      return;
    }
    setEduError("");
    try {
      await educationApi.addEducation(eduForm);
      success("Academic credential added.", "Education Added");
      setAddEduModalOpen(false);
      const res = await educationApi.getMyEducation();
      setEducation(res.data || []);
    } catch (err: unknown) {
      setEduError(errorMessage(err, "Failed to save education."));
    }
  };

  const handleDeleteEducation = async () => {
    if (!eduToDelete) return;
    setDeletingEdu(true);
    try {
      await educationApi.deleteEducation(eduToDelete.id);
      success("Education entry removed.", "Education Deleted");
      setEducation((prev) => prev.filter((entry) => entry.id !== eduToDelete.id));
      setEduToDelete(null);
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to delete education entry."));
    } finally {
      setDeletingEdu(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await uploadsApi.uploadFile(file);
      setEditPhotoUrl(res.data.url);
      success("Photo uploaded.", "Media Uploaded");
    } catch (err: unknown) {
      error(errorMessage(err, "Photo upload failed."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFullName.trim().length > 80) {
      setNameError("Full name must be 80 characters or fewer.");
      return;
    }
    setNameError("");
    setSavingProfile(true);
    try {
      await usersApi.updateMyProfile({
        full_name: editFullName.trim() || null,
        bio: editBio.trim() || null,
        profile_photo_url: editPhotoUrl.trim() || null,
      });
      success("Profile details updated successfully.", "Profile Saved");
      setEditProfileModalOpen(false);
      if (refreshUser) refreshUser();
      loadData();
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to update profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((currentPassword || newPassword) && newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (currentPassword && !newPassword) {
      setPasswordError("Enter a new password to complete the change.");
      return;
    }
    setPasswordError("");

    try {
      await usersApi.updateMySettings({ theme_preference: themePref });
      setTheme(themePref);
      if (currentPassword && newPassword) {
        await usersApi.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
      }
      success("Settings saved successfully.", "Settings Updated");
      setSettingsModalOpen(false);
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to update settings."));
    }
  };

  /* ── Render guards ───────────────────────────────────────────────────── */

  const signedOut = isSelf && !isAuthenticated && !profile;

  if (loading) {
    return (
      <>
        <PageContainer width="shell">
          <div className="space-y-6" role="status" aria-live="polite">
            <span className="sr-only">Loading profile…</span>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-5">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-line bg-sunken p-4 sm:p-5">
                <div className="flex flex-wrap items-end gap-6 sm:gap-10">
                  <div className="space-y-2">
                    <Skeleton className="h-11 w-28" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Skeleton className="h-56 rounded-xl" />
              <Skeleton className="h-96 rounded-xl lg:col-span-2" />
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (signedOut) {
    return (
      <>
        <PageContainer width="list">
          <h1 className="sr-only">Profile</h1>
          <EmptyState
            size="page"
            art="stack"
            title="Sign in to view your profile"
            description="Your experiences, education and saved questions live behind your account."
            action={
              <Button onClick={() => openAuthModal("login")}>Sign in</Button>
            }
          />
        </PageContainer>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PageContainer width="list">
          <h1 className="sr-only">Profile</h1>
          {loadFailed ? (
            <ErrorState
              size="page"
              title="We couldn't load this profile"
              description="The request didn't complete — check your connection and try again."
              onRetry={loadData}
              action={
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Go back
                </Button>
              }
            />
          ) : (
            <EmptyState
              size="page"
              art="stray"
              title="Profile not found"
              description="This account may have been removed, deactivated, or the link is incorrect."
              action={
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Go back
                </Button>
              }
            />
          )}
        </PageContainer>
      </>
    );
  }

  const primaryEducation = education.find((entry) => entry.is_current) || education[0];

  const tabItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} aria-hidden="true" /> },
    {
      id: "posts",
      label: "Experiences",
      icon: <FileText size={15} aria-hidden="true" />,
      badge: (
        <Badge tone="primary" className="tabular ml-1">
          {posts.length}
        </Badge>
      ),
    },
    {
      id: "solved",
      label: "Solved",
      icon: <CheckCircle2 size={15} aria-hidden="true" />,
      badge: (
        <Badge tone="success" className="tabular ml-1">
          {completedQuestions.length}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageContainer width="shell">
        {/* ── Identity space ─────────────────────────────────────────────── */}
        <Scene>
          {/* The page's one focal entrance: the identity plane lands
              cinematically while the hero numeral counts up beneath it. */}
          <Focus className="mb-6">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Avatar plane. The human is the hero, so this is the one
                      surface allowed to hover above the rest of the page. */}
                  <Tilt max={6} lift={1.02} className="shrink-0 rounded-2xl">
                    <div className="depth-lift rounded-2xl border border-line bg-raised p-1.5 shadow-md">
                      <div className="group relative">
                        <Avatar
                          src={profile.profile_photo_url}
                          name={profile.full_name || profile.username}
                          size="xl"
                        />
                        {isSelf && (
                          <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full bg-heading/60 text-xs font-semibold text-surface opacity-0 transition-opacity duration-fast ease-swift focus-within:opacity-100 group-hover:opacity-100"
                          >
                            <Camera size={16} aria-hidden="true" />
                            <span>Change</span>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleAvatarUpload}
                              disabled={uploadingPhoto}
                            />
                          </label>
                        )}
                        {uploadingPhoto && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-fg">
                            Uploading…
                          </span>
                        )}
                      </div>
                    </div>
                  </Tilt>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {profile.full_name || `@${profile.username}`}
                      </h1>
                      <span title="Verified member" className="text-primary">
                        <ShieldCheck size={18} aria-label="Verified member" role="img" />
                      </span>
                    </div>
                    <p className="text-sm text-muted">@{profile.username}</p>
                    <p className="mt-1 text-sm capitalize text-faint">
                      {profile.role?.replace(/_/g, " ") || "Student candidate"}
                    </p>

                    {profile.bio && (
                      <p className="mt-3 max-w-2xl text-balance text-sm leading-relaxed text-body">
                        {profile.bio}
                      </p>
                    )}

                    {primaryEducation && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                        <School size={15} className="shrink-0 text-primary" aria-hidden="true" />
                        {primaryEducation.degree_level} in {primaryEducation.course}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isSelf ? (
                    <>
                      <Button
                        variant="secondary"
                        icon={<Edit3 size={15} aria-hidden="true" />}
                        onClick={() => setEditProfileModalOpen(true)}
                      >
                        Edit profile
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<Settings size={15} aria-hidden="true" />}
                        onClick={() => setSettingsModalOpen(true)}
                      >
                        Settings
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        icon={<MessageSquare size={15} aria-hidden="true" />}
                        onClick={handleMessageUser}
                      >
                        Message
                      </Button>
                      <Button
                        variant={isFollowing ? "secondary" : "primary"}
                        icon={
                          isFollowing ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <UserPlus size={15} aria-hidden="true" />
                          )
                        }
                        aria-pressed={isFollowing}
                        onClick={handleToggleFollow}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats plane — recessed beneath the identity: the numbers are
                  the supporting cast, set INTO the surface while the person
                  above them is raised out of it. */}
              <div className="mt-6 rounded-xl border border-line bg-sunken px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-wrap items-end gap-x-6 gap-y-4 sm:gap-x-10">
                    {/* Hero numeral — contribution is the number this page is
                        about, so it gets scale, tabular rhythm and the one
                        warm accent on the page. */}
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="tabular text-4xl font-semibold tracking-tight text-warning sm:text-5xl">
                          <CountUp value={profile.contribution_score} />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          pts
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-sm text-muted">Contribution</div>
                    </div>

                    <span
                      className="hidden h-12 w-px shrink-0 bg-line sm:block"
                      aria-hidden="true"
                    />

                    <Stat label="Followers" value={followerCount.toLocaleString()} />
                    <Stat label="Following" value={followingCount.toLocaleString()} />
                  </div>

                  {(profile.contribution_score || 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
                      <Award size={14} aria-hidden="true" />
                      Active contributor
                    </span>
                  )}
                </div>
              </div>
            </section>
          </Focus>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <Section className="mb-6">
            <Tabs
              items={tabItems}
              value={activeTab}
              onChange={(id) => setActiveTab(id as ProfileTab)}
              label="Profile sections"
            />
          </Section>
        </Scene>

        {/* Tab panels sit deliberately OUTSIDE the Scene: an animated panel
            would double the perceived latency of keyboard tab navigation.
            Rows inside reveal once, on scroll, and never re-animate. */}

        {/* ── Overview ───────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <Card as="section">
              <h2 className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-base font-semibold tracking-tight">
                <User size={16} className="text-primary" aria-hidden="true" />
                About
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Username</dt>
                  <dd className="font-medium text-heading">@{profile.username}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Role</dt>
                  <dd className="font-medium capitalize text-heading">
                    {profile.role?.replace(/_/g, " ") || "student"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Points</dt>
                  <dd className="tabular font-semibold text-warning">
                    {profile.contribution_score ?? 0} pts
                  </dd>
                </div>
              </dl>
            </Card>

            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Education */}
              <Card as="section">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <School size={16} className="text-primary" aria-hidden="true" />
                    Education background
                  </h2>
                  {isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Plus size={14} aria-hidden="true" />}
                      onClick={() => setAddEduModalOpen(true)}
                    >
                      Add education
                    </Button>
                  )}
                </div>

                {education.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {education.map((edu) => (
                      <li key={edu.id}>
                        <Reveal className="flex items-start gap-4 rounded-xl border border-line bg-raised p-4">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
                            aria-hidden="true"
                          >
                            <BookOpen size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-sm font-semibold text-heading">
                                {edu.degree_level} in {edu.course}
                              </h3>
                              {isSelf && (
                                <IconButton
                                  label={`Delete ${edu.degree_level} in ${edu.course}`}
                                  tone="danger"
                                  onClick={() => setEduToDelete(edu)}
                                >
                                  <Trash2 size={15} aria-hidden="true" />
                                </IconButton>
                              )}
                            </div>
                            {edu.branch && (
                              <p className="mt-0.5 text-sm text-muted">
                                Specialization: {edu.branch}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-faint">
                              {edu.start_year} — {edu.is_current ? "Present" : edu.end_year}
                            </p>
                          </div>
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    art="stack"
                    title="No education entries yet"
                    description={
                      isSelf
                        ? "Add your degree so others can filter experiences by background."
                        : "This member hasn't added any academic credentials."
                    }
                    action={
                      isSelf ? (
                        <Button
                          size="sm"
                          icon={<Plus size={14} aria-hidden="true" />}
                          onClick={() => setAddEduModalOpen(true)}
                        >
                          Add education
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </Card>

              {/* Recent experiences */}
              <Card as="section">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <Building2 size={16} className="text-primary" aria-hidden="true" />
                    Shared experiences
                  </h2>
                  <Button variant="link" size="sm" onClick={() => setActiveTab("posts")}>
                    View all ({posts.length})
                  </Button>
                </div>

                {posts.length > 0 ? (
                  <RevealGroup className="flex flex-col gap-4">
                    {posts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </RevealGroup>
                ) : (
                  <EmptyState
                    art="rounds"
                    title="No experiences shared yet"
                    description={
                      isSelf
                        ? "Share your first interview to help the next candidate prepare."
                        : "This member hasn't published an experience."
                    }
                    action={
                      isSelf ? (
                        <Button onClick={() => navigate("/draft")}>Share an experience</Button>
                      ) : undefined
                    }
                  />
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── All experiences ────────────────────────────────────────────── */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {posts.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Reveal>
                      <PostCard post={post} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                size="page"
                art="rounds"
                title="No experiences published"
                description={
                  isSelf
                    ? "Everything you publish will appear here."
                    : "This member hasn't published an experience yet."
                }
                action={
                  isSelf ? (
                    <Button onClick={() => navigate("/draft")}>Share an experience</Button>
                  ) : undefined
                }
              />
            )}
          </div>
        )}

        {/* ── Solved questions ───────────────────────────────────────────── */}
        {activeTab === "solved" && (
          <div className="flex flex-col gap-3">
            {completedQuestions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {completedQuestions.map((question) => (
                  <li key={question.question_id}>
                    <Reveal className="rounded-xl border border-line bg-surface p-5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone="primary" className="max-w-full truncate">
                          {question.post_title || "Interview problem"}
                        </Badge>
                        <span className="text-sm text-muted">
                          Solved {absoluteDate(question.completed_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-heading">
                        {question.question_text || "Attachment problem statement"}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                size="page"
                art="rounds"
                title="No questions marked as solved"
                description={
                  isSelf
                    ? "Mark questions you've completed while browsing experiences."
                    : "This member hasn't marked any questions as solved."
                }
              />
            )}
          </div>
        )}
      </PageContainer>

      {/* ── Edit profile modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        title="Edit public profile"
        subtitle="This is what other members see on your experiences."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditProfileModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-profile-form"
              loading={savingProfile}
              disabled={uploadingPhoto}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar
              src={editPhotoUrl}
              name={editFullName || profile.username}
              size="lg"
              alt={editFullName || profile.username}
            />
            <div className="min-w-0">
              <label
                htmlFor="profile-photo-file"
                className="mb-1.5 block text-sm font-medium text-heading"
              >
                Profile photo
              </label>
              <input
                id="profile-photo-file"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingPhoto}
                className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-fg hover:file:bg-[rgb(var(--primary-hover))] file:disabled:opacity-50"
              />
              {uploadingPhoto && (
                <p className="mt-1 text-sm text-primary" role="status">
                  Uploading photo…
                </p>
              )}
            </div>
          </div>

          <FieldControl
            label="Full name"
            name="full_name"
            autoComplete="name"
            placeholder="e.g. Jane Doe"
            value={editFullName}
            onChange={(event) => setEditFullName(event.target.value)}
            error={nameError}
            hint="Shown instead of your username when set."
          />

          <Field label="Bio / headline" htmlFor="profile-bio">
            <Textarea
              id="profile-bio"
              rows={3}
              maxLength={280}
              value={editBio}
              onChange={(event) => setEditBio(event.target.value)}
              placeholder="A short summary of your background…"
            />
            <p className="text-xs text-faint">{editBio.length}/280 characters</p>
          </Field>
        </form>
      </Modal>

      {/* ── Add education modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={addEduModalOpen}
        onClose={() => setAddEduModalOpen(false)}
        title="Add academic credential"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddEduModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-education-form">
              Save credential
            </Button>
          </>
        }
      >
        <form id="add-education-form" onSubmit={handleAddEducation} className="space-y-4">
          <Field
            label="Institution"
            htmlFor="edu-institution"
            required
            error={eduError}
            hint={
              institutionsLoading
                ? "Loading institutions…"
                : institutions.length === 0
                  ? "No institutions were returned — try again."
                  : undefined
            }
          >
            <Select
              id="edu-institution"
              value={eduForm.institution_id}
              onChange={(event) => {
                setEduError("");
                setEduForm({ ...eduForm, institution_id: event.target.value });
              }}
              required
              disabled={institutionsLoading || institutions.length === 0}
            >
              <option value="">Select an institution…</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.city}, {inst.country})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Degree level" htmlFor="edu-degree">
              <Select
                id="edu-degree"
                value={eduForm.degree_level}
                onChange={(event) => setEduForm({ ...eduForm, degree_level: event.target.value })}
              >
                <option value="Bachelors">Bachelors</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
                <option value="Diploma">Diploma</option>
              </Select>
            </Field>

            <FieldControl
              label="Course"
              name="edu-course"
              value={eduForm.course}
              onChange={(event) => setEduForm({ ...eduForm, course: event.target.value })}
            />
          </div>

          <FieldControl
            label="Specialization / branch"
            name="edu-branch"
            value={eduForm.branch}
            onChange={(event) => setEduForm({ ...eduForm, branch: event.target.value })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldControl
              label="Start year"
              name="edu-start-year"
              type="number"
              inputMode="numeric"
              min={1950}
              max={2100}
              value={String(eduForm.start_year)}
              onChange={(event) =>
                setEduForm({
                  ...eduForm,
                  start_year: Number.parseInt(event.target.value, 10) || eduForm.start_year,
                })
              }
            />
            <FieldControl
              label="End year"
              name="edu-end-year"
              type="number"
              inputMode="numeric"
              min={1950}
              max={2100}
              disabled={eduForm.is_current}
              value={String(eduForm.end_year)}
              onChange={(event) =>
                setEduForm({
                  ...eduForm,
                  end_year: Number.parseInt(event.target.value, 10) || eduForm.end_year,
                })
              }
              hint={eduForm.is_current ? "Still in progress." : undefined}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-body">
            <input
              type="checkbox"
              checked={eduForm.is_current}
              onChange={(event) => setEduForm({ ...eduForm, is_current: event.target.checked })}
              className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/30"
            />
            Currently studying here
          </label>
        </form>
      </Modal>

      {/* ── Settings modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Account settings"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="settings-form">
              Save settings
            </Button>
          </>
        }
      >
        <form id="settings-form" onSubmit={handleUpdateSettings} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-heading">Theme preference</legend>
            <div
              role="radiogroup"
              aria-label="Theme preference"
              className="grid grid-cols-3 gap-2.5"
            >
              {(["light", "dark", "system"] as ThemeChoice[]).map((option) => {
                const selected = themePref === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setThemePref(option)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium capitalize transition-all duration-fast ease-swift",
                      "active:scale-press",
                      selected
                        ? "border-primary bg-primary-soft text-primary shadow-xs"
                        : "border-line bg-raised text-muted hover:border-line-strong hover:text-heading"
                    )}
                  >
                    {option === "light" && <Sun size={16} aria-hidden="true" />}
                    {option === "dark" && <Moon size={16} aria-hidden="true" />}
                    {option === "system" && <Monitor size={16} aria-hidden="true" />}
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-faint">
              Saved to your account, so it follows you to any device.
            </p>
          </fieldset>

          <div className="h-px bg-line" role="separator" />

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-sm font-medium text-heading">
              <Key size={14} className="text-primary" aria-hidden="true" />
              Change password
            </legend>

            <Field label="Current password" htmlFor="current-password" required>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>

            <Field
              label="New password"
              htmlFor="new-password"
              error={passwordError}
              hint="Leave both blank to keep your current password."
            >
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Field>
          </fieldset>
        </form>
      </Modal>

      {/* ── Delete education confirmation ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(eduToDelete)}
        onClose={() => setEduToDelete(null)}
        onConfirm={handleDeleteEducation}
        loading={deletingEdu}
        tone="danger"
        title="Delete education entry?"
        confirmLabel="Delete"
        message={
          eduToDelete ? (
            <>
              <strong>{eduToDelete.degree_level} in {eduToDelete.course}</strong> will be removed
              from your profile. This cannot be undone.
            </>
          ) : (
            "This entry will be removed from your profile."
          )
        }
      />
    </>
  );
};
