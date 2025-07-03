"use client";

import { useTranslations } from "next-intl";

export default function PhilosophyPage() {
  const t = useTranslations("PhilosophyFullPage");
  

  return (
    <section
      className="
        bg-gradient-to-b
        from-muted
        to-background
        dark:from-[#1A202C]
        dark:to-[#23272F]
        pt-32 pb-16 px-4
        min-h-screen
      "
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-foreground dark:text-gray-300 font-medium">
            {t("heroSubtitle")}
          </p>
        </header>

        {/* Problem Section */}
        <div className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white rounded-lg shadow-lg border border-border p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">
            {t("problemTitle")}
          </h2>
          <div className="bg-gradient-to-r from-red-400 to-orange-400 text-white p-4 rounded-xl mb-4">
            <div className="font-semibold">{t("problemHighlight1")}</div>
            <div>{t("problemHighlight2")}</div>
          </div>
          <p className="text-base md:text-lg text-foreground dark:text-gray-300 mb-4">
            {t("problemText")}
          </p>
        </div>

        {/* Approach Section */}
        <div className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white rounded-lg shadow-lg border border-border p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">
            {t("approachTitle")}
          </h2>
          <p className="text-base md:text-lg text-foreground dark:text-gray-300 mb-6">
            {t("approachIntro")}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-muted dark:bg-[#181A20] p-4 rounded-xl border-l-4 border-indigo-500"
              >
                <div className="text-2xl font-bold text-indigo-500 mb-2">
                  {n}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">
                  {t(`principles.${n}.title`)}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t(`principles.${n}.text`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white rounded-lg shadow-lg border border-border p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">
            {t("educationSection.title")}
          </h2>
          <p className="text-base md:text-lg text-foreground dark:text-gray-300 mb-4">
            {t("educationSection.content")}
          </p>
        </div>

        {/* Transformation Stories */}
          {/*
        <div className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white rounded-lg shadow-lg border border-border p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">
            {t("transformationStories.title")}
          </h2>
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="bg-muted dark:bg-[#181A20] p-4 rounded-lg">
                <p className="italic mb-1">
                  "{t(`transformationStories.testimonials.${i}.statement`)}
                </p>
                <p className="text-sm text-right font-semibold">
                  - {t(`transformationStories.testimonials.${i}.name`)}
                </p>
              </div>
            ))}
          </div>
        </div>
        */}
        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground dark:bg-white dark:text-[#2D3748] rounded-lg shadow-lg p-8 text-center mt-16">
          <h3 className="text-2xl font-bold mb-2">{t("cta.title")}</h3>
          <p className="text-lg mb-6 opacity-90">{t("cta.text")}</p>
          <a
            href="/#appointment"
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
            {t("cta.button")}
          </a>
        </div>
      </div>
    </section>
  );
}