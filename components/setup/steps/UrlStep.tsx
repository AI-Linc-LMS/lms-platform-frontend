"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
        className="rounded-2xl p-7"
        style={{
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          background: "rgba(255, 255, 255, 0.015)",
        }}
      >
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          Bring your own domain (optional)
        </p>
        <p className="aw-text-dim mt-3 text-[14px] leading-[1.65]">
          Want learners to reach your LMS at{" "}
          <span className="aw-mono text-[13px] text-text">
            learn.your-org.com
          </span>{" "}
          instead of{" "}
          <span className="aw-mono text-[13px] text-text">
            {state.subdomain}.ailinc.com
          </span>
          ? You can set this up now or anytime later from{" "}
          <span className="text-text">Settings → Domain</span> — your AI Linc
          URL keeps working either way.
        </p>

        <div className="mt-6">
          <label className="aw-label" htmlFor="custom-domain">
            Custom domain
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
            Enter the exact subdomain you want to use (e.g.{" "}
            <span className="aw-mono">learn.acme.com</span>). Apex domains like{" "}
            <span className="aw-mono">acme.com</span> need an ALIAS or ANAME
            record instead of CNAME — check your registrar.
          </p>
        </div>

        <CustomDomainSteps
          slugUrl={`${state.subdomain}.ailinc.com`}
          customDomain={url.custom_domain || ""}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Numbered walkthrough for setting up a custom domain. Shown unconditionally
 * so users can scan what's involved BEFORE they commit a domain name. As soon
 * as they paste a domain into the field above, the snippets become
 * personalised (their actual `learn.example.com` and `slug.ailinc.com` show
 * up in the CNAME row, ready to copy).
 *
 * Two-step model we follow:
 *   (a) User adds a CNAME at their DNS registrar pointing the custom domain
 *       at their existing `<slug>.ailinc.com` (the *.ailinc.com wildcard
 *       handles routing automatically once DNS resolves).
 *   (b) The AI Linc team registers the domain on the Netlify side so SSL
 *       auto-provisions and Netlify accepts the Host header. Triggered
 *       automatically when the form is saved with a custom_domain set.
 *
 * The component lives in this file rather than `components/ui` because it's
 * specific to the wizard's tone (aw-card, aw-mono, etc.) and won't be reused.
 */
function CustomDomainSteps({
  slugUrl,
  customDomain,
}: {
  slugUrl: string;
  customDomain: string;
}) {
  const hasDomain = customDomain.length > 0;
  const target = slugUrl; // CNAME target — your existing AI Linc URL

  return (
    <div
      className="mt-6 rounded-[14px] p-5"
      style={{
        border: "1px solid rgba(0, 224, 255, 0.18)",
        background: "rgba(0, 224, 255, 0.04)",
      }}
    >
      <p className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#00e0ff]">
        How to enable a custom domain
      </p>
      <p className="aw-text-dim mt-2 text-[13px] leading-relaxed">
        Four steps — you do steps 1 &amp; 2, we handle steps 3 &amp; 4. Total
        time is usually 10–30 minutes; DNS propagation is the slow part.
      </p>

      <ol className="mt-5 space-y-4">
        <Step
          n={1}
          title="Decide which subdomain you want"
          body={
            <>
              Pick something short like{" "}
              <span className="aw-mono text-text">learn</span>,{" "}
              <span className="aw-mono text-text">academy</span>, or{" "}
              <span className="aw-mono text-text">training</span>, then put it
              in front of your company&apos;s root domain (e.g.{" "}
              <span className="aw-mono text-text">learn.acme.com</span>). Type
              it into the &ldquo;Custom domain&rdquo; field above.
            </>
          }
        />

        <Step
          n={2}
          title="Add a CNAME record at your DNS provider"
          body={
            <>
              In whichever service manages DNS for your root domain
              (Cloudflare, GoDaddy, Namecheap, AWS Route 53, Google Domains,
              etc.), add a single <span className="aw-mono text-text">CNAME</span>{" "}
              record:
              <DnsRow
                hasDomain={hasDomain}
                host={customDomain ? hostPartOf(customDomain) : "learn"}
                target={target}
              />
              <span className="block mt-2 text-[12px]">
                TTL can stay at the default (usually 1 hour). If your registrar
                forces an apex domain (no subdomain), use{" "}
                <span className="aw-mono text-text">ALIAS</span> or{" "}
                <span className="aw-mono text-text">ANAME</span> with the same
                target — both work the same way for our purposes.
              </span>
            </>
          }
        />

        <Step
          n={3}
          title="We register the domain on our side"
          body={
            <>
              When you finish this wizard with a custom domain entered, your
              request goes to the AI Linc team. We add{" "}
              <span className="aw-mono text-text">
                {hasDomain ? customDomain : "your-domain.com"}
              </span>{" "}
              to your Netlify site so SSL provisions automatically via
              Let&apos;s Encrypt. You don&apos;t need to do anything for this
              step — usually finishes within a few minutes once DNS resolves.
            </>
          }
        />

        <Step
          n={4}
          title="Wait for DNS to propagate, then test"
          body={
            <>
              DNS changes typically reach most of the internet within 5–30
              minutes, occasionally up to 24 hours. You&apos;ll know it&apos;s
              live when{" "}
              <span className="aw-mono text-text">
                https://{hasDomain ? customDomain : "your-domain.com"}
              </span>{" "}
              loads your LMS without any certificate warning. Until then,{" "}
              <span className="aw-mono text-text">{slugUrl}</span> keeps
              working as a fallback.
            </>
          }
        />
      </ol>

      <p className="aw-help mt-5">
        Need help with the DNS part? Email us at{" "}
        <a
          href="mailto:hello@ailinc.com"
          className="aw-mono text-[12px] text-[#00e0ff] hover:underline"
        >
          hello@ailinc.com
        </a>{" "}
        with a screenshot of your registrar&apos;s DNS panel — we&apos;ll send
        back the exact values to paste.
      </p>
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
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <Cell label="Type" value="CNAME" />
      <Cell label="Host / Name" value={host} dim={!hasDomain} copyable={hasDomain} />
      <Cell
        label="Value / Target"
        value={target}
        copyable
      />
      <Cell label="TTL" value="3600 (default)" />
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
      /* clipboard blocked — silently no-op */
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
 * here, some want just the leftmost label — we show the leftmost label
 * because it's what most registrars (Cloudflare, Namecheap, GoDaddy) require.
 */
function hostPartOf(domain: string): string {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return "";
  const firstDot = trimmed.indexOf(".");
  if (firstDot <= 0) return trimmed;
  return trimmed.slice(0, firstDot);
}
