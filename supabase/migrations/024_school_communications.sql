-- Parent Communication Blast
create table if not exists school_communications (
  id              uuid primary key default gen_random_uuid(),

  -- Content
  subject         text not null,
  body            text not null,
  template_id     text,                           -- slug of the template used (if any)

  -- Audience
  audience        text not null default 'All Parents',  -- 'All Parents' | 'Year Group' | 'Class' | 'Custom List'
  audience_filter text,                           -- year group name or class name when applicable

  -- Channels
  send_email      boolean not null default true,
  send_sms        boolean not null default false,

  -- Scheduling
  send_at         timestamptz,                    -- null = immediate
  sent_at         timestamptz,

  -- Attachments (URLs)
  attachments     text[] not null default '{}',

  -- Delivery stats (updated by n8n webhook)
  recipient_count int not null default 0,
  email_sent      int not null default 0,
  email_opened    int not null default 0,
  sms_sent        int not null default 0,
  sms_delivered   int not null default 0,

  -- Status
  status          text not null default 'Draft',  -- Draft | Scheduled | Sent | Failed
  created_by      text,
  n8n_fired       boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table school_communications enable row level security;

drop policy if exists "comms_insert" on school_communications;
drop policy if exists "comms_select" on school_communications;
drop policy if exists "comms_update" on school_communications;

create policy "comms_insert"
  on school_communications for insert to authenticated with check (true);

create policy "comms_select"
  on school_communications for select to authenticated using (true);

create policy "comms_update"
  on school_communications for update to authenticated using (true);

create index if not exists school_comms_status_idx  on school_communications (status);
create index if not exists school_comms_send_at_idx on school_communications (send_at);

-- Communication templates library
create table if not exists school_communication_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  category    text not null,                      -- 'Attendance' | 'Events' | 'Admin' | 'Newsletter'
  subject     text not null,
  body        text not null,
  is_sms_safe boolean not null default false,     -- short enough for SMS
  created_at  timestamptz not null default now()
);

alter table school_communication_templates enable row level security;

drop policy if exists "comm_templates_select" on school_communication_templates;
create policy "comm_templates_select"
  on school_communication_templates for select to authenticated using (true);

-- Seed the 5 default templates
insert into school_communication_templates (slug, title, category, subject, body, is_sms_safe) values
(
  'term-dates',
  'Term Dates Reminder',
  'Admin',
  'Important: Term Dates {{school_year}}',
  'Dear Parent/Carer,

Please find below the key term dates for {{school_year}}:

Autumn Term: {{autumn_start}} – {{autumn_end}}
Spring Term: {{spring_start}} – {{spring_end}}
Summer Term: {{summer_start}} – {{summer_end}}

Please make note of these dates when planning family holidays. We are unable to authorise absence during term time except in exceptional circumstances.

If you have any questions, please contact the school office.

Kind regards,
{{head_teacher_name}}
{{school_name}}',
  false
),
(
  'absence-notification',
  'Absence Notification',
  'Attendance',
  'Attendance Alert: {{pupil_name}}',
  'Dear {{contact_name}},

We are writing to inform you that {{pupil_name}} was absent from school on {{absence_date}}.

{{#if no_contact}}
We attempted to contact you but were unable to reach you. Please call the school office on {{school_phone}} as soon as possible.
{{/if}}

{{#if persistent}}
We are concerned that {{pupil_name}}''s attendance has fallen below the expected level. We would like to arrange a meeting to discuss how we can support you. Please contact us at your earliest convenience.
{{/if}}

If this absence was authorised, please ensure you have provided a reason to the school office.

Kind regards,
{{school_name}} Attendance Team',
  false
),
(
  'parents-evening',
  'Parents Evening Invitation',
  'Events',
  'Parents'' Evening — Book Your Appointment',
  'Dear Parent/Carer of {{pupil_name}},

We would like to invite you to our upcoming Parents'' Evening on {{event_date}} between {{event_start}} and {{event_end}}.

This is an opportunity to meet with your child''s teacher{{#if multi_teacher}}s{{/if}} and discuss their progress, achievements, and any areas for development.

To book your appointment, please {{booking_instructions}}.

Appointments are {{appointment_length}} minutes each. Please arrive 5 minutes before your scheduled time.

We look forward to seeing you.

Kind regards,
{{school_name}}',
  false
),
(
  'trip-permission',
  'Trip Permission Slip',
  'Events',
  'Permission Required: {{trip_name}}',
  'Dear Parent/Carer,

We are pleased to inform you that {{pupil_name}}''s class will be visiting {{trip_destination}} on {{trip_date}}.

Trip details:
• Destination: {{trip_destination}}
• Date: {{trip_date}}
• Departure: {{departure_time}}  •  Return: {{return_time}}
• Cost: {{trip_cost}}
• What to bring: {{what_to_bring}}

To give permission for your child to attend, please {{permission_instructions}} by {{deadline_date}}.

Without your consent, your child will be unable to join this trip and will remain at school.

Kind regards,
{{teacher_name}}
{{school_name}}',
  false
),
(
  'newsletter',
  'School Newsletter',
  'Newsletter',
  '{{school_name}} Newsletter — {{month_year}}',
  'Dear Families,

Welcome to this month''s newsletter. Here''s what has been happening at {{school_name}}:

{{newsletter_intro}}

UPCOMING EVENTS
{{events_list}}

ACHIEVEMENTS
{{achievements}}

REMINDERS
{{reminders}}

We are proud of everything our pupils have achieved this month and look forward to another exciting term ahead.

Kind regards,
{{head_teacher_name}}
{{school_name}}',
  false
)
on conflict (slug) do nothing;
