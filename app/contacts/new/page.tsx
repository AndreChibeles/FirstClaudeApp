import ContactForm from "@/components/ContactForm";

export default function NewContactPage() {
  return (
    <div className="page">
      <h1 className="page-title">New Contact</h1>
      <ContactForm mode="create" />
    </div>
  );
}
