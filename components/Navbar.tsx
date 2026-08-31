import Link from "next/link";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link href="/" className="navbar-brand">
        CONTACTS<span className="navbar-brand-accent">.SYS</span>
      </Link>
      <Link href="/contacts/new" className="btn btn-primary">
        + New
      </Link>
    </header>
  );
}
