import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      name: "Round 1: Online Technical Assessment",
      mode: "online",
      duration_minutes: 60,
      difficulty: "medium",
      questions: [
        {
          id: "q-1",
          question_text: "Find the longest palindromic substring in O(N) or O(N^2) time complexity.",
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

  // Step 2: Add Round / Question Local Helpers
  const addRound = () => {
    const nextNum = rounds.length + 1;
    setRounds((prev) => [
      ...prev,
      {
        id: `round-${Date.now()}`,
        name: `Round ${nextNum}: Technical Evaluation`,
        mode: "online",
        duration_minutes: 45,
        difficulty: "medium",
        questions: [{ id: `q-${Date.now()}`, question_text: "" }],
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

  const addQuestionToRound = (roundIndex: number) => {
    setRounds((prev) => {
      const copy = [...prev];
      copy[roundIndex].questions.push({
        id: `q-${Date.now()}`,
        question_text: "",
      });
      return copy;
    });
  };

  const removeQuestionFromRound = (roundIndex: number, qIndex: number) => {
    setRounds((prev) => {
      const copy = [...prev];
      if (copy[roundIndex].questions.length <= 1) return copy;
      copy[roundIndex].questions = copy[roundIndex].questions.filter((_, i) => i !== qIndex);
      return copy;
    });
  };

  const handleQuestionFileUpload = async (roundIndex: number, qIndex: number, file: File) => {
    try {
      const res = await uploadsApi.uploadFile(file);
      setRounds((prev) => {
        const copy = [...prev];
        copy[roundIndex].questions[qIndex].attachment_url = res.data.url;
        return copy;
      });
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
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col gap-8 flex-1">
        {/* Step Breadcrumbs */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Share Interview Experience</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Help fellow students by detailing your real interview rounds and questions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`px-3 py-1 rounded-full ${
                step === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              1. Basic Info
            </span>
            <span className="text-outline">→</span>
            <span
              className={`px-3 py-1 rounded-full ${
                step === 2 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              2. Rounds
            </span>
            <span className="text-outline">→</span>
            <span
              className={`px-3 py-1 rounded-full ${
                step === 3 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              3. Review & Publish
            </span>
          </div>
        </div>

        {/* STEP 1 FORM */}
        {step === 1 && (
          <form
            onSubmit={handleStep1Submit}
            className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            {/* Category Cards (Stitch 2x2 Layout) */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-on-surface">Select Category *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campus Placement */}
                <label
                  onClick={() => setPostCategory("campus_placement")}
                  className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col gap-2 transition-all ${
                    postCategory === "campus_placement"
                      ? "border-primary bg-primary-container/10 shadow-sm"
                      : "border-border-subtle hover:border-outline-variant bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7C3AED]">work</span>
                    <span className="font-bold text-sm text-on-surface">Campus Placement</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Interview processes and recruitment drives held at your college.
                  </p>
                </label>

                {/* Off-Campus Placement */}
                <label
                  onClick={() => setPostCategory("off_campus_placement")}
                  className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col gap-2 transition-all ${
                    postCategory === "off_campus_placement"
                      ? "border-primary bg-primary-container/10 shadow-sm"
                      : "border-border-subtle hover:border-outline-variant bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0EA5E9]">public</span>
                    <span className="font-bold text-sm text-on-surface">Off-Campus Placement</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Independent career applications, direct referrals, and external interviews.
                  </p>
                </label>

                {/* Campus Hackathon */}
                <label
                  onClick={() => setPostCategory("campus_hackathon")}
                  className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col gap-2 transition-all ${
                    postCategory === "campus_hackathon"
                      ? "border-primary bg-primary-container/10 shadow-sm"
                      : "border-border-subtle hover:border-outline-variant bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7C3AED]">school</span>
                    <span className="font-bold text-sm text-on-surface">Campus Hackathon</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Experience from university and internal institution-hosted hackathons.
                  </p>
                </label>

                {/* Off-Campus Hackathon */}
                <label
                  onClick={() => setPostCategory("off_campus_hackathon")}
                  className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col gap-2 transition-all ${
                    postCategory === "off_campus_hackathon"
                      ? "border-primary bg-primary-container/10 shadow-sm"
                      : "border-border-subtle hover:border-outline-variant bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0EA5E9]">business</span>
                    <span className="font-bold text-sm text-on-surface">Off-Campus Hackathon</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    External, corporate, national, or open global hackathon evaluations.
                  </p>
                </label>
              </div>
            </div>

            <div className="h-px bg-border-subtle my-1"></div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface">Experience Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Google Software Engineer Intern Interview Experience 2024"
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Basic Info Fields (2x2 Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Field */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-on-surface">Company / Organization</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCompanyInput(!showNewCompanyInput)}
                    className="text-[11px] text-primary font-semibold hover:underline"
                  >
                    {showNewCompanyInput ? "Select Existing" : "+ Add New"}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    domain
                  </span>
                  {showNewCompanyInput ? (
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="e.g. Google, Microsoft, Amazon"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  ) : (
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    >
                      <option value="">-- Select Company (Optional) --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.industry ? `(${c.industry})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* College Field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface">
                  College / University {isCampus && <span className="text-[#7C3AED]">*</span>}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    account_balance
                  </span>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. MIT, Stanford, IIT Bombay"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Job Role Field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface">Job Role / Position</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    badge
                  </span>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface">Location / Work Mode</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    location_on
                  </span>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Bengaluru / Remote"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Year of Study or Experience */}
              {isCampus ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option value={1}>1st Year (Undergraduate)</option>
                    <option value={2}>2nd Year (Undergraduate)</option>
                    <option value={3}>3rd Year (Pre-final)</option>
                    <option value={4}>4th Year (Final Year)</option>
                    <option value={5}>Postgraduate / Masters</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>

            {/* Anonymity Switch */}
            <div className="p-4 rounded-xl border border-border-subtle bg-surface flex items-center justify-between gap-4 mt-1">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface">Post Anonymously</span>
                <span className="text-xs text-on-surface-variant">
                  Protect identity. Your name, avatar, and profile handle will be fully redacted.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                  isAnonymous ? "bg-primary" : "bg-surface-container border border-outline-variant"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-surface-elevated shadow-md transition-transform ${
                    isAnonymous ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Step 1 Submit Button */}
            <div className="flex justify-end pt-4 border-t border-border-subtle">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>Continue to Rounds</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 FORM */}
        {step === 2 && (
          <form
            onSubmit={handleStep2Submit}
            className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            <div className="flex justify-between items-center border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Interview Rounds & Questions</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Record each round's format and the specific questions or challenges asked.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {rounds.map((round, rIndex) => (
                <div
                  key={round.id}
                  className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-sm flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <span className="text-sm font-bold text-primary flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">
                        {rIndex + 1}
                      </span>
                      <span>Round #{rIndex + 1}</span>
                    </span>
                    {rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRound(rIndex)}
                        className="text-xs font-semibold text-error hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Remove Round
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Round Name / Focus *</label>
                      <input
                        type="text"
                        required
                        value={round.name}
                        onChange={(e) => {
                          const copy = [...rounds];
                          copy[rIndex].name = e.target.value;
                          setRounds(copy);
                        }}
                        placeholder="e.g. Technical Round 1: DSA & Problem Solving"
                        className="p-3 bg-surface-elevated border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface">Mode</label>
                      <select
                        value={round.mode}
                        onChange={(e) => {
                          const copy = [...rounds];
                          copy[rIndex].mode = e.target.value as "online" | "offline";
                          setRounds(copy);
                        }}
                        className="p-3 bg-surface-elevated border border-outline-variant rounded-xl text-xs text-on-surface outline-none"
                      >
                        <option value="online">Virtual / Online</option>
                        <option value="offline">On-Site / Offline</option>
                      </select>
                    </div>
                  </div>

                  {/* Questions in round */}
                  <div className="flex flex-col gap-3 pt-2">
                    <label className="text-xs font-bold text-on-surface">
                      Questions / Challenges Asked
                    </label>

                    {round.questions.map((q, qIndex) => (
                      <div key={q.id} className="flex flex-col gap-2 p-3 bg-surface-container-low/60 rounded-xl border border-border-subtle/70">
                        <div className="flex gap-2 items-start">
                          <span className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center font-bold text-[11px] text-on-surface-variant shrink-0 mt-2">
                            Q{qIndex + 1}
                          </span>
                          <textarea
                            rows={2}
                            required
                            value={q.question_text}
                            onChange={(e) => {
                              const copy = [...rounds];
                              copy[rIndex].questions[qIndex].question_text = e.target.value;
                              setRounds(copy);
                            }}
                            placeholder="Problem statement, inputs/outputs, algorithmic constraints, or system design questions..."
                            className="flex-grow p-3 bg-surface-elevated border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                          {round.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestionFromRound(rIndex, qIndex)}
                              className="p-2 text-on-surface-variant hover:text-error transition-colors mt-2"
                              title="Remove Question"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          )}
                        </div>

                        {/* Attachment Upload Row */}
                        <div className="flex items-center gap-3 pl-8 text-xs">
                          <label className="cursor-pointer inline-flex items-center gap-1 text-primary hover:underline font-semibold">
                            <span className="material-symbols-outlined text-base">attach_file</span>
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium truncate max-w-xs">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              <span className="truncate">{q.attachment_url.split("/").pop()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addQuestionToRound(rIndex)}
                      className="self-start px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-elevated text-xs font-semibold text-primary hover:bg-surface-container transition-all flex items-center gap-1 mt-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Another Question
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addRound}
                className="w-full py-3.5 rounded-xl border border-dashed border-primary/40 bg-primary-container/5 hover:bg-primary-container/10 text-xs font-bold text-primary transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Add Another Round
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                ← Back to Step 1
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>Continue to Review</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 FORM */}
        {step === 3 && (
          <form
            onSubmit={handleStep3Publish}
            className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            <div className="border-b border-border-subtle pb-4">
              <h2 className="text-xl font-bold text-on-surface">Experience Review & Narrative</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Share your overall experience narrative, outcome, and advice for future candidates.
              </p>
            </div>

            {/* Offer Received Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface">Outcome / Offer Status *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsOfferReceived(true)}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    isOfferReceived
                      ? "border-[#22C55E] bg-[#22C55E]/10 text-[#15803d] font-bold shadow-sm"
                      : "border-border-subtle bg-surface text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-[#22C55E]">check_circle</span>
                  <span className="text-xs sm:text-sm">Offer Received</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfferReceived(false)}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    !isOfferReceived
                      ? "border-error bg-error/10 text-error font-bold shadow-sm"
                      : "border-border-subtle bg-surface text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-error">cancel</span>
                  <span className="text-xs sm:text-sm">No Offer</span>
                </button>
              </div>
            </div>

            {/* Package & Role if Offer Received */}
            {isOfferReceived && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface">Offered Position *</label>
                  <input
                    type="text"
                    required
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Associate Software Engineer"
                    className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface">Total Package / CTC</label>
                  <div className="flex gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface w-24 outline-none"
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
                      className="flex-grow p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Experience Text */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface">
                Overall Interview Experience Narrative *
              </label>
              <textarea
                rows={5}
                required
                value={experienceText}
                onChange={(e) => setExperienceText(e.target.value)}
                placeholder="Detail your timeline, how the interviewers conducted themselves, technical depth, and what strategies helped you the most..."
                className="p-3.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface leading-relaxed outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Preparation Tips */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface">
                Key Preparation Tips & Recommended Topics
              </label>
              <textarea
                rows={3}
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="Important algorithms, system design topics, standard mock interview resources, or mistakes to avoid..."
                className="p-3.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface leading-relaxed outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Publish Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                ← Back to Step 2
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>{loading ? "Publishing..." : "Publish Experience"}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </AppShell>
  );
};
