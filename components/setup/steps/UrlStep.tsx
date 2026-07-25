"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

interface Props {
  state: WizardState;
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function UrlStep({ state, data, onChange }: Props) {
  const url = data.url || {};
  const hasCustomDomain = Boolean(url.custom_domain);
  // Default-collapsed so the page leads with the assigned subdomain - most
  // tenants stay on *.ailinc.com forever. If they're returning to step 3
  // with a domain already saved, start open so they don't have to dig for
  // their own data.
  const [domainOpen, setDomainOpen] = useState(hasCustomDomain);
  useEffect(() => {
    if (hasCustomDomain) setDomainOpen(true);
  }, [hasCustomDomain]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="aw-card aw-card-hover">
        <span className="aw-card-top-line" aria-hidden />
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          Your AI Linc subdomain
        </p>
        <p
          className="aw-mono mt-4 text-[clamp(20px,3vw,28px)]"
          style={{
            background: "linear-gradient(90deg, #2356d6 0%, #00e0ff 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {state.subdomain}.ailinc.com
        </p>
        <p className="aw-text-dim mt-3 text-[13px] leading-[1.65]">
          Assigned by your AI Linc super-admin. This URL is permanent.
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl"
        style={{
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          background: "rgba(255, 255, 255, 0.015)",
        }}
      >
        <button
          type="button"
          onClick={() => setDomainOpen((v) => !v)}
          aria-expanded={domainOpen}
          className="flex w-full items-center justify-between gap-3 px-7 py-5 text-left transition-colors hover:bg-[rgba(255,255,255,0.025)]"
        >
          <span className="min-w-0">
            <span className="aw-mono aw-text-mute block text-[10px] uppercase tracking-[0.3em]">
              Use your own domain (optional)
            </span>
            <span className="aw-text-dim mt-2 block text-[13px] leading-[1.6]">
              Prefer something like{" "}
              <span className="aw-mono text-[12px] text-text">
                learn.your-org.com
              </span>
              ? Click to set it up - or skip and do it later from Settings.
            </span>
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="shrink-0 transition-transform"
            style={{
              color: "rgb(var(--aw-fg-dim))",
              transform: domainOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <AnimatePresence initial={false}>
          {domainOpen ? (
            <motion.div
              key="domain-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-7 pb-7">
                <div>
                  <label className="aw-label" htmlFor="custom-domain">
                    Your domain
                  </label>
                  <input
                    id="custom-domain"
                    type="text"
                    placeholder="learn.your-org.com"
                    value={url.custom_domain || ""}
                    onChange={(e) =>
                      onChange({
                        url: { ...url, custom_domain: e.target.value.trim() },
                      })
                    }
                    className="aw-input"
                  />
                  <p className="aw-help mt-2">
                    Something like{" "}
                    <span className="aw-mono">learn.acme.com</span>.
                  </p>
                </div>

                <CustomDomainSteps
                  slugUrl={`${state.subdomain}.ailinc.com`}
                  customDomain={url.custom_domain || ""}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/**
 * Friendly two-step walkthrough for hooking up a custom domain. Designed for
 * a non-technical admin: only the parts they actually do are numbered, and
 * the second step is a one-line paste. Everything else (Netlify, SSL, DNS
 * waiting) gets bundled into a reassuring "we'll handle the rest" strip so
 * it doesn't feel like a four-step engineering chore.
 */
function CustomDomainSteps({
  slugUrl,
  customDomain,
}: {
  slugUrl: string;
  customDomain: string;
}) {
  const hasDomain = customDomain.length > 0;
  const target = slugUrl;
  const [open, setOpen] = useState(false);

  // Auto-expand once the user actually commits a domain - at that point the
  // steps stop being "future homework" and become the thing they need to act
  // on. Stays open after that (no auto-collapse on clear) so an accidental
  // delete doesn't hide the steps mid-task.
  useEffect(() => {
    if (hasDomain) setOpen(true);
  }, [hasDomain]);

  return (
    <div
      className="mt-6 overflow-hidden rounded-[14px]"
      style={{
        border: "1px solid rgba(0, 224, 255, 0.18)",
        background: "rgba(0, 224, 255, 0.04)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(0,224,255,0.06)]"
      >
        <span className="min-w-0">
          <span className="aw-mono block text-[10px] uppercase tracking-[0.3em] text-[#00e0ff]">
            How to connect your domain
          </span>
          <span className="aw-text-dim mt-1 block text-[13px] leading-relaxed">
            Two quick things from you - we handle everything else.
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="shrink-0 transition-transform"
          style={{
            color: "#00e0ff",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="domain-steps-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-5">
              <ol className="space-y-4">
                <Step
                  n={1}
                  title="Type your domain above"
                  body={
                    <>
                      Something like{" "}
                      <span className="aw-mono text-text">learn.acme.com</span>.
                    </>
                  }
                />

                <Step
                  n={2}
                  title="Paste this one record at your domain provider"
                  body={
                    <>
                      Open your domain provider (GoDaddy, Cloudflare,
                      Namecheap, etc.) and add a CNAME with these values:
                      <DnsRow
                        hasDomain={hasDomain}
                        host={
                          customDomain ? hostPartOf(customDomain) : "learn"
                        }
                        target={target}
                      />
                    </>
                  }
                />
              </ol>

              <div
                className="mt-5 rounded-[10px] px-4 py-3 text-[12px] leading-relaxed"
                style={{
                  background: "rgba(0, 224, 255, 0.06)",
                  color: "rgb(var(--aw-fg-dim))",
                }}
              >
                We&apos;ll wire up SSL and switch you over automatically -
                usually within 5–30 minutes. Until then,{" "}
                <span className="aw-mono text-text">{slugUrl}</span> keeps
                working.
              </div>

              <p className="aw-help mt-4">
                Not sure where to click?{" "}
                <a
                  href="mailto:hello@ailinc.com"
                  className="aw-mono text-[12px] text-[#00e0ff] hover:underline"
                >
                  hello@ailinc.com
                </a>{" "}
                - send a screenshot of your DNS page and we&apos;ll do it
                with you.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="aw-mono grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
        style={{
          background: "linear-gradient(135deg, #2356d6 0%, #00e0ff 100%)",
          color: "#05070f",
        }}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[13px] font-semibold text-text">{title}</p>
        <div className="aw-text-dim mt-1 text-[13px] leading-relaxed">
          {body}
        </div>
      </div>
    </li>
  );
}

function DnsRow({
  hasDomain,
  host,
  target,
}: {
  hasDomain: boolean;
  host: string;
  target: string;
}) {
  return (
    <div
      className="mt-3 grid gap-2 rounded-[10px] p-3 sm:grid-cols-[auto,1fr,1fr,auto]"
      style={{
        border: "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
        background: "rgb(var(--aw-bg-2))",
      }}
    >
      <Cell label="Type" value="CNAME" />
      <Cell label="Host / Name" value={host} dim={!hasDomain} copyable={hasDomain} />
      <Cell
        label="Value / Target"
        value={target}
        copyable
      />
      <Cell label="TTL" value="3600" />
    </div>
  );
}

function Cell({
  label,
  value,
  dim,
  copyable,
}: {
  label: string;
  value: string;
  dim?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked - silently no-op */
    }
  };
  return (
    <div className="min-w-0">
      <p className="aw-mono aw-text-mute text-[9px] uppercase tracking-[0.28em]">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <code
          className={`aw-mono truncate text-[12px] ${
            dim ? "aw-text-mute" : "text-text"
          }`}
        >
          {value}
        </code>
        {copyable ? (
          <button
            type="button"
            onClick={onCopy}
            className="aw-mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#00e0ff] transition-colors hover:bg-[rgba(0,224,255,0.10)]"
            title="Copy to clipboard"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Extract the host portion ("learn") from a full subdomain ("learn.acme.com")
 * for the CNAME's "Host / Name" field. Some registrars want the full subdomain
 * here, some want just the leftmost label - we show the leftmost label
 * because it's what most registrars (Cloudflare, Namecheap, GoDaddy) require.
 */
function hostPartOf(domain: string): string {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return "";
  const firstDot = trimmed.indexOf(".");
  if (firstDot <= 0) return trimmed;
  return trimmed.slice(0, firstDot);
}
