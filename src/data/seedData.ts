import { Exercise, WorkoutTemplate, CompletedWorkout } from '../types/workout';

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    category: 'Upper',
    equipment: 'Barbell',
    instructions: 'Retract scapula, keep feet planted, lower bar to mid-chest with control, press powerfully.'
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    category: 'Upper',
    equipment: 'Dumbbell',
    instructions: 'Set bench to 30°, press dumbbells upwards converging slightly at top without clanking.'
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscleGroup: 'Back',
    category: 'Upper',
    equipment: 'Barbell',
    instructions: 'Hinge hips at 45°, pull bar toward belly button leading with elbows, squeeze lats.'
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    category: 'Upper',
    equipment: 'Cable',
    instructions: 'Slight lean back, pull bar to upper chest, drive elbows down and back.'
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    category: 'Upper',
    equipment: 'Barbell',
    instructions: 'Brace core and glutes, press vertically clearing chin, lock out directly overhead.'
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscleGroup: 'Shoulders',
    category: 'Upper',
    equipment: 'Dumbbell',
    instructions: 'Slight forward lean, raise arms to parallel leading with elbows, controlled negative.'
  },
  {
    id: 'barbell-squat',
    name: 'Barbell Squat',
    muscleGroup: 'Legs',
    category: 'Lower',
    equipment: 'Barbell',
    instructions: 'Break at knees and hips together, descend to parallel or deeper, drive through whole foot.'
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscleGroup: 'Legs',
    category: 'Lower',
    equipment: 'Barbell',
    instructions: 'Soft knees, hinge deep at hips pushing glutes back until hamstring stretch, stand tall.'
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscleGroup: 'Legs',
    category: 'Lower',
    equipment: 'Machine',
    instructions: 'Feet shoulder-width on sled, lower until 90° knee angle without lower back rounding, press.'
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    muscleGroup: 'Legs',
    category: 'Lower',
    equipment: 'Machine',
    instructions: 'Pad just below calves, curl heels toward glutes, pause peak contraction.'
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    muscleGroup: 'Arms',
    category: 'Upper',
    equipment: 'Barbell',
    instructions: 'Keep elbows pinned to ribs, curl bar smoothly, avoid swinging torso.'
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscleGroup: 'Arms',
    category: 'Upper',
    equipment: 'Cable',
    instructions: 'Flared rope or straight bar, extend elbows down fully locking out, slow eccentric.'
  }
];

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'template-upper-a',
    name: 'Upper A',
    category: 'Upper',
    description: 'Chest & Back strength focus with vertical pressing & arms finisher',
    exerciseIds: [
      'bench-press',
      'barbell-row',
      'overhead-press',
      'lat-pulldown',
      'tricep-pushdown',
      'barbell-curl'
    ]
  },
  {
    id: 'template-lower-a',
    name: 'Lower A',
    category: 'Lower',
    description: 'Squat & Quad bias with hamstring and machine hypertrophy volume',
    exerciseIds: [
      'barbell-squat',
      'romanian-deadlift',
      'leg-press',
      'leg-curl'
    ]
  },
  {
    id: 'template-upper-b',
    name: 'Upper B',
    category: 'Upper',
    description: 'Incline push bias, wide lats, lateral delts and arms isolation',
    exerciseIds: [
      'incline-db-press',
      'lat-pulldown',
      'lateral-raise',
      'barbell-row',
      'barbell-curl',
      'tricep-pushdown'
    ]
  },
  {
    id: 'template-lower-b',
    name: 'Lower B',
    category: 'Lower',
    description: 'Posterior chain hinge focus paired with leg press overload',
    exerciseIds: [
      'romanian-deadlift',
      'leg-press',
      'barbell-squat',
      'leg-curl'
    ]
  }
];

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export const SEED_COMPLETED_WORKOUTS: CompletedWorkout[] = [
  // Session 1: 24 days ago - Upper A
  {
    id: 'hist-workout-1',
    name: 'Upper A',
    startTime: now - 24 * DAY_MS,
    endTime: now - 24 * DAY_MS + 48 * 60 * 1000,
    durationSeconds: 2880,
    totalVolume: 7450,
    prsHit: 3,
    exercises: [
      {
        exerciseId: 'bench-press',
        sets: [
          { tag: 'W', weight: 45, reps: 10, completed: true },
          { tag: 'N', weight: 70, reps: 8, completed: true },
          { tag: 'N', weight: 72.5, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-row',
        sets: [
          { tag: 'W', weight: 40, reps: 10, completed: true },
          { tag: 'N', weight: 60, reps: 8, completed: true },
          { tag: 'N', weight: 65, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'overhead-press',
        sets: [
          { tag: 'W', weight: 30, reps: 8, completed: true },
          { tag: 'N', weight: 42.5, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lat-pulldown',
        sets: [
          { tag: 'N', weight: 55, reps: 10, completed: true },
          { tag: 'N', weight: 60, reps: 8, completed: true }
        ]
      },
      {
        exerciseId: 'tricep-pushdown',
        sets: [
          { tag: 'N', weight: 25, reps: 12, completed: true },
          { tag: 'N', weight: 27.5, reps: 10, completed: true }
        ]
      },
      {
        exerciseId: 'barbell-curl',
        sets: [
          { tag: 'N', weight: 27.5, reps: 10, completed: true },
          { tag: 'N', weight: 30, reps: 8, completed: true }
        ]
      }
    ]
  },

  // Session 2: 21 days ago - Lower A
  {
    id: 'hist-workout-2',
    name: 'Lower A',
    startTime: now - 21 * DAY_MS,
    endTime: now - 21 * DAY_MS + 55 * 60 * 1000,
    durationSeconds: 3300,
    totalVolume: 9850,
    prsHit: 3,
    exercises: [
      {
        exerciseId: 'barbell-squat',
        sets: [
          { tag: 'W', weight: 50, reps: 10, completed: true },
          { tag: 'N', weight: 80, reps: 8, completed: true },
          { tag: 'N', weight: 85, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: [
          { tag: 'W', weight: 50, reps: 8, completed: true },
          { tag: 'N', weight: 85, reps: 8, completed: true },
          { tag: 'N', weight: 90, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-press',
        sets: [
          { tag: 'N', weight: 140, reps: 12, completed: true },
          { tag: 'N', weight: 160, reps: 10, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-curl',
        sets: [
          { tag: 'N', weight: 40, reps: 12, completed: true },
          { tag: 'N', weight: 45, reps: 10, completed: true }
        ]
      }
    ]
  },

  // Session 3: 18 days ago - Upper B
  {
    id: 'hist-workout-3',
    name: 'Upper B',
    startTime: now - 18 * DAY_MS,
    endTime: now - 18 * DAY_MS + 50 * 60 * 1000,
    durationSeconds: 3000,
    totalVolume: 8200,
    prsHit: 2,
    exercises: [
      {
        exerciseId: 'incline-db-press',
        sets: [
          { tag: 'W', weight: 18, reps: 10, completed: true },
          { tag: 'N', weight: 24, reps: 8, completed: true },
          { tag: 'N', weight: 26, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lat-pulldown',
        sets: [
          { tag: 'W', weight: 40, reps: 10, completed: true },
          { tag: 'N', weight: 60, reps: 10, completed: true },
          { tag: 'N', weight: 65, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lateral-raise',
        sets: [
          { tag: 'N', weight: 9, reps: 15, completed: true },
          { tag: 'N', weight: 10, reps: 12, completed: true }
        ]
      },
      {
        exerciseId: 'barbell-row',
        sets: [
          { tag: 'N', weight: 65, reps: 8, completed: true },
          { tag: 'N', weight: 67.5, reps: 8, completed: true }
        ]
      },
      {
        exerciseId: 'barbell-curl',
        sets: [
          { tag: 'N', weight: 30, reps: 8, completed: true }
        ]
      },
      {
        exerciseId: 'tricep-pushdown',
        sets: [
          { tag: 'N', weight: 27.5, reps: 10, completed: true }
        ]
      }
    ]
  },

  // Session 4: 15 days ago - Lower B
  {
    id: 'hist-workout-4',
    name: 'Lower B',
    startTime: now - 15 * DAY_MS,
    endTime: now - 15 * DAY_MS + 54 * 60 * 1000,
    durationSeconds: 3240,
    totalVolume: 10400,
    prsHit: 2,
    exercises: [
      {
        exerciseId: 'romanian-deadlift',
        sets: [
          { tag: 'W', weight: 60, reps: 8, completed: true },
          { tag: 'N', weight: 95, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-press',
        sets: [
          { tag: 'N', weight: 160, reps: 12, completed: true },
          { tag: 'N', weight: 180, reps: 10, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-squat',
        sets: [
          { tag: 'W', weight: 60, reps: 8, completed: true },
          { tag: 'N', weight: 90, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-curl',
        sets: [
          { tag: 'N', weight: 45, reps: 10, completed: true }
        ]
      }
    ]
  },

  // Session 5: 12 days ago - Upper A
  {
    id: 'hist-workout-5',
    name: 'Upper A',
    startTime: now - 12 * DAY_MS,
    endTime: now - 12 * DAY_MS + 52 * 60 * 1000,
    durationSeconds: 3120,
    totalVolume: 8900,
    prsHit: 3,
    exercises: [
      {
        exerciseId: 'bench-press',
        sets: [
          { tag: 'W', weight: 50, reps: 10, completed: true },
          { tag: 'N', weight: 75, reps: 8, completed: true },
          { tag: 'N', weight: 77.5, reps: 7, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-row',
        sets: [
          { tag: 'W', weight: 45, reps: 8, completed: true },
          { tag: 'N', weight: 67.5, reps: 8, completed: true },
          { tag: 'N', weight: 70, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'overhead-press',
        sets: [
          { tag: 'W', weight: 30, reps: 8, completed: true },
          { tag: 'N', weight: 45, reps: 8, completed: true },
          { tag: 'N', weight: 47.5, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lat-pulldown',
        sets: [
          { tag: 'N', weight: 65, reps: 8, completed: true }
        ]
      },
      {
        exerciseId: 'tricep-pushdown',
        sets: [
          { tag: 'N', weight: 30, reps: 10, completed: true }
        ]
      },
      {
        exerciseId: 'barbell-curl',
        sets: [
          { tag: 'N', weight: 32.5, reps: 8, completed: true }
        ]
      }
    ]
  },

  // Session 6: 9 days ago - Lower A
  {
    id: 'hist-workout-6',
    name: 'Lower A',
    startTime: now - 9 * DAY_MS,
    endTime: now - 9 * DAY_MS + 56 * 60 * 1000,
    durationSeconds: 3360,
    totalVolume: 11600,
    prsHit: 3,
    exercises: [
      {
        exerciseId: 'barbell-squat',
        sets: [
          { tag: 'W', weight: 60, reps: 8, completed: true },
          { tag: 'N', weight: 92.5, reps: 8, completed: true },
          { tag: 'N', weight: 97.5, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: [
          { tag: 'W', weight: 60, reps: 8, completed: true },
          { tag: 'N', weight: 100, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-press',
        sets: [
          { tag: 'N', weight: 170, reps: 10, completed: true },
          { tag: 'N', weight: 190, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-curl',
        sets: [
          { tag: 'N', weight: 47.5, reps: 10, completed: true }
        ]
      }
    ]
  },

  // Session 7: 6 days ago - Upper B
  {
    id: 'hist-workout-7',
    name: 'Upper B',
    startTime: now - 6 * DAY_MS,
    endTime: now - 6 * DAY_MS + 51 * 60 * 1000,
    durationSeconds: 3060,
    totalVolume: 8750,
    prsHit: 3,
    exercises: [
      {
        exerciseId: 'incline-db-press',
        sets: [
          { tag: 'W', weight: 20, reps: 10, completed: true },
          { tag: 'N', weight: 26, reps: 8, completed: true },
          { tag: 'N', weight: 28, reps: 8, completed: true, isPR: true },
          { tag: 'N', weight: 30, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lat-pulldown',
        sets: [
          { tag: 'W', weight: 45, reps: 10, completed: true },
          { tag: 'N', weight: 65, reps: 8, completed: true },
          { tag: 'N', weight: 70, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lateral-raise',
        sets: [
          { tag: 'N', weight: 10, reps: 15, completed: true },
          { tag: 'N', weight: 12, reps: 12, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-row',
        sets: [
          { tag: 'N', weight: 70, reps: 8, completed: true },
          { tag: 'N', weight: 72.5, reps: 7, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-curl',
        sets: [
          { tag: 'N', weight: 32.5, reps: 8, completed: true }
        ]
      }
    ]
  },

  // Session 8: 3 days ago - Lower B
  {
    id: 'hist-workout-8',
    name: 'Lower B',
    startTime: now - 3 * DAY_MS,
    endTime: now - 3 * DAY_MS + 58 * 60 * 1000,
    durationSeconds: 3480,
    totalVolume: 12800,
    prsHit: 3,
    exercises: [
      {
        exerciseId: 'barbell-squat',
        sets: [
          { tag: 'W', weight: 70, reps: 6, completed: true },
          { tag: 'N', weight: 95, reps: 8, completed: true },
          { tag: 'N', weight: 102.5, reps: 5, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: [
          { tag: 'W', weight: 70, reps: 8, completed: true },
          { tag: 'N', weight: 105, reps: 8, completed: true, isPR: true },
          { tag: 'N', weight: 110, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-press',
        sets: [
          { tag: 'N', weight: 180, reps: 10, completed: true },
          { tag: 'N', weight: 200, reps: 8, completed: true },
          { tag: 'N', weight: 210, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-curl',
        sets: [
          { tag: 'N', weight: 50, reps: 10, completed: true },
          { tag: 'N', weight: 55, reps: 8, completed: true, isPR: true }
        ]
      }
    ]
  },

  // Session 9: Yesterday - Upper A
  {
    id: 'hist-workout-9',
    name: 'Upper A',
    startTime: now - 1 * DAY_MS,
    endTime: now - 1 * DAY_MS + 55 * 60 * 1000,
    durationSeconds: 3300,
    totalVolume: 10150,
    prsHit: 4,
    exercises: [
      {
        exerciseId: 'bench-press',
        sets: [
          { tag: 'W', weight: 50, reps: 10, completed: true },
          { tag: 'W', weight: 65, reps: 5, completed: true },
          { tag: 'N', weight: 80, reps: 8, completed: true },
          { tag: 'N', weight: 85, reps: 5, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-row',
        sets: [
          { tag: 'W', weight: 50, reps: 8, completed: true },
          { tag: 'N', weight: 72.5, reps: 8, completed: true },
          { tag: 'N', weight: 75, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'overhead-press',
        sets: [
          { tag: 'W', weight: 35, reps: 8, completed: true },
          { tag: 'N', weight: 50, reps: 6, completed: true },
          { tag: 'N', weight: 52.5, reps: 5, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'lat-pulldown',
        sets: [
          { tag: 'N', weight: 70, reps: 8, completed: true },
          { tag: 'N', weight: 75, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'tricep-pushdown',
        sets: [
          { tag: 'N', weight: 32.5, reps: 10, completed: true },
          { tag: 'N', weight: 35, reps: 8, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'barbell-curl',
        sets: [
          { tag: 'N', weight: 32.5, reps: 8, completed: true },
          { tag: 'N', weight: 35, reps: 6, completed: true, isPR: true }
        ]
      }
    ]
  },

  // Session 10: Today - Lower B
  {
    id: 'hist-workout-10',
    name: 'Lower B',
    startTime: now - 3 * 60 * 60 * 1000,
    endTime: now - 2 * 60 * 60 * 1000,
    durationSeconds: 3600,
    totalVolume: 11200,
    prsHit: 2,
    exercises: [
      {
        exerciseId: 'barbell-squat',
        sets: [
          { tag: 'W', weight: 60, reps: 10, completed: true },
          { tag: 'W', weight: 80, reps: 5, completed: true },
          { tag: 'N', weight: 105, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: [
          { tag: 'W', weight: 60, reps: 8, completed: true },
          { tag: 'N', weight: 95, reps: 8, completed: true },
          { tag: 'N', weight: 100, reps: 6, completed: true, isPR: true }
        ]
      },
      {
        exerciseId: 'leg-press',
        sets: [
          { tag: 'N', weight: 160, reps: 12, completed: true },
          { tag: 'N', weight: 180, reps: 10, completed: true }
        ]
      },
      {
        exerciseId: 'leg-curl',
        sets: [
          { tag: 'N', weight: 55, reps: 10, completed: true },
          { tag: 'N', weight: 60, reps: 8, completed: true }
        ]
      }
    ]
  }
];
