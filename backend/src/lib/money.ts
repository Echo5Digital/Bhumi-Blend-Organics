// Money is worked out in paise (whole numbers) so 0.1 + 0.2 style rounding
// never creeps into a total; the database and the API speak rupees.

export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const fromPaise = (paise: number) => paise / 100;
