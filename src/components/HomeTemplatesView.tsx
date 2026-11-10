import React from 'react';
import { DesignTemplate, DEFAULT_LOGO_URL, SAMPLE_IMAGE_1, SAMPLE_IMAGE_2 } from '../types/newsPost';
import { Sparkles, Image as ImageIcon, MessageSquareQuote, CheckCircle2, Download, ShieldCheck, ArrowRight } from 'lucide-react';

interface HomeTemplatesViewProps {
  onSelectTemplate: (template: DesignTemplate) => void;
  customLogoUrl: string;
}

export const HomeTemplatesView: React.FC<HomeTemplatesViewProps> = ({
  onSelectTemplate,
  customLogoUrl,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Brand Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={customLogoUrl || DEFAULT_LOGO_URL}
              alt="JONOMANCH Logo"
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 block">
                অফিসিয়াল নিউজ পোস্ট মেকার
              </span>
              <span className="text-sm font-medium text-slate-600">
                সত্যের পাশে, মানুষের জন্য
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
              1080 × 1350 Pixel • No Watermark
            </span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="py-10 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-red-600" />
          ফেসবুক নিউজ পেজের জন্য প্রফেশনাল ডিজাইন এডিটর
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-hind">
          জনমঞ্চ <span className="text-red-600">নিউজ পোস্ট এডিটর</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-hind">
          পছন্দের ডিজাইন নির্বাচন করে আপনার ছবি ও শিরোনাম দিয়ে মাত্র কয়েকটি ক্লিকেই তৈরি করুন
          টেলিভিশন ও শীর্ষ সংবাদমাধ্যমের মতো আকর্ষণীয় ব্রেকিং ও কোট পোস্ট।
        </p>

        {/* Feature Highlights Strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">এইচডি এক্সপোর্ট</div>
              <div className="text-[11px] text-slate-500">1080 × 1350 px</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">ওয়াটারমার্ক মুক্ত</div>
              <div className="text-[11px] text-slate-500">১০০% সম্পূর্ণ ফ্রি</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">ছবি জুম ও প্যান</div>
              <div className="text-[11px] text-slate-500">ড্র্যাগ করে পজিশন</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">বাংলা প্রিমিয়াম ফন্ট</div>
              <div className="text-[11px] text-slate-500">হিন্দ, অনেক, নোটো</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Templates Selection Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 font-hind">
            যেকোনো একটি ডিজাইন নির্বাচন করুন
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-hind">
            রেফারেন্স অনুযায়ী নির্ধারিত দুটি ডিজাইন। পরবর্তীতে এডিটরেও ডিজাইন বদলানো যাবে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Design 1 (Photo News) */}
          <div
            onClick={() => onSelectTemplate('design1')}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-red-600 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden cursor-pointer flex flex-col"
          >
            {/* Top Badge */}
            <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  ১
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg font-hind">
                    ডিজাইন ১: ব্রেকিং ও ফটো নিউজ
                  </h3>
                  <p className="text-xs text-slate-500">
                    ইভেন্ট, সম্মেলন ও সংবাদ ছবির পোস্ট
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                জনপ্রিয় ফরম্যাট
              </span>
            </div>

            {/* Visual Mockup Preview */}
            <div className="p-6 bg-slate-100/70 flex justify-center items-center grow">
              <div className="w-64 aspect-[4/5] bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col transform group-hover:scale-[1.02] transition-transform duration-300 relative">
                {/* Header Mockup */}
                <div className="h-9 bg-white px-2.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[7px] text-white font-bold">
                      JM
                    </div>
                    <span className="text-[9px] font-black text-slate-800 tracking-tight">JONOMANCH</span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-medium">📅 আজকের তারিখ</span>
                </div>

                {/* News Image Mockup */}
                <div className="relative grow bg-slate-800 overflow-hidden">
                  <img
                    src={SAMPLE_IMAGE_1}
                    alt="News Photo Preview"
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  {/* Red Wave Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-red-900 via-red-700 to-transparent flex flex-col justify-end p-2.5">
                    <div className="text-[8px] font-bold text-yellow-300 uppercase">লালবাগ থেকে</div>
                    <div className="text-[11px] font-black text-white leading-tight font-hind line-clamp-2">
                      নি/ষিদ্ধ যুবলীগ ও স্বেচ্ছাসেবক লীগের ২ নেতা গ্রেফতার
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[7px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full border border-white/50">
                        বিস্তারিত কমেন্টে... ›
                      </span>
                      <span className="text-[7px] text-white/80 font-mono">/Jonomanch</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Button */}
            <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
              <ul className="text-xs text-slate-600 space-y-1 font-hind">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  উপরে সাদা হেডারে লোগো ও তারিখ
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  মাঝখানে বড় সংবাদ ছবি
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  নিচে আকর্ষণীয় লাল হেডলাইন ব্যাকড্রপ
                </li>
              </ul>

              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs group-hover:bg-red-700 transition-colors shrink-0"
              >
                এডিটর খুলুন
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Design 2 (Quote / Statement Post) */}
          <div
            onClick={() => onSelectTemplate('design2')}
            className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-red-600 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden cursor-pointer flex flex-col"
          >
            {/* Top Badge */}
            <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  ২
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg font-hind">
                    ডিজাইন ২: বক্তব্য ও কোট নিউজ
                  </h3>
                  <p className="text-xs text-slate-500">
                    বিবৃতি, গুরুত্বপূর্ণ উক্তি ও বক্তার পোস্ট
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                সম্পাদকীয় ফরম্যাট
              </span>
            </div>

            {/* Visual Mockup Preview */}
            <div className="p-6 bg-slate-100/70 flex justify-center items-center grow">
              <div className="w-64 aspect-[4/5] bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col transform group-hover:scale-[1.02] transition-transform duration-300 relative">
                {/* Header Mockup */}
                <div className="h-9 bg-white px-2.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[7px] text-white font-bold">
                      JM
                    </div>
                    <span className="text-[9px] font-black text-slate-800 tracking-tight">JONOMANCH</span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-medium">📅 আজকের তারিখ</span>
                </div>

                {/* Split Body Mockup */}
                <div className="grow relative flex bg-white overflow-hidden">
                  {/* Left Quote */}
                  <div className="w-[58%] p-2.5 flex flex-col justify-start">
                    <span className="text-red-600 text-2xl font-serif leading-none">❝</span>
                    <p className="text-[9px] text-slate-800 font-hind leading-tight mt-1 line-clamp-4">
                      সে কারণে বাংলাদেশ সরকার তার <span className="font-bold text-red-600">পাসপোর্ট বাতিল করেছে</span>। কোনো এখতিয়ার নেই পাসপোর্ট দেওয়ার।
                    </p>
                    <div className="mt-auto pb-6">
                      <div className="text-[9px] font-bold text-slate-900 font-hind">আনিসুল ইসলাম</div>
                      <div className="text-[7.5px] text-slate-500 font-hind">চিফ প্রসিকিউটর</div>
                    </div>
                  </div>

                  {/* Right Portrait */}
                  <div className="w-[42%] bg-slate-100 relative overflow-hidden">
                    <img
                      src={SAMPLE_IMAGE_2}
                      alt="Speaker Portrait Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Red Wave Footer */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-r from-red-700 to-red-900 flex items-center justify-between px-2.5 text-white">
                    <div className="leading-tight">
                      <span className="text-[9px] font-bold font-hind block">জনমঞ্চ</span>
                      <span className="text-[6.5px] opacity-80 font-hind">সত্যের পাশে, মানুষের জন্য</span>
                    </div>
                    <span className="text-[7px] opacity-90 font-medium">বিস্তারিত কমেন্টে... ›</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Button */}
            <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
              <ul className="text-xs text-slate-600 space-y-1 font-hind">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  সাদা পরিষ্কার ব্যাকগ্রাউন্ড ও লাল কোট মার্ক
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  বামে স্পষ্ট উক্তি, ডানে বক্তার ছবি
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  নিচে আকর্ষণীয় লাল রিবন ফুটার
                </li>
              </ul>

              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs group-hover:bg-red-700 transition-colors shrink-0"
              >
                এডিটর খুলুন
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
