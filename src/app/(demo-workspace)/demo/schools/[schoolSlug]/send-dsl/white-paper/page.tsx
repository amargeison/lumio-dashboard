'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, BookOpen, Download, Search, X, ArrowUp, ExternalLink, CheckCircle, Clock, AlertTriangle, Star, Users, Building2, Heart, FileText, Zap } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Section {
  id: string
  number: string
  title: string
  tag?: string
  tagColor?: string
  content: React.ReactNode
}

interface Chapter {
  id: string
  number: string
  title: string
  color: string
  icon: React.ReactNode
  sections: Section[]
}

// ─── Shared components ────────────────────────────────────────────────────────
function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-4" style={{ color: '#D1D5DB' }}>{children}</p>
}

function Bold({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: '#F9FAFB' }}>{children}</strong>
}

function Highlight({ children, color = '#0D9488' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
      {children}
    </span>
  )
}

function CalloutBox({ title, children, color = '#0D9488', icon }: {
  title: string; children: React.ReactNode; color?: string; icon?: React.ReactNode
}) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}30` }}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span style={{ color }}>{icon}</span>}
        <p className="text-sm font-bold" style={{ color }}>{title}</p>
      </div>
      <div className="text-sm" style={{ color: '#D1D5DB' }}>{children}</div>
    </div>
  )
}

function StatRow({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
      {items.map(item => (
        <div key={item.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
          <p className="text-xl font-black mb-1" style={{ color: item.color ?? '#0D9488' }}>{item.value}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}

function BulletList({ items, color = '#0D9488' }: { items: string[]; color?: string }) {
  return (
    <ul className="mb-4 flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#D1D5DB' }}>
          <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Timeline({ items }: { items: { date: string; label: string; done?: boolean; current?: boolean }[] }) {
  return (
    <div className="flex flex-col gap-0 mb-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{
              backgroundColor: item.done ? '#22C55E' : item.current ? '#0D9488' : '#374151',
              border: item.current ? '2px solid #0D9488' : 'none'
            }} />
            {i < items.length - 1 && <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#1F2937', minHeight: 24 }} />}
          </div>
          <div className="pb-4">
            <p className="text-xs font-bold" style={{ color: item.done ? '#22C55E' : item.current ? '#0D9488' : '#9CA3AF' }}>{item.date}</p>
            <p className="text-sm" style={{ color: '#D1D5DB' }}>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TierCard({ tier, label, desc, examples, color }: {
  tier: string; label: string; desc: string; examples: string[]; color: string
}) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: '#0A0B11', border: `1px solid ${color}40` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ backgroundColor: `${color}20`, color }}>{tier}</span>
        <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{label}</p>
      </div>
      <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{desc}</p>
      <div className="flex flex-wrap gap-1">
        {examples.map(e => (
          <span key={e} className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>{e}</span>
        ))}
      </div>
    </div>
  )
}

// ─── White Paper Content ──────────────────────────────────────────────────────

const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    number: 'Introduction',
    title: 'Every Child Achieving and Thriving',
    color: '#0D9488',
    icon: <BookOpen size={16} />,
    sections: [
      {
        id: 'intro-foreword',
        number: '0.1',
        title: 'Ministerial Foreword',
        content: (
          <>
            <Para>
              <Bold>Every child deserves to achieve and thrive.</Bold> For too long, children and young people with special educational needs and disabilities (SEND) have faced a system that is inconsistent, overstretched, and in too many cases, failing them. This White Paper sets out our plan to change that — fundamentally and permanently.
            </Para>
            <Para>
              The challenges are real. The SEND system costs local authorities in England over <Bold>£10.6 billion per year</Bold>, yet too many children and families report feeling unsupported, unheard, and let down. The number of Education, Health and Care Plans (EHCPs) has risen by <Bold>140% in the last decade</Bold>, whilst too many children with SEND receive provision that is neither adequate nor timely.
            </Para>
            <CalloutBox title="Our Commitment" color="#0D9488" icon={<Star size={14} />}>
              <Para>We are committed to a SEND system that works for every child — one that identifies needs early, provides consistent high-quality support in mainstream settings where appropriate, and ensures that the most complex needs are met with specialist provision. This is not a vision for the future. Implementation begins now.</Para>
            </CalloutBox>
            <Para>
              This White Paper delivers on our manifesto commitment to reform SEND. It builds on the SEND and AP Improvement Plan (2023) and goes further — setting out the legislative, funding and structural changes needed to create a genuinely inclusive education system fit for the 21st century.
            </Para>
          </>
        )
      },
      {
        id: 'intro-context',
        number: '0.2',
        title: 'The Current System — What We Know',
        content: (
          <>
            <StatRow items={[
              { label: 'Pupils with SEND (England)', value: '1.6m', color: '#8B5CF6' },
              { label: 'EHCPs issued (2024)', value: '576k', color: '#EF4444' },
              { label: 'Annual SEND system cost', value: '£10.6bn', color: '#F59E0B' },
            ]} />
            <Para>
              The independent review of SEND (2022) found <Bold>pervasive, systemic problems</Bold> across the SEND and AP system: children's needs are being identified too late; mainstream schools lack the skills and confidence to support pupils with SEND effectively; EHCPs are being applied for unnecessarily because families have no confidence in SEN Support; and the system is characterised by conflict rather than partnership.
            </Para>
            <CalloutBox title="Key Findings — What Families Tell Us" color="#EF4444" icon={<AlertTriangle size={14} />}>
              <BulletList color="#EF4444" items={[
                "72% of parents say the EHCP process is stressful and adversarial",
                "Only 44% of parents feel their child's school understands their child's needs",
                "Average wait time for an EHCP assessment is 37 weeks — statutory maximum is 20",
                "1 in 3 EHCP decisions are appealed to SEND Tribunal; 96% of appeals are upheld",
                "Children from deprived backgrounds wait longer for diagnosis and support",
                "Black and mixed-heritage children are significantly over-represented in exclusions and under-represented in EHCP provision",
              ]} />
            </CalloutBox>
            <Para>
              The system is not working. The cost is unsustainable. And the outcomes — academically, socially and emotionally — are not good enough. <Bold>This White Paper is the response.</Bold>
            </Para>
          </>
        )
      }
    ]
  },
  {
    id: 'chapter1',
    number: 'Chapter 1',
    title: 'A New Framework: The Three-Tier Model',
    color: '#8B5CF6',
    icon: <Building2 size={16} />,
    sections: [
      {
        id: 'ch1-model',
        number: '1.1',
        title: 'The Three-Tier Model of Support',
        tag: 'Statutory from Sept 2026',
        tagColor: '#8B5CF6',
        content: (
          <>
            <Para>
              The centrepiece of this White Paper is a <Bold>new three-tier model of support</Bold> that replaces the previous two-tier approach (SEN Support and EHCP). The new model provides a clearer, more proportionate framework for identifying and meeting SEND needs — reducing the pressure on EHCPs whilst ensuring no child falls through the gaps.
            </Para>
            <TierCard
              tier="Tier 1"
              label="Universal"
              color="#22C55E"
              desc="High-quality, inclusive teaching for all pupils. Schools meet the needs of the majority of pupils with SEND through Quality First Teaching, differentiation and reasonable adjustments. No referral or formal plan required."
              examples={['Adaptive teaching', 'Classroom adjustments', 'Universal strategies', 'Wave 1 provision', 'Reasonable adjustments']}
            />
            <TierCard
              tier="Tier 2"
              label="Targeted"
              color="#F59E0B"
              desc="Additional, targeted support for pupils whose needs require more than universal provision. Delivered through an Individual Support Plan (ISP) — the new statutory document replacing SEN Support plans."
              examples={['Individual Support Plan (ISP)', 'Small group interventions', 'TA support', 'SALT / EP input', 'Parental involvement', 'Regular review']}
            />
            <TierCard
              tier="Tier 3"
              label="Specialist"
              color="#EF4444"
              desc="Highly specialist provision for pupils with the most complex, high-cost needs. Education, Health and Care Plans remain the statutory document for this tier. Reserved for those who cannot be fully supported through Tier 2."
              examples={['EHCP', 'Special school placement', 'Specialist unit', 'Residential provision', 'High-cost complex needs', 'Multi-agency EHCP']}
            />
            <CalloutBox title="What This Means for Schools" color="#8B5CF6" icon={<Building2 size={14} />}>
              <Para>All schools must implement the three-tier model and use it as the framework for identifying, planning and reviewing SEND provision. The model must be reflected in the school's SEND Information Report and Inclusion Strategy. Local Authorities will commission provision across all three tiers.</Para>
            </CalloutBox>
          </>
        )
      },
      {
        id: 'ch1-isp',
        number: '1.2',
        title: 'Individual Support Plans (ISPs) — New Statutory Requirement',
        tag: 'Statutory from Sept 2029',
        tagColor: '#EF4444',
        content: (
          <>
            <Para>
              The <Bold>Individual Support Plan (ISP)</Bold> is the new statutory document for Tier 2 pupils. It replaces the existing patchwork of SEN Support plans, provision maps and individual education plans (IEPs). Every pupil on the SEND register at Tier 2 must have an ISP by September 2029.
            </Para>
            <CalloutBox title="What an ISP Must Contain" color="#0D9488" icon={<FileText size={14} />}>
              <BulletList items={[
                "The pupil's strengths, interests and what makes them unique (pupil voice, written in accessible language)",
                "Identified areas of SEND need, mapped to the four broad areas (SEMH, SLCN, Cognition & Learning, Sensory & Physical)",
                "Current attainment, progress and attendance data",
                "Specific, measurable outcomes — what the child should achieve and by when",
                "Provision to be put in place: in-class strategies, interventions, TA support, external agency input",
                "Who is responsible for each element of provision",
                "How and when the plan will be reviewed (minimum termly)",
                "Parent and carer contribution — their views, aspirations and concerns",
                "Pupil voice — the child's own views, in their own words where possible",
                "Any linked health or care plans (where a child has additional health or social care needs)",
              ]} />
            </CalloutBox>
            <Para>
              ISPs must be reviewed at minimum <Bold>termly</Bold>, using the Assess-Plan-Do-Review cycle. Parents and pupils must be involved in every review. Schools must keep a complete, dated record of all reviews.
            </Para>
            <CalloutBox title="Timeline for ISP Implementation" color="#F59E0B" icon={<Clock size={14} />}>
              <Timeline items={[
                { date: 'September 2026', label: 'ISP guidance and statutory templates published by DfE', done: true },
                { date: 'April 2027', label: 'All new Tier 2 pupils to receive ISP (not retrospective)', current: true },
                { date: 'September 2027', label: 'All existing Tier 2 pupils to be assessed for ISP transition' },
                { date: 'September 2028', label: 'Phase 2 schools — all Tier 2 pupils to have ISP in place' },
                { date: 'September 2029', label: 'Full statutory requirement — ALL Tier 2 pupils must have ISP' },
              ]} />
            </CalloutBox>
            <Para>
              <Bold>Penalty for non-compliance:</Bold> From September 2029, schools that cannot demonstrate ISPs are in place for all Tier 2 pupils will be flagged in Ofsted inspections under the new Inclusion evaluation area. This may affect the school's Ofsted report card rating for Inclusion.
            </Para>
          </>
        )
      },
      {
        id: 'ch1-ehcp',
        number: '1.3',
        title: 'EHCP Reform — Streamlining the Statutory Process',
        content: (
          <>
            <Para>
              Education, Health and Care Plans remain the statutory document for Tier 3 pupils, but are being fundamentally reformed to address the delays, inconsistencies and adversarial processes that have characterised the system.
            </Para>
            <StatRow items={[
              { label: 'Statutory assessment deadline', value: '20 weeks', color: '#0D9488' },
              { label: 'Target compliance (2027)', value: '85%', color: '#22C55E' },
              { label: 'Current national compliance', value: '49%', color: '#EF4444' },
            ]} />
            <CalloutBox title="Key EHCP Reforms" color="#0D9488">
              <BulletList items={[
                "20-week statutory deadline to be enforced through new DfE compliance monitoring — LAs missing deadline for more than 15% of cases will face intervention",
                "Standardised national EHCP template to ensure consistency across all 151 LAs",
                "Digital EHCP portal — families can track progress of their application in real time",
                "Annual review to include pupil voice as a mandatory, named section",
                "Co-production requirement strengthened — families must be genuine partners in the EHCP process, not passive recipients",
                "Mediation before Tribunal — mandatory mediation step before any SEND Tribunal appeal",
                "Right to a named school — families' preference for a specific school must be given greater weight",
                "Transition planning strengthened — EHCP transition to adulthood must begin at Year 9 (age 13-14)",
              ]} />
            </CalloutBox>
          </>
        )
      }
    ]
  },
  {
    id: 'chapter2',
    number: 'Chapter 2',
    title: 'Inclusion Strategy & National Standards',
    color: '#F59E0B',
    icon: <Heart size={16} />,
    sections: [
      {
        id: 'ch2-inclusion',
        number: '2.1',
        title: 'National Inclusion Standards',
        tag: 'New for 2026',
        tagColor: '#F59E0B',
        content: (
          <>
            <Para>
              For the first time, the government is setting <Bold>National Inclusion Standards</Bold> — a clear, consistent framework that defines what inclusive education looks like in practice. Every school in England must publish an <Bold>Inclusion Strategy</Bold> by September 2026, demonstrating how they meet these standards.
            </Para>
            <CalloutBox title="The 8 National Inclusion Standards" color="#F59E0B" icon={<Star size={14} />}>
              <div className="flex flex-col gap-2">
                {[
                  { num: '1', title: 'Inclusive Leadership', desc: 'The headteacher and governing body actively champion inclusion and it is embedded in the school improvement plan and ethos' },
                  { num: '2', title: 'Adaptive Teaching', desc: 'All teachers can adapt their teaching for pupils with SEND, supported by ongoing CPD and coaching' },
                  { num: '3', title: 'Identification & Assessment', desc: 'The school has robust systems for the early identification of SEND needs, including for pupils with EAL, and acts quickly' },
                  { num: '4', title: 'ISP / Provision Quality', desc: 'Individual Support Plans are of high quality, reviewed termly, and inform teaching and TA deployment' },
                  { num: '5', title: 'TA Deployment', desc: 'Teaching assistants are deployed strategically, trained for their role, and their impact is measured' },
                  { num: '6', title: 'Family Partnership', desc: 'Families are genuine partners in the school\'s SEND provision — early, meaningful and ongoing engagement' },
                  { num: '7', title: 'Pupil Voice', desc: 'Pupils with SEND have a meaningful voice in their own support planning and in wider school decisions' },
                  { num: '8', title: 'Transition & Progression', desc: 'Effective transition planning at all key points (EYFS entry, primary-secondary, post-16) is in place for all SEND pupils' },
                ].map(s => (
                  <div key={s.num} className="flex items-start gap-3 rounded-lg p-2" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>{s.num}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{s.title}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CalloutBox>
          </>
        )
      },
      {
        id: 'ch2-strategy',
        number: '2.2',
        title: 'School Inclusion Strategy — What Must Be Published',
        tag: 'By Sept 2026',
        tagColor: '#F59E0B',
        content: (
          <>
            <Para>
              Every school must publish an <Bold>Inclusion Strategy</Bold> on its website by 30 September 2026. This is a statutory requirement. The Inclusion Strategy must be reviewed annually and presented to the governing body / trust board.
            </Para>
            <CalloutBox title="Required Contents of the Inclusion Strategy" color="#F59E0B" icon={<FileText size={14} />}>
              <BulletList items={[
                "The school's vision and values for inclusion",
                "How the school implements the three-tier model",
                "The process for identifying and assessing SEND needs (graduated approach)",
                "How ISPs are developed, monitored and reviewed",
                "How the school deploys teaching assistants and specialist staff",
                "How the school works in partnership with families",
                "How the school works with external agencies (CAMHS, EP, SALT, OT)",
                "Outcomes data for SEND pupils (attendance, exclusions, attainment progress)",
                "The school's approach to pupil voice in SEND provision",
                "Named SENCO and how to contact them",
                "Accessibility plan (how the school meets the needs of pupils with physical and sensory needs)",
                "How the school uses its SEND funding (notional SEND budget, EHCP funding, PP+)",
              ]} />
            </CalloutBox>
            <Para>
              The Inclusion Strategy is distinct from the SEND Information Report (which remains a legal requirement under the Children and Families Act 2014). Schools must publish both. From September 2027, Ofsted will inspect the Inclusion Strategy as part of the new <Bold>Inclusion evaluation area</Bold> under the 2025 Education Inspection Framework.
            </Para>
          </>
        )
      },
      {
        id: 'ch2-ofsted',
        number: '2.3',
        title: 'Ofsted 2025 — Inclusion as a Standalone Evaluation Area',
        tag: 'From Sept 2025',
        tagColor: '#EF4444',
        content: (
          <>
            <Para>
              The Ofsted 2025 Education Inspection Framework introduces <Bold>Inclusion as the 5th standalone evaluation area</Bold>, replacing the previous approach where SEND was assessed within 'Quality of Education'. This change reflects the government's view that inclusion is not an add-on to education — it is central to it.
            </Para>
            <CalloutBox title="What Ofsted Will Inspect Under Inclusion" color="#EF4444" icon={<CheckCircle size={14} />}>
              <BulletList color="#EF4444" items={[
                "The quality and implementation of the school's Inclusion Strategy",
                "Whether the three-tier model is consistently applied",
                "The quality of ISPs — are they detailed, reviewed termly, and do they inform teaching?",
                "How well TAs are deployed and trained",
                "Whether families feel genuinely involved in their child's SEND provision",
                "Outcomes for SEND pupils — attendance, exclusions, attainment, destinations",
                "How the school identifies and responds to SEND needs early",
                "Whether EHCP review deadlines are being met (for schools with EHCP pupils)",
                "The accessibility of the school environment",
                "How the school uses specialist services and external agencies",
              ]} />
            </CalloutBox>
            <Para>
              Inclusion is rated on the <Bold>5-point scale</Bold> used for all evaluation areas in the new framework: 1 (Unsatisfactory), 2 (Requires Improvement), 3 (Developing), 4 (Good), 5 (Outstanding). Schools rated 1 or 2 for Inclusion will receive a specific action plan requirement and an early follow-up monitoring visit.
            </Para>
          </>
        )
      }
    ]
  },
  {
    id: 'chapter3',
    number: 'Chapter 3',
    title: 'Funding: The Inclusive Mainstream Fund & Experts at Hand',
    color: '#22C55E',
    icon: <Zap size={16} />,
    sections: [
      {
        id: 'ch3-imf',
        number: '3.1',
        title: 'The Inclusive Mainstream Fund (IMF) — £1.6 Billion',
        tag: '£1.6bn committed',
        tagColor: '#22C55E',
        content: (
          <>
            <Para>
              The government is investing <Bold>£1.6 billion</Bold> in the new <Bold>Inclusive Mainstream Fund (IMF)</Bold> over three years. This is the largest single investment in SEND in mainstream education in a generation. The IMF replaces the existing SEND Improvement Fund and is designed to build the capacity of mainstream schools to meet a wider range of needs without resorting to specialist placements or EHCPs.
            </Para>
            <StatRow items={[
              { label: 'Total IMF investment', value: '£1.6bn', color: '#22C55E' },
              { label: 'Years of investment', value: '3 years', color: '#0D9488' },
              { label: 'Schools eligible', value: 'All state schools', color: '#F59E0B' },
            ]} />
            <CalloutBox title="What the IMF Funds" color="#22C55E" icon={<CheckCircle size={14} />}>
              <BulletList color="#22C55E" items={[
                "CPD for all teachers in adaptive teaching, SEND identification and SEND strategies (mandatory for all schools)",
                "SENCO workforce development — funding for NASENCO qualification and specialist SENCO CPD",
                "TA training — structured CPD programmes for teaching assistants supporting SEND pupils",
                "Specialist equipment and resources for pupils with sensory and physical needs",
                "School-based therapy — funding for SALT, OT and EP hours in mainstream schools",
                "Universal SEND toolkit — schools to receive a funded assessment and implementation plan",
                "Peer network funding — schools to establish SEND peer learning networks regionally",
                "Data systems — investment in school-level SEND data infrastructure",
              ]} />
            </CalloutBox>
            <Para>
              Funding is allocated via Local Authorities to schools in two streams: a <Bold>universal allocation</Bold> (all schools) and a <Bold>targeted allocation</Bold> (schools with higher proportions of SEND pupils or in areas of identified need). Schools in areas of highest deprivation receive enhanced rates.
            </Para>
          </>
        )
      },
      {
        id: 'ch3-eah',
        number: '3.2',
        title: "Experts at Hand Programme — £1.8 Billion",
        tag: '£1.8bn new funding',
        tagColor: '#8B5CF6',
        content: (
          <>
            <Para>
              The <Bold>Experts at Hand</Bold> programme is a new national service providing rapid, school-based access to specialist professionals for children and young people with SEND. It addresses the catastrophic waits children face for CAMHS, Speech and Language Therapy (SALT) and Educational Psychology (EP) — the three most frequently cited gaps in the SEND system.
            </Para>
            <CalloutBox title="Experts at Hand: What Schools Will Receive" color="#8B5CF6" icon={<Users size={14} />}>
              <BulletList color="#8B5CF6" items={[
                "Named Educational Psychologist for every school — minimum 2 days per half term of EP time allocated to the school",
                "SALT hub schools — 1,500 schools designated as SALT hubs with an embedded speech and language therapist",
                "CAMHS link worker in every school — a named NHS mental health link worker for every school by 2028",
                "Rapid assessment pathway — 8-week maximum wait for initial specialist assessment for Tier 2 pupils",
                "School-based therapy — therapy delivered in school, during the school day, rather than requiring children to travel to clinic",
                "Joint training — specialists to provide CPD to school staff as part of their school commitment",
                "Digital consultancy — video consultation for specialists to advise schools on specific pupils without requiring a visit",
              ]} />
            </CalloutBox>
            <Para>
              The Experts at Hand programme is the government's direct response to evidence that 40-60% of children referred to CAMHS in England wait over 18 weeks for treatment, and that 1 in 3 children with communication needs receive no speech and language therapy during their school years.
            </Para>
            <CalloutBox title="Rollout Timeline" color="#F59E0B" icon={<Clock size={14} />}>
              <Timeline items={[
                { date: 'September 2026', label: 'Phase 1: 5,000 schools receive named EP allocation. SALT hubs in 500 schools.', done: true },
                { date: 'April 2027', label: 'Phase 1 CAMHS link workers deployed to 3,000 pilot schools', current: true },
                { date: 'September 2027', label: 'Phase 2: National rollout — all schools receive EP allocation. 1,000 SALT hubs.' },
                { date: 'September 2028', label: 'Named CAMHS link worker for every school in England (17,000+ schools)' },
                { date: 'September 2029', label: 'Full Experts at Hand programme operational across all schools' },
              ]} />
            </CalloutBox>
          </>
        )
      },
      {
        id: 'ch3-funding',
        number: '3.3',
        title: 'Notional SEND Budget & School Funding',
        content: (
          <>
            <Para>
              The existing system for funding SEND in mainstream schools — the <Bold>notional SEND budget</Bold> — is being reformed. Currently, schools are expected to fund the first <Bold>£6,000</Bold> of additional SEND support from their core budget (the "notional SEND budget") before the LA contributes through high-needs funding. This threshold is being reviewed and will change from April 2027.
            </Para>
            <StatRow items={[
              { label: 'Current school SEND threshold', value: '£6,000', color: '#F59E0B' },
              { label: 'Proposed new threshold', value: '£4,500', color: '#22C55E' },
              { label: 'Effective from', value: 'Apr 2027', color: '#0D9488' },
            ]} />
            <CalloutBox title="Pupil Premium Plus (PP+) — Enhanced for LAC pupils with SEND" color="#0D9488">
              <Para>The PP+ rate for Looked After Children (LAC) with SEND is being increased by £800 per pupil per year from April 2027. Schools must demonstrate that PP+ funding is specifically directed at the SEND-related barriers faced by LAC pupils, and this must be reflected in the Personal Education Plan (PEP).</Para>
            </CalloutBox>
          </>
        )
      }
    ]
  },
  {
    id: 'chapter4',
    number: 'Chapter 4',
    title: 'Workforce: SENCO, Teachers & Teaching Assistants',
    color: '#F97316',
    icon: <Users size={16} />,
    sections: [
      {
        id: 'ch4-senco',
        number: '4.1',
        title: 'The SENCO Role — Strengthened and Protected',
        content: (
          <>
            <Para>
              The <Bold>Special Educational Needs Coordinator (SENCO)</Bold> is the most important person in a school for children with SEND. Yet the role has been systematically overloaded, under-resourced and marginalised. This White Paper makes significant changes to how the SENCO role is defined, protected and resourced.
            </Para>
            <CalloutBox title="New SENCO Requirements from September 2026" color="#F97316" icon={<Star size={14} />}>
              <BulletList color="#F97316" items={[
                "All new SENCOs must be qualified teachers (closing the loophole that allows non-teachers to hold the role)",
                "All SENCOs must hold or be working towards the National Award for SEN Co-ordination (NASENCO) within 3 years of appointment",
                "In schools with 100+ pupils, the SENCO must be a member of the Senior Leadership Team",
                "SENCO protected time — schools must demonstrate that the SENCO has sufficient non-contact time to fulfil the role (DfE guidance: minimum 1 day per week in schools of 100+ pupils, scaling up with school size)",
                "SENCO must chair or co-chair SEND review meetings for all EHCP and Tier 2 pupils",
                "Trust SENCOs — MATs with 5+ schools must appoint a Trust SENCO Lead to provide cross-school oversight and CPD",
                "SENCO salary — DfE strongly recommends that SENCOs are paid on the leadership scale in schools of 200+ pupils",
              ]} />
            </CalloutBox>
            <Para>
              The <Bold>National SENCO Workload Survey (2024)</Bold> found that 74% of SENCOs report they do not have enough time to do their job effectively. 61% of SENCOs spend more than a quarter of their time on administration. This White Paper funds schools to implement protected SENCO time through the IMF.
            </Para>
          </>
        )
      },
      {
        id: 'ch4-teachers',
        number: '4.2',
        title: 'Teachers — Adaptive Teaching as Core Practice',
        content: (
          <>
            <Para>
              <Bold>Adaptive teaching</Bold> — the ability to adjust teaching in response to pupils' different starting points, needs and ways of learning — is being established as a core expectation for all teachers. This is not about creating separate resources for SEND pupils. It is about teachers having the knowledge and skills to meet the needs of all learners in their classroom.
            </Para>
            <CalloutBox title="New Teacher Standards — SEND Additions" color="#0D9488">
              <Para>The Teachers' Standards are being updated to include an explicit adaptive teaching standard. From September 2027, ITT providers must demonstrate how their programmes develop trainees' adaptive teaching skills. The Core Content Framework is being amended to include a substantial SEND module in all initial teacher training.</Para>
            </CalloutBox>
            <BulletList items={[
              "ECT induction to include structured SEND mentoring with a designated SENCO mentor",
              "All schools must include SEND CPD in their school development plan — minimum 3 hours per term of structured SEND CPD for all teaching staff",
              "Adaptive teaching to be inspected as part of the Quality of Education evaluation area from September 2027",
              "High-Needs Specialist Teacher qualification to be introduced — a Level 7 qualification for teachers specialising in specific areas of SEND",
            ]} />
          </>
        )
      },
      {
        id: 'ch4-ta',
        number: '4.3',
        title: 'Teaching Assistants — Strategic Deployment',
        content: (
          <>
            <Para>
              England employs over <Bold>280,000 teaching assistants</Bold> — more TAs per pupil than almost any other country in the OECD. Yet the evidence base consistently shows that TAs can have a neutral or even negative impact on pupil outcomes when deployed unsystematically (Blatchford, Webster, Russell 2012; EEF 2021). This White Paper addresses TA deployment directly.
            </Para>
            <CalloutBox title="New TA Deployment Requirements" color="#F97316" icon={<CheckCircle size={14} />}>
              <BulletList color="#F97316" items={[
                "Every school must have a written TA Deployment Policy showing how TAs are linked to specific ISPs and outcomes",
                "TA deployment must be reflected in each pupil's ISP — specifying the nature, frequency and purpose of TA support",
                "TAs must not routinely separate SEND pupils from their peers for extended periods — evidence-based structured interventions are encouraged",
                "TA training — all TAs supporting SEND pupils must complete a structured training programme (funded through IMF) covering: SEND categories, ISP implementation, communication strategies, safeguarding",
                "HLTA (Higher Level Teaching Assistant) role to be reformed with a new national framework and qualification structure",
                "TA impact — schools must track and report the impact of TA interventions on pupil outcomes, using the SEND data from their ISP reviews",
              ]} />
            </CalloutBox>
          </>
        )
      }
    ]
  },
  {
    id: 'chapter5',
    number: 'Chapter 5',
    title: 'Local Authorities, Families & Co-Production',
    color: '#06B6D4',
    icon: <Users size={16} />,
    sections: [
      {
        id: 'ch5-la',
        number: '5.1',
        title: 'Local Authority Reform',
        content: (
          <>
            <Para>
              Local Authorities hold statutory responsibility for SEND in their area. The 2022 SEND review found enormous inconsistency between LAs — in their interpretation of the law, their commissioning decisions, their assessment timescales and their approaches to families. This White Paper introduces a new <Bold>LA SEND Accountability Framework</Bold>.
            </Para>
            <CalloutBox title="LA SEND Accountability Framework — Key Measures" color="#06B6D4">
              <BulletList color="#06B6D4" items={[
                "Published league table of LA EHCP assessment timeliness — all LAs must publish their 20-week compliance rate quarterly",
                "DfE intervention threshold — LAs with below 70% 20-week compliance face mandatory improvement support",
                "LA SEND inspection — Ofsted and CQC to inspect LAs' SEND arrangements on a 5-year cycle",
                "Standardised EHCP template — all LAs must use the national template from April 2027",
                "Regional SEND hubs — 9 new regional hubs to provide specialist support, best practice sharing and SEND workforce development",
                "Inclusion commissioning duty — LAs must commission a range of Tier 2 provision to reduce unnecessary EHCPs",
                "Co-production duty — strengthened duty on LAs to co-produce their SEND strategy with families and young people",
              ]} />
            </CalloutBox>
          </>
        )
      },
      {
        id: 'ch5-families',
        number: '5.2',
        title: 'Family Rights & Co-Production',
        content: (
          <>
            <Para>
              Co-production — genuinely involving children, young people and families in decisions about their SEND provision — is a legal duty under the Children and Families Act 2014. In practice, it is frequently honoured in name only. <Bold>This White Paper strengthens the co-production duty and gives families new rights.</Bold>
            </Para>
            <CalloutBox title="New Family Rights from September 2026" color="#EF4444" icon={<Star size={14} />}>
              <BulletList color="#EF4444" items={[
                "Right to a keyworker — every family with a child in the EHCP process has the right to a named keyworker to guide them through the process",
                "Right to a translator — all EHCP documents must be available in the family's preferred language within 10 working days of request",
                "Right to an ISP review meeting — parents must be invited to and supported to attend every ISP review",
                "SEND Parent Advisory Service — new national service providing independent advocacy and advice to families navigating SEND",
                "SEND Tribunal reform — mandatory mediation before Tribunal; mediators trained to SEND specialisation; mediation costs paid by LA",
                "Right to see records — families have the right to view all school records relating to their child's SEND within 5 working days",
              ]} />
            </CalloutBox>
          </>
        )
      }
    ]
  },
  {
    id: 'chapter6',
    number: 'Chapter 6',
    title: 'Implementation: What Schools Must Do Now',
    color: '#0D9488',
    icon: <CheckCircle size={16} />,
    sections: [
      {
        id: 'ch6-phase1',
        number: '6.1',
        title: 'Phase 1: September 2026 — Immediate Requirements',
        tag: 'Act now',
        tagColor: '#EF4444',
        content: (
          <>
            <CalloutBox title="Phase 1 — What Schools Must Have in Place by September 2026" color="#EF4444" icon={<AlertTriangle size={14} />}>
              <div className="flex flex-col gap-2">
                {[
                  { item: 'Publish an Inclusion Strategy on the school website', statutory: true },
                  { item: 'Implement the three-tier model (Universal / Targeted / Specialist)', statutory: true },
                  { item: 'SENCO is a qualified teacher and member of SLT (in schools 100+ pupils)', statutory: true },
                  { item: 'SENCO NASENCO qualification pathway confirmed', statutory: true },
                  { item: 'Begin using ISP template for all new Tier 2 pupils', statutory: false },
                  { item: 'All staff receive Phase 1 SEND CPD (minimum 3 hours)', statutory: false },
                  { item: 'SEND Information Report updated to reference three-tier model', statutory: true },
                  { item: 'Apply for Inclusive Mainstream Fund allocation (via LA)', statutory: false },
                  { item: 'Register for Experts at Hand (EP and SALT) — via regional hub', statutory: false },
                  { item: 'Update TA deployment to reflect ISP-linked model', statutory: false },
                ].map(item => (
                  <div key={item.item} className="flex items-center gap-2">
                    <CheckCircle size={12} className="flex-shrink-0" style={{ color: '#22C55E' }} />
                    <p className="text-xs flex-1" style={{ color: '#D1D5DB' }}>{item.item}</p>
                    {item.statutory && <span className="text-xs px-1.5 rounded font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Statutory</span>}
                  </div>
                ))}
              </div>
            </CalloutBox>
          </>
        )
      },
      {
        id: 'ch6-timeline',
        number: '6.2',
        title: 'Full Implementation Timeline',
        content: (
          <>
            <Timeline items={[
              { date: 'Sept 2025', label: 'Ofsted 2025 EIF launches — Inclusion becomes 5th evaluation area. New report cards.', done: true },
              { date: 'Jan 2026', label: 'IMF funding guidance published. LA allocation letters to schools. Experts at Hand Phase 1 begins.', done: true },
              { date: 'Apr 2026', label: 'Phase 1 Experts at Hand: 5,000 schools receive named EP. Free breakfast clubs statutory.', current: true },
              { date: 'Sept 2026', label: 'Inclusion Strategy statutory requirement. Three-tier model must be implemented. National Inclusion Standards published.', current: true },
              { date: 'Apr 2027', label: 'ISP mandatory for ALL new Tier 2 pupils. Reduced SEND funding threshold (£4,500). SALT hubs Phase 2.', },
              { date: 'Sept 2027', label: 'Adaptive teaching added to Teachers Standards. LA standardised EHCP template mandatory. Ofsted inspect Inclusion Strategy.' },
              { date: 'Sept 2028', label: 'Phase 2 schools ISP transition complete. CAMHS link worker in every school. HLTA new framework launches.' },
              { date: 'Sept 2029', label: 'ISPs fully statutory for all Tier 2 pupils. Full Experts at Hand operational. LA SEND inspection cycle begins.' },
            ]} />
          </>
        )
      },
      {
        id: 'ch6-lumio',
        number: '6.3',
        title: 'How Lumio Supports White Paper Compliance',
        tag: 'Lumio feature',
        tagColor: '#0D9488',
        content: (
          <>
            <Para>
              Lumio Schools is designed to make White Paper compliance straightforward — not a burden. The platform's SEND & DSL module is built around the three-tier model, ISP requirements, and Ofsted Inclusion criteria.
            </Para>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { label: 'Three-Tier Dashboard', desc: 'Real-time view of all pupils by tier — Universal, Targeted (ISP), Specialist (EHCP)', color: '#8B5CF6' },
                { label: 'ISP Builder', desc: 'Statutory ISP template with termly review workflow, pupil voice section and parent sign-off', color: '#0D9488' },
                { label: 'EHCP 20-Week Tracker', desc: 'Countdown per pupil, statutory deadline alerts, LA submission tracking', color: '#EF4444' },
                { label: 'Inclusion Strategy Generator', desc: 'Auto-populates your Inclusion Strategy from your Lumio SEND data — publishable with one click', color: '#F59E0B' },
                { label: 'Experts at Hand Log', desc: 'Track EP, SALT, CAMHS and OT visits, recommendations and follow-up actions', color: '#22C55E' },
                { label: 'Ofsted Evidence Pack', desc: 'Instant Inclusion evidence pack — generates documentation mapped to all 10 Ofsted Inclusion criteria', color: '#F97316' },
              ].map(f => (
                <div key={f.label} className="rounded-xl p-3" style={{ backgroundColor: '#0A0B11', border: `1px solid ${f.color}30` }}>
                  <p className="text-xs font-bold mb-1" style={{ color: f.color }}>{f.label}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </>
        )
      }
    ]
  }
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SENDWhitePaperPage() {
  const [activeChapter, setActiveChapter] = useState('intro')
  const [activeSection, setActiveSection] = useState('intro-foreword')
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({ intro: true })
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showToc, setShowToc] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Scroll to section
  function scrollTo(sectionId: string) {
    setActiveSection(sectionId)
    const chapter = CHAPTERS.find(c => c.sections.find(s => s.id === sectionId))
    if (chapter) setActiveChapter(chapter.id)
    setTimeout(() => {
      sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function toggleChapter(id: string) {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-section-id')
          if (id) setActiveSection(id)
        }
      })
    }, { threshold: 0.3 })
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const allSections = CHAPTERS.flatMap(c => c.sections)
  const filteredSections = search
    ? allSections.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="flex h-full" style={{ backgroundColor: '#07080F', minHeight: '80vh' }}>

      {/* Sidebar TOC */}
      {showToc && (
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r overflow-y-auto" style={{ backgroundColor: '#07080F', borderColor: '#1F2937' }}>
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: '#1F2937' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.2)' }}>
                <BookOpen size={12} style={{ color: '#8B5CF6' }} />
              </div>
              <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>SEND White Paper 2026</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>Every Child Achieving and Thriving</p>
          </div>

          {/* Chapter nav */}
          <nav className="flex-1 p-2">
            {CHAPTERS.map(ch => {
              const isExpanded = expandedChapters[ch.id]
              const isActive = activeChapter === ch.id
              return (
                <div key={ch.id} className="mb-1">
                  <button
                    onClick={() => { toggleChapter(ch.id); setActiveChapter(ch.id) }}
                    className="flex items-center gap-2 w-full rounded-lg px-2 py-2 text-left transition-all"
                    style={{ backgroundColor: isActive ? `${ch.color}15` : 'transparent', border: isActive ? `1px solid ${ch.color}30` : '1px solid transparent' }}>
                    <span style={{ color: ch.color }}>{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: isActive ? ch.color : '#9CA3AF' }}>{ch.number}</p>
                      <p className="text-xs truncate" style={{ color: isActive ? '#D1D5DB' : '#6B7280' }}>{ch.title}</p>
                    </div>
                    {isExpanded ? <ChevronDown size={12} style={{ color: '#6B7280', flexShrink: 0 }} /> : <ChevronRight size={12} style={{ color: '#6B7280', flexShrink: 0 }} />}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 flex flex-col gap-0.5">
                      {ch.sections.map(sec => (
                        <button key={sec.id}
                          onClick={() => scrollTo(sec.id)}
                          className="flex items-start gap-2 rounded px-2 py-1.5 text-left transition-all w-full"
                          style={{ backgroundColor: activeSection === sec.id ? `${ch.color}10` : 'transparent' }}>
                          <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: '#4B5563' }}>{sec.number}</span>
                          <p className="text-xs leading-tight" style={{ color: activeSection === sec.id ? ch.color : '#6B7280' }}>{sec.title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1F2937', backgroundColor: '#07080F' }}>
          <button onClick={() => setShowToc(v => !v)} className="rounded-lg px-2 py-1 text-xs" style={{ backgroundColor: '#111318', color: '#9CA3AF' }}>
            {showToc ? '← Hide' : '☰ Contents'}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-bold" style={{ color: '#8B5CF6' }}>SEND White Paper 2026</span>
            <ChevronRight size={12} style={{ color: '#4B5563' }} />
            <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>
              {CHAPTERS.find(c => c.sections.find(s => s.id === activeSection))?.sections.find(s => s.id === activeSection)?.title ?? ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showSearch ? (
              <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <Search size={12} style={{ color: '#6B7280' }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent text-xs outline-none w-40"
                  style={{ color: '#F9FAFB' }}
                />
                <button onClick={() => { setSearch(''); setShowSearch(false) }}><X size={12} style={{ color: '#6B7280' }} /></button>
              </div>
            ) : (
              <button onClick={() => setShowSearch(true)} className="rounded-lg p-1.5" style={{ backgroundColor: '#111318', color: '#9CA3AF' }}>
                <Search size={14} />
              </button>
            )}
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>DfE · March 2026</span>
          </div>
        </div>

        {/* Search results */}
        {search && filteredSections.length > 0 && (
          <div className="border-b p-3" style={{ borderColor: '#1F2937', backgroundColor: '#0A0B11' }}>
            <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{filteredSections.length} result{filteredSections.length !== 1 ? 's' : ''}</p>
            {filteredSections.map(s => (
              <button key={s.id} onClick={() => { scrollTo(s.id); setSearch(''); setShowSearch(false) }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 mb-1 text-left"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold" style={{ color: '#0D9488' }}>{s.number}</p>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.title}</p>
              </button>
            ))}
          </div>
        )}

        {/* Document content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {/* Document header */}
          <div className="px-8 py-10" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(13,148,136,0.08) 100%)', borderBottom: '1px solid #1F2937' }}>
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded font-semibold" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>Department for Education</span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#111318', color: '#6B7280' }}>March 2026</span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>Statutory</span>
              </div>
              <h1 className="text-3xl font-black mb-2" style={{ color: '#F9FAFB' }}>Every Child Achieving and Thriving</h1>
              <p className="text-lg font-semibold mb-4" style={{ color: '#8B5CF6' }}>The SEND White Paper 2026</p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
                A new framework for special educational needs and disabilities in England — setting out the three-tier model, Individual Support Plans, the Inclusive Mainstream Fund, Experts at Hand, and the pathway to a genuinely inclusive education system.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Chapters', value: '6' },
                  { label: 'New statutory duties', value: '14' },
                  { label: 'Total investment', value: '£3.4bn' },
                  { label: 'Implementation by', value: '2029' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xl font-black" style={{ color: '#0D9488' }}>{s.value}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="px-8 py-6 max-w-3xl">
            {CHAPTERS.map(chapter => (
              <div key={chapter.id} className="mb-12">
                {/* Chapter heading */}
                <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: `2px solid ${chapter.color}40` }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${chapter.color}20` }}>
                    <span style={{ color: chapter.color }}>{chapter.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: chapter.color }}>{chapter.number}</p>
                    <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{chapter.title}</h2>
                  </div>
                </div>

                {/* Sections */}
                {chapter.sections.map(section => (
                  <div
                    key={section.id}
                    data-section-id={section.id}
                    ref={el => { sectionRefs.current[section.id] = el }}
                    className="mb-8 scroll-mt-4"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-xs font-mono mt-1 flex-shrink-0" style={{ color: '#4B5563' }}>{section.number}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold" style={{ color: '#F9FAFB' }}>{section.title}</h3>
                          {section.tag && (
                            <span className="text-xs px-2 py-0.5 rounded font-semibold"
                              style={{ backgroundColor: `${section.tagColor}20`, color: section.tagColor }}>
                              {section.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-8">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Footer */}
            <div className="rounded-xl p-6 mt-8" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Document Information</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Published by', 'Department for Education'],
                  ['Publication date', 'March 2026'],
                  ['Applies to', 'All state-funded schools in England'],
                  ['Legislation', 'Children and Families Act 2014 (amended)'],
                  ['Replaces', 'SEND and AP Improvement Plan (2023)'],
                  ['Review date', 'September 2027'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ color: '#6B7280' }}>{k}</p>
                    <p style={{ color: '#D1D5DB' }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid #1F2937' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>This document is presented within Lumio Schools for reference. For the full official document visit gov.uk.</p>
                <a href="https://www.gov.uk/government/publications/send-and-alternative-provision-improvement-plan" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: '#0D9488' }}>
                  gov.uk <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
