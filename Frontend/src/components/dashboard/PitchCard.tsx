import React from "react";
import { Card, CardHeader } from "../ui/Card";

/* ── Pitch card — the signed-out "why sign in" blocks ──────────────────── */

export interface PitchCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  body: string;
  children: React.ReactNode;
}

export const PitchCard: React.FC<PitchCardProps> = ({
  title,
  subtitle,
  icon,
  body,
  children,
}) => (
  <Card className="flex h-full flex-col justify-between gap-4">
    <div>
      <CardHeader as="h2" title={title} subtitle={subtitle} icon={icon} />
      <p className="text-sm text-muted">{body}</p>
    </div>
    <div className="mt-auto flex flex-wrap gap-2.5">{children}</div>
  </Card>
);
