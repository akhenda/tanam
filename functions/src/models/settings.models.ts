export interface ISiteInformation {
  id: string;
  title: string;
  theme: string;
  defaultLanguage: string;
  languages: string[];
  isCustomDomain?: boolean;
  primaryDomain: string;
  domains: string[];
  analytics: string;
}

export class SiteInformation implements ISiteInformation {
  readonly id: string;
  title: string;
  theme: string;
  defaultLanguage: string;
  languages: string[];
  isCustomDomain: boolean;
  primaryDomain: string;
  domains: string[];
  analytics: string;

  constructor(json: ISiteInformation) {
    this.id = json.id;
    this.title = json.title || json.id;
    this.theme = json.theme || 'default';
    this.defaultLanguage = json.defaultLanguage || 'en';
    this.languages = !!json.languages ? json.languages.slice() : [this.defaultLanguage];
    this.isCustomDomain = json.isCustomDomain === true;
    this.domains = !!json.domains ? json.domains.slice() : [json.primaryDomain];
    this.primaryDomain = json.primaryDomain || this.domains[0];
    this.analytics = json.analytics;
  }

  toJson() {
    return {
      id: this.id,
      title: this.title || null,
      theme: this.theme,
      defaultLanguage: this.defaultLanguage,
      languages: this.languages.slice(),
      primaryDomain: this.primaryDomain || null,
      domains: this.domains.slice().filter(x => !!x),
      analytics: this.analytics || null,
    } as ISiteInformation;
  }

  toString() {
    return `${SiteInformation.name}(${this.id})`;
  }
}
