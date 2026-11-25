import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Shipping Policy | Bhumi Blend Organics",
  description:
    "Bhumi Blend shipping policy: delivery timelines, shipping charges, order tracking and what to do about delayed or lost shipments.",
};

// Wording and order are the ones on the live bhumiblend.com/shipping-and-delivery-policy/.
const sections: PolicySection[] = [
  {
    heading: "Delivery Timelines",
    items: [
      "Orders are processed within 1-3 business days.",
      "Delivery within India takes 5-7 business days.",
      "International shipping timelines vary based on location.",
    ],
  },
  {
    heading: "Shipping Charges",
    items: [
      "Free shipping may be available for select orders.",
      "Shipping charges, if applicable, will be displayed at checkout.",
    ],
  },
  {
    heading: "Order Tracking",
    text: "Customers will receive tracking details once the order is dispatched.",
  },
  {
    heading: "Delayed or Lost Shipments",
    text: "In case of delays or lost shipments, customers can contact our support team.",
  },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping Policy : Terms and Conditions"
      sections={sections}
      gapAfterList={54}
    />
  );
}
