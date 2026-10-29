import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section text-center">
      <h1 className="mb-4 text-4xl font-bold">找不到頁面</h1>
      <Link href="/" className="btn-primary">
        返回首頁
      </Link>
    </section>
  );
}
