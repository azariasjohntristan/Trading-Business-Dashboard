const STORAGE_KEY = 'day_screenshot_links';

function getAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getDayScreenshotLink(date: string): string | null {
  return getAll()[date] || null;
}

export function setDayScreenshotLink(date: string, url: string | null) {
  const all = getAll();
  if (url) {
    all[date] = url;
  } else {
    delete all[date];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
