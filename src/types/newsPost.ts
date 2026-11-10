export type DesignTemplate = 'design1' | 'design2';

export interface NewsPostData {
  template: DesignTemplate;
  // Image
  newsImage: string;
  imageZoom: number;
  imageOffsetX: number;
  imageOffsetY: number;
  // Logo
  logoUrl: string;
  logoSize: number;
  // Date
  date: string;
  dateSize: number;
  showDate: boolean;
  // Typography
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  textOffsetY: number;
  // Design 1 content
  subtitle: string;
  subtitleSize: number;
  subtitleColor: string;
  headline: string;
  headlineSize: number;
  headlineColor: string;
  headlineHighlightColor: string;
  highlightText: string;
  // Design 2 specific content
  statementQuote: string;
  quoteSpeaker: string;
  quoteDesignation: string;
  quoteHighlight: string;
  quoteFontSize: number;
  // Footer & buttons
  buttonText: string;
  showButton: boolean;
  socialHandle: string;
  showSocials: boolean;
}

export const DEFAULT_LOGO_URL = '/public/assets/aistudio/file_000000006efc8208857a7d5d8ee056f1_81ef7034.png';
export const SAMPLE_IMAGE_1 = '/src/assets/images/news_press_event_1794326091409.jpg';
export const SAMPLE_IMAGE_2 = '/src/assets/images/news_speaker_portrait_1794326091460.jpg';

export const FONT_OPTIONS = [
  { id: 'Anek Bangla', name: 'অনেক বাংলা (Anek Bangla - TV News Bold)', styleClass: 'font-anek' },
  { id: 'Hind Siliguri', name: 'হিন্দ শিলিগুড়ি (Hind Siliguri)', styleClass: 'font-hind' },
  { id: 'Noto Sans Bengali', name: 'নোটো সান্স (Noto Sans)', styleClass: 'font-noto' },
  { id: 'Tiro Bangla', name: 'তিরো বাংলা (Tiro Bangla - Editorial)', styleClass: 'font-tiro' },
  { id: 'Mina', name: 'মিনা (Mina)', styleClass: 'font-mina' },
];
