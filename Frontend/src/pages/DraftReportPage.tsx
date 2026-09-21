import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Globe,
  School,
  Building2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  FileEdit,
  GraduationCap,
  Shield,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { Company } from "../types";
import { postsApi, companiesApi, uploadsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface QuestionDraft {
  id: string;
  question_text: string;
  attachment_url?: string;
}

interface RoundDraft {
  id: string;
  name: string;
  mode: "online" | "offline";
  duration_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  questions: QuestionDraft[];
}

export const DraftReportPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Available Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // STEP 1 STATE: General Intelligence
  const [title, setTitle] = useState("");
  const [postCategory, setPostCategory] = useState<
    "campus_placement" | "off_campus_placement" | "campus_hackathon" | "off_campus_hackathon"
  >("campus_placement");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [yearOfStudy, setYearOfStudy] = useState<number>(3);
  const [experienceYears, setExperienceYears] = useState<string>("");
  const [workLocation, setWorkLocation] = useState("");

  // STEP 2 STATE: Rounds & Questions
  const [rounds, setRounds] = useState<RoundDraft[]>([
    {
      id: "round-1",
      name: "",
      mode: "online",
      duration_minutes: 60,
      difficulty: "medium",
      questions: [
        {
          id: "q-1",
          question_text: "",
        },
      ],
    },
  ]);

  // STEP 3 STATE: Narrative & Publish Terms
  const [experienceText, setExperienceText] = useState("");
  const [tips, setTips] = useState("");
  const [isOfferReceived, setIsOfferReceived] = useState(true);
  const [jobRole, setJobRole] = useState("Software Development Engineer");
  const [packageAmount, setPackageAmount] = useState<string>("1200000");
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login");
    }
  }, [isAuthenticated, openAuthModal]);

  useEffect(() => {
    companiesApi
      .list(undefined, 1, 100)
      .then((res) => {
        setCompanies(res.data.items || []);
      })
      .catch(() => {});
  }, []);

  // Step 1: Submit Draft Post
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!title.trim()) {
      error("Experience title is required.");
      return;
    }

    setLoading(true);
    try {
      let compId = selectedCompanyId;
      if (showNewCompanyInput && newCompanyName.trim()) {
        const cRes = await companiesApi.create({ name: newCompanyName.trim() });
        compId = cRes.data.id;
        setCompanies((prev) => [...prev, cRes.data]);
        setSelectedCompanyId(compId);
      }

      const payload = {
        title: title.trim(),
        post_category: postCategory,
        company_id: compId || undefined,
        is_anonymous: isAnonymous,
        year_of_study: postCategory.includes("campus") ? yearOfStudy : undefined,
        experience_years: experienceYears ? parseFloat(experienceYears) : undefined,
        work_location: workLocation.trim() || undefined,
      };

      const res = await postsApi.createDraft(payload);
      setCreatedPostId(res.data.post_id);
      success("Draft initialized successfully.", "Draft Saved");
      setStep(2);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to initialize draft experience.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Add Round / Question Local Helpers with immutable updates & unique keys
  const addRound = () => {
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const qUniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setRounds((prev) => [
      ...prev,
      {
        id: `round-${uniqueId}`,
        name: "",
        mode: "online",
        duration_minutes: 45,
        difficulty: "medium",
        questions: [{ id: `q-${qUniqueId}`, question_text: "" }],
      },
    ]);
  };

  const removeRound = (roundIndex: number) => {
    if (rounds.length <= 1) {
      error("At least one evaluation round is required.");
      return;
    }
    setRounds((prev) => prev.filter((_, i) => i !== roundIndex));
  };

  const updateRoundName = (roundIndex: number, name: string) => {
    setRounds((prev) =>
      prev.map((r, rIdx) => (rIdx === roundIndex ? { ...r, name } : r))
    );
  };

  const updateRoundMode = (roundIndex: number, mode: "online" | "offline") => {
    setRounds((prev) =>
      prev.map((r, rIdx) => (rIdx === roundIndex ? { ...r, mode } : r))
    );
  };

  const addQuestionToRound = (roundIndex: number) => {
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setRounds((prev) =>
      prev.map((r, rIdx) => {
        if (rIdx !== roundIndex) return r;
        return {
          ...r,
          questions: [
            ...r.questions,
            {
              id: `q-${uniqueId}`,
              question_text: "",
            },
          ],
        };
      })
    );
  };

  const removeQuestionFromRound = (roundIndex: number, qIndex: number) => {
    setRounds((prev) =>
      prev.map((r, rIdx) => {
        if (rIdx !== roundIndex) return r;
        if (r.questions.length <= 1) return r;
        return {
          ...r,
          questions: r.questions.filter((_, qIdx) => qIdx !== qIndex),
        };
      })
    );
  };

  const updateQuestionText = (roundIndex: number, qIndex: number, text: string) => {
    setRounds((prev) =>
      prev.map((r, rIdx) => {
        if (rIdx !== roundIndex) return r;
        return {
          ...r,
          questions: r.questions.map((q, qIdx) =>
            qIdx === qIndex ? { ...q, question_text: text } : q
          ),
        };
      })
    );
  };

  const handleQuestionFileUpload = async (roundIndex: number, qIndex: number, file: File) => {
    try {
      const res = await uploadsApi.uploadFile(file);
      setRounds((prev) =>
        prev.map((r, rIdx) => {
          if (rIdx !== roundIndex) return r;
          return {
            ...r,
            questions: r.questions.map((q, qIdx) =>
              qIdx === qIndex ? { ...q, attachment_url: res.data.url } : q
            ),
          };
        })
      );
      success("Attachment uploaded.", "File Uploaded");
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to upload question attachment.");
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdPostId) {
      error("Missing post identifier. Please return to Step 1.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const rRes = await postsApi.addRound(createdPostId, {
          name: r.name,
          mode: r.mode,
          duration_minutes: r.duration_minutes,
          difficulty: r.difficulty,
          round_number: i + 1,
        });
        const roundId = rRes.data.post_round_id;

        for (const q of r.questions) {
          if (q.question_text.trim()) {
            await postsApi.addQuestion(createdPostId, roundId, {
              question_text: q.question_text.trim(),
              attachment_url: q.attachment_url || undefined,
            });
          }
        }
      }

      success("Rounds and questions saved to draft.", "Rounds Saved");
      setStep(3);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to commit rounds to draft.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Final Publishing
  const handleStep3Publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdPostId) {
      error("Missing post identifier. Please return to Step 1.");
      return;
    }
    if (!experienceText.trim()) {
      error("Experience narrative is required.");
      return;
    }
    if (isOfferReceived && !jobRole.trim()) {
      error("Job role is required when an offer is received.");
      return;
    }

    setLoading(true);
    try {
      await postsApi.publishDraft(createdPostId, {
        experience_text: experienceText.trim(),
        tips: tips.trim() || undefined,
        is_offer_received: isOfferReceived,
        job_role: jobRole.trim() || undefined,
        package_amount: packageAmount ? parseFloat(packageAmount) : undefined,
        currency,
      });

      success("Experience published to public feed!", "Published");
      navigate(`/posts/${createdPostId}`);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to publish experience.");
    } finally {
      setLoading(false);
    }
  };

  const isCampus = postCategory.includes("campus") && !postCategory.includes("off");

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-6 flex-1">
        {/* Step Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#e3dccd] pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2f6b47] mb-1">
              <FileEdit className="w-4 h-4 text-[#3f6f52]" />
              <span className="uppercase tracking-wider">CREATOR WORKSPACE</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f1926]">Share Interview Experience</h1>
            <p className="text-xs text-[#5f6e82] mt-0.5">
              Help fellow students and candidates by detailing your real interview rounds and questions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`px-3 py-1 rounded-full transition-all ${
                step === 1
                  ? "bg-[#3f6f52] text-white shadow-sm font-bold"
                  : "bg-[#f3eee1] text-[#5f6e82] border border-[#e3dccd]"
              }`}
            >
              1. Basic Info
            </span>
            <span className="text-[#5f6e82]/50">→</span>
            <span
              className={`px-3 py-1 rounded-full transition-all ${
                step === 2
                  ? "bg-[#3f6f52] text-white shadow-sm font-bold"
                  : "bg-[#f3eee1] text-[#5f6e82] border border-[#e3dccd]"
              }`}
            >
              2. Rounds
            </span>
            <span className="text-[#5f6e82]/50">→</span>
            <span
              className={`px-3 py-1 rounded-full transition-all ${
                step === 3
                  ? "bg-[#3f6f52] text-white shadow-sm font-bold"
                  : "bg-[#f3eee1] text-[#5f6e82] border border-[#e3dccd]"
              }`}
            >
              3. Publish
            </span>
          </div>
        </div>

        {/* STEP 1 FORM */}
        {step === 1 && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleStep1Submit}
            className="bg-white rounded-2xl border border-[#e3dccd] p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            {/* Category Cards (2x2 Layout) */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-[#0f1926] uppercase tracking-wider">Select Category *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Campus Placement */}
                <label
                  onClick={() => setPostCategory("campus_placement")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col gap-1.5 transition-all ${
                    postCategory === "campus_placement"
                      ? "border-[#3f6f52] bg-[#3f6f52]/10 shadow-sm"
                      : "border-[#e3dccd] hover:border-[#3f6f52]/50 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#3f6f52]" />
                    <span className="font-bold text-sm text-[#0f1926]">Campus Placement</span>
                  </div>
                  <p className="text-xs text-[#5f6e82]">
                    Interview processes and recruitment drives held on your college campus.
                  </p>
                </label>

                {/* Off-Campus Placement */}
                <label
                  onClick={() => setPostCategory("off_campus_placement")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col gap-1.5 transition-all ${
                    postCategory === "off_campus_placement"
                      ? "border-[#3f6f52] bg-[#3f6f52]/10 shadow-sm"
                      : "border-[#e3dccd] hover:border-[#3f6f52]/50 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#3f6f9e]" />
                    <span className="font-bold text-sm text-[#0f1926]">Off-Campus Placement</span>
                  </div>
                  <p className="text-xs text-[#5f6e82]">
                    Independent career applications, direct referrals, and external hiring.
                  </p>
                </label>

                {/* Campus Hackathon */}
                <label
                  onClick={() => setPostCategory("campus_hackathon")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col gap-1.5 transition-all ${
                    postCategory === "campus_hackathon"
                      ? "border-[#3f6f52] bg-[#3f6f52]/10 shadow-sm"
                      : "border-[#e3dccd] hover:border-[#3f6f52]/50 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-[#b26a00]" />
                    <span className="font-bold text-sm text-[#0f1926]">Campus Hackathon</span>
                  </div>
                  <p className="text-xs text-[#5f6e82]">
                    Experience from university-hosted and internal collegiate hackathons.
                  </p>
                </label>

                {/* Off-Campus Hackathon */}
                <label
                  onClick={() => setPostCategory("off_campus_hackathon")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col gap-1.5 transition-all ${
                    postCategory === "off_campus_hackathon"
                      ? "border-[#3f6f52] bg-[#3f6f52]/10 shadow-sm"
                      : "border-[#e3dccd] hover:border-[#3f6f52]/50 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#b26a00]" />
                    <span className="font-bold text-sm text-[#0f1926]">Off-Campus Hackathon</span>
                  </div>
                  <p className="text-xs text-[#5f6e82]">
                    External, corporate, national, or open global hackathon evaluations.
                  </p>
                </label>
              </div>
            </div>

            <div className="h-px bg-[#e3dccd] my-1"></div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0f1926]">Experience Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Google Software Engineer Intern Interview Experience 2024"
                className="w-full bg-[#f3eee1] border border-[#e3dccd] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:border-[#3f6f52] focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Basic Info Fields (2x2 Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#0f1926]">Company / Organization</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCompanyInput(!showNewCompanyInput)}
                    className="text-[11px] text-[#2f6b47] font-semibold hover:underline"
                  >
                    {showNewCompanyInput ? "Select Existing" : "+ Add New"}
                  </button>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6e82] pointer-events-none" />
                  {showNewCompanyInput ? (
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="e.g. Google, Microsoft, Amazon"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
                    />
                  ) : (
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="" className="bg-white text-[#0f1926]">-- Select Company (Optional) --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white text-[#0f1926]">
                          {c.name} {c.industry ? `(${c.industry})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* College Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f1926]">
                  College / University {isCampus && <span className="text-[#3f6f52]">*</span>}
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6e82] pointer-events-none" />
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. MIT, Stanford, IIT Bombay"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Job Role Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f1926]">Job Role / Position</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6e82] pointer-events-none" />
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f1926]">Location / Work Mode</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6e82] pointer-events-none" />
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Bengaluru / Remote"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Year of Study or Experience */}
              {isCampus ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0f1926]">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none cursor-pointer"
                  >
                    <option value={1} className="bg-white text-[#0f1926]">1st Year (Undergraduate)</option>
                    <option value={2} className="bg-white text-[#0f1926]">2nd Year (Undergraduate)</option>
                    <option value={3} className="bg-white text-[#0f1926]">3rd Year (Pre-final)</option>
                    <option value={4} className="bg-white text-[#0f1926]">4th Year (Final Year)</option>
                    <option value={5} className="bg-white text-[#0f1926]">Postgraduate / Masters</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0f1926]">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e3dccd] bg-[#f3eee1] text-xs sm:text-sm text-[#0f1926] placeholder-[#5f6e82] focus:ring-1 focus:ring-[#3f6f52] focus:bg-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* Anonymity Switch */}
            <div className="p-4 rounded-xl border border-[#e3dccd] bg-[#faf7ee] flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-[#0f1926] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#3f6f52]" />
                  Post Anonymously
                </span>
                <span className="text-[11px] text-[#5f6e82] mt-0.5">
                  Protect identity. Your name, avatar, and profile handle will be fully redacted.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                  isAnonymous ? "bg-[#3f6f52]" : "bg-[#e3dccd]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    isAnonymous ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Step 1 Submit Button */}
            <div className="flex justify-end pt-4 border-t border-[#e3dccd]">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#3f6f52] hover:bg-[#345c44] text-white font-semibold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>Continue to Rounds</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* STEP 2 FORM */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleStep2Submit}
            className="bg-white rounded-2xl border border-[#e3dccd] p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            <div className="flex justify-between items-center border-b border-[#e3dccd] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f1926]">Interview Rounds & Questions</h2>
                <p className="text-xs text-[#5f6e82] mt-0.5">
                  Record each round's format and the specific technical challenges asked.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {rounds.map((round, rIndex) => (
                <div
                  key={round.id}
                  className="bg-[#faf7ee] rounded-2xl border border-[#e3dccd] p-5 shadow-xs flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-[#e3dccd] pb-3">
                    <span className="w-7 h-7 rounded-lg bg-[#3f6f52] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {rIndex + 1}
                    </span>
                    {rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRound(rIndex)}
                        className="text-xs font-semibold text-[#b5462f] hover:underline flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Round</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#0f1926]">Round Name / Focus *</label>
                      <input
                        type="text"
                        required
                        value={round.name}
                        onChange={(e) => updateRoundName(rIndex, e.target.value)}
                        placeholder="e.g. Technical Round (DSA & System Design), HR, Online Assessment..."
                        className="p-2.5 bg-white border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] outline-none focus:ring-1 focus:ring-[#3f6f52]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#0f1926]">Mode</label>
                      <select
                        value={round.mode}
                        onChange={(e) => updateRoundMode(rIndex, e.target.value as "online" | "offline")}
                        className="p-2.5 bg-white border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] outline-none"
                      >
                        <option value="online">Virtual / Online</option>
                        <option value="offline">On-Site / Offline</option>
                      </select>
                    </div>
                  </div>

                  {/* Questions in round */}
                  <div className="flex flex-col gap-3 pt-2">
                    <label className="text-xs font-bold text-[#0f1926]">
                      Questions / Challenges Asked
                    </label>

                    {round.questions.map((q, qIndex) => (
                      <div key={q.id} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-[#e3dccd]">
                        <div className="flex gap-2 items-start">
                          <span className="w-6 h-6 rounded-lg bg-[#f3eee1] flex items-center justify-center font-bold text-[11px] text-[#5f6e82] shrink-0 mt-2">
                            Q{qIndex + 1}
                          </span>
                          <textarea
                            rows={2}
                            required
                            value={q.question_text}
                            onChange={(e) => updateQuestionText(rIndex, qIndex, e.target.value)}
                            placeholder="Problem statement, algorithmic constraints, or system design questions..."
                            className="flex-grow p-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] outline-none focus:ring-1 focus:ring-[#3f6f52] focus:bg-white resize-none"
                          />
                          {round.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestionFromRound(rIndex, qIndex)}
                              className="p-2 text-[#5f6e82] hover:text-[#b5462f] transition-colors mt-2"
                              title="Remove Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Attachment Upload Row */}
                        <div className="flex items-center gap-3 pl-8 text-xs">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 text-[#2f6b47] hover:underline font-semibold transition-colors">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{q.attachment_url ? "Replace Attachment" : "Attach Diagram / PDF"}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleQuestionFileUpload(rIndex, qIndex, f);
                              }}
                            />
                          </label>
                          {q.attachment_url && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3f6f52]/10 border border-[#3f6f52]/20 text-[#2f6b47] text-[11px] font-medium truncate max-w-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="truncate">{q.attachment_url.split("/").pop()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addQuestionToRound(rIndex)}
                      className="self-start px-3 py-1.5 rounded-xl border border-[#e3dccd] bg-white text-xs font-semibold text-[#2f6b47] hover:bg-[#f3eee1] transition-all flex items-center gap-1.5 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Question</span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addRound}
                className="w-full py-3 rounded-xl border border-dashed border-[#3f6f52]/40 bg-[#3f6f52]/5 hover:bg-[#3f6f52]/10 text-xs font-bold text-[#2f6b47] transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Round</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#e3dccd]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-[#e3dccd] text-xs font-semibold text-[#2b3a4f] hover:bg-[#f3eee1] flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#3f6f52] hover:bg-[#345c44] text-white font-semibold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* STEP 3 FORM */}
        {step === 3 && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleStep3Publish}
            className="bg-white rounded-2xl border border-[#e3dccd] p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            <div className="border-b border-[#e3dccd] pb-4">
              <h2 className="text-lg font-bold text-[#0f1926]">Experience Review & Narrative</h2>
              <p className="text-xs text-[#5f6e82] mt-0.5">
                Share your overall experience narrative, outcome, and advice for future candidates.
              </p>
            </div>

            {/* Offer Received Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0f1926]">Outcome / Offer Status *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfferReceived(true)}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
                    isOfferReceived
                      ? "border-[#2f7d52] bg-[#2f7d52]/10 text-[#2f7d52] font-bold shadow-sm"
                      : "border-[#e3dccd] bg-white text-[#5f6e82]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#2f7d52]" />
                  <span className="text-xs sm:text-sm">Offer Received</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfferReceived(false)}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
                    !isOfferReceived
                      ? "border-[#b5462f] bg-[#b5462f]/10 text-[#b5462f] font-bold shadow-sm"
                      : "border-[#e3dccd] bg-white text-[#5f6e82]"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-[#b5462f]" />
                  <span className="text-xs sm:text-sm">No Offer</span>
                </button>
              </div>
            </div>

            {/* Package & Role if Offer Received */}
            {isOfferReceived && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0f1926]">Offered Position *</label>
                  <input
                    type="text"
                    required
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Associate Software Engineer"
                    className="p-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] outline-none focus:ring-1 focus:ring-[#3f6f52] focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0f1926]">Total Package / CTC</label>
                  <div className="flex gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="p-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] w-24 outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={packageAmount}
                      onChange={(e) => setPackageAmount(e.target.value)}
                      placeholder="e.g. 1800000"
                      className="flex-grow p-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] outline-none focus:ring-1 focus:ring-[#3f6f52] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Experience Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f1926]">
                Overall Interview Experience Narrative *
              </label>
              <textarea
                rows={5}
                required
                value={experienceText}
                onChange={(e) => setExperienceText(e.target.value)}
                placeholder="Detail your timeline, how the interviewers conducted themselves, technical depth, and strategies that helped..."
                className="p-3 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] leading-relaxed outline-none focus:ring-1 focus:ring-[#3f6f52] focus:bg-white resize-none"
              />
            </div>

            {/* Preparation Tips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0f1926]">
                Key Preparation Tips & Recommended Topics
              </label>
              <textarea
                rows={3}
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="Important algorithms, system design topics, mock resources, or common pitfalls to avoid..."
                className="p-3 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] leading-relaxed outline-none focus:ring-1 focus:ring-[#3f6f52] focus:bg-white resize-none"
              />
            </div>

            {/* Publish Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-[#e3dccd]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl border border-[#e3dccd] text-xs font-semibold text-[#2b3a4f] hover:bg-[#f3eee1] flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 2</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#3f6f52] hover:bg-[#345c44] text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Publishing..." : "Publish Experience"}</span>
              </button>
            </div>
          </motion.form>
        )}
      </main>
    </AppShell>
  );
};
