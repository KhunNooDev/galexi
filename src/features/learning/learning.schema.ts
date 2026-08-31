import { z } from 'zod';

import { LEARNING_GOAL, LEARNING_LEVEL } from '@/features/learning/learning.constants';

const learningGoalSchema = z.enum(LEARNING_GOAL);
const learningLevelSchema = z.enum(LEARNING_LEVEL);

export const learningGoalInputSchema = z.object({ goal: learningGoalSchema });
export const learningLevelInputSchema = z.object({ level: learningLevelSchema });
