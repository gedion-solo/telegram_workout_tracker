import React, { useState, useMemo, useRef, useEffect, startTransition } from 'react';
import {
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  Search,
  ChevronDown,
  Dumbbell,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  Settings2,
  Target,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useWorkout } from '../context/WorkoutContext';
import { ExerciseProgressionPoint, CompletedWorkout } from '../types/workout';

type MetricType = 'e1RM' | 'topWeight' | 'sessionVolume';

type SplitPlanType = 'UL' | 'PPL' | 'FullBody' | 'BroSplit';

interface SplitPlanConfig {
  id: SplitPlanType;
  name: string;
  daysPerWeek: number;
  shortLabel: string;
}

const SPLIT_PLAN_OPTIONS: SplitPlanConfig[] = [
  { id: 'UL', name: 'Upper / Lower (U/L)', daysPerWeek: 4, shortLabel: '4d/wk (U/L)' },
  { id: 'PPL', name: 'Push / Pull / Legs (PPL)', daysPerWeek: 6, shortLabel: '6d/wk (PPL)' },
  { id: 'FullBody', name: 'Full Body', daysPerWeek: 3, shortLabel: '3d/wk (Full Body)' },
  { id: 'BroSplit', name: '5-Day Split', daysPerWeek: 5, shortLabel: '5d/wk (Bro Split)' },
];

export const DashboardView: React.FC = () => {
  const { exercises, history, getExercisePRs, getExerciseProgression, getExerciseById } = useWorkout();

  // Selected exercise (default to bench press or first available)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(() => {
    return exercises.length > 0 ? exercises[0].id : 'bench-press';
  });

  const [activeMetric, setActiveMetric] = useState<MetricType>('e1RM');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // WAFFLE PROGRESS TRACKER (MONTHLY ATTENDANCE)
  // ----------------------------------------------------
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth());
  const [inspectedDay, setInspectedDay] = useState<number>(() => today.getDate());

  const triggerHaptic = () => {
    try {
      if ((window as any)?.Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (_) {}
  };

  const handlePrevMonth = () => {
    isScrollingSelfRef.current = false;
    isUserInteractingRef.current = false;
    triggerHaptic();
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    if (selectedMonth === 0) {
      newMonth = 11;
      newYear = selectedYear - 1;
    } else {
      newMonth = selectedMonth - 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    const isTargetCurrent = newYear === today.getFullYear() && newMonth === today.getMonth();
    setInspectedDay(isTargetCurrent ? today.getDate() : 1);
  };

  const handleNextMonth = () => {
    isScrollingSelfRef.current = false;
    isUserInteractingRef.current = false;
    triggerHaptic();
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    if (selectedMonth === 11) {
      newMonth = 0;
      newYear = selectedYear + 1;
    } else {
      newMonth = selectedMonth + 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    const isTargetCurrent = newYear === today.getFullYear() && newMonth === today.getMonth();
    setInspectedDay(isTargetCurrent ? today.getDate() : 1);
  };

  const handleResetToCurrentMonth = () => {
    isScrollingSelfRef.current = false;
    isUserInteractingRef.current = false;
    triggerHaptic();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    const curDay = today.getDate();

    setSelectedYear(curYear);
    setSelectedMonth(curMonth);
    setInspectedDay(curDay);

    requestAnimationFrame(() => {
      if (activeItemRef.current && wheelContainerRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    });
  };

  const isCurrentMonthView = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
  const isViewingToday = isCurrentMonthView && inspectedDay === today.getDate();

  // Rolling list of months for the horizontal wheel (12 past, current, 3 future)
  const wheelMonths = useMemo(() => {
    const list = [];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    for (let offset = -12; offset <= 3; offset++) {
      const d = new Date(currentYear, currentMonth + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const fullMonthName = d.toLocaleDateString(undefined, { month: 'long' });
      const shortMonthName = d.toLocaleDateString(undefined, { month: 'short' });
      list.push({
        year: y,
        month: m,
        fullMonthName,
        shortMonthName,
        label: `${fullMonthName} ${y}`,
        shortLabel: `${shortMonthName} ${y}`,
        offset,
      });
    }
    return list;
  }, [today]);

  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const isScrollingSelfRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);
  const rafRef = useRef<number | null>(null);

  // Auto-center active month in the wheel only when programmatically changed (arrows, today, direct click, initial mount)
  useEffect(() => {
    // If month change was caused by scrolling the wheel track itself, do not fight or cancel momentum
    if (isScrollingSelfRef.current) {
      isScrollingSelfRef.current = false;
      return;
    }
    if (activeItemRef.current && wheelContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: isInitialMount.current ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      isInitialMount.current = false;
    }
  }, [selectedYear, selectedMonth]);

  const handleWheelScroll = () => {
    // Only detect month change if user is actively touching/dragging/wheeling
    // Prevents programmatic smooth scrolls (e.g. from "Today" button) from getting aborted mid-flight
    if (!isUserInteractingRef.current) {
      return;
    }

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 150);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!wheelContainerRef.current || !isUserInteractingRef.current) return;
      const container = wheelContainerRef.current;
      const centerContentX = container.scrollLeft + container.clientWidth / 2;

      // Each button is fixed w-28 (112px), gap-2 (8px) -> step is 120px
      // Left container padding is px-4 (16px), so center of button 0 is 16 + 56 = 72px
      const rawIndex = Math.round((centerContentX - 72) / 120);
      const targetIndex = Math.max(0, Math.min(wheelMonths.length - 1, rawIndex));
      const targetMonth = wheelMonths[targetIndex];

      if (targetMonth && (targetMonth.year !== selectedYear || targetMonth.month !== selectedMonth)) {
        triggerHaptic();
        isScrollingSelfRef.current = true;
        startTransition(() => {
          setSelectedYear(targetMonth.year);
          setSelectedMonth(targetMonth.month);
          const isTargetCurrent = targetMonth.year === today.getFullYear() && targetMonth.month === today.getMonth();
          setInspectedDay(isTargetCurrent ? today.getDate() : 1);
        });
      }
    });
  };

  const handleSelectMonthFromWheel = (year: number, month: number) => {
    if (year !== selectedYear || month !== selectedMonth) {
      triggerHaptic();
      isScrollingSelfRef.current = false;
      isUserInteractingRef.current = false;
      setSelectedYear(year);
      setSelectedMonth(month);
      const isTargetCurrent = year === today.getFullYear() && month === today.getMonth();
      setInspectedDay(isTargetCurrent ? today.getDate() : 1);
    }
  };

  const monthName = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Leading blank days for Monday-first week layout (0=Mon ... 6=Sun)
  const leadingBlankDays = useMemo(() => {
    const sundayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    return (sundayIndex + 6) % 7;
  }, [selectedYear, selectedMonth]);

  // Filter completed workouts for the selected month
  const monthWorkouts = useMemo(() => {
    return history.filter((w) => {
      const d = new Date(w.endTime || w.startTime);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [history, selectedYear, selectedMonth]);

  // Map of day -> CompletedWorkout[]
  const workoutsByDay = useMemo(() => {
    const map = new Map<number, CompletedWorkout[]>();
    for (const w of monthWorkouts) {
      const d = new Date(w.endTime || w.startTime).getDate();
      const existing = map.get(d) || [];
      existing.push(w);
      map.set(d, existing);
    }
    return map;
  }, [monthWorkouts]);

  const gymDaysCount = workoutsByDay.size;
  const monthlyAdherence = Math.round((gymDaysCount / daysInMonth) * 100);
  const totalMonthVolume = monthWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  // ----------------------------------------------------
  // SPLIT PLAN & DAYS MISSED CALCULATION
  // ----------------------------------------------------
  const [selectedSplitId, setSelectedSplitId] = useState<SplitPlanType>(() => {
    try {
      const saved = localStorage.getItem('duofit_split_plan');
      if (saved && ['UL', 'PPL', 'FullBody', 'BroSplit'].includes(saved)) {
        return saved as SplitPlanType;
      }
    } catch (_) {}
    return 'UL';
  });
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  const currentSplitPlan = useMemo(() => {
    return SPLIT_PLAN_OPTIONS.find((p) => p.id === selectedSplitId) || SPLIT_PLAN_OPTIONS[0];
  }, [selectedSplitId]);

  const targetDaysPerWeek = currentSplitPlan.daysPerWeek;
  const activePlanLabel = currentSplitPlan.shortLabel;

  // Calculate weekly breakdown and missed days for the selected month
  const { weeksBreakdown, daysMissedTotal } = useMemo(() => {
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Group days of this month into calendar weeks (Monday-Sunday)
    const weekMap = new Map<string, { monday: Date; sunday: Date; daysInMonth: Date[] }>();

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(selectedYear, selectedMonth, d);
      const dayOfWeek = curDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(selectedYear, selectedMonth, d - diffToMonday, 0, 0, 0, 0);
      const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 59 * 59 * 999);
      const key = monday.toISOString().slice(0, 10);

      if (!weekMap.has(key)) {
        weekMap.set(key, { monday, sunday, daysInMonth: [] });
      }
      weekMap.get(key)!.daysInMonth.push(curDate);
    }

    const weeks = Array.from(weekMap.values()).map((w, index) => {
      // Find workouts within this Monday-Sunday week
      const weekWorkouts = history.filter((hw) => {
        const t = hw.endTime || hw.startTime;
        return t >= w.monday.getTime() && t <= w.sunday.getTime();
      });

      const uniqueDaysSet = new Set(
        weekWorkouts.map((hw) => new Date(hw.endTime || hw.startTime).toDateString())
      );
      const attendedCount = uniqueDaysSet.size;

      const isPastWeek = w.sunday.getTime() < todayMidnight.getTime();
      const isCurrentWeek = w.monday.getTime() <= todayMidnight.getTime() && w.sunday.getTime() >= todayMidnight.getTime();
      const isFutureWeek = w.monday.getTime() > todayMidnight.getTime();

      let missedDays = 0;

      if (isPastWeek) {
        // Week has completed: missed = target - attended
        missedDays = Math.max(0, targetDaysPerWeek - attendedCount);
      } else if (isCurrentWeek) {
        // Week is in progress: can the user still hit their target in the days remaining?
        const currentDayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
        const daysPassed = (currentDayOfWeek + 6) % 7 + 1; // 1 to 7
        const daysRemaining = 7 - daysPassed; // days left from tomorrow until Sunday
        const maxPossibleAttended = attendedCount + daysRemaining;

        if (maxPossibleAttended < targetDaysPerWeek) {
          missedDays = targetDaysPerWeek - maxPossibleAttended;
        } else {
          missedDays = 0;
        }
      } else {
        missedDays = 0;
      }

      const startLabel = w.daysInMonth[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const endLabel = w.daysInMonth[w.daysInMonth.length - 1].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        weekNumber: index + 1,
        label: `Week ${index + 1} (${startLabel} - ${endLabel})`,
        attendedCount,
        targetDays: targetDaysPerWeek,
        missedDays,
        isPastWeek,
        isCurrentWeek,
        isFutureWeek,
      };
    });

    const total = weeks.reduce((sum, wk) => sum + wk.missedDays, 0);

    return { weeksBreakdown: weeks, daysMissedTotal: total };
  }, [selectedYear, selectedMonth, daysInMonth, history, targetDaysPerWeek, today]);

  const inspectedWorkouts = workoutsByDay.get(inspectedDay) || [];
  const hasInspectedWorkout = inspectedWorkouts.length > 0;

  const inspectedDateLabel = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, inspectedDay);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedYear, selectedMonth, inspectedDay]);

  // ----------------------------------------------------
  // EXERCISE PROGRESSION LOGIC
  // ----------------------------------------------------
  const currentExercise = useMemo(
    () => exercises.find((e) => e.id === selectedExerciseId) || exercises[0],
    [exercises, selectedExerciseId]
  );

  const prs = useMemo(
    () => (currentExercise ? getExercisePRs(currentExercise.id) : { heaviestWeight: 0, estimated1RM: 0, maxSessionVolume: 0 }),
    [currentExercise, getExercisePRs]
  );

  const progressionData = useMemo(
    () => (currentExercise ? getExerciseProgression(currentExercise.id) : []),
    [currentExercise, getExerciseProgression]
  );

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const metricLabels: Record<MetricType, { label: string; unit: string; color: string }> = {
    e1RM: { label: 'Est. 1RM', unit: 'kg', color: '#DAF1DE' },
    topWeight: { label: 'Top Set', unit: 'kg', color: '#8EB69B' },
    sessionVolume: { label: 'Total Volume', unit: 'kg', color: '#235347' },
  };

  // Custom dark-mode tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ExerciseProgressionPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-750 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white flex items-center justify-between gap-3">
            <span className="text-emerald-400 font-mono font-bold">{data.workoutName}</span>
            <span className="text-slate-300 font-semibold">{data.date}</span>
          </p>
          <div className="pt-1 border-t border-slate-800 space-y-0.5">
            <p className="text-emerald-400 font-semibold">
              Est. 1RM: <span className="font-mono">{data.e1RM} kg</span>
            </p>
            <p className="text-slate-300">
              Top Set: <span className="font-mono text-white font-semibold">{data.topWeight} kg × {data.topReps}</span>
            </p>
            <p className="text-slate-400">
              Volume: <span className="font-mono">{data.sessionVolume.toLocaleString()} kg</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 pb-28 pt-2">
      {/* 1. Monthly Gym Attendance (Waffle Progress Tracker) */}
      <div className="liquid-glass-panel glass-specular rounded-3xl p-4 shadow-2xl relative">
        {/* Waffle Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-emerald-500/30" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Monthly Gym Progress
              </h2>
            </div>
          </div>

          {!isViewingToday && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              title="Return to today's date"
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 transition active:scale-95 shadow-sm shadow-emerald-500/20"
            >
              Today
            </button>
          )}
        </div>

        {/* Horizontal Month Wheel Navigator */}
        <div className="relative mb-3.5">
          <div className="flex items-center gap-1.5">
            {/* Left Prev Arrow Button */}
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous month"
              className="w-10 h-11 rounded-2xl liquid-glass-input active:scale-95 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Scrollable Wheel Track */}
            <div className="relative flex-1 overflow-hidden rounded-2xl">
              {/* Left/Right Edge Shadow Fade for 3D Wheel Effect */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900/90 via-slate-900/40 to-transparent z-10" />

              <div
                ref={wheelContainerRef}
                onScroll={handleWheelScroll}
                onTouchStart={() => {
                  isUserInteractingRef.current = true;
                }}
                onMouseDown={() => {
                  isUserInteractingRef.current = true;
                }}
                onWheel={() => {
                  isUserInteractingRef.current = true;
                }}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar snap-x snap-mandatory py-1 px-4"
              >
                {wheelMonths.map((item) => {
                  const isSelected = item.year === selectedYear && item.month === selectedMonth;
                  const isCurrent = item.year === today.getFullYear() && item.month === today.getMonth();

                  return (
                    <button
                      key={`${item.year}-${item.month}`}
                      ref={isSelected ? activeItemRef : null}
                      data-year={item.year}
                      data-month={item.month}
                      type="button"
                      onClick={() => handleSelectMonthFromWheel(item.year, item.month)}
                      className={`h-11 w-28 shrink-0 rounded-2xl flex items-center justify-center snap-center transition-all duration-150 select-none ${
                        isSelected
                          ? 'liquid-glass-cta font-black shadow-lg scale-[1.02]'
                          : 'liquid-glass-pill text-slate-300 hover:text-white font-semibold opacity-80 hover:opacity-100 active:scale-95'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-xs font-bold">{item.shortMonthName}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-400 font-medium'}`}>
                          {item.year}
                        </span>
                        {isCurrent && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Next Arrow Button */}
            <button
              type="button"
              onClick={handleNextMonth}
              title="Next month"
              className="w-10 h-11 rounded-2xl liquid-glass-input active:scale-95 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Month Metrics Pills */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          <div className="liquid-glass-input rounded-2xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 block">Gym Visits</span>
            <span className="text-sm font-black font-mono text-emerald-400">{gymDaysCount}</span>
            <span className="text-[10px] text-slate-400"> / {daysInMonth}d</span>
          </div>
          <div className="liquid-glass-input rounded-2xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 block">Consistency</span>
            <span className="text-sm font-black font-mono text-emerald-400">{monthlyAdherence}%</span>
          </div>

          {/* Days Missed Card */}
          <button
            type="button"
            onClick={() => setIsSplitModalOpen(true)}
            title="Click to view weekly breakdown or change your split target"
            className="liquid-glass-input hover:border-emerald-500/40 rounded-2xl p-2.5 text-center transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-center gap-1 text-slate-500">
              <span className="text-[10px]">Days Missed</span>
              <Settings2 className="w-2.5 h-2.5 text-slate-400" />
            </div>
            <div>
              <span
                className={`text-sm font-black font-mono ${
                  daysMissedTotal > 0 ? 'text-slate-400' : 'text-emerald-400'
                }`}
              >
                {daysMissedTotal}
              </span>
              <span className="text-[10px] text-slate-400"> {daysMissedTotal === 1 ? 'day' : 'days'}</span>
            </div>
            <span className="text-[9px] text-slate-400 block truncate">
              {activePlanLabel}
            </span>
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 mb-1 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
            <span key={idx} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
              {dayName}
            </span>
          ))}
        </div>

        {/* Waffle Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Leading blank slots for previous month overflow */}
          {Array.from({ length: leadingBlankDays }).map((_, idx) => (
            <div
              key={`blank-${idx}`}
              className="aspect-square rounded-xl bg-slate-950/20 border border-transparent"
            />
          ))}

          {/* Days of this month */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
            const hasWorkout = workoutsByDay.has(dayNum);
            const isToday =
              today.getFullYear() === selectedYear &&
              today.getMonth() === selectedMonth &&
              today.getDate() === dayNum;
            const isSelected = inspectedDay === dayNum;
            const dayTimestamp = new Date(selectedYear, selectedMonth, dayNum, 23, 59, 59).getTime();
            const isFuture = dayTimestamp > today.getTime();

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setInspectedDay(dayNum)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 select-none ${
                  hasWorkout
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/25 active:scale-95'
                    : isFuture
                    ? 'bg-slate-950/30 border border-slate-900/60 text-slate-700'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                } ${
                  isToday ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 font-extrabold' : ''
                } ${
                  isSelected ? 'scale-105 outline outline-2 outline-white z-10 shadow-lg' : ''
                }`}
              >
                <span className={`text-xs ${hasWorkout ? 'font-black' : 'font-medium'}`}>{dayNum}</span>

                {/* Workout indicator pip */}
                {hasWorkout && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/30" />
            <span>Gym Workout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-950 border border-slate-800" />
            <span>Rest Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-950 border border-emerald-400 ring-1 ring-emerald-400" />
            <span>Today</span>
          </div>
        </div>

        {/* Inspected Day Details Card */}
        <div className="mt-3.5 p-3.5 liquid-glass-card glass-specular rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-white">{inspectedDateLabel}</span>
            {hasInspectedWorkout ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {inspectedWorkouts.length} {inspectedWorkouts.length === 1 ? 'Workout' : 'Workouts'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Rest / Recovery Day</span>
            )}
          </div>

          {hasInspectedWorkout ? (
            <div className="space-y-2">
              {inspectedWorkouts.map((w) => (
                <div key={w.id} className="pt-1 text-xs">
                  <div className="flex items-center justify-between text-slate-200 font-semibold mb-1">
                    <span className="text-emerald-400 font-bold">{w.name}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{Math.round(w.durationSeconds / 60)} min</span>
                      <span>•</span>
                      <span>{w.totalVolume.toLocaleString()} kg</span>
                      {w.prsHit > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{w.prsHit} PRs</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Movements pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {w.exercises.map((e, idx) => {
                      const def = getExerciseById(e.exerciseId);
                      return (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
                        >
                          {def ? def.name : e.exerciseId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 mt-0.5">
              No sessions logged on this day. Great for muscle recovery and adaptation!
            </p>
          )}
        </div>

        {/* Split Plan & Weekly Breakdown Modal */}
        {isSplitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Workout Split Target</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Select Your Split Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPLIT_PLAN_OPTIONS.map((plan) => {
                      const isSelected = selectedSplitId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => {
                            setSelectedSplitId(plan.id);
                            localStorage.setItem('duofit_split_plan', plan.id);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs">{plan.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{plan.daysPerWeek} days / week</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly Missed Breakdown Table for Selected Month */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">
                      Weekly Breakdown ({monthName})
                    </span>
                    <span className={`text-xs font-bold font-mono ${daysMissedTotal > 0 ? 'text-slate-400' : 'text-emerald-400'}`}>
                      {daysMissedTotal} {daysMissedTotal === 1 ? 'day missed' : 'days missed'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {weeksBreakdown.map((wk) => (
                      <div
                        key={wk.weekNumber}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{wk.label}</div>
                          <div className="text-[10px] text-slate-400">
                            Attended: {wk.attendedCount} / {wk.targetDays} days
                            {wk.isCurrentWeek && ' • This week'}
                            {wk.isFutureWeek && ' • Upcoming'}
                          </div>
                        </div>

                        <div>
                          {wk.isFutureWeek ? (
                            <span className="text-[11px] text-slate-500">-</span>
                          ) : wk.missedDays > 0 ? (
                            <span className="text-[11px] font-bold font-mono text-slate-400">
                              -{wk.missedDays} missed
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold font-mono text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Met
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Exercise Deep Dive Header */}
      <div className="relative pt-1">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
          Exercise Progression
        </label>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 rounded-2xl flex items-center justify-between text-left transition shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-white truncate">
                {currentExercise?.name || 'Choose exercise'}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-emerald-400">{currentExercise?.muscleGroup}</span>
                <span>•</span>
                <span>{currentExercise?.equipment}</span>
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-2">
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-850">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setSelectedExerciseId(ex.id);
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full py-2 px-2.5 text-left rounded-xl text-xs flex items-center justify-between transition ${
                    ex.id === selectedExerciseId
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span className="truncate">{ex.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {ex.muscleGroup}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Estimated 1RM */}
        <div className="liquid-glass-card glass-specular rounded-2xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Est. 1RM</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white font-mono leading-none">
              {prs.estimated1RM > 0 ? prs.estimated1RM : '-'}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">kg (Epley)</span>
          </div>
        </div>

        {/* Heaviest Weight */}
        <div className="liquid-glass-card glass-specular rounded-2xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Weight</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white font-mono leading-none">
              {prs.heaviestWeight > 0 ? prs.heaviestWeight : '-'}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">kg PR</span>
          </div>
        </div>

        {/* Max Session Volume */}
        <div className="liquid-glass-card glass-specular rounded-2xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Max Volume</span>
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white font-mono leading-none">
              {prs.maxSessionVolume > 0 ? prs.maxSessionVolume.toLocaleString() : '-'}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">kg / session</span>
          </div>
        </div>
      </div>

      {/* Interactive Progression Chart */}
      <div className="liquid-glass-panel glass-specular rounded-3xl p-4 shadow-xl">
        {/* Chart Header & Metric Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Progression Curve</h2>
              <span className="text-[10px] text-emerald-400/90 font-mono font-medium">Y: kg • Dots = Logged Workouts</span>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto">
            {(['e1RM', 'topWeight', 'sessionVolume'] as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                  activeMetric === metric
                    ? 'bg-slate-850 text-emerald-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {metricLabels[metric].label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area / Line Chart */}
        {progressionData.length < 2 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
            <TrendingUp className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
            <span>Complete more workouts to generate curve</span>
          </div>
        ) : (
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionData} margin={{ top: 12, right: 12, left: -2, bottom: 6 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DAF1DE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#DAF1DE" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8EB69B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8EB69B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#235347" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#235347" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#163832" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8EB69B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#163832' }}
                  dy={4}
                />
                <YAxis
                  stroke="#8EB69B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#163832' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(val) => `${val} kg`}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={metricLabels[activeMetric].color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={
                    activeMetric === 'e1RM'
                      ? 'url(#emeraldGradient)'
                      : activeMetric === 'topWeight'
                      ? 'url(#skyGradient)'
                      : 'url(#amberGradient)'
                  }
                  dot={{
                    r: 5,
                    fill: metricLabels[activeMetric].color,
                    stroke: '#051F20',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#DAF1DE',
                    stroke: metricLabels[activeMetric].color,
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

