#!/usr/bin/env python3
"""Apply surgical performance optimizations to CRMView.tsx"""
import sys

path = 'src/components/demo/CRMView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

changes = 0

# 1. Add memo to import
old = "import React, { useState, useMemo, useEffect } from 'react'"
new = "import React, { useState, useMemo, useEffect, memo } from 'react'"
if old in c:
    c = c.replace(old, new); changes += 1

# 2. Move heatIcon/heatLabel outside component
heat_funcs = "\nconst heatIcon = (h: string) => h === 'hot' ? '\U0001f534' : h === 'warm' ? '\U0001f7e1' : h === 'cold' ? '\U0001f535' : '\u26a0\ufe0f'\nconst heatLabel = (h: string) => h === 'hot' ? 'Hot' : h === 'warm' ? 'Warm' : h === 'cold' ? 'Cold' : 'At Risk'\n"
marker = "const PROMPT_CHIPS = ['Which deals are at risk?', 'Forecast this quarter', 'Who needs follow-up?', 'Show pipeline health', 'Best lead sources']"
if marker in c:
    c = c.replace(marker, marker + heat_funcs); changes += 1

# Remove from inside component
inside_heat = "  const heatIcon = (h: string) => h === 'hot' ? '\U0001f534' : h === 'warm' ? '\U0001f7e1' : h === 'cold' ? '\U0001f535' : '\u26a0\ufe0f'\n  const heatLabel = (h: string) => h === 'hot' ? 'Hot' : h === 'warm' ? 'Warm' : h === 'cold' ? 'Cold' : 'At Risk'\n\n"
if inside_heat in c:
    c = c.replace(inside_heat, ''); changes += 1

# 3. Wire up skeleton with ready state
skel_marker = "      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 DASHBOARD \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}"
if skel_marker in c and '{!ready && <CRMSkeleton />}' not in c:
    c = c.replace(skel_marker, "      {!ready && <CRMSkeleton />}\n\n" + skel_marker); changes += 1

# Add ready && guard to each tab
for tab in ['dashboard', 'pipeline', 'contacts', 'intelligence', 'reports']:
    old_guard = "{crmTab === '" + tab + "' && ("
    new_guard = "{ready && crmTab === '" + tab + "' && ("
    if old_guard in c and new_guard not in c:
        c = c.replace(old_guard, new_guard); changes += 1

# 4. Use CRM_TABS constant in render
old_tabs = "({[['dashboard', 'Dashboard'], ['pipeline', 'Pipeline'], ['contacts', 'Contacts'], ['intelligence', 'ARIA Intelligence'], ['reports', 'Reports']] as const)"
new_tabs = "(CRM_TABS"
if old_tabs in c:
    c = c.replace(old_tabs, new_tabs); changes += 1

# 5. Memoize filteredContacts
old_fc = "  const filteredContacts = contactFilter === 'All' ? contacts : contacts.filter(c => {"
new_fc = "  const filteredContacts = useMemo(() => contactFilter === 'All' ? contacts : contacts.filter(c => {"
if old_fc in c and new_fc not in c:
    c = c.replace(old_fc, new_fc); changes += 1
    c = c.replace("    return true\n  })", "    return true\n  }), [contactFilter, contacts])"); changes += 1

# 6. Replace inline chart data in Dashboard with module constants
replacements = [
    ('<BarChart data={revenueData}', '<BarChart data={REVENUE_DATA}'),
    ('data={winLossData} dataKey="value"', 'data={WIN_LOSS_DATA} dataKey="value"'),
    ('{winLossData.map(d =>', '{WIN_LOSS_DATA.map(d =>'),
    ('{winLossData.map((d, i) => <Cell key={i} fill={d.color} />)}', '{WIN_LOSS_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}'),
    ('<LineChart data={velocityData}>', '<LineChart data={VELOCITY_DATA}>'),
    ('<BarChart data={leadSourceData}', '<BarChart data={LEAD_SOURCE_DATA}'),
]
for old_r, new_r in replacements:
    if old_r in c:
        c = c.replace(old_r, new_r); changes += 1

# Remove unused local chart data vars
local_charts = """  // Chart data
  const revenueData = [{ month: 'Jan', actual: 34200, target: 38000 }, { month: 'Feb', actual: 38900, target: 40000 }, { month: 'Mar', actual: 42800, target: 42000 }, { month: 'Apr', actual: 41200, target: 44000 }, { month: 'May', actual: 46300, target: 46000 }, { month: 'Jun', actual: 44800, target: 48000 }]
  const winLossData = [{ name: 'Price', value: 28, color: '#EF4444' }, { name: 'Competitor', value: 22, color: '#F59E0B' }, { name: 'Timing', value: 18, color: '#6B7280' }, { name: 'No Budget', value: 16, color: '#3B82F6' }, { name: 'Won', value: 16, color: '#22C55E' }]
  const velocityData = [{ month: 'Jan', days: 24 }, { month: 'Feb', days: 22 }, { month: 'Mar', days: 19 }, { month: 'Apr', days: 18 }, { month: 'May', days: 16 }, { month: 'Jun', days: 14 }]
  const leadSourceData = [{ source: 'Referral', pct: 34 }, { source: 'Inbound', pct: 24 }, { source: 'LinkedIn', pct: 18 }, { source: 'Partner', pct: 14 }, { source: 'Cold', pct: 10 }]
"""
if local_charts in c:
    c = c.replace(local_charts, ''); changes += 1

# 7. Replace inline data in Reports tab with module constants
roi_old = """<BarChart data={[{ source: 'Referral', rate: 42 }, { source: 'Inbound', rate: 28 }, { source: 'LinkedIn', rate: 18 }, { source: 'Partner', rate: 34 }, { source: 'Cold', rate: 8 }]}"""
roi_new = "<BarChart data={LEAD_ROI_DATA}"
if roi_old in c:
    c = c.replace(roi_old, roi_new); changes += 1

forecast_old = """<LineChart data={[{ w: 'W1', committed: 42000, bestCase: 52000, pipeline: 78000 }, { w: 'W4', committed: 48000, bestCase: 62000, pipeline: 85000 }, { w: 'W8', committed: 55000, bestCase: 74000, pipeline: 92000 }, { w: 'W12', committed: 62000, bestCase: 88000, pipeline: 98000 }]}>"""
forecast_new = "<LineChart data={FORECAST_DATA}>"
if forecast_old in c:
    c = c.replace(forecast_old, forecast_new); changes += 1

lost_old = """<Pie data={[{ name: 'Price', value: 8 }, { name: 'Competitor', value: 6 }, { name: 'Timing', value: 5 }, { name: 'No Budget', value: 4 }, { name: 'No Response', value: 3 }]}"""
lost_new = "<Pie data={LOST_DEAL_DATA}"
if lost_old in c:
    c = c.replace(lost_old, lost_new); changes += 1

colors_old = "{['#EF4444', '#F59E0B', '#6B7280', '#3B82F6', '#8B5CF6'].map((c, i) => <Cell key={i} fill={c} />)}"
colors_new = "{LOST_DEAL_COLORS.map((c, i) => <Cell key={i} fill={c} />)}"
if colors_old in c:
    c = c.replace(colors_old, colors_new); changes += 1

# Lost deal legend
legend_old = """{[{ n: 'Price', c: '#EF4444', v: 8 }, { n: 'Competitor', c: '#F59E0B', v: 6 }, { n: 'Timing', c: '#6B7280', v: 5 }, { n: 'No Budget', c: '#3B82F6', v: 4 }, { n: 'No Response', c: '#8B5CF6', v: 3 }].map(d => ("""
legend_new = "{LOST_DEAL_DATA.map((d, i) => ("
if legend_old in c:
    c = c.replace(legend_old, legend_new); changes += 1
    c = c.replace(
        """<span key={d.n} className="flex items-center gap-1 text-[10px]" style={{ color: '#6B7299' }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.c }} />{d.n} ({d.v})</span>""",
        """<span key={d.name} className="flex items-center gap-1 text-[10px]" style={{ color: '#6B7299' }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: LOST_DEAL_COLORS[i] }} />{d.name} ({d.value})</span>"""
    ); changes += 1

# Rep Performance table
rep_old = """                  {[
                    { name: 'Sophie Williams', closed: '\u00a328,400', wr: '34%', open: 8, avg: '\u00a34,200' },
                    { name: 'James Okafor', closed: '\u00a322,100', wr: '28%', open: 6, avg: '\u00a33,800' },
                    { name: 'Charlotte Davies', closed: '\u00a331,600', wr: '41%', open: 5, avg: '\u00a35,100' },
                    { name: 'Marcus Reid', closed: '\u00a318,900', wr: '22%', open: 9, avg: '\u00a32,900' },
                  ].map(r => ("""
rep_new = "                  {REP_DATA.map(r => ("
if rep_old in c:
    c = c.replace(rep_old, rep_new); changes += 1

# Competitor scorecard
comp_old = "{[{ f: 'AI Deal Scoring', l: '\u2705 ARIA', h: '\u274c', p: '\u274c', s: '\u26a0\ufe0f Einstein $$' }, { f: 'Auto-enrichment', l: '\u2705 Built-in', h: '\u26a0\ufe0f Add-on', p: '\u274c', s: '\u26a0\ufe0f Add-on' }, { f: 'Pipeline AI Chat', l: '\u2705 ARIA Chat', h: '\u274c', p: '\u274c', s: '\u274c' }, { f: 'Ghost Deal Detection', l: '\u2705', h: '\u274c', p: '\u274c', s: '\u274c' }, { f: 'Price (per seat)', l: '\u2705 Included', h: '\u26a0\ufe0f \u00a345+', p: '\u26a0\ufe0f \u00a315+', s: '\u26a0\ufe0f \u00a360+' }].map(r => ("
comp_new = "{COMPETITOR_ROWS.map(r => ("
if comp_old in c:
    c = c.replace(comp_old, comp_new); changes += 1

# 8. Wrap export in memo
if 'export default function CRMView(' in c:
    c = c.replace('export default function CRMView(', 'function CRMViewInner(')
    c = c.rstrip() + '\n\nexport default memo(CRMViewInner)\n'
    changes += 1

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print(f'Applied {changes} optimizations')
