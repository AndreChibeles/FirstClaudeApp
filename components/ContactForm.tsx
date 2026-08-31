"use client";

import { useActionState } from "react";
import type { Contact } from "@prisma/client";
import {
  createContact,
  updateContact,
  type ContactFormState,
} from "@/app/contacts/actions";

type Props =
  | { mode: "create"; contact?: undefined }
  | { mode: "edit"; contact: Contact };

const initialState: ContactFormState = { errors: {} };

export default function ContactForm({ mode, contact }: Props) {
  const action =
    mode === "edit" ? updateContact.bind(null, contact.id) : createContact;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="hud-panel form-panel">
      <div className="form-field">
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          defaultValue={contact?.firstName}
        />
        {state.errors.firstName && (
          <span className="form-error">{state.errors.firstName}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          required
          defaultValue={contact?.lastName}
        />
        {state.errors.lastName && (
          <span className="form-error">{state.errors.lastName}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={contact?.email}
        />
        {state.errors.email && (
          <span className="form-error">{state.errors.email}</span>
        )}
      </div>

      {state.message && <p className="form-error">{state.message}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving..." : mode === "edit" ? "Update" : "Create"}
      </button>
    </form>
  );
}
