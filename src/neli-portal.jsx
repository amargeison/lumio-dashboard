import { useState } from "react";
import LanguageScreenApp from './components/LanguageScreenApp';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Cell, PieChart, Pie,
} from "recharts";
import {
  LayoutDashboard, Search, ClipboardList, FileText, Building2,
  GraduationCap, Users, Bell, TrendingUp, AlertCircle,
  CheckCircle2, Download, Award, ChevronRight, Star,
  Settings, LogOut, Filter, BookOpen, Target, ArrowUp,
  ChevronLeft, Clipboard, Heart, Brain, Activity, MessageSquare,
  Printer, Share2, Eye, X, Plus, Edit3, UserCheck, Zap, BarChart2,
  FolderOpen, Folder, ExternalLink, PlayCircle,
} from "lucide-react";

const T = {
  sidebar:"#0C1A2E", sidebarHover:"#162540", sidebarActive:"#1E3561",
  sidebarText:"#8BA4C7",
  bg:"#F0EDE5", card:"#FFFFFF", border:"#E2DDD4",
  navy:"#1B3060", gold:"#C8960C", goldLight:"#FEF3C7",
  green:"#15803D", greenBg:"#DCFCE7",
  amber:"#B45309", amberBg:"#FFFBEB",
  red:"#B91C1C", redBg:"#FEF2F2",
  blue:"#1D4ED8", blueBg:"#EFF6FF",
  purple:"#7C3AED", purpleBg:"#F5F3FF",
  text:"#111827", muted:"#6B7280", light:"#F9FAFB",
};

// ─── DATA ─────────────────────────────────────────────────

const PUPILS = [
  {id:1,  name:"Amara Johnson",    dob:"15/04/2020", g:"F", eal:false, fsm:true,  is:62,  es:80,  neli:true,
    sen:{status:"SEN Support", category:"Communication & Interaction", plan:"Speech & Language Referral in progress", ehcp:false, agencies:["SALT referral pending"], adjustments:["Visual timetable","Reduced group sizes","TA support in sessions"]},
    elgs:{la:["E","E"],psed:["E","E","E"],pd:["E","E"],lit:["E","E","E"],maths:["E","E"],utw:["E","E","E"],ead:["E","E"]},
    attendance:82, leuven:{wellbeing:2, involvement:2},
    subscores:{recVocab:58, expVocab:61, grammar:64, listening:65},
    notes:"Amara has made significant progress through the NELI intervention. She is growing in confidence but still requires targeted support in expressive language. Parents are engaged and supportive. SALT referral submitted October 2024.",
    nextSteps:["Continue NELI programme to Week 20","Follow up SALT referral","Introduce visual sentence starters","Weekly 1:1 reading with class teacher"],
    class:"A"},
  {id:2,  name:"Leon Carter",      dob:"02/09/2019", g:"M", eal:false, fsm:true,  is:71,  es:85,  neli:true,
    sen:{status:"Monitoring", category:"Communication & Interaction", plan:"Class-based monitoring", ehcp:false, agencies:[], adjustments:["Additional verbal prompts","Preferential seating"]},
    elgs:{la:["E","E"],psed:["E","E","E"],pd:["E","Ex"],lit:["E","E","E"],maths:["E","E"],utw:["Ex","E","E"],ead:["E","Ex"]},
    attendance:91, leuven:{wellbeing:3, involvement:3},
    subscores:{recVocab:68, expVocab:70, grammar:73, listening:74},
    notes:"Leon has shown steady improvement in group sessions. His listening skills have developed well. Behaviour in class has improved since starting NELI (teacher report).",
    nextSteps:["Monitor transition to Year 1","Consolidate vocabulary gains","Encourage story-telling at home (parent newsletter)"],
    class:"A"},
  {id:3,  name:"Fatima Al-Hassan", dob:"20/01/2020", g:"F", eal:true,  fsm:true,  is:74,  es:90,  neli:true,
    sen:{status:"EAL Monitoring", category:"EAL", plan:"EAL support plan", ehcp:false, agencies:["EAL Advisory Service"], adjustments:["Bilingual resources","Pre-teaching key vocabulary","Home-school language link"]},
    elgs:{la:["E","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","E"],lit:["E","E","E"],maths:["Ex","Ex"],utw:["Ex","Ex","E"],ead:["Ex","Ex"]},
    attendance:95, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:72, expVocab:71, grammar:76, listening:78},
    notes:"Fatima speaks Arabic at home (Moroccan dialect). Her English has developed remarkably well through NELI and strong family engagement. Her vocabulary acquisition rate is outstanding for an EAL learner.",
    nextSteps:["Celebrate progress with family","Monitor ELG outcomes in summer term","Continue bilingual story resources"],
    class:"A"},
  {id:4,  name:"Kai Murphy",       dob:"11/06/2020", g:"M", eal:false, fsm:true,  is:78,  es:89,  neli:true,
    sen:{status:"Monitoring", category:"Social, Emotional & Mental Health", plan:"Nurture group referral", ehcp:false, agencies:[], adjustments:["Calm corner access","Check-in/check-out","Consistent adult"]},
    elgs:{la:["E","E"],psed:["E","E","E"],pd:["Ex","Ex"],lit:["E","E","E"],maths:["E","Ex"],utw:["Ex","E","Ex"],ead:["Ex","Ex"]},
    attendance:88, leuven:{wellbeing:3, involvement:3},
    subscores:{recVocab:75, expVocab:77, grammar:79, listening:81},
    notes:"Kai has made good progress. SEMH monitoring in place following some early-year behaviour concerns. Nurture group has been beneficial. Language gains through NELI are strong.",
    nextSteps:["Continue nurture group","Transition planning with Y1 teacher","Parent review meeting in May"],
    class:"A"},
  {id:5,  name:"Zahra Patel",      dob:"03/03/2020", g:"F", eal:true,  fsm:false, is:79,  es:90,  neli:true,
    sen:{status:"None", category:"", plan:"", ehcp:false, agencies:[], adjustments:["Bilingual dictionaries available"]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["E","Ex","E"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:97, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:78, expVocab:76, grammar:81, listening:82},
    notes:"Zahra is a capable, confident learner. Gujarati spoken at home. Her English has developed strongly this year. NELI has helped consolidate narrative skills.",
    nextSteps:["Transition to Year 1 with positive profile","Share end-of-year data with parents"],
    class:"A"},
  {id:6,  name:"Oliver Barnes",    dob:"18/08/2019", g:"M", eal:false, fsm:false, is:82,  es:87,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","E"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:94, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:80, expVocab:82, grammar:83, listening:83},
    notes:"Oliver is a confident communicator. Making good progress across all areas.",
    nextSteps:["Monitor end-of-year ELG outcomes"],
    class:"A"},
  {id:7,  name:"Priya Sharma",     dob:"22/11/2019", g:"F", eal:true,  fsm:false, is:85,  es:89,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:96, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:84, expVocab:83, grammar:86, listening:87},
    notes:"Priya is a highly capable learner. Punjabi spoken at home.",
    nextSteps:["End-of-year EYFS profile"],
    class:"A"},
  {id:8,  name:"Mohammed Idris",   dob:"07/05/2020", g:"M", eal:true,  fsm:true,  is:86,  es:90,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","E"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:93, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:84, expVocab:85, grammar:87, listening:88},
    notes:"Mohammed is making excellent progress. Arabic and Somali spoken at home.",
    nextSteps:["End-of-year EYFS profile"],
    class:"A"},
  {id:9,  name:"Imogen Clarke",    dob:"30/07/2020", g:"F", eal:false, fsm:false, is:87,  es:91,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:98, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:86, expVocab:87, grammar:88, listening:88},
    notes:"Imogen is a confident, articulate learner.",
    nextSteps:["End-of-year EYFS profile"],
    class:"A"},
  {id:10, name:"Samuel Green",     dob:"14/12/2019", g:"M", eal:false, fsm:false, is:88,  es:92,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:95, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:87, expVocab:87, grammar:89, listening:90},
    notes:"Samuel is making strong progress in all areas.",
    nextSteps:["End-of-year EYFS profile"],
    class:"A"},
  {id:11, name:"Isla Reid",        dob:"09/02/2020", g:"F", eal:false, fsm:false, is:89,  es:93,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:96, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:88, expVocab:89, grammar:90, listening:90},
    notes:"Isla is flourishing across all areas of the EYFS.",
    nextSteps:["End-of-year EYFS profile"],
    class:"A"},
  {id:12, name:"Noah Williams",    dob:"25/06/2020", g:"M", eal:false, fsm:false, is:90,  es:93,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:93, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:89, expVocab:90, grammar:91, listening:91},
    notes:"Noah is a confident communicator with strong literacy foundations.",
    nextSteps:["End-of-year EYFS profile"],
    class:"A"},
  {id:13, name:"Ruby Taylor",      dob:"18/04/2020", g:"F", eal:false, fsm:false, is:91,  es:95,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:97, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:90, expVocab:91, grammar:92, listening:92},
    notes:"Ruby is a highly motivated learner.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:14, name:"Aiden Walsh",      dob:"03/10/2019", g:"M", eal:false, fsm:false, is:92,  es:95,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:94, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:91, expVocab:91, grammar:93, listening:93},
    notes:"Aiden is making excellent all-round progress.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:15, name:"Sophia Patel",     dob:"12/01/2020", g:"F", eal:false, fsm:false, is:93,  es:96,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:98, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:92, expVocab:93, grammar:94, listening:94},
    notes:"Sophia is a highly capable learner making strong progress.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:16, name:"Ethan Brown",      dob:"28/07/2020", g:"M", eal:false, fsm:false, is:94,  es:97,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:95, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:93, expVocab:94, grammar:95, listening:95},
    notes:"Ethan is making strong progress across all areas.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:17, name:"Ananya Singh",     dob:"14/03/2020", g:"F", eal:true,  fsm:false, is:95,  es:98,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:97, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:94, expVocab:95, grammar:96, listening:96},
    notes:"Ananya is a high-attaining learner. Hindi spoken at home.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:18, name:"Joshua Adams",     dob:"05/11/2019", g:"M", eal:false, fsm:false, is:96,  es:99,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:96, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:95, expVocab:96, grammar:97, listening:97},
    notes:"Joshua is an enthusiastic and capable learner.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:19, name:"Lily Thompson",    dob:"22/08/2020", g:"F", eal:false, fsm:false, is:97,  es:100, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:98, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:96, expVocab:97, grammar:98, listening:98},
    notes:"Lily is flourishing and on track for GLD.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:20, name:"Dylan Morris",     dob:"11/05/2020", g:"M", eal:false, fsm:false, is:98,  es:101, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:94, leuven:{wellbeing:4, involvement:5},
    subscores:{recVocab:97, expVocab:98, grammar:99, listening:99},
    notes:"Dylan is making excellent progress.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:21, name:"Freya Jenkins",    dob:"16/02/2020", g:"F", eal:false, fsm:false, is:99,  es:102, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:97, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:98, expVocab:99, grammar:100, listening:100},
    notes:"Freya is an outstanding learner across all areas.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:22, name:"Thomas Evans",     dob:"08/09/2019", g:"M", eal:false, fsm:false, is:100, es:103, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:93, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:99, expVocab:100, grammar:101, listening:101},
    notes:"Thomas is a capable, well-rounded learner.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:23, name:"Mia Cooper",       dob:"27/06/2020", g:"F", eal:false, fsm:false, is:101, es:104, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:96, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:100, expVocab:101, grammar:102, listening:102},
    notes:"Mia is a confident and creative learner.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:24, name:"Hamza Osman",      dob:"19/04/2020", g:"M", eal:true,  fsm:false, is:103, es:106, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:95, leuven:{wellbeing:4, involvement:5},
    subscores:{recVocab:102, expVocab:103, grammar:104, listening:104},
    notes:"Hamza is making excellent progress. Somali spoken at home.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:25, name:"Grace Wilson",     dob:"30/10/2019", g:"F", eal:false, fsm:false, is:105, es:108, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:97, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:104, expVocab:105, grammar:106, listening:106},
    notes:"Grace is an outstanding communicator and learner.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:26, name:"Callum Fraser",    dob:"13/01/2020", g:"M", eal:false, fsm:false, is:108, es:111, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:96, leuven:{wellbeing:4, involvement:5},
    subscores:{recVocab:107, expVocab:108, grammar:109, listening:109},
    notes:"Callum is a highly capable learner with strong language skills.",
    nextSteps:["End-of-year EYFS profile"],
    class:"B"},
  {id:27, name:"Charlotte Davies", dob:"24/08/2020", g:"F", eal:false, fsm:false, is:112, es:115, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:98, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:111, expVocab:112, grammar:113, listening:113},
    notes:"Charlotte is an exceptional learner — top of the cohort.",
    nextSteps:["End-of-year EYFS profile","Discuss Year 1 enrichment provision"],
    class:"B"},
  {id:28, name:"Rory MacDonald",   dob:"17/03/2020", g:"M", eal:false, fsm:false, is:116, es:118, neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","Ex"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:95, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:115, expVocab:116, grammar:117, listening:117},
    notes:"Rory has exceptional language skills — well above age-expected outcomes.",
    nextSteps:["End-of-year EYFS profile","Consider gifted & talented provision in Year 1"],
    class:"B"},
];

const CLASSES = [
  {id:"A", name:"Reception A", teacher:"Miss H. Thompson", ta:"Mrs J. Okafor", room:"Room 1"},
  {id:"B", name:"Reception B", teacher:"Mrs S. Ahmed", ta:"Mr D. Chen", room:"Room 2"},
];

const TRUST = [
  {id:1, name:"Parkside Primary",       short:"PP", pupils:28, neli:5, avgI:91.2, avgE:96.8, assessed:100, weeks:16, status:"good"},
  {id:2, name:"Riverside Academy",      short:"RA", pupils:31, neli:6, avgI:88.7, avgE:94.8, assessed:100, weeks:15, status:"good"},
  {id:3, name:"Greenfields Primary",    short:"GP", pupils:24, neli:5, avgI:90.4, avgE:null,  assessed:83,  weeks:16, status:"warning"},
  {id:4, name:"Hillside Infant School", short:"HI", pupils:19, neli:5, avgI:86.1, avgE:null,  assessed:100, weeks:8,  status:"alert"},
];

const STAFF = [
  {name:"Sarah Mitchell", role:"TA – NELI Lead",    c1:true,  c2:true,  c3:true},
  {name:"James Okafor",   role:"Teaching Assistant", c1:true,  c2:true,  c3:false},
  {name:"Hannah Brooks",  role:"Reception Teacher",  c1:true,  c2:false, c3:false},
  {name:"David Chen",     role:"SENCO",              c1:true,  c2:true,  c3:true},
];

const ELG_AREAS = [
  {key:"la",  label:"Communication & Language", short:"C&L", prime:true,  goals:["Listening, Attention & Understanding","Speaking"]},
  {key:"psed",label:"Personal, Social & Emotional", short:"PSED", prime:true, goals:["Self-Regulation","Managing Self","Building Relationships"]},
  {key:"pd",  label:"Physical Development", short:"PD", prime:true,  goals:["Gross Motor Skills","Fine Motor Skills"]},
  {key:"lit", label:"Literacy",          short:"Lit", prime:false, goals:["Comprehension","Word Reading","Writing"]},
  {key:"maths",label:"Mathematics",     short:"Maths",prime:false, goals:["Number","Numerical Patterns"]},
  {key:"utw", label:"Understanding the World",short:"UTW",prime:false, goals:["Past & Present","People, Culture & Communities","The Natural World"]},
  {key:"ead", label:"Expressive Arts & Design",short:"EAD",prime:false, goals:["Creating with Materials","Being Imaginative & Expressive"]},
];

// ─── HELPERS ──────────────────────────────────────────────

const getLight = s => s < 85 ? "red" : s < 96 ? "amber" : "green";
const lc = l => l==="red" ? T.red : l==="amber" ? T.amber : T.green;
const lb = l => l==="red" ? T.redBg : l==="amber" ? T.amberBg : T.greenBg;
const ll = l => l==="red" ? "Needs Support" : l==="amber" ? "Monitor" : "On Track";

const neliPupils = PUPILS.filter(p => p.neli);
const neliAvgGain = Math.round(neliPupils.reduce((s,p)=>s+(p.es-p.is),0)/neliPupils.length*10)/10;
const classAvgI = Math.round(PUPILS.reduce((s,p)=>s+p.is,0)/PUPILS.length*10)/10;
const classAvgE = Math.round(PUPILS.reduce((s,p)=>s+p.es,0)/PUPILS.length*10)/10;
const redC = PUPILS.filter(p=>getLight(p.is)==="red").length;
const ambC = PUPILS.filter(p=>getLight(p.is)==="amber").length;
const grnC = PUPILS.filter(p=>getLight(p.is)==="green").length;

const elgScore = (p) => {
  const all = [...p.elgs.la,...p.elgs.psed,...p.elgs.pd,...p.elgs.lit,...p.elgs.maths,...p.elgs.utw,...p.elgs.ead];
  const exp = all.filter(v=>v==="Ex").length;
  return {total:all.length, expected:exp, gld: [...p.elgs.la,...p.elgs.psed,...p.elgs.pd,...p.elgs.lit,...p.elgs.maths].every(v=>v==="Ex")};
};

const LeuvLabel = n => ["","Very Low","Low","Moderate","High","Very High"][n];
const LeuvColor = n => [T.red,T.red,T.amber,T.amber,T.green,T.green][n];

const InitialsBadge = ({name, size=32}) => {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#1E3561","#15803D","#C8960C","#B91C1C","#7C3AED","#0E7490","#B45309"];
  const col = colors[name.charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:col,display:"flex",
    alignItems:"center",justifyContent:"center",color:"white",fontSize:size*0.38,
    fontWeight:600,flexShrink:0,fontFamily:"system-ui"}}>{initials}</div>;
};

const TrafficDot = ({score}) => {
  const l = getLight(score);
  return <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
    <span style={{width:10,height:10,borderRadius:"50%",background:lc(l),display:"inline-block"}}/>
    <span style={{color:lc(l),fontSize:12,fontWeight:600}}>{score}</span>
  </span>;
};

const Badge = ({label,color,bg}) => (
  <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,
    background:bg||T.goldLight,color:color||T.gold,whiteSpace:"nowrap"}}>{label}</span>
);

const SectionTitle = ({title,subtitle}) => (
  <div style={{marginBottom:16}}>
    <h2 style={{fontSize:18,fontWeight:700,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>{title}</h2>
    {subtitle&&<p style={{fontSize:13,color:T.muted,margin:"4px 0 0"}}>{subtitle}</p>}
  </div>
);

const StatCard = ({label,value,sub,icon:Icon,color,alert}) => (
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
    padding:"16px 20px",position:"relative",overflow:"hidden"}}>
    {alert&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:lc(alert)}}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <p style={{fontSize:12,fontWeight:600,color:T.muted,textTransform:"uppercase",
          letterSpacing:"0.05em",margin:"0 0 6px"}}>{label}</p>
        <p style={{fontSize:28,fontWeight:800,color:color||T.navy,margin:"0 0 4px",
          fontFamily:"Georgia,serif"}}>{value}</p>
        {sub&&<p style={{fontSize:12,color:T.muted,margin:0}}>{sub}</p>}
      </div>
      {Icon&&<div style={{width:40,height:40,borderRadius:10,background:T.goldLight,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon size={20} color={T.gold}/>
      </div>}
    </div>
  </div>
);

const Card = ({children,style}) => (
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
    padding:"20px 24px",...style}}>{children}</div>
);

const Tab = ({label,active,onClick,icon:Icon}) => (
  <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,
    padding:"8px 16px",borderRadius:0,border:"none",cursor:"pointer",
    background:"transparent",color:active?T.navy:T.muted,
    borderBottom:active?`2px solid ${T.navy}`:"2px solid transparent",
    fontWeight:active?700:500,fontSize:13,transition:"all 0.1s",whiteSpace:"nowrap"}}>
    {Icon&&<Icon size={14}/>}{label}
  </button>
);

// ═══════════════════════════════════════════════════════════
// PUPIL DETAIL
// ═══════════════════════════════════════════════════════════
function PupilDetail({pupil, onBack}) {
  const [tab, setTab] = useState("overview");
  const [assessOpen, setAssessOpen] = useState(false);
  const [assessing, setAssessing] = useState(null);
  const gain = pupil.es - pupil.is;
  const il = getLight(pupil.is);
  const el = getLight(pupil.es);
  const scores = elgScore(pupil);

  const subData = [
    {sub:"Receptive Vocab", score:pupil.subscores.recVocab, label:"Rec. Vocab"},
    {sub:"Expressive Vocab", score:pupil.subscores.expVocab, label:"Exp. Vocab"},
    {sub:"Grammar", score:pupil.subscores.grammar, label:"Grammar"},
    {sub:"Listening", score:pupil.subscores.listening, label:"Listening"},
  ];

  const radarData = subData.map(d=>({subject:d.label, score:d.score, fullMark:130}));

  return (
    <div>
      {/* Back + Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
          padding:"6px 14px",border:`1px solid ${T.border}`,borderRadius:8,
          background:"white",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer"}}>
          <ChevronLeft size={14}/> Back to class
        </button>
        <span style={{color:T.border,fontSize:16}}>›</span>
        <span style={{fontSize:13,color:T.muted}}>{pupil.name}</span>
      </div>

      {/* Hero */}
      <Card style={{marginBottom:16,padding:"24px 28px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:20}}>
          <InitialsBadge name={pupil.name} size={64}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
              <h1 style={{fontSize:22,fontWeight:800,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>{pupil.name}</h1>
              {pupil.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
              {pupil.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
              {pupil.neli&&<Badge label="NELI Pupil" color={T.gold} bg={T.goldLight}/>}
              {pupil.sen.status!=="None"&&<Badge label={pupil.sen.status} color={T.red} bg={T.redBg}/>}
            </div>
            <div style={{display:"flex",gap:20,fontSize:12,color:T.muted,flexWrap:"wrap"}}>
              <span>DOB: <strong style={{color:T.text}}>{pupil.dob}</strong></span>
              <span>Gender: <strong style={{color:T.text}}>{pupil.g==="F"?"Female":"Male"}</strong></span>
              <span>Class: <strong style={{color:T.text}}>{CLASSES.find(c=>c.id===pupil.class)?.name}</strong></span>
              <span>Attendance: <strong style={{color:pupil.attendance>=90?T.green:T.red}}>{pupil.attendance}%</strong></span>
              <span>GLD Projection: <strong style={{color:scores.gld?T.green:T.amber}}>{scores.gld?"On Track":"At Risk"}</strong></span>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setAssessOpen(true)} style={{display:"flex",alignItems:"center",gap:6,
              padding:"10px 20px",borderRadius:8,border:"none",background:T.navy,
              color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <Clipboard size={15}/> Assess Now
            </button>
            <button style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",
              borderRadius:8,border:`1px solid ${T.border}`,background:"white",
              fontSize:13,fontWeight:600,color:T.muted,cursor:"pointer"}}>
              <Download size={15}/> Export
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginTop:20}}>
          {[
            {l:"Initial Score",v:pupil.is,c:lc(il)},
            {l:"Current Score",v:pupil.es,c:lc(el)},
            {l:"Score Gain",v:`+${gain}`,c:T.green},
            {l:"ELGs Expected",v:`${scores.expected}/${scores.total}`,c:scores.gld?T.green:T.amber},
            {l:"Leuven Wellbeing",v:`${pupil.leuven.wellbeing}/5`,c:LeuvColor(pupil.leuven.wellbeing)},
          ].map(s=>(
            <div key={s.l} style={{background:T.light,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
              <p style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",
                letterSpacing:"0.04em",margin:"0 0 4px"}}>{s.l}</p>
              <p style={{fontSize:22,fontWeight:800,color:s.c,margin:0,fontFamily:"Georgia,serif"}}>{s.v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,
        background:"white",borderRadius:"12px 12px 0 0",marginBottom:0,
        overflowX:"auto",gap:0}}>
        {[
          {id:"overview",    label:"Overview",          icon:BarChart2},
          {id:"language",    label:"Language Assessment",icon:MessageSquare},
          {id:"eyfs",        label:"EYFS Profile",       icon:BookOpen},
          {id:"sen",         label:"SEN & SEND",         icon:UserCheck},
          {id:"wellbeing",   label:"Wellbeing",          icon:Heart},
          {id:"notes",       label:"Notes & Next Steps", icon:Edit3},
        ].map(t=><Tab key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>setTab(t.id)}/>)}
      </div>

      {/* Tab content */}
      <Card style={{borderRadius:"0 0 12px 12px",borderTop:"none"}}>

        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>LanguageScreen — Score Journey</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{period:"Autumn (Initial)",score:pupil.is},{period:"Spring (Current)",score:pupil.es}]}
                    margin={{top:0,right:0,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                    <XAxis dataKey="period" tick={{fontSize:11,fill:T.muted}}/>
                    <YAxis domain={[Math.max(50,pupil.is-20),Math.min(130,pupil.es+10)]} tick={{fontSize:11,fill:T.muted}}/>
                    <Tooltip/>
                    <Bar dataKey="score" radius={[6,6,0,0]}>
                      <Cell fill="#FBBF24"/>
                      <Cell fill={T.green}/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Subscale Radar</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid/>
                    <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:T.muted}}/>
                    <PolarRadiusAxis angle={30} domain={[50,130]} tick={{fontSize:9}}/>
                    <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{marginTop:16,padding:"16px 20px",background:T.goldLight,borderRadius:10,
              border:`1px solid #FDE68A`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <Brain size={18} color={T.gold}/>
                <span style={{fontWeight:700,fontSize:13,color:T.amber}}>AI Summary — {pupil.name}</span>
              </div>
              <p style={{fontSize:13,color:T.text,margin:0,lineHeight:1.7}}>{pupil.notes}</p>
            </div>
          </div>
        )}

        {/* LANGUAGE ASSESSMENT */}
        {tab==="language"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>LanguageScreen — Detailed Results</h3>
              <div style={{display:"flex",gap:8}}>
                <Badge label="Standardised score" color={T.navy} bg={T.blueBg}/>
                <Badge label="Age-normed (n=350,000+)"/>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {subData.map(d=>{
                const l = getLight(d.score);
                return (
                  <div key={d.sub} style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"16px",
                    borderTop:`4px solid ${lc(l)}`}}>
                    <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",
                      letterSpacing:"0.04em",margin:"0 0 8px"}}>{d.sub}</p>
                    <p style={{fontSize:32,fontWeight:800,color:lc(l),margin:"0 0 4px",fontFamily:"Georgia,serif"}}>{d.score}</p>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                      background:lb(l),color:lc(l)}}>{ll(l)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{marginBottom:16}}>
              <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Subscale Comparison — Initial vs Current</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {area:"Rec. Vocab", initial:Math.round(pupil.subscores.recVocab*0.85), end:pupil.subscores.recVocab},
                  {area:"Exp. Vocab", initial:Math.round(pupil.subscores.expVocab*0.85), end:pupil.subscores.expVocab},
                  {area:"Grammar",    initial:Math.round(pupil.subscores.grammar*0.86),  end:pupil.subscores.grammar},
                  {area:"Listening",  initial:Math.round(pupil.subscores.listening*0.85),end:pupil.subscores.listening},
                ]} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="area" tick={{fontSize:11,fill:T.muted}}/>
                  <YAxis domain={[50,120]} tick={{fontSize:11,fill:T.muted}}/>
                  <Tooltip/>
                  <Bar dataKey="initial" fill="#FCD34D" radius={[3,3,0,0]} name="Initial"/>
                  <Bar dataKey="end" fill={T.navy} radius={[3,3,0,0]} name="Current"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{padding:"14px 18px",background:T.blueBg,borderRadius:10,fontSize:13,color:T.text,lineHeight:1.6}}>
              <strong style={{color:T.blue}}>Interpretation: </strong>
              Standard scores are age-normed against a database of 350,000+ assessments. A score of 100 represents the population average for a child of this age. Scores below 85 (1 SD below mean) indicate a child who would benefit from additional support. LanguageScreen has been independently validated and correlates strongly with clinical assessments.
            </div>
          </div>
        )}

        {/* EYFS PROFILE */}
        {tab==="eyfs"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>EYFS Profile — 17 Early Learning Goals</h3>
                <p style={{fontSize:12,color:T.muted,margin:0}}>Teacher assessment · Spring 2025 · Emerging (E) or Expected (Ex)</p>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:800,color:scores.gld?T.green:T.amber,fontFamily:"Georgia,serif"}}>{scores.expected}/{scores.total}</div>
                <div style={{fontSize:12,color:T.muted}}>ELGs at Expected</div>
                <span style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,
                  background:scores.gld?T.greenBg:T.amberBg,color:scores.gld?T.green:T.amber}}>
                  GLD: {scores.gld?"On Track ✓":"At Risk ⚠"}
                </span>
              </div>
            </div>

            {ELG_AREAS.map(area=>{
              const vals = pupil.elgs[area.key];
              return (
                <div key={area.key} style={{marginBottom:12,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
                  <div style={{padding:"10px 16px",background:area.prime?T.navy:T.light,
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:700,color:area.prime?"white":T.text}}>
                      {area.prime&&<span style={{fontSize:10,marginRight:6,opacity:0.7}}>PRIME</span>}
                      {area.label}
                    </span>
                    <span style={{fontSize:12,color:area.prime?"rgba(255,255,255,0.7)":T.muted}}>
                      {vals.filter(v=>v==="Ex").length}/{vals.length} expected
                    </span>
                  </div>
                  <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
                    {area.goals.map((goal,i)=>(
                      <div key={goal} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:13,color:T.text,flex:1}}>{goal}</span>
                        <span style={{padding:"3px 14px",borderRadius:20,fontSize:12,fontWeight:700,
                          background:vals[i]==="Ex"?T.greenBg:T.amberBg,
                          color:vals[i]==="Ex"?T.green:T.amber}}>
                          {vals[i]==="Ex"?"Expected":"Emerging"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{marginTop:12,padding:"12px 16px",background:T.goldLight,borderRadius:8,fontSize:12,color:T.amber}}>
              <strong>GLD Note:</strong> Good Level of Development is achieved when a child reaches 'Expected' in all 12 ELGs across Communication & Language, PSED, Physical Development, Literacy and Mathematics. Understanding the World and Expressive Arts & Design are assessed but do not count towards GLD.
            </div>
          </div>
        )}

        {/* SEN & SEND */}
        {tab==="sen"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>SEN Profile</h3>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    ["SEN Status", pupil.sen.status||"None", pupil.sen.status&&pupil.sen.status!=="None"?T.red:T.green, pupil.sen.status&&pupil.sen.status!=="None"?T.redBg:T.greenBg],
                    ["Category", pupil.sen.category||"N/A", T.text, T.light],
                    ["EHCP", pupil.sen.ehcp?"Yes - in place":"No", pupil.sen.ehcp?T.red:T.muted, pupil.sen.ehcp?T.redBg:T.light],
                    ["Support Plan", pupil.sen.plan||"Not required", T.text, T.light],
                  ].map(([l,v,c,bg])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",
                      alignItems:"center",padding:"10px 14px",background:bg,borderRadius:8}}>
                      <span style={{fontSize:12,fontWeight:600,color:T.muted}}>{l}</span>
                      <span style={{fontSize:13,fontWeight:700,color:c}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>Graduated Approach (APDR)</h3>
                {["Assess","Plan","Do","Review"].map((phase,i)=>(
                  <div key={phase} style={{display:"flex",gap:12,marginBottom:12}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:T.navy,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"white",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,padding:"8px 12px",background:T.light,borderRadius:8}}>
                      <p style={{fontSize:12,fontWeight:700,color:T.navy,margin:"0 0 2px"}}>{phase}</p>
                      <p style={{fontSize:11,color:T.muted,margin:0}}>
                        {phase==="Assess"?"LanguageScreen + classroom observation + parent views"
                         :phase==="Plan"?"SMART targets set in SEN support plan with SENCO"
                         :phase==="Do"?"TA-led targeted sessions + NELI intervention"
                         :"Termly review with parents, class teacher and SENCO"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div>
                <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Outside Agencies</h4>
                {pupil.sen.agencies.length>0 ? pupil.sen.agencies.map(a=>(
                  <div key={a} style={{padding:"8px 14px",background:T.redBg,borderRadius:8,
                    fontSize:13,color:T.red,fontWeight:600,marginBottom:6,
                    display:"flex",alignItems:"center",gap:8}}>
                    <Users size={14}/>{a}
                  </div>
                )) : <p style={{fontSize:13,color:T.muted,fontStyle:"italic"}}>No external referrals at this time.</p>}
              </div>
              <div>
                <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Reasonable Adjustments</h4>
                {pupil.sen.adjustments.length>0 ? pupil.sen.adjustments.map(a=>(
                  <div key={a} style={{padding:"8px 14px",background:T.blueBg,borderRadius:8,
                    fontSize:13,color:T.blue,fontWeight:500,marginBottom:6,
                    display:"flex",alignItems:"center",gap:8}}>
                    <CheckCircle2 size={14}/>{a}
                  </div>
                )) : <p style={{fontSize:13,color:T.muted,fontStyle:"italic"}}>No specific adjustments recorded.</p>}
              </div>
            </div>

            <div>
              <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>DfE SEND Broad Areas of Need</h4>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {[
                  ["Communication & Interaction","Includes autism, SLCN, speech disorders"],
                  ["Cognition & Learning","Includes dyslexia, MLD, SLD, PMLD"],
                  ["Social, Emotional & Mental Health","Includes ADHD, anxiety, attachment"],
                  ["Sensory & Physical","Includes hearing/visual impairment, physical disability"],
                ].map(([area,desc],i)=>(
                  <div key={area} style={{padding:"12px 16px",borderRadius:8,
                    border:`2px solid ${i===0&&pupil.sen.category==="Communication & Interaction"?T.red:T.border}`,
                    background:i===0&&pupil.sen.category==="Communication & Interaction"?T.redBg:"white"}}>
                    <p style={{fontSize:12,fontWeight:700,color:i===0&&pupil.sen.category==="Communication & Interaction"?T.red:T.text,margin:"0 0 4px"}}>{area}</p>
                    <p style={{fontSize:11,color:T.muted,margin:0}}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WELLBEING */}
        {tab==="wellbeing"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>Leuven Scale</h3>
                <p style={{fontSize:12,color:T.muted,margin:"0 0 16px"}}>The Leuven scales measure emotional wellbeing and involvement (1–5). Research shows children cannot learn effectively at levels below 3.</p>
                {[
                  {label:"Emotional Wellbeing",val:pupil.leuven.wellbeing,key:"wellbeing"},
                  {label:"Involvement / Engagement",val:pupil.leuven.involvement,key:"involvement"},
                ].map(s=>(
                  <div key={s.key} style={{marginBottom:16,padding:"16px",background:T.light,borderRadius:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.label}</span>
                      <span style={{fontSize:20,fontWeight:800,color:LeuvColor(s.val),fontFamily:"Georgia,serif"}}>
                        {s.val}/5 — {LeuvLabel(s.val)}
                      </span>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      {[1,2,3,4,5].map(n=>(
                        <div key={n} style={{flex:1,height:12,borderRadius:4,
                          background:n<=s.val?LeuvColor(s.val):T.border}}/>
                      ))}
                    </div>
                    <p style={{fontSize:11,color:T.muted,margin:"8px 0 0"}}>
                      {s.val<=2?"Child shows signs of distress or disengagement. Immediate pastoral support recommended."
                       :s.val===3?"Child is moderately engaged. Monitor and provide additional support."
                       :"Child is happy, engaged and thriving in the learning environment."}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>Attendance</h3>
                <div style={{padding:"20px",background:T.light,borderRadius:10,textAlign:"center",marginBottom:12}}>
                  <div style={{fontSize:48,fontWeight:800,color:pupil.attendance>=90?T.green:T.red,
                    fontFamily:"Georgia,serif"}}>{pupil.attendance}%</div>
                  <div style={{fontSize:13,color:T.muted,marginBottom:12}}>Current attendance rate</div>
                  <div style={{background:T.border,borderRadius:20,height:10,overflow:"hidden"}}>
                    <div style={{width:`${pupil.attendance}%`,height:"100%",
                      background:pupil.attendance>=90?T.green:T.red,borderRadius:20}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:10,color:T.muted}}>0%</span>
                    <span style={{fontSize:10,color:T.amber}}>90% threshold</span>
                    <span style={{fontSize:10,color:T.muted}}>100%</span>
                  </div>
                </div>
                {pupil.attendance<90&&(
                  <div style={{padding:"12px 16px",background:T.redBg,borderRadius:8,fontSize:12,color:T.red,fontWeight:600}}>
                    ⚠ Persistently Absent — below 90% threshold. Pastoral intervention recommended.
                  </div>
                )}
                <div style={{marginTop:12}}>
                  <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Wellbeing Observations</h4>
                  {[
                    {date:"Mar 2025","obs":"Responded positively to NELI sessions. More confident in group settings."},
                    {date:"Feb 2025","obs":"Good engagement with outdoor activities. Building friendships."},
                    {date:"Jan 2025","obs":"Some anxiety noted on Monday mornings. Settling routine established."},
                  ].map(o=>(
                    <div key={o.date} style={{padding:"10px 14px",border:`1px solid ${T.border}`,
                      borderRadius:8,marginBottom:8}}>
                      <p style={{fontSize:11,fontWeight:700,color:T.gold,margin:"0 0 4px"}}>{o.date}</p>
                      <p style={{fontSize:12,color:T.text,margin:0,lineHeight:1.5}}>{o.obs}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOTES */}
        {tab==="notes"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>Teacher Notes</h3>
                <div style={{padding:"16px",background:T.light,borderRadius:10,
                  fontSize:13,color:T.text,lineHeight:1.7,marginBottom:12}}>
                  {pupil.notes}
                </div>
                <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Parent Communication Log</h4>
                {[
                  {date:"Mar 2025",type:"Meeting","note":"Termly review — positive progress shared with parents. SALT update discussed."},
                  {date:"Feb 2025",type:"Phone","note":"Parent contacted regarding attendance. Travel difficulties noted."},
                  {date:"Jan 2025",type:"Letter","note":"NELI parent newsletter and consent form sent home."},
                ].map(c=>(
                  <div key={c.date} style={{padding:"10px 14px",border:`1px solid ${T.border}`,
                    borderRadius:8,marginBottom:8,display:"flex",gap:12}}>
                    <div style={{width:52,flexShrink:0}}>
                      <p style={{fontSize:10,fontWeight:700,color:T.gold,margin:0}}>{c.date}</p>
                      <Badge label={c.type} color={T.navy} bg={T.blueBg}/>
                    </div>
                    <p style={{fontSize:12,color:T.text,margin:0,lineHeight:1.5}}>{c.note}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>Next Steps & Targets</h3>
                {pupil.nextSteps.map((s,i)=>(
                  <div key={i} style={{padding:"12px 16px",border:`1px solid ${T.border}`,
                    borderRadius:8,marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:T.navy,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"white",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <p style={{fontSize:13,color:T.text,margin:0,lineHeight:1.5}}>{s}</p>
                  </div>
                ))}
                <button style={{display:"flex",alignItems:"center",gap:8,marginTop:8,
                  padding:"10px 16px",borderRadius:8,border:`2px dashed ${T.border}`,
                  background:"transparent",width:"100%",justifyContent:"center",
                  fontSize:13,color:T.muted,cursor:"pointer"}}>
                  <Plus size={14}/> Add next step
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Assessment Modal */}
      {assessOpen&&(
        <div style={{position:"fixed",inset:0,
          background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",
          alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setAssessOpen(false)}>
          <div style={{background:"white",borderRadius:16,padding:"28px 32px",
            width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto",position:"relative",zIndex:1001}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>
                Assess {pupil.name.split(" ")[0]}
              </h2>
              <button onClick={()=>setAssessOpen(false)} style={{border:"none",background:"none",cursor:"pointer"}}>
                <X size={20} color={T.muted}/>
              </button>
            </div>
            <p style={{fontSize:13,color:T.muted,margin:"0 0 20px"}}>Select the assessment you want to administer:</p>
            {[
              {name:"LanguageScreen",desc:"10-min oral language screener · Standardised · All ages 3.5–11",badge:"Recommended",bc:T.gold,bb:T.goldLight,live:true},
              {name:"EYFS Profile Update",desc:"Update individual Early Learning Goal judgements",badge:"Statutory",bc:T.green,bb:T.greenBg,live:false},
              {name:"Leuven Wellbeing Scale",desc:"Observe and rate emotional wellbeing and involvement (1–5)",badge:"Pastoral",bc:T.blue,bb:T.blueBg,live:false},
              {name:"Phonics Readiness Screen",desc:"Letter knowledge, phonological awareness, blending",badge:"Literacy",bc:T.purple,bb:T.purpleBg,live:false},
              {name:"DfE SEND Assessment",desc:"Communication, Cognition, SEMH or Sensory & Physical tool",badge:"SEND",bc:T.red,bb:T.redBg,live:false},
              {name:"Teacher Observation Note",desc:"Add a free-text observation to this pupil's record",badge:"Quick",bc:T.muted,bb:T.light,live:false},
            ].map(a=>(
              <button key={a.name} onClick={()=>{ if(a.live){ setAssessing(pupil); setAssessOpen(false); } else { alert('Coming soon'); } }}
                style={{display:"flex",alignItems:"flex-start",gap:14,width:"100%",
                padding:"14px 16px",border:`1px solid ${T.border}`,borderRadius:10,
                background:"white",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:14,fontWeight:700,color:T.text}}>{a.name}</span>
                    <Badge label={a.badge} color={a.bc} bg={a.bb}/>
                    {!a.live&&<span style={{fontSize:11,color:T.muted,fontStyle:"italic"}}>Coming soon</span>}
                  </div>
                  <p style={{fontSize:12,color:T.muted,margin:0}}>{a.desc}</p>
                </div>
                <ChevronRight size={16} color={T.muted} style={{marginTop:4}}/>
              </button>
            ))}
          </div>
        </div>
      )}

      {assessing&&(
        <LanguageScreenApp
          studentName={assessing.name}
          studentDob={assessing.dob}
          schoolName=""
          assessorName=""
          onClose={()=>setAssessing(null)}
          onComplete={()=>setAssessing(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLASS DETAIL
// ═══════════════════════════════════════════════════════════
function ClassDetail({cls, onBack, onSelectPupil}) {
  const pupils = PUPILS.filter(p=>p.class===cls.id);
  const avgI = Math.round(pupils.reduce((s,p)=>s+p.is,0)/pupils.length*10)/10;
  const avgE = Math.round(pupils.reduce((s,p)=>s+p.es,0)/pupils.length*10)/10;
  const senCount = pupils.filter(p=>p.sen.status!=="None").length;
  const gldCount = pupils.filter(p=>elgScore(p).gld).length;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
          padding:"6px 14px",border:`1px solid ${T.border}`,borderRadius:8,
          background:"white",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer"}}>
          <ChevronLeft size={14}/> All Classes
        </button>
        <span style={{color:T.border,fontSize:16}}>›</span>
        <span style={{fontSize:13,color:T.muted}}>{cls.name}</span>
      </div>

      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:16}}>
          <div style={{width:56,height:56,borderRadius:12,background:T.goldLight,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:18,color:T.gold}}>{cls.name.split(" ")[1]}</div>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>{cls.name}</h2>
            <p style={{fontSize:13,color:T.muted,margin:0}}>
              Class Teacher: <strong style={{color:T.text}}>{cls.teacher}</strong> · 
              Teaching Assistant: <strong style={{color:T.text}}>{cls.ta}</strong> · 
              {cls.room}
            </p>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {[
            {l:"Pupils",v:pupils.length},
            {l:"Avg. Initial Score",v:avgI,c:lc(getLight(avgI))},
            {l:"Avg. Current Score",v:avgE,c:lc(getLight(avgE))},
            {l:"GLD on Track",v:`${gldCount}/${pupils.length}`,c:T.green},
            {l:"SEN / SEND",v:senCount,c:senCount>0?T.amber:T.green},
          ].map(s=>(
            <div key={s.l} style={{background:T.light,borderRadius:8,padding:"12px",textAlign:"center"}}>
              <p style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",
                letterSpacing:"0.04em",margin:"0 0 4px"}}>{s.l}</p>
              <p style={{fontSize:20,fontWeight:800,color:s.c||T.navy,margin:0,fontFamily:"Georgia,serif"}}>{s.v}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,padding:"14px 18px",background:T.goldLight,borderRadius:8,fontSize:13,lineHeight:1.6}}>
          <strong style={{color:T.amber}}>AI Class Summary: </strong>
          <span style={{color:T.text}}>{cls.name} has {pupils.length} pupils. Average LanguageScreen score improved from {avgI} to {avgE} — a class gain of +{Math.round((avgE-avgI)*10)/10} points. {gldCount} pupils ({Math.round(gldCount/pupils.length*100)}%) are on track for GLD. {senCount} pupil{senCount!==1?"s":""} {senCount!==1?"have":"has"} SEN or SEND support needs. {pupils.filter(p=>p.neli).length} {pupils.filter(p=>p.neli).length===1?"pupil":"pupils"} {pupils.filter(p=>p.neli).length===1?"is":"are"} on the NELI intervention programme.</span>
        </div>
      </Card>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:0}}>Pupils in {cls.name}</h3>
          <span style={{fontSize:12,color:T.muted}}>{pupils.length} pupils · Click a pupil to view full profile</span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Name","Flags","Initial","Current","Gain","ELG","Wellbeing","Attendance","SEN",""].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,
                color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",
                borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {pupils.map((p,i)=>{
              const sc = elgScore(p);
              const gain = p.es-p.is;
              return (
                <tr key={p.id} onClick={()=>onSelectPupil(p)}
                  style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                  background:i%2===0?"white":T.light,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#F0F7FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":T.light}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <InitialsBadge name={p.name} size={28}/>
                      <span style={{fontWeight:600,color:T.text}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
                      {p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
                      {p.neli&&<Badge label="NELI" color={T.gold} bg={T.goldLight}/>}
                    </div>
                  </td>
                  <td style={{padding:"12px 14px"}}><TrafficDot score={p.is}/></td>
                  <td style={{padding:"12px 14px"}}><TrafficDot score={p.es}/></td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontWeight:700,color:gain>0?T.green:T.muted}}>+{gain}</span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontSize:13,fontWeight:700,color:sc.gld?T.green:T.amber}}>
                      {sc.expected}/17
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontSize:13,fontWeight:700,color:LeuvColor(p.leuven.wellbeing)}}>
                      {p.leuven.wellbeing}/5
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontSize:13,fontWeight:700,color:p.attendance>=90?T.green:T.red}}>
                      {p.attendance}%
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    {p.sen.status!=="None"&&<Badge label={p.sen.status} color={T.red} bg={T.redBg}/>}
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <ChevronRight size={16} color={T.muted}/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLASSES PAGE
// ═══════════════════════════════════════════════════════════
function ClassesPage({onSelectClass}) {
  const totalSen = PUPILS.filter(p=>p.sen.status!=="None").length;
  const totalGld = PUPILS.filter(p=>elgScore(p).gld).length;

  return (
    <div>
      <SectionTitle title="Classes" subtitle="Parkside Primary · Reception 2024–25 · 2 classes · 28 pupils"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Classes" value="2" sub="Reception A & B" icon={Users}/>
        <StatCard label="Total Pupils" value="28" sub="Across both classes" icon={Users}/>
        <StatCard label="GLD on Track" value={`${totalGld}/28`} sub={`${Math.round(totalGld/28*100)}% of cohort`} icon={Award} color={T.green}/>
        <StatCard label="SEN / SEND" value={totalSen} sub="Pupils with support needs" icon={AlertCircle} color={totalSen>0?T.amber:T.green}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {CLASSES.map(cls=>{
          const pupils = PUPILS.filter(p=>p.class===cls.id);
          const avgI = Math.round(pupils.reduce((s,p)=>s+p.is,0)/pupils.length*10)/10;
          const avgE = Math.round(pupils.reduce((s,p)=>s+p.es,0)/pupils.length*10)/10;
          const senC = pupils.filter(p=>p.sen.status!=="None").length;
          const gldC = pupils.filter(p=>elgScore(p).gld).length;
          const neliC = pupils.filter(p=>p.neli).length;
          const lowAtt = pupils.filter(p=>p.attendance<90).length;

          return (
            <div key={cls.id} onClick={()=>onSelectClass(cls)}
              style={{background:T.card,border:`1px solid ${T.border}`,borderTop:`4px solid ${T.navy}`,
                borderRadius:12,padding:"24px",cursor:"pointer",transition:"border-color 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
                <div style={{width:52,height:52,borderRadius:12,background:T.goldLight,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontWeight:900,fontSize:20,color:T.gold}}>{cls.name.split(" ")[1]}</div>
                <div>
                  <h3 style={{fontSize:17,fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>{cls.name}</h3>
                  <p style={{fontSize:12,color:T.muted,margin:0}}>{cls.teacher} · {cls.ta} · {cls.room}</p>
                </div>
                <ChevronRight size={20} color={T.muted} style={{marginLeft:"auto"}}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                {[
                  {l:"Pupils",v:pupils.length},
                  {l:"Avg Score",v:avgE,c:lc(getLight(avgE))},
                  {l:"GLD on Track",v:`${gldC}/${pupils.length}`,c:T.green},
                  {l:"NELI Pupils",v:neliC,c:T.gold},
                  {l:"SEN / SEND",v:senC,c:senC>0?T.amber:T.muted},
                  {l:"Low Attend.",v:lowAtt,c:lowAtt>0?T.red:T.muted},
                ].map(s=>(
                  <div key={s.l} style={{background:T.light,borderRadius:8,padding:"10px 12px"}}>
                    <p style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",
                      letterSpacing:"0.04em",margin:"0 0 2px"}}>{s.l}</p>
                    <p style={{fontSize:18,fontWeight:800,color:s.c||T.navy,margin:0,fontFamily:"Georgia,serif"}}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:T.muted}}>Avg. score progress</span>
                  <span style={{fontSize:11,fontWeight:700,color:T.navy}}>{avgI} → {avgE} (+{Math.round((avgE-avgI)*10)/10})</span>
                </div>
                <div style={{background:T.border,borderRadius:20,height:8,overflow:"hidden"}}>
                  <div style={{width:`${avgE/130*100}%`,height:"100%",background:T.navy,borderRadius:20}}/>
                </div>
              </div>

              <div style={{padding:"10px 14px",background:T.goldLight,borderRadius:8,fontSize:12,color:T.amber}}>
                <strong>AI snapshot: </strong>
                {`${pupils.length} pupils · Score gain +${Math.round((avgE-avgI)*10)/10} pts · ${gldC} GLD on track · ${senC} SEN · ${neliC} NELI`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function Dashboard() {
  const distribData = [
    {range:"<75",   count:PUPILS.filter(p=>p.is<75).length,           fill:"#EF4444"},
    {range:"75–84", count:PUPILS.filter(p=>p.is>=75&&p.is<85).length, fill:"#F97316"},
    {range:"85–89", count:PUPILS.filter(p=>p.is>=85&&p.is<90).length, fill:"#F59E0B"},
    {range:"90–94", count:PUPILS.filter(p=>p.is>=90&&p.is<95).length, fill:"#84CC16"},
    {range:"95–99", count:PUPILS.filter(p=>p.is>=95&&p.is<100).length,fill:"#22C55E"},
    {range:"100+",  count:PUPILS.filter(p=>p.is>=100).length,         fill:"#10B981"},
  ];
  const MONTHS = [{month:"Sep",score:91},{month:"Oct",score:91.8},{month:"Nov",score:92.4},{month:"Dec",score:93.1},{month:"Jan",score:94.2},{month:"Feb",score:95.3},{month:"Mar",score:96.8}];
  const neliCompare = neliPupils.map(p=>({name:p.name.split(" ")[0],initial:p.is,end:p.es}));

  return (
    <div>
      <SectionTitle title="School Dashboard" subtitle="Parkside Primary · Reception 2024–25 · Week 17 of 20"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Pupils Assessed" value="28" sub="100% of cohort" icon={CheckCircle2} color={T.green}/>
        <StatCard label="NELI Pupils" value="5" sub="On programme, week 17" icon={Target} color={T.navy}/>
        <StatCard label="NELI Avg. Gain" value={`+${neliAvgGain}`} sub="Standard score points" icon={TrendingUp} color={T.green}/>
        <StatCard label="Needs Attention" value={redC} sub="Below standard threshold" icon={AlertCircle} color={T.red} alert="red"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}>Class Score Distribution</h3>
          <p style={{fontSize:12,color:T.muted,margin:"0 0 12px"}}>Initial LanguageScreen scores</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distribData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="range" tick={{fontSize:10,fill:T.muted}}/>
              <YAxis tick={{fontSize:10,fill:T.muted}}/>
              <Tooltip/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {distribData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}>NELI Intervention Impact</h3>
          <p style={{fontSize:12,color:T.muted,margin:"0 0 12px"}}>Before & after for 5 NELI pupils</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={neliCompare} margin={{top:0,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.muted}}/>
              <YAxis domain={[55,100]} tick={{fontSize:10,fill:T.muted}}/>
              <Tooltip/>
              <Bar dataKey="initial" fill="#FBBF24" radius={[3,3,0,0]} name="Initial"/>
              <Bar dataKey="end" fill={T.green} radius={[3,3,0,0]} name="End"/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Class Progress Over Year</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={MONTHS} margin={{top:0,right:10,left:-20,bottom:0}}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.navy} stopOpacity={0.15}/><stop offset="95%" stopColor={T.navy} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:T.muted}}/>
              <YAxis domain={[89,98]} tick={{fontSize:10,fill:T.muted}}/>
              <Tooltip/>
              <Area type="monotone" dataKey="score" stroke={T.navy} fill="url(#pg)" strokeWidth={2} name="Avg. Score"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Programme — Week 17 of 20</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:3,marginBottom:12}}>
            {Array.from({length:20},(_,i)=>(
              <div key={i} style={{aspectRatio:1,borderRadius:4,
                background:i<16?T.navy:i===16?T.gold:T.border,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:7,color:i<16?"white":i===16?T.gold:T.muted,fontWeight:700}}>{i+1}</div>
            ))}
          </div>
          {neliPupils.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:12,color:T.text,fontWeight:600}}>{p.name.split(" ")[0]}</span>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <TrafficDot score={p.is}/>
                <span style={{fontSize:10,color:T.muted}}>→</span>
                <TrafficDot score={p.es}/>
                <Badge label={`+${p.es-p.is}`} color={T.green} bg={T.greenBg}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LANGUAGESCREEN PAGE
// ═══════════════════════════════════════════════════════════
function LanguageScreenPage({onSelectPupil}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = PUPILS.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p=>filter==="all"||getLight(p.is)===filter||(filter==="neli"&&p.neli))
    .sort((a,b)=>a.is-b.is);

  return (
    <div>
      <SectionTitle title="LanguageScreen Results" subtitle="Reception cohort · Autumn 2024 & Spring 2025 assessment"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Assessed" value="28/28" sub="100% complete" icon={CheckCircle2} color={T.green}/>
        <StatCard label="Class Average" value={classAvgI} sub={`End year: ${classAvgE}`} icon={TrendingUp}/>
        <StatCard label="Needs Support" value={redC} sub="Score below 85" icon={AlertCircle} color={T.red} alert="red"/>
        <StatCard label="NELI Selected" value="5" sub="Lowest 5 scorers" icon={Star} color={T.gold}/>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:180}}>
            <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.muted}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pupils..."
              style={{width:"100%",paddingLeft:32,height:36,border:`1px solid ${T.border}`,
                borderRadius:8,fontSize:13,outline:"none",background:T.light,boxSizing:"border-box"}}/>
          </div>
          {[["all","All"],["red","Needs Support"],["amber","Monitor"],["green","On Track"],["neli","NELI Only"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 14px",borderRadius:20,
              fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===v?T.navy:T.border}`,
              background:filter===v?T.navy:"transparent",color:filter===v?"white":T.muted}}>
              {l}
            </button>
          ))}
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Pupil","Flags","Initial","Status","End Score","Gain","ELG","NELI",""].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,
                color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",
                borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((p,i)=>{
              const il = getLight(p.is); const gain = p.es-p.is; const sc = elgScore(p);
              return (
                <tr key={p.id} onClick={()=>onSelectPupil(p)}
                  style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                  background:p.neli?"#FFFDF5":i%2===0?"white":T.light}}
                  onMouseEnter={e=>e.currentTarget.style.background="#F0F7FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=p.neli?"#FFFDF5":i%2===0?"white":T.light}>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <InitialsBadge name={p.name} size={28}/>
                      <span style={{fontWeight:600,color:T.text}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:3}}>
                      {p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
                      {p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
                    </div>
                  </td>
                  <td style={{padding:"10px 14px"}}><TrafficDot score={p.is}/></td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                      background:lb(il),color:lc(il)}}>{ll(il)}</span>
                  </td>
                  <td style={{padding:"10px 14px"}}><TrafficDot score={p.es}/></td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{fontWeight:700,color:gain>0?T.green:T.muted}}>+{gain}</span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{fontWeight:700,color:sc.gld?T.green:T.amber}}>{sc.expected}/17</span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    {p.neli&&<Badge label="✓ NELI"/>}
                  </td>
                  <td style={{padding:"10px 14px"}}><ChevronRight size={14} color={T.muted}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NELI TRACKER
// ═══════════════════════════════════════════════════════════
function NELITracker() {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <SectionTitle title="NELI Intervention Tracker" subtitle="20-week programme · 5 pupils · Week 17 of 20"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Programme Week" value="17 / 20" sub="3 weeks remaining" icon={BookOpen}/>
        <StatCard label="Avg. Sessions/Week" value="4.8" sub="Target: 5" icon={CheckCircle2} color={T.green}/>
        <StatCard label="Avg. Score Gain" value={`+${neliAvgGain}`} sub="Standard score points" icon={TrendingUp} color={T.green}/>
        <StatCard label="Midpoint Review" value="Done" sub="Week 10 complete" icon={Award} color={T.green}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {neliPupils.map(p=>{
          const gain = p.es-p.is; const isOpen = selected===p.id;
          return (
            <Card key={p.id} style={{padding:0,overflow:"hidden"}}>
              <div onClick={()=>setSelected(isOpen?null:p.id)} style={{
                padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,
                background:isOpen?T.light:"white",borderBottom:isOpen?`1px solid ${T.border}`:"none"}}>
                <InitialsBadge name={p.name}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15,color:T.text}}>{p.name}</span>
                    {p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
                    {p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
                    {p.sen.status!=="None"&&<Badge label={p.sen.status} color={T.red} bg={T.redBg}/>}
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:12,color:T.muted}}>
                    <span>Initial: <strong style={{color:lc(getLight(p.is))}}>{p.is}</strong></span>
                    <span>Current: <strong style={{color:lc(getLight(p.es))}}>{p.es}</strong></span>
                    <span>Gain: <strong style={{color:T.green}}>+{gain} pts</strong></span>
                  </div>
                </div>
                <Badge label={`+${gain} pts`} color={T.green} bg={T.greenBg}/>
                <ChevronRight size={18} color={T.muted} style={{transform:isOpen?"rotate(90deg)":"none",transition:"0.2s"}}/>
              </div>
              {isOpen&&<div style={{padding:"20px 24px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:5,marginBottom:16}}>
                  {Array.from({length:20},(_,i)=>(
                    <div key={i} style={{borderRadius:6,border:`2px solid ${i===16?T.gold:i<16?T.navy:"transparent"}`,
                      background:i<16?T.navy:i===16?"#FFFDF5":T.border,padding:"6px 4px",textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:700,color:i<16?"white":i===16?T.gold:T.muted}}>WK {i+1}</div>
                      {i<16&&<div style={{fontSize:8,color:"rgba(255,255,255,0.6)",marginTop:2}}>3G 2I</div>}
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[["Sessions Done","80/100","of target"],["Group Sessions","48/60","complete"],["Attendance","96%","session rate"]].map(([l,v,s])=>(
                    <div key={l} style={{background:T.light,borderRadius:8,padding:"12px"}}>
                      <p style={{fontSize:10,color:T.muted,margin:"0 0 4px",textTransform:"uppercase",fontWeight:700}}>{l}</p>
                      <p style={{fontSize:20,fontWeight:800,color:T.navy,margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{v}</p>
                      <p style={{fontSize:11,color:T.muted,margin:0}}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REPORTS (Enhanced — inline content + top export)
// ═══════════════════════════════════════════════════════════
function Reports() {
  const [openReport, setOpenReport] = useState(null);

  const REPORTS = [
    {id:"impact",    title:"End-of-Year Impact Report",    badge:"Full Report",     updated:"Due June 2025",ready:false},
    {id:"class",     title:"LanguageScreen Class Report",  badge:"Class Report",    updated:"Generated Mar 2025",ready:true},
    {id:"individual",title:"Individual Pupil Reports",     badge:"5 Reports",       updated:"Ready to generate",ready:true},
    {id:"trust",     title:"Trust Benchmark Report",       badge:"Trust Report",    updated:"Generated Mar 2025",ready:true},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <SectionTitle title="Reports & Analytics" subtitle="Automated, shareable reports for governors, SLT and DfE"/>
        <div style={{display:"flex",gap:8}}>
          <button style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",
            borderRadius:8,border:`1px solid ${T.border}`,background:"white",
            fontSize:13,fontWeight:600,color:T.muted,cursor:"pointer"}}>
            <Printer size={15}/> Print All
          </button>
          <button style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",
            borderRadius:8,border:"none",background:T.navy,color:"white",
            fontSize:13,fontWeight:700,cursor:"pointer"}}>
            <Download size={15}/> Export All Reports
          </button>
        </div>
      </div>

      {/* Report cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        {REPORTS.map(r=>(
          <div key={r.id} style={{background:T.card,border:`1px solid ${openReport===r.id?T.navy:T.border}`,
            borderRadius:12,padding:"20px",transition:"border-color 0.15s"}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:44,height:44,borderRadius:10,background:T.goldLight,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <FileText size={22} color={T.gold}/>
              </div>
              <div style={{flex:1}}>
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}>{r.title}</h3>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                  <Badge label={r.badge}/>
                  <span style={{fontSize:11,color:T.muted}}>{r.updated}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>setOpenReport(openReport===r.id?null:r.id)} style={{
                  display:"flex",alignItems:"center",gap:5,padding:"7px 12px",
                  borderRadius:8,border:`1px solid ${T.border}`,background:"white",
                  fontSize:12,fontWeight:600,color:T.navy,cursor:"pointer"}}>
                  <Eye size={13}/> {openReport===r.id?"Hide":"View"}
                </button>
                <button style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",
                  borderRadius:8,border:"none",background:T.navy,
                  fontSize:12,fontWeight:600,color:"white",cursor:"pointer"}}>
                  <Download size={13}/> Export
                </button>
              </div>
            </div>

            {/* Inline report content */}
            {openReport===r.id&&(
              <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
                {r.id==="class"&&(
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>
                      Parkside Primary · LanguageScreen Class Report · March 2025
                    </p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                      {[["Pupils Assessed","28/28"],["Class Avg. Initial","91.2"],["Class Avg. Current","96.8"]].map(([l,v])=>(
                        <div key={l} style={{background:T.light,borderRadius:8,padding:"12px",textAlign:"center"}}>
                          <p style={{fontSize:10,color:T.muted,margin:"0 0 4px",textTransform:"uppercase",fontWeight:600}}>{l}</p>
                          <p style={{fontSize:20,fontWeight:800,color:T.navy,margin:0,fontFamily:"Georgia,serif"}}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={PUPILS.slice(0,10).map(p=>({name:p.name.split(" ")[0],initial:p.is,end:p.es}))}
                        margin={{top:0,right:0,left:-20,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                        <XAxis dataKey="name" tick={{fontSize:9,fill:T.muted}}/>
                        <YAxis tick={{fontSize:9,fill:T.muted}}/>
                        <Tooltip/>
                        <Bar dataKey="initial" fill="#FBBF24" radius={[2,2,0,0]} name="Initial"/>
                        <Bar dataKey="end" fill={T.green} radius={[2,2,0,0]} name="End"/>
                      </BarChart>
                    </ResponsiveContainer>
                    <p style={{fontSize:11,color:T.muted,margin:"8px 0 0",textAlign:"center"}}>Showing first 10 pupils · Full report includes all 28</p>
                  </div>
                )}
                {r.id==="individual"&&(
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Individual reports ready for 5 NELI pupils</p>
                    {neliPupils.map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"10px 14px",border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <InitialsBadge name={p.name} size={28}/>
                          <div>
                            <p style={{fontSize:13,fontWeight:600,color:T.text,margin:0}}>{p.name}</p>
                            <p style={{fontSize:11,color:T.muted,margin:0}}>
                              {p.is} → {p.es} (+{p.es-p.is} pts) · {elgScore(p).expected}/17 ELGs expected
                            </p>
                          </div>
                        </div>
                        <button style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${T.border}`,
                          background:"white",fontSize:11,fontWeight:600,color:T.navy,cursor:"pointer",
                          display:"flex",alignItems:"center",gap:5}}>
                          <Download size={11}/> Parent Report
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {r.id==="trust"&&(
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Oak Valley MAT · Trust Benchmark · 4 Schools</p>
                    {TRUST.map(s=>(
                      <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"10px 14px",border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
                        <div>
                          <p style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 2px"}}>{s.name}</p>
                          <p style={{fontSize:11,color:T.muted,margin:0}}>{s.pupils} pupils · {s.neli} NELI · Week {s.weeks}/20</p>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <p style={{fontSize:16,fontWeight:800,color:T.navy,margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{s.avgI}</p>
                          <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,
                            background:s.status==="good"?T.greenBg:s.status==="warning"?T.amberBg:T.redBg,
                            color:s.status==="good"?T.green:s.status==="warning"?T.amber:T.red}}>
                            {s.status==="good"?"All Good":s.status==="warning"?"Attention":"Action Required"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {r.id==="impact"&&(
                  <div style={{padding:"16px",background:T.amberBg,borderRadius:8,
                    fontSize:13,color:T.amber,textAlign:"center"}}>
                    End-of-year report will be available after final LanguageScreen reassessment (Week 20, due June 2025).
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Impact summary */}
      <Card>
        <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>Impact Summary — Reception 2024–25</h3>
        <p style={{fontSize:13,color:T.muted,margin:"0 0 16px"}}>Parkside Primary · 28 pupils assessed · 5 NELI pupils</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[["Class Avg. (Sept)","91.2","All 28 pupils"],["Class Avg. (Mar)","96.8","Current estimate"],[`NELI Avg. Gain`,`+${neliAvgGain} pts`,"vs +2.3 class avg"],["FSM Pupils Progress","+14.2 pts","Equiv. ~7 months"]].map(([l,v,s])=>(
            <div key={l} style={{background:T.light,borderRadius:10,padding:"14px",textAlign:"center",border:`1px solid ${T.border}`}}>
              <p style={{fontSize:10,color:T.muted,margin:"0 0 6px",textTransform:"uppercase",fontWeight:600,letterSpacing:"0.04em"}}>{l}</p>
              <p style={{fontSize:24,fontWeight:800,color:T.navy,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>{v}</p>
              <p style={{fontSize:11,color:T.muted,margin:0}}>{s}</p>
            </div>
          ))}
        </div>
        <div style={{padding:"14px 18px",background:T.goldLight,borderRadius:10,fontSize:13}}>
          <strong style={{color:T.amber}}>Research Context: </strong>
          <span style={{color:T.text}}>EEF evidence shows NELI pupils make an average of <strong>4 additional months</strong> of language progress. FSM-eligible pupils gain the equivalent of <strong>7 months</strong> additional progress. NELI is rated <strong>5/5 padlocks</strong> for evidence security — the only early years intervention to achieve this. Effects persist 2 years post-intervention, with gains in reading comprehension and single word reading seen at Year 2.</span>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRUST VIEW
// ═══════════════════════════════════════════════════════════
function TrustView() {
  const sColor = s=>s==="good"?T.green:s==="warning"?T.amber:T.red;
  const sBg = s=>s==="good"?T.greenBg:s==="warning"?T.amberBg:T.redBg;
  const sLabel = s=>s==="good"?"All Good":s==="warning"?"Attention Needed":"Action Required";
  const trustAvg = Math.round(TRUST.filter(t=>t.avgE).reduce((s,t)=>s+(t.avgE-t.avgI),0)/TRUST.filter(t=>t.avgE).length*10)/10;
  const trustCompare = TRUST.map(s=>({name:s.short,fullName:s.name,initial:s.avgI,end:s.avgE||s.avgI}));

  return (
    <div>
      <SectionTitle title="Trust View" subtitle="Oak Valley Multi-Academy Trust · 4 schools · Spring 2025"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Trust Pupils" value={TRUST.reduce((s,t)=>s+t.pupils,0)} icon={Users}/>
        <StatCard label="NELI Pupils" value={TRUST.reduce((s,t)=>s+t.neli,0)} icon={Target} color={T.navy}/>
        <StatCard label="Trust Avg. Gain" value={`+${trustAvg}`} icon={TrendingUp} color={T.green}/>
        <StatCard label="Schools w/ Alerts" value={TRUST.filter(t=>t.status!=="good").length} icon={AlertCircle} color={T.red} alert="red"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:16}}>
        {TRUST.map(school=>(
          <div key={school.id} style={{background:T.card,border:`1px solid ${T.border}`,
            borderTop:`4px solid ${sColor(school.status)}`,borderRadius:12,padding:"20px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{width:44,height:44,borderRadius:12,background:T.goldLight,display:"flex",
                  alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:T.gold,marginBottom:8}}>
                  {school.short}
                </div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 6px"}}>{school.name}</h3>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                  background:sBg(school.status),color:sColor(school.status)}}>{sLabel(school.status)}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:11,color:T.muted,margin:"0 0 2px"}}>Avg. Score</p>
                <p style={{fontSize:24,fontWeight:800,color:T.navy,margin:"0 0 6px",fontFamily:"Georgia,serif"}}>{school.avgI}</p>
                {school.avgE&&<p style={{fontSize:14,fontWeight:700,color:T.green,margin:0}}>→ {school.avgE} (+{Math.round((school.avgE-school.avgI)*10)/10})</p>}
                {!school.avgE&&<p style={{fontSize:12,color:T.amber,fontWeight:600,margin:0}}>End data pending</p>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              {[["Pupils",school.pupils],["NELI",school.neli],["Assessed",`${school.assessed}%`]].map(([l,v])=>(
                <div key={l} style={{background:T.light,borderRadius:8,padding:"8px",textAlign:"center"}}>
                  <p style={{fontSize:10,color:T.muted,margin:"0 0 2px",fontWeight:600,textTransform:"uppercase"}}>{l}</p>
                  <p style={{fontSize:16,fontWeight:800,color:T.navy,margin:0,fontFamily:"Georgia,serif"}}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,color:T.muted}}>Programme progress</span>
                <span style={{fontSize:11,fontWeight:700,color:T.navy}}>Week {school.weeks}/20</span>
              </div>
              <div style={{background:T.border,borderRadius:20,height:6,overflow:"hidden"}}>
                <div style={{width:`${school.weeks/20*100}%`,height:"100%",
                  background:school.status==="alert"?T.red:T.navy,borderRadius:20}}/>
              </div>
            </div>
            {school.status!=="good"&&(
              <div style={{padding:"8px 12px",background:sBg(school.status),borderRadius:8,
                fontSize:12,color:sColor(school.status),fontWeight:600,
                display:"flex",alignItems:"center",gap:6}}>
                <AlertCircle size={13}/>
                {school.status==="warning"?"End-year assessment incomplete for some pupils"
                  :"Programme significantly behind schedule — needs immediate support"}
              </div>
            )}
          </div>
        ))}
      </div>
      <Card>
        <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>School Comparison</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={trustCompare} margin={{top:0,right:10,left:-15,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
            <XAxis dataKey="fullName" tick={{fontSize:11,fill:T.muted}}/>
            <YAxis domain={[82,100]} tick={{fontSize:11,fill:T.muted}}/>
            <Tooltip/>
            <Bar dataKey="initial" fill="#DBEAFE" radius={[3,3,0,0]} name="Initial"/>
            <Bar dataKey="end" fill={T.navy} radius={[3,3,0,0]} name="End"/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRAINING
// ═══════════════════════════════════════════════════════════
function Training({onStartTraining}) {
  return (
    <div>
      <SectionTitle title="Training Hub" subtitle="CPD-certified NELI courses · FutureLearn platform"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Fully Trained" value="2 / 4" sub="All 3 courses complete" icon={Award} color={T.green}/>
        <StatCard label="In Progress" value="2" sub="Course 3 outstanding" icon={BookOpen} color={T.amber}/>
        <StatCard label="CPD Hours" value="48" sub="Across all staff" icon={Star} color={T.gold}/>
      </div>
      <Card style={{padding:0,overflow:"hidden",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Staff","Role","Course 1","Course 2","Course 3","Status",""].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,
                color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",
                borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {STAFF.map((s,i)=>{
              const done=s.c1&&s.c2&&s.c3;
              return <tr key={s.name} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"white":T.light}}>
                <td style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <InitialsBadge name={s.name} size={30}/>
                    <span style={{fontWeight:600,color:T.text}}>{s.name}</span>
                  </div>
                </td>
                <td style={{padding:"12px 14px",color:T.muted}}>{s.role}</td>
                {[s.c1,s.c2,s.c3].map((c,ci)=>(
                  <td key={ci} style={{padding:"12px 14px"}}>
                    {c?<span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:T.green}}>
                      <CheckCircle2 size={14}/> Done</span>
                      :<span style={{fontSize:12,color:T.muted}}>Not started</span>}
                  </td>
                ))}
                <td style={{padding:"12px 14px"}}>
                  <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,
                    background:done?T.greenBg:T.amberBg,color:done?T.green:T.amber}}>
                    {done?"Fully Trained":"In Progress"}
                  </span>
                </td>
                <td style={{padding:"12px 14px"}}>
                  <button onClick={onStartTraining}
                    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",
                    borderRadius:8,border:"none",background:done?T.light:T.navy,
                    color:done?T.muted:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    <PlayCircle size={13}/>
                    {done?"Revisit Courses":"Start Training"}
                  </button>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[
          {t:"Course 1",d:"Language development & NELI evidence base",h:"4–5 hrs",r:"All NELI staff"},
          {t:"Course 2",d:"Programme structure & session delivery",h:"4–5 hrs",r:"All NELI staff"},
          {t:"Course 3",d:"Phonological awareness & letter-sound knowledge",h:"2–3 hrs",r:"NELI TAs only"},
        ].map(c=>(
          <Card key={c.t}>
            <div style={{width:40,height:40,borderRadius:10,background:T.goldLight,
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
              <BookOpen size={18} color={T.gold}/>
            </div>
            <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 6px"}}>{c.t}</h3>
            <p style={{fontSize:12,color:T.muted,margin:"0 0 10px",lineHeight:1.5}}>{c.d}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Badge label={c.h}/><Badge label={c.r} color={T.navy} bg={T.blueBg}/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRAINING COURSES (FutureLearn)
// ═══════════════════════════════════════════════════════════
const FL_COURSES = [
  {
    id:1,
    title:"NELI Course 1: Language Fundamentals",
    provider:"OxEd and Assessment",
    providerLogo:"OxEd",
    desc:"Enhance your understanding of oral language, why good language skills are so important and how NELI supports their development.",
    duration:"4–5 hours",
    weeks:3,
    level:"Introductory",
    type:"Course",
    status:"in-progress",
    progress:60,
    required:true,
    reqFor:"All NELI staff",
    url:"https://www.futurelearn.com/courses/neli-language-fundamentals",
    topics:["What is oral language?","Why language skills matter","How NELI was developed","The evidence behind NELI","Language development milestones","Identifying language difficulties"],
    imgBg:"#1B5E20",
    imgEmoji:"👩‍👧‍👦",
  },
  {
    id:2,
    title:"NELI Course 2: Delivering the Programme",
    provider:"OxEd and Assessment",
    providerLogo:"OxEd",
    desc:"Presents details of the NELI programme structure — how to plan and deliver group and individual sessions, and key strategies to support language skills.",
    duration:"4–5 hours",
    weeks:3,
    level:"Intermediate",
    type:"Course",
    status:"not-started",
    progress:0,
    required:true,
    reqFor:"All NELI staff",
    url:"https://www.futurelearn.com/courses/neli-delivering-programme",
    topics:["Programme structure & timeline","Group session delivery","Individual session delivery","Special Words vocabulary","Narrative & storytelling skills","Using the Ted puppet"],
    imgBg:"#1A237E",
    imgEmoji:"📚",
  },
  {
    id:3,
    title:"NELI Course 3: Phonics & Phonological Awareness",
    provider:"OxEd and Assessment",
    providerLogo:"OxEd",
    desc:"Essential training for delivering the second 10 weeks of NELI, covering phonological awareness and early letter-sound knowledge.",
    duration:"2–3 hours",
    weeks:2,
    level:"Intermediate",
    type:"Course",
    status:"not-started",
    progress:0,
    required:false,
    reqFor:"NELI TAs only",
    url:"https://www.futurelearn.com/courses/neli-phonics",
    topics:["What is phonological awareness?","Rhyme & alliteration activities","Phoneme identification","Letter-sound knowledge","Blending & segmenting","Links to early reading"],
    imgBg:"#B71C1C",
    imgEmoji:"🔤",
  },
  {
    id:4,
    title:"The Nuffield Early Language Intervention: Language Fundamentals — Training Course 1 of 3",
    provider:"The Department of Education, University of Oxford",
    providerLogo:"UoO",
    desc:"Enhance your understanding of oral language, why good language skills are so important and how NELI supports their development.",
    duration:"4–5 hours",
    weeks:3,
    level:"Introductory",
    type:"Course",
    status:"in-progress",
    progress:45,
    required:false,
    reqFor:"Oxford version",
    url:"https://www.futurelearn.com/courses/nuffield-early-language-intervention",
    topics:["University of Oxford research context","Language development science","NELI's evidence base","Oral language & literacy","Randomised controlled trials","Programme outcomes"],
    imgBg:"#004B87",
    imgEmoji:"🎓",
  },
  {
    id:5,
    title:"Language Fundamentals (US)",
    provider:"OxEd and Assessment",
    providerLogo:"OxEd",
    desc:"Enhance your understanding of oral language, why good language skills are so important and how TEL Ted supports their development.",
    duration:"4–5 hours",
    weeks:3,
    level:"Introductory",
    type:"Course",
    status:"not-started",
    progress:0,
    required:false,
    reqFor:"US schools",
    url:"https://www.futurelearn.com/courses/language-fundamentals-us",
    topics:["Oral language in US schools","Language development research","TEL Ted programme structure","Adapting NELI for US context","Assessment approaches","Family engagement strategies"],
    imgBg:"#1B3060",
    imgEmoji:"🇺🇸",
  },
  {
    id:6,
    title:"TEL Ted Support Hub",
    provider:"OxEd and Assessment",
    providerLogo:"OxEd",
    desc:"Look for information, ask questions, share tips and discuss TEL Ted with your fellow practitioners. A community space for NELI practitioners.",
    duration:"Ongoing",
    weeks:0,
    level:"All levels",
    type:"Community Hub",
    status:"enrolled",
    progress:100,
    required:false,
    reqFor:"All staff",
    url:"https://www.futurelearn.com/courses/tel-ted-support-hub",
    topics:["Community discussions","Practitioner Q&A","Sharing best practice","Expert mentor support","Weekly webinars","Resource library"],
    imgBg:"#E65100",
    imgEmoji:"🧸",
  },
  {
    id:7,
    title:"NELI Delivery Support Hub",
    provider:"OxEd and Assessment",
    providerLogo:"OxEd",
    desc:"Access additional materials, ask questions and connect with mentors throughout your NELI delivery. Available throughout the programme.",
    duration:"Ongoing",
    weeks:0,
    level:"All levels",
    type:"Support Hub",
    status:"enrolled",
    progress:100,
    required:true,
    reqFor:"All NELI staff",
    url:"https://www.futurelearn.com/courses/neli-delivery-support",
    topics:["Programme FAQ","Mentor support","Peer discussion forums","Webinar recordings","Midpoint review guidance","End-of-year guidance"],
    imgBg:"#4A148C",
    imgEmoji:"💬",
  },
];

const statusStyles = {
  "in-progress": {label:"In Progress",   color:"#1D4ED8", bg:"#EFF6FF"},
  "not-started": {label:"Not Started",   color:"#6B7280", bg:"#F9FAFB"},
  "enrolled":    {label:"Enrolled",      color:"#15803D", bg:"#DCFCE7"},
  "completed":   {label:"Completed",     color:"#15803D", bg:"#DCFCE7"},
};

function TrainingCourses({onBack, staffName}) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = FL_COURSES.filter(c =>
    filter==="all" || filter==="in-progress"&&c.status==="in-progress"
    || filter==="not-started"&&c.status==="not-started"
    || filter==="enrolled"&&c.status==="enrolled"
    || filter==="required"&&c.required
  );

  const CourseCard = ({course}) => {
    const ss = statusStyles[course.status];
    const isOpen = selected===course.id;
    return (
      <div style={{background:"white",border:`2px solid ${isOpen?"#1B3060":T.border}`,
        borderRadius:14,overflow:"hidden",transition:"border-color 0.15s"}}>

        {/* Hero image area */}
        <div style={{height:140,background:course.imgBg,position:"relative",
          display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <div style={{fontSize:64,opacity:0.25,position:"absolute"}}>{course.imgEmoji}</div>
          <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"0 20px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginBottom:6,
              fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>{course.provider}</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                background:"rgba(255,255,255,0.2)",color:"white"}}>{course.type}</span>
              {course.required&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,
                fontWeight:700,background:"#C8960C",color:"white"}}>Required</span>}
            </div>
          </div>
          {/* Progress bar on image */}
          {course.progress>0&&course.progress<100&&(
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:4,background:"rgba(0,0,0,0.3)"}}>
              <div style={{width:`${course.progress}%`,height:"100%",background:"#22C55E"}}/>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{padding:"16px 18px"}}>
          <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
              background:ss.bg,color:ss.color}}>{ss.label}</span>
            <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,
              background:T.light,color:T.muted}}>{course.level}</span>
            {course.duration!=="Ongoing"&&<span style={{padding:"3px 10px",borderRadius:20,
              fontSize:11,fontWeight:600,background:T.light,color:T.muted}}>{course.duration}</span>}
          </div>

          <h3 style={{fontSize:14,fontWeight:800,color:T.text,margin:"0 0 8px",lineHeight:1.4}}>
            {course.title}
          </h3>
          <p style={{fontSize:12,color:T.muted,margin:"0 0 12px",lineHeight:1.5}}>
            {course.desc}
          </p>

          {/* Progress */}
          {course.status==="in-progress"&&(
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,color:T.muted}}>Progress</span>
                <span style={{fontSize:11,fontWeight:700,color:"#1D4ED8"}}>{course.progress}%</span>
              </div>
              <div style={{background:T.border,borderRadius:20,height:6,overflow:"hidden"}}>
                <div style={{width:`${course.progress}%`,height:"100%",
                  background:"#1D4ED8",borderRadius:20}}/>
              </div>
            </div>
          )}

          {/* Required for */}
          <div style={{fontSize:11,color:T.muted,marginBottom:12}}>
            Required for: <strong style={{color:T.text}}>{course.reqFor}</strong>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8}}>
            <a href={course.url} target="_blank" rel="noreferrer" style={{flex:1,display:"flex",
              alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:8,
              border:"none",background:"#D4007A",color:"white",fontSize:13,fontWeight:700,
              cursor:"pointer",textDecoration:"none"}}>
              <PlayCircle size={15}/>
              {course.status==="in-progress"?"Continue Course"
               :course.status==="enrolled"||course.status==="completed"?"Go to Course"
               :"Start Course"}
            </a>
            <button onClick={()=>setSelected(isOpen?null:course.id)}
              style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,
              background:"white",fontSize:13,fontWeight:600,color:T.muted,cursor:"pointer"}}>
              {isOpen?"Less":"Details"}
            </button>
          </div>

          {/* Expanded details */}
          {isOpen&&(
            <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
              <p style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 8px"}}>
                What you'll learn:
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {course.topics.map(t=>(
                  <div key={t} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:T.muted}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#D4007A",
                      marginTop:4,flexShrink:0}}/>
                    {t}
                  </div>
                ))}
              </div>
              {course.weeks>0&&<div style={{marginTop:12,padding:"10px 14px",background:T.light,
                borderRadius:8,fontSize:12,color:T.muted}}>
                <strong style={{color:T.text}}>{course.weeks} weeks</strong> · Self-paced · CPD certified · Hosted on FutureLearn
              </div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const inProgress = FL_COURSES.filter(c=>c.status==="in-progress").length;
  const notStarted = FL_COURSES.filter(c=>c.status==="not-started"&&c.required).length;
  const completed = FL_COURSES.filter(c=>c.status==="completed"||c.status==="enrolled").length;

  return (
    <div>
      {/* Back header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
          padding:"6px 14px",border:`1px solid ${T.border}`,borderRadius:8,
          background:"white",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer"}}>
          <ChevronLeft size={14}/> Back to Training
        </button>
        <span style={{color:T.border,fontSize:16}}>›</span>
        <span style={{fontSize:13,color:T.muted}}>FutureLearn Courses</span>
      </div>

      {/* FutureLearn banner */}
      <div style={{background:"linear-gradient(135deg,#2D0557 0%,#D4007A 100%)",borderRadius:14,
        padding:"24px 28px",marginBottom:20,display:"flex",alignItems:"center",gap:20}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{background:"white",borderRadius:8,padding:"6px 12px",
              display:"inline-flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:16,fontWeight:900,color:"#2D0557",letterSpacing:"-0.5px",fontFamily:"Georgia,serif"}}>
                Future
              </span>
              <span style={{fontSize:16,fontWeight:900,color:"#D4007A",letterSpacing:"-0.5px",fontFamily:"Georgia,serif"}}>
                Learn
              </span>
            </div>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>× OxEd & Assessment</span>
          </div>
          <h2 style={{fontSize:20,fontWeight:800,color:"white",margin:"0 0 6px",fontFamily:"Georgia,serif"}}>
            Your NELI Training — {staffName||"Sarah Mitchell"}
          </h2>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",margin:0}}>
            CPD-certified · Self-paced · Expert-mentored · All hosted on FutureLearn
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,flexShrink:0}}>
          {[["In Progress",inProgress,"#EFF6FF","#1D4ED8"],["Required Outstanding",notStarted,"#FEF2F2","#B91C1C"],["Enrolled",completed,"#DCFCE7","#15803D"]].map(([l,v,bg,c])=>(
            <div key={l} style={{background:"rgba(255,255,255,0.15)",borderRadius:10,
              padding:"12px 16px",textAlign:"center",minWidth:100}}>
              <p style={{fontSize:24,fontWeight:900,color:"white",margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{v}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.7)",margin:0}}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","All Courses"],["in-progress","In Progress"],["not-started","Not Started"],["required","Required Only"],["enrolled","Enrolled"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"7px 16px",borderRadius:20,
            fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===v?"#D4007A":T.border}`,
            background:filter===v?"#D4007A":"white",color:filter===v?"white":T.muted}}>
            {l}
          </button>
        ))}
        <div style={{marginLeft:"auto",fontSize:12,color:T.muted,alignSelf:"center"}}>
          {filtered.length} course{filtered.length!==1?"s":""}
        </div>
      </div>

      {/* Course grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
        {filtered.map(c=><CourseCard key={c.id} course={c}/>)}
      </div>

      {/* Required courses checklist */}
      <Card>
        <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>
          Your Training Checklist
        </h3>
        <p style={{fontSize:12,color:T.muted,margin:"0 0 16px"}}>Required courses for NELI delivery</p>
        {FL_COURSES.filter(c=>c.required).map(c=>{
          const ss = statusStyles[c.status];
          return (
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:14,
              padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,
                background:c.status==="in-progress"?T.blueBg:c.status==="not-started"?T.light:T.greenBg,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {c.status==="not-started"
                  ?<span style={{fontSize:13,color:T.muted}}>○</span>
                  :c.status==="in-progress"
                  ?<span style={{fontSize:11,fontWeight:700,color:"#1D4ED8"}}>{c.progress}%</span>
                  :<CheckCircle2 size={16} color={T.green}/>}
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:600,color:T.text,margin:"0 0 2px"}}>{c.title}</p>
                <p style={{fontSize:11,color:T.muted,margin:0}}>{c.duration} · {c.reqFor}</p>
              </div>
              <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                background:ss.bg,color:ss.color}}>{ss.label}</span>
              <a href={c.url} target="_blank" rel="noreferrer"
                style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#D4007A",
                color:"white",fontSize:12,fontWeight:700,cursor:"pointer",textDecoration:"none",
                display:"inline-flex",alignItems:"center",gap:5}}>
                <PlayCircle size={12}/>
                {c.status==="in-progress"?"Continue":"Start"}
              </a>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════
const RESOURCE_DATA = [
  {
    id:"delivery", label:"Delivery Materials", icon:"📋", color:"#15803D", bg:"#DCFCE7",
    desc:"Session resources, activity sheets and printable materials for NELI delivery",
    items:[
      {name:"Activity Sheets — Part 1 (Weeks 1–10)", type:"PDF", size:"4.2 MB", desc:"Story maps, vocabulary recording sheets, narrative sequencing cards"},
      {name:"Activity Sheets — Part 2 (Weeks 11–20)", type:"PDF", size:"3.8 MB", desc:"Phonics activities, letter-sound worksheets, blending practice"},
      {name:"My Story Map Template", type:"PDF", size:"0.4 MB", desc:"Printable story map for pupil use in individual sessions"},
      {name:"Session Record Forms", type:"PDF", size:"1.1 MB", desc:"Assessment for Narrative Speech & Grammar record forms"},
      {name:"Days of the Week Board", type:"PDF", size:"0.3 MB", desc:"Printable days board for group session display"},
      {name:"Best Listener Badges", type:"PDF", size:"0.5 MB", desc:"Reward badges — print and laminate for repeated use"},
      {name:"Printable Flashcards & Resources", type:"PDF", size:"6.7 MB", desc:"All vocabulary flashcards for Parts 1 & 2"},
      {name:"Sound Effects — Part 1 Session 22", type:"MP3", size:"2.1 MB", desc:"Audio files for use in session delivery"},
    ]
  },
  {
    id:"handbooks", label:"Teaching Handbooks", icon:"📚", color:"#1D4ED8", bg:"#EFF6FF",
    desc:"Step-by-step session guides for group and individual NELI sessions",
    items:[
      {name:"Reception Part 1 — Teaching Handbook", type:"PDF", size:"18.4 MB", desc:"Full session plans for Weeks 1–10 (group & individual sessions)"},
      {name:"Reception Part 2 — Teaching Handbook", type:"PDF", size:"16.2 MB", desc:"Full session plans for Weeks 11–20, including phonics element"},
      {name:"Example Session Plan", type:"PDF", size:"0.6 MB", desc:"Annotated example of a complete NELI group session"},
      {name:"NELI Quick Start Guide", type:"PDF", size:"1.2 MB", desc:"Getting started with the NELI programme — key steps overview"},
    ]
  },
  {
    id:"flashcards", label:"Flashcards (Parts 1 & 2)", icon:"🃏", color:"#C8960C", bg:"#FEF3C7",
    desc:"Vocabulary flashcard sets for all 20 weeks of the NELI programme",
    items:[
      {name:"Flashcards Part 1 — Topic 1: The Farm", type:"PDF", size:"2.4 MB", desc:"Week 1–3 vocabulary: farm animals, colours, size"},
      {name:"Flashcards Part 1 — Topic 2: The Park", type:"PDF", size:"2.1 MB", desc:"Week 4–6 vocabulary: park activities, weather, feelings"},
      {name:"Flashcards Part 1 — Topic 3: The Sea", type:"PDF", size:"2.8 MB", desc:"Week 7–10 vocabulary: sea creatures, actions, descriptions"},
      {name:"Flashcards Part 2 — Topic 4: The Garden", type:"PDF", size:"2.2 MB", desc:"Week 11–13 vocabulary: plants, insects, gardening"},
      {name:"Flashcards Part 2 — Topic 5: The Kitchen", type:"PDF", size:"1.9 MB", desc:"Week 14–16 vocabulary: food, cooking, utensils"},
      {name:"Flashcards Part 2 — Topic 6: The Bedroom", type:"PDF", size:"1.8 MB", desc:"Week 17–20 vocabulary: household items, routines, emotions"},
    ]
  },
  {
    id:"family", label:"Family Engagement", icon:"🏠", color:"#7C3AED", bg:"#F5F3FF",
    desc:"Parent and carer communication resources to support NELI at home",
    items:[
      {name:"Welcome to NELI — Parent Letter Template", type:"DOCX", size:"0.3 MB", desc:"Editable letter to introduce the NELI programme to families"},
      {name:"Welcome Newsletter — NELI News 1", type:"PDF", size:"1.4 MB", desc:"First newsletter explaining NELI and what children will learn"},
      {name:"Family Newsletters — Weeks 1–10", type:"PDF", size:"3.6 MB", desc:"Weekly newsletters for parents covering content from each session"},
      {name:"Family Newsletters — Weeks 11–20", type:"PDF", size:"3.2 MB", desc:"Weekly newsletters for the second half of the programme"},
      {name:"End-of-Year Wrap-Up Newsletter", type:"PDF", size:"1.1 MB", desc:"Summary newsletter celebrating children's achievements"},
      {name:"Take-Home Cards — Game & Keep the Beat", type:"PDF", size:"1.7 MB", desc:"Activity cards for parents to continue language games at home"},
      {name:"Certificate of Achievement", type:"PDF", size:"0.8 MB", desc:"Personalised certificate to award NELI pupils at programme end"},
      {name:"LanguageScreen Parent Letter Template", type:"DOCX", size:"0.2 MB", desc:"Template to notify parents before LanguageScreen assessment"},
    ]
  },
  {
    id:"training_res", label:"Training Resources", icon:"🎓", color:"#B45309", bg:"#FFFBEB",
    desc:"Supporting materials for CPD and professional development",
    items:[
      {name:"NELI Programme Overview — Staff Briefing", type:"PDF", size:"2.3 MB", desc:"Concise overview suitable for all-staff briefing"},
      {name:"Evidence Summary — EEF Evaluation", type:"PDF", size:"1.6 MB", desc:"Summary of EEF scale-up evaluation findings"},
      {name:"LanguageScreen Guide for Schools", type:"PDF", size:"1.4 MB", desc:"Step-by-step guide to administering LanguageScreen"},
      {name:"Understanding LanguageScreen Scores", type:"PDF", size:"0.9 MB", desc:"Interpreting standard scores and traffic light system"},
      {name:"NELI & SEND — Guidance for SENCOs", type:"PDF", size:"1.8 MB", desc:"Using NELI data to inform SEND identification and graduated approach"},
      {name:"FutureLearn Course Access Guide", type:"PDF", size:"0.4 MB", desc:"How to register and access training on FutureLearn"},
    ]
  },
  {
    id:"forms", label:"Assessment & Record Forms", icon:"📝", color:"#0E7490", bg:"#ECFEFF",
    desc:"Official record-keeping and assessment forms for the NELI programme",
    items:[
      {name:"Assessment for Narrative Speech", type:"PDF", size:"0.7 MB", desc:"Standardised narrative assessment form for weeks 1 and 20"},
      {name:"Assessment for Grammar", type:"PDF", size:"0.6 MB", desc:"Grammar assessment record for use at midpoint and end"},
      {name:"Midpoint Review Checklist", type:"PDF", size:"0.4 MB", desc:"Week 10 review guidance and checklist"},
      {name:"Session Attendance Record", type:"XLSX", size:"0.3 MB", desc:"Spreadsheet to track weekly group and individual sessions"},
      {name:"NELI Pupil Progress Summary", type:"PDF", size:"0.5 MB", desc:"One-page per-pupil summary for school records"},
      {name:"End-of-Year LanguageScreen Reassessment Guide", type:"PDF", size:"0.6 MB", desc:"Guidance for scheduling and using end-of-year reassessment data"},
    ]
  },
];

function Resources() {
  const [openFolder, setOpenFolder] = useState(null);
  const [search, setSearch] = useState("");

  const allItems = RESOURCE_DATA.flatMap(cat=>cat.items.map(i=>({...i,cat:cat.label,catId:cat.id,catColor:cat.color,catBg:cat.bg})));
  const filtered = search.length>1 ? allItems.filter(i=>
    i.name.toLowerCase().includes(search.toLowerCase())||
    i.desc.toLowerCase().includes(search.toLowerCase())) : null;

  const typeColor = t => t==="PDF"?{c:T.red,bg:T.redBg}:t==="DOCX"?{c:T.blue,bg:T.blueBg}:t==="MP3"?{c:T.purple,bg:T.purpleBg}:{c:T.amber,bg:T.amberBg};

  const ResourceRow = ({item}) => {
    const tc = typeColor(item.type);
    return (
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",
        borderBottom:`1px solid ${T.border}`,background:"white",
        transition:"background 0.1s"}}
        onMouseEnter={e=>e.currentTarget.style.background=T.light}
        onMouseLeave={e=>e.currentTarget.style.background="white"}>
        <div style={{width:36,height:36,borderRadius:8,background:tc.bg,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:11,fontWeight:800,color:tc.c,flexShrink:0}}>{item.type}</div>
        <div style={{flex:1}}>
          <p style={{fontSize:13,fontWeight:600,color:T.text,margin:"0 0 2px"}}>{item.name}</p>
          <p style={{fontSize:11,color:T.muted,margin:0}}>{item.desc}</p>
        </div>
        <span style={{fontSize:11,color:T.muted,whiteSpace:"nowrap"}}>{item.size}</span>
        <button style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",
          borderRadius:8,border:`1px solid ${T.border}`,background:"white",
          fontSize:12,fontWeight:600,color:T.navy,cursor:"pointer",whiteSpace:"nowrap"}}>
          <Download size={13}/> Download
        </button>
      </div>
    );
  };

  return (
    <div>
      <SectionTitle title="NELI Resources" subtitle="Teaching materials, family engagement resources, handbooks and record forms"/>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Resource Folders" value="6" sub="All NELI materials" icon={FolderOpen}/>
        <StatCard label="Total Resources" value={allItems.length} sub="PDFs, Word docs & more" icon={FileText} color={T.navy}/>
        <StatCard label="Family Resources" value="8" sub="Parent & carer packs" icon={Users} color={T.purple}/>
        <StatCard label="Last Updated" value="Feb 2025" sub="Teaching handbooks v2" icon={CheckCircle2} color={T.green}/>
      </div>

      {/* Search */}
      <div style={{position:"relative",marginBottom:16}}>
        <Search size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:T.muted}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search all resources..."
          style={{width:"100%",paddingLeft:42,height:42,border:`1px solid ${T.border}`,
            borderRadius:10,fontSize:14,outline:"none",background:"white",boxSizing:"border-box"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:14,top:"50%",
          transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer"}}>
          <X size={16} color={T.muted}/>
        </button>}
      </div>

      {/* Search results */}
      {filtered&&(
        <Card style={{padding:0,overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Search results for "{search}"</span>
            <span style={{fontSize:12,color:T.muted}}>{filtered.length} resources found</span>
          </div>
          {filtered.length===0&&<div style={{padding:"24px",textAlign:"center",color:T.muted,fontSize:13}}>No resources found for this search.</div>}
          {filtered.map((item,i)=>(
            <div key={i}>
              <div style={{padding:"4px 16px",background:T.light,borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:10,fontWeight:700,color:item.catColor,textTransform:"uppercase",letterSpacing:"0.05em"}}>{item.cat}</span>
              </div>
              <ResourceRow item={item}/>
            </div>
          ))}
        </Card>
      )}

      {/* Folders */}
      {!filtered&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        {RESOURCE_DATA.map(cat=>(
          <div key={cat.id} style={{background:T.card,border:`1px solid ${openFolder===cat.id?cat.color:T.border}`,
            borderRadius:12,overflow:"hidden",transition:"border-color 0.15s"}}>

            {/* Folder header */}
            <div onClick={()=>setOpenFolder(openFolder===cat.id?null:cat.id)}
              style={{padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,
                background:openFolder===cat.id?`${cat.bg}88`:"white"}}>
              <div style={{width:44,height:44,borderRadius:10,background:cat.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:22,flexShrink:0}}>{cat.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:0}}>{cat.label}</h3>
                  <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,
                    background:cat.bg,color:cat.color}}>{cat.items.length} files</span>
                </div>
                <p style={{fontSize:12,color:T.muted,margin:0}}>{cat.desc}</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={e=>{e.stopPropagation();}} style={{display:"flex",alignItems:"center",gap:5,
                  padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:"white",
                  fontSize:12,fontWeight:600,color:T.navy,cursor:"pointer"}}>
                  <Download size={13}/> Download All
                </button>
                <ChevronRight size={18} color={T.muted}
                  style={{transform:openFolder===cat.id?"rotate(90deg)":"none",transition:"0.2s",flexShrink:0}}/>
              </div>
            </div>

            {/* File list */}
            {openFolder===cat.id&&(
              <div style={{borderTop:`1px solid ${T.border}`}}>
                {cat.items.map((item,i)=><ResourceRow key={i} item={item}/>)}
                <div style={{padding:"10px 16px",background:T.light,
                  display:"flex",justifyContent:"flex-end",gap:8}}>
                  <span style={{fontSize:12,color:T.muted,flex:1,alignSelf:"center"}}>
                    {cat.items.length} files · All resources are provided by OxEd & Assessment
                  </span>
                  <button style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",
                    borderRadius:8,border:"none",background:T.navy,color:"white",
                    fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    <Download size={13}/> Download All ({cat.items.length} files)
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>}

      {/* Footer note */}
      <div style={{marginTop:16,padding:"14px 18px",background:T.goldLight,borderRadius:10,
        fontSize:13,color:T.amber,display:"flex",gap:10,alignItems:"flex-start"}}>
        <Star size={16} style={{flexShrink:0,marginTop:1}}/>
        <span>All resources are provided as part of the DfE-funded NELI programme. Physical resources (Ted puppet, printed handbooks, flashcard sets) should have been included in your delivery pack. Contact <strong>support@oxedandassessment.com</strong> if anything is missing.</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
const NAV = [
  {id:"dashboard",     Icon:LayoutDashboard, label:"Dashboard"},
  {id:"languagescreen",Icon:Search,          label:"LanguageScreen"},
  {id:"intervention",  Icon:ClipboardList,   label:"NELI Tracker"},
  {id:"classes",       Icon:Users,           label:"Classes"},
  {id:"reports",       Icon:FileText,        label:"Reports"},
  {id:"trust",         Icon:Building2,       label:"Trust View"},
  {id:"training",      Icon:GraduationCap,   label:"Training"},
  {id:"resources",     Icon:FolderOpen,      label:"Resources"},
];

const ALERTS = [
  {msg:"Hillside Infant at week 8 — behind schedule",type:"red"},
  {msg:"Greenfields: 4 pupils not yet assessed",type:"amber"},
  {msg:"End-year reassessment due in 8 weeks",type:"amber"},
  {msg:"Course 3 outstanding for James Okafor",type:"amber"},
];

export default function NELIPortal() {
  const [page, setPage] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPupil, setSelectedPupil] = useState(null);

  const handleNav = (id) => {
    setPage(id); setSelectedClass(null); setSelectedPupil(null); setNotifOpen(false);
  };

  const handleSelectPupil = (p) => { setSelectedPupil(p); setPage("pupil"); };
  const handleSelectClass = (c) => { setSelectedClass(c); setPage("classdetail"); };

  const renderPage = () => {
    if(page==="pupil"&&selectedPupil) return <PupilDetail pupil={selectedPupil} onBack={()=>{setPage(selectedClass?"classdetail":"languagescreen");setSelectedPupil(null);}}/>;
    if(page==="classdetail"&&selectedClass) return <ClassDetail cls={selectedClass} onBack={()=>{setPage("classes");setSelectedClass(null);}} onSelectPupil={handleSelectPupil}/>;
    if(page==="classes") return <ClassesPage onSelectClass={handleSelectClass}/>;
    if(page==="languagescreen") return <LanguageScreenPage onSelectPupil={handleSelectPupil}/>;
    if(page==="trainingcourses") return <TrainingCourses onBack={()=>setPage("training")} staffName="Sarah Mitchell"/>;
    const pages = {
      dashboard:<Dashboard/>, intervention:<NELITracker/>,
      reports:<Reports/>, trust:<TrustView/>,
      training:<Training onStartTraining={()=>setPage("trainingcourses")}/>,
      resources:<Resources/>,
    };
    return pages[page]||<Dashboard/>;
  };

  const lc2 = l => l==="red"?T.red:l==="amber"?T.amber:T.green;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"system-ui,sans-serif",
      background:T.bg,overflow:"hidden"}}>

      {/* SIDEBAR */}
      <div style={{width:220,background:T.sidebar,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #1E2E45",background:"#0A1628"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <img src="/NELI_logo.png" alt="NELI Logo"
              style={{width:"100%",maxWidth:172,height:"auto",objectFit:"contain",display:"block"}}
              onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}
            />
            <div style={{display:"none",alignItems:"center",gap:8}}>
              <div style={{width:36,height:36,borderRadius:10,background:T.gold,display:"flex",
                alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"white"}}>N</div>
              <div>
                <p style={{fontSize:14,fontWeight:800,color:"white",margin:0}}>NELI Portal</p>
                <p style={{fontSize:10,color:T.sidebarText,margin:0}}>OxEd & Assessment</p>
              </div>
            </div>
            <p style={{fontSize:10,color:T.sidebarText,margin:0,letterSpacing:"0.04em"}}>School Portal</p>
          </div>
        </div>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #1E2E45"}}>
          <p style={{fontSize:10,fontWeight:700,color:T.sidebarText,textTransform:"uppercase",
            letterSpacing:"0.06em",margin:"0 0 4px"}}>Current School</p>
          <p style={{fontSize:13,fontWeight:700,color:"white",margin:"0 0 2px"}}>Parkside Primary</p>
          <p style={{fontSize:11,color:T.sidebarText,margin:0}}>Oak Valley MAT · Reception</p>
        </div>
        <nav style={{flex:1,padding:"10px",overflowY:"auto"}}>
          {NAV.map(({id,Icon,label})=>(
            <button key={id} onClick={()=>handleNav(id)} style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",
              borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",marginBottom:2,
              background:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?"#1E3561":"transparent",
              color:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?"white":T.sidebarText,
            }}>
              <Icon size={16} style={{flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:(page===id)?"700":"500"}}>{label}</span>
              {id==="trust"&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,
                background:"#B91C1C",color:"white",borderRadius:10,padding:"1px 6px"}}>2</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 10px",borderTop:"1px solid #1E2E45"}}>
          {[{Icon:Settings,label:"Settings"},{Icon:LogOut,label:"Sign Out"}].map(({Icon,label})=>(
            <button key={label} style={{display:"flex",alignItems:"center",gap:10,width:"100%",
              padding:"8px 12px",borderRadius:8,border:"none",background:"transparent",
              cursor:"pointer",color:T.sidebarText,marginBottom:2}}>
              <Icon size={15}/><span style={{fontSize:12}}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:56,background:"white",borderBottom:`1px solid ${T.border}`,
          display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:15,fontWeight:700,color:T.text,margin:0}}>
              {page==="pupil"&&selectedPupil?selectedPupil.name
               :page==="classdetail"&&selectedClass?selectedClass.name
               :page==="trainingcourses"?"FutureLearn Courses"
               :NAV.find(n=>n.id===page)?.label||"Dashboard"}
            </h1>
          </div>
          <div style={{fontSize:12,color:T.green,fontWeight:700,background:T.greenBg,
            padding:"4px 12px",borderRadius:20}}>● DfE Funded 2024–2029</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:8,
              border:`1px solid ${T.border}`,background:"white",display:"flex",alignItems:"center",
              justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <Bell size={16} color={T.muted}/>
              <span style={{position:"absolute",top:6,right:6,width:8,height:8,
                borderRadius:"50%",background:T.red,border:"2px solid white"}}/>
            </button>
            {notifOpen&&(
              <div style={{position:"absolute",top:42,right:0,width:300,background:"white",
                border:`1px solid ${T.border}`,borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                zIndex:100,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
                  display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>Alerts</span>
                  <span style={{fontSize:11,color:T.muted}}>{ALERTS.length} active</span>
                </div>
                {ALERTS.map((a,i)=>(
                  <div key={i} style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,
                    display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:lc2(a.type),
                      marginTop:4,flexShrink:0}}/>
                    <span style={{fontSize:12,color:T.text,lineHeight:1.5}}>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <InitialsBadge name="Sarah Mitchell" size={32}/>
            <div>
              <p style={{fontSize:12,fontWeight:700,color:T.text,margin:0}}>Sarah Mitchell</p>
              <p style={{fontSize:10,color:T.muted,margin:0}}>NELI Lead</p>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"24px"}}>{renderPage()}</div>
      </div>
    </div>
  );
}
