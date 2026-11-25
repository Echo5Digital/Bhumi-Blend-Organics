import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Bhumi Blend Organics",
  description:
    "How Bhumi Blend collects, uses, discloses and safeguards your personal data when you visit our website.",
};

// Wording and order are the ones on the live bhumiblend.com/privacy-policy/.
const sections: PolicySection[] = [
  {
    heading: "Information We Collect",
    items: [
      "Personal details (name, email, phone number, address)",
      "Payment information (processed securely through third-party payment gateways)",
      "Browsing and transaction history",
    ],
  },
  {
    heading: "How We Use Your Information",
    items: [
      "To process and fulfill your orders",
      "To communicate with you regarding your purchases and promotional offers",
      "To improve our website and services",
    ],
  },
  {
    heading: "Data Security",
    text: "We implement strict security measures to protect your personal data. However, no method of transmission over the Internet is 100% secure.",
  },
  {
    heading: "Sharing Your Information",
    text: "We do not sell or trade your information. It may be shared with trusted third-party service providers for payment processing, delivery, or analytics.",
  },
  {
    heading: "Cookies and Tracking",
    text: "Our website uses cookies to enhance user experience and analyze website traffic.",
  },
  {
    heading: "Your Rights",
    text: "You have the right to access, update, or request the deletion of your personal data by contacting us.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="At Bhumi Blend, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website."
      sections={sections}
      gapAfterList={34}
      gapAfterText={21}
      bigTitle
    />
  );
}
