import { useState, useEffect } from "react";

/* ─── Portal CSS injection ─────────────────────────────────────────────────── */
(function injectPortalCSS() {
  if (document.getElementById("neli-portal-css")) return;
  const s = document.createElement("style");
  s.id = "neli-portal-css";
  s.textContent = `
    @keyframes neli-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes neli-pulseGlow{0%,100%{box-shadow:0 0 4px rgba(21,128,61,0.2)}50%{box-shadow:0 0 12px rgba(21,128,61,0.5)}}
    @keyframes neli-bellBounce{0%,100%{transform:rotate(0)}15%{transform:rotate(12deg)}30%{transform:rotate(-10deg)}45%{transform:rotate(6deg)}60%{transform:rotate(-3deg)}75%{transform:rotate(0)}}
    @keyframes neli-owlSlideIn{0%{opacity:0;transform:translateX(100px)}100%{opacity:1;transform:translateX(0)}}
    @keyframes neli-overlayFade{0%{opacity:0}100%{opacity:1}}
    .neli-fadeIn{animation:neli-fadeIn .3s ease both}
    .neli-pulseGlow{animation:neli-pulseGlow 2.5s ease-in-out infinite}
    .neli-bellBounce{animation:neli-bellBounce 1s ease}
    .neli-owlSlideIn{animation:neli-owlSlideIn .6s cubic-bezier(.34,1.56,.64,1) both}
    .neli-statCard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)!important}
  `;
  document.head.appendChild(s);
})();
import LanguageScreenApp from "./LanguageScreenApp";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Cell, PieChart, Pie, ReferenceLine, Legend, LineChart, Line,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  LayoutDashboard, Search, ClipboardList, FileText, Building2,
  GraduationCap, Users, Bell, TrendingUp, AlertCircle,
  CheckCircle2, Download, Award, ChevronRight, Star,
  Settings, LogOut, Filter, BookOpen, Target, ArrowUp,
  ChevronLeft, Clipboard, Heart, Brain, Activity, MessageSquare,
  Printer, Share2, Eye, X, Plus, Edit3, UserCheck, Zap, BarChart2,
  FolderOpen, Folder, ExternalLink, PlayCircle, Flag,
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
    neliWeek:17, neliSessions:78, neliExpected:85, interventionist:"Mrs S. Mitchell",
    senDetail:{strategies:["SALT weekly sessions","Visual supports for tasks","Simplified instructions","Extra processing time"], saltReferral:true, saltDate:"Oct 2024", nextReview:"Apr 2025"},
    attendanceDetail:{missed:12, notes:"Several medical absences"},
    wellbeingDetail:{notes:"Settles better with familiar adults"},
    neliDetail:{sessionsThisWeek:2, expectedCompletion:"Jul 2025"},
    class:"A"},
  {id:2,  name:"Leon Carter",      dob:"02/09/2019", g:"M", eal:false, fsm:true,  is:71,  es:85,  neli:true,
    sen:{status:"Monitoring", category:"Communication & Interaction", plan:"Class-based monitoring", ehcp:false, agencies:[], adjustments:["Additional verbal prompts","Preferential seating"]},
    elgs:{la:["E","E"],psed:["E","E","E"],pd:["E","Ex"],lit:["E","E","E"],maths:["E","E"],utw:["Ex","E","E"],ead:["E","Ex"]},
    attendance:91, leuven:{wellbeing:3, involvement:3},
    subscores:{recVocab:68, expVocab:70, grammar:73, listening:74},
    notes:"Leon has shown steady improvement in group sessions. His listening skills have developed well. Behaviour in class has improved since starting NELI (teacher report).",
    nextSteps:["Monitor transition to Year 1","Consolidate vocabulary gains","Encourage story-telling at home (parent newsletter)"],
    neliWeek:17, neliSessions:82, neliExpected:85, interventionist:"Mrs S. Mitchell",
    senDetail:{strategies:["Check-ins at start of day","Quiet corner access","Emotion coaching"], saltReferral:false, nextReview:"May 2025"},
    attendanceDetail:{missed:5, notes:""},
    wellbeingDetail:{notes:""},
    neliDetail:{sessionsThisWeek:3, expectedCompletion:"Jul 2025"},
    class:"A"},
  {id:3,  name:"Fatima Al-Hassan", dob:"20/01/2020", g:"F", eal:true,  fsm:true,  is:74,  es:90,  neli:true,
    sen:{status:"EAL Monitoring", category:"EAL", plan:"EAL support plan", ehcp:false, agencies:["EAL Advisory Service"], adjustments:["Bilingual resources","Pre-teaching key vocabulary","Home-school language link"]},
    elgs:{la:["E","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","E"],lit:["E","E","E"],maths:["Ex","Ex"],utw:["Ex","Ex","E"],ead:["Ex","Ex"]},
    attendance:95, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:72, expVocab:71, grammar:76, listening:78},
    notes:"Fatima speaks Arabic at home (Moroccan dialect). Her English has developed remarkably well through NELI and strong family engagement. Her vocabulary acquisition rate is outstanding for an EAL learner.",
    nextSteps:["Celebrate progress with family","Monitor ELG outcomes in summer term","Continue bilingual story resources"],
    neliWeek:17, neliSessions:84, neliExpected:85, interventionist:"Mrs S. Mitchell", homeLanguage:"Arabic (Moroccan)", ealStage:"Developing",
    senDetail:{strategies:["Bilingual glossary","Peer buddy system","Pre-teaching vocabulary"], saltReferral:false, nextReview:"Jun 2025"},
    attendanceDetail:{missed:3, notes:""},
    wellbeingDetail:{notes:"Thriving, gaining confidence"},
    neliDetail:{sessionsThisWeek:3, expectedCompletion:"Jul 2025"},
    class:"A"},
  {id:4,  name:"Kai Murphy",       dob:"11/06/2020", g:"M", eal:false, fsm:true,  is:78,  es:89,  neli:true,
    sen:{status:"Monitoring", category:"Social, Emotional & Mental Health", plan:"Nurture group referral", ehcp:false, agencies:[], adjustments:["Calm corner access","Check-in/check-out","Consistent adult"]},
    elgs:{la:["E","E"],psed:["E","E","E"],pd:["Ex","Ex"],lit:["E","E","E"],maths:["E","Ex"],utw:["Ex","E","Ex"],ead:["Ex","Ex"]},
    attendance:88, leuven:{wellbeing:3, involvement:3},
    subscores:{recVocab:75, expVocab:77, grammar:79, listening:81},
    notes:"Kai has made good progress. SEMH monitoring in place following some early-year behaviour concerns. Nurture group has been beneficial. Language gains through NELI are strong.",
    nextSteps:["Continue nurture group","Transition planning with Y1 teacher","Parent review meeting in May"],
    neliWeek:17, neliSessions:76, neliExpected:85, interventionist:"Mr J. Okafor",
    senDetail:{strategies:["Chunked tasks","Concrete manipulatives","Reduced written demands"], saltReferral:false, nextReview:"May 2025"},
    attendanceDetail:{missed:7, notes:"Persistent lateness noted"},
    wellbeingDetail:{notes:""},
    neliDetail:{sessionsThisWeek:3, expectedCompletion:"Jul 2025"},
    class:"A"},
  {id:5,  name:"Zahra Patel",      dob:"03/03/2020", g:"F", eal:true,  fsm:false, is:79,  es:90,  neli:true,
    sen:{status:"None", category:"", plan:"", ehcp:false, agencies:[], adjustments:["Bilingual dictionaries available"]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["E","Ex","E"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:97, leuven:{wellbeing:5, involvement:5},
    subscores:{recVocab:78, expVocab:76, grammar:81, listening:82},
    notes:"Zahra is a capable, confident learner. Gujarati spoken at home. Her English has developed strongly this year. NELI has helped consolidate narrative skills.",
    nextSteps:["Transition to Year 1 with positive profile","Share end-of-year data with parents"],
    neliWeek:17, neliSessions:83, neliExpected:85, interventionist:"Mr J. Okafor", homeLanguage:"Gujarati", ealStage:"Competent",
    senDetail:{strategies:[], saltReferral:false, nextReview:null},
    attendanceDetail:{missed:1, notes:""},
    wellbeingDetail:{notes:"Excellent engagement"},
    neliDetail:{sessionsThisWeek:3, expectedCompletion:"Jul 2025"},
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
    homeLanguage:"Punjabi", ealStage:"Fluent",
    class:"A"},
  {id:8,  name:"Mohammed Idris",   dob:"07/05/2020", g:"M", eal:true,  fsm:true,  is:86,  es:90,  neli:false,
    sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]},
    elgs:{la:["Ex","Ex"],psed:["Ex","Ex","Ex"],pd:["Ex","Ex"],lit:["Ex","Ex","E"],maths:["Ex","Ex"],utw:["Ex","Ex","Ex"],ead:["Ex","Ex"]},
    attendance:93, leuven:{wellbeing:4, involvement:4},
    subscores:{recVocab:84, expVocab:85, grammar:87, listening:88},
    notes:"Mohammed is making excellent progress. Arabic and Somali spoken at home.",
    nextSteps:["End-of-year EYFS profile"],
    homeLanguage:"Arabic & Somali", ealStage:"Competent",
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
    homeLanguage:"Hindi", ealStage:"Fluent",
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
    homeLanguage:"Somali", ealStage:"Developing",
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
  <div className="neli-statCard" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
    padding:"16px 20px",position:"relative",overflow:"hidden",borderLeft:`4px solid ${color||T.navy}`,transition:"transform 0.15s, box-shadow 0.15s",cursor:"default"}}>
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
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Score Trajectory</h3>
                {(()=>{
                  const base=pupil.is;const end=pupil.es;const diff=end-base;
                  const trajectory=[
                    {month:"Sep",score:base},
                    {month:"Oct",score:Math.round(base+diff*0.1)},
                    {month:"Nov",score:Math.round(base+diff*0.22)},
                    {month:"Dec",score:Math.round(base+diff*0.38)},
                    {month:"Jan",score:Math.round(base+diff*0.55)},
                    {month:"Feb",score:Math.round(base+diff*0.75)},
                    {month:"Mar",score:end},
                  ];
                  return (
                    <ResponsiveContainer width="100%" height={210}>
                      <LineChart data={trajectory} margin={{top:5,right:10,left:-15,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                        <XAxis dataKey="month" tick={{fontSize:10,fill:T.muted}}/>
                        <YAxis domain={[Math.max(50,base-15),Math.min(130,end+15)]} tick={{fontSize:10,fill:T.muted}}/>
                        <Tooltip/>
                        <ReferenceLine y={85} stroke={T.red} strokeDasharray="6 3" label={{value:"Threshold (85)",position:"right",fontSize:9,fill:T.red}}/>
                        <ReferenceLine y={100} stroke={T.green} strokeDasharray="6 3" label={{value:"Age-expected",position:"right",fontSize:9,fill:T.green}}/>
                        <Line type="monotone" dataKey="score" stroke={T.navy} strokeWidth={3} dot={{r:4,fill:T.navy}} activeDot={{r:6}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <div>
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Subscale Profile</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:T.text,fontWeight:600}}/>
                    <PolarRadiusAxis angle={30} domain={[50,130]} tick={{fontSize:8,fill:T.muted}}/>
                    <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2}/>
                    <Tooltip/>
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

            {/* SEN & Support Needs */}
            <div style={{marginTop:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 14px",fontFamily:"Georgia,serif"}}>SEN & Support Needs</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{padding:"14px 16px",background:T.light,borderRadius:10}}>
                  <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 6px"}}>SEN Status</p>
                  <Badge label={pupil.sen.status||"None"} color={pupil.sen.status&&pupil.sen.status!=="None"?T.red:T.green} bg={pupil.sen.status&&pupil.sen.status!=="None"?T.redBg:T.greenBg}/>
                </div>
                <div style={{padding:"14px 16px",background:T.light,borderRadius:10}}>
                  <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 6px"}}>Category</p>
                  <span style={{fontSize:13,fontWeight:600,color:T.text}}>{pupil.sen.category||"N/A"}</span>
                </div>
                <div style={{padding:"14px 16px",background:T.light,borderRadius:10}}>
                  <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 6px"}}>Next Review</p>
                  <span style={{fontSize:13,fontWeight:600,color:T.text}}>{pupil.senDetail?.nextReview||"Not scheduled"}</span>
                </div>
              </div>
              {(pupil.senDetail?.strategies||pupil.sen.adjustments||[]).length>0&&(
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 8px"}}>Support Strategies</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {(pupil.senDetail?.strategies||pupil.sen.adjustments||[]).map(a=>(
                      <div key={a} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.blueBg,borderRadius:8,fontSize:12,color:T.blue,fontWeight:500}}>
                        <CheckCircle2 size={13}/>{a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{padding:"10px 14px",background:pupil.senDetail?.saltReferral?T.amberBg:T.light,borderRadius:8}}>
                  <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>SALT Referral</p>
                  <span style={{fontSize:13,fontWeight:700,color:pupil.senDetail?.saltReferral?T.amber:T.muted}}>
                    {pupil.senDetail?.saltReferral?`Yes — ${pupil.senDetail.saltDate||"Date pending"}`:"No"}
                  </span>
                </div>
                {pupil.sen.agencies&&pupil.sen.agencies.length>0&&(
                  <div style={{padding:"10px 14px",background:T.amberBg,borderRadius:8}}>
                    <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>Agency Referrals</p>
                    <span style={{fontSize:12,fontWeight:600,color:T.amber}}>{pupil.sen.agencies.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* EAL Information */}
            {pupil.eal&&(
              <div style={{marginTop:20}}>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 14px",fontFamily:"Georgia,serif"}}>EAL Information</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                  <div style={{padding:"14px 16px",background:T.light,borderRadius:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 6px"}}>Home Language</p>
                    <span style={{fontSize:14,fontWeight:700,color:T.text}}>{pupil.homeLanguage||"Not recorded"}</span>
                  </div>
                  <div style={{padding:"14px 16px",background:T.light,borderRadius:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 6px"}}>EAL Stage</p>
                    <Badge label={pupil.ealStage||"Not assessed"} color={T.blue} bg={T.blueBg}/>
                  </div>
                  <div style={{padding:"14px 16px",background:T.light,borderRadius:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 6px"}}>vs EAL Cohort Avg</p>
                    {(()=>{
                      const ealPupils=PUPILS.filter(p=>p.eal);
                      const ealAvg=Math.round(ealPupils.reduce((s,p)=>s+p.es,0)/ealPupils.length);
                      const diff=pupil.es-ealAvg;
                      return <span style={{fontSize:14,fontWeight:700,color:diff>=0?T.green:T.red}}>{pupil.es} vs {ealAvg} ({diff>=0?"+":""}{diff})</span>;
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance & Wellbeing */}
            <div style={{marginTop:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 14px",fontFamily:"Georgia,serif"}}>Attendance & Wellbeing</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{padding:"16px",background:T.light,borderRadius:10}}>
                  <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 8px"}}>Attendance</p>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
                    <span style={{fontSize:32,fontWeight:800,color:pupil.attendance>=95?T.green:pupil.attendance>=90?T.amber:T.red,fontFamily:"Georgia,serif"}}>{pupil.attendance}%</span>
                    <Badge label={pupil.attendance>=95?"Good":pupil.attendance>=90?"Monitor":"Persistent Absence"} color={pupil.attendance>=95?T.green:pupil.attendance>=90?T.amber:T.red} bg={pupil.attendance>=95?T.greenBg:pupil.attendance>=90?T.amberBg:T.redBg}/>
                  </div>
                  <div style={{background:T.border,borderRadius:20,height:8,overflow:"hidden",marginBottom:8}}>
                    <div style={{width:`${pupil.attendance}%`,height:"100%",background:pupil.attendance>=95?T.green:pupil.attendance>=90?T.amber:T.red,borderRadius:20}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted}}>
                    <span>Sessions missed: <strong style={{color:T.text}}>{pupil.attendanceDetail?.missed||"N/A"}</strong></span>
                    {pupil.attendanceDetail?.notes&&<span style={{color:T.amber,fontWeight:600}}>{pupil.attendanceDetail.notes}</span>}
                  </div>
                </div>
                <div style={{padding:"16px",background:T.light,borderRadius:10}}>
                  <p style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 10px"}}>Leuven Wellbeing & Involvement</p>
                  {[{label:"Wellbeing",val:pupil.leuven.wellbeing},{label:"Involvement",val:pupil.leuven.involvement}].map(s=>(
                    <div key={s.label} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontSize:12,color:T.text,fontWeight:600}}>{s.label}</span>
                        <span style={{fontSize:12,fontWeight:700,color:LeuvColor(s.val)}}>{LeuvLabel(s.val)}</span>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {[1,2,3,4,5].map(n=>(
                          <div key={n} style={{width:24,height:24,borderRadius:"50%",background:n<=s.val?LeuvColor(s.val):T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:n<=s.val?"white":T.muted}}>{n}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {pupil.wellbeingDetail?.notes&&(
                    <div style={{padding:"8px 10px",background:"white",borderRadius:6,fontSize:11,color:T.text,marginTop:4}}>
                      <strong style={{color:T.amber}}>Note: </strong>{pupil.wellbeingDetail.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NELI Programme Status */}
            {pupil.neli&&(
              <div style={{marginTop:20}}>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 14px",fontFamily:"Georgia,serif"}}>NELI Programme Status</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:12}}>
                  {[
                    {l:"Current Week",v:`${pupil.neliWeek||17}/20`,c:T.navy},
                    {l:"Sessions Done",v:`${pupil.neliSessions||0}/${pupil.neliExpected||85}`,c:T.green},
                    {l:"This Week",v:`${pupil.neliDetail?.sessionsThisWeek||0}/3`,c:T.navy},
                    {l:"Interventionist",v:pupil.interventionist||"N/A",c:T.text,small:true},
                    {l:"Expected End",v:pupil.neliDetail?.expectedCompletion||"Jul 2025",c:T.text,small:true},
                  ].map(s=>(
                    <div key={s.l} style={{padding:"12px",background:T.light,borderRadius:10,textAlign:"center"}}>
                      <p style={{fontSize:9,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>{s.l}</p>
                      <p style={{fontSize:s.small?12:20,fontWeight:800,color:s.c,margin:0,fontFamily:s.small?"system-ui":"Georgia,serif"}}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,fontWeight:600,color:T.text}}>Programme Progress</span>
                    <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{Math.round((pupil.neliWeek||17)/20*100)}% complete</span>
                  </div>
                  <div style={{background:T.border,borderRadius:20,height:12,overflow:"hidden"}}>
                    <div style={{width:`${(pupil.neliWeek||17)/20*100}%`,height:"100%",background:T.navy,borderRadius:20}}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(20,1fr)",gap:2}}>
                  {Array.from({length:20},(_,i)=>(
                    <div key={i} style={{height:22,borderRadius:3,background:i<(pupil.neliWeek||17)-1?T.navy:i===(pupil.neliWeek||17)-1?T.gold:T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:i<(pupil.neliWeek||17)?"white":T.muted,fontWeight:700}}>{i+1}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{marginTop:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 14px",fontFamily:"Georgia,serif"}}>Quick Actions</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",borderRadius:10,border:"none",background:T.amberBg,color:T.amber,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  <UserCheck size={15}/> Refer to SALT
                </button>
                <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",borderRadius:10,border:"none",background:T.navy,color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  <Edit3 size={15}/> Add Note
                </button>
                <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",borderRadius:10,border:`2px solid ${T.red}`,background:"white",color:T.red,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  <Flag size={15}/> Flag for Review
                </button>
                <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:"white",color:T.muted,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  <Download size={15}/> Export Profile
                </button>
              </div>
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
                  </div>
                  <p style={{fontSize:12,color:T.muted,margin:0}}>{a.desc}</p>
                </div>
                <ChevronRight size={16} color={T.muted} style={{marginTop:4}}/>
              </button>
            ))}
          </div>
        </div>
      )}
      {assessing && (
        <LanguageScreenApp
          studentName={pupil.name}
          studentDob={pupil.dob||"2020-01-01"}
          schoolName="Parkside Primary"
          assessorName="Mrs Whitehead"
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

      {/* SEN & EAL Summary Strips */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
        {(()=>{
          const slcn=pupils.filter(p=>p.sen.category==="Communication & Interaction").length;
          const semh=pupils.filter(p=>p.sen.category==="Social, Emotional & Mental Health").length;
          const cogn=pupils.filter(p=>p.sen.category==="Cognition & Learning").length;
          const ehcp=pupils.filter(p=>p.sen.ehcp).length;
          return [["Speech & Language",slcn,T.red,T.redBg],["SEMH",semh,T.amber,T.amberBg],["Cognition & Learning",cogn,T.purple,T.purpleBg],["EHCP",ehcp,T.red,T.redBg]];
        })().map(([label,count,color,bg])=>(
          <div key={label} style={{background:bg,borderRadius:10,padding:"12px 16px",borderLeft:`4px solid ${color}`}}>
            <p style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>{label}</p>
            <p style={{fontSize:24,fontWeight:800,color:color,margin:0,fontFamily:"Georgia,serif"}}>{count}</p>
            <p style={{fontSize:11,color:T.muted,margin:"2px 0 0"}}>pupil{count!==1?"s":""}</p>
          </div>
        ))}
      </div>
      {(()=>{
        const ealPupils=pupils.filter(p=>p.eal);
        const ealAvg=ealPupils.length?Math.round(ealPupils.reduce((s,p)=>s+p.es,0)/ealPupils.length):0;
        return ealPupils.length>0?(
          <div style={{background:T.blueBg,borderRadius:10,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div>
                <span style={{fontSize:12,fontWeight:700,color:T.blue}}>EAL Pupils: {ealPupils.length}</span>
                <span style={{fontSize:12,color:T.muted,marginLeft:8}}>({Math.round(ealPupils.length/pupils.length*100)}% of class)</span>
              </div>
              <span style={{fontSize:12,color:T.muted}}>Avg EAL score: <strong style={{color:T.blue}}>{ealAvg}</strong> vs class avg <strong style={{color:T.text}}>{avgE}</strong></span>
            </div>
            <div style={{display:"flex",gap:4}}>
              {ealPupils.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px 3px 3px",background:"white",borderRadius:20,border:`1px solid ${T.border}`}}>
                  <InitialsBadge name={p.name} size={20}/>
                  <span style={{fontSize:11,fontWeight:600,color:T.text}}>{p.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        ):null;
      })()}

      {/* Needs Attention */}
      {(()=>{
        const atRisk=pupils.filter(p=>p.attendance<90||p.es<80);
        return atRisk.length>0?(
          <div style={{background:T.redBg,border:`1px solid ${T.red}20`,borderRadius:12,padding:"16px 20px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <AlertCircle size={16} color={T.red}/>
              <h3 style={{fontSize:14,fontWeight:700,color:T.red,margin:0}}>Needs Attention — {atRisk.length} pupil{atRisk.length!==1?"s":""}</h3>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {atRisk.map(p=>(
                <div key={p.id} onClick={()=>onSelectPupil(p)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"white",borderRadius:8,cursor:"pointer",border:`1px solid ${T.border}`}}>
                  <InitialsBadge name={p.name} size={26}/>
                  <span style={{fontSize:13,fontWeight:600,color:T.text,flex:1}}>{p.name}</span>
                  {p.attendance<90&&<Badge label={`${p.attendance}% attendance`} color={T.red} bg={T.redBg}/>}
                  {p.es<80&&<Badge label={`Score ${p.es} — below threshold`} color={T.red} bg={T.redBg}/>}
                </div>
              ))}
            </div>
          </div>
        ):null;
      })()}

      {/* Class Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Card>
          <h3 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Pupil Score Comparison</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pupils.map(p=>({name:p.name.split(" ")[0],initial:p.is,current:p.es}))} margin={{top:10,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.muted}}/>
              <YAxis domain={[50,130]} tick={{fontSize:9,fill:T.muted}}/>
              <Tooltip/>
              <Bar dataKey="initial" fill="#FBBF24" radius={[2,2,0,0]} name="Initial"/>
              <Bar dataKey="current" fill={T.navy} radius={[2,2,0,0]} name="Current"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>SEN Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                {name:"Speech & Lang",value:pupils.filter(p=>p.sen.category==="Communication & Interaction").length||0},
                {name:"SEMH",value:pupils.filter(p=>p.sen.category==="Social, Emotional & Mental Health").length||0},
                {name:"Cognition",value:pupils.filter(p=>p.sen.category==="Cognition & Learning").length||0},
                {name:"No SEN",value:pupils.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").length},
              ].filter(d=>d.value>0)} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {[T.red,T.amber,T.blue,T.border].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:0}}>Pupils in {cls.name}</h3>
          <span style={{fontSize:12,color:T.muted}}>{pupils.length} pupils · Click a pupil to view full profile</span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Name","Flags","Initial","Current","Gain","ELG","EAL","GLD","Wellbeing","Attendance","SEN",""].map(h=>(
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
                  background:(p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"&&p.es<85)?"#FFF1F2":i%2===0?"white":T.light,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#F0F7FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=(p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"&&p.es<85)?"#FFF1F2":i%2===0?"white":T.light}>
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
                  <td style={{padding:"12px 14px"}}>{p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}</td>
                  <td style={{padding:"12px 14px"}}><Badge label={sc.gld?"On Track":"At Risk"} color={sc.gld?T.green:T.amber} bg={sc.gld?T.greenBg:T.amberBg}/></td>
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
                    {p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"?(
                      <div>
                        <Badge label={p.sen.status} color={p.sen.ehcp?T.red:p.sen.status==="SEN Support"?T.amber:T.muted} bg={p.sen.ehcp?T.redBg:p.sen.status==="SEN Support"?T.amberBg:T.light}/>
                        <p style={{fontSize:10,color:T.muted,margin:"2px 0 0"}}>{p.sen.category?p.sen.category.replace("Communication & Interaction","Speech & Lang").replace("Social, Emotional & Mental Health","SEMH"):""}</p>
                      </div>
                    ):p.sen.status==="EAL Monitoring"?<Badge label="EAL Mon." color={T.blue} bg={T.blueBg}/>:null}
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
function ClassesPage({onSelectClass, onSelectPupil}) {
  const [expandedClass, setExpandedClass] = useState(null);
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
          const ealC = pupils.filter(p=>p.eal).length;
          const isExpanded = expandedClass===cls.id;

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
                <ChevronRight size={20} color={T.muted} style={{marginLeft:"auto",transform:isExpanded?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.15s"}}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[
                  {l:"Pupils",v:pupils.length},
                  {l:"Assessed",v:"100%",c:T.green},
                  {l:"Avg Initial",v:avgI,c:lc(getLight(avgI))},
                  {l:"Avg Current",v:avgE,c:lc(getLight(avgE))},
                  {l:"Avg Gain",v:`+${Math.round((avgE-avgI)*10)/10}`,c:T.green},
                  {l:"GLD on Track",v:`${gldC}/${pupils.length}`,c:T.green},
                  {l:"EAL Pupils",v:ealC,c:ealC>0?T.blue:T.muted},
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

              {/* NELI Programme Progress Bar */}
              {neliC>0&&(
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:T.muted}}>NELI Programme Progress</span>
                    <span style={{fontSize:11,fontWeight:700,color:T.gold}}>Week 17 of 20 (85%)</span>
                  </div>
                  <div style={{background:T.border,borderRadius:20,height:8,overflow:"hidden"}}>
                    <div style={{width:"85%",height:"100%",background:T.gold,borderRadius:20}}/>
                  </div>
                </div>
              )}

              {/* SEN & EAL breakdown strip */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                {(()=>{
                  const slcn=pupils.filter(p=>p.sen.category==="Communication & Interaction").length;
                  const semh=pupils.filter(p=>p.sen.category==="Social, Emotional & Mental Health").length;
                  const ealPct=Math.round(ealC/pupils.length*100);
                  const avgAtt=Math.round(pupils.reduce((s,p)=>s+p.attendance,0)/pupils.length);
                  return [["Speech & Lang",slcn,slcn>0?T.red:T.muted],["SEMH",semh,semh>0?T.amber:T.muted],["EAL",`${ealC} (${ealPct}%)`,ealC>0?T.blue:T.muted],["Avg Attend.",`${avgAtt}%`,avgAtt>=95?T.green:avgAtt>=90?T.amber:T.red]];
                })().map(([l,v,c])=>(
                  <div key={l} style={{background:T.light,borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                    <p style={{fontSize:9,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 1px"}}>{l}</p>
                    <p style={{fontSize:14,fontWeight:800,color:c,margin:0,fontFamily:"Georgia,serif"}}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Flagged pupils strip */}
              {(()=>{
                const flagged=pupils.filter(p=>p.sen.status!=="None"||p.eal);
                return flagged.length>0?(
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",marginRight:4}}>Flagged:</span>
                    {flagged.map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 8px 2px 2px",background:T.light,borderRadius:20,border:`1px solid ${T.border}`}}>
                        <InitialsBadge name={p.name} size={18}/>
                        <span style={{fontSize:10,fontWeight:600,color:T.text}}>{p.name.split(" ")[0]}</span>
                        {p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"&&<span style={{width:6,height:6,borderRadius:"50%",background:T.red}}/>}
                        {p.eal&&<span style={{width:6,height:6,borderRadius:"50%",background:T.blue}}/>}
                      </div>
                    ))}
                  </div>
                ):null;
              })()}

              <div style={{padding:"10px 14px",background:T.goldLight,borderRadius:8,fontSize:12,color:T.amber}}>
                <strong>AI snapshot: </strong>
                {`${pupils.length} pupils · Score gain +${Math.round((avgE-avgI)*10)/10} pts · ${gldC} GLD on track · ${senC} SEN · ${neliC} NELI`}
              </div>

              {/* Needs Attention */}
              {(()=>{
                const atRisk=pupils.filter(p=>p.attendance<90||p.es<80);
                return atRisk.length>0?(
                  <div style={{marginTop:10,padding:"10px 14px",background:T.redBg,borderRadius:8,border:`1px solid ${T.red}20`}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      <AlertCircle size={13} color={T.red}/>
                      <span style={{fontSize:11,fontWeight:700,color:T.red,textTransform:"uppercase"}}>Needs Attention</span>
                    </div>
                    {atRisk.map(p=>(
                      <div key={p.id} style={{fontSize:12,color:T.red,fontWeight:600,padding:"2px 0"}}>
                        {p.name} — {p.attendance<90?`${p.attendance}% attendance`:""}{p.attendance<90&&p.es<80?" · ":""}{p.es<80?`Score ${p.es} — below threshold`:""}
                      </div>
                    ))}
                  </div>
                ):null;
              })()}
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
function Dashboard({onSelectPupil}) {
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [tableFilter, setTableFilter] = useState("all");
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
        <Card style={{borderTop:`3px solid ${T.navy}`}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.navy,marginRight:8}}/>Class Score Distribution</h3>
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
        <Card style={{borderTop:`3px solid ${T.gold}`}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.gold,marginRight:8}}/>NELI Intervention Impact</h3>
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
        <Card style={{borderTop:`3px solid ${T.navy}`}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.navy,marginRight:8}}/>Class Progress Over Year</h3>
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
        <Card style={{borderTop:`3px solid ${T.gold}`}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.gold,marginRight:8}}/>Programme — Week 17 of 20</h3>
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


      {/* Analytics Charts Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginTop:16,marginBottom:16}}>
        <Card>
          <h3 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>SEN Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                {name:"Speech & Lang",value:PUPILS.filter(p=>p.sen.category==="Communication & Interaction").length,fill:T.red},
                {name:"SEMH",value:PUPILS.filter(p=>p.sen.category==="Social, Emotional & Mental Health").length,fill:T.amber},
                {name:"Cognition",value:PUPILS.filter(p=>p.sen.category==="Cognition & Learning").length,fill:T.blue},
                {name:"No SEN",value:PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").length,fill:T.border},
              ]} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {[T.red,T.amber,T.blue,T.border].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>EAL vs Non-EAL</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                {name:"EAL",value:PUPILS.filter(p=>p.eal).length,fill:T.blue},
                {name:"Non-EAL",value:PUPILS.filter(p=>!p.eal).length,fill:T.border},
              ]} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {[T.blue,T.border].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{fontSize:18,fontWeight:800,fill:T.navy}}>{Math.round(PUPILS.filter(p=>p.eal).length/PUPILS.length*100)}%</text>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              {band:"<85%",count:PUPILS.filter(p=>p.attendance<85).length,fill:"#EF4444"},
              {band:"85-90%",count:PUPILS.filter(p=>p.attendance>=85&&p.attendance<90).length,fill:"#F59E0B"},
              {band:"90-95%",count:PUPILS.filter(p=>p.attendance>=90&&p.attendance<95).length,fill:"#22C55E"},
              {band:"95%+",count:PUPILS.filter(p=>p.attendance>=95).length,fill:"#10B981"},
            ]} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="band" tick={{fontSize:10,fill:T.muted}}/>
              <YAxis tick={{fontSize:10,fill:T.muted}}/>
              <Tooltip/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {["#EF4444","#F59E0B","#22C55E","#10B981"].map((c,i)=><Cell key={i} fill={c}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Class Cohort Profile</h3>
          {(()=>{
            const classProfile=(id)=>{
              const ps=PUPILS.filter(p=>p.class===id);
              return {
                cls:id==="A"?"Rec A":"Rec B",
                langScore:Math.round(ps.reduce((s,p)=>s+p.es,0)/ps.length),
                attendance:Math.round(ps.reduce((s,p)=>s+p.attendance,0)/ps.length),
                gld:Math.round(ps.filter(p=>elgScore(p).gld).length/ps.length*100),
                wellbeing:Math.round(ps.reduce((s,p)=>s+p.leuven.wellbeing,0)/ps.length*20),
                neli:Math.round(ps.filter(p=>p.neli).length/ps.length*100),
              };
            };
            const ra=[classProfile("A"),classProfile("B")];
            const rData=["langScore","attendance","gld","wellbeing","neli"].map(k=>({
              subject:{langScore:"Language",attendance:"Attendance",gld:"GLD %",wellbeing:"Wellbeing",neli:"NELI %"}[k],
              A:ra[0][k],B:ra[1][k],fullMark:100,
            }));
            return (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={rData}>
                  <PolarGrid/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:T.muted}}/>
                  <PolarRadiusAxis domain={[0,100]} tick={false}/>
                  <Radar name="Rec A" dataKey="A" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/>
                  <Radar name="Rec B" dataKey="B" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Tooltip/>
                </RadarChart>
              </ResponsiveContainer>
            );
          })()}
        </Card>
      </div>

      {/* SEN & EAL Summary Panels */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:16,marginBottom:16}}>
        <div style={{background:T.navy,borderRadius:12,padding:"20px 24px",color:"white"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:800,color:"white",margin:0,fontFamily:"Georgia,serif"}}>SEN & SEND Overview</h3>
            <UserCheck size={18} color={T.gold}/>
          </div>
          {(()=>{
            const senPupils=PUPILS.filter(p=>p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring");
            const slcn=PUPILS.filter(p=>p.sen.category==="Communication & Interaction").length;
            const semh=PUPILS.filter(p=>p.sen.category==="Social, Emotional & Mental Health").length;
            const cogn=PUPILS.filter(p=>p.sen.category==="Cognition & Learning").length;
            const phys=PUPILS.filter(p=>p.sen.category==="Sensory & Physical").length;
            const ehcpCount=senPupils.filter(p=>p.sen.ehcp).length;
            const senSupportCount=senPupils.filter(p=>p.sen.status==="SEN Support").length;
            const monitorCount=senPupils.filter(p=>p.sen.status==="Monitoring").length;
            const needsAttention=senPupils.filter(p=>p.es<85).length;
            return (
              <div>
                <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:14}}>
                  <span style={{fontSize:32,fontWeight:900,color:"white",fontFamily:"Georgia,serif"}}>{senPupils.length}</span>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>pupils ({Math.round(senPupils.length/PUPILS.length*100)}% of cohort)</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                  {[["Speech & Language",slcn],["SEMH",semh],["Cognition & Learning",cogn],["Physical",phys]].map(([cat,n])=>(
                    <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(255,255,255,0.08)",borderRadius:6}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.8)"}}>{cat}</span>
                      <span style={{fontSize:14,fontWeight:800,color:"white"}}>{n}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
                  {[["EHCP",ehcpCount,T.purple],["SEN Support",senSupportCount,T.gold],["Monitoring",monitorCount,"#8BA4C7"]].map(([l,v,c])=>(
                    <div key={l} style={{background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"8px",textAlign:"center"}}>
                      <p style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",margin:"0 0 2px"}}>{l}</p>
                      <p style={{fontSize:18,fontWeight:800,color:c,margin:0,fontFamily:"Georgia,serif"}}>{v}</p>
                    </div>
                  ))}
                </div>
                {needsAttention>0&&(
                  <div style={{padding:"8px 12px",background:"rgba(185,28,28,0.2)",borderRadius:6,display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <AlertCircle size={14} color="#FCA5A5"/>
                    <span style={{fontSize:12,fontWeight:700,color:"#FCA5A5"}}>{needsAttention} pupil{needsAttention!==1?"s":""} below expected progress</span>
                  </div>
                )}
                <button style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"8px 14px",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",justifyContent:"center"}}>
                  View SEN pupils <ChevronRight size={14}/>
                </button>
              </div>
            );
          })()}
        </div>
        <div style={{background:T.navy,borderRadius:12,padding:"20px 24px",color:"white"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:800,color:"white",margin:0,fontFamily:"Georgia,serif"}}>EAL Pupils</h3>
            <Users size={18} color={T.gold}/>
          </div>
          {(()=>{
            const ealPupils=PUPILS.filter(p=>p.eal);
            const nonEalPupils=PUPILS.filter(p=>!p.eal);
            const ealAvgE=ealPupils.length?Math.round(ealPupils.reduce((s,p)=>s+p.es,0)/ealPupils.length*10)/10:0;
            const nonEalAvgE=nonEalPupils.length?Math.round(nonEalPupils.reduce((s,p)=>s+p.es,0)/nonEalPupils.length*10)/10:0;
            return (
              <div>
                <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:14}}>
                  <span style={{fontSize:32,fontWeight:900,color:"white",fontFamily:"Georgia,serif"}}>{ealPupils.length}</span>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>pupils ({Math.round(ealPupils.length/PUPILS.length*100)}% of cohort)</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"10px",textAlign:"center"}}>
                    <p style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",margin:"0 0 2px"}}>EAL Avg Score</p>
                    <p style={{fontSize:22,fontWeight:800,color:T.gold,margin:0,fontFamily:"Georgia,serif"}}>{ealAvgE}</p>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"10px",textAlign:"center"}}>
                    <p style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",margin:"0 0 2px"}}>Non-EAL Avg</p>
                    <p style={{fontSize:22,fontWeight:800,color:"white",margin:0,fontFamily:"Georgia,serif"}}>{nonEalAvgE}</p>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                  {ealPupils.map(p=>(
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(255,255,255,0.08)",borderRadius:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <InitialsBadge name={p.name} size={22}/>
                        <span style={{fontSize:12,fontWeight:600,color:"white"}}>{p.name}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:12,fontWeight:700,color:lc(getLight(p.es))}}>{p.es}</span>
                        <span style={{fontSize:11,fontWeight:700,color:T.green}}>+{p.es-p.is}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"8px 14px",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",justifyContent:"center"}}>
                  View EAL pupils <ChevronRight size={14}/>
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* School-wide Pupil Table */}
      <Card style={{marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>All Pupils — Parkside Primary · Reception A & B</h3>
        <p style={{fontSize:12,color:T.muted,margin:"0 0 8px"}}>{PUPILS.length} pupils · {PUPILS.filter(p=>p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring").length} SEN · {PUPILS.filter(p=>p.eal).length} EAL · {PUPILS.filter(p=>p.neli).length} NELI · {PUPILS.filter(p=>p.attendance<90).length} Low Attendance (&lt;90%)</p>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {[["all","All"],["sen","SEN"],["eal","EAL"],["neli","NELI"],["lowatt","Low Attendance"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTableFilter(v)} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${tableFilter===v?T.navy:T.border}`,background:tableFilter===v?T.navy:"white",color:tableFilter===v?"white":T.muted}}>
              {l}
            </button>
          ))}
        </div>
        {(()=>{
          const toggleSort=(col)=>{
            if(sortCol===col){setSortDir(sortDir==="asc"?"desc":"asc");}
            else{setSortCol(col);setSortDir("asc");}
          };
          const preFiltered=PUPILS.filter(p=>{
            if(tableFilter==="sen") return p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring";
            if(tableFilter==="eal") return p.eal;
            if(tableFilter==="neli") return p.neli;
            if(tableFilter==="lowatt") return p.attendance<90;
            return true;
          });
          const sorted=[...preFiltered].sort((a,b)=>{
            let av,bv;
            switch(sortCol){
              case "name": av=a.name;bv=b.name; return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
              case "class": av=a.class;bv=b.class; return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
              case "is": av=a.is;bv=b.is; break;
              case "es": av=a.es;bv=b.es; break;
              case "gain": av=a.es-a.is;bv=b.es-b.is; break;
              case "attendance": av=a.attendance;bv=b.attendance; break;
              default: {const aHasSen=a.sen.status!=="None"&&a.sen.status!=="EAL Monitoring"?0:1; const bHasSen=b.sen.status!=="None"&&b.sen.status!=="EAL Monitoring"?0:1; if(aHasSen!==bHasSen) return aHasSen-bHasSen; av=a.es;bv=b.es; break;}
            }
            return sortDir==="asc"?av-bv:bv-av;
          });
          const colHdr=(label,col)=>(
            <th key={col} onClick={()=>toggleSort(col)} style={{padding:"8px 6px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.04em",cursor:"pointer",textAlign:"left",borderBottom:`2px solid ${T.border}`,whiteSpace:"nowrap",userSelect:"none"}}>
              {label}{sortCol===col?(sortDir==="asc"?" ▲":" ▼"):""}
            </th>
          );
          return (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr>
                    {colHdr("Name","name")}
                    {colHdr("Class","class")}
                    {colHdr("Initial","is")}
                    {colHdr("Current","es")}
                    {colHdr("Gain","gain")}
                    <th style={{padding:"8px 6px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left",borderBottom:`2px solid ${T.border}`}}>GLD</th>
                    <th style={{padding:"8px 6px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left",borderBottom:`2px solid ${T.border}`}}>SEN</th>
                    <th style={{padding:"8px 6px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left",borderBottom:`2px solid ${T.border}`}}>EAL</th>
                    <th style={{padding:"8px 6px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left",borderBottom:`2px solid ${T.border}`}}>FSM</th>
                    <th style={{padding:"8px 6px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left",borderBottom:`2px solid ${T.border}`}}>NELI</th>
                    {colHdr("Attend.","attendance")}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(p=>{
                    const gld=elgScore(p).gld;
                    const hasSen=p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring";
                    const rowBg=p.es<80?"#FEE2E2":p.es<90?"#FEF9C3":hasSen&&p.es<85?"#FFF1F2":T.card;
                    return (
                      <tr key={p.id} onClick={()=>onSelectPupil&&onSelectPupil(p)} style={{background:rowBg,borderBottom:`1px solid ${T.border}`,cursor:"pointer",transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#F0F7FF"}
                        onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                        <td style={{padding:"8px 6px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><InitialsBadge name={p.name} size={24}/><span style={{fontWeight:600,color:T.text}}>{p.name}</span></div></td>
                        <td style={{padding:"8px 6px",color:T.muted}}>{p.class}</td>
                        <td style={{padding:"8px 6px"}}><TrafficDot score={p.is}/></td>
                        <td style={{padding:"8px 6px"}}><TrafficDot score={p.es}/></td>
                        <td style={{padding:"8px 6px",fontWeight:700,color:T.green}}>+{p.es-p.is}</td>
                        <td style={{padding:"8px 6px"}}><Badge label={gld?"On Track":"At Risk"} color={gld?T.green:T.amber} bg={gld?T.greenBg:T.amberBg}/></td>
                        <td style={{padding:"8px 6px"}}>{hasSen?<Badge label={p.sen.status==="SEN Support"?"SEN Support":p.sen.status} color={p.sen.ehcp?T.red:p.sen.status==="SEN Support"?T.amber:T.muted} bg={p.sen.ehcp?T.redBg:p.sen.status==="SEN Support"?T.amberBg:T.light}/>:null}</td>
                        <td style={{padding:"8px 6px"}}>{p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}</td>
                        <td style={{padding:"8px 6px"}}>{p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}</td>
                        <td style={{padding:"8px 6px"}}>{p.neli&&<Badge label="NELI" color={T.gold} bg={T.goldLight}/>}</td>
                        <td style={{padding:"8px 6px",fontWeight:600,color:p.attendance>=95?T.green:p.attendance>=90?T.amber:T.red}}>{p.attendance}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Card>
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
// INSIGHTS (Full analytics dashboard)
// ═══════════════════════════════════════════════════════════
function Insights() {
  const [tab, setTab] = useState("overview");
  const [expandedPaper, setExpandedPaper] = useState(null);

  const senPupils = PUPILS.filter(p=>p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring");
  const ealPupils = PUPILS.filter(p=>p.eal);
  const nonEalPupils = PUPILS.filter(p=>!p.eal);
  const cohortAvgE = Math.round(PUPILS.reduce((s,p)=>s+p.es,0)/PUPILS.length*10)/10;
  const cohortAvgI = Math.round(PUPILS.reduce((s,p)=>s+p.is,0)/PUPILS.length*10)/10;
  const gldCount = PUPILS.filter(p=>elgScore(p).gld).length;
  const avgAtt = Math.round(PUPILS.reduce((s,p)=>s+p.attendance,0)/PUPILS.length);

  const tabs = [
    {id:"overview",label:"Overview",icon:BarChart2},
    {id:"language",label:"Language & Literacy",icon:MessageSquare},
    {id:"sen",label:"SEN & SEND",icon:UserCheck},
    {id:"eal",label:"EAL",icon:Users},
    {id:"attendance",label:"Attendance & Wellbeing",icon:Heart},
    {id:"research",label:"Research Library",icon:BookOpen},
  ];

  const ResearchBox = ({color,bg,text}) => (
    <div style={{padding:"16px 20px",background:bg,borderRadius:12,border:`1px solid ${color}30`,marginTop:16}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <span style={{fontSize:18,flexShrink:0}}>📚</span>
        <div>
          <p style={{fontSize:12,fontWeight:700,color,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Research Note</p>
          <p style={{fontSize:13,color:T.text,margin:0,lineHeight:1.7}}>{text}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle title="Insights" subtitle="Parkside Primary · Reception 2024–25 · Data-driven analysis for school leaders"/>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:"white",borderRadius:"12px 12px 0 0",overflowX:"auto",gap:0,marginBottom:0}}>
        {tabs.map(t=><Tab key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>setTab(t.id)}/>)}
      </div>
      <Card style={{borderRadius:"0 0 12px 12px",borderTop:"none",minHeight:500}}>

      {/* ════════════════ OVERVIEW TAB ════════════════ */}
      {tab==="overview"&&(
        <div>
          {/* KPI strip */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
            {[
              {l:"Cohort Avg Score",v:cohortAvgE,s:`+${Math.round((cohortAvgE-88.2)*10)/10} vs national`,c:T.navy},
              {l:"GLD on Track",v:`${Math.round(gldCount/PUPILS.length*100)}%`,s:`${gldCount}/${PUPILS.length}`,c:T.green},
              {l:"SEN Pupils",v:senPupils.length,s:`${Math.round(senPupils.length/PUPILS.length*100)}%`,c:T.red},
              {l:"EAL Pupils",v:ealPupils.length,s:`${Math.round(ealPupils.length/PUPILS.length*100)}%`,c:T.blue},
              {l:"Avg Attendance",v:`${avgAtt}%`,s:avgAtt>=93?"Above national":"Below national",c:avgAtt>=93?T.green:T.amber},
              {l:"NELI Impact",v:`+${neliAvgGain}`,s:"Avg gain (pts)",c:T.gold},
            ].map(k=>(
              <div key={k.l} style={{background:T.light,borderRadius:10,padding:"14px",textAlign:"center",borderTop:`3px solid ${k.c}`}}>
                <p style={{fontSize:9,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px",letterSpacing:"0.04em"}}>{k.l}</p>
                <p style={{fontSize:24,fontWeight:800,color:k.c,margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{k.v}</p>
                <p style={{fontSize:10,color:T.muted,margin:0}}>{k.s}</p>
              </div>
            ))}
          </div>

          {/* Row 2: 3 charts */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Score Trajectory — Full Cohort</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[{m:"Sep",school:cohortAvgI,national:88},{m:"Oct",school:cohortAvgI+1,national:88.5},{m:"Nov",school:cohortAvgI+2,national:89},{m:"Dec",school:cohortAvgI+3,national:89.5},{m:"Jan",school:cohortAvgI+4.5,national:90},{m:"Feb",school:cohortAvgI+5.5,national:90.5},{m:"Mar",school:cohortAvgE,national:91}]} margin={{top:5,right:10,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="m" tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis domain={[85,100]} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/>
                  <Line type="monotone" dataKey="school" stroke={T.navy} strokeWidth={2.5} dot={{r:3}} name="Parkside"/>
                  <Line type="monotone" dataKey="national" stroke={T.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="National Avg"/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>GLD Projection by Group</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {group:"All",onTrack:gldCount,atRisk:PUPILS.length-gldCount},
                  {group:"SEN",onTrack:senPupils.filter(p=>elgScore(p).gld).length,atRisk:senPupils.length-senPupils.filter(p=>elgScore(p).gld).length},
                  {group:"EAL",onTrack:ealPupils.filter(p=>elgScore(p).gld).length,atRisk:ealPupils.length-ealPupils.filter(p=>elgScore(p).gld).length},
                  {group:"FSM",onTrack:PUPILS.filter(p=>p.fsm&&elgScore(p).gld).length,atRisk:PUPILS.filter(p=>p.fsm).length-PUPILS.filter(p=>p.fsm&&elgScore(p).gld).length},
                  {group:"Non-FSM",onTrack:PUPILS.filter(p=>!p.fsm&&elgScore(p).gld).length,atRisk:PUPILS.filter(p=>!p.fsm).length-PUPILS.filter(p=>!p.fsm&&elgScore(p).gld).length},
                ]} margin={{top:5,right:5,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="group" tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/>
                  <Bar dataKey="onTrack" fill={T.green} radius={[3,3,0,0]} name="On Track" stackId="a"/>
                  <Bar dataKey="atRisk" fill={T.red} radius={[3,3,0,0]} name="At Risk" stackId="a"/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>School Performance Profile</h4>
              {(()=>{
                const schoolData = {lang:Math.round(cohortAvgE/1.3),att:avgAtt,gld:Math.round(gldCount/PUPILS.length*100),sen:Math.round((1-senPupils.filter(p=>p.es<85).length/Math.max(senPupils.length,1))*100),neli:85,parent:78};
                const trustData = {lang:72,att:91,gld:70,sen:65,neli:75,parent:70};
                const rData = [
                  {subject:"Language",school:schoolData.lang,trust:trustData.lang,fullMark:100},
                  {subject:"Attendance",school:schoolData.att,trust:trustData.att,fullMark:100},
                  {subject:"GLD %",school:schoolData.gld,trust:trustData.gld,fullMark:100},
                  {subject:"SEN Quality",school:schoolData.sen,trust:trustData.sen,fullMark:100},
                  {subject:"NELI",school:schoolData.neli,trust:trustData.neli,fullMark:100},
                  {subject:"Parents",school:schoolData.parent,trust:trustData.parent,fullMark:100},
                ];
                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={rData}>
                      <PolarGrid stroke={T.border}/>
                      <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:T.muted}}/>
                      <PolarRadiusAxis domain={[0,100]} tick={false}/>
                      <Radar name="Parkside" dataKey="school" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                      <Radar name="Trust Avg" dataKey="trust" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/>
                      <Legend wrapperStyle={{fontSize:10}}/>
                      <Tooltip/>
                    </RadarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          {/* Row 3: 2 charts */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Every Pupil — Initial vs Current Score</h4>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{top:5,right:10,left:-10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="x" name="Initial" tick={{fontSize:10,fill:T.muted}} domain={[55,120]} label={{value:"Initial",position:"bottom",fontSize:10,fill:T.muted}}/>
                  <YAxis dataKey="y" name="Current" tick={{fontSize:10,fill:T.muted}} domain={[75,120]} label={{value:"Current",angle:-90,position:"left",fontSize:10,fill:T.muted}}/>
                  <ZAxis range={[40,40]}/>
                  <Tooltip content={({payload})=>payload&&payload[0]?<div style={{background:"white",padding:"6px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:11}}><strong>{payload[0].payload.name}</strong><br/>Initial: {payload[0].payload.x} → Current: {payload[0].payload.y}</div>:null}/>
                  <ReferenceLine segment={[{x:55,y:55},{x:120,y:120}]} stroke={T.muted} strokeDasharray="4 4"/>
                  <Scatter data={PUPILS.map(p=>({x:p.is,y:p.es,name:p.name,fill:p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"?T.red:p.eal?T.blue:T.navy}))} >
                    {PUPILS.map((p,i)=><Cell key={i} fill={p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"?T.red:p.eal?T.blue:T.navy}/>)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:6}}>
                {[["SEN",T.red],["EAL",T.blue],["Standard",T.navy]].map(([l,c])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>{l}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Weekly Progress Heatmap</h4>
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"collapse",fontSize:9,width:"100%"}}>
                  <thead>
                    <tr>
                      <th style={{textAlign:"left",padding:"3px 6px",color:T.muted,fontSize:9}}>Pupil</th>
                      {Array.from({length:17}).map((_,i)=><th key={i} style={{padding:"3px 2px",color:T.muted,fontSize:8,textAlign:"center"}}>W{i+1}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {neliPupils.map(p=>(
                      <tr key={p.id}>
                        <td style={{padding:"3px 6px",fontWeight:600,color:T.text,whiteSpace:"nowrap",fontSize:10}}>{p.name.split(" ")[0]}</td>
                        {Array.from({length:17}).map((_,i)=>{
                          const attended = Math.random()>0.12;
                          return <td key={i} style={{padding:0}}><div style={{width:14,height:14,margin:"1px auto",borderRadius:2,background:attended?T.navy:T.red}}/></td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{display:"flex",gap:10,marginTop:6,justifyContent:"center"}}>
                  {[["Attended",T.navy],["Missed",T.red]].map(([l,c])=>(
                    <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
                      <div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ LANGUAGE & LITERACY TAB ════════════════ */}
      {tab==="language"&&(
        <div>
          <div style={{background:T.goldLight,borderRadius:10,padding:"16px 20px",marginBottom:16,border:`1px solid #FDE68A`}}>
            <p style={{fontSize:14,color:T.text,margin:0,lineHeight:1.6}}>
              <strong style={{color:T.navy}}>Avg Initial {cohortAvgI}</strong> → <strong style={{color:T.green}}>Avg Current {cohortAvgE}</strong>, gain <strong style={{color:T.green}}>+{Math.round((cohortAvgE-cohortAvgI)*10)/10}</strong> · vs national avg gain +4.2 · <strong style={{color:T.green}}>Outperforming by +{Math.round((cohortAvgE-cohortAvgI-4.2)*10)/10}</strong>
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Score Distribution — Initial vs Current</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {band:"<75",initial:PUPILS.filter(p=>p.is<75).length,current:PUPILS.filter(p=>p.es<75).length},
                  {band:"75-84",initial:PUPILS.filter(p=>p.is>=75&&p.is<85).length,current:PUPILS.filter(p=>p.es>=75&&p.es<85).length},
                  {band:"85-89",initial:PUPILS.filter(p=>p.is>=85&&p.is<90).length,current:PUPILS.filter(p=>p.es>=85&&p.es<90).length},
                  {band:"90-94",initial:PUPILS.filter(p=>p.is>=90&&p.is<95).length,current:PUPILS.filter(p=>p.es>=90&&p.es<95).length},
                  {band:"95-99",initial:PUPILS.filter(p=>p.is>=95&&p.is<100).length,current:PUPILS.filter(p=>p.es>=95&&p.es<100).length},
                  {band:"100+",initial:PUPILS.filter(p=>p.is>=100).length,current:PUPILS.filter(p=>p.es>=100).length},
                ]} margin={{top:5,right:5,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="band" tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/><Legend wrapperStyle={{fontSize:10}}/>
                  <Bar dataKey="initial" fill="#FBBF24" radius={[3,3,0,0]} name="Initial"/>
                  <Bar dataKey="current" fill={T.navy} radius={[3,3,0,0]} name="Current"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Subscale Breakdown — Class Average</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart layout="vertical" data={[
                  {name:"Rec. Vocab",pct:Math.round(PUPILS.reduce((s,p)=>s+p.subscores.recVocab,0)/PUPILS.length)},
                  {name:"Exp. Vocab",pct:Math.round(PUPILS.reduce((s,p)=>s+p.subscores.expVocab,0)/PUPILS.length)},
                  {name:"Grammar",pct:Math.round(PUPILS.reduce((s,p)=>s+p.subscores.grammar,0)/PUPILS.length)},
                  {name:"Listening",pct:Math.round(PUPILS.reduce((s,p)=>s+p.subscores.listening,0)/PUPILS.length)},
                ]} margin={{top:5,right:10,left:10,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis type="number" tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.muted}} width={70}/>
                  <Tooltip/><Bar dataKey="pct" fill={T.navy} radius={[0,4,4,0]} name="Avg Score"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>NELI Pupils — Individual Trajectories</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart margin={{top:5,right:10,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="m" type="category" allowDuplicatedCategory={false} tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis domain={[55,100]} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/><Legend wrapperStyle={{fontSize:10}}/>
                  <Line data={[{m:"Sep"},{m:"Oct"},{m:"Nov"},{m:"Dec"},{m:"Jan"},{m:"Feb"},{m:"Mar"}].map((d,i)=>({...d,v:88+i*0.5}))} dataKey="v" stroke={T.muted} strokeDasharray="5 3" strokeWidth={1} dot={false} name="National Expected"/>
                  {neliPupils.map((p,pi)=>{
                    const colors = [T.red,T.amber,T.blue,T.green,T.purple];
                    const diff = p.es-p.is;
                    const traj = [{m:"Sep"},{m:"Oct"},{m:"Nov"},{m:"Dec"},{m:"Jan"},{m:"Feb"},{m:"Mar"}].map((d,i)=>({...d,v:Math.round(p.is+diff*(i/6))}));
                    return <Line key={p.id} data={traj} dataKey="v" stroke={colors[pi]} strokeWidth={2} dot={{r:2}} name={p.name.split(" ")[0]}/>;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>All Pupils — Ranked by Gain</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...PUPILS].sort((a,b)=>(b.es-b.is)-(a.es-a.is)).map(p=>({name:p.name.split(" ")[0],gain:p.es-p.is}))} margin={{top:5,right:5,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="name" tick={{fontSize:8,fill:T.muted}} interval={0} angle={-45} textAnchor="end" height={50}/>
                  <YAxis tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/>
                  <Bar dataKey="gain" radius={[3,3,0,0]} name="Score Gain">
                    {[...PUPILS].sort((a,b)=>(b.es-b.is)-(a.es-a.is)).map((p,i)=><Cell key={i} fill={(p.es-p.is)>=Math.round((cohortAvgE-cohortAvgI))?T.green:T.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pupil table */}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:T.light}}>
                {["Pupil","Initial","Current","Gain","vs Expected","Weakest Subscale","Risk","Trend"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...PUPILS].sort((a,b)=>a.es-b.es).map(p=>{
                  const gain=p.es-p.is;const expected=Math.round((cohortAvgE-cohortAvgI));
                  const subs=Object.entries(p.subscores);const weakest=subs.reduce((a,b)=>a[1]<b[1]?a:b);
                  const weakLabel={recVocab:"Rec. Vocab",expVocab:"Exp. Vocab",grammar:"Grammar",listening:"Listening"}[weakest[0]]||weakest[0];
                  return (
                    <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:"8px 10px",fontWeight:600,color:T.text}}>{p.name}</td>
                      <td style={{padding:"8px 10px"}}><TrafficDot score={p.is}/></td>
                      <td style={{padding:"8px 10px"}}><TrafficDot score={p.es}/></td>
                      <td style={{padding:"8px 10px",fontWeight:700,color:T.green}}>+{gain}</td>
                      <td style={{padding:"8px 10px",color:gain>=expected?T.green:T.red,fontWeight:600}}>{gain>=expected?`+${gain-expected} above`:`${expected-gain} below`}</td>
                      <td style={{padding:"8px 10px",color:T.muted}}>{weakLabel} ({weakest[1]})</td>
                      <td style={{padding:"8px 10px"}}>{p.es<85?<Badge label="At Risk" color={T.red} bg={T.redBg}/>:p.es<96?<Badge label="Monitor" color={T.amber} bg={T.amberBg}/>:null}</td>
                      <td style={{padding:"8px 10px",fontSize:16}}>{gain>expected?"📈":gain>0?"➡️":"📉"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════ SEN & SEND TAB ════════════════ */}
      {tab==="sen"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {[
              {l:"Total SEN",v:senPupils.length,s:`EHCP: ${senPupils.filter(p=>p.sen.ehcp).length} · Support: ${senPupils.filter(p=>p.sen.status==="SEN Support").length} · Monitor: ${senPupils.filter(p=>p.sen.status==="Monitoring").length}`,c:T.red},
              {l:"SEN Avg Score",v:senPupils.length?Math.round(senPupils.reduce((s,p)=>s+p.es,0)/senPupils.length*10)/10:"N/A",s:`vs non-SEN ${Math.round(PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").reduce((s,p)=>s+p.es,0)/Math.max(PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").length,1)*10)/10}`,c:T.amber},
              {l:"SEN Attendance",v:senPupils.length?`${Math.round(senPupils.reduce((s,p)=>s+p.attendance,0)/senPupils.length)}%`:"N/A",s:`vs school ${avgAtt}%`,c:T.amber},
              {l:"SEN on NELI",v:`${senPupils.filter(p=>p.neli).length}/${senPupils.length}`,s:`${Math.round(senPupils.filter(p=>p.neli).length/Math.max(senPupils.length,1)*100)}%`,c:T.navy},
            ].map(k=>(
              <div key={k.l} style={{background:T.light,borderRadius:10,padding:"14px",textAlign:"center",borderTop:`3px solid ${k.c}`}}>
                <p style={{fontSize:9,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>{k.l}</p>
                <p style={{fontSize:22,fontWeight:800,color:k.c,margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{k.v}</p>
                <p style={{fontSize:10,color:T.muted,margin:0}}>{k.s}</p>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>SEN Category Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    {name:"Speech & Lang",value:PUPILS.filter(p=>p.sen.category==="Communication & Interaction").length},
                    {name:"SEMH",value:PUPILS.filter(p=>p.sen.category==="Social, Emotional & Mental Health").length},
                    {name:"Cognition",value:PUPILS.filter(p=>p.sen.category==="Cognition & Learning").length},
                    {name:"EAL",value:PUPILS.filter(p=>p.sen.status==="EAL Monitoring").length},
                    {name:"None",value:PUPILS.filter(p=>p.sen.status==="None").length},
                  ].filter(d=>d.value>0)} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {[T.red,T.amber,T.blue,T.purple,T.border].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip/><Legend wrapperStyle={{fontSize:10}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>SEN vs Non-SEN Score Comparison</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {period:"Initial",sen:senPupils.length?Math.round(senPupils.reduce((s,p)=>s+p.is,0)/senPupils.length):0,nonSen:Math.round(PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").reduce((s,p)=>s+p.is,0)/Math.max(PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").length,1))},
                  {period:"Current",sen:senPupils.length?Math.round(senPupils.reduce((s,p)=>s+p.es,0)/senPupils.length):0,nonSen:Math.round(PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").reduce((s,p)=>s+p.es,0)/Math.max(PUPILS.filter(p=>p.sen.status==="None"||p.sen.status==="EAL Monitoring").length,1))},
                ]} margin={{top:5,right:10,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="period" tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis domain={[60,110]} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/><Legend wrapperStyle={{fontSize:10}}/>
                  <Bar dataKey="sen" fill={T.red} radius={[3,3,0,0]} name="SEN Avg"/>
                  <Bar dataKey="nonSen" fill={T.green} radius={[3,3,0,0]} name="Non-SEN Avg"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SEN detail table */}
          <div style={{overflowX:"auto",marginBottom:12}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:T.light}}>
                {["Name","Category","Status","Initial","Current","Gain","Attendance","SALT","Next Review","Risk"].map(h=>(
                  <th key={h} style={{padding:"8px 8px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {senPupils.map(p=>(
                  <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`,background:p.es<85?T.redBg:T.card}}>
                    <td style={{padding:"8px",fontWeight:600,color:T.text}}>{p.name}</td>
                    <td style={{padding:"8px",fontSize:11,color:T.muted}}>{p.sen.category?.replace("Communication & Interaction","Speech & Lang").replace("Social, Emotional & Mental Health","SEMH")||"—"}</td>
                    <td style={{padding:"8px"}}><Badge label={p.sen.status} color={p.sen.ehcp?T.red:T.amber} bg={p.sen.ehcp?T.redBg:T.amberBg}/></td>
                    <td style={{padding:"8px"}}><TrafficDot score={p.is}/></td>
                    <td style={{padding:"8px"}}><TrafficDot score={p.es}/></td>
                    <td style={{padding:"8px",fontWeight:700,color:T.green}}>+{p.es-p.is}</td>
                    <td style={{padding:"8px",color:p.attendance>=90?T.green:T.red,fontWeight:600}}>{p.attendance}%</td>
                    <td style={{padding:"8px"}}>{p.senDetail?.saltReferral?<Badge label="Yes" color={T.amber} bg={T.amberBg}/>:<span style={{color:T.muted}}>No</span>}</td>
                    <td style={{padding:"8px",fontSize:11,color:T.text}}>{p.senDetail?.nextReview||"—"}</td>
                    <td style={{padding:"8px"}}>{p.es<85?<Badge label="High" color={T.red} bg={T.redBg}/>:null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResearchBox color={T.amber} bg={T.amberBg} text="Pupils with speech, language and communication needs (SLCN) represent the largest category of SEN in UK primary schools (ICAN, 2018). Early identification and targeted intervention such as NELI can reduce the attainment gap by up to 40% by end of KS1 (Fricke et al., 2017, University of York)."/>
        </div>
      )}

      {/* ════════════════ EAL TAB ════════════════ */}
      {tab==="eal"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {(()=>{
              const ealAvgE=ealPupils.length?Math.round(ealPupils.reduce((s,p)=>s+p.es,0)/ealPupils.length*10)/10:0;
              const nonEalAvgE=nonEalPupils.length?Math.round(nonEalPupils.reduce((s,p)=>s+p.es,0)/nonEalPupils.length*10)/10:0;
              const ealAvgI=ealPupils.length?Math.round(ealPupils.reduce((s,p)=>s+p.is,0)/ealPupils.length*10)/10:0;
              const nonEalAvgI=nonEalPupils.length?Math.round(nonEalPupils.reduce((s,p)=>s+p.is,0)/nonEalPupils.length*10)/10:0;
              return [
                {l:"EAL Pupils",v:ealPupils.length,s:`${Math.round(ealPupils.length/PUPILS.length*100)}% of cohort`,c:T.blue},
                {l:"EAL Avg Score",v:ealAvgE,s:`vs non-EAL ${nonEalAvgE}`,c:T.blue},
                {l:"EAL Gap",v:`${Math.round((ealAvgE-nonEalAvgE)*10)/10}`,s:`Was ${Math.round((ealAvgI-nonEalAvgI)*10)/10} in Sep (narrowing)`,c:T.amber},
                {l:"EAL on NELI",v:`${ealPupils.filter(p=>p.neli).length}/${ealPupils.length}`,s:"On programme",c:T.navy},
              ];
            })().map(k=>(
              <div key={k.l} style={{background:T.light,borderRadius:10,padding:"14px",textAlign:"center",borderTop:`3px solid ${k.c}`}}>
                <p style={{fontSize:9,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>{k.l}</p>
                <p style={{fontSize:22,fontWeight:800,color:k.c,margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{k.v}</p>
                <p style={{fontSize:10,color:T.muted,margin:0}}>{k.s}</p>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>EAL Gap Closing Over Time</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[
                  {m:"Sep",eal:Math.round(ealPupils.reduce((s,p)=>s+p.is,0)/ealPupils.length),nonEal:Math.round(nonEalPupils.reduce((s,p)=>s+p.is,0)/nonEalPupils.length)},
                  {m:"Nov",eal:Math.round(ealPupils.reduce((s,p)=>s+p.is+(p.es-p.is)*0.35,0)/ealPupils.length),nonEal:Math.round(nonEalPupils.reduce((s,p)=>s+p.is+(p.es-p.is)*0.3,0)/nonEalPupils.length)},
                  {m:"Jan",eal:Math.round(ealPupils.reduce((s,p)=>s+p.is+(p.es-p.is)*0.65,0)/ealPupils.length),nonEal:Math.round(nonEalPupils.reduce((s,p)=>s+p.is+(p.es-p.is)*0.55,0)/nonEalPupils.length)},
                  {m:"Mar",eal:Math.round(ealPupils.reduce((s,p)=>s+p.es,0)/ealPupils.length),nonEal:Math.round(nonEalPupils.reduce((s,p)=>s+p.es,0)/nonEalPupils.length)},
                ] } margin={{top:5,right:10,left:-15,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="m" tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis domain={[80,105]} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip/><Legend wrapperStyle={{fontSize:10}}/>
                  <Line type="monotone" dataKey="eal" stroke={T.blue} strokeWidth={2.5} dot={{r:3}} name="EAL Avg"/>
                  <Line type="monotone" dataKey="nonEal" stroke={T.muted} strokeWidth={2} dot={{r:3}} name="Non-EAL Avg"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>EAL Stage Distribution</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    {name:"Developing",value:ealPupils.filter(p=>p.ealStage==="Developing").length},
                    {name:"Competent",value:ealPupils.filter(p=>p.ealStage==="Competent").length},
                    {name:"Fluent",value:ealPupils.filter(p=>p.ealStage==="Fluent").length},
                    {name:"Other",value:ealPupils.filter(p=>!["Developing","Competent","Fluent"].includes(p.ealStage)).length},
                  ].filter(d=>d.value>0)} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {[T.amber,T.blue,T.green,T.muted].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip/><Legend wrapperStyle={{fontSize:10}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* EAL pupil table */}
          <div style={{overflowX:"auto",marginBottom:12}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:T.light}}>
                {["Name","Home Language","EAL Stage","Initial","Current","Gain","Weakest Area","Support"].map(h=>(
                  <th key={h} style={{padding:"8px 8px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ealPupils.map(p=>{
                  const subs=Object.entries(p.subscores);const weakest=subs.reduce((a,b)=>a[1]<b[1]?a:b);
                  const weakLabel={recVocab:"Rec. Vocab",expVocab:"Exp. Vocab",grammar:"Grammar",listening:"Listening"}[weakest[0]]||weakest[0];
                  return (
                    <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:"8px",fontWeight:600,color:T.text}}>{p.name}</td>
                      <td style={{padding:"8px",color:T.text}}>{p.homeLanguage||"—"}</td>
                      <td style={{padding:"8px"}}><Badge label={p.ealStage||"—"} color={T.blue} bg={T.blueBg}/></td>
                      <td style={{padding:"8px"}}><TrafficDot score={p.is}/></td>
                      <td style={{padding:"8px"}}><TrafficDot score={p.es}/></td>
                      <td style={{padding:"8px",fontWeight:700,color:T.green}}>+{p.es-p.is}</td>
                      <td style={{padding:"8px",color:T.muted}}>{weakLabel}</td>
                      <td style={{padding:"8px",fontSize:11,color:T.muted}}>{p.sen.adjustments?.slice(0,2).join(", ")||"Standard"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ResearchBox color={T.blue} bg={T.blueBg} text="EAL learners who receive structured oral language support in the early years show accelerated vocabulary acquisition within 18 months (Strand & Lindorff, 2021, Oxford University). The NELI programme shows particular effectiveness with EAL learners, with average gains of +14 points vs +11 for non-EAL peers in DfE-funded trials."/>
        </div>
      )}

      {/* ════════════════ ATTENDANCE & WELLBEING TAB ════════════════ */}
      {tab==="attendance"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
            {[
              {l:"School Avg Attend.",v:`${avgAtt}%`,c:avgAtt>=93?T.green:T.amber},
              {l:"Persistent Absence",v:PUPILS.filter(p=>p.attendance<90).length,s:"Below 90%",c:T.red},
              {l:"Avg Wellbeing",v:`${(PUPILS.reduce((s,p)=>s+p.leuven.wellbeing,0)/PUPILS.length).toFixed(1)}/5`,c:T.green},
              {l:"Avg Involvement",v:`${(PUPILS.reduce((s,p)=>s+p.leuven.involvement,0)/PUPILS.length).toFixed(1)}/5`,c:T.green},
              {l:"Wellbeing Concerns",v:PUPILS.filter(p=>p.leuven.wellbeing<=2).length,s:"Score 1-2",c:T.red},
            ].map(k=>(
              <div key={k.l} style={{background:T.light,borderRadius:10,padding:"12px",textAlign:"center",borderTop:`3px solid ${k.c}`}}>
                <p style={{fontSize:9,fontWeight:700,color:T.muted,textTransform:"uppercase",margin:"0 0 4px"}}>{k.l}</p>
                <p style={{fontSize:22,fontWeight:800,color:k.c,margin:"0 0 2px",fontFamily:"Georgia,serif"}}>{k.v}</p>
                {k.s&&<p style={{fontSize:10,color:T.muted,margin:0}}>{k.s}</p>}
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Attendance by Pupil</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart layout="vertical" data={[...PUPILS].sort((a,b)=>a.attendance-b.attendance).slice(0,12).map(p=>({name:p.name.split(" ")[0],att:p.attendance}))} margin={{top:5,right:10,left:10,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis type="number" domain={[75,100]} tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.muted}} width={55}/>
                  <Tooltip/>
                  <ReferenceLine x={90} stroke={T.red} strokeDasharray="4 4" label={{value:"90%",position:"top",fontSize:9,fill:T.red}}/>
                  <Bar dataKey="att" radius={[0,3,3,0]} name="Attendance %">
                    {[...PUPILS].sort((a,b)=>a.attendance-b.attendance).slice(0,12).map((p,i)=><Cell key={i} fill={p.attendance>=95?T.green:p.attendance>=90?T.amber:T.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.light,borderRadius:10,padding:"14px"}}>
              <h4 style={{fontSize:12,fontWeight:700,color:T.text,margin:"0 0 10px"}}>Attendance vs Language Score</h4>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{top:5,right:10,left:-10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                  <XAxis dataKey="x" name="Attendance %" tick={{fontSize:10,fill:T.muted}} domain={[78,100]}/>
                  <YAxis dataKey="y" name="Score" tick={{fontSize:10,fill:T.muted}} domain={[70,120]}/>
                  <ZAxis range={[40,40]}/>
                  <Tooltip content={({payload})=>payload&&payload[0]?<div style={{background:"white",padding:"6px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:11}}><strong>{payload[0].payload.name}</strong><br/>Attend: {payload[0].payload.x}% · Score: {payload[0].payload.y}</div>:null}/>
                  <Scatter data={PUPILS.map(p=>({x:p.attendance,y:p.es,name:p.name}))} fill={T.navy}/>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail table */}
          <div style={{overflowX:"auto",marginBottom:12}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:T.light}}>
                {["Name","Attendance","Missed","PA Flag","Wellbeing","Involvement","Notes"].map(h=>(
                  <th key={h} style={{padding:"8px 8px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...PUPILS].sort((a,b)=>a.attendance-b.attendance).map(p=>(
                  <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`,background:p.attendance<90?T.redBg:T.card}}>
                    <td style={{padding:"8px",fontWeight:600,color:T.text}}>{p.name}</td>
                    <td style={{padding:"8px",fontWeight:700,color:p.attendance>=95?T.green:p.attendance>=90?T.amber:T.red}}>{p.attendance}%</td>
                    <td style={{padding:"8px",color:T.muted}}>{p.attendanceDetail?.missed||"—"}</td>
                    <td style={{padding:"8px"}}>{p.attendance<90?<Badge label="PA" color={T.red} bg={T.redBg}/>:null}</td>
                    <td style={{padding:"8px"}}><span style={{color:p.leuven.wellbeing<=2?T.red:p.leuven.wellbeing<=3?T.amber:T.green,fontWeight:700}}>{p.leuven.wellbeing}/5</span></td>
                    <td style={{padding:"8px"}}><span style={{color:p.leuven.involvement<=2?T.red:p.leuven.involvement<=3?T.amber:T.green,fontWeight:700}}>{p.leuven.involvement}/5</span></td>
                    <td style={{padding:"8px",fontSize:11,color:T.muted}}>{p.attendanceDetail?.notes||p.wellbeingDetail?.notes||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResearchBox color={T.green} bg={T.greenBg} text="Persistent absence (below 90% attendance) is strongly associated with lower attainment in language and literacy outcomes. Pupils missing more than 10% of sessions show on average 6.3 fewer standard score points in language assessments (DfE, 2023). Leuven scales show strong predictive validity for early years engagement (Laevers, 1994; Pascal & Bertram, 2021)."/>
        </div>
      )}

      {/* ════════════════ RESEARCH LIBRARY TAB ════════════════ */}
      {tab==="research"&&(
        <div>
          <div style={{marginBottom:20}}>
            <h3 style={{fontSize:18,fontWeight:800,color:T.text,margin:"0 0 6px",fontFamily:"Georgia,serif"}}>Research Library</h3>
            <p style={{fontSize:13,color:T.muted,margin:0,lineHeight:1.6}}>Peer-reviewed evidence base from the creators of NELI and LanguageScreen — Prof. Charles Hulme & Prof. Margaret J. Snowling, University of Oxford</p>
          </div>
          {(()=>{
            const tagColor = t => {
              if(["NELI","NELI Preschool"].includes(t)) return {bg:T.goldLight,c:T.gold};
              if(["RCT","Scale","Efficacy"].includes(t)) return {bg:T.greenBg,c:T.green};
              if(["EAL","Vocabulary","Oral Language"].includes(t)) return {bg:T.blueBg,c:T.blue};
              if(["SEN","SLCN","SEMH"].includes(t)) return {bg:T.redBg,c:T.red};
              if(["Theory","Framework","Policy","Evidence Synthesis"].includes(t)) return {bg:T.purpleBg,c:T.purple};
              if(["EEF","DfE","National Scale"].includes(t)) return {bg:"#EFF6FF",c:T.navy};
              return {bg:T.light,c:T.muted};
            };
            const papers = [
              {id:1,title:"NELI programme is associated with lasting improvements in children's language and reading skills",authors:"Hulme, C., West, G., Rios Diaz, M., Hearne, S., Korell, C., Duta, M., & Snowling, M.J.",year:2025,journal:"Journal of Child Psychology and Psychiatry",url:"https://doi.org/10.1111/jcpp.14157",tags:["NELI","RCT","Long-term Impact","Reading","Oral Language"],badge:"Highly Relevant to Your School's Data",summary:"The largest follow-up study of NELI to date. At 2-year follow-up, children who received NELI had significantly better oral language (d=0.22\u20130.33), reading comprehension (d=0.16\u20130.24) and single-word reading (d=0.16\u20130.22) than controls. Crucially, gains were durable \u2014 not the typical \u2018fade-out\u2019 seen in many educational interventions. Effect sizes were larger for children with the weakest initial language skills. One of the most downloaded papers in JCPP 2021."},
              {id:2,title:"LanguageScreen: Development, Validation and Standardisation of an Automated Language Assessment App",authors:"Hulme, C., McGrane, J., Duta, M., West, G., Cripps, D., Dasgupta, A., Hearne, S., Gardner, R., & Snowling, M.J.",year:2024,journal:"Language, Speech and Hearing Services in Schools",url:"https://doi.org/10.1044/2024_LSHSS-24-00004",tags:["LanguageScreen","Standardisation","Assessment","Psychometrics"],badge:"Highly Relevant \u2014 This is the tool you're using",summary:"Reports the development and standardisation of LanguageScreen using data from approximately 350,000 children aged 3;6\u20138;11. LanguageScreen shows excellent psychometric properties (Cronbach\u2019s \u03b1 = .92), correlates strongly with established language tests, and is sensitive to improvements brought about by intervention. Provides a quick and reliable assessment for use by education professionals."},
              {id:3,title:"Early language screening and intervention can be delivered successfully at scale: Evidence from a cluster randomised controlled trial",authors:"West, G., Snowling, M.J., Lerv\u00e5g, A., Buchanan-Worster, E., Duta, M., Hall, A., McLachlan, H., & Hulme, C.",year:2021,journal:"Journal of Child Psychology and Psychiatry, 62(12), 1425\u20131434",url:"#",tags:["NELI","RCT","Scale","EAL","FSM","Oral Language"],badge:"Highly Relevant to Your School's Data",summary:"Landmark cluster RCT across 193 schools (238 Reception classrooms). Children receiving NELI made an average 4 months\u2019 additional progress in language skills vs controls. FSM-eligible children made 7 months\u2019 additional progress. Positive effects were consistent across genders and EAL children. EEF security rating: 5/5 padlocks \u2014 the highest available. This is the definitive at-scale evidence for the programme your school is running."},
              {id:4,title:"Early language intervention improves behavioural adjustment in school: Evidence from a cluster randomised trial",authors:"West, G., Lerv\u00e5g, A., Snowling, M.J., Buchanan-Worster, E., Duta, M., & Hulme, C.",year:2022,journal:"Journal of School Psychology, 92, 334\u2013345",url:"https://doi.org/10.1016/j.jsp.2022.04.006",tags:["NELI","Behaviour","SEMH","RCT","School Readiness"],badge:"Relevant \u2014 especially for your SEN/SEMH pupils",summary:"Using the same large-scale RCT, this paper shows NELI produced significant improvements in teacher-rated behavioural adjustment \u2014 not just language. Children who received NELI showed better listening, attention and self-regulation. Particularly relevant for schools with SEMH pupils. The programme requirements (sitting still, listening, following instructions, with positive reinforcement) appear to produce generalised improvements in school-readiness behaviour."},
              {id:5,title:"The efficacy of early language intervention in mainstream school settings: a randomised controlled trial",authors:"Fricke, S., Burgoyne, K., Bowyer-Crane, C., Kyriacou, M., Zosimidou, A., Maxwell, L., Lerv\u00e5g, A., Snowling, M.J., & Hulme, C.",year:2017,journal:"Journal of Child Psychology and Psychiatry, 58(10), 1141\u20131151",url:"https://doi.org/10.1111/jcpp.12737",tags:["NELI","RCT","Mainstream Schools","Efficacy"],badge:null,summary:"The 30-week NELI programme RCT showing an effect size of d=0.80 on language skills at end of programme (d=0.83 at 6-month follow-up). One of the largest effect sizes reported for any oral language intervention. This is the paper that established NELI as the world\u2019s best-evidenced oral language intervention for early years."},
              {id:6,title:"Children's Language Skills Can Be Improved: Lessons from Psychological Science for Educational Policy",authors:"Hulme, C., Snowling, M.J., West, G., Lerv\u00e5g, A., & Melby-Lerv\u00e5g, M.",year:2020,journal:"Current Directions in Psychological Science",url:"#",tags:["Oral Language","Policy","Evidence Synthesis"],badge:null,summary:"Synthesises evidence across multiple RCTs showing oral language skills are malleable and respond to targeted intervention. Reviews the NELI programme and similar approaches, making the case for structured early language support as education policy. Written for a policy-facing audience \u2014 ideal for sharing with governors or trust leadership."},
              {id:7,title:"The Reading Is Language Model: A Theoretical Framework for Language and Reading Development and Intervention",authors:"Snowling, M.J. & Hulme, C.",year:2025,journal:"Annual Review of Developmental Psychology, 7, 195\u2013218",url:"https://doi.org/10.1146/annurev-devpsych-111323-084821",tags:["Theory","Reading","Framework"],badge:null,summary:"Proposes the Reading is Language (RIL) model \u2014 the theoretical framework underpinning LanguageScreen and NELI. Views oral language as the critical foundation for ALL aspects of literacy development. Confirms that interventions targeting oral language in early years have lasting benefits for reading comprehension and written expression. Published by OxEd\u2019s own founders \u2014 the intellectual core of everything your school is doing."},
              {id:8,title:"NELI Preschool: Efficacy of early language intervention in the year before school entry",authors:"West, G., Lerv\u00e5g, A., Birchenough, J.M.H., Korell, C., Rios Diaz, M., Duta, M., Cripps, D., Gardner, R., Fairhurst, C., & Hulme, C.",year:2024,journal:"Journal of Child Psychology and Psychiatry, 65(8), 1087\u20131097",url:"https://doi.org/10.1111/jcpp.13947",tags:["NELI Preschool","Early Years","EAL","RCT"],badge:"Relevant \u2014 for nursery/preschool transition planning",summary:"RCT evaluating NELI Preschool (delivered before Reception entry). LanguageScreen proved valid and reliable for this younger age group. Children receiving the intervention showed significantly larger language gains. EAL children made equivalent progress to their peers. Particularly relevant for schools with high proportions of EAL and disadvantaged children entering Reception."},
              {id:9,title:"Impact Evaluation of NELI Wave 2 at National Scale",authors:"Smith, E. et al. (NFER, commissioned by EEF)",year:2023,journal:"Education Endowment Foundation Evaluation Report",url:"https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/nuffield-early-language-intervention-scale-up-impact-evaluation",tags:["NELI","EEF","National Scale","FSM","EAL"],badge:"Highly Relevant \u2014 government-funded independent evaluation",summary:"Independent NFER evaluation of NELI at national scale. Children receiving NELI made on average 4 months\u2019 additional progress in language skills vs controls. FSM pupils: 7 months additional progress. EAL pupils made equivalent progress to non-EAL peers on the programme. EEF evidence security rating: 5/5 padlocks. This is the evidence that secured \u00a317 million DfE funding and the basis for your school\u2019s DfE-funded programme status."},
              {id:10,title:"OxEd & Assessment \u2014 Research Overview",authors:"Hulme, C., Snowling, M.J., West, G. et al.",year:null,journal:"University of Oxford Spinout \u2014 OxEd & Assessment Ltd",url:"https://oxedandassessment.com/research/overview/",tags:["OxEd","LanguageScreen","NELI","Overview"],badge:"Essential Reading \u2014 your programme provider",summary:"OxEd is a University of Oxford spinout founded by Professors Charles Hulme and Margaret Snowling, creators of NELI. Their tools are backed by 20+ years of research including 4 RCTs. NELI is the best-evidenced oral language intervention in the world. LanguageScreen standardised on ~350,000 children. The DfE invested \u00a317 million in national NELI rollout based on this evidence."},
            ];
            return (
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
                  {papers.map(paper=>(
                    <div key={paper.id} style={{background:"white",border:`1px solid ${expandedPaper===paper.id?T.navy:T.border}`,borderRadius:14,padding:"18px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"border-color 0.15s,box-shadow 0.15s",display:"flex",flexDirection:"column"}}>
                      {paper.badge?
                        <div style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:paper.badge.includes("Highly")||paper.badge.includes("Essential")?T.goldLight:T.light,color:paper.badge.includes("Highly")||paper.badge.includes("Essential")?T.gold:paper.badge.includes("Relevant")?T.amber:T.muted,marginBottom:10,alignSelf:"flex-start"}}>{paper.badge}</div>
                        :<div style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:T.light,color:T.muted,marginBottom:10,alignSelf:"flex-start"}}>Background Reading</div>
                      }
                      <h4 style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 8px",lineHeight:1.45}}>{paper.title}</h4>
                      <p style={{fontSize:11,color:T.muted,margin:"0 0 4px",fontStyle:"italic",lineHeight:1.4}}>{paper.authors}</p>
                      <p style={{fontSize:11,margin:"0 0 10px"}}><span style={{fontWeight:600,color:T.navy}}>{paper.journal}</span>{paper.year&&<span style={{color:T.muted}}> ({paper.year})</span>}</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                        {paper.tags.map(tag=>{
                          const tc=tagColor(tag);
                          return <span key={tag} style={{padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:600,background:tc.bg,color:tc.c}}>{tag}</span>;
                        })}
                      </div>
                      {expandedPaper===paper.id&&(
                        <div style={{marginBottom:12,padding:"12px 14px",background:T.light,borderRadius:10,borderLeft:`3px solid ${T.navy}`}}>
                          <p style={{fontSize:12,color:T.text,margin:0,lineHeight:1.7}}>{paper.summary}</p>
                        </div>
                      )}
                      <div style={{display:"flex",gap:8,marginTop:"auto"}}>
                        <button onClick={()=>setExpandedPaper(expandedPaper===paper.id?null:paper.id)} style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"white",fontSize:11,fontWeight:600,color:T.navy,cursor:"pointer"}}>
                          {expandedPaper===paper.id?"Hide Summary":"Read Summary"}
                        </button>
                        <a href={paper.url} target="_blank" rel="noreferrer" style={{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:T.navy,fontSize:11,fontWeight:600,color:"white",cursor:"pointer",textDecoration:"none",textAlign:"center",display:"block"}}>
                          View Paper
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* OxEd banner */}
                <div style={{background:T.navy,borderRadius:14,padding:"24px 28px",marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:20}}>
                    <div style={{width:56,height:56,borderRadius:14,background:T.goldLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <GraduationCap size={28} color={T.gold}/>
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:700,color:T.gold,margin:"0 0 6px",fontFamily:"Georgia,serif"}}>Powered by research from the University of Oxford</p>
                      <p style={{fontSize:13,color:"rgba(255,255,255,0.75)",margin:0,lineHeight:1.6}}>OxEd & Assessment is a University of Oxford spinout company. The NELI programme and LanguageScreen were created by Professor Charles Hulme and Professor Margaret Snowling — pioneers in the science of reading and language development. Your school's outcomes are being built on world-leading research.</p>
                    </div>
                    <a href="https://oxedandassessment.com/research/overview/" target="_blank" rel="noreferrer" style={{padding:"12px 24px",borderRadius:10,border:"2px solid rgba(200,150,12,0.5)",background:"transparent",color:T.gold,fontSize:13,fontWeight:700,cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}>
                      Visit OxEd Research Hub →
                    </a>
                  </div>
                </div>

                <div style={{textAlign:"center"}}>
                  <button onClick={()=>alert("Generating PDF... feature coming soon")} style={{padding:"14px 32px",borderRadius:12,border:"none",background:T.navy,color:"white",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(27,48,96,0.3)"}}>
                    <Download size={15} style={{verticalAlign:"middle",marginRight:8}}/>Download Full Research Pack
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

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
function Resources() {
  const [pdfViewer, setPdfViewer] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [toast, setToast] = useState(null);

  // Block print/save/devtools when PDF viewer is open
  useEffect(()=>{
    if (!pdfViewer) return;
    const printStyle = document.createElement("style");
    printStyle.id = "neli-no-print";
    printStyle.textContent = "@media print { body { display: none !important; } }";
    document.head.appendChild(printStyle);

    const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 3000); };
    const onKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") { e.preventDefault(); showToast("Saving is disabled for protected documents."); }
      if (ctrl && e.key === "p") { e.preventDefault(); showToast("Printing is disabled for protected documents."); }
      if ((ctrl && e.shiftKey && e.key === "I") || e.key === "F12") { e.preventDefault(); }
      if (e.key === "PrintScreen") { e.preventDefault(); }
    };
    const onCtx = (e) => e.preventDefault();
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onCtx);
    return () => {
      document.getElementById("neli-no-print")?.remove();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onCtx);
    };
  }, [pdfViewer]);

  const groups = [
    {label:"Record Sheets",color:T.navy,items:[
      {name:"Record Sheet: Assessment for Narrative Speech and Grammar",url:"/neli-resources/NELI_Narrative_Record_Sheet.pdf"},
      {name:"Record Sheet: Attitude and Behaviour",url:"/neli-resources/NELI_Attitude_Behaviour.pdf"},
      {name:"Record Sheet: Group Sessions - Part 1 and Part 2",url:"/neli-resources/NELI_Group_Session_Record_Sheets.pdf"},
      {name:"Record Sheet: Individual Sessions - Part 1 and Part 2",url:"/neli-resources/NELI_Individual_Session_Record_Sheets.pdf"},
      {name:"Example Group Session Record Sheets",url:"/neli-resources/NELI_Example_Group_Records.pdf"},
      {name:"Example Individual Session Record Sheets",url:"/neli-resources/NELI_Example_Individual_Records.pdf"},
      {name:"Part 2 Progress Assessment: Taught Letter Sounds",url:"/neli-resources/NELI_Part2_Letter_Sounds.pdf"},
    ]},
    {label:"Classroom Resources",color:T.gold,items:[
      {name:"Best Listener Badges",url:"/neli-resources/NELI_Best_Listener_Badges.pdf"},
      {name:"Best Listener Stickers",url:"/neli-resources/NELI_Best_Listener_Stickers.pdf"},
      {name:"Best Listener Board",url:"/neli-resources/NELI_Best_Listener_Board.pdf"},
      {name:"NELI Group Session Sticker Chart",url:"/neli-resources/NELI_Group_Session_Sticker_Chart.pdf"},
      {name:"Ted's Listening Rules",url:"/neli-resources/NELI_Teds_Listening_Rules.pdf"},
      {name:"Visual Timetable of Session Elements",url:"/neli-resources/NELI_Visual_Timetable.pdf"},
      {name:"Days of the Week Board",url:"/neli-resources/NELI_Days_Week_Board.pdf"},
      {name:"Days of the Week Labels",url:"/neli-resources/NELI_Days_Week_Labels.pdf"},
      {name:"Story Elements",url:"/neli-resources/NELI_Story_Elements.pdf"},
      {name:"Flash Card Samples",url:"/neli-resources/NELI_Flash_Card_Samples.pdf"},
      {name:"Part 2 Letterboard",url:"/neli-resources/NELI_Part2_Letterboard.pdf"},
      {name:"NELI Envelope Labels",url:"/neli-resources/NELI_Envelope_Labels.pdf"},
    ]},
    {label:"Programme Planning",color:T.green,items:[
      {name:"NELI Timetable",url:"/neli-resources/NELI_Timetable.pdf"},
      {name:"Bridging Lesson Plan",url:"/neli-resources/NELI_Bridging_Lesson_Plan.pdf"},
      {name:"\"Where to Find\" Directory from NELI Courses",url:"/neli-resources/NELI_Where_to_Find_Directory.pdf"},
      {name:"Involving Parents and Carers in NELI",url:"/neli-resources/NELI_Involving_Parents.pdf"},
      {name:"Part 1 Session 22 Sound Effects",url:"/neli-resources/NELI_Part1_Session22_Sounds.pdf"},
    ]},
    {label:"Certificates & Progress",color:T.purple,items:[
      {name:"NELI Certificate of Achievement",url:"/neli-resources/NELI_Certificate.pdf"},
      {name:"See the Narrative Progress NELI Children Make",url:"/neli-resources/NELI_Narrative_Progress.pdf"},
    ]},
  ];

  const links = [
    {title:"OxEd Research Hub",url:"https://oxedandassessment.com/research/overview/",desc:"Full research overview including all RCTs and evaluation reports",icon:BookOpen,color:T.navy},
    {title:"NELI Support FAQ",url:"https://support.oxedandassessment.com/neli-intervention-and-neli-training-faq-whole-class-neli-preschool",desc:"Full FAQ covering intervention, training, Whole Class and Preschool",icon:MessageSquare,color:T.gold},
    {title:"NELI on the EEF",url:"https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/nuffield-early-language-intervention-scale-up-impact-evaluation",desc:"Independent EEF evaluation \u2014 5/5 padlock evidence security rating",icon:Award,color:T.green},
    {title:"Teach NELI",url:"https://www.teachneli.org",desc:"Official NELI programme delivery hub",icon:Target,color:T.amber},
    {title:"FutureLearn NELI Training",url:"https://www.futurelearn.com/partners/university-of-oxford",desc:"Online training platform for NELI staff",icon:GraduationCap,color:T.purple},
  ];

  const totalItems = groups.reduce((s,g)=>s+g.items.length,0);

  return (
    <div>
      <SectionTitle title="NELI Resources" subtitle="Official downloadable resources from OxEd & Assessment"/>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Resource Categories" value={groups.length} sub="Record sheets, classroom, planning, certificates" icon={FolderOpen}/>
        <StatCard label="Total Resources" value={totalItems} sub="All official NELI materials" icon={FileText} color={T.navy}/>
        <StatCard label="Useful Links" value={links.length} sub="OxEd, EEF, FutureLearn" icon={ExternalLink} color={T.blue}/>
        <StatCard label="Programme" value="DfE Funded" sub="2024\u20132029" icon={CheckCircle2} color={T.green}/>
      </div>

      {/* Download heading */}
      <Card style={{marginBottom:20,borderTop:`3px solid ${T.navy}`}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:6}}>
          <div style={{width:44,height:44,borderRadius:12,background:T.goldLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Download size={22} color={T.gold}/>
          </div>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>NELI Resource Kit Downloads</h2>
            <p style={{fontSize:13,color:T.muted,margin:"4px 0 0"}}>Official resources from OxEd & Assessment. Click any item to view the PDF in our secure viewer.</p>
          </div>
        </div>
      </Card>

      {/* Resource groups */}
      {groups.map(group=>(
        <div key={group.label} style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:4,height:20,borderRadius:2,background:group.color}}/>
            <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>{group.label}</h3>
            <span style={{fontSize:12,color:T.muted}}>{group.items.length} resources</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {group.items.map(item=>(
              <div key={item.name} onClick={()=>{setPdfError(false);setPdfViewer({name:item.name,url:item.url});}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
                  background:T.card,border:`1px solid ${T.border}`,borderLeft:`4px solid ${group.color}`,
                  borderRadius:10,cursor:"pointer",
                  transition:"transform 0.12s, box-shadow 0.12s, border-color 0.12s",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";e.currentTarget.style.borderColor=T.gold;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";e.currentTarget.style.borderColor=T.border;}}>
                <div style={{fontSize:22,flexShrink:0}}>📄</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:T.navy,margin:0,lineHeight:1.4}}>{item.name}</p>
                  <p style={{fontSize:10,color:T.muted,margin:"3px 0 0"}}>{group.label}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,fontSize:11,fontWeight:600,color:T.navy}}>
                  <span>🔒</span> View
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Useful Links */}
      <div style={{marginTop:28,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <ExternalLink size={18} color={T.navy}/>
          <h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>Useful Links</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          {links.map(link=>(
            <a key={link.title} href={link.url} target="_blank" rel="noreferrer"
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                padding:"20px 16px",background:T.card,border:`1px solid ${T.border}`,
                borderRadius:12,textDecoration:"none",textAlign:"center",
                transition:"transform 0.12s, box-shadow 0.12s",
                boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";}}>
              <div style={{width:44,height:44,borderRadius:12,background:`${link.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <link.icon size={22} color={link.color}/>
              </div>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 0 4px"}}>{link.title}</p>
                <p style={{fontSize:11,color:T.muted,margin:0,lineHeight:1.4}}>{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div style={{padding:"14px 18px",background:T.goldLight,borderRadius:10,
        fontSize:13,color:T.amber,display:"flex",gap:10,alignItems:"flex-start"}}>
        <Star size={16} style={{flexShrink:0,marginTop:1}}/>
        <span>All resources are provided as part of the DfE-funded NELI programme. Physical resources (Ted puppet, printed handbooks, flashcard sets) should have been included in your delivery pack. Contact <strong>support@oxedandassessment.com</strong> if anything is missing.</span>
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewer&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setPdfViewer(null)}>
          <div style={{width:"90vw",height:"90vh",background:"white",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()} onKeyDown={e=>e.key==="Escape"&&setPdfViewer(null)}>
            {/* Header */}
            <div style={{background:T.navy,padding:"12px 20px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:14,fontWeight:700,color:"white",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pdfViewer.name}</p>
              </div>
              <div style={{padding:"4px 12px",background:"rgba(200,150,12,0.2)",borderRadius:20,border:"1px solid rgba(200,150,12,0.4)",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:600,color:T.gold}}>This document is for viewing only</span>
              </div>
              <button onClick={()=>setPdfViewer(null)} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,0.1)",color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <X size={18}/>
              </button>
            </div>
            {/* Viewer */}
            <div style={{flex:1,position:"relative",overflow:"hidden"}}>
              {pdfError?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:40,textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:16}}>📄</div>
                  <h3 style={{fontSize:18,fontWeight:700,color:T.navy,margin:"0 0 8px",fontFamily:"Georgia,serif"}}>This file hasn't been uploaded yet</h3>
                  <p style={{fontSize:13,color:T.muted,margin:"0 0 4px",lineHeight:1.6}}>Copy the PDF to:</p>
                  <code style={{display:"inline-block",padding:"8px 16px",background:T.light,borderRadius:8,fontSize:12,color:T.navy,fontWeight:600,marginBottom:16,border:`1px solid ${T.border}`}}>public\neli-resources\</code>
                  <p style={{fontSize:12,color:T.muted,margin:0}}>Then refresh the page to view it here.</p>
                </div>
              ):(
                <iframe
                  src={`${pdfViewer.url}#toolbar=0&navpanes=0&scrollbar=1`}
                  sandbox="allow-scripts allow-same-origin"
                  style={{width:"100%",height:"100%",border:"none"}}
                  title={pdfViewer.name}
                  onError={()=>setPdfError(true)}
                  onLoad={e=>{try{const d=e.target.contentDocument;if(d&&d.title&&d.title.includes("404"))setPdfError(true);}catch{}}}
                />
              )}
              {/* Click-block overlay */}
              <div style={{position:"absolute",inset:0,zIndex:1,background:"transparent"}} onContextMenu={e=>e.preventDefault()}/>
              {/* Watermark */}
              <div style={{position:"absolute",inset:0,zIndex:2,pointerEvents:"none",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{transform:"rotate(-30deg)",whiteSpace:"nowrap",display:"flex",flexDirection:"column",gap:80,opacity:0.07}}>
                  {Array.from({length:8}).map((_,i)=>(
                    <div key={i} style={{fontSize:18,fontWeight:700,color:T.navy,letterSpacing:2,display:"flex",gap:120}}>
                      {Array.from({length:4}).map((_,j)=>(
                        <span key={j}>Parkside Primary — NELI Portal — {new Date().toLocaleDateString("en-GB")}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:10000,background:T.navy,color:"white",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:8,maxWidth:400}}>
          <AlertCircle size={16} color={T.gold}/>
          {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEL TED TRAINING
// ═══════════════════════════════════════════════════════════
function TELTedTraining({onBack}) {
  const [course, setCourse] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("neli-telted")||"null"); } catch { return null; }
  });
  const init = ()=>({currentWeek:1,currentStep:1,completed:[],quizScores:{},quizAnswers:{},discussions:{},certificateEarned:false});
  if (!course) { const c=init(); setCourse(c); localStorage.setItem("neli-telted",JSON.stringify(c)); }
  const save=(upd)=>{const n={...course,...upd};setCourse(n);localStorage.setItem("neli-telted",JSON.stringify(n));};
  const isComplete=(w,s)=>course?.completed?.includes(`${w}-${s}`);
  const markComplete=()=>{
    const key=`${course.currentWeek}-${course.currentStep}`;
    if(course.completed.includes(key)) return;
    const completed=[...course.completed,key];
    const ws=STEPS[course.currentWeek-1];
    let nw=course.currentWeek,ns=course.currentStep;
    if(ns<ws.length){ns++;}else if(nw<3){nw++;ns=1;}
    save({completed,currentWeek:nw,currentStep:ns});
  };
  const goTo=(w,s)=>{
    const prev=`${w}-${s-1}`;
    if(s>1&&!course.completed.includes(prev)) return;
    if(w>1&&s===1){const prevW=STEPS[w-2];if(!course.completed.includes(`${w-1}-${prevW.length}`)) return;}
    save({currentWeek:w,currentStep:s});
  };
  const totalSteps=STEPS.reduce((s,w)=>s+w.length,0);
  const pctComplete=course?Math.round(course.completed.length/totalSteps*100):0;

  const WEEKS=["Understanding Children's Language Development","Using LanguageScreen and Identifying Pupils","The NELI Programme"];

  // Quiz component
  const Quiz=({questions,quizId})=>{
    const [qi,setQi]=useState(0);const [answers,setAnswers]=useState([]);const [chosen,setChosen]=useState(null);const [done,setDone]=useState(false);
    const q=questions[qi];
    const onAnswer=(idx)=>{
      if(chosen!==null)return;
      setChosen(idx);
      const correct=idx===q.correct;
      const newA=[...answers,{chosen:idx,correct}];
      setAnswers(newA);
      setTimeout(()=>{
        if(qi+1<questions.length){setQi(qi+1);setChosen(null);}
        else{setDone(true);save({quizScores:{...course.quizScores,[quizId]:newA.filter(a=>a.correct).length}});}
      },1500);
    };
    if(done){
      const score=answers.filter(a=>a.correct).length;const total=questions.length;
      const passed=score>=Math.ceil(total*0.8);
      return(
        <div style={{textAlign:"center",padding:"30px 0"}}>
          <div style={{fontSize:48,marginBottom:12}}>{passed?"🎉":"📝"}</div>
          <h3 style={{fontSize:20,fontWeight:800,color:T.navy,margin:"0 0 8px",fontFamily:"Georgia,serif"}}>You scored {score}/{total}{passed?" — Excellent!":""}</h3>
          <p style={{fontSize:14,color:passed?T.green:T.amber,fontWeight:600,margin:"0 0 20px"}}>{passed?"Great work! You can now mark this step as complete.":"Review the course material and try again."}</p>
          {!passed&&<button onClick={()=>{setQi(0);setAnswers([]);setChosen(null);setDone(false);}} style={{padding:"10px 24px",borderRadius:10,border:`1px solid ${T.border}`,background:"white",fontSize:13,fontWeight:600,color:T.navy,cursor:"pointer",marginRight:10}}>Retry Quiz</button>}
          {passed&&<button onClick={markComplete} style={{padding:"12px 32px",borderRadius:10,border:"none",background:T.navy,fontSize:14,fontWeight:700,color:"white",cursor:"pointer"}}>Mark Complete & Continue</button>}
        </div>
      );
    }
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <Badge label={`Question ${qi+1} of ${questions.length}`} color={T.purple} bg={T.purpleBg}/>
          <span style={{fontSize:12,color:T.muted}}>{answers.filter(a=>a.correct).length} correct so far</span>
        </div>
        <h4 style={{fontSize:16,fontWeight:700,color:T.text,margin:"0 0 16px",lineHeight:1.5}}>{q.q}</h4>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.options.map((opt,i)=>{
            const isChosen=chosen===i;const isCorrect=i===q.correct;const revealed=chosen!==null;
            let bg="white",border=`1px solid ${T.border}`,color=T.text;
            if(revealed&&isChosen&&isCorrect){bg=T.greenBg;border=`2px solid ${T.green}`;color=T.green;}
            if(revealed&&isChosen&&!isCorrect){bg=T.redBg;border=`2px solid ${T.red}`;color=T.red;}
            if(revealed&&!isChosen&&isCorrect){bg=T.greenBg;border=`2px dashed ${T.green}`;color=T.green;}
            return(
              <button key={i} onClick={()=>onAnswer(i)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:bg,border,borderRadius:10,cursor:revealed?"default":"pointer",textAlign:"left",fontSize:14,color,fontWeight:isChosen?700:400,transition:"all 0.15s"}}>
                <span style={{width:28,height:28,borderRadius:"50%",background:revealed&&isCorrect?T.green:revealed&&isChosen?T.red:T.light,color:revealed?(isCorrect||isChosen?"white":T.muted):T.muted,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0}}>
                  {revealed&&isCorrect?"✓":revealed&&isChosen&&!isCorrect?"✗":String.fromCharCode(65+i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {chosen!==null&&(
          <div style={{marginTop:12,padding:"12px 16px",background:chosen===q.correct?T.greenBg:T.redBg,borderRadius:10,fontSize:13,color:chosen===q.correct?T.green:T.red,fontWeight:500,lineHeight:1.5}}>
            {chosen===q.correct?"Correct! "+q.explanation:"Not quite. The correct answer is "+q.options[q.correct]+". "+q.explanation}
          </div>
        )}
      </div>
    );
  };

  if(!course) return null;
  const w=course.currentWeek;const s=course.currentStep;
  const stepData=STEPS[w-1]?.[s-1];

  return(
    <div style={{display:"flex",height:"calc(100vh - 56px)",margin:"-24px",fontFamily:"system-ui,sans-serif"}}>
      {/* Left sidebar nav */}
      <div style={{width:280,background:"white",borderRight:`1px solid ${T.border}`,overflowY:"auto",flexShrink:0}}>
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${T.border}`}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",border:`1px solid ${T.border}`,borderRadius:8,background:"white",fontSize:11,fontWeight:600,color:T.muted,cursor:"pointer",marginBottom:10}}>
            <ChevronLeft size={13}/> Back to Training
          </button>
          <h3 style={{fontSize:14,fontWeight:800,color:T.navy,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>NELI Language Fundamentals</h3>
          <p style={{fontSize:11,color:T.muted,margin:0}}>Course 1 of 3 · CPD Certified</p>
        </div>
        {/* Progress */}
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:T.muted}}>{course.completed.length}/{totalSteps} steps</span>
            <span style={{fontSize:11,fontWeight:700,color:T.navy}}>{pctComplete}%</span>
          </div>
          <div style={{background:T.border,borderRadius:20,height:6,overflow:"hidden"}}>
            <div style={{width:`${pctComplete}%`,height:"100%",background:T.gold,borderRadius:20,transition:"width 0.3s"}}/>
          </div>
        </div>
        {/* Week list */}
        {WEEKS.map((weekTitle,wi)=>(
          <div key={wi}>
            <div style={{padding:"10px 18px",background:wi+1===w?T.goldLight:"transparent",borderBottom:`1px solid ${T.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:T.gold,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"0.04em"}}>Week {wi+1}</p>
              <p style={{fontSize:12,fontWeight:600,color:T.text,margin:0}}>{weekTitle}</p>
            </div>
            {STEPS[wi].map((step,si)=>{
              const complete=isComplete(wi+1,si+1);
              const current=wi+1===w&&si+1===s;
              const locked=si>0&&!isComplete(wi+1,si)?true:wi>0&&si===0&&!isComplete(wi,STEPS[wi-1].length);
              return(
                <div key={si} onClick={()=>!locked&&goTo(wi+1,si+1)} style={{
                  padding:"8px 18px 8px 28px",display:"flex",alignItems:"center",gap:10,cursor:locked?"not-allowed":"pointer",
                  background:current?"#F0F7FF":"transparent",borderLeft:current?`3px solid ${T.navy}`:"3px solid transparent",
                  opacity:locked?0.4:1,transition:"all 0.1s"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                    background:complete?T.green:current?T.navy:T.border,color:"white",fontSize:10,fontWeight:700}}>
                    {complete?"✓":si+1}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:11,fontWeight:current?700:500,color:current?T.navy:T.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{step.title}</p>
                    <Badge label={step.type} color={step.type==="Quiz"?T.purple:step.type==="Article"?T.blue:step.type==="Video"?T.red:T.green} bg={step.type==="Quiz"?T.purpleBg:step.type==="Article"?T.blueBg:step.type==="Video"?T.redBg:T.greenBg}/>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",background:T.bg}}>
        {/* Top bar */}
        <div style={{background:T.navy,padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:13,color:"white",fontWeight:600}}>Week {w} of 3</span>
            <span style={{color:"rgba(255,255,255,0.3)"}}>|</span>
            <span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Step {s} of {STEPS[w-1]?.length||0}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:T.gold,fontWeight:600}}>{pctComplete}% complete</span>
            <div style={{width:80,height:4,background:"rgba(255,255,255,0.15)",borderRadius:20,overflow:"hidden"}}>
              <div style={{width:`${pctComplete}%`,height:"100%",background:T.gold,borderRadius:20}}/>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{maxWidth:760,margin:"0 auto",padding:"28px 24px 48px"}}>
          {stepData&&(
            <div key={`${w}-${s}`} className="neli-fadeIn">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                <Badge label={`Week ${w}`} color={T.gold} bg={T.goldLight}/>
                <Badge label={stepData.type} color={stepData.type==="Quiz"?T.purple:stepData.type==="Article"?T.blue:stepData.type==="Video"?T.red:T.green} bg={stepData.type==="Quiz"?T.purpleBg:stepData.type==="Article"?T.blueBg:stepData.type==="Video"?T.redBg:T.greenBg}/>
                {isComplete(w,s)&&<Badge label="Completed" color={T.green} bg={T.greenBg}/>}
              </div>
              <h1 style={{fontSize:24,fontWeight:800,color:T.navy,margin:"0 0 20px",fontFamily:"Georgia,serif",lineHeight:1.3}}>{stepData.title}</h1>

              {/* Render content based on step */}
              {stepData.content&&(
                <div style={{fontSize:14,color:T.text,lineHeight:1.8,marginBottom:24}}>
                  {stepData.content.map((block,i)=>{
                    if(block.type==="text") return <p key={i} style={{margin:"0 0 16px"}}>{block.value}</p>;
                    if(block.type==="heading") return <h3 key={i} style={{fontSize:16,fontWeight:700,color:T.navy,margin:"20px 0 10px",fontFamily:"Georgia,serif"}}>{block.value}</h3>;
                    if(block.type==="list") return <ul key={i} style={{margin:"0 0 16px",paddingLeft:20}}>{block.items.map((item,j)=><li key={j} style={{marginBottom:6}}>{item}</li>)}</ul>;
                    if(block.type==="video") return(
                      <div key={i} style={{background:T.navy,borderRadius:16,padding:"40px 24px",textAlign:"center",marginBottom:20}}>
                        <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"white",marginBottom:12}}>▶</div>
                        <p style={{color:"rgba(255,255,255,0.8)",fontSize:13,margin:0}}>{block.caption}</p>
                      </div>
                    );
                    if(block.type==="discussion") return(
                      <div key={i} style={{background:T.blueBg,borderRadius:12,padding:"16px 20px",marginBottom:20,border:`1px solid ${T.blue}20`}}>
                        <p style={{fontSize:13,fontWeight:600,color:T.blue,margin:"0 0 10px"}}>{block.prompt}</p>
                        <textarea value={course.discussions?.[`${w}-${s}`]||""} onChange={e=>save({discussions:{...course.discussions,[`${w}-${s}`]:e.target.value}})}
                          placeholder="Share your thoughts..." style={{width:"100%",minHeight:80,padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"system-ui",resize:"vertical",boxSizing:"border-box"}}/>
                        <button style={{marginTop:8,padding:"8px 16px",borderRadius:8,border:"none",background:T.navy,color:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}>Post Response</button>
                      </div>
                    );
                    if(block.type==="diagram") return(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                        {block.items.map((d,j)=>(
                          <div key={j} style={{background:"white",borderRadius:12,padding:"16px",border:`2px solid ${d.color}`,textAlign:"center",cursor:"pointer",transition:"transform 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                            <div style={{width:40,height:40,borderRadius:"50%",background:d.color,color:"white",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:8}}>{d.icon}</div>
                            <p style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}>{d.name}</p>
                            <p style={{fontSize:12,color:T.muted,margin:0,lineHeight:1.4}}>{d.desc}</p>
                          </div>
                        ))}
                      </div>
                    );
                    if(block.type==="table") return(
                      <div key={i} style={{overflowX:"auto",marginBottom:20}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                          <thead><tr>{block.headers.map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",background:T.navy,color:"white",fontWeight:600,fontSize:12}}>{h}</th>)}</tr></thead>
                          <tbody>{block.rows.map((row,ri)=><tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>{row.map((cell,ci)=><td key={ci} style={{padding:"10px 14px",color:T.text}}>{cell}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                    );
                    if(block.type==="slider") return(
                      <div key={i} style={{background:T.light,borderRadius:12,padding:"20px",marginBottom:20}}>
                        <p style={{fontSize:13,fontWeight:600,color:T.text,margin:"0 0 12px"}}>Interactive Score Explorer</p>
                        <input type="range" min="50" max="130" defaultValue="85" style={{width:"100%"}}
                          onChange={e=>{const v=Number(e.target.value);const el=e.target.nextElementSibling;if(el)el.textContent=v>=115?"Well above average":v>=100?"Above average":v>=85?"Average (typical range)":v>=75?"Below average — may benefit from Whole Class NELI":"Well below average — strong candidate for NELI intervention";const el2=el?.nextElementSibling;if(el2)el2.textContent="Score: "+v;}}/>
                        <p style={{fontSize:14,fontWeight:600,color:T.navy,margin:"8px 0 0"}}>Average (typical range)</p>
                        <p style={{fontSize:12,color:T.muted,margin:"4px 0 0"}}>Score: 85</p>
                      </div>
                    );
                    if(block.type==="tips") return(
                      <div key={i} style={{background:T.amberBg,borderRadius:12,padding:"16px 20px",marginBottom:20,border:`1px solid ${T.amber}20`}}>
                        <p style={{fontSize:13,fontWeight:700,color:T.amber,margin:"0 0 8px"}}>{block.title}</p>
                        <ul style={{margin:0,paddingLeft:20}}>{block.items.map((t,j)=><li key={j} style={{fontSize:13,color:T.text,marginBottom:4,lineHeight:1.5}}>{t}</li>)}</ul>
                      </div>
                    );
                    if(block.type==="steps") return(
                      <div key={i} style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                        {block.items.map((st,j)=>(
                          <div key={j} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 16px",background:"white",borderRadius:10,border:`1px solid ${T.border}`}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:T.navy,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{j+1}</div>
                            <div><span style={{fontSize:18,marginRight:8}}>{st.icon}</span><span style={{fontSize:14,color:T.text}}>{st.text}</span></div>
                          </div>
                        ))}
                      </div>
                    );
                    return null;
                  })}
                </div>
              )}

              {/* Quiz */}
              {stepData.quiz&&<Quiz questions={stepData.quiz} quizId={`${w}-${s}`}/>}

              {/* Certificate */}
              {stepData.certificate&&(
                <div>
                  <div style={{background:"linear-gradient(135deg,#FEF3C7 0%,white 50%,#FEF3C7 100%)",border:`3px solid ${T.gold}`,borderRadius:20,padding:"40px",textAlign:"center",marginBottom:24,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:10,left:10,right:10,bottom:10,border:`1px solid ${T.gold}40`,borderRadius:14,pointerEvents:"none"}}/>
                    <p style={{fontSize:12,fontWeight:700,color:T.gold,textTransform:"uppercase",letterSpacing:3,margin:"0 0 6px"}}>Certificate of Achievement</p>
                    <h2 style={{fontSize:22,fontWeight:800,color:T.navy,margin:"0 0 6px",fontFamily:"Georgia,serif"}}>NELI Language Fundamentals — Course 1</h2>
                    <p style={{fontSize:13,color:T.muted,margin:"0 0 20px",fontStyle:"italic"}}>This certifies that</p>
                    <p style={{fontSize:28,fontWeight:800,color:T.navy,margin:"0 0 6px",fontFamily:"Georgia,serif"}}>Sarah Mitchell</p>
                    <p style={{fontSize:14,color:T.text,margin:"0 0 20px"}}>has successfully completed the NELI Language Fundamentals training</p>
                    <p style={{fontSize:12,color:T.muted,margin:"0 0 16px"}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>
                    <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:16}}>
                      <div style={{textAlign:"center"}}><div style={{borderBottom:`1px solid ${T.border}`,width:140,marginBottom:4}}/><p style={{fontSize:11,color:T.muted,margin:0}}>Prof. Charles Hulme</p></div>
                      <div style={{textAlign:"center"}}><div style={{borderBottom:`1px solid ${T.border}`,width:140,marginBottom:4}}/><p style={{fontSize:11,color:T.muted,margin:0}}>Dr Gillian West</p></div>
                    </div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",background:T.goldLight,borderRadius:20,border:`1px solid ${T.gold}40`}}>
                      <Award size={14} color={T.gold}/><span style={{fontSize:11,fontWeight:700,color:T.gold}}>CPD Certified</span>
                    </div>
                    <p style={{fontSize:11,color:T.muted,margin:"12px 0 0"}}>OxEd & Assessment · University of Oxford</p>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <button onClick={()=>window.print()} style={{padding:"10px 24px",borderRadius:10,border:`1px solid ${T.border}`,background:"white",fontSize:13,fontWeight:600,color:T.navy,cursor:"pointer"}}>Print Certificate</button>
                    <button onClick={()=>alert("PDF download coming soon")} style={{padding:"10px 24px",borderRadius:10,border:`1px solid ${T.border}`,background:"white",fontSize:13,fontWeight:600,color:T.navy,cursor:"pointer"}}>Download as PDF</button>
                    <button onClick={onBack} style={{padding:"10px 24px",borderRadius:10,border:"none",background:T.navy,fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}}>Return to Dashboard</button>
                  </div>
                </div>
              )}

              {/* Mark Complete button */}
              {!stepData.quiz&&!stepData.certificate&&!isComplete(w,s)&&(
                <button onClick={markComplete} style={{width:"100%",padding:"16px",borderRadius:12,border:"none",background:T.navy,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16,boxShadow:"0 6px 20px rgba(27,48,96,0.3)"}}>
                  Mark Complete & Continue
                </button>
              )}
              {isComplete(w,s)&&!stepData.certificate&&(
                <div style={{textAlign:"center",padding:"16px",color:T.green,fontSize:14,fontWeight:600}}>
                  <CheckCircle2 size={18} style={{verticalAlign:"middle",marginRight:6}}/> Step completed
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STEPS=[
  // Week 1
  [
    {title:"Welcome to the Course",type:"Article",content:[
      {type:"text",value:"Welcome to Course 1 of the NELI training programme, developed by Professor Charles Hulme and Dr Gillian West at the University of Oxford."},
      {type:"text",value:"This course will take approximately 4\u20135 hours to complete across three weeks. You can work through it at your own pace \u2014 it will always pick up where you left off."},
      {type:"heading",value:"By the end of this course you will:"},
      {type:"list",items:["Understand why oral language skills are critical for children's development","Know how to identify children who need language support using LanguageScreen","Be ready to support the NELI programme in your school"]},
      {type:"text",value:"This course has been certified by the CPD Certification Service."},
      {type:"video",caption:"Dr Gillian West, NELI Developer, introduces Course 1 (3 mins)"},
    ]},
    {title:"Why Oral Language Matters",type:"Article",content:[
      {type:"heading",value:"Why Oral Language Skills Are So Important"},
      {type:"text",value:"Oral language skills form the foundation of all learning. Children who start school with language weaknesses are at significant risk of:"},
      {type:"list",items:["Reading and writing difficulties","Maths underperformance","Social and emotional difficulties","Lower educational attainment overall"]},
      {type:"text",value:"Research from the University of Oxford shows that 1 in 5 children starts school with language skills below age-expected levels. For children from disadvantaged backgrounds, this rises to 1 in 3."},
      {type:"text",value:"The good news? Language skills are highly responsive to targeted intervention. The NELI programme has been shown in four randomised controlled trials to produce significant improvements \u2014 with children making 3\u20135 months additional progress in just 20 weeks."},
      {type:"discussion",prompt:"\uD83D\uDCAC Discussion: Think about your Reception class. How many children do you think might have language weaknesses? Share your thoughts with your fellow practitioners."},
    ]},
    {title:"The Components of Oral Language",type:"Article",content:[
      {type:"heading",value:"What Is Language?"},
      {type:"text",value:"Language is made up of several interconnected components. LanguageScreen assesses four key areas:"},
      {type:"diagram",items:[
        {name:"Receptive Vocabulary",desc:"Understanding the meaning of words. Children hear a word and identify the correct picture.",icon:"\uD83D\uDD35",color:T.blue},
        {name:"Expressive Vocabulary",desc:"Using words to express ideas. Children name objects or describe pictures.",icon:"\uD83D\uDFE1",color:T.gold},
        {name:"Grammar",desc:"Understanding and using sentence structure. Children repeat sentences of increasing complexity.",icon:"\uD83D\uDFE2",color:T.green},
        {name:"Listening Comprehension",desc:"Understanding spoken language in context. Children listen to a passage and answer questions.",icon:"\uD83D\uDFE3",color:T.purple},
      ]},
      {type:"text",value:"Children who score below 85 on LanguageScreen are identified as potentially needing additional language support."},
    ]},
    {title:"Quiz: Week 1 Check",type:"Quiz",quiz:[
      {q:"What proportion of children start school with language skills below age-expected levels?",options:["1 in 10","1 in 5","1 in 3","1 in 2"],correct:1,explanation:"Research shows 1 in 5 children (20%) start school with below-expected language skills."},
      {q:"Which of the following is NOT assessed by LanguageScreen?",options:["Receptive vocabulary","Phonological awareness","Grammar","Listening comprehension"],correct:1,explanation:"LanguageScreen assesses receptive vocab, expressive vocab, grammar, and listening. Phonological awareness is covered in NELI Part 2."},
      {q:"How many weeks does the NELI programme last?",options:["10 weeks","15 weeks","20 weeks","30 weeks"],correct:2,explanation:"NELI is a 20-week programme split into Part 1 (weeks 1\u201310) and Part 2 (weeks 11\u201320)."},
      {q:"What LanguageScreen score indicates a child may need additional support?",options:["Below 100","Below 90","Below 85","Below 80"],correct:2,explanation:"A standard score below 85 (1 SD below the mean) indicates a child who may benefit from additional language support."},
    ]},
  ],
  // Week 2
  [
    {title:"What is LanguageScreen?",type:"Article",content:[
      {type:"heading",value:"Introducing LanguageScreen"},
      {type:"text",value:"LanguageScreen is an app-based language assessment developed by OxEd & Assessment, a University of Oxford spinout company. It was standardised on approximately 350,000 children aged 3;6 to 8;11."},
      {type:"heading",value:"Key features:"},
      {type:"list",items:["Takes 10\u201312 minutes per child","Administered by any school adult \u2014 no specialist training required","Automatically scored \u2014 no manual marking","Four subtests: Receptive Vocab, Expressive Vocab, Grammar, Listening","Provides a standardised score (average = 100, typical range 85\u2013115)","Scores below 85 indicate children who may benefit from NELI"]},
      {type:"text",value:"LanguageScreen has excellent reliability (Cronbach\u2019s \u03b1 = .92) and has been validated against established clinical language assessments."},
      {type:"video",caption:"Demonstration of LanguageScreen in use (5 mins)"},
    ]},
    {title:"Administering LanguageScreen",type:"Article",content:[
      {type:"heading",value:"Step by Step"},
      {type:"steps",items:[
        {icon:"\uD83D\uDCF1",text:"Open the LanguageScreen app on a tablet or computer"},
        {icon:"\uD83D\uDC64",text:"Log in with your school credentials"},
        {icon:"\uD83D\uDCCB",text:"Select the child from your class list"},
        {icon:"\uD83C\uDFAF",text:"Ensure the child can see the screen clearly"},
        {icon:"\uD83D\uDDE3\uFE0F",text:"Read the instructions aloud as prompted by the app"},
        {icon:"\u2705",text:"The app scores automatically \u2014 no action needed"},
        {icon:"\uD83D\uDCCA",text:"Review results in the portal immediately after"},
      ]},
      {type:"tips",title:"\uD83D\uDCA1 Tips for a successful assessment:",items:["Find a quiet space away from distractions","Sit beside the child, not opposite","Reassure the child \u2014 'there are no wrong answers'","Allow plenty of time \u2014 don't rush","Assess each child individually, not in groups"]},
    ]},
    {title:"Understanding Scores",type:"Article",content:[
      {type:"heading",value:"Interpreting LanguageScreen Scores"},
      {type:"table",headers:["Score","Band","Meaning"],rows:[
        ["115+","Well above average","Exceeds age expectations"],
        ["100\u2013114","Above average","Meeting expectations comfortably"],
        ["85\u201399","Average","Within typical range"],
        ["75\u201384","Below average","May benefit from Whole Class NELI"],
        ["Below 75","Well below average","Strong candidate for NELI intervention"],
      ]},
      {type:"slider"},
    ]},
    {title:"Quiz: Week 2 Check",type:"Quiz",quiz:[
      {q:"How long does a LanguageScreen assessment take per child?",options:["5 minutes","10\u201312 minutes","20 minutes","30 minutes"],correct:1,explanation:"LanguageScreen takes approximately 10\u201312 minutes per child."},
      {q:"Who can administer LanguageScreen?",options:["Only qualified SaLTs","Only class teachers","Any trained school adult","Only NELI leads"],correct:2,explanation:"Any school adult can administer LanguageScreen \u2014 no specialist training is required."},
      {q:"A child scores 78 on LanguageScreen. What does this indicate?",options:["Well above average","Average","Below average \u2014 may benefit from Whole Class NELI","Well below average \u2014 strong candidate for NELI"],correct:2,explanation:"A score of 78 falls in the 75\u201384 band: below average, may benefit from Whole Class NELI."},
      {q:"Approximately how many children was LanguageScreen standardised on?",options:["10,000","50,000","350,000","1,000,000"],correct:2,explanation:"LanguageScreen was standardised on approximately 350,000 children."},
    ]},
  ],
  // Week 3
  [
    {title:"The NELI Programme",type:"Article",content:[
      {type:"heading",value:"NELI: What, Who and How"},
      {type:"text",value:"NELI is a 20-week oral language intervention programme delivered by trained teaching assistants to small groups of Reception children who have been identified as having language weaknesses."},
      {type:"heading",value:"Programme structure:"},
      {type:"list",items:["Part 1 (Weeks 1\u201310): Group and individual sessions, vocabulary and narrative","Part 2 (Weeks 11\u201320): Adds letter sounds and phonological awareness"]},
      {type:"heading",value:"Each week includes:"},
      {type:"list",items:["3 \u00d7 Group Sessions (20 minutes each) \u2014 up to 6 children","1\u20132 \u00d7 Individual Sessions (10 minutes each) \u2014 one child at a time"]},
      {type:"heading",value:"Key activities each week:"},
      {type:"list",items:["\uD83D\uDCDA Special Words \u2014 3\u20134 new vocabulary words introduced and practised","\uD83E\uDD81 Story activities \u2014 narrative skills through picture books and story cards","\uD83D\uDC42 Listening activities \u2014 attention and listening exercises","\uD83D\uDD24 Part 2: Letter sounds and phonological awareness activities"]},
      {type:"video",caption:"Overview of a NELI Group Session (4 mins)"},
    ]},
    {title:"Supporting Children in NELI",type:"Article",content:[
      {type:"heading",value:"How to Support NELI Children Effectively"},
      {type:"text",value:"As a NELI practitioner, your relationship with the children is key. Here are the principles that underpin effective NELI delivery:"},
      {type:"list",items:[
        "\uD83C\uDF1F Positive reinforcement \u2014 Use the Best Listener Board and stickers. Children thrive on encouragement.",
        "\uD83D\uDDE3\uFE0F Modelling language \u2014 Always model Special Words in full sentences. Expand: 'dog run' \u2192 'The dog is running fast!'",
        "\uD83D\uDCD6 Repeated exposure \u2014 Words are revisited across sessions. Children need 10\u201315 exposures to acquire a new word.",
        "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 Involving parents \u2014 Share Special Words weekly so children hear them at home too.",
        "\u23F1\uFE0F Consistency \u2014 Deliver sessions consistently \u2014 same time, same place each week.",
      ]},
    ]},
    {title:"Final Assessment",type:"Quiz",quiz:[
      {q:"How many weeks does the NELI programme run?",options:["10 weeks","15 weeks","20 weeks","30 weeks"],correct:2,explanation:"NELI runs for 20 weeks."},
      {q:"How many children can be in a NELI group session?",options:["2","Up to 6","Up to 10","The whole class"],correct:1,explanation:"NELI group sessions have up to 6 children."},
      {q:"When does Part 2 of NELI begin?",options:["Week 5","Week 8","Week 11","Week 15"],correct:2,explanation:"Part 2 begins at Week 11."},
      {q:"What are 'Special Words' in NELI?",options:["Sight words for reading","New vocabulary words introduced each week","Phonics sounds","Spelling words"],correct:1,explanation:"Special Words are 3\u20134 new vocabulary words introduced and practised each week."},
      {q:"Which of the following is NOT a core activity in NELI?",options:["Vocabulary activities","Narrative/story activities","Silent reading","Listening activities"],correct:2,explanation:"Silent reading is not part of NELI. The programme focuses on oral language: vocabulary, narrative, and listening."},
    ]},
    {title:"Certificate of Completion",type:"Article",certificate:true,content:[]},
  ],
];

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
const NAV = [
  {id:"dashboard",     Icon:LayoutDashboard, label:"Dashboard"},
  {id:"languagescreen",Icon:Search,          label:"LanguageScreen"},
  {id:"intervention",  Icon:ClipboardList,   label:"NELI Tracker"},
  {id:"classes",       Icon:Users,           label:"Classes"},
  {id:"insights",      Icon:FileText,        label:"Insights"},
  {id:"trust",         Icon:Building2,       label:"Trust View"},
  {id:"training",      Icon:GraduationCap,   label:"Training"},
  {id:"telted",        Icon:BookOpen,        label:"TEL TED Training"},
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
  const [showWelcome, setShowWelcome] = useState(()=>!sessionStorage.getItem("neli-welcomed"));

  useEffect(()=>{
    if (showWelcome) {
      const t = setTimeout(()=>{ setShowWelcome(false); sessionStorage.setItem("neli-welcomed","1"); }, 6000);
      return ()=>clearTimeout(t);
    }
  }, [showWelcome]);

  const handleNav = (id) => {
    setPage(id); setSelectedClass(null); setSelectedPupil(null); setNotifOpen(false);
  };

  const handleSelectPupil = (p) => { setSelectedPupil(p); setPage("pupil"); };
  const handleSelectClass = (c) => { setSelectedClass(c); setPage("classdetail"); };

  const renderPage = () => {
    if(page==="pupil"&&selectedPupil) return <PupilDetail pupil={selectedPupil} onBack={()=>{setPage(selectedClass?"classdetail":"languagescreen");setSelectedPupil(null);}}/>;
    if(page==="classdetail"&&selectedClass) return <ClassDetail cls={selectedClass} onBack={()=>{setPage("classes");setSelectedClass(null);}} onSelectPupil={handleSelectPupil}/>;
    if(page==="classes") return <ClassesPage onSelectClass={handleSelectClass} onSelectPupil={handleSelectPupil}/>;
    if(page==="languagescreen") return <LanguageScreenPage onSelectPupil={handleSelectPupil}/>;
    if(page==="trainingcourses") return <TrainingCourses onBack={()=>setPage("training")} staffName="Sarah Mitchell"/>;
    const pages = {
      dashboard:<Dashboard onSelectPupil={handleSelectPupil}/>, intervention:<NELITracker/>,
      insights:<Insights/>, trust:<TrustView/>,
      training:<Training onStartTraining={()=>setPage("trainingcourses")}/>,
      resources:<Resources/>,
      telted:<TELTedTraining onBack={()=>setPage("training")}/>,
    };
    return pages[page]||<Dashboard/>;
  };

  const lc2 = l => l==="red"?T.red:l==="amber"?T.amber:T.green;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"system-ui,sans-serif",
      background:T.bg,overflow:"hidden"}}>

      {/* Welcome Overlay */}
      {showWelcome&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"linear-gradient(135deg, #0C1A2E 0%, #1B3060 50%, #0C1A2E 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
          <div style={{display:"flex",alignItems:"center",gap:40,maxWidth:700}}>
            <div className="neli-owlSlideIn">
              <svg width="140" height="140" viewBox="0 0 200 200">
                <ellipse cx="100" cy="130" rx="60" ry="50" fill="#8B5E3C" stroke="#4A3220" strokeWidth="2.5"/>
                <ellipse cx="100" cy="135" rx="45" ry="36" fill="#D4A574"/>
                <circle cx="100" cy="75" r="44" fill="#A0714F" stroke="#4A3220" strokeWidth="2.5"/>
                <ellipse cx="100" cy="80" rx="35" ry="32" fill="#F5DEB3"/>
                <circle cx="84" cy="72" r="14" fill="white" stroke="#4A3220" strokeWidth="1.5"/>
                <circle cx="116" cy="72" r="14" fill="white" stroke="#4A3220" strokeWidth="1.5"/>
                <circle cx="86" cy="72" r="7" fill="#2D1B0E"/><circle cx="118" cy="72" r="7" fill="#2D1B0E"/>
                <circle cx="88" cy="69" r="2.5" fill="white"/><circle cx="120" cy="69" r="2.5" fill="white"/>
                <path d="M93 86 L100 96 L107 86 Z" fill="#E8960C" stroke="#B87608" strokeWidth="1"/>
                <rect x="70" y="30" width="60" height="7" rx="2" fill="#1B3060"/>
                <polygon points="100,20 128,33 100,38 72,33" fill="#1B3060"/>
                <line x1="128" y1="33" x2="135" y2="46" stroke="#C8960C" strokeWidth="2"/>
                <circle cx="135" cy="48" r="3.5" fill="#C8960C"/>
                {/* Glasses */}
                <circle cx="84" cy="72" r="17" fill="none" stroke="#333" strokeWidth="1.5"/>
                <circle cx="116" cy="72" r="17" fill="none" stroke="#333" strokeWidth="1.5"/>
                <line x1="101" y1="72" x2="99" y2="72" stroke="#333" strokeWidth="1.5"/>
                {/* Clipboard */}
                <rect x="60" y="115" width="28" height="35" rx="3" fill="#D4A574" stroke="#8B5E3C" strokeWidth="1.5"/>
                <rect x="64" y="122" width="20" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <rect x="64" y="127" width="16" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <rect x="64" y="132" width="18" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <path d="M90 95 Q100 103 110 95" fill="none" stroke="#4A3220" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="neli-fadeIn" style={{animationDelay:"0.3s"}}>
              <h1 style={{fontSize:28,fontWeight:800,color:"white",margin:"0 0 12px",fontFamily:"Georgia,serif"}}>Welcome back, Sarah! 👋</h1>
              <p style={{fontSize:15,color:"#8BA4C7",margin:"0 0 8px",lineHeight:1.6}}>You have <strong style={{color:"#C8960C"}}>{PUPILS.filter(p=>p.attendance<90||p.es<85).length} pupils</strong> who need attention today.</p>
              <p style={{fontSize:15,color:"#8BA4C7",margin:"0 0 24px",lineHeight:1.6}}>Amara Johnson is due for her LanguageScreen assessment.</p>
              <button onClick={()=>{setShowWelcome(false);sessionStorage.setItem("neli-welcomed","1");}} style={{
                display:"flex",alignItems:"center",gap:8,padding:"12px 28px",borderRadius:12,border:"none",
                background:`linear-gradient(135deg, ${T.gold}, #D4A020)`,color:"white",fontSize:15,fontWeight:700,
                cursor:"pointer",boxShadow:"0 8px 24px rgba(200,150,12,0.4)",fontFamily:"system-ui",
              }}>
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{width:220,background:`linear-gradient(180deg, ${T.sidebar} 0%, #0A1628 100%)`,display:"flex",flexDirection:"column",flexShrink:0}}>
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
          <p style={{fontSize:13,fontWeight:700,color:"white",margin:"0 0 2px"}}>🏫 Parkside Primary</p>
          <p style={{fontSize:11,color:T.sidebarText,margin:0}}>Oak Valley MAT · Reception</p>
        </div>
        <div style={{margin:"0 16px",height:1,background:"linear-gradient(90deg,transparent,#C8960C40,transparent)"}}/>
        <nav style={{flex:1,padding:"10px",overflowY:"auto"}}>
          {NAV.map(({id,Icon,label})=>(
            <button key={id} onClick={()=>handleNav(id)} style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",
              borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",marginBottom:2,
              background:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?"#1E3561":"transparent",
              color:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?T.gold:T.sidebarText,
              borderLeft:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?`4px solid ${T.gold}`:"4px solid transparent",
            }}>
              <Icon size={16} style={{flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:(page===id)?"700":"500"}}>{label}</span>
              {id==="trust"&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,
                background:"#B91C1C",color:"white",borderRadius:10,padding:"1px 6px"}}>2</span>}
            </button>
          ))}
        </nav>
        <div style={{margin:"0 16px",height:1,background:"linear-gradient(90deg,transparent,#C8960C40,transparent)"}}/>
        <div style={{padding:"12px 10px"}}>
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
        <div style={{height:56,background:"linear-gradient(180deg, white 0%, #FAFAF8 100%)",borderBottom:`1px solid ${T.border}`,
          display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:15,fontWeight:700,color:T.text,margin:0}}>
              {page==="pupil"&&selectedPupil?selectedPupil.name
               :page==="classdetail"&&selectedClass?selectedClass.name
               :page==="trainingcourses"?"FutureLearn Courses"
               :NAV.find(n=>n.id===page)?.label||"Dashboard"}
            </h1>
          </div>
          <div className="neli-pulseGlow" style={{fontSize:12,color:T.green,fontWeight:700,background:T.greenBg,
            padding:"4px 12px",borderRadius:20}}>● DfE Funded 2024–2029</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:8,
              border:`1px solid ${T.border}`,background:"white",display:"flex",alignItems:"center",
              justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <Bell size={16} color={T.muted} className="neli-bellBounce"/>
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
        <div style={{flex:1,overflow:"auto",padding:"24px"}}><div key={page} className="neli-fadeIn">{renderPage()}</div></div>
      </div>
    </div>
  );
}
