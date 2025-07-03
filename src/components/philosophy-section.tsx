"use client";

import { useTranslations, useLocale } from "next-intl";

const PhilosophySection: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section
      id="philosophy"
      className="
        bg-gradient-to-b
        from-muted
        to-background
        dark:from-[#1A202C]
        dark:to-[#23272F]
        py-16 px-4
      "
    >
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground dark:text-white mb-4">
            {t("philosophy.title")}
          </h2>
          <p className="text-lg text-foreground dark:text-gray-300 font-medium">
            {t("philosophy.subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="text-center p-8 bg-card dark:bg-[#23272F] text-card-foreground dark:text-white rounded-lg shadow-lg border border-border"
            >
              <div className="text-4xl font-bold text-primary mb-2">
                {t(`philosophy.stats.${i}.number`)}
              </div>
              <div className="text-base text-foreground dark:text-gray-300 font-medium">
                {t(`philosophy.stats.${i}.label`)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-8">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-primary text-primary-foreground dark:bg-white dark:text-[#2D3748] p-6 rounded-lg shadow border border-border"
              >
                <h3 className="text-lg font-semibold mb-2">
                  {t(`philosophy.keyPoints.${i}.title`)}
                </h3>
                <p>{t(`philosophy.keyPoints.${i}.text`)}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center p-8 bg-card dark:bg-[#23272F] rounded-lg border border-border shadow">
            <div className="text-5xl mb-4 text-primary">
              {t("philosophy.analogy.icon")}
            </div>
            <div className="text-center text-base text-foreground dark:text-gray-300 font-medium">
              <strong>{t("philosophy.analogy.title")}</strong>
              <br />
              {t("philosophy.analogy.text")}
            </div>
          </div>
        </div>

        <div className="text-center p-8 bg-primary text-primary-foreground dark:bg-white dark:text-[#2D3748] rounded-lg shadow-lg mt-8">
          <h3 className="text-2xl font-bold mb-2">{t("philosophy.cta.title")}</h3>
          <p className="text-lg mb-6 opacity-90">{t("philosophy.cta.text")}</p>
          <a
            href={`/${locale}/philosophy`}
            className="
              inline-block
              bg-background
              text-foreground
              dark:bg-[#23272F]
              dark:text-white
              px-8 py-3 rounded-full font-semibold text-base border-2 border-border
              transition hover:bg-primary hover:text-primary-foreground hover:shadow-lg
              dark:hover:bg-white dark:hover:text-[#2D3748]
            "
          >
            {t("philosophy.cta.button")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;