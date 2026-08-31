export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Next.js + Postgres</h1>
      <p>
        Infrastructure is up. Check <code>/api/health</code> to verify the
        database connection.
      </p>
    </main>
  );
}