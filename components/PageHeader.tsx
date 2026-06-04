export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-12 hero-fade-in">
      <h1 className="text-4xl md:text-5xl font-light">{title}</h1>
      {subtitle && <p className="text-gray-400 mt-4 text-lg">{subtitle}</p>}
    </div>
  );
}
