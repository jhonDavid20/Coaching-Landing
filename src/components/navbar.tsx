"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import {useTranslations} from 'next-intl';
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'


export default function Navbar() {
    const t = useTranslations('NavBarSection');
    const navItems = [
        { name: t('Home'), href: "#home" },
        { name: t('Assessment'), href: "#assessment" },
        { name: t('Services'), href: "#services" },
        { name: t('About'), href: "#about" },
    ]

    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

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
                isScrolled ? "bg-white/95 backdrop-blur-sm shadow-lg" : "bg-white/90 backdrop-blur-sm"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => scrollToSection("#home")}
                            className="text-2xl font-bold text-[#2D3748] hover:text-[#2D3748]/80 transition-colors"
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
                                    className="text-[#2D3748] hover:text-[#2D3748]/70 px-3 py-2 text-sm font-medium transition-colors relative group"
                                >
                                    {item.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2D3748] transition-all duration-300 group-hover:w-full"></span>
                                </button>
                            ))}
                        </div>
                        {/* Language Toggle Button */}
                        <button
                            onClick={toggleLocale}
                            className="ml-6 px-3 py-2 rounded text-sm font-medium border border-[#2D3748] text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
                        >
                            {locale === 'en' ? 'ES' : 'EN'}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        {/* Language Toggle Button for mobile */}
                        <button
                            onClick={toggleLocale}
                            className="mr-2 px-2 py-1 rounded text-xs font-medium border border-[#2D3748] text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
                        >
                            {locale === 'en' ? 'ES' : 'EN'}
                        </button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-[#2D3748] hover:bg-[#F7FAFC]"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-sm border-t border-[#F7FAFC]">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.href)}
                                    className="text-[#2D3748] hover:bg-[#F7FAFC] block px-3 py-2 text-base font-medium w-full text-left transition-colors"
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
