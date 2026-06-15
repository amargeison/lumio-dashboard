'use client'

import SocialMediaHub, { type SocialProfile } from '@/components/social/SocialMediaHub'

const WOMENS: SocialProfile = {
  clubLine: 'Everything the world is saying about Oakridge Women FC',
  kpis: [
    { label: 'Total Followers', value: '42.8k', sub: '+37% this season', color: '#BE185D' },
    { label: 'Engagement Rate', value: '7.4%', sub: 'across platforms', color: '#22C55E' },
    { label: 'Posts this month', value: '14', sub: '4 pending approval', color: '#F59E0B' },
    { label: 'Best reach', value: '112k', sub: 'TikTok BTS', color: '#60A5FA' },
    { label: 'Mentions Today', value: '318', sub: '+9% vs avg', color: '#8B5CF6' },
    { label: 'Sentiment Score', value: '80/100', sub: 'Positive trend', color: '#EC4899' },
  ],
  platforms: [
    { name: 'Instagram', emoji: '📸', followersNum: 18400, followersLabel: '18.4k', growthPct: 22, engRate: 6.8, bestReach: 48000, bestPost: 'WSL 2 goal vs Glenmoor Wanderers W', weeklyGrowth: '+1.2k', bestTime: '6:00pm' },
    { name: 'TikTok', emoji: '🎵', followersNum: 14200, followersLabel: '14.2k', growthPct: 41, engRate: 9.2, bestReach: 112000, bestPost: 'Behind the scenes reel', weeklyGrowth: '+2.1k', bestTime: '7:00pm' },
    { name: 'X / Twitter', emoji: '🐦', followersNum: 7600, followersLabel: '7.6k', growthPct: 8, engRate: 3.1, bestReach: 22000, bestPost: 'Matchday thread', weeklyGrowth: '+340', bestTime: '12:30pm' },
    { name: 'YouTube', emoji: '▶️', followersNum: 2600, followersLabel: '2.6k', growthPct: 14, engRate: 4.7, bestReach: 8400, bestPost: 'Player profile ep4', weeklyGrowth: '+180', bestTime: '2:00pm' },
  ],
  growth: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], followers: [31200, 33100, 35400, 36200, 36800, 38100, 39400, 41200, 42800], engagement: [4.2, 4.8, 5.1, 4.9, 5.8, 6.2, 6.8, 7.1, 7.4], min: 30000, max: 44000, engMin: 3.5, engMax: 8.5 },
  growthCaption: '31.2k Aug → 42.8k Apr (+37%)',
  bestPosts: [
    { platform: 'TikTok', reach: '112k', eng: '9.4%', desc: 'Behind the scenes — matchday prep', date: '18 Feb' },
    { platform: 'Instagram', reach: '48k', eng: '8.1%', desc: 'Goal vs Glenmoor Wanderers W — Priya Nair brace', date: '5 Apr' },
    { platform: 'X', reach: '22k', eng: '4.2%', desc: 'Live thread — Ridgefield Athletic Women (4–0)', date: '22 Mar' },
    { platform: 'TikTok', reach: '21k', eng: '11.2%', desc: 'Karen Carney welfare pledge', date: '8 Mar' },
    { platform: 'YouTube', reach: '8.4k', eng: '5.1%', desc: 'Player profile — Emma Clarke ep3', date: '1 Mar' },
  ],
  pillars: [
    { day: 'Mon', theme: 'Training insights', icon: '⚽', pl: 'TikTok · Stories' },
    { day: 'Wed', theme: 'Player spotlight', icon: '⭐', pl: 'TikTok · IG' },
    { day: 'Fri', theme: 'Match preview', icon: '🎯', pl: 'All platforms' },
    { day: 'Sat', theme: 'Match day', icon: '🔴', pl: 'Live — all' },
  ],
  scheduled: [
    { date: 'Thu 10 Apr', time: '18:00', platform: 'Instagram', type: 'Match preview', caption: 'Saturday. Oakridge. Castleton. 🏟️ #WSL2', status: 'Scheduled', reach: '~12k' },
    { date: 'Thu 10 Apr', time: '18:30', platform: 'X', type: 'Match preview', caption: 'Three points on the line. 💪', status: 'Scheduled', reach: '~3k' },
    { date: 'Fri 11 Apr', time: '12:00', platform: 'TikTok', type: 'Player spotlight', caption: 'Meet our GK Emma Clarke 🧤', status: 'Draft', reach: '~18k' },
    { date: 'Sat 12 Apr', time: '11:30', platform: 'Instagram', type: 'Matchday hype', caption: 'Game day. 🌸 Come on Oakridge!', status: 'Scheduled', reach: '~20k' },
    { date: 'Sat 12 Apr', time: '14:31', platform: 'X', type: 'Live thread', caption: 'KO: Live match updates 🔴', status: 'Scheduled', reach: '~6k' },
    { date: 'Sat 12 Apr', time: '17:00', platform: 'TikTok', type: 'Post-match reel', caption: 'Highlights + player reactions 🎬', status: 'Needs approval', reach: '~35k' },
    { date: 'Mon 14 Apr', time: '10:00', platform: 'YouTube', type: 'Behind the season', caption: 'Episode 7 — The April push 🎙️', status: 'In edit', reach: '~4k' },
    { date: 'Wed 16 Apr', time: '14:00', platform: 'Instagram', type: 'Welfare story', caption: 'How we’re leading on player welfare 💜', status: 'Draft', reach: '~22k' },
  ],
  mentions: [
    { user: '@OakridgeWomenFan', time: '4 min ago', content: 'Priya Nair brace! Oakridge Women on fire right now 🌸⚽', likes: 412, sentiment: 'positive' },
    { user: '@WSL2Watch', time: '20 min ago', content: 'Oakridge Women’s welfare standards are setting the bar in WSL 2. Brilliant to see.', likes: 268, sentiment: 'positive' },
    { user: '@LocalSupporter', time: '38 min ago', content: 'Attendance keeps climbing at Oakridge Women. Great atmosphere on Saturday.', likes: 96, sentiment: 'positive' },
    { user: '@WomensFooty', time: '1 hr ago', content: 'Hearing Oakridge Women could push for promotion this season. Watch this space 👀', likes: 540, sentiment: 'neutral' },
    { user: '@CriticalFan', time: '3 hrs ago', content: 'Need more consistency away from home if we want to go up.', likes: 74, sentiment: 'negative' },
    { user: '@AcademyScout', time: '4 hrs ago', content: 'Oakridge Women’s academy producing real talent — one to follow this year 🌟', likes: 301, sentiment: 'positive' },
  ],
  sentiment: [
    { label: 'Positive', v: 72, color: '#22C55E' }, { label: 'Neutral', v: 20, color: '#F59E0B' }, { label: 'Negative', v: 8, color: '#EF4444' },
  ],
}

export default function WomensSocialMediaView() {
  return <SocialMediaHub accent="#BE185D" profile={WOMENS} />
}
