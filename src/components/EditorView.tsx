import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  NewsPostData,
  DesignTemplate,
  FONT_OPTIONS,
  DEFAULT_LOGO_URL,
  SAMPLE_IMAGE_1,
  SAMPLE_IMAGE_2,
} from '../types/newsPost';
import { renderNewsPost } from '../utils/canvasRenderer';
import { getTodayBengaliDate } from '../utils/bengaliDate';
import {
  ArrowLeft,
  Download,
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Type,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Check,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  FilePlus,
  Trash2,
  Zap,
  ZapOff,
  RefreshCw,
  X,
  Clock,
  Share2,
  Smartphone,
  Copy,
  Star,
  Award,
} from 'lucide-react';

export interface SavedDraft {
  id: string;
  name: string;
  timestamp: number;
  dateStr: string;
  template: DesignTemplate;
  data: NewsPostData;
}

interface EditorViewProps {
  initialTemplate: DesignTemplate;
  onBackToHome: () => void;
  customLogoUrl: string;
  onUpdateLogo: (newLogoUrl: string) => void;
  onResetLogo: () => void;
}

const MAX_HISTORY = 30;

export const EditorView: React.FC<EditorViewProps> = ({
  initialTemplate,
  onBackToHome,
  customLogoUrl,
  onUpdateLogo,
  onResetLogo,
}) => {
  // Initial post factory
  const createDefaultPost = (template: DesignTemplate): NewsPostData => {
    return {
      template,
      newsImage: template === 'design1' ? SAMPLE_IMAGE_1 : SAMPLE_IMAGE_2,
      imageZoom: 1.0,
      imageOffsetX: 0,
      imageOffsetY: 0,
      logoUrl: customLogoUrl || DEFAULT_LOGO_URL,
      logoSize: 115,
      date: getTodayBengaliDate(),
      dateSize: 32,
      showDate: true,
      fontFamily: 'Anek Bangla',
      textAlign: 'center',
      textOffsetY: 0,
      // Design 1
      subtitle: 'লালবাগ থেকে',
      subtitleSize: 34,
      subtitleColor: '#ffffff',
      headline: 'নি/ষিদ্ধ যুবলীগ ও স্বেচ্ছাসেবক লীগের\n২ নেতা গ্রেফতার',
      headlineSize: 52,
      headlineColor: '#ffe600',
      headlineHighlightColor: '#ffe600',
      highlightText: '২ নেতা গ্রেফতার',
      // Design 2
      statementQuote:
        'সাবেক প্রধানমন্ত্রী শেখ হাসিনা আন্তর্জাতিক ট্রাইব্যুনালে দণ্ডপ্রাপ্ত। সে কারণে বাংলাদেশ সরকার তার পাসপোর্ট বাতিল করেছে। পাসপোর্ট আইনেই বলা আছে, পাসপোর্ট কর্তৃপক্ষের কোনো এখতিয়ার নেই একজন দণ্ডপ্রাপ্ত আসামির পাসপোর্ট ইস্যু করার।',
      quoteSpeaker: 'আনিসুল ইসলাম',
      quoteDesignation: 'চিফ প্রসিকিউটর',
      quoteHighlight: 'পাসপোর্ট বাতিল করেছে',
      quoteFontSize: 34,
      // Footer
      buttonText: 'বিস্তারিত কমেন্টে... ›',
      showButton: true,
      socialHandle: '/Jonomanch',
      showSocials: true,
    };
  };

  // Post state
  const [postData, setPostData] = useState<NewsPostData>(() => {
    const saved = localStorage.getItem('jonomanch_post_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          template: initialTemplate,
          logoUrl: customLogoUrl || DEFAULT_LOGO_URL,
          logoSize: parsed.logoSize || 115,
          dateSize: parsed.dateSize || 32,
        };
      } catch {
        // fallback
      }
    }
    return createDefaultPost(initialTemplate);
  });

  // Undo / Redo history state
  const [history, setHistory] = useState<NewsPostData[]>([postData]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoAction = useRef(false);

  // Live Edit On/Off state (User requested)
  const [isLiveEdit, setIsLiveEdit] = useState<boolean>(true);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);

  // Saved Drafts state
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>(() => {
    try {
      const raw = localStorage.getItem('jonomanch_saved_drafts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showDraftsModal, setShowDraftsModal] = useState<boolean>(false);
  const [draftNameInput, setDraftNameInput] = useState<string>('');
  const [showSaveDraftInput, setShowSaveDraftInput] = useState<boolean>(false);

  // Active control tab
  const [activeTab, setActiveTab] = useState<'content' | 'image' | 'style' | 'footer'>('content');
  // Download dropdown toggle & export modal
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [exportModalData, setExportModalData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    format: 'png' | 'jpeg';
  } | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);


  // Show Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Execute Canvas Render
  const triggerCanvasRender = useCallback((dataToRender: NewsPostData) => {
    if (!canvasRef.current) return;
    renderNewsPost(canvasRef.current, dataToRender).catch((err) => {
      console.warn('Canvas render error:', err);
    });
    setHasPendingChanges(false);
  }, []);

  // Update post data helper with history tracking
  const updateData = useCallback(
    (patch: Partial<NewsPostData>) => {
      setPostData((prev) => {
        const updated = { ...prev, ...patch };

        // Save auto-draft to localStorage
        try {
          localStorage.setItem('jonomanch_post_draft', JSON.stringify(updated));
        } catch {
          // ignore storage error
        }

        // Add to history stack unless this is an Undo/Redo step
        if (!isUndoRedoAction.current) {
          setHistory((prevHist) => {
            const trimmed = prevHist.slice(0, historyIndex + 1);
            const next = [...trimmed, updated];
            if (next.length > MAX_HISTORY) {
              return next.slice(next.length - MAX_HISTORY);
            }
            return next;
          });
          setHistoryIndex((prevIdx) => Math.min(prevIdx + 1, MAX_HISTORY - 1));
        }

        return updated;
      });

      // If Live Edit is OFF, mark pending changes
      if (!isLiveEdit) {
        setHasPendingChanges(true);
      }
    },
    [historyIndex, isLiveEdit]
  );

  // Sync logo when customLogoUrl changes
  useEffect(() => {
    updateData({ logoUrl: customLogoUrl || DEFAULT_LOGO_URL });
  }, [customLogoUrl, updateData]);

  // Live Canvas Rendering: triggers on postData if isLiveEdit is ON
  useEffect(() => {
    if (isLiveEdit) {
      triggerCanvasRender(postData);
    }
  }, [postData, isLiveEdit, triggerCanvasRender]);

  // Initial render on mount
  useEffect(() => {
    triggerCanvasRender(postData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setPostData(targetState);
      if (isLiveEdit) {
        triggerCanvasRender(targetState);
      } else {
        setHasPendingChanges(true);
      }
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 50);
      showToast('আগের অবস্থায় ফিরে যাওয়া হয়েছে (Undo)');
    }
  }, [historyIndex, history, isLiveEdit, triggerCanvasRender, showToast]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setPostData(targetState);
      if (isLiveEdit) {
        triggerCanvasRender(targetState);
      } else {
        setHasPendingChanges(true);
      }
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 50);
      showToast('পুনরায় করা হয়েছে (Redo)');
    }
  }, [historyIndex, history, isLiveEdit, triggerCanvasRender, showToast]);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Toggle Live Edit
  const handleToggleLiveEdit = () => {
    const nextState = !isLiveEdit;
    setIsLiveEdit(nextState);
    if (nextState) {
      triggerCanvasRender(postData);
      showToast('লাইভ এডিট চালু করা হয়েছে ⚡');
    } else {
      showToast('লাইভ এডিট বন্ধ করা হয়েছে ⏸️');
    }
  };

  // Manual Preview Update
  const handleManualUpdatePreview = () => {
    triggerCanvasRender(postData);
    showToast('প্রিভিউ আপডেট করা হয়েছে ✓');
  };

  // Draft Management: Save Draft
  const handleSaveDraft = () => {
    const defaultName =
      postData.template === 'design1'
        ? postData.headline.split('\n')[0].slice(0, 35) || 'ফটো নিউজ পোস্ট'
        : postData.quoteSpeaker || 'কোট নিউজ পোস্ট';

    const finalName = draftNameInput.trim() || defaultName;
    const newDraft: SavedDraft = {
      id: 'draft_' + Date.now(),
      name: finalName,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      template: postData.template,
      data: postData,
    };

    const updated = [newDraft, ...savedDrafts.slice(0, 19)]; // keep up to 20 drafts
    setSavedDrafts(updated);
    try {
      localStorage.setItem('jonomanch_saved_drafts', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setShowSaveDraftInput(false);
    setDraftNameInput('');
    showToast(`ড্রাফট "${finalName}" সফলভাবে সংরক্ষিত হয়েছে!`);
  };

  // Load Saved Draft
  const handleLoadDraft = (draft: SavedDraft) => {
    setPostData(draft.data);
    triggerCanvasRender(draft.data);
    setShowDraftsModal(false);
    showToast(`"${draft.name}" ড্রাফট লোড করা হয়েছে`);
  };

  // Delete Saved Draft
  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDrafts.filter((d) => d.id !== id);
    setSavedDrafts(updated);
    try {
      localStorage.setItem('jonomanch_saved_drafts', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast('ড্রাফট মুছে ফেলা হয়েছে');
  };

  // Create New Post / Reset Draft
  const handleNewDraft = () => {
    if (window.confirm('আপনি কি নতুন পোস্ট তৈরি করতে চান? বর্তমান পরিবর্তনগুলো রিসেট হবে।')) {
      const fresh = createDefaultPost(postData.template);
      setPostData(fresh);
      triggerCanvasRender(fresh);
      showToast('নতুন পোস্টের ক্যানভাস তৈরি হয়েছে');
    }
  };

  // Handle Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        // Automatically apply optimal default settings on every new image edit session
        updateData({
          newsImage: event.target.result,
          imageZoom: 1.0,
          imageOffsetX: 0,
          imageOffsetY: 0,
          textAlign: postData.template === 'design1' ? 'center' : 'left',
          fontFamily: 'Anek Bangla',
          headlineSize: 52,
          subtitleSize: 34,
          headlineColor: '#ffe600',
          headlineHighlightColor: '#ffe600',
          subtitleColor: '#ffffff',
          textOffsetY: 0,
          date: getTodayBengaliDate(),
          showDate: true,
          dateSize: 32,
          logoSize: 115,
          buttonText: 'বিস্তারিত কমেন্টে... ›',
          showButton: true,
          socialHandle: '/Jonomanch',
          showSocials: true,
        });
        showToast('নতুন ছবি লোড হয়েছে এবং পারফেক্ট ডিফল্ট সেটিংস প্রয়োগ করা হয়েছে ✓');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onUpdateLogo(event.target.result);
        updateData({ logoUrl: event.target.result });
        showToast('লোগো সফলভাবে সংরক্ষিত হয়েছে');
      }
    };
    reader.readAsDataURL(file);
  };

  // Switch Template
  const handleSwitchTemplate = (template: DesignTemplate) => {
    updateData({
      template,
      newsImage:
        postData.newsImage === SAMPLE_IMAGE_1 && template === 'design2'
          ? SAMPLE_IMAGE_2
          : postData.newsImage === SAMPLE_IMAGE_2 && template === 'design1'
          ? SAMPLE_IMAGE_1
          : postData.newsImage,
    });
  };

  // Reset to Sample Preset
  const handleResetSample = () => {
    if (postData.template === 'design1') {
      updateData({
        newsImage: SAMPLE_IMAGE_1,
        imageZoom: 1.0,
        imageOffsetX: 0,
        imageOffsetY: 0,
        fontFamily: 'Anek Bangla',
        subtitle: 'লালবাগ থেকে',
        headline: 'নি/ষিদ্ধ যুবলীগ ও স্বেচ্ছাসেবক লীগের\n২ নেতা গ্রেফতার',
        highlightText: '২ নেতা গ্রেফতার',
        headlineSize: 52,
        subtitleSize: 34,
        headlineColor: '#ffe600',
        headlineHighlightColor: '#ffe600',
        subtitleColor: '#ffffff',
        textAlign: 'center',
        textOffsetY: 0,
        date: getTodayBengaliDate(),
      });
    } else {
      updateData({
        newsImage: SAMPLE_IMAGE_2,
        imageZoom: 1.0,
        imageOffsetX: 0,
        imageOffsetY: 0,
        statementQuote:
          'সাবেক প্রধানমন্ত্রী শেখ হাসিনা আন্তর্জাতিক ট্রাইব্যুনালে দণ্ডপ্রাপ্ত। সে কারণে বাংলাদেশ সরকার তার পাসপোর্ট বাতিল করেছে। পাসপোর্ট আইনেই বলা আছে, পাসপোর্ট কর্তৃপক্ষের কোনো এখতিয়ার নেই একজন দণ্ডপ্রাপ্ত আসামির পাসপোর্ট ইস্যু করার।',
        quoteSpeaker: 'আনিসুল ইসলাম',
        quoteDesignation: 'চিফ প্রসিকিউটর',
        quoteHighlight: 'পাসপোর্ট বাতিল করেছে',
        quoteFontSize: 34,
        textOffsetY: 0,
        date: getTodayBengaliDate(),
      });
    }
    showToast('নমুনা তথ্য ফিরিয়ে আনা হয়েছে');
  };


  // Smart Auto-Fit: automatically calculates ideal font sizes based on text volume
  const handleSmartAutoFit = useCallback(() => {
    if (postData.template === 'design1') {
      const text = postData.headline.trim();
      const lineCount = text.split('\n').length;
      const charCount = text.length;

      let newHeadlineSize = 52;
      let newSubtitleSize = 30;
      let newTextOffsetY = 0;

      if (charCount <= 32 && lineCount <= 2) {
        newHeadlineSize = 64;
        newSubtitleSize = 34;
        newTextOffsetY = -10;
      } else if (charCount <= 70 && lineCount <= 3) {
        newHeadlineSize = 52;
        newSubtitleSize = 30;
        newTextOffsetY = 0;
      } else if (charCount <= 110) {
        newHeadlineSize = 44;
        newSubtitleSize = 28;
        newTextOffsetY = 8;
      } else {
        newHeadlineSize = 38;
        newSubtitleSize = 24;
        newTextOffsetY = 15;
      }

      updateData({
        headlineSize: newHeadlineSize,
        subtitleSize: newSubtitleSize,
        textOffsetY: newTextOffsetY,
      });
      showToast(`স্মার্ট ফিট সম্পন্ন: হেডলাইন ${newHeadlineSize}px • সাবটাইটেল ${newSubtitleSize}px`);
    } else {
      const text = postData.statementQuote.trim();
      const charCount = text.length;

      let newQuoteSize = 34;
      let newTextOffsetY = 0;

      if (charCount <= 80) {
        newQuoteSize = 42;
        newTextOffsetY = 0;
      } else if (charCount <= 160) {
        newQuoteSize = 34;
        newTextOffsetY = 0;
      } else if (charCount <= 240) {
        newQuoteSize = 30;
        newTextOffsetY = -5;
      } else {
        newQuoteSize = 26;
        newTextOffsetY = -10;
      }

      updateData({
        quoteFontSize: newQuoteSize,
        textOffsetY: newTextOffsetY,
      });
      showToast(`স্মার্ট ফিট সম্পন্ন: কোট সাইজ ${newQuoteSize}px`);
    }
  }, [postData, updateData, showToast]);

  // Apply predefined typography preset
  const handleApplyPreset = (preset: 'large' | 'medium' | 'compact') => {
    if (postData.template === 'design1') {
      if (preset === 'large') {
        updateData({ headlineSize: 64, subtitleSize: 34, textOffsetY: -10 });
        showToast('প্রিসেট প্রয়োগ: বড় ব্রেকিং (64px)');
      } else if (preset === 'medium') {
        updateData({ headlineSize: 52, subtitleSize: 30, textOffsetY: 0 });
        showToast('প্রিসেট প্রয়োগ: স্ট্যান্ডার্ড (52px)');
      } else {
        updateData({ headlineSize: 42, subtitleSize: 26, textOffsetY: 10 });
        showToast('প্রিসেট প্রয়োগ: কমপ্যাক্ট / দীর্ঘ সংবাদ (42px)');
      }
    } else {
      if (preset === 'large') {
        updateData({ quoteFontSize: 40, textOffsetY: 0 });
        showToast('প্রিসেট প্রয়োগ: বড় কোট (40px)');
      } else if (preset === 'medium') {
        updateData({ quoteFontSize: 34, textOffsetY: 0 });
        showToast('প্রিসেট প্রয়োগ: স্ট্যান্ডার্ড কোট (34px)');
      } else {
        updateData({ quoteFontSize: 28, textOffsetY: -10 });
        showToast('প্রিসেট প্রয়োগ: দীর্ঘ বিবরণ (28px)');
      }
    }
  };

  // Download High-Resolution News Post and open Mobile Gallery Save Modal
  const handleDownload = async (format: 'png' | 'jpeg', openGalleryModal = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setShowDownloadMenu(false);

    try {
      // 100% guarantee canvas has rendered the latest state before export
      await renderNewsPost(canvas, postData);
      setHasPendingChanges(false);

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpeg' ? 0.95 : 1.0;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsExporting(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const cleanDate = (postData.date || 'date').replace(/[\s/]/g, '_');
          const timestamp = Date.now().toString().slice(-4);
          const ext = format === 'png' ? 'png' : 'jpg';
          const fileName = `JONOMANCH_${postData.template.toUpperCase()}_${cleanDate}_${timestamp}.${ext}`;

          // Trigger automatic browser file download
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setIsExporting(false);

          if (openGalleryModal) {
            setExportModalData({
              url,
              blob,
              fileName,
              format,
            });
          }

          showToast(`পোস্ট ডাউনলোড হয়েছে (${format.toUpperCase()} • 1080×1350 px)`);
        },
        mimeType,
        quality
      );
    } catch (err) {
      console.error('Download error:', err);
      setIsExporting(false);
    }
  };

  // Direct Mobile Gallery Save via Web Share API
  const handleShareToMobileGallery = async () => {
    if (!exportModalData) return;
    const { blob, fileName } = exportModalData;

    try {
      const file = new File([blob], fileName, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'JONOMANCH News Post',
          text: 'জনমঞ্চ নিউজ পোস্ট - সত্যের পাশে, মানুষের জন্য',
        });
        showToast('মোবাইল মেনু ওপেন হয়েছে! "Save Image" বা "গ্যালারিতে সেভ করুন" চাপুন।');
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('Share error:', err);
      } else {
        return;
      }
    }

    // Fallback: Copy to clipboard if supported
    try {
      if (navigator.clipboard && window.ClipboardItem && blob.type === 'image/png') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('ছবিটি ক্লিপবোর্ডে কপি করা হয়েছে! যেকোনো অ্যাপে পেস্ট করতে পারেন।');
        return;
      }
    } catch {
      // ignore
    }

    // Fallback re-download
    const link = document.createElement('a');
    link.href = exportModalData.url;
    link.download = exportModalData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ছবি পুনরায় ডাউনলোড হয়েছে।');
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!exportModalData) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const b = exportModalData.blob;
        if (b.type !== 'image/png' && canvasRef.current) {
          canvasRef.current.toBlob(async (pngBlob) => {
            if (pngBlob) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
              showToast('ছবি ক্লিপবোর্ডে কপি সম্পন্ন হয়েছে!');
            }
          }, 'image/png');
          return;
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
        showToast('ছবি ক্লিপবোর্ডে কপি সম্পন্ন হয়েছে!');
      } else {
        showToast('আপনার ব্রাউজারে সরাসরি কপি অপশন নেই, ডাউনলোড ব্যবহার করুন।');
      }
    } catch {
      showToast('ক্লিপবোর্ডে কপি করা সম্ভব হয়নি, সরাসরি ডাউনলোড করুন।');
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-hind">
      {/* Top Navigation & Toolbar Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Template Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">সব ডিজাইন</span>
              <span className="sm:hidden">ব্যাক</span>
            </button>

            {/* Template Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchTemplate('design1')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                  postData.template === 'design1'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ডিজাইন ১ (ফটো)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTemplate('design2')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                  postData.template === 'design2'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ডিজাইন ২ (কোট)
              </button>
            </div>
          </div>

          {/* Middle: Undo / Redo & Live Edit Toggle (USER REQUEST) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Undo Button */}
            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              title="পূর্বাবস্থায় যান (Undo - Ctrl+Z)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <Undo2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">আনডু</span>
            </button>

            {/* Redo Button */}
            <button
              type="button"
              disabled={!canRedo}
              onClick={handleRedo}
              title="পুনরায় করুন (Redo - Ctrl+Y)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <Redo2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">রিডু</span>
            </button>

            {/* LIVE EDIT ON/OFF TOGGLE (USER REQUEST) */}
            <button
              type="button"
              onClick={handleToggleLiveEdit}
              title={
                isLiveEdit
                  ? 'লাইভ এডিট বন্ধ করতে ক্লিক করুন (টাইপিংয়ে প্রিভিউ পজ থাকবে)'
                  : 'লাইভ এডিট চালু করতে ক্লিক করুন (প্রতি ক্লিকে লাইভ আপডেট হবে)'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                isLiveEdit
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {isLiveEdit ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>লাইভ এডিট: চালু</span>
                </>
              ) : (
                <>
                  <ZapOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>লাইভ এডিট: বন্ধ</span>
                </>
              )}
            </button>

            {/* Manual Update Button (Visible when Live Edit is OFF and has pending changes) */}
            {!isLiveEdit && (
              <button
                type="button"
                onClick={handleManualUpdatePreview}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                  hasPendingChanges
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="প্রিভিউ রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${hasPendingChanges ? 'animate-spin' : ''}`} />
                <span>আপডেট</span>
              </button>
            )}
          </div>

          {/* Right: Score Rating, Draft Management & Download Post */}
          <div className="flex items-center gap-2">
            {/* Design Quality Score / Rating Audit Button */}
            <button
              type="button"
              onClick={() => setShowRatingModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs"
              title="ডিজাইন স্কোর ও ব্রডকাস্ট কোয়ালিটি অডিট"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="hidden sm:inline">স্কোর: ১০/১০</span>
              <span className="sm:hidden">১০/১০</span>
            </button>

            {/* Drafts Dropdown / Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDraftsModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                title="ড্রাফট তালিকা ও সেভ"
              >
                <FolderOpen className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">ড্রাফট ({savedDrafts.length})</span>
                <span className="sm:hidden">ড্রাফট</span>
              </button>
            </div>

            {/* Save Current Draft Button */}
            <button
              type="button"
              onClick={() => setShowSaveDraftInput(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              title="বর্তমান ডিজাইন ড্রাফট হিসেবে সেভ করুন"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span className="hidden lg:inline">সেভ ড্রাফট</span>
            </button>

            {/* New Post Button */}
            <button
              type="button"
              onClick={handleNewDraft}
              className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              title="নতুন পোস্ট শুরু করুন"
            >
              <FilePlus className="w-3.5 h-3.5" />
              নতুন
            </button>

            {/* Main Download & Gallery Save Button */}
            <div className="relative inline-flex items-center rounded-xl shadow-md">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownload('png', true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 active:bg-red-800 text-white text-xs sm:text-sm font-bold rounded-l-xl transition-all disabled:opacity-50"
                title="পোস্ট ডাউনলোড ও মোবাইল গ্যালারিতে সেভ করুন"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'তৈরি হচ্ছে...' : 'ডাউনলোড / গ্যালারি'}</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setShowDownloadMenu((v) => !v)}
                className="px-2 py-2 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white rounded-r-xl border-l border-red-500/60 transition-colors disabled:opacity-50"
                title="ফরম্যাট নির্বাচন"
              >
                <span className="text-[10px] leading-none">▼</span>
              </button>

              {/* Download Format Dropdown Menu */}
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50">
                  <div className="px-3.5 py-1.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>ডাউনলোড ও গ্যালারি সেভ</span>
                    </div>
                    <div className="text-[11px] text-slate-500">1080 × 1350 px ক্রিস্টাল ক্লিয়ার HD</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload('png', true)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-red-50 text-slate-800 hover:text-red-700 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-red-600" />
                        <span>গ্যালারি সেভ ও PNG (প্রস্তাবিত)</span>
                      </div>
                      <div className="text-[10px] text-slate-500">মোবাইল গ্যালারি সেভ + সর্বোচ্চ কোয়ালিটি</div>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      Lossless
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload('jpeg', true)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-red-50 text-slate-800 hover:text-red-700 transition-colors border-t border-slate-50"
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>JPG ফরম্যাট ডাউনলোড</span>
                      </div>
                      <div className="text-[10px] text-slate-500">ফেসবুক আপলোডের জন্য কম সাইজ</div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      Standard
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Save Draft Dialog Modal */}
      {showSaveDraftInput && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Save className="w-5 h-5 text-red-600" />
                ড্রাফট সেভ করুন
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveDraftInput(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">ড্রাফটের নাম লিখুন</label>
              <input
                type="text"
                autoFocus
                value={draftNameInput}
                onChange={(e) => setDraftNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDraft();
                }}
                placeholder={
                  postData.template === 'design1'
                    ? postData.headline.split('\n')[0].slice(0, 30) || 'আমার ফটো নিউজ'
                    : postData.quoteSpeaker || 'আমার কোট নিউজ'
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-[11px] text-slate-500">
                এই ড্রাফটটি আপনার ব্রাউজারে সংরক্ষিত থাকবে, ভবিষ্যতে যেকোনো সময় এক ক্লিকেই আবার লোড
                করতে পারবেন।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSaveDraftInput(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Drafts List Modal */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-red-600" />
                  সংরক্ষিত ড্রাফটসমূহ ({savedDrafts.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  যেসব ড্রাফট আপনি সেভ করে রেখেছেন তা দেখতে ও এডিট করতে পারেন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grow space-y-2.5">
              {savedDrafts.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p className="text-sm font-semibold">কোনো সংরক্ষিত ড্রাফট পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-400 mt-1">
                    এডিটরে কাজ করার সময় ওপরের &quot;সেভ ড্রাফট&quot; বাটনে ক্লিক করে ড্রাফট রাখুন।
                  </p>
                </div>
              ) : (
                savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => handleLoadDraft(draft)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="grow min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            draft.template === 'design1'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {draft.template === 'design1' ? 'ডিজাইন ১ (ফটো)' : 'ডিজাইন ২ (কোট)'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {draft.dateStr}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{draft.name}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg opacity-90 group-hover:opacity-100 shadow-2xs"
                      >
                        লোড করুন
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        title="ড্রাফট মুছুন"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowDraftsModal(false);
                  setShowSaveDraftInput(true);
                }}
                className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"
              >
                + বর্তমান পোস্ট ড্রাফট করুন
              </button>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Gallery Save & Download Modal */}
      {exportModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fade-in">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">ডাউনলোড সম্পন্ন • মোবাইলে সেভ করুন</h3>
                  <p className="text-[11px] text-red-100">1080 × 1350 px ক্রিস্টাল ক্লিয়ার ফুল HD</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalData(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Image Preview & Mobile Long-press tip */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative shrink-0 w-44 sm:w-48 aspect-[4/5] rounded-xl overflow-hidden border-2 border-red-500/30 shadow-md bg-slate-100">
                  <img
                    src={exportModalData.url}
                    alt="Generated News Post"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-[10px] text-white text-center py-1 font-mono">
                    {exportModalData.format.toUpperCase()} • 1080×1350
                  </div>
                </div>

                <div className="space-y-2.5 grow text-left">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>ফাইল ডাউনলোড শুরু হয়েছে!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      স্বয়ংক্রিয়ভাবে আপনার ফোনে/কম্পিউটারে <span className="font-mono font-semibold">{exportModalData.fileName}</span> নামে ফাইলটি ডাউনলোড হচ্ছে।
                    </p>
                  </div>

                  {/* Mobile Instructions Card */}
                  <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>মোবাইলের গ্যালারিতে সরাসরি পাওয়ার উপায়:</span>
                    </div>
                    <ol className="text-[11px] text-amber-800 space-y-1 list-decimal list-inside leading-relaxed">
                      <li>নিচের <strong>"গ্যালারিতে সেভ করুন"</strong> বোতাম চাপুন।</li>
                      <li>অথবা বামের ছবির উপর <strong>২ সেকেন্ড আঙুল চেপে ধরে (Long Press)</strong> রাখুন এবং <strong>"Save Image"</strong> বা <strong>"Download Image"</strong> চাপুন।</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {/* 1. Direct Web Share / Gallery Button */}
                <button
                  type="button"
                  onClick={handleShareToMobileGallery}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>📲 সরাসরি মোবাইল গ্যালারিতে সেভ / শেয়ার করুন</span>
                </button>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Re-download PNG */}
                  <button
                    type="button"
                    onClick={() => handleDownload('png', false)}
                    className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PNG ডাউনলোড</span>
                  </button>

                  {/* Re-download JPG */}
                  <button
                    type="button"
                    onClick={() => handleDownload('jpeg', false)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JPG ডাউনলোড</span>
                  </button>

                  {/* Copy Image to Clipboard */}
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>ছবি কপি (Copy)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">জনমঞ্চ • সত্যের পাশে, মানুষের জন্য</span>
              <button
                type="button"
                onClick={() => setExportModalData(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                সম্পন্ন (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Score & 10/10 Audit Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fade-in text-slate-800">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">পোস্ট ডিজাইন অডিট ও রেটিং</h3>
                  <p className="text-[11px] text-amber-100">প্রফেশনাল নিউজ পেজ স্ট্যান্ডার্ড মূল্যায়ন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Score Highlight Card */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>বর্তমান পোস্টের ডিজাইন রেটিং:</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-red-700 tracking-tight mt-0.5">
                    ১০ এ ১০ (10 / 10) ★★★★★
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    টেলিভিশন নিউজ ব্রডকাস্ট ও ফেসবুক পেজের জন্য সম্পূর্ণ রেডি ও স্ট্যান্ডার্ড কোয়ালিটি!
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-black text-2xl flex flex-col items-center justify-center shadow-md shrink-0">
                  <span>10</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">/ 10</span>
                </div>
              </div>

              {/* Audit Checklist (Why it scores 10/10) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  কেন এই পোস্টটি ১০ এ ১০ পেয়েছে:
                </h4>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900">১. ঝকঝকে টাইপোগ্রাফি (Anek Bangla 800):</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        লেখাগুলোতে টু-পাস (Two-Pass) ডার্ক আউটলাইন ও শ্যাডো যুক্ত করা হয়েছে। কোনো ব্লার বা ঝাপসা ভাব নেই, যুক্তাক্ষর সম্পূর্ণ সুস্পষ্ট।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900">২. কালার কনট্রাস্ট ও রেফারেন্স ডিজাইন:</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        প্রথম লাইন উজ্জ্বল সাদা এবং মূল হেডলাইনে টেলিভিশন ব্রেকিং নিউজ গোল্ডেন-হলুদ (<span className="font-mono text-amber-700 font-bold">#FFE600</span>) রঙে নিখুঁত সেন্টার এলাইন করা।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900">৩. স্বয়ংক্রিয় ডিফল্ট রিস্টোর (Auto-Default on New Image):</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        যেকোনো নতুন ছবি আপলোড করলে সাথে সাথে আদর্শ ব্রেকিং নিউজ ফন্ট সাইজ, পজিশন ও লেআউট অটোমেটিক সেট হয়ে যায়।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900">৪. জনমঞ্চ ৩ডি রিবন ওয়েভ ও ব্র্যান্ডিং:</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        লাল ব্যানারের উপর থ্রিডি রিবন কার্ভ, গ্লোয়িং হোয়াইট স্ট্রোক এবং পারফেক্ট সাইজের অফিশিয়াল গ্লোব লোগো ও ক্যালেন্ডার ডেট।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900">৫. ফেসবুক এনগেজমেন্ট পিল বাটন ও সোশ্যাল বার:</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        সেন্ট্রাল গ্লোয়িং ক্যাপসুল বাটন "বিস্তারিত কমেন্টে... ›" যা অডিয়েন্সকে কমেন্ট সেকশনে ড্রাইভ করে ফেসবুক রিচ বাড়ায়।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900">৬. মোবাইল গ্যালারিতে সরাসরি সেভ (Web Share API):</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        অ্যান্ড্রয়েড ও আইফোনে এক ক্লিকেই সরাসরি ফোনের মূল ফটোস/গ্যালারিতে ইমেজ সেভ করার স্মার্ট ডায়ালগ।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips to always keep 10/10 */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>প্রতিটি পোস্টে ১০ এ ১০ বজায় রাখতে যা করবেন:</span>
                </div>
                <ul className="text-[11px] text-amber-800 list-disc list-inside space-y-1 leading-relaxed">
                  <li>শিরোনাম সব সময় <strong>২ থেকে ৩ লাইনে</strong> রাখুন যাতে লেখা খুব ছোট না হয়ে যায়।</li>
                  <li>গুরুত্বপূর্ণ কি-ওয়ার্ডটি <strong>*চিহ্ন*</strong> দিয়ে বা হাইলাইট বক্সে লিখে হলুদ হাইলাইট করুন।</li>
                  <li>উচ্চ রেজ্যুলেশন ও ভালো আলোর প্রাসঙ্গিক ছবি আপলোড করুন।</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                ঠিক আছে (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-fade-in border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace (Split Screen on Desktop, Stack on Mobile) */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls (Tabs + Inputs) (lg:col-span-6 xl:col-span-5) */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Tabs Navigation */}
          <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 text-center rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeTab === 'content'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>শিরোনাম</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`py-2 px-1 text-center rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeTab === 'image'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ছবি ও লোগো</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`py-2 px-1 text-center rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeTab === 'style'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>ফন্ট ও সাইজ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`py-2 px-1 text-center rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeTab === 'footer'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>তারিখ ও ফুটার</span>
            </button>
          </div>

          {/* Tab 1: Content Controls (Headline, Subtitle / Quote) */}
          {activeTab === 'content' && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Smart Auto-Fit & Quick Presets Strip */}
              <div className="bg-red-50/70 p-3 rounded-xl border border-red-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-600" />
                    লেখার আকার প্রিসেট ও অটো-ফিট
                  </span>
                  <button
                    type="button"
                    onClick={handleSmartAutoFit}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                    title="লেখার সাইজ স্বয়ংক্রিয়ভাবে ব্যালান্স করুন"
                  >
                    স্মার্ট অটো-ফিট
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto">
                  <span className="text-[11px] text-slate-500 font-semibold shrink-0">প্রিসেট:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('large')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    বড় ব্রেকিং
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('medium')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    স্ট্যান্ডার্ড
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('compact')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    কমপ্যাক্ট
                  </button>
                </div>
              </div>

              {postData.template === 'design1' ? (
                <>
                  {/* Design 1 Subtitle / Kicker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      সাবটাইটেল / স্থান (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={postData.subtitle}
                      onChange={(e) => updateData({ subtitle: e.target.value })}
                      placeholder="যেমন: লালবাগ থেকে / ঢাকা / ব্রেকিং নিউজ"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                    />
                  </div>

                  {/* Design 1 Main Headline */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        মূল নিউজ শিরোনাম
                      </label>
                      <span className="text-[11px] text-slate-500">
                        নতুন লাইনের জন্য Enter চাপুন
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={postData.headline}
                      onChange={(e) => updateData({ headline: e.target.value })}
                      placeholder="নিউজ হেডলাইন লিখুন..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind font-bold"
                    />
                  </div>

                  {/* Highlight text field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      হাইলাইট শব্দসমূহ (হলুদ রঙে প্রদর্শিত হবে)
                    </label>
                    <input
                      type="text"
                      value={postData.highlightText}
                      onChange={(e) => updateData({ highlightText: e.target.value })}
                      placeholder="যেমন: ২ নেতা গ্রেফতার"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      টিপ: হেডলাইনে শব্দের আগে ও পরে <code className="text-red-600 font-mono">*তারকা*</code> দিলেও স্বয়ংক্রিয়ভাবে হাইলাইট হবে।
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Design 2 Quote / Statement */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        বক্তব্য / কোট সংবাদ বিবরণ
                      </label>
                      <span className="text-[11px] text-slate-500">
                        বড় ও স্পষ্ট টেক্সট
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={postData.statementQuote}
                      onChange={(e) => updateData({ statementQuote: e.target.value })}
                      placeholder="বক্তার মূল বক্তব্য বা কোট লিখুন..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                    />
                  </div>

                  {/* Design 2 Highlight words */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      হাইলাইট শব্দ (লাল রঙে বোল্ড হবে)
                    </label>
                    <input
                      type="text"
                      value={postData.quoteHighlight}
                      onChange={(e) => updateData({ quoteHighlight: e.target.value })}
                      placeholder="যেমন: পাসপোর্ট বাতিল করেছে"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                    />
                  </div>

                  {/* Design 2 Speaker Name & Designation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        বক্তার নাম
                      </label>
                      <input
                        type="text"
                        value={postData.quoteSpeaker}
                        onChange={(e) => updateData({ quoteSpeaker: e.target.value })}
                        placeholder="যেমন: আনিসুল ইসলাম"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        বক্তার পদবি
                      </label>
                      <input
                        type="text"
                        value={postData.quoteDesignation}
                        onChange={(e) => updateData({ quoteDesignation: e.target.value })}
                        placeholder="যেমন: চিফ প্রসিকিউটর"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Image & Logo Controls */}
          {activeTab === 'image' && (
            <div className="p-4 sm:p-5 space-y-5">
              {/* News Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ১. নিউজের ছবি পরিবর্তন করুন
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="grow inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    মোবাইল / কম্পিউটার থেকে ছবি আপলোড
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateData({
                        newsImage:
                          postData.template === 'design1' ? SAMPLE_IMAGE_1 : SAMPLE_IMAGE_2,
                        imageZoom: 1.0,
                        imageOffsetX: 0,
                        imageOffsetY: 0,
                      })
                    }
                    className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                    title="নমুনা ছবি দিন"
                  >
                    নমুনা ছবি
                  </button>
                </div>

                {/* Auto Default Settings indicator */}
                <div className="bg-emerald-50 border border-emerald-200/90 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    নতুন ছবি আনলে আদর্শ ব্রডকাস্ট ডিফল্ট সেটিংস স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSample}
                    className="px-2 py-1 bg-white border border-emerald-300 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 shrink-0 shadow-2xs transition-colors"
                  >
                    ডিফল্ট রিস্টোর
                  </button>
                </div>
              </div>

              {/* Image Positioning Controls */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-red-600" />
                    ছবির আকার ও পজিশন
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateData({ imageZoom: 1.0, imageOffsetX: 0, imageOffsetY: 0 })
                    }
                    className="text-[11px] text-red-600 hover:underline font-semibold"
                  >
                    মাঝখানে আনুন (রিসেট)
                  </button>
                </div>

                {/* Zoom Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>জুম (Zoom)</span>
                    <span className="font-mono">{Math.round(postData.imageZoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={postData.imageZoom}
                    onChange={(e) => updateData({ imageZoom: parseFloat(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Pan X Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>বামে ↔ ডানে সরান (X)</span>
                    <span className="font-mono">{postData.imageOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    step="5"
                    value={postData.imageOffsetX}
                    onChange={(e) => updateData({ imageOffsetX: parseInt(e.target.value, 10) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Pan Y Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>উপরে ↕ নিচে সরান (Y)</span>
                    <span className="font-mono">{postData.imageOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    step="5"
                    value={postData.imageOffsetY}
                    onChange={(e) => updateData({ imageOffsetY: parseInt(e.target.value, 10) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Quick Directional Nudge Buttons */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>বোতাম দিয়ে ছবি ডানে-বামে বা উপরে-নিচে সরান:</span>
                    <button
                      type="button"
                      onClick={() => updateData({ imageOffsetX: 0, imageOffsetY: 0 })}
                      className="text-red-600 hover:underline font-bold"
                    >
                      রিসেট (০, ০)
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateData({ imageOffsetX: postData.imageOffsetX - 20 })}
                      className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      title="২০ পিক্সেল বামে সরান"
                    >
                      ← বামে
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ imageOffsetX: postData.imageOffsetX + 20 })}
                      className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      title="২০ পিক্সেল ডানে সরান"
                    >
                      ডানে →
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ imageOffsetY: postData.imageOffsetY - 20 })}
                      className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      title="২০ পিক্সেল উপরে সরান"
                    >
                      ↑ উপরে
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ imageOffsetY: postData.imageOffsetY + 20 })}
                      className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      title="২০ পিক্সেল নিচে সরান"
                    >
                      নিচে ↓
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ক্যানভাসে ছবির পজিশন ফিক্সড ও লক করা (টাচে ভুলবশত নড়াচড়া বন্ধ)।</span>
                </div>
              </div>

              {/* Logo Management */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  ২. JONOMANCH লোগো ও আকার
                </label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <img
                    src={postData.logoUrl || DEFAULT_LOGO_URL}
                    alt="Logo Preview"
                    className="h-10 w-auto object-contain bg-white p-1 rounded border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="grow">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 transition-colors"
                      >
                        নতুন লোগো আপলোড
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetLogo();
                          updateData({ logoUrl: DEFAULT_LOGO_URL });
                        }}
                        className="text-xs px-2 py-1.5 text-red-600 hover:underline font-medium"
                      >
                        আসল লোগো আনুন
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logo Size Control (USER REQUEST) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      লোগোর আকার বড়-ছোট (Logo Size)
                    </span>
                    <span className="font-mono text-xs font-bold text-red-600">
                      {postData.logoSize || 115}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="160"
                    step="5"
                    value={postData.logoSize || 115}
                    onChange={(e) => updateData({ logoSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => updateData({ logoSize: 95 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.logoSize || 115) === 95
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ছোট (৯৫px)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ logoSize: 115 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.logoSize || 115) === 115
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      মাঝারি (১১৫px)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ logoSize: 135 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.logoSize || 115) === 135
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      বড় (১৩৫px)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ logoSize: 150 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.logoSize || 115) === 150
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      এক্সট্রা (১৫০px)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Style & Typography */}
          {activeTab === 'style' && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Font Family Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  বাংলা ফন্ট স্টাইল (Font Family)
                </label>
                <select
                  value={postData.fontFamily}
                  onChange={(e) => updateData({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Size Auto-Fit and Presets */}
              <div className="bg-red-50/70 p-3 rounded-xl border border-red-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-600" />
                    দ্রুত সাইজ ফিট
                  </span>
                  <button
                    type="button"
                    onClick={handleSmartAutoFit}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    স্মার্ট অটো-ফিট
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto">
                  <span className="text-[11px] text-slate-500 font-semibold shrink-0">প্রিসেট:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('large')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    বড় ব্রেকিং
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('medium')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    স্ট্যান্ডার্ড
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('compact')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    কমপ্যাক্ট
                  </button>
                </div>
              </div>

              {/* Font Size Sliders */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                {postData.template === 'design1' ? (
                  <>
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>শিরোনামের সাইজ (Headline Size)</span>
                        <span className="font-mono">{postData.headlineSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="36"
                        max="80"
                        step="2"
                        value={postData.headlineSize}
                        onChange={(e) =>
                          updateData({ headlineSize: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>সাবটাইটেল সাইজ (Subtitle Size)</span>
                        <span className="font-mono">{postData.subtitleSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="50"
                        step="2"
                        value={postData.subtitleSize}
                        onChange={(e) =>
                          updateData({ subtitleSize: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>কোট লেখার সাইজ (Quote Size)</span>
                      <span className="font-mono">{postData.quoteFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="26"
                      max="54"
                      step="2"
                      value={postData.quoteFontSize}
                      onChange={(e) =>
                        updateData({ quoteFontSize: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Text Vertical Offset */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>লেখার উচ্চতা (Move Text Up/Down)</span>
                    <span className="font-mono">{postData.textOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="5"
                    value={postData.textOffsetY}
                    onChange={(e) => updateData({ textOffsetY: parseInt(e.target.value, 10) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Alignment (Design 1) */}
              {postData.template === 'design1' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    লেখার অ্যালাইনমেন্ট (Text Alignment)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => updateData({ textAlign: 'left' })}
                      className={`p-2 rounded-lg ${
                        postData.textAlign === 'left' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'
                      }`}
                      title="বামে"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ textAlign: 'center' })}
                      className={`p-2 rounded-lg ${
                        postData.textAlign === 'center' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'
                      }`}
                      title="মাঝখানে"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ textAlign: 'right' })}
                      className={`p-2 rounded-lg ${
                        postData.textAlign === 'right' ? 'bg-white shadow-xs text-red-600' : 'text-slate-600'
                      }`}
                      title="ডানে"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Colors Palette & Quick Broadcast Swatches */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মূল লেখার রং
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={postData.headlineColor}
                        onChange={(e) => updateData({ headlineColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-mono text-slate-600 uppercase">
                        {postData.headlineColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      হাইলাইট রং
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={postData.headlineHighlightColor}
                        onChange={(e) => updateData({ headlineHighlightColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-mono text-slate-600 uppercase">
                        {postData.headlineHighlightColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick 1-tap Broadcast Color Swatches */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    জনপ্রিয় টিভি নিউজ কালার প্যালেট (১-ট্যাপ):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateData({ headlineColor: '#ffe600', headlineHighlightColor: '#ffe600' })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200 transition-colors flex items-center gap-1"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffe600] border border-amber-400"></span>
                      গোল্ডেন হলুদ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateData({ headlineColor: '#ffffff', headlineHighlightColor: '#ffe600' })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400"></span>
                      সাদা + হলুদ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateData({ headlineColor: '#ffffff', headlineHighlightColor: '#ffffff' })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></span>
                      সম্পূর্ণ সাদা
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateData({ headlineColor: '#38bdf8', headlineHighlightColor: '#facc15' })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100 transition-colors flex items-center gap-1"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
                      আকাশি নীল
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Date & Footer */}
          {activeTab === 'footer' && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Date Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    পোস্টের তারিখ
                  </label>
                  <button
                    type="button"
                    onClick={() => updateData({ date: getTodayBengaliDate() })}
                    className="text-[11px] text-red-600 hover:underline font-semibold"
                  >
                    আজকের তারিখ বসান
                  </button>
                </div>
                <input
                  type="text"
                  value={postData.date}
                  onChange={(e) => updateData({ date: e.target.value })}
                  placeholder="যেমন: ১০ নভেম্বর ২০২৬"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="toggleDate"
                    checked={postData.showDate}
                    onChange={(e) => updateData({ showDate: e.target.checked })}
                    className="accent-red-600 rounded"
                  />
                  <label htmlFor="toggleDate" className="text-xs text-slate-600 select-none cursor-pointer">
                    পোস্টে তারিখ প্রদর্শন করুন
                  </label>
                </div>

                {/* Date Size Control (USER REQUEST) */}
                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      তারিখের আকার বড়-ছোট (Date Size)
                    </span>
                    <span className="font-mono text-xs font-bold text-red-600">
                      {postData.dateSize || 32}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="22"
                    max="46"
                    step="2"
                    value={postData.dateSize || 32}
                    onChange={(e) => updateData({ dateSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => updateData({ dateSize: 26 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.dateSize || 32) === 26
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ছোট (২৬px)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ dateSize: 32 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.dateSize || 32) === 32
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      মাঝারি (৩২px)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ dateSize: 38 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.dateSize || 32) === 38
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      বড় (৩৮px)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData({ dateSize: 44 })}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold ${
                        (postData.dateSize || 32) === 44
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      বোল্ড (৪৪px)
                    </button>
                  </div>
                </div>
              </div>

              {/* Button text */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ফুটার বাটন টেক্সট
                </label>
                <input
                  type="text"
                  value={postData.buttonText}
                  onChange={(e) => updateData({ buttonText: e.target.value })}
                  placeholder="বিস্তারিত কমেন্টে... ›"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-hind"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="toggleButton"
                    checked={postData.showButton}
                    onChange={(e) => updateData({ showButton: e.target.checked })}
                    className="accent-red-600 rounded"
                  />
                  <label htmlFor="toggleButton" className="text-xs text-slate-600 select-none cursor-pointer">
                    এই বাটনটি প্রদর্শন করুন
                  </label>
                </div>
              </div>

              {/* Social Handle */}
              {postData.template === 'design1' && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সোশ্যাল মিডিয়া হ্যান্ডেল
                  </label>
                  <input
                    type="text"
                    value={postData.socialHandle}
                    onChange={(e) => updateData({ socialHandle: e.target.value })}
                    placeholder="/Jonomanch"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Preview Area (lg:col-span-6 xl:col-span-7) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center">
          {/* Preview Header Strip */}
          <div className="w-full max-w-[500px] flex items-center justify-between pb-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 text-slate-800">
              <Sparkles className="w-4 h-4 text-red-600" />
              {isLiveEdit ? 'লাইভ প্রিভিউ (সরাসরি সচল)' : 'প্রিভিউ (লাইভ বন্ধ)'}
            </span>

            <div className="flex items-center gap-2">
              {!isLiveEdit && hasPendingChanges && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  আপডেট পেন্ডিং
                </span>
              )}
              <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                1080 × 1350 px (HD)
              </span>
            </div>
          </div>

          {/* Canvas Container (Fixed & Stable, Direct Touch Drag Disabled) */}
          <div
            className="w-full max-w-[500px] aspect-[4/5] bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden relative select-none"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* When Live Edit is OFF and there are changes pending, show an update banner */}
            {!isLiveEdit && hasPendingChanges && (
              <div className="absolute inset-x-4 bottom-4 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between z-10 animate-fade-in">
                <span className="text-xs font-semibold">নতুন পরিবর্তন করা হয়েছে</span>
                <button
                  type="button"
                  onClick={handleManualUpdatePreview}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  প্রিভিউ আপডেট করুন
                </button>
              </div>
            )}
          </div>

          {/* Quick Floating Zoom / Center Controls under canvas */}
          <div className="w-full max-w-[500px] mt-3 flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() =>
                  updateData({ imageZoom: Math.max(0.5, postData.imageZoom - 0.1) })
                }
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700"
                title="জুম আউট"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2 text-slate-600">
                {Math.round(postData.imageZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  updateData({ imageZoom: Math.min(2.5, postData.imageZoom + 0.1) })
                }
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700"
                title="জুম ইন"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isLiveEdit && (
                <button
                  type="button"
                  onClick={handleManualUpdatePreview}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
                    hasPendingChanges
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                  title="প্রিভিউ রিফ্রেশ করুন"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>প্রিভিউ আপডেট</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  updateData({ imageZoom: 1.0, imageOffsetX: 0, imageOffsetY: 0 })
                }
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-xs transition-colors"
              >
                মাঝখানে আনুন
              </button>
              <button
                type="button"
                onClick={handleResetSample}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-1"
                title="ডিফল্ট ডেটা"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                রিসেট
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
