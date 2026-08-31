"use client";

import { deleteContact } from "@/app/contacts/actions";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteContact.bind(null, id)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this contact? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-danger">
        Delete
      </button>
    </form>
  );
}
