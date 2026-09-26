import React, { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  FileEdit,
  Globe,
  GraduationCap,
  MapPin,
  Paperclip,
  Plus,
  Send,
  School,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { PageContainer } from "../components/layout/AppShell";
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Divider,
  Field,
  IconButton,
  Input,
  PageHeader,
  Segmented,
  Select,
  Spinner,
  Textarea,
} from "../components/ui";
import { DURATION, EASE, Focus, Scene, SPRING, Section, Tilt } from "../motion";
import { postsApi, companiesApi, uploadsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Company, PostCategory } from "../types";
import { cn } from "../lib/cn";
import { errorMessage, localId } from "../lib/format";

/* ── Draft data shapes ───────────────────────────────────────────────────── */

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

type RoundMode = RoundDraft["mode"];

/** Every mutation the round/question editors can perform, bundled so each
 *  RoundCard receives one prop instead of nine. */
interface RoundActions {
  onNameChange: (roundIndex: number, name: string) => void;
  onModeChange: (roundIndex: number, mode: RoundMode) => void;
  onRemoveRound: (roundIndex: number) => void;
  onAddQuestion: (roundIndex: number) => void;
  onQuestionChange: (roundIndex: number, questionIndex: number, text: string) => void;
  onRemoveQuestion: (roundIndex: number, questionIndex: number) => void;
  onUpload: (roundIndex: number, questionIndex: number, file: File) => void;
  onBlurField: (key: string) => void;
  fieldError: (key: string, invalid: boolean, message: string) => string | undefined;
}

/* ── Step 2 sub-components (module scope so typing never remounts them) ──── */

interface QuestionRowProps {
  question: QuestionDraft;
  roundIndex: number;
  index: number;
  canRemove: boolean;
  disabled: boolean;
  actions: RoundActions;
}

const QuestionRow: React.FC<QuestionRowProps> = ({
  question,
  roundIndex,
  index,
  canRemove,
  disabled,
  actions,
}) => {
  const inputId = `question-text-${question.id}`;
  const fileId = `question-file-${question.id}`;
  const blurKey = `question:${question.id}`;
  const error = actions.fieldError(
    blurKey,
    !question.question_text.trim(),
    "Question text is required."
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <Field label={`Question ${index + 1}`} htmlFor={inputId} required error={error}>
        <div className="flex items-start gap-2">
          <Textarea
            id={inputId}
            rows={2}
            required
            value={question.question_text}
            disabled={disabled}
            invalid={Boolean(error)}
            onChange={(event) => actions.onQuestionChange(roundIndex, index, event.target.value)}
            onBlur={() => actions.onBlurField(blurKey)}
            placeholder="Problem statement, algorithmic constraints, or system design questions..."
            className="min-h-[76px] flex-1"
          />
          {canRemove && (
            <IconButton
              tone="danger"
              label={`Remove question ${index + 1}`}
              disabled={disabled}
              onClick={() => actions.onRemoveQuestion(roundIndex, index)}
              className="mt-1.5"
            >
              <Trash2 size={16} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </Field>

      <div className="mt-2 flex flex-wrap items-center gap-3 sm:pl-8">
        <span className="relative inline-flex">
          <input
            id={fileId}
            type="file"
            accept="image/*,application/pdf"
            disabled={disabled}
            className="peer sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Reset so the same file can be re-picked (e.g. after a failed upload).
              event.target.value = "";
              if (file) actions.onUpload(roundIndex, index, file);
            }}
          />
          <label
            htmlFor={fileId}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline",
              "peer-focus-visible:rounded-md peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
            )}
          >
            <Paperclip size={14} aria-hidden="true" />
            <span>{question.attachment_url ? "Replace Attachment" : "Attach Diagram / PDF"}</span>
          </label>
        </span>
        {question.attachment_url && (
          <span className="inline-flex max-w-xs items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 size={12} aria-hidden="true" />
            <span className="truncate">{question.attachment_url.split("/").pop()}</span>
          </span>
        )}
      </div>
    </div>
  );
};

interface RoundCardProps {
  round: RoundDraft;
  index: number;
  total: number;
  disabled: boolean;
  actions: RoundActions;
}

const RoundCard: React.FC<RoundCardProps> = ({ round, index, total, disabled, actions }) => {
  const nameId = `round-name-${round.id}`;
  const modeId = `round-mode-${round.id}`;
  const nameError = actions.fieldError(
    `round:${round.id}`,
    !round.name.trim(),
    "Round name is required."
  );

  return (
    <Card as="article" className="flex flex-col gap-4 bg-raised p-4 sm:p-4">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h3 className="tabular flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-fg shadow-xs">
          <span className="sr-only">Round </span>
          {index + 1}
        </h3>
        {total > 1 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            icon={<Trash2 size={14} aria-hidden="true" />}
            onClick={() => actions.onRemoveRound(index)}
            className="text-danger hover:bg-danger-soft hover:text-danger"
          >
            Remove Round
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Round Name / Focus" htmlFor={nameId} required error={nameError}>
            <Input
              id={nameId}
              type="text"
              required
              value={round.name}
              disabled={disabled}
              invalid={Boolean(nameError)}
              onChange={(event) => actions.onNameChange(index, event.target.value)}
              onBlur={() => actions.onBlurField(`round:${round.id}`)}
              placeholder="e.g. Technical Round (DSA & System Design), HR, Online Assessment..."
            />
          </Field>
        </div>
        <Field label="Mode" htmlFor={modeId}>
          <Select
            id={modeId}
            value={round.mode}
            disabled={disabled}
            onChange={(event) => actions.onModeChange(index, event.target.value as RoundMode)}
          >
            <option value="online">Virtual / Online</option>
            <option value="offline">On-Site / Offline</option>
          </Select>
        </Field>
      </div>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="p-0 text-sm font-medium text-heading">
          Questions / Challenges Asked
        </legend>
        <div className="mt-3 flex flex-col gap-3">
          {round.questions.map((question, questionIndex) => (
            <QuestionRow
              key={question.id}
              question={question}
              roundIndex={index}
              index={questionIndex}
              canRemove={round.questions.length > 1}
              disabled={disabled}
              actions={actions}
            />
          ))}
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            icon={<Plus size={14} aria-hidden="true" />}
            className="mt-1 self-start"
            onClick={() => actions.onAddQuestion(index)}
          >
            Add Another Question
          </Button>
        </div>
      </fieldset>
    </Card>
  );
};

/* ── Step metadata ───────────────────────────────────────────────────────── */

type StepNumber = 1 | 2 | 3;

const STEPS: { n: StepNumber; label: string }[] = [
  { n: 1, label: "Basic Info" },
  { n: 2, label: "Rounds" },
  { n: 3, label: "Publish" },
];

interface CategoryOption {
  value: PostCategory;
  label: string;
  description: string;
  icon: React.ElementType;
  tone: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: "campus_placement",
    label: "Campus Placement",
    description: "Interview processes and recruitment drives held on your college campus.",
    icon: Briefcase,
    tone: "text-primary",
  },
  {
    value: "off_campus_placement",
    label: "Off-Campus Placement",
    description: "Independent career applications, direct referrals, and external hiring.",
    icon: Globe,
    tone: "text-accent",
  },
  {
    value: "campus_hackathon",
    label: "Campus Hackathon",
    description: "Experience from university-hosted and internal collegiate hackathons.",
    icon: School,
    tone: "text-warning",
  },
  {
    value: "off_campus_hackathon",
    label: "Off-Campus Hackathon",
    description: "External, corporate, national, or open global hackathon evaluations.",
    icon: Building2,
    tone: "text-warning",
  },
];

/** Blocking reason for the Step 2 continue button — mirrors the native
 *  `required` validation the original markup relied on. */
function getStep2Issue(rounds: RoundDraft[]): string | null {
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    if (!round.name.trim()) return `Round ${i + 1} needs a name before continuing.`;
    for (let j = 0; j < round.questions.length; j++) {
      if (!round.questions[j].question_text.trim()) {
        return `Question ${j + 1} in round ${i + 1} needs text before continuing.`;
      }
    }
  }
  return null;
}

type PendingRemoval =
  | { kind: "round"; roundIndex: number }
  | { kind: "question"; roundIndex: number; questionIndex: number };

const focusById = (id: string) => {
  document.getElementById(id)?.focus();
};

/* ── Wizard motion ───────────────────────────────────────────────────────── */

/**
 * Step travel — the shared direction-carrying grammar (the same shape as
 * `bubble` in motion/variants.ts) applied to whole panels. Next pushes the
 * outgoing panel left and brings the new one in from the right; Back mirrors
 * it exactly. Direction lives in `custom` rather than in the variant set, so
 * forward and backward are literally the same animation reflected — "back"
 * can never degrade into a replay of "next".
 *
 * `custom` arrives from two places: the entering panel reads its own prop,
 * while the exiting panel reads `AnimatePresence`'s (its props are already
 * frozen by the time it starts leaving).
 */
const stepVariants: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE.enter },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -16,
    // A departing panel must never be clickable mid-flight.
    pointerEvents: "none" as const,
    transition: { duration: DURATION.fast, ease: EASE.exit },
  }),
};

/**
 * How long the completion beat holds before the route hands off — two
 * cinematic beats. Long enough for the resolution to register, far too short
 * to feel like waiting. Derived from DURATION so it can never drift from the
 * rest of the system.
 */
const RESOLVE_HOLD = DURATION.cinematic * 2;

/**
 * Progress rail — the visual moment of this page.
 *
 * One track runs behind the three nodes and the filled segment TRAVELS to
 * the active node (scaleX only: compositor-friendly, never a width
 * animation), so moving between steps reads as moving through a case file
 * rather than watching a bar fill. Completed nodes stay tappable to jump
 * back, the active node is the only one that swells, and future nodes sit
 * recessed on the bare rail. Labels live under the nodes in equal columns,
 * so the rail stays straight even when a label wraps on a narrow screen.
 */
const WizardStepper: React.FC<{
  step: StepNumber;
  disabled: boolean;
  onSelect: (n: StepNumber) => void;
}> = ({ step, disabled, onSelect }) => {
  const progress = (step - 1) / (STEPS.length - 1);

  return (
    <nav aria-label="Wizard progress">
      <div className="rounded-2xl border border-line bg-raised px-4 pb-4 pt-3.5 shadow-xs sm:px-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Report progress
          </span>
          <span className="tabular text-xs text-muted">
            Step {step} of {STEPS.length}
          </span>
        </div>

        <ol className="relative flex items-start">
          {/* The rail. Nodes carry `relative`, so they paint above these
              absolutely-positioned tracks (positioned elements win by
              DOM order, and the tracks come first). */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[calc(100%/6)] top-[17px] h-0.5 rounded-full bg-line"
          />
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ scaleX: progress }}
            transition={SPRING.gentle}
            className="pointer-events-none absolute inset-x-[calc(100%/6)] top-[17px] h-0.5 origin-left rounded-full bg-primary"
          />

          {STEPS.map(({ n, label }) => {
            const isCurrent = n === step;
            const isComplete = n < step;
            const marker = (
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: isCurrent ? 1.08 : 1 }}
                transition={SPRING.gentle}
                className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isComplete && "bg-primary text-primary-fg shadow-xs",
                  isCurrent && "border-2 border-primary bg-surface text-primary shadow-sm",
                  !isComplete && !isCurrent && "border border-line bg-surface text-muted"
                )}
              >
                {isComplete ? <Check size={13} strokeWidth={3} /> : n}
              </motion.span>
            );
            const stepLabel = (
              <span
                className={cn(
                  "text-center text-xs font-medium leading-tight",
                  isCurrent ? "text-heading" : isComplete ? "text-primary" : "text-muted"
                )}
              >
                <span className="sr-only">Step {n}: </span>
                {label}
              </span>
            );

            return (
              <li
                key={n}
                aria-current={isCurrent ? "step" : undefined}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                {isComplete ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(n)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg px-1 py-1 transition-colors duration-fast ease-swift",
                      "hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {marker}
                    {stepLabel}
                  </button>
                ) : (
                  <span className="flex flex-col items-center gap-1.5 px-1 py-1">
                    {marker}
                    {stepLabel}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

/**
 * The wizard's closing beat: one mark, one line, then the route hands off.
 * Mounts inside the step AnimatePresence, so the final page turns away like
 * every other step before the resolution lands. `Focus` gives it the
 * cinematic entrance reserved for focal moments and the check springs in on
 * SPRING.bouncy — the tokens' one playful accent, reserved for
 * confirmations. No loops, no confetti: it lives for two beats and is gone.
 * Announcements stay with the toast, so screen readers hear the outcome
 * exactly once.
 */
const PublishedBeat: React.FC = () => (
  <div className="rounded-xl border border-success/30 bg-surface px-6 py-10 text-center shadow-md">
    <Focus delay={0.05} className="flex flex-col items-center gap-3">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING.bouncy}
        >
          <CheckCircle2 size={30} aria-hidden="true" />
        </motion.span>
      </span>
      <h2 className="text-xl font-semibold tracking-tight">Experience published</h2>
      <p className="text-sm text-muted">Opening your report…</p>
    </Focus>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

export const DraftReportPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<StepNumber>(1);
  // Shared, mutable view of the active step so a panel that is animating out
  // cannot submit a second time (it would duplicate the draft/rounds).
  const stepRef = useRef<StepNumber>(1);
  stepRef.current = step;
  const [direction, setDirection] = useState(1);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  // True once the final publish resolves: replaces the last step with the
  // resolution beat, which in turn owns the navigation away (see the effect).
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);

  // Available Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // STEP 1 STATE: General Intelligence
  const [title, setTitle] = useState("");
  const [postCategory, setPostCategory] = useState<PostCategory>("campus_placement");
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

  // Stable ids so every label stays associated with its control.
  const titleId = useId();
  const companyId = useId();
  const collegeId = useId();
  const jobRoleStep1Id = useId();
  const locationId = useId();
  const yearId = useId();
  const experienceYearsId = useId();
  const anonymousId = useId();
  const experienceTextId = useId();
  const tipsId = useId();
  const jobRoleStep3Id = useId();
  const currencyId = useId();
  const packageId = useId();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login");
    }
  }, [isAuthenticated, openAuthModal]);

  useEffect(() => {
    setCompaniesLoading(true);
    companiesApi
      .list(undefined, 1, 100)
      .then((res) => {
        setCompanies(res.data.items || []);
      })
      .catch(() => {})
      .finally(() => setCompaniesLoading(false));
  }, []);

  // The completion beat owns navigation: the resolution mark gets its moment
  // BEFORE the route changes, and an unmount during the hold (browser Back,
  // link) cancels cleanly.
  useEffect(() => {
    if (!isPublished || !createdPostId) return;
    const timer = window.setTimeout(
      () => navigate(`/posts/${createdPostId}`),
      RESOLVE_HOLD * 1000
    );
    return () => window.clearTimeout(timer);
  }, [isPublished, createdPostId, navigate]);

  /* ── Validation helpers ──────────────────────────────────────────────── */

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const fieldError = (key: string, invalid: boolean, message: string): string | undefined =>
    touched[key] && invalid ? message : undefined;

  const titleError = fieldError("title", !title.trim(), "Experience title is required.");
  const experienceError = fieldError(
    "experience",
    !experienceText.trim(),
    "Experience narrative is required."
  );
  const jobRoleStep3Error = fieldError(
    "jobRole",
    !jobRole.trim(),
    "Job role is required when an offer is received."
  );

  const step1Issue = title.trim() ? null : "Experience title is required.";
  const step2Issue = getStep2Issue(rounds);
  const step3Issue = !experienceText.trim()
    ? "Experience narrative is required."
    : isOfferReceived && !jobRole.trim()
      ? "Job role is required when an offer is received."
      : null;

  const goToStep = (target: StepNumber) => {
    if (target === step) return;
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  /* ── Step 1: Submit Draft Post ───────────────────────────────────────── */

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || stepRef.current !== 1) return;
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!title.trim()) {
      markTouched("title");
      focusById(titleId);
      error("Experience title is required.");
      return;
    }

    setIsSubmitting(true);
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
      goToStep(2);
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to initialize draft experience."));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 2: Round / question local helpers (immutable updates) ─────── */

  const addRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        id: `round-${localId()}`,
        name: "",
        mode: "online",
        duration_minutes: 45,
        difficulty: "medium",
        questions: [{ id: `q-${localId()}`, question_text: "" }],
      },
    ]);
  };

  const updateRoundName = (roundIndex: number, name: string) => {
    setRounds((prev) => prev.map((r, rIdx) => (rIdx === roundIndex ? { ...r, name } : r)));
  };

  const updateRoundMode = (roundIndex: number, mode: RoundMode) => {
    setRounds((prev) => prev.map((r, rIdx) => (rIdx === roundIndex ? { ...r, mode } : r)));
  };

  const addQuestionToRound = (roundIndex: number) => {
    setRounds((prev) =>
      prev.map((r, rIdx) => {
        if (rIdx !== roundIndex) return r;
        return {
          ...r,
          questions: [...r.questions, { id: `q-${localId()}`, question_text: "" }],
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

  const requestRemoveRound = (roundIndex: number) => {
    if (rounds.length <= 1) {
      error("At least one evaluation round is required.");
      return;
    }
    setPendingRemoval({ kind: "round", roundIndex });
  };

  const requestRemoveQuestion = (roundIndex: number, questionIndex: number) => {
    if (!rounds[roundIndex] || rounds[roundIndex].questions.length <= 1) return;
    setPendingRemoval({ kind: "question", roundIndex, questionIndex });
  };

  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    if (pendingRemoval.kind === "round") {
      const { roundIndex } = pendingRemoval;
      setRounds((prev) => prev.filter((_, i) => i !== roundIndex));
    } else {
      const { roundIndex, questionIndex } = pendingRemoval;
      setRounds((prev) =>
        prev.map((r, rIdx) =>
          rIdx === roundIndex
            ? { ...r, questions: r.questions.filter((_, qIdx) => qIdx !== questionIndex) }
            : r
        )
      );
    }
    setPendingRemoval(null);
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
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to upload question attachment."));
    }
  };

  const roundActions: RoundActions = {
    onNameChange: updateRoundName,
    onModeChange: updateRoundMode,
    onRemoveRound: requestRemoveRound,
    onAddQuestion: addQuestionToRound,
    onQuestionChange: updateQuestionText,
    onRemoveQuestion: requestRemoveQuestion,
    onUpload: handleQuestionFileUpload,
    onBlurField: markTouched,
    fieldError,
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || stepRef.current !== 2) return;
    if (!createdPostId) {
      error("Missing post identifier. Please return to Step 1.");
      goToStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      // Sequential on purpose: rounds must exist before their questions can
      // reference them, and a retry must never run concurrently with itself.
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
      goToStep(3);
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to commit rounds to draft."));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 3: Final Publishing ────────────────────────────────────────── */

  const handleStep3Publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || stepRef.current !== 3) return;
    if (!createdPostId) {
      error("Missing post identifier. Please return to Step 1.");
      return;
    }
    if (!experienceText.trim()) {
      markTouched("experience");
      focusById(experienceTextId);
      error("Experience narrative is required.");
      return;
    }
    if (isOfferReceived && !jobRole.trim()) {
      markTouched("jobRole");
      focusById(jobRoleStep3Id);
      error("Job role is required when an offer is received.");
      return;
    }

    setIsSubmitting(true);
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
      // Hold on the resolution beat; the effect above performs the hand-off
      // to the published report once the beat has landed.
      setIsPublished(true);
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to publish experience."));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Derived render data ─────────────────────────────────────────────── */

  const isCampus = postCategory.includes("campus") && !postCategory.includes("off");

  const pendingRound =
    pendingRemoval?.kind === "round" ? rounds[pendingRemoval.roundIndex] : undefined;
  const pendingQuestion =
    pendingRemoval?.kind === "question"
      ? rounds[pendingRemoval.roundIndex]?.questions[pendingRemoval.questionIndex]
      : undefined;
  const removalMessage =
    pendingRemoval?.kind === "round"
      ? `Round ${pendingRemoval.roundIndex + 1}${
          pendingRound?.name ? ` "${pendingRound.name}"` : ""
        } and its ${pendingRound?.questions.length ?? 0} question(s) will be removed from this draft. This cannot be undone.`
      : pendingRemoval?.kind === "question"
        ? `"${pendingQuestion?.question_text?.trim() || "This question"}" and any attached file will be removed from this draft. This cannot be undone.`
        : "";

  /**
   * One step panel: keyed, direction-aware via `stepVariants`, and wired to
   * `direction` from both sides — its own `custom` drives the entrance, and
   * AnimatePresence's (identical value) drives the exit of whichever panel
   * is leaving.
   */
  const panelMotion = (key: string) => ({
    key,
    custom: direction,
    variants: stepVariants,
    initial: "hidden" as const,
    animate: "show" as const,
    exit: "exit" as const,
  });

  return (
    <>
      <PageContainer width="wizard">
        <Scene>
          <Section>
            <PageHeader
              icon={<FileEdit size={20} aria-hidden="true" />}
              title={
                <>
                  <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    Creator Workspace
                  </span>
                  Share Interview Experience
                </>
              }
              description="Help fellow students and candidates by detailing your real interview rounds and questions."
            />
          </Section>

          {/* The stepper is this page's hero: it owns the cinematic entrance
              and lands just after the header has begun to settle. */}
          <Focus delay={0.08} className="mb-6">
            <WizardStepper
              step={step}
              disabled={isSubmitting || isPublished}
              onSelect={goToStep}
            />
          </Focus>

          <Section>
            <div className="relative pb-3">
              {/* The sheet the current step rests on — static depth, so the
                  card reads as the top of a deck for zero per-frame work. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-4 bottom-0 top-6 rounded-2xl border border-line bg-raised shadow-xs"
              />
              {/* Pointer tilt on the deck: max 2°, and Tilt switches itself
                  off entirely for touch pointers and reduced-motion users. */}
              <Tilt max={2} lift={1.006} glare={false}>
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  {/* STEP 1 FORM */}
                  {step === 1 && (
                    <motion.form {...panelMotion("step-1")} onSubmit={handleStep1Submit}>
                      <Card as="section" className="flex flex-col gap-6 shadow-md">
                        <CardHeader
                          as="h2"
                          title="Basic information"
                          subtitle="Choose a category and tell us where this experience happened."
                        />

                        {/* Category radios (2x2 layout) */}
                        <fieldset className="m-0 min-w-0 border-0 p-0">
                          <legend className="p-0 text-sm font-medium text-heading">
                            Select Category
                            <span className="ml-0.5 text-danger" aria-hidden="true">
                              *
                            </span>
                          </legend>
                          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {CATEGORY_OPTIONS.map((option) => {
                              const Icon = option.icon;
                              const selected = postCategory === option.value;
                              const optionId = `post-category-${option.value}`;
                              return (
                                <div key={option.value} className="relative">
                                  <input
                                    id={optionId}
                                    type="radio"
                                    name="post-category"
                                    value={option.value}
                                    checked={selected}
                                    disabled={isSubmitting}
                                    className="peer sr-only"
                                    onChange={() => setPostCategory(option.value)}
                                  />
                                  <label
                                    htmlFor={optionId}
                                    className={cn(
                                      "flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-4 transition-colors duration-fast ease-swift",
                                      "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                                      "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
                                      selected
                                        ? "border-primary bg-primary-soft"
                                        : "border-line bg-surface hover:border-primary/50"
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Icon size={16} className={cn("shrink-0", option.tone)} aria-hidden="true" />
                                      <span className="text-sm font-semibold text-heading">
                                        {option.label}
                                      </span>
                                    </span>
                                    <span className="block text-xs text-muted">{option.description}</span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </fieldset>

                        <Divider className="my-1" />

                        {/* Title */}
                        <Field label="Experience Title" htmlFor={titleId} required error={titleError}>
                          <Input
                            id={titleId}
                            type="text"
                            required
                            value={title}
                            disabled={isSubmitting}
                            invalid={Boolean(titleError)}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => markTouched("title")}
                            placeholder="e.g. Google Software Engineer Intern Interview Experience 2024"
                            autoComplete="off"
                          />
                        </Field>

                        {/* Basic info fields (2x2 grid) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* Company / organization */}
                          <Field
                            label="Company / Organization"
                            htmlFor={companyId}
                            hint={companiesLoading ? "Loading companies…" : undefined}
                            action={
                              <Button
                                variant="link"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => setShowNewCompanyInput((open) => !open)}
                              >
                                {showNewCompanyInput ? "Select Existing" : "+ Add New"}
                              </Button>
                            }
                          >
                            <div className="relative">
                              <Building2
                                size={16}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                              />
                              {showNewCompanyInput ? (
                                <Input
                                  id={companyId}
                                  type="text"
                                  value={newCompanyName}
                                  disabled={isSubmitting}
                                  onChange={(e) => setNewCompanyName(e.target.value)}
                                  placeholder="e.g. Google, Microsoft, Amazon"
                                  autoComplete="organization"
                                  className="pl-9"
                                />
                              ) : (
                                <>
                                  <Select
                                    id={companyId}
                                    value={selectedCompanyId}
                                    disabled={isSubmitting}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    className="pl-9"
                                  >
                                    <option value="">-- Select Company (Optional) --</option>
                                    {companies.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} {c.industry ? `(${c.industry})` : ""}
                                      </option>
                                    ))}
                                  </Select>
                                  {companiesLoading && (
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                      <Spinner size={16} />
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </Field>

                          {/* College / university */}
                          <Field label="College / University" htmlFor={collegeId} required={isCampus}>
                            <div className="relative">
                              <GraduationCap
                                size={16}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                              />
                              <Input
                                id={collegeId}
                                type="text"
                                value={collegeName}
                                disabled={isSubmitting}
                                onChange={(e) => setCollegeName(e.target.value)}
                                placeholder="e.g. MIT, Stanford, IIT Bombay"
                                className="pl-9"
                              />
                            </div>
                          </Field>

                          {/* Job role / position */}
                          <Field label="Job Role / Position" htmlFor={jobRoleStep1Id}>
                            <div className="relative">
                              <Briefcase
                                size={16}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                              />
                              <Input
                                id={jobRoleStep1Id}
                                type="text"
                                value={jobRole}
                                disabled={isSubmitting}
                                onChange={(e) => setJobRole(e.target.value)}
                                placeholder="e.g. Software Engineer Intern"
                                autoComplete="organization-title"
                                className="pl-9"
                              />
                            </div>
                          </Field>

                          {/* Location / work mode */}
                          <Field label="Location / Work Mode" htmlFor={locationId}>
                            <div className="relative">
                              <MapPin
                                size={16}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                              />
                              <Input
                                id={locationId}
                                type="text"
                                value={workLocation}
                                disabled={isSubmitting}
                                onChange={(e) => setWorkLocation(e.target.value)}
                                placeholder="e.g. Bengaluru / Remote"
                                className="pl-9"
                              />
                            </div>
                          </Field>

                          {/* Year of study or years of experience */}
                          {isCampus ? (
                            <Field label="Year of Study" htmlFor={yearId}>
                              <Select
                                id={yearId}
                                value={yearOfStudy}
                                disabled={isSubmitting}
                                onChange={(e) => setYearOfStudy(parseInt(e.target.value, 10))}
                              >
                                <option value={1}>1st Year (Undergraduate)</option>
                                <option value={2}>2nd Year (Undergraduate)</option>
                                <option value={3}>3rd Year (Pre-final)</option>
                                <option value={4}>4th Year (Final Year)</option>
                                <option value={5}>Postgraduate / Masters</option>
                              </Select>
                            </Field>
                          ) : (
                            <Field label="Years of Experience" htmlFor={experienceYearsId}>
                              <Input
                                id={experienceYearsId}
                                type="number"
                                step="0.5"
                                min="0"
                                value={experienceYears}
                                disabled={isSubmitting}
                                onChange={(e) => setExperienceYears(e.target.value)}
                                placeholder="e.g. 2.5"
                              />
                            </Field>
                          )}
                        </div>

                        {/* Anonymity switch */}
                        <label
                          htmlFor={anonymousId}
                          className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-sunken/60 p-4"
                        >
                          <span className="flex min-w-0 items-start gap-2.5">
                            <Shield size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-heading">
                                Post Anonymously
                              </span>
                              <span className="mt-0.5 block text-xs text-muted">
                                Protect identity. Your name, avatar, and profile handle will be fully
                                redacted.
                              </span>
                            </span>
                          </span>
                          <input
                            id={anonymousId}
                            type="checkbox"
                            role="switch"
                            checked={isAnonymous}
                            disabled={isSubmitting}
                            className="peer sr-only"
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-fast ease-swift",
                              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                              isAnonymous ? "bg-primary" : "bg-line"
                            )}
                          >
                            <span
                              className={cn(
                                "h-5 w-5 rounded-full bg-surface shadow-xs transition-transform duration-fast ease-swift",
                                isAnonymous && "translate-x-5"
                              )}
                            />
                          </span>
                        </label>

                        {/* Step 1 submit */}
                        <div className="flex flex-col items-start gap-1.5 border-t border-line pt-4 sm:items-end">
                          {step1Issue && <p className="text-sm text-muted">{step1Issue}</p>}
                          <Button
                            type="submit"
                            size="lg"
                            loading={isSubmitting}
                            disabled={Boolean(step1Issue)}
                            iconRight={<ArrowRight size={18} aria-hidden="true" />}
                          >
                            Continue to Rounds
                          </Button>
                        </div>
                      </Card>
                    </motion.form>
                  )}

                  {/* STEP 2 FORM */}
                  {step === 2 && (
                    <motion.form {...panelMotion("step-2")} onSubmit={handleStep2Submit}>
                      <Card as="section" className="flex flex-col gap-6 shadow-md">
                        <CardHeader
                          as="h2"
                          title="Interview Rounds & Questions"
                          subtitle="Record each round's format and the specific technical challenges asked."
                        />

                        <div className="flex flex-col gap-5">
                          {rounds.map((round, rIndex) => (
                            <RoundCard
                              key={round.id}
                              round={round}
                              index={rIndex}
                              total={rounds.length}
                              disabled={isSubmitting}
                              actions={roundActions}
                            />
                          ))}

                          <Button
                            fullWidth
                            variant="secondary"
                            disabled={isSubmitting}
                            icon={<Plus size={16} aria-hidden="true" />}
                            onClick={addRound}
                            className="border-dashed border-primary/40 py-3 text-primary hover:border-primary/60 hover:bg-primary-soft hover:text-primary"
                          >
                            Add Another Round
                          </Button>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            variant="secondary"
                            disabled={isSubmitting}
                            icon={<ArrowLeft size={16} aria-hidden="true" />}
                            onClick={() => goToStep(1)}
                          >
                            Back to Step 1
                          </Button>
                          <div className="flex flex-col items-start gap-1.5 sm:items-end">
                            {step2Issue && <p className="text-sm text-muted">{step2Issue}</p>}
                            <Button
                              type="submit"
                              size="lg"
                              loading={isSubmitting}
                              disabled={Boolean(step2Issue)}
                              iconRight={<ArrowRight size={18} aria-hidden="true" />}
                            >
                              Continue to Review
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.form>
                  )}

                  {/* STEP 3 FORM — suppressed once published so the
                      completion beat takes this slot via mode="wait". */}
                  {step === 3 && !isPublished && (
                    <motion.form {...panelMotion("step-3")} onSubmit={handleStep3Publish}>
                      <Card as="section" className="flex flex-col gap-6 shadow-md">
                        <CardHeader
                          as="h2"
                          title="Experience Review & Narrative"
                          subtitle="Share your overall experience narrative, outcome, and advice for future candidates."
                        />

                        {/* Outcome / offer status */}
                        <fieldset className="m-0 min-w-0 border-0 p-0" disabled={isSubmitting}>
                          <legend className="p-0 text-sm font-medium text-heading">
                            Outcome / Offer Status
                            <span className="ml-0.5 text-danger" aria-hidden="true">
                              *
                            </span>
                          </legend>
                          <Segmented
                            className="mt-2 grid w-full grid-cols-2"
                            label="Outcome / offer status"
                            value={isOfferReceived ? "offer" : "no-offer"}
                            onChange={(value) => setIsOfferReceived(value === "offer")}
                            tone={(value) => (value === "offer" ? "text-success" : "text-danger")}
                            options={[
                              {
                                value: "offer",
                                label: "Offer Received",
                                icon: <CheckCircle2 size={15} className="text-success" aria-hidden="true" />,
                              },
                              {
                                value: "no-offer",
                                label: "No Offer",
                                icon: <XCircle size={15} className="text-danger" aria-hidden="true" />,
                              },
                            ]}
                          />
                        </fieldset>

                        {/* Package & role, only when an offer was received */}
                        {isOfferReceived && (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field
                              label="Offered Position"
                              htmlFor={jobRoleStep3Id}
                              required
                              error={jobRoleStep3Error}
                            >
                              <Input
                                id={jobRoleStep3Id}
                                type="text"
                                required
                                value={jobRole}
                                disabled={isSubmitting}
                                invalid={Boolean(jobRoleStep3Error)}
                                onChange={(e) => setJobRole(e.target.value)}
                                onBlur={() => markTouched("jobRole")}
                                placeholder="e.g. Associate Software Engineer"
                                autoComplete="organization-title"
                              />
                            </Field>
                            <Field label="Currency" htmlFor={currencyId}>
                              <Select
                                id={currencyId}
                                value={currency}
                                disabled={isSubmitting}
                                onChange={(e) => setCurrency(e.target.value)}
                              >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                              </Select>
                            </Field>
                            <Field label="Total Package / CTC" htmlFor={packageId}>
                              <Input
                                id={packageId}
                                type="number"
                                min="0"
                                value={packageAmount}
                                disabled={isSubmitting}
                                onChange={(e) => setPackageAmount(e.target.value)}
                                placeholder="e.g. 1800000"
                              />
                            </Field>
                          </div>
                        )}

                        {/* Experience narrative */}
                        <Field
                          label="Overall Interview Experience Narrative"
                          htmlFor={experienceTextId}
                          required
                          error={experienceError}
                        >
                          <Textarea
                            id={experienceTextId}
                            rows={5}
                            required
                            value={experienceText}
                            disabled={isSubmitting}
                            invalid={Boolean(experienceError)}
                            onChange={(e) => setExperienceText(e.target.value)}
                            onBlur={() => markTouched("experience")}
                            placeholder="Detail your timeline, how the interviewers conducted themselves, technical depth, and strategies that helped..."
                          />
                        </Field>

                        {/* Preparation tips */}
                        <Field
                          label="Key Preparation Tips & Recommended Topics"
                          htmlFor={tipsId}
                        >
                          <Textarea
                            id={tipsId}
                            rows={3}
                            value={tips}
                            disabled={isSubmitting}
                            onChange={(e) => setTips(e.target.value)}
                            placeholder="Important algorithms, system design topics, mock resources, or common pitfalls to avoid..."
                          />
                        </Field>

                        {/* Publish actions */}
                        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            variant="secondary"
                            disabled={isSubmitting}
                            icon={<ArrowLeft size={16} aria-hidden="true" />}
                            onClick={() => goToStep(2)}
                          >
                            Back to Step 2
                          </Button>
                          <div className="flex flex-col items-start gap-1.5 sm:items-end">
                            {step3Issue && <p className="text-sm text-muted">{step3Issue}</p>}
                            <Button
                              type="submit"
                              size="lg"
                              loading={isSubmitting}
                              disabled={Boolean(step3Issue)}
                              icon={<Send size={18} aria-hidden="true" />}
                            >
                              {isSubmitting ? "Publishing..." : "Publish Experience"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.form>
                  )}

                  {/* The completion beat: the final page turns away like any
                      other step, then the resolution lands before the route
                      hands off (navigation is owned by the RESOLVE_HOLD
                      effect above). */}
                  {isPublished && <PublishedBeat key="published" />}
                </AnimatePresence>
              </Tilt>
            </div>
          </Section>
        </Scene>

        {/* Destructive removals always confirm — never window.confirm */}
        <ConfirmDialog
          isOpen={pendingRemoval !== null}
          onClose={() => setPendingRemoval(null)}
          onConfirm={confirmRemoval}
          tone="danger"
          title={pendingRemoval?.kind === "round" ? "Remove this round?" : "Remove this question?"}
          confirmLabel={
            pendingRemoval?.kind === "round" ? "Remove round" : "Remove question"
          }
          cancelLabel="Keep"
          message={removalMessage}
        />
      </PageContainer>
    </>
  );
};
