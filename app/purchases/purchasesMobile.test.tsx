import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

/**
 * My Purchases on a phone. A five-column table in 390px squeezed the reference to one character
 * per line and pushed the status chip out of view. A phone gets one card per payment. 600px and
 * up still get the original table.
 */

import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { MyTransaction } from "@/lib/services/payment.service";

const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

const txn = (over: Partial<MyTransaction>): MyTransaction => ({
  id: 1,
  payment_type: "ADAPTIVE_COURSE",
  payment_type_display: "Course",
  type_id: "12",
  product_title: "Advanced Python",
  amount: "499.00",
  currency: "INR",
  status: "VERIFIED",
  status_display: "Paid",
  created_at: "2026-09-01T10:00:00Z",
  settled_at: null,
  refunded_at: null,
  refunded_amount: null,
  access_state: "active",
  razorpay_payment_id: "pay_ABC123",
  error_message: null,
  ...over,
});

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/lib/services/payment.service", () => ({ paymentService: { listMyTransactions: mocks.list } }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/components/common/PageShell", () => ({ PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/common/ModulePageHeader", () => ({ ModulePageHeader: () => null }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => ({ "purchases.reference": "Reference" })[key] ?? key }),
}));

import PurchasesPage from "./page";

function load(rows: MyTransaction[], count = rows.length) {
  mocks.list.mockResolvedValue({ count, page: 1, page_size: 20, results: rows });
}

describe("My Purchases", () => {
  it("shows one card per payment on a phone, with status, refund and the support reference", async () => {
    viewport(390);
    load([
      txn({ id: 1 }),
      txn({ id: 2, product_title: "SQL Basics", status: "REFUNDED", status_display: "Refunded", refunded_amount: "499.00", access_state: "revoked", razorpay_payment_id: "pay_XYZ" }),
    ]);
    render(<PurchasesPage />);
    const cards = await screen.findAllByTestId("purchase-card");
    expect(cards).toHaveLength(2);
    expect(screen.queryByRole("table")).toBeNull();
    const second = within(cards[1]);
    expect(second.getByText("SQL Basics")).toBeInTheDocument();
    expect(second.getByText("Refunded")).toBeInTheDocument();
    expect(second.getByText(/refunded$/)).toBeInTheDocument();
    expect(second.getByText("Refunded — access to this has been removed.")).toBeInTheDocument();
    expect(second.getByText("pay_XYZ")).toBeInTheDocument();
    expect(second.getByText(/Reference/)).toBeInTheDocument();
  });

  it("keeps the original table on a desktop", async () => {
    viewport(1440);
    load([txn({ id: 1 })]);
    render(<PurchasesPage />);
    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Item",
      "Amount",
      "Status",
      "Date",
      "Reference",
    ]);
    expect(screen.queryByTestId("purchase-card")).toBeNull();
  });

  it("gives the page buttons a 44px target inside the phone block only", async () => {
    viewport(390);
    load([txn({ id: 1 })], 60);
    render(<PurchasesPage />);
    const nav = await screen.findByRole("navigation");
    const css = cssByMedia(nav);
    expect(css.phone).toContain("min-width:44px");
    expect(css.phone).toContain("height:44px");
    expect(css.unscoped).not.toContain("44px");
  });
});
