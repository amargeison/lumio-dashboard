-- Structured dart equipment setup
CREATE TABLE IF NOT EXISTS darts_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES darts_players(id) ON DELETE CASCADE,
  setup_name TEXT NOT NULL DEFAULT 'Main setup',
  is_active BOOLEAN DEFAULT true,
  is_tournament_setup BOOLEAN DEFAULT true,
  notes TEXT,
  barrel_brand TEXT,
  barrel_model TEXT,
  barrel_weight_grams DECIMAL(4,1),
  barrel_material TEXT,
  barrel_shape TEXT CHECK (barrel_shape IN (
    'straight','torpedo','bomb','pear',
    'front_loaded','rear_loaded','centre_loaded','other'
  )),
  barrel_grip TEXT CHECK (barrel_grip IN (
    'smooth','ringed','knurled','shark','micro','mixed','other'
  )),
  barrel_length_mm DECIMAL(4,1),
  barrel_diameter_mm DECIMAL(3,1),
  barrel_product_code TEXT,
  shaft_brand TEXT,
  shaft_model TEXT,
  shaft_length TEXT CHECK (shaft_length IN (
    'ultra_short','short','medium','long','extra_long','custom'
  )),
  shaft_length_mm DECIMAL(4,1),
  shaft_material TEXT CHECK (shaft_material IN (
    'nylon','polycarbonate','aluminium',
    'carbon_fibre','titanium','composite','other'
  )),
  shaft_angle TEXT CHECK (shaft_angle IN (
    'straight','angled_15','angled_30','spinning'
  )) DEFAULT 'straight',
  shaft_colour TEXT,
  shaft_product_code TEXT,
  flight_brand TEXT,
  flight_model TEXT,
  flight_shape TEXT CHECK (flight_shape IN (
    'standard','slim','kite','pear','teardrop',
    'super','fantail','vortex','dimple','other'
  )),
  flight_material TEXT CHECK (flight_material IN (
    'standard_polyester','heavy_duty','ultra',
    'nylon','carbon','holographic','other'
  )),
  flight_thickness_micron INTEGER,
  flight_colour TEXT,
  flight_design TEXT,
  point_type TEXT CHECK (point_type IN (
    'steel_tip','soft_tip','conversion'
  )) DEFAULT 'steel_tip',
  point_length TEXT CHECK (point_length IN (
    'short','medium','long','extra_long'
  )) DEFAULT 'medium',
  point_length_mm DECIMAL(4,1),
  point_style TEXT CHECK (point_style IN (
    'smooth','grooved','ripple','coiled','other'
  )) DEFAULT 'smooth',
  point_brand TEXT,
  date_introduced DATE,
  average_with_setup DECIMAL(5,2),
  checkout_pct_with_setup DECIMAL(5,2),
  matches_played_with_setup INTEGER DEFAULT 0,
  player_rating INTEGER CHECK (player_rating BETWEEN 1 AND 10),
  is_sponsored_setup BOOLEAN DEFAULT false,
  sponsor_name TEXT,
  sponsor_product_launch TEXT,
  content_required BOOLEAN DEFAULT false,
  additional_specs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_darts_equipment_player ON darts_equipment(player_id);
CREATE INDEX idx_darts_equipment_active ON darts_equipment(player_id, is_active);

ALTER TABLE darts_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can manage own equipment"
  ON darts_equipment FOR ALL
  USING (player_id IN (
    SELECT id FROM darts_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Demo equipment readable"
  ON darts_equipment FOR SELECT
  USING (player_id IN (
    SELECT id FROM darts_players WHERE slug = 'darts-demo'
  ));

INSERT INTO darts_equipment (
  player_id, setup_name, is_active, is_tournament_setup,
  barrel_brand, barrel_model, barrel_weight_grams, barrel_material,
  barrel_shape, barrel_grip, barrel_length_mm, barrel_diameter_mm,
  barrel_product_code,
  shaft_brand, shaft_model, shaft_length, shaft_length_mm,
  shaft_material, shaft_angle, shaft_colour,
  flight_brand, flight_shape, flight_material,
  flight_thickness_micron, flight_colour, flight_design,
  point_type, point_length, point_length_mm, point_style,
  date_introduced, average_with_setup, checkout_pct_with_setup,
  matches_played_with_setup, player_rating,
  is_sponsored_setup, sponsor_name, content_required, notes
)
SELECT
  p.id,
  'Tournament setup — The Hammer', true, true,
  'Red Dragon', 'Morrison "The Hammer" SE', 24.0, '97% Tungsten',
  'torpedo', 'micro', 52.0, 6.4, 'RD3879',
  'Red Dragon', 'Nitrotech Titanium', 'medium', 41.0,
  'titanium', 'straight', 'Gunmetal',
  'Red Dragon', 'standard', 'heavy_duty',
  150, 'Black/Red', 'The Hammer signature design',
  'steel_tip', 'medium', 36.0, 'smooth',
  '2024-03-01', 97.8, 42.3, 47, 9,
  true, 'Red Dragon Darts', true,
  'Primary tournament setup. Used for all PDC televised events and Euro Tour.'
FROM darts_players p WHERE p.slug = 'darts-demo';

INSERT INTO darts_equipment (
  player_id, setup_name, is_active, is_tournament_setup,
  barrel_brand, barrel_model, barrel_weight_grams, barrel_material,
  barrel_shape, barrel_grip, barrel_length_mm, barrel_diameter_mm,
  shaft_brand, shaft_length, shaft_length_mm, shaft_material, shaft_angle,
  flight_brand, flight_shape, flight_material, flight_thickness_micron,
  point_type, point_length, point_style,
  date_introduced, average_with_setup, checkout_pct_with_setup,
  matches_played_with_setup, player_rating,
  is_sponsored_setup, sponsor_name, notes
)
SELECT
  p.id,
  'Practice setup', true, false,
  'Red Dragon', 'Morrison Practice Edition', 22.0, '90% Tungsten',
  'straight', 'ringed', 48.0, 6.2,
  'Condor', 'short', 34.0, 'polycarbonate', 'straight',
  'Winmau', 'slim', 'standard_polyester', 100,
  'steel_tip', 'medium', 'smooth',
  '2024-01-01', 99.3, 44.1, 0, 8,
  true, 'Red Dragon Darts',
  '2g lighter than tournament setup. Slim flights give tighter T20 grouping. Doubles practice only.'
FROM darts_players p WHERE p.slug = 'darts-demo';

INSERT INTO darts_equipment (
  player_id, setup_name, is_active, is_tournament_setup,
  barrel_brand, barrel_model, barrel_weight_grams, barrel_material,
  barrel_shape, barrel_grip, barrel_length_mm, barrel_diameter_mm,
  barrel_product_code,
  shaft_brand, shaft_length, shaft_length_mm, shaft_material, shaft_angle,
  flight_brand, flight_shape, flight_material, flight_thickness_micron,
  point_type, point_length, point_style,
  date_introduced, average_with_setup, checkout_pct_with_setup,
  matches_played_with_setup, player_rating,
  is_sponsored_setup, sponsor_name, notes
)
SELECT
  p.id,
  'Backup (retired)', false, true,
  'Red Dragon', 'Morrison "The Hammer" v1', 24.0, '95% Tungsten',
  'torpedo', 'knurled', 51.0, 6.5, 'RD3712',
  'Red Dragon', 'medium', 41.0, 'nylon', 'straight',
  'Red Dragon', 'standard', 'heavy_duty', 150,
  'steel_tip', 'medium', 'smooth',
  '2023-09-01', 96.1, 40.8, 32, 7,
  true, 'Red Dragon Darts',
  'Retired. Knurled grip caused T20 pull-left under pressure. Replaced Mar 2024 with SE micro grip.'
FROM darts_players p WHERE p.slug = 'darts-demo';

CREATE TABLE IF NOT EXISTS darts_equipment_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES darts_players(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES darts_equipment(id) ON DELETE CASCADE,
  changed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  change_description TEXT NOT NULL,
  avg_before DECIMAL(5,2),
  avg_after DECIMAL(5,2),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE darts_equipment_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can manage own equipment changes"
  ON darts_equipment_changes FOR ALL
  USING (player_id IN (
    SELECT id FROM darts_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Demo equipment changes readable"
  ON darts_equipment_changes FOR SELECT
  USING (player_id IN (
    SELECT id FROM darts_players WHERE slug = 'darts-demo'
  ));

INSERT INTO darts_equipment_changes (
  player_id, equipment_id, changed_at,
  change_description, avg_before, avg_after, reason
)
SELECT p.id, e.id,
  '2024-03-01',
  'Switched from v1 (knurled) to SE (micro grip) barrel',
  96.1, 97.8,
  'Micro grip reduces T20 pull-left under pressure. Recommended by Marco after pressure analysis.'
FROM darts_players p
JOIN darts_equipment e ON e.player_id = p.id
  AND e.setup_name = 'Tournament setup — The Hammer'
WHERE p.slug = 'darts-demo';

INSERT INTO darts_equipment_changes (
  player_id, equipment_id, changed_at,
  change_description, avg_before, avg_after, reason
)
SELECT p.id, e.id,
  '2024-06-15',
  'Switched shaft from nylon to titanium (Nitrotech)',
  97.1, 97.8,
  'Titanium eliminated shaft breakage at Players Championships. More consistent feel across long sessions.'
FROM darts_players p
JOIN darts_equipment e ON e.player_id = p.id
  AND e.setup_name = 'Tournament setup — The Hammer'
WHERE p.slug = 'darts-demo';
