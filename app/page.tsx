import { prisma } from "@/lib/prisma";
import ContactsTable from "@/components/ContactsTable";

export const dynamic = "force-dynamic";

export default async function Home() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page">
      <h1 className="page-title">Contacts Directory</h1>
      <div className="hud-panel">
        <ContactsTable contacts={contacts} />
      </div>
    </div>
  );
}
