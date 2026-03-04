export const buildDefaultInvitationMessage = (triggerWord: string): string => {
    const normalizedTriggerWord = triggerWord.trim();

    if (normalizedTriggerWord.length === 0) {
        return '';
    }

    return `Reply with ${normalizedTriggerWord} to participate.`;
};

export const getCurrentDateTimeLocalValue = (): string => {
    const now = new Date();
    const timezoneOffsetInMs = now.getTimezoneOffset() * 60 * 1000;
    const localDateTime = new Date(now.getTime() - timezoneOffsetInMs);

    return localDateTime.toISOString().slice(0, 16);
};
