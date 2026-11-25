import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy | Bhumi Blend Organics",
  description:
    "Bhumi Blend cancellation and refund policy: when an order can be canceled, who is eligible for a refund, and how exchanges work.",
};

// Wording and order are the ones on the live bhumiblend.com/cancellation-and-refund-policy/.
const sections: PolicySection[] = [
  {
    heading: "Order Cancellation",
    items: [
      "Orders can be canceled within 24 hours of placement.",
      "Once shipped, an order cannot be canceled.",
    ],
  },
  {
    heading: "Refunds",
    items: [
      "Refunds are applicable only for defective or damaged products.",
      "Refund requests must be made within 7 days of delivery.",
      "Refunds will be processed within 7-10 business days.",
    ],
  },
  {
    heading: "Exchange Policy",
    text: "Exchanges are allowed for defective items, subject to stock availability.",
  },
];

export default function CancellationAndRefundPolicyPage() {
  return (
    <PolicyPage
      title="Cancellation and Refund Policy : Terms and Conditions"
      sections={sections}
      gapAfterList={34}
    />
  );
}
