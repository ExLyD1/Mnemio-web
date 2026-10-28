/** vue-i18n indexes for three Ukrainian forms: one | few | many. */
export const ukPluralRule = (choice: number): number => {
    const n = Math.abs(choice);
    if (!Number.isInteger(n)) {
        return 2;
    }
    const last = n % 10;
    const lastTwo = n % 100;
    if (last === 1 && lastTwo !== 11) {
        return 0;
    }
    return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 1 : 2;
};
