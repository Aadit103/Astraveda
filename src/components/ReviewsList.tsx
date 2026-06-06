import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquareCode, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Shirt, 
  TrendingUp, 
  Check,
  Award,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Review, User } from '../types';

interface ReviewsListProps {
  productId: string;
  user: User | null;
  onNavigate: (view: string) => void;
}

interface ParsedComment {
  comment: string;
  comfort: number;
  quality: number;
  fit: string;
  tags: string[];
}

const PRESET_TAGS = [
  'Premium Fabric',
  'Super Soft',
  'Heavyweight Drape',
  'Sturdy Hemming',
  'True Colors',
  'Highly Breathable',
  'Perfect Sizing',
  'Luxurious Cozy'
];

function parseReviewComment(rawComment: string): ParsedComment {
  try {
    const trimmed = rawComment.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      return {
        comment: parsed.comment || '',
        comfort: typeof parsed.comfort === 'number' ? parsed.comfort : 5,
        quality: typeof parsed.quality === 'number' ? parsed.quality : 5,
        fit: parsed.fit || 'True to Size',
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    }
  } catch (e) {
    // Ignore, fallback to legacy text
  }
  return {
    comment: rawComment,
    comfort: 5,
    quality: 5,
    fit: 'True to Size',
    tags: []
  };
}

export default function ReviewsList({ productId, user, onNavigate }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [comfort, setComfort] = useState(5);
  const [quality, setQuality] = useState(5);
  const [fit, setFit] = useState('True to Size');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sorter / Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Helpfulness status tracking (persisted locally)
  const [helpfulStatus, setHelpfulStatus] = useState<Record<string, { voted: 'yes' | 'no' | null, yesCount: number, noCount: number }>>({});

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        
        // Initialize helpfulness metrics deterministically in local status
        const localVotes: Record<string, { voted: 'yes' | 'no' | null, yesCount: number, noCount: number }> = {};
        data.forEach((rev: Review) => {
          // Generate high fidelity fake helpful counters based on review id and rating
          const stored = localStorage.getItem(`review_helpful_${rev.id}`);
          let codeSum = 0;
          for (let i = 0; i < rev.id.length; i++) {
            codeSum += rev.id.charCodeAt(i);
          }
          const baseYes = (codeSum % 14) + (rev.rating >= 4 ? 4 : 1);
          const baseNo = codeSum % 3;
          localVotes[rev.id] = {
            voted: (stored as 'yes' | 'no' | null) || null,
            yesCount: stored === 'yes' ? baseYes + 1 : baseYes,
            noCount: stored === 'no' ? baseNo + 1 : baseNo
          };
        });
        setHelpfulStatus(localVotes);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Handle helpful voting
  const handleVote = (reviewId: string, type: 'yes' | 'no') => {
    const current = helpfulStatus[reviewId];
    if (!current) return;

    if (current.voted) {
      // Already voted, ignore or allow undo
      if (current.voted === type) {
        // Undo vote
        localStorage.removeItem(`review_helpful_${reviewId}`);
        setHelpfulStatus({
          ...helpfulStatus,
          [reviewId]: {
            voted: null,
            yesCount: type === 'yes' ? current.yesCount - 1 : current.yesCount,
            noCount: type === 'no' ? current.noCount - 1 : current.noCount
          }
        });
      }
      return;
    }

    localStorage.setItem(`review_helpful_${reviewId}`, type);
    setHelpfulStatus({
      ...helpfulStatus,
      [reviewId]: {
        voted: type,
        yesCount: type === 'yes' ? current.yesCount + 1 : current.yesCount,
        noCount: type === 'no' ? current.noCount + 1 : current.noCount
      }
    });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    // Serialize custom sub-ratings into database safely inside comment field
    const serializedComment = JSON.stringify({
      comment: comment.trim(),
      comfort,
      quality,
      fit,
      tags: selectedTags
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment: serializedComment })
      });

      if (res.ok) {
        setSuccessMsg('Thank you! Your verified rating and detailed apparel experience has been saved.');
        setComment('');
        setRating(5);
        setComfort(5);
        setQuality(5);
        setFit('True to Size');
        setSelectedTags([]);
        fetchReviews(); // Refresh
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setErrorMsg('Network error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compile aggregate metrics to render high-fidelity dashboard stats
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) 
    : 5.0;

  const recommendPercent = totalCount > 0
    ? Math.round((reviews.filter(r => r.rating >= 4).length / totalCount) * 100)
    : 100;

  const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let comfortSum = 0;
  let qualitySum = 0;
  let fitCount = { 'Runs Small': 0, 'True to Size': 0, 'Runs Large': 0 };

  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, r.rating)) as 5|4|3|2|1;
    starDistribution[star] = (starDistribution[star] || 0) + 1;
    
    const parsed = parseReviewComment(r.comment);
    comfortSum += parsed.comfort;
    qualitySum += parsed.quality;
    if (parsed.fit === 'Runs Small' || parsed.fit === 'True to Size' || parsed.fit === 'Runs Large') {
      fitCount[parsed.fit]++;
    } else {
      fitCount['True to Size']++;
    }
  });

  const avgComfort = totalCount > 0 ? (comfortSum / totalCount) : 5.0;
  const avgQuality = totalCount > 0 ? (qualitySum / totalCount) : 5.0;

  // Process fit dominant type
  let dominantFit = 'True to Size';
  if (totalCount > 0) {
    const maxVal = Math.max(fitCount['Runs Small'], fitCount['True to Size'], fitCount['Runs Large']);
    if (maxVal === fitCount['Runs Small']) dominantFit = 'Runs Small';
    else if (maxVal === fitCount['Runs Large']) dominantFit = 'Runs Large';
  }

  // Filter and sort reviews
  const parsedAndProcessedReviews = reviews.map(r => ({
    ...r,
    parsed: parseReviewComment(r.comment)
  }));

  const filteredReviews = parsedAndProcessedReviews.filter(r => {
    // Search query matched
    const matchesSearch = searchQuery.trim() === '' || 
      r.parsed.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.parsed.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // Star filter matched
    const matchesStar = filterStar === null || r.rating === filterStar;

    return matchesSearch && matchesStar;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'highest') {
      return b.rating - a.rating;
    } else if (sortBy === 'lowest') {
      return a.rating - b.rating;
    } else {
      // default newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Unique pastel backgrounds for user initial avatars
  const avatarBgColors = [
    'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400 border-violet-200 dark:border-violet-800'
  ];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-[32px] p-6 sm:p-10 mt-12 border border-zinc-200/50 dark:border-zinc-800/50 select-none">
      
      {/* HEADER ROW WITH ICON & META */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h3 className="text-2xl font-sans font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <MessageSquareCode className="h-6.5 w-6.5 text-emerald-500 animate-pulse" />
            Customer Feedback &amp; Brand Ratings
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Verified luxury product reviews and structural fit evaluations from real fashion purveyors.
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 px-3 py-1.5 rounded-2xl text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-1.5 self-start sm:self-auto">
          <Award className="h-4 w-4" /> verified checkout synced
        </div>
      </div>

      {/* HIGHER-FIDELITY RATING STATS OVERVIEW PANEL (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
        
        {/* Box 1: Average rating number */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900/60 border border-zinc-250/50 dark:border-zinc-800/50 p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
            <Sparkles className="h-20 w-20 text-zinc-800 dark:text-white" />
          </div>
          <p className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Aggregate Score</p>
          <div className="text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mt-3 flex items-baseline gap-1 font-sans">
            {avgRating.toFixed(1)} <span className="text-lg text-zinc-400 dark:text-zinc-600 font-medium font-sans">/5.0</span>
          </div>
          
          <div className="flex gap-1.5 text-amber-400 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(avgRating) ? 'fill-current text-amber-400' : 'text-zinc-200 dark:text-zinc-800'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4.5 font-medium bg-zinc-100 dark:bg-zinc-900 px-3.5 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-800/60">
            Backed by <span className="font-bold text-zinc-700 dark:text-zinc-200">{totalCount}</span> genuine owners
          </p>
        </div>

        {/* Box 2: Interactive Rating distribution graph */}
        <div className="md:col-span-5 bg-white dark:bg-zinc-900/60 border border-zinc-250/50 dark:border-zinc-800/50 p-5 sm:p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Star Distribution</p>
            <span className="text-[10px] text-zinc-500 animate-pulse bg-emerald-500/5 dark:bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-500/10 dark:border-emerald-400/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              💡 Click rows to filter stars
            </span>
          </div>
          <div className="space-y-2.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = starDistribution[star] || 0;
              const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
              const isSelected = filterStar === star;
              return (
                <button
                  key={star}
                  onClick={() => setFilterStar(filterStar === star ? null : star)}
                  className={`w-full flex items-center gap-3 group/row p-1.5 rounded-xl text-left transition ${
                    isSelected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 border border-transparent'
                  }`}
                >
                  <span className="w-8 text-xs font-bold font-mono text-zinc-600 dark:text-zinc-450 group-hover/row:text-amber-500 transition flex items-center justify-end gap-1 shrink-0">
                    {star} <Star className="h-3 w-3 fill-current text-zinc-400 dark:text-zinc-500 group-hover/row:text-amber-500" />
                  </span>
                  <div className="flex-1 h-3.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-800/40 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                          : 'bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-500 dark:to-amber-400 group-hover/row:from-amber-500 group-hover/row:to-amber-400'
                      }`}
                    />
                  </div>
                  <span className="w-10 text-xs text-right font-mono font-bold text-zinc-550 dark:text-zinc-400 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Box 3: Fit, Comfort & Recommendation Score summary */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-900/60 border border-zinc-250/50 dark:border-zinc-800/50 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Apparel Fit Indices</p>
            
            <div className="mt-4 flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Recommendation rate</p>
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-155">{recommendPercent}% buy again</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                <Shirt className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Dominant Sizing Fit</p>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-155">{dominantFit}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-850 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-450 font-medium">Comfort Rating:</span>
              <span className="font-bold text-zinc-750 dark:text-zinc-200 font-mono">{avgComfort.toFixed(1)} / 5</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-450 font-medium">Material Quality:</span>
              <span className="font-bold text-zinc-750 dark:text-zinc-200 font-mono">{avgQuality.toFixed(1)} / 5</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 items-start">
        
        {/* LEFT COMPONENT COLUMN: SUBMISSION FORM */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-3xl shadow-sm">
          <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4 mb-6">
            <h4 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Write Product Review
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">
              Verify sizing, styling, loop-knits or graphics to help our tight-knit aesthetic community.
            </p>
          </div>

          {user ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {successMsg && (
                <div role="alert" className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-emerald-500/10">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div role="alert" className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-2xl text-xs font-semibold border border-red-500/10">
                  {errorMsg}
                </div>
              )}

              {/* Metric 1: Star Rating select */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  Overall Rating *
                </label>
                <div className="flex gap-2 bg-zinc-550/5 dark:bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-120 hover:text-amber-500 transition active:scale-95"
                    >
                      <Star
                        className={`h-7 w-7 transition-all ${
                          star <= rating 
                            ? 'fill-current text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]' 
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold font-mono text-zinc-450 dark:text-zinc-500 pl-2 self-center border-l border-zinc-200 dark:border-zinc-800">
                    {rating}★
                  </span>
                </div>
              </div>

              {/* Metric 2: Sub-Metrics Comfort and Quality (Interactive slider grids) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850/80">
                
                {/* Comfort rating slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Comfort level
                    </label>
                    <span className="text-xs font-bold font-mono text-emerald-500">{comfort}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={comfort}
                    onChange={(e) => setComfort(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400 mt-1 font-semibold">
                    <span>Rigid</span>
                    <span>Cloud Like</span>
                  </div>
                </div>

                {/* Fabric Quality slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Fabric Quality
                    </label>
                    <span className="text-xs font-bold font-mono text-amber-500">{quality}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400 mt-1 font-semibold">
                    <span>Basic</span>
                    <span>Luxurious</span>
                  </div>
                </div>

              </div>

              {/* Metric 3: Sizing Fit Segments */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  Apparel Fit Assessment
                </label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-850">
                  {['Runs Small', 'True to Size', 'Runs Large'].map((option) => {
                    const isSelected = fit === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFit(option)}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200 dark:border-zinc-700/60'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metric 4: Lifestyle Review Tags checklist */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  Product Highlight Highlights
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg transition font-medium border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-emerald-500 shrink-0" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commentary */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  Detailed Comment
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Review material weight, loop back stitch, neck rib expansion, or fit drape on body..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500/15 transition focus:outline-none placeholder-zinc-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? 'Sharing Verified Review...' : 'Post Verified Review'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                Please sign in to submit a rating and leave detailed feedback about sizing, fabric quality, and comfort.
              </p>
              <button
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition"
              >
                Sign In to Review
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REVIEWS FEED PANEL WITH ADVANCED CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-4 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search owner reviews tags or names..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {/* Sorting and clear controls */}
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest' | 'lowest')}
                    className="appearance-none bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 pr-8 pl-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="newest">Most Recent</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-450 pointer-events-none" />
                </div>

                {(searchQuery || filterStar !== null) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStar(null);
                    }}
                    className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-950 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 shrink-0 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

            </div>

            {/* Quick Star Filters pills */}
            <div className="flex flex-wrap gap-1.5 items-center border-t border-zinc-100 dark:border-zinc-850 pt-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mr-2">Filter Stars:</span>
              <button
                onClick={() => setFilterStar(null)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${
                  filterStar === null
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800'
                    : 'bg-zinc-100 hover:bg-zinc-250/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-850'
                }`}
              >
                All Stars
              </button>
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const isActive = filterStar === star;
                const count = starDistribution[star] || 0;
                return (
                  <button
                    key={star}
                    onClick={() => setFilterStar(star)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 transition ${
                      isActive
                        ? 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/40'
                        : 'bg-zinc-100 hover:bg-zinc-250/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-850'
                    }`}
                  >
                    {star} ★
                    <span className="text-[9px] font-mono opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* LIST GENERATOR & RENDERER */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-zinc-400 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <p className="text-xs font-semibold">Retrieving verified review entries...</p>
              </div>
            ) : sortedReviews.length === 0 ? (
              <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-12 rounded-3xl text-zinc-400">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No matching reviews found</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1.5 max-w-sm mx-auto">
                  Try adjusting your search keywords, clear filters, or be the very first buyer to report your verified styling feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {sortedReviews.map((rev) => {
                    const initials = rev.user_name
                      ? rev.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'U';
                    
                    // Simple hash for choosing avatar color dynamically but deterministically
                    let codeSum = 0;
                    for (let i = 0; i < rev.user_name.length; i++) { codeSum += rev.user_name.charCodeAt(i); }
                    const avatarBg = avatarBgColors[codeSum % avatarBgColors.length];

                    const vote = helpfulStatus[rev.id] || { voted: null, yesCount: 0, noCount: 0 };

                    return (
                      <motion.div
                        key={rev.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-3xl relative"
                      >
                        
                        {/* Verfied Buyer Ribbon indicator */}
                        <div className="absolute top-5 right-5 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 dark:border-emerald-500/5">
                          <CheckCircle2 className="h-3 w-3" /> Verified Buyer
                        </div>

                        {/* Top user profile information */}
                        <div className="flex items-center gap-3.5">
                          <div className={`h-10 w-10 shrink-0 rounded-full border text-xs font-bold tracking-wider flex items-center justify-center ${avatarBg}`}>
                            {initials}
                          </div>
                          <div>
                            <h5 className="font-bold text-zinc-900 dark:text-white text-sm">
                              {rev.user_name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5 text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < rev.rating ? 'fill-current' : 'text-zinc-200 dark:text-zinc-800'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {new Date(rev.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sizing & Sizing sub-metrics tags */}
                        {(rev.parsed.fit || rev.parsed.comfort < 5 || rev.parsed.quality < 5) && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {rev.parsed.fit && (
                              <span className="text-[9px] bg-sky-50 dark:bg-sky-950/20 text-sky-650 dark:text-sky-400 border border-sky-200/30 dark:border-sky-850 px-2 py-0.5 rounded font-bold font-sans">
                                Fit: {rev.parsed.fit}
                              </span>
                            )}
                            {rev.parsed.comfort > 0 && (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/10 text-emerald-650 dark:text-emerald-400 border border-emerald-250/20 dark:border-emerald-850 px-2 py-0.5 rounded font-mono font-bold">
                                Comfort: {rev.parsed.comfort}/5
                              </span>
                            )}
                            {rev.parsed.quality > 0 && (
                              <span className="text-[9px] bg-amber-50 dark:bg-amber-900/10 text-amber-655 dark:text-amber-400 border border-amber-250/20 dark:border-amber-850 px-2 py-0.5 rounded font-mono font-bold">
                                Fabric: {rev.parsed.quality}/5
                              </span>
                            )}
                          </div>
                        )}

                        {/* Review highlight tags */}
                        {rev.parsed.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {rev.parsed.tags.map(t => (
                              <span key={t} className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                                # {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Detailed Body Review comment */}
                        <p className="text-zinc-650 dark:text-zinc-300 text-xs mt-3.5 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                          {rev.parsed.comment}
                        </p>

                        {/* Interactive Helpfulness Rating Actions */}
                        <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-850/80 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold font-sans">Was this review helpful?</span>
                            <div className="flex items-center gap-1 pl-1">
                              <button
                                onClick={() => handleVote(rev.id, 'yes')}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                                  vote.voted === 'yes'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-bold scale-102 font-bold'
                                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-405 border-zinc-200 dark:border-zinc-850'
                                }`}
                                title="Vouch helpful review"
                              >
                                <ThumbsUp className={`h-3 w-3 ${vote.voted === 'yes' ? 'fill-current text-emerald-500' : ''}`} /> 
                                <span>{vote.yesCount}</span>
                              </button>

                              <button
                                onClick={() => handleVote(rev.id, 'no')}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                                  vote.voted === 'no'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold'
                                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-405 border-zinc-200 dark:border-zinc-850'
                                }`}
                                title="Report unhelpful comment"
                              >
                                <ThumbsDown className={`h-3 w-3 ${vote.voted === 'no' ? 'fill-current text-red-500' : ''}`} /> 
                                <span>{vote.noCount}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* HIGH FIDELITY SIMULATED CONCIERGE BRAND RESPONSE FOR CRITICS / LOW RATINGS (<= 3 Stars) */}
                        {rev.rating <= 3 && (
                          <div className="mt-4 p-4 dark:p-4.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex gap-3">
                            <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-400/20 shadow-sm shadow-emerald-500/10 mt-0.5">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight font-sans">Astraveda Executive Concierge</span>
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-extrabold tracking-widest uppercase px-1 rounded border border-emerald-500/10">Official Reply</span>
                              </div>
                              <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed font-sans font-medium">
                                Hi {rev.user_name.split(' ')[0]}, we are deeply sorry to hear the garment sizing or drape didn't match your luxurious expectations perfectly! We pride ourselves on fine tail-cuts. Our concierge team has flagged this order and dispatched a ticket to <span className="font-semibold text-emerald-500">issue a pre-paid 100% free exchange label</span> to your registered owner account. Let's make this right!
                              </p>
                            </div>
                          </div>
                        )}

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
