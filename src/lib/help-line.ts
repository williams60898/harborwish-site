// Owner-approved help line (988 / findahelpline.com). One source for the animal pages' crisis
// section and the /test/ safety block. Kept in its own module so on-demand pages can use it
// without importing the content collection.

const externalLink = (href: string, text: string) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

/** Owner-approved help line, shown as the last paragraph of the crisis section. */
export const HELP_LINE_HTML =
  '<p class="help-line">If this section sounds like where you are right now, please don’t carry it alone. ' +
  `In the US, call or text ${externalLink('https://988lifeline.org', '988')}. ` +
  `Anywhere else, ${externalLink('https://findahelpline.com', 'findahelpline.com')} will show you a helpline in your country.</p>`;
