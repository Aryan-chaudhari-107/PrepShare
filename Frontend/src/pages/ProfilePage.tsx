import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usersApi, followsApi, educationApi, interactionsApi, institutionsApi, uploadsApi, chatApi } from "../api";
import {
  PublicProfile,
  PostListItem,
  EducationRecord,
  Institution,
  CompletedQuestionItem,
  UserSettings,
} from "../types";
import { Modal } from "../components/common/Modal";
import { PostCard } from "../components/feed/PostCard";

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, openAuthModal, refreshUser } = useAuth();
  const { success, error } = useToast();

  const isSelf = !userId || (currentUser && currentUser.id === userId);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState<CompletedQuestionItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "solved">("overview");

  // Settings Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [themePref, setThemePref] = useState<"light" | "dark" | "system">("light");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit Profile Modal State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Education Modal State
  const [addEduModalOpen, setAddEduModalOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSelf) {
        if (!isAuthenticated) {
          openAuthModal("login");
          return;
        }
        const [meRes, draftsRes, eduRes, setRes, compRes] = await Promise.all([
          usersApi.getMyProfile(),
          currentUser ? usersApi.getPublicUserPosts(currentUser.id, 1, 50) : Promise.resolve({ data: { items: [] } }),
          educationApi.getMyEducation().catch(() => ({ data: [] })),
          usersApi.getMySettings().catch(() => ({ data: { theme_preference: "light" } })),
          interactionsApi.getMyCompletedQuestions(undefined, undefined, 1, 50).catch(() => ({ data: { items: [] } })),
        ]);

        const me = meRes.data;
        let followers = 0;
        let following = 0;
        try {
          const pubRes = await usersApi.getPublicProfile(me.id);
          followers = pubRes.data.follower_count || 0;
          following = pubRes.data.following_count || 0;
        } catch {}

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
        setPosts((draftsRes.data as any).items || []);
        setEducation(eduRes.data || []);
        setCompletedQuestions(compRes.data.items || []);
        setThemePref((setRes.data as UserSettings).theme_preference || "light");
      } else if (userId) {
        const [pubRes, postRes, compRes] = await Promise.all([
          usersApi.getPublicProfile(userId),
          usersApi.getPublicUserPosts(userId, 1, 50),
          interactionsApi.getUserCompletedQuestions(userId, undefined, undefined, 1, 50).catch(() => ({ data: { items: [] } })),
        ]);
        setProfile(pubRes.data);
        setFollowerCount(pubRes.data.follower_count || 0);
        setFollowingCount(pubRes.data.following_count || 0);
        setPosts(postRes.data.items || []);
        setCompletedQuestions(compRes.data.items || []);

        if (isAuthenticated && currentUser) {
          try {
            const folRes = await followsApi.getFollowing(currentUser.id, 1, 100);
            const isFol = folRes.data.items?.some((f: any) => f.user_id === userId || f.id === userId);
            setIsFollowing(!!isFol);
          } catch {}
        }
      }
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  }, [isSelf, userId, isAuthenticated, currentUser, openAuthModal, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (addEduModalOpen && institutions.length === 0) {
      institutionsApi.list("", 1, 50).then((res) => {
        setInstitutions(res.data.items || []);
        if (res.data.items?.length > 0) {
          setEduForm((prev) => ({ ...prev, institution_id: res.data.items[0].id }));
        }
      });
    }
  }, [addEduModalOpen, institutions.length]);

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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to update follow state.");
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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to open conversation.");
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution_id) {
      error("Please select an institution.");
      return;
    }
    try {
      await educationApi.addEducation(eduForm);
      success("Academic credential added.", "Education Added");
      setAddEduModalOpen(false);
      const res = await educationApi.getMyEducation();
      setEducation(res.data || []);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to save education.");
    }
  };

  const handleDeleteEducation = async (eduId: string) => {
    if (!window.confirm("Are you sure you want to delete this education entry?")) return;
    try {
      await educationApi.deleteEducation(eduId);
      success("Education entry removed.", "Education Deleted");
      setEducation((prev) => prev.filter((e) => e.id !== eduId));
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to delete education entry.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await uploadsApi.uploadFile(file);
      setEditPhotoUrl(res.data.url);
      success("Photo uploaded.", "Media Uploaded");
    } catch (err: any) {
      error(err.response?.data?.detail || "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.updateMySettings({ theme_preference: themePref });
      if (currentPassword && newPassword) {
        await usersApi.changePassword({ current_password: currentPassword, new_password: newPassword });
        setCurrentPassword("");
        setNewPassword("");
      }
      success("Settings saved successfully.", "Settings Updated");
      setSettingsModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to update settings.");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 w-full animate-pulse flex flex-col gap-6">
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 h-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 h-96"></div>
            <div className="lg:col-span-2 bg-surface-elevated rounded-2xl border border-border-subtle p-6 h-96"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-16 text-center">
          <h2 className="text-xl font-bold text-on-surface">User Not Found</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            The profile you are trying to view does not exist or has been deactivated.
          </p>
        </div>
      </AppShell>
    );
  }

  const primaryEducation = education.find((e) => e.is_current) || education[0];

  return (
    <AppShell>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full flex flex-col gap-8 flex-1">
        {/* Header Profile Card (Academic Nexus Theme) */}
        <section className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container flex items-center justify-center text-primary text-2xl font-bold shrink-0 shadow-inner">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile.username.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                    {profile.full_name || `@${profile.username}`}
                  </h1>
                  <span className="material-symbols-outlined text-primary text-lg" title="Verified Member">
                    verified
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
                  @{profile.username}
                </p>
                <span className="text-xs text-outline mt-1 capitalize font-medium">
                  {profile.role?.replace(/_/g, " ") || "Student Candidate"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                {isSelf ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditProfileModalOpen(true)}
                      className="px-4 py-2 rounded-full border border-border-subtle bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsModalOpen(true)}
                      className="px-4 py-2 rounded-full border border-border-subtle bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">settings</span>
                      <span>Settings</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleMessageUser}
                      className="px-4 py-2 rounded-full border border-primary/20 bg-primary-container/10 text-primary hover:bg-primary-container/20 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      <span>Message</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                        isFollowing
                          ? "bg-surface-container text-on-surface-variant border border-border-subtle"
                          : "bg-primary text-on-primary hover:bg-primary-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isFollowing ? "check" : "person_add"}
                      </span>
                      <span>{isFollowing ? "Following" : "Follow"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {primaryEducation && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-base text-[#7C3AED]">school</span>
                <span>
                  {primaryEducation.degree_level} in {primaryEducation.course}
                </span>
              </div>
            )}

            {profile.bio && (
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-3xl">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-between border-t border-border-subtle pt-4 mt-2 gap-6">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-on-surface">
                    {profile.contribution_score.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Contribution
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-on-surface">
                    {followerCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Followers
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-on-surface">
                    {followingCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Following
                  </span>
                </div>
              </div>

              {profile.contribution_score > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container/10 border border-primary/20 text-primary text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  <span>Active Contributor</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile Tabs */}
        <div className="border-b border-border-subtle flex items-center justify-between">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Profile Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("posts")}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "posts"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">article</span>
              <span>Experiences ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("solved")}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "solved"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">task_alt</span>
              <span>Solved Questions ({completedQuestions.length})</span>
            </button>
          </nav>
        </div>

        {/* Tab 1: Overview (3-Column Layout) */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (1 col): About & Credentials */}
            <div className="flex flex-col gap-6">
              <div className="bg-surface-elevated p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-4">
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                  <span>About User</span>
                </h2>
                <div className="flex flex-col gap-3 text-xs text-on-surface-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-medium">Username:</span>
                    <span className="font-semibold text-on-surface">@{profile.username}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-medium">Role:</span>
                    <span className="font-semibold text-on-surface capitalize">{profile.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-medium">Points:</span>
                    <span className="font-bold text-primary">{profile.contribution_score} pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (2 cols): Education & Experiences */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Education History Card */}
              <div className="bg-surface-elevated p-6 sm:p-8 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7C3AED] text-xl">school</span>
                    <span>Education Background</span>
                  </h2>
                  {isSelf && (
                    <button
                      type="button"
                      onClick={() => setAddEduModalOpen(true)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Education</span>
                    </button>
                  )}
                </div>

                {education.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-surface-container border border-border-subtle flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined text-xl">account_balance</span>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-on-surface">
                              {edu.degree_level} in {edu.course}
                            </h3>
                            {isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEducation(edu.id)}
                                className="text-outline hover:text-error transition-colors p-1"
                                title="Delete Education Entry"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            {edu.branch ? `Specialization: ${edu.branch}` : ""}
                          </p>
                          <p className="text-xs text-outline mt-1">
                            {edu.start_year} — {edu.is_current ? "Present (Expected)" : edu.end_year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-on-surface-variant italic bg-surface rounded-xl border border-dashed border-border-subtle">
                    No academic education entries logged yet.
                  </div>
                )}
              </div>

              {/* Recent Experiences Card */}
              <div className="bg-surface-elevated p-6 sm:p-8 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">work_history</span>
                    <span>Shared Experiences</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab("posts")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View All ({posts.length})
                  </button>
                </div>

                {posts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {posts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-on-surface-variant italic bg-surface rounded-xl border border-dashed border-border-subtle">
                    No interview experiences shared yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All Posts */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-6">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="p-12 text-center text-sm text-on-surface-variant bg-surface-elevated rounded-2xl border border-border-subtle">
                No interview experiences found for this account.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Solved Questions */}
        {activeTab === "solved" && (
          <div className="flex flex-col gap-4">
            {completedQuestions.length > 0 ? (
              completedQuestions.map((q) => (
                <div key={q.question_id} className="p-5 bg-surface-elevated rounded-xl border border-border-subtle shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary bg-primary-container/10 px-2.5 py-0.5 rounded-full">
                      {q.post_title || "Interview Problem"}
                    </span>
                    <span className="text-xs text-outline">
                      Solved on {new Date(q.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface font-medium mt-1">
                    {q.question_text || "Attachment Problem Statement"}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-on-surface-variant bg-surface-elevated rounded-2xl border border-border-subtle">
                No questions marked as solved yet.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      <Modal isOpen={editProfileModalOpen} onClose={() => setEditProfileModalOpen(false)} title="Edit Public Profile">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
          {/* Avatar Upload Preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container border border-border-subtle flex items-center justify-center font-bold text-primary text-xl shrink-0">
              {editPhotoUrl ? (
                <img src={editPhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingPhoto}
                className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-container cursor-pointer"
              />
              {uploadingPhoto && <span className="text-[10px] text-primary animate-pulse">Uploading photo...</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface">Full Name</label>
            <input
              type="text"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface">Bio / Headline</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Share a short summary of your background..."
              className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile || uploadingPhoto}
              className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Education Modal */}
      <Modal isOpen={addEduModalOpen} onClose={() => setAddEduModalOpen(false)} title="Add Academic Credential">
        <form onSubmit={handleAddEducation} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Institution</label>
            <select
              value={eduForm.institution_id}
              onChange={(e) => setEduForm({ ...eduForm, institution_id: e.target.value })}
              className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.city}, {inst.country})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Degree Level</label>
              <select
                value={eduForm.degree_level}
                onChange={(e) => setEduForm({ ...eduForm, degree_level: e.target.value })}
                className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
              >
                <option value="Bachelors">Bachelors</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Course</label>
              <input
                type="text"
                value={eduForm.course}
                onChange={(e) => setEduForm({ ...eduForm, course: e.target.value })}
                className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Specialization / Branch</label>
            <input
              type="text"
              value={eduForm.branch}
              onChange={(e) => setEduForm({ ...eduForm, branch: e.target.value })}
              className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Start Year</label>
              <input
                type="number"
                value={eduForm.start_year}
                onChange={(e) => setEduForm({ ...eduForm, start_year: parseInt(e.target.value, 10) })}
                className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">End Year</label>
              <input
                type="number"
                value={eduForm.end_year}
                onChange={(e) => setEduForm({ ...eduForm, end_year: parseInt(e.target.value, 10) })}
                className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setAddEduModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm"
            >
              Save Credential
            </button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="Account Settings">
        <form onSubmit={handleUpdateSettings} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface">Theme Preference</label>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setThemePref(t)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize ${
                    themePref === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-subtle text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-on-surface">Change Password</h3>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-4 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
            />
            <input
              type="password"
              placeholder="New Password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-4 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm"
            >
              Save Settings
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
