import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms and Conditions | Bhumi Blend Organics",
  description:
    "Bhumi Blend terms and conditions: general terms, orders and payments, product information, liability limitations and governing law.",
};

// Wording and order are the ones on the live bhumiblend.com/terms-and-conditions/.
const sections: PolicySection[] = [
  {
    heading: "General",
    items: [
      "Bhumi Blend reserves the right to modify these terms at any time.",
      "Users must be at least 18 years old to make purchases.",
    ],
  },
  {
    heading: "Orders & Payments",
    items: [
      "All orders are subject to availability.",
      "Payment must be completed before order processing.",
    ],
  },
  {
    heading: "Product Information",
    text: "We strive for accuracy in product descriptions, but minor variations may occur.",
  },
  {
    heading: "Liability Limitations",
    text: "Bhumi Blend is not responsible for any damages arising from improper use of our products.",
  },
  {
    heading: "Governing Law",
    text: "These terms are governed by the laws of India.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PolicyPage
      title="Terms and Conditions"
      intro="Welcome to Bhumi Blend. By using our website, you agree to the following terms and conditions:"
      sections={sections}
      gapAfterIntro={47}
      gapAfterList={34}
      gapAfterText={32}
    />
  );
}
