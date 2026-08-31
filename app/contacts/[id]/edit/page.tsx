import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/ContactForm";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });

  if (!contact) {
    notFound();
  }

  return (
    <div className="page">
      <h1 className="page-title">Edit Contact</h1>
      <ContactForm mode="edit" contact={contact} />
    </div>
  );
}
