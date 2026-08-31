import Link from "next/link";
import type { Contact } from "@prisma/client";
import DeleteButton from "@/components/DeleteButton";

export default function ContactsTable({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        NO RECORDS FOUND — CLICK [+ NEW] TO ADD A CONTACT
      </div>
    );
  }

  return (
    <table className="hud-table">
      <thead>
        <tr>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          <tr key={contact.id}>
            <td>{contact.firstName}</td>
            <td>{contact.lastName}</td>
            <td>{contact.email}</td>
            <td className="hud-table-actions">
              <Link
                href={`/contacts/${contact.id}/edit`}
                className="btn btn-secondary"
              >
                Edit
              </Link>
              <DeleteButton id={contact.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
