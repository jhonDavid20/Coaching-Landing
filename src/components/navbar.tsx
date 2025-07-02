"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import {useTranslations} from 'next-intl';
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";


export default function Navbar() {
    const t = useTranslations('NavBarSection');
    const navItems = [
        { name: t('Home'), href: "#home" },
        { name: t('Services'), href: "#services" },
        { name: t('Assessment'), href: "#assessment" },
        { name: t('Appointment'), href: "#appointment" },
        { name: t('About'), href: "#about" },
    ]

    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [mounted, setMounted] = useState(false)

    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleLocale = () => {
        const nextLocale = locale === 'en' ? 'es' : 'en';
        // Remove the current locale from the pathname if present
        const segments = pathname.split('/');
        if (segments[1] === 'en' || segments[1] === 'es') {
            segments[1] = nextLocale;
        } else {
            segments.splice(1, 0, nextLocale);
        }
        const newPath = segments.join('/') || '/';
        router.push(newPath);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToSection = (href: string) => {
        const element = document.querySelector(href)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        } else if (href === "#home") {
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
        setIsOpen(false)
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? "bg-background dark:bg-[#1A202C] backdrop-blur-sm shadow-lg"
                    : "bg-background/90 dark:bg-[#1A202C]/90 backdrop-blur-sm"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => scrollToSection("#home")}
                            className="text-2xl font-bold text-foreground dark:text-white hover:text-primary transition-colors"
                        >
                            FitCoach
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.href)}
                                    className="text-foreground dark:text-white hover:text-primary dark:hover:text-gray-300 px-3 py-2 text-sm font-medium transition-colors relative group"
                                >
                                    {item.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary dark:bg-white transition-all duration-300 group-hover:w-full"></span>
                                </button>
                            ))}
                        </div>
                        {/* Language Toggle Button */}
                        <button
                            onClick={toggleLocale}
                            className="ml-6 px-3 py-2 rounded text-sm font-medium border border-border text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#23272F] transition-colors"
                        >
                            {locale === 'en' ? 'ES' : 'EN'}
                        </button>
                        {/* Theme Toggle Button */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="ml-4 p-2 rounded border border-border text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#23272F] transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        {/* Language Toggle Button for mobile */}
                        <button
                            onClick={toggleLocale}
                            className="h-10 px-4 py-2 rounded text-sm font-medium border border-border text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#23272F] transition-colors"
                        >
                            {locale === 'en' ? 'ES' : 'EN'}
                        </button>
                        {/* Theme Toggle Button for mobile */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="h-10 px-4 py-2 rounded text-sm font-medium border border-border text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#23272F] transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(!isOpen)}
                            className="h-10 px-4 py-2 rounded text-sm font-medium text-foreground dark:text-white border border-border dark:border-white hover:bg-accent"
                            aria-label="Open menu"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-background dark:bg-[#23272F] backdrop-blur-sm border-t border-border">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.href)}
                                    className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#23272F] block px-3 py-2 text-base font-medium w-full text-left transition-colors"
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
