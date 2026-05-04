import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/feedbacks");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <section className="text-center py-12 sm:py-20">
        <p className="text-xs uppercase tracking-widest text-text-tertiary mb-4">
          Outil interne · feedback produit
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-text-primary mb-4 tracking-tight">
          Pulse
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
          Centralisez et priorisez le feedback de votre équipe.
          <br className="hidden sm:inline" />
          Vos collègues proposent, votent — vous priorisez avec des données.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="rounded-md bg-action text-text-info px-6 py-3 text-sm font-medium hover:bg-action-hover transition-colors"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border-secondary bg-bg-primary text-text-primary px-6 py-3 text-sm font-medium hover:bg-bg-secondary transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-4 mb-12">
        <FeatureCard
          emoji="📝"
          title="Soumettez du feedback"
          body="Bugs, idées, améliorations. Un titre, une description, un type — c'est tout."
        />
        <FeatureCard
          emoji="👍"
          title="Votez ce qui compte"
          body="Un vote par utilisateur et par feedback. Pas de spam, pas de noise."
        />
        <FeatureCard
          emoji="🎯"
          title="Priorisez sans deviner"
          body="La liste se trie automatiquement par nombre de votes. Le top, c'est ce qu'attend l'équipe."
        />
      </section>

      {/* How it works */}
      <section className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8 mb-12">
        <h2 className="text-base font-medium mb-6">Comment ça marche</h2>
        <ol className="space-y-4 text-sm text-text-secondary">
          <Step n={1}>
            Vous créez un compte avec votre email pro (
            <span className="text-text-primary">aucune donnée partagée</span>).
          </Step>
          <Step n={2}>
            Vous soumettez un feedback en{" "}
            <span className="text-text-primary">3 champs</span> : titre,
            description, type (bug / idée / amélioration).
          </Step>
          <Step n={3}>
            Vous votez sur les feedbacks de l'équipe — vous ne pouvez voter
            qu'une fois par feedback, et vous voyez en temps réel le classement.
          </Step>
          <Step n={4}>
            L'admin produit consulte le dashboard et tranche sur les
            priorités à partir des votes réels.
          </Step>
        </ol>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-8 border-t border-border-tertiary">
        <p className="text-sm text-text-secondary mb-4">
          Prêt à arrêter de prioriser à l'instinct ?
        </p>
        <Link
          href="/signup"
          className="rounded-md bg-action text-text-info px-6 py-3 text-sm font-medium hover:bg-action-hover transition-colors inline-block"
        >
          Créer un compte gratuit
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-bg-primary border border-border-tertiary rounded-lg p-6">
      <div className="text-2xl mb-3" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-bg-tertiary text-text-primary text-xs font-medium flex items-center justify-center">
        {n}
      </span>
      <span className="leading-relaxed pt-0.5">{children}</span>
    </li>
  );
}
