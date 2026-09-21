import React, { useState } from "react";
import { EyeOff, Lock, ShieldBan, Award, Users, Scale, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy & Terms of Service"
      subtitle="Academic Standards & Community Commitments"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5 text-xs text-[#2b3a4f] leading-relaxed">
        {/* Tab Switcher */}
        <div className="flex border-b border-[#e3dccd] gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative cursor-pointer ${
              activeTab === "privacy"
                ? "text-[#2f6b47] border-b-2 border-[#3f6f52]"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors relative cursor-pointer ${
              activeTab === "terms"
                ? "text-[#2f6b47] border-b-2 border-[#3f6f52]"
                : "text-[#5f6e82] hover:text-[#0f1926]"
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "privacy" ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <section className="space-y-1.5 p-3.5 rounded-xl bg-[#faf7ee] border border-[#e3dccd]">
              <h4 className="font-bold text-[#0f1926] text-xs sm:text-sm flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-[#2f6b47] shrink-0" />
                <span>1. Anonymous Post Privacy Guarantee</span>
              </h4>
              <p className="text-[#2b3a4f] text-xs">
                When you choose to publish an experience anonymously, PrepShare enforces zero-knowledge privacy.
                Your author identity, profile photograph, college affiliation, and account handle are completely
                omitted from public API feeds and client views.
              </p>
            </section>

            <section className="space-y-1.5 p-3.5 rounded-xl bg-[#faf7ee] border border-[#e3dccd]">
              <h4 className="font-bold text-[#0f1926] text-xs sm:text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2f6b47] shrink-0" />
                <span>2. Information We Collect & Security</span>
              </h4>
              <p className="text-[#2b3a4f] text-xs">
                We only collect information necessary to maintain candidate accounts and verify authentic academic
                experiences. Passwords are cryptographically salted and hashed using industry-standard bcrypt.
              </p>
            </section>

            <section className="space-y-1.5 p-3.5 rounded-xl bg-[#faf7ee] border border-[#e3dccd]">
              <h4 className="font-bold text-[#0f1926] text-xs sm:text-sm flex items-center gap-2">
                <ShieldBan className="w-4 h-4 text-[#2f6b47] shrink-0" />
                <span>3. No Third-Party Telemetry or Data Selling</span>
              </h4>
              <p className="text-[#2b3a4f] text-xs">
                PrepShare is an academic intelligence repository built for students and candidates. We never sell
                student data, interview transcripts, or personal credentials to third-party ad networks or data brokers.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <section className="space-y-1.5 p-3.5 rounded-xl bg-[#faf7ee] border border-[#e3dccd]">
              <h4 className="font-bold text-[#0f1926] text-xs sm:text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-[#2f6b47] shrink-0" />
                <span>1. Academic Authenticity & Truthful Intelligence</span>
              </h4>
              <p className="text-[#2b3a4f] text-xs">
                Contributors agree to share genuine, accurate interview processes, hackathon problem statements, and
                assessment workflows. Spreading fraudulent compensation figures or fabricated rounds is strictly
                prohibited.
              </p>
            </section>

            <section className="space-y-1.5 p-3.5 rounded-xl bg-[#faf7ee] border border-[#e3dccd]">
              <h4 className="font-bold text-[#0f1926] text-xs sm:text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2f6b47] shrink-0" />
                <span>2. Community Code of Conduct</span>
              </h4>
              <p className="text-[#2b3a4f] text-xs">
                PrepShare fosters supportive, constructive mentorship. Harassment, hate speech, spamming in direct
                messages, or unconstructive disparagement of fellow students or institutions results in immediate account
                suspension.
              </p>
            </section>

            <section className="space-y-1.5 p-3.5 rounded-xl bg-[#faf7ee] border border-[#e3dccd]">
              <h4 className="font-bold text-[#0f1926] text-xs sm:text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#2f6b47] shrink-0" />
                <span>3. Non-Disclosure & Intellectual Property</span>
              </h4>
              <p className="text-[#2b3a4f] text-xs">
                Do not share proprietary company trade secrets or copyrighted source code under active NDA. Shared
                content should focus on generalized conceptual questions, algorithmic paradigms, and candidate
                preparation advice.
              </p>
            </section>
          </div>
        )}

        {/* Footer Action */}
        <div className="flex justify-end pt-3 border-t border-[#e3dccd]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-semibold transition-all active:scale-95 shadow-sm text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Understand & Close</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
