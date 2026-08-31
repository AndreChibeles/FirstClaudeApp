"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/contact";

export type ContactFormState = {
  errors: Partial<Record<"firstName" | "lastName" | "email", string>>;
  message?: string;
};

function parseForm(formData: FormData) {
  return contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
  });
}

function flattenErrors(error: import("zod").ZodError): ContactFormState["errors"] {
  const fieldErrors = error.flatten().fieldErrors;
  return {
    firstName: fieldErrors.firstName?.[0],
    lastName: fieldErrors.lastName?.[0],
    email: fieldErrors.email?.[0],
  };
}

function isUniqueEmailError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { errors: flattenErrors(parsed.error) };
  }

  try {
    await prisma.contact.create({ data: parsed.data });
  } catch (error) {
    return {
      errors: {},
      message: isUniqueEmailError(error)
        ? "Email already in use"
        : "Failed to create contact",
    };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateContact(
  id: string,
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { errors: flattenErrors(parsed.error) };
  }

  try {
    await prisma.contact.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return {
      errors: {},
      message: isUniqueEmailError(error)
        ? "Email already in use"
        : "Failed to update contact",
    };
  }

  revalidatePath("/");
  redirect("/");
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/");
}
