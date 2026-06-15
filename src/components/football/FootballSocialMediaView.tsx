'use client'

import SocialMediaHub, { type SocialProfile } from '@/components/social/SocialMediaHub'

const MENS: SocialProfile = {
  clubLine: 'Everything the world is saying about Oakridge FC',
  kpis: [
    { label: 'Total Followers', value: '284k', sub: '+35% this season', color: '#003DA5' },
    { label: 'Engagement Rate', value: '4.2%', sub: 'across platforms', color: '#22C55E' },
    { label: 'Posts this month', value: '18', sub: '1 pending approval', color: '#F59E0B' },
    { label: 'Best reach', value: '142k', sub: 'X — Eastcliff win', color: '#60A5FA' },
    { label: 'Mentions Today', value: '847', sub: '+12% vs avg', color: '#8B5CF6' },
    { label: 'Sentiment Score', value: '72/100', sub: 'Positive trend', color: '#F1C40F' },
  ],
  platforms: [
    { name: 'X / Twitter', emoji: '🐦', followersNum: 124000, followersLabel: '124k', growthPct: 8, engRate: 5.1, bestReach: 88000, bestPost: 'Live thread — Eastcliff Town (A)', weeklyGrowth: '+840', bestTime: '12:30pm' },
    { name: 'Instagram', emoji: '📸', followersNum: 89000, followersLabel: '89k', growthPct: 12, engRate: 4.8, bestReach: 64000, bestPost: 'New home kit launch', weeklyGrowth: '+620', bestTime: '6:00pm' },
    { name: 'Facebook', emoji: '📘', followersNum: 42000, followersLabel: '42k', growthPct: 4, engRate: 2.1, bestReach: 22000, bestPost: 'Full-time result post', weeklyGrowth: '+180', bestTime: '9:00am' },
    { name: 'YouTube', emoji: '▶️', followersNum: 18000, followersLabel: '18k', growthPct: 14, engRate: 6.2, bestReach: 31000, bestPost: 'Player profile — Morris', weeklyGrowth: '+340', bestTime: '2:00pm' },
    { name: 'LinkedIn', emoji: '💼', followersNum: 8000, followersLabel: '8k', growthPct: 6, engRate: 3.4, bestReach: 9000, bestPost: 'Community foundation update', weeklyGrowth: '+90', bestTime: '8:00am' },
    { name: 'TikTok', emoji: '🎵', followersNum: 3000, followersLabel: '3k', growthPct: 41, engRate: 8.7, bestReach: 52000, bestPost: 'Behind the scenes reel', weeklyGrowth: '+420', bestTime: '7:00pm' },
  ],
  growth: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], followers: [210000, 225000, 238000, 245000, 258000, 265000, 272000, 278000, 284000], engagement: [3.5, 3.7, 3.9, 4.0, 4.1, 4.0, 4.2, 4.1, 4.2], min: 200000, max: 290000, engMin: 3.0, engMax: 5.0 },
  growthCaption: '210k Aug → 284k Apr (+35%)',
  bestPosts: [
    { platform: 'X', reach: '88k', eng: '5.1%', desc: 'Live thread — Eastcliff Town (4–0)', date: '22 Mar' },
    { platform: 'Instagram', reach: '64k', eng: '4.8%', desc: 'New home kit launch reveal', date: '5 Apr' },
    { platform: 'TikTok', reach: '52k', eng: '8.7%', desc: 'Behind the scenes — matchday prep', date: '18 Feb' },
    { platform: 'YouTube', reach: '31k', eng: '6.2%', desc: 'Player profile — Morris ep3', date: '1 Mar' },
    { platform: 'Facebook', reach: '22k', eng: '2.1%', desc: 'Promotion run-in graphic', date: '8 Mar' },
  ],
  pillars: [
    { day: 'Mon', theme: 'Training insights', icon: '⚽', pl: 'TikTok · Stories' },
    { day: 'Wed', theme: 'Player spotlight', icon: '⭐', pl: 'TikTok · IG' },
    { day: 'Fri', theme: 'Match preview', icon: '🎯', pl: 'All platforms' },
    { day: 'Sat', theme: 'Match day', icon: '🔴', pl: 'Live — all' },
  ],
  scheduled: [
    { date: 'Thu 10 Apr', time: '18:00', platform: 'Instagram', type: 'Match preview', caption: 'Saturday. Oakridge. Northgate. 🔵 #EFL', status: 'Scheduled', reach: '~32k' },
    { date: 'Fri 11 Apr', time: '12:00', platform: 'TikTok', type: 'Player spotlight', caption: 'Meet our keeper Jordan Hayes 🧤', status: 'Draft', reach: '~40k' },
    { date: 'Sat 12 Apr', time: '11:30', platform: 'Instagram', type: 'Matchday hype', caption: 'Game day. Come on you Oaks! 🔵', status: 'Scheduled', reach: '~45k' },
    { date: 'Sat 12 Apr', time: '14:31', platform: 'X', type: 'Live thread', caption: 'KO: live match updates 🔴', status: 'Scheduled', reach: '~12k' },
    { date: 'Sat 12 Apr', time: '17:00', platform: 'TikTok', type: 'Post-match reel', caption: 'Highlights + player reactions 🎬', status: 'Needs approval', reach: '~60k' },
    { date: 'Mon 14 Apr', time: '10:00', platform: 'YouTube', type: 'Behind the season', caption: 'Episode 7 — the run-in 🎙️', status: 'In edit', reach: '~18k' },
    { date: 'Wed 16 Apr', time: '14:00', platform: 'Instagram', type: 'Community', caption: 'Foundation schools programme 🤝', status: 'Draft', reach: '~30k' },
  ],
  mentions: [
    { user: '@OakridgeFan92', time: '2 min ago', content: 'Great performance from Oakridge FC last night! Morris was incredible ⚽🔥', likes: 847, sentiment: 'positive' },
    { user: '@SportsBlogger', time: '15 min ago', content: 'Hearing Oakridge FC are close to signing a new winger — big move if true 👀', likes: 234, sentiment: 'neutral' },
    { user: '@LocalFan', time: '32 min ago', content: 'Season ticket renewed. Can’t wait for Saturday. Come on Oakridge! 🔵', likes: 45, sentiment: 'positive' },
    { user: '@EFLNews', time: '1 hr ago', content: 'Oakridge FC move up to 6th after beating Eastcliff Town. Promotion push on.', likes: 1240, sentiment: 'positive' },
    { user: '@TacticsBoard', time: '2 hrs ago', content: 'Porter’s pass map vs Eastcliff was elite. 92% accuracy, 4 key passes.', likes: 312, sentiment: 'positive' },
    { user: '@DisappointedFan', time: '3 hrs ago', content: 'Still think we need a proper left-back for a promotion run.', likes: 89, sentiment: 'negative' },
    { user: '@YouthFootball', time: '4 hrs ago', content: 'Academy player (17) training with the Oakridge first team today. One to watch 🌟', likes: 567, sentiment: 'positive' },
    { user: '@TransferWatch', time: '5 hrs ago', content: 'Oakridge FC have reportedly tracked a League One winger. Clubs circling.', likes: 1890, sentiment: 'neutral' },
  ],
  sentiment: [
    { label: 'Positive', v: 68, color: '#22C55E' }, { label: 'Neutral', v: 22, color: '#F59E0B' }, { label: 'Negative', v: 10, color: '#EF4444' },
  ],
}

export default function FootballSocialMediaView() {
  return <SocialMediaHub accent="#003DA5" profile={MENS} />
}
