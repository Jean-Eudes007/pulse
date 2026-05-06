import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function VerifyDonePage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const ok = status === "ok";
  const expired = status === "expired";

  return (
    <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-6 sm:p-8 text-center">
      {ok ? (
        <>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            ✅ Email vérifié
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Votre compte est maintenant actif.
          </p>
          <Link
            href="/feedbacks"
            className="inline-block rounded-md bg-action text-text-info px-4 py-2 text-sm font-medium hover:bg-action-hover transition-colors"
          >
            Aller à la liste des feedbacks
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Lien {expired ? "expiré" : "invalide"}
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            {expired
              ? "Le lien de vérification a expiré. Connectez-vous et demandez-en un nouveau depuis la bannière."
              : "Ce lien n'existe pas ou a déjà été utilisé."}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md border border-border-secondary bg-bg-primary text-text-primary px-4 py-2 text-sm font-medium hover:bg-bg-secondary transition-colors"
          >
            Se connecter
          </Link>
        </>
      )}
    </div>
  );
}
