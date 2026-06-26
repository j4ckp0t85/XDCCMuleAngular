import { Service, signal } from '@angular/core';

export type ThemeType = 'light' | 'dark' | 'system';

@Service()
export class ThemeService {
    private readonly THEME_KEY = 'xdccmule-theme';

    public currentTheme = signal<ThemeType>('system');
    public isDarkActive = signal<boolean>(false);

    constructor() {
        this.initTheme();

        // Listen for OS changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme() === 'system') {
                this.applyTheme('system');
            }
        });
    }

    private initTheme() {
        const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeType;
        if (savedTheme === 'light' || savedTheme === 'dark') {
            this.setTheme(savedTheme, false);
        } else {
            this.setTheme('system', false);
        }
    }

    public toggleTheme() {
        const current = this.currentTheme();
        if (current === 'system') {
            const isOsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            // If OS is dark, toggle to light. If OS is light, toggle to dark
            this.setTheme(isOsDark ? 'light' : 'dark');
        } else if (current === 'light') {
            this.setTheme('dark');
        } else {
            this.setTheme('system'); // Third toggle goes back to system
        }
    }

    public setTheme(theme: ThemeType, save: boolean = true) {
        this.currentTheme.set(theme);
        if (save) {
            localStorage.setItem(this.THEME_KEY, theme);
        }
        this.applyTheme(theme);
    }

    private applyTheme(theme: ThemeType) {
        // Remove both explicit classes first
        document.documentElement.classList.remove('light-mode', 'dark-mode');

        let isDark = false;

        if (theme === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            // When system, we just don't add classes usually, but we need to tell PrimeNG .dark-mode if system is dark
            if (isDark) {
                document.documentElement.classList.add('dark-mode');
            }
        } else if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            isDark = true;
        } else if (theme === 'light') {
            document.documentElement.classList.add('light-mode');
            isDark = false;
        }

        this.isDarkActive.set(isDark);
    }
}
