// Global translation state
let translations: Record<string, any> = {};

// Translation function with nested object support
export function t(key: string): string {
  // First try to get the flattened key directly
  if (key in translations) {
    const value = translations[key];
    if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object' && 'String' in value) {
      return value.String;
    }
  }
  
  // If not found, try nested approach
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.log(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  if (typeof value === 'string') {
    return value;
  } else if (value && typeof value === 'object' && 'String' in value) {
    return value.String;
  }
  
  return key;
}

// Set translations data
export function setTranslations(newTranslations: Record<string, any>) {
  translations = newTranslations;
}

// Update UI texts with translations
export function updateUITexts(): void {
  console.log('Updating UI texts...');
  
  // Update elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (element.tagName === 'INPUT' && element.getAttribute('type') === 'text') {
        (element as HTMLInputElement).placeholder = translated;
      } else {
        element.textContent = translated;
      }
    }
  });
}