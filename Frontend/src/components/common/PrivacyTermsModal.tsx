import React, { useState } from "react";
import { Award, CheckCircle2, EyeOff, Lock, Scale, ShieldBan, Users } from "lucide-react";
import { Modal } from "./Modal";
import { Button, Segmented } from "../ui";

type LegalDoc = "privacy" | "terms";

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOCS: { value: LegalDoc; label: string }[] = [
  { value: "privacy", label: "Privacy Policy" },
  { value: "terms", label: "Terms of Service" },
];

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <section className="space-y-1.5 rounded-xl border border-line bg-raised p-3.5">
    <h4 className="flex items-center gap-2 text-sm font-semibold text-heading">
      <span className="shrink-0 text-primary" aria-hidden="true">
        {icon}
      </span>
      <span>{title}</span>
    </h4>
    <p className="text-sm leading-relaxed text-body">{children}</p>
  </section>
);

/**
 * Footer legal copy. The dialog is rendered by `<Modal>`, which owns the
 * focus trap, focus restore, Escape handling and scroll lock — so unmounting
 * mid-open can no longer strand `document.body.style.overflow` at "hidden".
 */
export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({ isOpen, onClose }) => {
  const [activeDoc, setActiveDoc] = useState<LegalDoc>("privacy");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy & Terms of Service"
      subtitle="Academic Standards & Community Commitments"
      maxWidth="max-w-2xl"
      footer={
        <Button icon={<CheckCircle2 size={16} />} onClick={onClose}>
          I Understand &amp; Close
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Segmented
          options={DOCS}
          value={activeDoc}
          onChange={setActiveDoc}
          label="Choose which legal document to read"
        />

        {activeDoc === "privacy" ? (
          <div className="space-y-4">
            <Section icon={<EyeOff size={16} />} title="1. Anonymous Post Privacy Guarantee">
              When you choose to publish an experience anonymously, PrepShare enforces
              zero-knowledge privacy. Your author identity, profile photograph, college
              affiliation, and account handle are completely omitted from public API feeds and
              client views.
            </Section>

            <Section icon={<Lock size={16} />} title="2. Information We Collect & Security">
              We only collect information necessary to maintain candidate accounts and verify
              authentic academic experiences. Passwords are cryptographically salted and hashed
              using industry-standard bcrypt.
            </Section>

            <Section
              icon={<ShieldBan size={16} />}
              title="3. No Third-Party Telemetry or Data Selling"
            >
              PrepShare is an academic intelligence repository built for students and candidates.
              We never sell student data, interview transcripts, or personal credentials to
              third-party ad networks or data brokers.
            </Section>
          </div>
        ) : (
          <div className="space-y-4">
            <Section
              icon={<Award size={16} />}
              title="1. Academic Authenticity & Truthful Intelligence"
            >
              Contributors agree to share genuine, accurate interview processes, hackathon problem
              statements, and assessment workflows. Spreading fraudulent compensation figures or
              fabricated rounds is strictly prohibited.
            </Section>

            <Section icon={<Users size={16} />} title="2. Community Code of Conduct">
              PrepShare fosters supportive, constructive mentorship. Harassment, hate speech,
              spamming in direct messages, or unconstructive disparagement of fellow students or
              institutions results in immediate account suspension.
            </Section>

            <Section icon={<Scale size={16} />} title="3. Non-Disclosure & Intellectual Property">
              Do not share proprietary company trade secrets or copyrighted source code under
              active NDA. Shared content should focus on generalized conceptual questions,
              algorithmic paradigms, and candidate preparation advice.
            </Section>
          </div>
        )}
      </div>
    </Modal>
  );
};
