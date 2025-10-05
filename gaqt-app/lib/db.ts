import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);

// Helper types
export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  ton_wallet?: string;
  energy: number;
  points: number;
  level: number;
  referral_code?: string;
  referral_count?: number;
  last_sync: Date;
  created_at: Date;
}

export interface Quest {
  id: string;
  type: 'affiliate' | 'iap' | 'social' | 'ton';
  title: string;
  description: string;
  reward_points: number;
  reward_energy: number;
  affiliate_url?: string;
  stars_price?: number;
  icon_emoji: string;
  is_active: boolean;
  order_index: number;
  created_at: Date;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

// Database operations
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE telegram_id = ${telegramId} LIMIT 1
  `;
  return result[0] as User || null;
}

export async function createUser(data: {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}): Promise<User> {
  const result = await sql`
    INSERT INTO users (telegram_id, username, first_name, last_name)
    VALUES (${data.telegram_id}, ${data.username || null}, ${data.first_name || null}, ${data.last_name || null})
    RETURNING *
  `;
  return result[0] as User;
}

export async function updateUserProgress(userId: string, data: {
  energy?: number;
  points?: number;
  level?: number;
}): Promise<User> {
  const result = await sql`
    UPDATE users
    SET 
      energy = COALESCE(${data.energy}, energy),
      points = COALESCE(${data.points}, points),
      level = COALESCE(${data.level}, level),
      last_sync = NOW()
    WHERE id = ${userId}
    RETURNING *
  `;
  return result[0] as User;
}

export async function connectTonWallet(userId: string, walletAddress: string): Promise<User> {
  const result = await sql`
    UPDATE users
    SET ton_wallet = ${walletAddress}
    WHERE id = ${userId}
    RETURNING *
  `;
  return result[0] as User;
}

export async function getActiveQuests(): Promise<Quest[]> {
  const result = await sql`
    SELECT * FROM quests
    WHERE is_active = true
    ORDER BY order_index ASC
  `;
  return result as Quest[];
}

export async function getUserQuests(userId: string): Promise<(UserQuest & { quest: Quest })[]> {
  const result = await sql`
    SELECT 
      uq.*,
      jsonb_build_object(
        'id', q.id,
        'type', q.type,
        'title', q.title,
        'description', q.description,
        'reward_points', q.reward_points,
        'reward_energy', q.reward_energy,
        'affiliate_url', q.affiliate_url,
        'stars_price', q.stars_price,
        'icon_emoji', q.icon_emoji,
        'is_active', q.is_active,
        'order_index', q.order_index
      ) as quest
    FROM user_quests uq
    JOIN quests q ON uq.quest_id = q.id
    WHERE uq.user_id = ${userId}
    ORDER BY q.order_index ASC
  `;
  return result as (UserQuest & { quest: Quest })[];
}

export async function startQuest(userId: string, questId: string): Promise<UserQuest> {
  const result = await sql`
    INSERT INTO user_quests (user_id, quest_id, status, started_at)
    VALUES (${userId}, ${questId}, 'in_progress', NOW())
    ON CONFLICT (user_id, quest_id) 
    DO UPDATE SET status = 'in_progress', started_at = NOW()
    RETURNING *
  `;
  return result[0] as UserQuest;
}

export async function completeQuest(userId: string, questId: string): Promise<{ user: User; userQuest: UserQuest }> {
  // Get quest details
  const questResult = await sql`
    SELECT * FROM quests WHERE id = ${questId} LIMIT 1
  `;
  const quest = questResult[0] as Quest;

  if (!quest) {
    throw new Error('Quest not found');
  }

  // Update user quest status
  const userQuestResult = await sql`
    UPDATE user_quests
    SET status = 'completed', completed_at = NOW()
    WHERE user_id = ${userId} AND quest_id = ${questId}
    RETURNING *
  `;

  // Update user points and energy
  const userResult = await sql`
    UPDATE users
    SET 
      points = points + ${quest.reward_points},
      energy = LEAST(energy + ${quest.reward_energy}, 1000),
      level = FLOOR((points + ${quest.reward_points}) / 10000) + 1
    WHERE id = ${userId}
    RETURNING *
  `;

  return {
    user: userResult[0] as User,
    userQuest: userQuestResult[0] as UserQuest
  };
}

export async function getLeaderboard(limit: number = 100): Promise<User[]> {
  const result = await sql`
    SELECT id, telegram_id, username, first_name, points, level
    FROM users
    ORDER BY points DESC
    LIMIT ${limit}
  `;
  return result as User[];
}

export async function regenerateEnergy(): Promise<void> {
  await sql`
    UPDATE users
    SET 
      energy = LEAST(energy + 10, 1000),
      last_sync = NOW()
    WHERE energy < 1000 
    AND last_sync < NOW() - INTERVAL '5 minutes'
  `;
}

// Referral system types
export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  reward_claimed: boolean;
  created_at: Date;
}

export interface DailyQuest {
  id: string;
  quest_id: string;
  date: Date;
  multiplier: number;
  is_active: boolean;
  quest?: Quest;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  icon_emoji: string;
  earned_at: Date;
}

// Referral operations
export async function createReferral(referrerCode: string, referredUserId: string): Promise<Referral | null> {
  try {
    // Find referrer by code
    const referrerResult = await sql`
      SELECT id FROM users WHERE referral_code = ${referrerCode} LIMIT 1
    `;
    
    if (referrerResult.length === 0) {
      return null;
    }
    
    const referrerId = referrerResult[0].id;
    
    // Create referral record
    const result = await sql`
      INSERT INTO referrals (referrer_id, referred_id, referral_code)
      VALUES (${referrerId}, ${referredUserId}, ${referrerCode})
      ON CONFLICT (referred_id) DO NOTHING
      RETURNING *
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    // Update referrer's referral count
    await sql`
      UPDATE users
      SET referral_count = referral_count + 1
      WHERE id = ${referrerId}
    `;
    
    // Award bonus points to both users
    await sql`
      UPDATE users
      SET points = points + 1000, energy = LEAST(energy + 100, 1000)
      WHERE id = ${referrerId} OR id = ${referredUserId}
    `;
    
    return result[0] as Referral;
  } catch (error) {
    console.error('Create referral error:', error);
    return null;
  }
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const result = await sql`
    SELECT r.*, u.username, u.first_name, u.points
    FROM referrals r
    JOIN users u ON r.referred_id = u.id
    WHERE r.referrer_id = ${userId}
    ORDER BY r.created_at DESC
  `;
  return result as Referral[];
}

// Daily quests operations
export async function getDailyQuests(): Promise<DailyQuest[]> {
  const result = await sql`
    SELECT 
      dq.*,
      jsonb_build_object(
        'id', q.id,
        'type', q.type,
        'title', q.title,
        'description', q.description,
        'reward_points', q.reward_points,
        'reward_energy', q.reward_energy,
        'affiliate_url', q.affiliate_url,
        'icon_emoji', q.icon_emoji
      ) as quest
    FROM daily_quests dq
    JOIN quests q ON dq.quest_id = q.id
    WHERE dq.date = CURRENT_DATE AND dq.is_active = true
    ORDER BY q.order_index ASC
  `;
  return result as DailyQuest[];
}

export async function createDailyQuest(questId: string, multiplier: number = 2.0): Promise<DailyQuest> {
  const result = await sql`
    INSERT INTO daily_quests (quest_id, multiplier)
    VALUES (${questId}, ${multiplier})
    ON CONFLICT (quest_id, date) DO UPDATE
    SET multiplier = ${multiplier}, is_active = true
    RETURNING *
  `;
  return result[0] as DailyQuest;
}

// Achievements operations
export async function awardAchievement(
  userId: string,
  achievementType: string,
  achievementName: string,
  iconEmoji: string = '🏆'
): Promise<UserAchievement | null> {
  try {
    const result = await sql`
      INSERT INTO user_achievements (user_id, achievement_type, achievement_name, icon_emoji)
      VALUES (${userId}, ${achievementType}, ${achievementName}, ${iconEmoji})
      ON CONFLICT (user_id, achievement_type) DO NOTHING
      RETURNING *
    `;
    
    if (result.length > 0) {
      // Award bonus points for achievement
      await sql`
        UPDATE users
        SET points = points + 500
        WHERE id = ${userId}
      `;
      
      return result[0] as UserAchievement;
    }
    
    return null;
  } catch (error) {
    console.error('Award achievement error:', error);
    return null;
  }
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const result = await sql`
    SELECT * FROM user_achievements
    WHERE user_id = ${userId}
    ORDER BY earned_at DESC
  `;
  return result as UserAchievement[];
}
