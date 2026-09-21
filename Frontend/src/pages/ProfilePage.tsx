import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  const [themePref, setThemePref] = useState<"light" | "dark" | "system">("dark");
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
          usersApi.getMySettings().catch(() => ({ data: { theme_preference: "dark" } })),
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
        setThemePref((setRes.data as UserSettings).theme_preference || "dark");
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
          <div className="bg-[#f3eee1] rounded-2xl border border-[#e3dccd] p-8 h-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#f3eee1] rounded-2xl border border-[#e3dccd] p-6 h-96"></div>
            <div className="lg:col-span-2 bg-[#f3eee1] rounded-2xl border border-[#e3dccd] p-6 h-96"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-16 text-center">
          <h2 className="text-xl font-bold text-[#0f1926]">User Not Found</h2>
          <p className="text-sm text-[#5f6e82] mt-2">
            The profile you are trying to view does not exist or has been deactivated.
          </p>
        </div>
      </AppShell>
    );
  }

  const primaryEducation = education.find((e) => e.is_current) || education[0];

  return (
    <AppShell>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full flex flex-col gap-6 flex-1">
        {/* Header Profile Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#e3dccd] shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative overflow-hidden"
        >
          <div className="flex flex-col gap-4 flex-1 relative z-10">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#3f6f52]/30 bg-[#3f6f52] flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm">
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
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f1926] tracking-tight">
                    {profile.full_name || `@${profile.username}`}
                  </h1>
                  <span title="Verified Member">
                    <ShieldCheck className="w-5 h-5 text-[#3f6f52]" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5f6e82] font-medium mt-0.5">
                  @{profile.username}
                </p>
                <span className="text-xs text-[#5f6e82] mt-1 capitalize font-medium">
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
                      className="px-4 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] hover:bg-white text-[#0f1926] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsModalOpen(true)}
                      className="px-4 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] hover:bg-white text-[#0f1926] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleMessageUser}
                      className="px-4 py-2 rounded-xl border border-[#3f6f52]/30 bg-[#3f6f52]/10 text-[#2f6b47] hover:bg-[#3f6f52]/20 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                        isFollowing
                          ? "bg-[#f3eee1] text-[#5f6e82] border border-[#e3dccd]"
                          : "bg-[#3f6f52] hover:bg-[#345c44] text-white"
                      }`}
                    >
                      {isFollowing ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      <span>{isFollowing ? "Following" : "Follow"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {primaryEducation && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2b3a4f] font-medium">
                <School className="w-4 h-4 text-[#3f6f52]" />
                <span>
                  {primaryEducation.degree_level} in {primaryEducation.course}
                </span>
              </div>
            )}

            {profile.bio && (
              <p className="text-xs sm:text-sm text-[#2b3a4f] leading-relaxed max-w-3xl">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-between border-t border-[#e3dccd] pt-4 mt-2 gap-6">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-[#0f1926]">
                    {profile.contribution_score.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-[#5f6e82] uppercase tracking-wider">
                    Contribution
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-[#0f1926]">
                    {followerCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-[#5f6e82] uppercase tracking-wider">
                    Followers
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-[#0f1926]">
                    {followingCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-[#5f6e82] uppercase tracking-wider">
                    Following
                  </span>
                </div>
              </div>

              {profile.contribution_score > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3f6f52]/10 border border-[#3f6f52]/20 text-[#2f6b47] text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-[#b26a00]" />
                  <span>Active Contributor</span>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Profile Tabs */}
        <div className="border-b border-[#e3dccd] flex items-center justify-between">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-[#3f6f52] text-[#2f6b47]"
                  : "border-transparent text-[#5f6e82] hover:text-[#0f1926]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Profile Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("posts")}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "posts"
                  ? "border-[#3f6f52] text-[#2f6b47]"
                  : "border-transparent text-[#5f6e82] hover:text-[#0f1926]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Experiences ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("solved")}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "solved"
                  ? "border-[#3f6f52] text-[#2f6b47]"
                  : "border-transparent text-[#5f6e82] hover:text-[#0f1926]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Solved Questions ({completedQuestions.length})</span>
            </button>
          </nav>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (1 col): About & Credentials */}
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#e3dccd] shadow-sm flex flex-col gap-4">
                <h2 className="text-sm font-bold text-[#0f1926] flex items-center gap-2 border-b border-[#e3dccd] pb-3">
                  <User className="w-4 h-4 text-[#3f6f52]" />
                  <span>About User</span>
                </h2>
                <div className="flex flex-col gap-3 text-xs text-[#2b3a4f]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#5f6e82] font-medium">Username:</span>
                    <span className="font-semibold text-[#0f1926]">@{profile.username}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5f6e82] font-medium">Role:</span>
                    <span className="font-semibold text-[#0f1926] capitalize">{profile.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5f6e82] font-medium">Points:</span>
                    <span className="font-bold text-[#b26a00]">{profile.contribution_score} pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (2 cols): Education & Experiences */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Education History Card */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e3dccd] shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#e3dccd] pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-[#0f1926] flex items-center gap-2">
                    <School className="w-4 h-4 text-[#3f6f52]" />
                    <span>Education Background</span>
                  </h2>
                  {isSelf && (
                    <button
                      type="button"
                      onClick={() => setAddEduModalOpen(true)}
                      className="text-xs font-semibold text-[#2f6b47] hover:underline flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Education</span>
                    </button>
                  )}
                </div>

                {education.length > 0 ? (
                  <div className="flex flex-col gap-3.5">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex gap-4 items-start p-3.5 bg-[#faf7ee] rounded-xl border border-[#e3dccd]">
                        <div className="w-10 h-10 rounded-xl bg-[#3f6f52]/10 border border-[#3f6f52]/20 flex items-center justify-center shrink-0 text-[#3f6f52]">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[#0f1926]">
                              {edu.degree_level} in {edu.course}
                            </h3>
                            {isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEducation(edu.id)}
                                className="text-[#5f6e82] hover:text-[#b5462f] transition-colors p-1"
                                title="Delete Education Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[#2b3a4f] font-medium mt-0.5">
                            {edu.branch ? `Specialization: ${edu.branch}` : ""}
                          </p>
                          <p className="text-xs text-[#5f6e82] mt-1">
                            {edu.start_year} — {edu.is_current ? "Present (Expected)" : edu.end_year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#5f6e82] italic bg-[#faf7ee] rounded-xl border border-dashed border-[#e3dccd]">
                    No academic education entries logged yet.
                  </div>
                )}
              </div>

              {/* Recent Experiences Card */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e3dccd] shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#e3dccd] pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-[#0f1926] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#3f6f52]" />
                    <span>Shared Experiences</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab("posts")}
                    className="text-xs font-semibold text-[#2f6b47] hover:underline transition-colors"
                  >
                    View All ({posts.length})
                  </button>
                </div>

                {posts.length > 0 ? (
                  <div className="flex flex-col gap-3.5">
                    {posts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#5f6e82] italic bg-[#faf7ee] rounded-xl border border-dashed border-[#e3dccd]">
                    No interview experiences shared yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All Posts */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="p-12 text-center text-sm text-[#5f6e82] bg-white rounded-2xl border border-[#e3dccd]">
                No interview experiences found for this account.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Solved Questions */}
        {activeTab === "solved" && (
          <div className="flex flex-col gap-3">
            {completedQuestions.length > 0 ? (
              completedQuestions.map((q) => (
                <div key={q.question_id} className="p-5 bg-white rounded-2xl border border-[#e3dccd] shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2f6b47] bg-[#3f6f52]/10 border border-[#3f6f52]/20 px-3 py-0.5 rounded-full">
                      {q.post_title || "Interview Problem"}
                    </span>
                    <span className="text-xs text-[#5f6e82]">
                      Solved on {new Date(q.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#0f1926] font-medium mt-1 leading-relaxed">
                    {q.question_text || "Attachment Problem Statement"}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-[#5f6e82] bg-white rounded-2xl border border-[#e3dccd]">
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
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f3eee1] border border-[#e3dccd] flex items-center justify-center font-bold text-[#0f1926] text-xl shrink-0">
              {editPhotoUrl ? (
                <img src={editPhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#0f1926] flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-[#3f6f52]" />
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingPhoto}
                className="text-xs text-[#5f6e82] file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#3f6f52] file:text-white hover:file:bg-[#345c44] cursor-pointer"
              />
              {uploadingPhoto && <span className="text-[10px] text-[#3f6f52] animate-pulse">Uploading photo...</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0f1926]">Full Name</label>
            <input
              type="text"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="px-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#0f1926]">Bio / Headline</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Share a short summary of your background..."
              className="px-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5f6e82] hover:bg-[#f3eee1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile || uploadingPhoto}
              className="px-5 py-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white text-xs font-bold shadow-sm disabled:opacity-50"
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
            <label className="text-xs font-bold text-[#0f1926]">Institution</label>
            <select
              value={eduForm.institution_id}
              onChange={(e) => setEduForm({ ...eduForm, institution_id: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs text-[#0f1926] focus:bg-white outline-none"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id} className="bg-white text-[#0f1926]">
                  {inst.name} ({inst.city}, {inst.country})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#0f1926]">Degree Level</label>
              <select
                value={eduForm.degree_level}
                onChange={(e) => setEduForm({ ...eduForm, degree_level: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs text-[#0f1926] focus:bg-white outline-none"
              >
                <option value="Bachelors" className="bg-white text-[#0f1926]">Bachelors</option>
                <option value="Masters" className="bg-white text-[#0f1926]">Masters</option>
                <option value="PhD" className="bg-white text-[#0f1926]">PhD</option>
                <option value="Diploma" className="bg-white text-[#0f1926]">Diploma</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#0f1926]">Course</label>
              <input
                type="text"
                value={eduForm.course}
                onChange={(e) => setEduForm({ ...eduForm, course: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs text-[#0f1926] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0f1926]">Specialization / Branch</label>
            <input
              type="text"
              value={eduForm.branch}
              onChange={(e) => setEduForm({ ...eduForm, branch: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs text-[#0f1926] focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#0f1926]">Start Year</label>
              <input
                type="number"
                value={eduForm.start_year}
                onChange={(e) => setEduForm({ ...eduForm, start_year: parseInt(e.target.value, 10) })}
                className="px-3 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs text-[#0f1926] focus:bg-white outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#0f1926]">End Year</label>
              <input
                type="number"
                value={eduForm.end_year}
                onChange={(e) => setEduForm({ ...eduForm, end_year: parseInt(e.target.value, 10) })}
                className="px-3 py-2 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs text-[#0f1926] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setAddEduModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5f6e82] hover:bg-[#f3eee1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white text-xs font-bold shadow-sm"
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
            <label className="text-xs font-bold text-[#0f1926]">Theme Preference</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setThemePref(t)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 capitalize text-xs font-semibold transition-all ${
                    themePref === t
                      ? "border-[#3f6f52] bg-[#3f6f52]/10 text-[#2f6b47] shadow-sm"
                      : "border-[#e3dccd] bg-[#f3eee1] text-[#5f6e82] hover:border-[#3f6f52]/40"
                  }`}
                >
                  {t === "light" && <Sun className="w-4 h-4" />}
                  {t === "dark" && <Moon className="w-4 h-4" />}
                  {t === "system" && <Monitor className="w-4 h-4" />}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#e3dccd]"></div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#0f1926] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#3f6f52]" />
              <span>Change Password</span>
            </h3>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password"
              className="px-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password (min 8 chars)"
              className="px-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5f6e82] hover:bg-[#f3eee1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white text-xs font-bold shadow-sm"
            >
              Save Settings
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
