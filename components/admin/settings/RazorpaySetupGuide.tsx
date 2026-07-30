"use client";

import { Box, Typography, Link } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/** Inline monospace value token. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="code"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.72rem",
        bgcolor: "var(--surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 0.5,
        px: 0.5,
        py: "1px",
        color: "var(--font-primary)",
        wordBreak: "break-all",
      }}
    >
      {children}
    </Box>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 2, mb: 0.75 }}>
      {children}
    </Typography>
  );
}

const extLink = { color: "var(--accent-indigo)", fontWeight: 600 };
const liSx = { mb: 0.75, color: "var(--font-secondary)", fontSize: "0.8125rem", lineHeight: 1.55 };

/**
 * Step-by-step Razorpay setup guide, shown (collapsed by default) under the payment account card.
 *
 * Deliberately mirrors the Zoom setup guide: exact dashboard navigation, direct links, and the
 * tenant's own webhook URL inlined so it can be copied rather than assembled by hand.
 *
 * Part 3 (the webhook) is not optional and the guide says so in those words. Keys alone make the
 * checkout *open*; only the webhook makes a payment *settle*. Skipping it produces the exact
 * failure this platform already lived through - learners charged, access never granted, because
 * settlement depended on their browser coming back to the return URL.
 */
export function RazorpaySetupGuide({ webhookUrl }: { webhookUrl: string }) {
  return (
    <Box
      sx={{
        mt: 1,
        p: 2,
        bgcolor: "var(--surface)",
        borderRadius: 1.5,
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Prerequisites */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          p: 1.25,
          mb: 1,
          borderRadius: 1,
          bgcolor: "color-mix(in srgb, var(--warning-500) 10%, var(--surface) 90%)",
          border: "1px solid color-mix(in srgb, var(--warning-500) 28%, var(--border-default) 72%)",
        }}
      >
        <IconWrapper icon="mdi:shield-key-outline" size={18} color="var(--warning-500)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
          You need a Razorpay account that has completed <strong>KYC activation</strong> - until
          Razorpay activates the account you can only generate <Code>rzp_test_…</Code> keys, which
          take no real money. You must be the account <strong>Owner</strong> or an{" "}
          <strong>Admin</strong> to see Settings → API Keys. Money settles into{" "}
          <strong>your</strong> bank account, on Razorpay&apos;s own settlement cycle - AI Linc
          never holds it.
        </Typography>
      </Box>

      {/* Part 1 */}
      <StepHeading>Part 1 - Create your API key</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Sign in to the{" "}
          <Link href="https://dashboard.razorpay.com/" target="_blank" rel="noopener" sx={extLink}>
            Razorpay Dashboard
          </Link>
          .
        </Box>
        <Box component="li" sx={liSx}>
          Check the <strong>Test / Live</strong> switch at the top-left of the dashboard. Set it to{" "}
          <strong>Live</strong> before generating keys, unless you are deliberately testing - test
          keys never charge anyone, and a checkout opened with them looks identical.
        </Box>
        <Box component="li" sx={liSx}>
          Left sidebar → <strong>Account &amp; Settings</strong> → under <em>Website and app
          settings</em> click <strong>API Keys</strong> (
          <Link
            href="https://dashboard.razorpay.com/app/website-app-settings/api-keys"
            target="_blank"
            rel="noopener"
            sx={extLink}
          >
            direct link
          </Link>
          ).
        </Box>
        <Box component="li" sx={liSx}>
          Click <strong>Generate Live Key</strong> (or <strong>Regenerate</strong> if one already
          exists - note that regenerating <em>immediately breaks</em> any other system using the old
          key).
        </Box>
        <Box component="li" sx={liSx}>
          A dialog shows <strong>Key Id</strong> (<Code>rzp_live_…</Code>) and{" "}
          <strong>Key Secret</strong>.
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
            <Box component="li" sx={liSx}>
              ⚠️ The <strong>Key Secret is shown exactly once</strong>. Download the credentials or
              copy it now - if you close this dialog you cannot recover it, only regenerate a new
              pair.
            </Box>
          </Box>
        </Box>
        <Box component="li" sx={liSx}>
          Paste both into <strong>Razorpay Key ID</strong> and <strong>Razorpay Key Secret</strong>{" "}
          on this screen, then click <strong>Connect account</strong>.
        </Box>
      </Box>

      {/* Part 2 */}
      <StepHeading>Part 2 - Turn on the payment methods you want</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Razorpay Dashboard → <strong>Account &amp; Settings</strong> →{" "}
          <strong>Configuration</strong> →{" "}
          <Link
            href="https://dashboard.razorpay.com/app/website-app-settings/payment-methods"
            target="_blank"
            rel="noopener"
            sx={extLink}
          >
            Payment Methods
          </Link>
          .
        </Box>
        <Box component="li" sx={liSx}>
          Enable at least <strong>UPI</strong> and <strong>Cards</strong>. Whatever is switched off
          here simply will not appear in your learners&apos; checkout - this platform does not
          override it.
        </Box>
        <Box component="li" sx={liSx}>
          Optional but recommended: <strong>Netbanking</strong> and <strong>Wallets</strong>.
        </Box>
      </Box>

      {/* Part 3 - the one that actually matters */}
      <StepHeading>Part 3 - Add the webhook (not optional)</StepHeading>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          p: 1.25,
          mb: 1.25,
          borderRadius: 1,
          bgcolor: "color-mix(in srgb, var(--error-500) 10%, var(--surface) 90%)",
          border:
            "1px solid color-mix(in srgb, var(--error-500) 28%, var(--border-default) 72%)",
        }}
      >
        <IconWrapper icon="mdi:alert-octagon-outline" size={18} color="var(--error-500)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
          The keys above make the checkout <em>open</em>. The webhook is what makes a payment{" "}
          <em>count</em>. Without it, a learner is granted access only if their browser makes it
          back to this site after paying - so closing the tab, a dropped network or a dead battery
          means they are charged and get nothing. Do not skip this part.
        </Typography>
      </Box>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Razorpay Dashboard → <strong>Account &amp; Settings</strong> → under <em>Website and app
          settings</em> click <strong>Webhooks</strong> (
          <Link
            href="https://dashboard.razorpay.com/app/website-app-settings/webhooks"
            target="_blank"
            rel="noopener"
            sx={extLink}
          >
            direct link
          </Link>
          ) → <strong>+ Add New Webhook</strong>.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Webhook URL</strong> - paste your institution&apos;s own endpoint:
          <Box sx={{ mt: 0.5 }}>
            <Code>{webhookUrl || "shown on this screen once the page has loaded your account"}</Code>
          </Box>
          <Box sx={{ ...liSx, mt: 0.5, mb: 0, opacity: 0.85 }}>
            (Use the copy button next to <strong>Webhook URL</strong> on this screen - the address is
            specific to your institution and settles only your orders.)
          </Box>
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Secret</strong> - type any strong random string you invent (Razorpay does not
          generate one for you). Keep it to letters and digits, 20+ characters. Paste the{" "}
          <em>same</em> string into <strong>Webhook Secret</strong> on this screen.
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
            <Box component="li" sx={liSx}>
              This is what proves a delivery genuinely came from Razorpay. If the two do not match,
              every notification is rejected and nothing settles.
            </Box>
          </Box>
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Alert Email</strong> - your finance or ops address. Razorpay emails it when
          deliveries start failing.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Active Events</strong> - tick exactly these three:
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
            <Box component="li" sx={liSx}>
              <Code>payment.captured</Code> <em>(the money arrived — this is the one that grants
              access)</em>
            </Box>
            <Box component="li" sx={liSx}>
              <Code>order.paid</Code> <em>(belt and braces: the order is fully paid)</em>
            </Box>
            <Box component="li" sx={liSx}>
              <Code>payment.failed</Code> <em>(closes the attempt so a learner can retry cleanly)</em>
            </Box>
          </Box>
        </Box>
        <Box component="li" sx={liSx}>
          Click <strong>Create Webhook</strong>. It should appear with status <strong>Active</strong>.
        </Box>
        <Box component="li" sx={liSx}>
          Come back here and confirm the card shows <strong>Webhook active</strong>. If it still
          says the webhook is missing, the secret was not saved on this screen.
        </Box>
      </Box>

      {/* Part 4 */}
      <StepHeading>Part 4 - Check it end to end</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Price one course, open it as a learner, and pay the real amount with UPI (₹1 works if you
          temporarily price it at ₹1).
        </Box>
        <Box component="li" sx={liSx}>
          The learner should land on the success screen and the course should open immediately.
        </Box>
        <Box component="li" sx={liSx}>
          In Razorpay → <strong>Webhooks</strong> → your webhook → <strong>Recent Deliveries</strong>,
          the <Code>payment.captured</Code> delivery should read <strong>200</strong>. A{" "}
          <Code>401</Code> or <Code>400</Code> means the secret does not match; a <Code>503</Code>{" "}
          means no secret is saved on this screen.
        </Box>
        <Box component="li" sx={liSx}>
          Refund yourself from the Razorpay dashboard afterwards if you used a real amount.
        </Box>
      </Box>

      {/* Live vs test note */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          mt: 2,
          p: 1.25,
          borderRadius: 1,
          bgcolor: "color-mix(in srgb, var(--accent-indigo) 9%, var(--surface) 91%)",
          border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, var(--border-default) 72%)",
        }}
      >
        <IconWrapper icon="mdi:swap-horizontal" size={18} color="var(--accent-indigo)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
          Test and Live are separate worlds in Razorpay: separate keys <em>and</em> separate
          webhooks. If you set this up in Test mode first, remember to repeat Part 1 and Part 3 in
          Live mode - a live key with only a test webhook takes real money and settles nothing.
        </Typography>
      </Box>
    </Box>
  );
}
