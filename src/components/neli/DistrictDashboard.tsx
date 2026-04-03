'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ReferenceLine, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  ScatterChart, Scatter, ReferenceArea, ZAxis,
} from 'recharts'
import {
  Building2, AlertTriangle, ChevronRight, Download, Calendar,
  FileText, Users, GraduationCap, ClipboardList, TrendingUp,
  Eye, Phone, CheckCircle2, XCircle, Clock, Shield,
  BookOpen, BarChart3, Search, UserCheck,
} from 'lucide-react'
import {
  T, PUPILS, TRUST, STAFF, FL_COURSES, neliPupils,
  getLight, lc, lb, ll, classAvgI, classAvgE, neliAvgGain,
  LeuvLabel, LeuvColor,
} from './neliData'
import { PupilDetail } from './NELIComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// DUMMY DATA — Realistic school data for 3 additional schools
// ═══════════════════════════════════════════════════════════════════════════════

const SCHOOL_COLORS: Record<string, string> = {
  PE: '#0D9488', RA: '#3B82F6', GS: '#8B5CF6', HI: '#EF4444',
}
const SCHOOL_LINE_COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B']

// District schools — using TRUST data but with US naming
const DISTRICT_SCHOOLS = [
  { ...TRUST[0], name: 'Parkside Elementary', short: 'PE', principal: 'Dr. Rebecca Lawson', coordinator: 'Sarah Mitchell' },
  { ...TRUST[1], name: 'Riverside Academy', short: 'RA', principal: 'Mr. Thomas Grant', coordinator: 'Lisa Nguyen' },
  { ...TRUST[2], name: 'Greenfields School', short: 'GS', principal: 'Mrs. Diana Reyes', coordinator: 'Mark Sullivan' },
  { ...TRUST[3], name: 'Hillside Primary School', short: 'HI', principal: 'Ms. Karen O\'Brien', coordinator: 'Amy Rodriguez' },
]

// Riverside Academy — 31 students, 6 TEL TED
const RIVERSIDE_PUPILS = [
  { id:101, name:"Maya Chen", dob:"12/03/2020", g:"F", eal:true, fsm:true, is:65, es:82, neli:true, class:"A", attendance:87, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:62,expVocab:63,grammar:66,listening:69}, neliWeek:15, neliSessions:72, neliExpected:75, interventionist:"Lisa Nguyen", sen:{status:"SEN Support",category:"Communication & Interaction",plan:"Speech therapy",ehcp:false,agencies:["SALT"],adjustments:["Visual aids"]}, notes:"Making good progress.", nextSteps:["Continue support"] },
  { id:102, name:"Jayden Brooks", dob:"08/07/2019", g:"M", eal:false, fsm:true, is:70, es:86, neli:true, class:"A", attendance:90, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:67,expVocab:69,grammar:72,listening:73}, neliWeek:15, neliSessions:74, neliExpected:75, interventionist:"Lisa Nguyen", sen:{status:"Monitoring",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Steady improvement.", nextSteps:["Monitor"] },
  { id:103, name:"Sofia Martinez", dob:"22/11/2019", g:"F", eal:true, fsm:false, is:73, es:89, neli:true, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:71,expVocab:72,grammar:74,listening:76}, neliWeek:15, neliSessions:73, neliExpected:75, interventionist:"Lisa Nguyen", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Excellent progress as EAL learner.", nextSteps:["Continue bilingual support"], homeLanguage:"Spanish", ealStage:"Developing" },
  { id:104, name:"Elijah Washington", dob:"05/01/2020", g:"M", eal:false, fsm:true, is:76, es:90, neli:true, class:"A", attendance:89, leuven:{wellbeing:3,involvement:4}, subscores:{recVocab:74,expVocab:75,grammar:77,listening:79}, neliWeek:15, neliSessions:71, neliExpected:75, interventionist:"Lisa Nguyen", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Good engagement in group sessions.", nextSteps:["Consolidate gains"] },
  { id:105, name:"Aria Kim", dob:"18/05/2020", g:"F", eal:true, fsm:false, is:77, es:91, neli:true, class:"B", attendance:96, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:75,expVocab:76,grammar:78,listening:80}, neliWeek:15, neliSessions:74, neliExpected:75, interventionist:"Lisa Nguyen", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Strong progress, confident communicator now.", nextSteps:["Transition planning"], homeLanguage:"Korean", ealStage:"Competent" },
  { id:106, name:"Marcus Johnson", dob:"29/09/2019", g:"M", eal:false, fsm:false, is:80, es:93, neli:true, class:"B", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:78,expVocab:79,grammar:81,listening:83}, neliWeek:15, neliSessions:73, neliExpected:75, interventionist:"Lisa Nguyen", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Exceeding expectations.", nextSteps:["End of year profile"] },
  // Non-NELI students
  { id:107, name:"Emma Davis", dob:"14/02/2020", g:"F", eal:false, fsm:false, is:84, es:88, neli:false, class:"A", attendance:95, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:82,expVocab:83,grammar:85,listening:86}, notes:"", nextSteps:[] },
  { id:108, name:"Liam Wilson", dob:"03/06/2020", g:"M", eal:false, fsm:false, is:86, es:90, neli:false, class:"A", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:84,expVocab:85,grammar:87,listening:88}, notes:"", nextSteps:[] },
  { id:109, name:"Olivia Taylor", dob:"21/08/2019", g:"F", eal:false, fsm:false, is:88, es:92, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:86,expVocab:87,grammar:89,listening:90}, notes:"", nextSteps:[] },
  { id:110, name:"Noah Anderson", dob:"10/12/2019", g:"M", eal:false, fsm:false, is:89, es:93, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:87,expVocab:88,grammar:90,listening:91}, notes:"", nextSteps:[] },
  { id:111, name:"Ava Thomas", dob:"07/04/2020", g:"F", eal:false, fsm:false, is:90, es:94, neli:false, class:"A", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:88,expVocab:89,grammar:91,listening:92}, notes:"", nextSteps:[] },
  { id:112, name:"William Jackson", dob:"25/01/2020", g:"M", eal:false, fsm:false, is:91, es:95, neli:false, class:"B", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:89,expVocab:90,grammar:92,listening:93}, notes:"", nextSteps:[] },
  { id:113, name:"Isabella White", dob:"16/07/2019", g:"F", eal:false, fsm:false, is:92, es:96, neli:false, class:"B", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:90,expVocab:91,grammar:93,listening:94}, notes:"", nextSteps:[] },
  { id:114, name:"James Harris", dob:"02/03/2020", g:"M", eal:false, fsm:false, is:93, es:96, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:91,expVocab:92,grammar:94,listening:95}, notes:"", nextSteps:[] },
  { id:115, name:"Charlotte Martin", dob:"19/10/2019", g:"F", eal:true, fsm:false, is:94, es:97, neli:false, class:"B", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:92,expVocab:93,grammar:95,listening:96}, notes:"", nextSteps:[], homeLanguage:"French", ealStage:"Fluent" },
  { id:116, name:"Benjamin Garcia", dob:"06/05/2020", g:"M", eal:false, fsm:false, is:95, es:98, neli:false, class:"B", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:93,expVocab:94,grammar:96,listening:97}, notes:"", nextSteps:[] },
  { id:117, name:"Amelia Robinson", dob:"28/09/2019", g:"F", eal:false, fsm:false, is:96, es:99, neli:false, class:"B", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:94,expVocab:95,grammar:97,listening:98}, notes:"", nextSteps:[] },
  { id:118, name:"Henry Clark", dob:"11/01/2020", g:"M", eal:false, fsm:false, is:97, es:100, neli:false, class:"A", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:95,expVocab:96,grammar:98,listening:99}, notes:"", nextSteps:[] },
  { id:119, name:"Mia Lewis", dob:"04/08/2020", g:"F", eal:false, fsm:false, is:98, es:101, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:96,expVocab:97,grammar:99,listening:100}, notes:"", nextSteps:[] },
  { id:120, name:"Alexander Lee", dob:"23/11/2019", g:"M", eal:false, fsm:false, is:99, es:102, neli:false, class:"B", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:97,expVocab:98,grammar:100,listening:101}, notes:"", nextSteps:[] },
  { id:121, name:"Harper Walker", dob:"15/06/2020", g:"F", eal:false, fsm:false, is:100, es:103, neli:false, class:"B", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:98,expVocab:99,grammar:101,listening:102}, notes:"", nextSteps:[] },
  { id:122, name:"Daniel Young", dob:"09/02/2020", g:"M", eal:false, fsm:false, is:101, es:104, neli:false, class:"A", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:99,expVocab:100,grammar:102,listening:103}, notes:"", nextSteps:[] },
  { id:123, name:"Evelyn King", dob:"17/04/2020", g:"F", eal:false, fsm:false, is:102, es:105, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:100,expVocab:101,grammar:103,listening:104}, notes:"", nextSteps:[] },
  { id:124, name:"Sebastian Wright", dob:"01/07/2019", g:"M", eal:false, fsm:false, is:103, es:106, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:101,expVocab:102,grammar:104,listening:105}, notes:"", nextSteps:[] },
  { id:125, name:"Abigail Scott", dob:"20/12/2019", g:"F", eal:false, fsm:false, is:105, es:108, neli:false, class:"B", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:103,expVocab:104,grammar:106,listening:107}, notes:"", nextSteps:[] },
  { id:126, name:"Jack Adams", dob:"13/03/2020", g:"M", eal:false, fsm:false, is:107, es:110, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:105,expVocab:106,grammar:108,listening:109}, notes:"", nextSteps:[] },
  { id:127, name:"Emily Hill", dob:"08/08/2020", g:"F", eal:false, fsm:false, is:109, es:112, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:107,expVocab:108,grammar:110,listening:111}, notes:"", nextSteps:[] },
  { id:128, name:"Lucas Baker", dob:"26/05/2020", g:"M", eal:false, fsm:false, is:111, es:114, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:109,expVocab:110,grammar:112,listening:113}, notes:"", nextSteps:[] },
  { id:129, name:"Grace Nelson", dob:"14/10/2019", g:"F", eal:false, fsm:false, is:113, es:116, neli:false, class:"B", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:111,expVocab:112,grammar:114,listening:115}, notes:"", nextSteps:[] },
  { id:130, name:"Owen Carter", dob:"02/01/2020", g:"M", eal:false, fsm:false, is:115, es:117, neli:false, class:"A", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:113,expVocab:114,grammar:116,listening:117}, notes:"", nextSteps:[] },
  { id:131, name:"Chloe Mitchell", dob:"19/06/2020", g:"F", eal:false, fsm:false, is:116, es:118, neli:false, class:"B", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:114,expVocab:115,grammar:117,listening:118}, notes:"", nextSteps:[] },
]

// Greenfields School — 24 students, 5 TEL TED, some not assessed (avgE null)
const GREENFIELDS_PUPILS = [
  { id:201, name:"Zara Ahmed", dob:"09/04/2020", g:"F", eal:true, fsm:true, is:68, es:null, neli:true, class:"A", attendance:85, leuven:{wellbeing:2,involvement:3}, subscores:{recVocab:65,expVocab:66,grammar:69,listening:72}, neliWeek:16, neliSessions:76, neliExpected:80, interventionist:"Mark Sullivan", sen:{status:"SEN Support",category:"Communication & Interaction",plan:"SALT referral",ehcp:false,agencies:["SALT"],adjustments:["Visual supports"]}, notes:"Awaiting end-of-term assessment.", nextSteps:["Schedule reassessment"], homeLanguage:"Urdu", ealStage:"Developing" },
  { id:202, name:"Tyler Morgan", dob:"15/08/2019", g:"M", eal:false, fsm:true, is:72, es:null, neli:true, class:"A", attendance:88, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:69,expVocab:71,grammar:73,listening:75}, neliWeek:16, neliSessions:78, neliExpected:80, interventionist:"Mark Sullivan", sen:{status:"Monitoring",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Good engagement but no recent score.", nextSteps:["Reassess"] },
  { id:203, name:"Lily Patel", dob:"28/01/2020", g:"F", eal:true, fsm:false, is:75, es:88, neli:true, class:"A", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:73,expVocab:74,grammar:76,listening:78}, neliWeek:16, neliSessions:79, neliExpected:80, interventionist:"Mark Sullivan", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Good progress, assessed recently.", nextSteps:["Continue programme"], homeLanguage:"Gujarati", ealStage:"Competent" },
  { id:204, name:"Ryan Cooper", dob:"03/06/2020", g:"M", eal:false, fsm:false, is:78, es:null, neli:true, class:"A", attendance:91, leuven:{wellbeing:3,involvement:4}, subscores:{recVocab:76,expVocab:77,grammar:79,listening:81}, neliWeek:16, neliSessions:77, neliExpected:80, interventionist:"Mark Sullivan", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Assessment overdue.", nextSteps:["Schedule assessment"] },
  { id:205, name:"Nadia Hassan", dob:"17/10/2019", g:"F", eal:true, fsm:true, is:80, es:null, neli:true, class:"B", attendance:90, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:78,expVocab:79,grammar:81,listening:82}, neliWeek:16, neliSessions:75, neliExpected:80, interventionist:"Mark Sullivan", sen:{status:"EAL Monitoring",category:"EAL",plan:"EAL support",ehcp:false,agencies:[],adjustments:["Bilingual resources"]}, notes:"Assessment not yet completed.", nextSteps:["Complete assessment"], homeLanguage:"Arabic", ealStage:"Developing" },
  // Non-NELI
  { id:206, name:"Sophie Reed", dob:"24/03/2020", g:"F", eal:false, fsm:false, is:85, es:89, neli:false, class:"A", attendance:95, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:83,expVocab:84,grammar:86,listening:87}, notes:"", nextSteps:[] },
  { id:207, name:"Aiden Phillips", dob:"11/07/2019", g:"M", eal:false, fsm:false, is:87, es:91, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:85,expVocab:86,grammar:88,listening:89}, notes:"", nextSteps:[] },
  { id:208, name:"Hannah Stewart", dob:"06/12/2019", g:"F", eal:false, fsm:false, is:89, es:93, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:87,expVocab:88,grammar:90,listening:91}, notes:"", nextSteps:[] },
  { id:209, name:"Ethan Bennett", dob:"19/02/2020", g:"M", eal:false, fsm:false, is:90, es:94, neli:false, class:"B", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:88,expVocab:89,grammar:91,listening:92}, notes:"", nextSteps:[] },
  { id:210, name:"Lucy Collins", dob:"08/05/2020", g:"F", eal:false, fsm:false, is:91, es:95, neli:false, class:"B", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:89,expVocab:90,grammar:92,listening:93}, notes:"", nextSteps:[] },
  { id:211, name:"Mason Edwards", dob:"30/08/2019", g:"M", eal:false, fsm:false, is:92, es:96, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:90,expVocab:91,grammar:93,listening:94}, notes:"", nextSteps:[] },
  { id:212, name:"Ella Morris", dob:"14/11/2019", g:"F", eal:false, fsm:false, is:93, es:97, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:91,expVocab:92,grammar:94,listening:95}, notes:"", nextSteps:[] },
  { id:213, name:"Logan Rogers", dob:"22/01/2020", g:"M", eal:false, fsm:false, is:94, es:98, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:92,expVocab:93,grammar:95,listening:96}, notes:"", nextSteps:[] },
  { id:214, name:"Scarlett Turner", dob:"07/04/2020", g:"F", eal:false, fsm:false, is:96, es:100, neli:false, class:"B", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:94,expVocab:95,grammar:97,listening:98}, notes:"", nextSteps:[] },
  { id:215, name:"Carter Bailey", dob:"16/07/2019", g:"M", eal:false, fsm:false, is:97, es:101, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:95,expVocab:96,grammar:98,listening:99}, notes:"", nextSteps:[] },
  { id:216, name:"Layla Rivera", dob:"01/09/2020", g:"F", eal:true, fsm:false, is:99, es:103, neli:false, class:"A", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:97,expVocab:98,grammar:100,listening:101}, notes:"", nextSteps:[], homeLanguage:"Spanish", ealStage:"Fluent" },
  { id:217, name:"Jackson Perez", dob:"12/03/2020", g:"M", eal:false, fsm:false, is:101, es:105, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:99,expVocab:100,grammar:102,listening:103}, notes:"", nextSteps:[] },
  { id:218, name:"Penelope Howard", dob:"25/06/2020", g:"F", eal:false, fsm:false, is:103, es:107, neli:false, class:"B", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:101,expVocab:102,grammar:104,listening:105}, notes:"", nextSteps:[] },
  { id:219, name:"Wyatt Cox", dob:"18/10/2019", g:"M", eal:false, fsm:false, is:105, es:109, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:103,expVocab:104,grammar:106,listening:107}, notes:"", nextSteps:[] },
  { id:220, name:"Aria Diaz", dob:"05/01/2020", g:"F", eal:false, fsm:false, is:108, es:112, neli:false, class:"A", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:106,expVocab:107,grammar:109,listening:110}, notes:"", nextSteps:[] },
  { id:221, name:"Grayson Ward", dob:"14/04/2020", g:"M", eal:false, fsm:false, is:110, es:113, neli:false, class:"A", attendance:95, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:108,expVocab:109,grammar:111,listening:112}, notes:"", nextSteps:[] },
  { id:222, name:"Riley Foster", dob:"29/08/2019", g:"F", eal:false, fsm:false, is:112, es:115, neli:false, class:"B", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:110,expVocab:111,grammar:113,listening:114}, notes:"", nextSteps:[] },
  { id:223, name:"Leo Ramirez", dob:"03/12/2019", g:"M", eal:true, fsm:false, is:114, es:117, neli:false, class:"B", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:112,expVocab:113,grammar:115,listening:116}, notes:"", nextSteps:[], homeLanguage:"Spanish", ealStage:"Fluent" },
  { id:224, name:"Hazel Brooks", dob:"20/02/2020", g:"F", eal:false, fsm:false, is:116, es:119, neli:false, class:"A", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:114,expVocab:115,grammar:117,listening:118}, notes:"", nextSteps:[] },
]

// Hillside Primary School — 19 students, 5 TEL TED, Week 8, behind schedule
const HILLSIDE_PUPILS = [
  { id:301, name:"Isaiah Coleman", dob:"06/05/2020", g:"M", eal:false, fsm:true, is:62, es:null, neli:true, class:"A", attendance:78, leuven:{wellbeing:2,involvement:2}, subscores:{recVocab:58,expVocab:60,grammar:63,listening:66}, neliWeek:8, neliSessions:32, neliExpected:40, interventionist:"Amy Rodriguez", sen:{status:"SEN Support",category:"Communication & Interaction",plan:"SALT referral",ehcp:false,agencies:["SALT pending"],adjustments:["Visual supports","Small group"]}, notes:"Behind schedule. Needs urgent support.", nextSteps:["Increase session frequency","SALT referral"] },
  { id:302, name:"Aaliyah Brown", dob:"18/09/2019", g:"F", eal:false, fsm:true, is:68, es:null, neli:true, class:"A", attendance:82, leuven:{wellbeing:2,involvement:3}, subscores:{recVocab:65,expVocab:66,grammar:69,listening:72}, neliWeek:8, neliSessions:30, neliExpected:40, interventionist:"Amy Rodriguez", sen:{status:"Monitoring",category:"Communication & Interaction",plan:"Class monitoring",ehcp:false,agencies:[],adjustments:["Verbal prompts"]}, notes:"Attendance affecting progress.", nextSteps:["Address attendance","Extra sessions"] },
  { id:303, name:"Diego Rivera", dob:"22/01/2020", g:"M", eal:true, fsm:true, is:71, es:null, neli:true, class:"A", attendance:85, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:68,expVocab:70,grammar:72,listening:74}, neliWeek:8, neliSessions:34, neliExpected:40, interventionist:"Amy Rodriguez", sen:{status:"EAL Monitoring",category:"EAL",plan:"EAL support",ehcp:false,agencies:[],adjustments:["Bilingual resources"]}, notes:"EAL learner, needs consistent support.", nextSteps:["Continue bilingual support"], homeLanguage:"Spanish", ealStage:"New to English" },
  { id:304, name:"Kiara Patterson", dob:"14/07/2020", g:"F", eal:false, fsm:false, is:74, es:null, neli:true, class:"A", attendance:87, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:71,expVocab:73,grammar:75,listening:77}, neliWeek:8, neliSessions:33, neliExpected:40, interventionist:"Amy Rodriguez", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Making some progress but behind peers.", nextSteps:["Catch up sessions"] },
  { id:305, name:"Jaxon Taylor", dob:"03/11/2019", g:"M", eal:false, fsm:true, is:76, es:null, neli:true, class:"B", attendance:84, leuven:{wellbeing:3,involvement:3}, subscores:{recVocab:73,expVocab:75,grammar:77,listening:79}, neliWeek:8, neliSessions:31, neliExpected:40, interventionist:"Amy Rodriguez", sen:{status:"None",category:"",plan:"",ehcp:false,agencies:[],adjustments:[]}, notes:"Good potential but limited sessions.", nextSteps:["Increase attendance"] },
  // Non-NELI
  { id:306, name:"Avery Mitchell", dob:"27/03/2020", g:"F", eal:false, fsm:false, is:83, es:null, neli:false, class:"A", attendance:92, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:81,expVocab:82,grammar:84,listening:85}, notes:"", nextSteps:[] },
  { id:307, name:"Caleb Foster", dob:"10/06/2019", g:"M", eal:false, fsm:false, is:86, es:null, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:84,expVocab:85,grammar:87,listening:88}, notes:"", nextSteps:[] },
  { id:308, name:"Stella Hughes", dob:"05/09/2019", g:"F", eal:false, fsm:false, is:88, es:null, neli:false, class:"A", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:86,expVocab:87,grammar:89,listening:90}, notes:"", nextSteps:[] },
  { id:309, name:"Dominic Price", dob:"18/12/2019", g:"M", eal:false, fsm:false, is:89, es:null, neli:false, class:"B", attendance:93, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:87,expVocab:88,grammar:90,listening:91}, notes:"", nextSteps:[] },
  { id:310, name:"Piper Russell", dob:"01/02/2020", g:"F", eal:false, fsm:false, is:91, es:null, neli:false, class:"B", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:89,expVocab:90,grammar:92,listening:93}, notes:"", nextSteps:[] },
  { id:311, name:"Micah Bell", dob:"23/05/2020", g:"M", eal:false, fsm:false, is:92, es:null, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:90,expVocab:91,grammar:93,listening:94}, notes:"", nextSteps:[] },
  { id:312, name:"Quinn Murphy", dob:"09/08/2019", g:"F", eal:false, fsm:false, is:94, es:null, neli:false, class:"A", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:92,expVocab:93,grammar:95,listening:96}, notes:"", nextSteps:[] },
  { id:313, name:"Ashton Perry", dob:"16/11/2019", g:"M", eal:false, fsm:false, is:96, es:null, neli:false, class:"A", attendance:94, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:94,expVocab:95,grammar:97,listening:98}, notes:"", nextSteps:[] },
  { id:314, name:"Violet Simmons", dob:"28/01/2020", g:"F", eal:false, fsm:false, is:98, es:null, neli:false, class:"B", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:96,expVocab:97,grammar:99,listening:100}, notes:"", nextSteps:[] },
  { id:315, name:"Beckett Long", dob:"12/04/2020", g:"M", eal:false, fsm:false, is:100, es:null, neli:false, class:"B", attendance:95, leuven:{wellbeing:4,involvement:5}, subscores:{recVocab:98,expVocab:99,grammar:101,listening:102}, notes:"", nextSteps:[] },
  { id:316, name:"Juniper Ross", dob:"07/07/2019", g:"F", eal:false, fsm:false, is:102, es:null, neli:false, class:"A", attendance:98, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:100,expVocab:101,grammar:103,listening:104}, notes:"", nextSteps:[] },
  { id:317, name:"Atlas Reed", dob:"20/10/2019", g:"M", eal:false, fsm:false, is:104, es:null, neli:false, class:"A", attendance:95, leuven:{wellbeing:4,involvement:4}, subscores:{recVocab:102,expVocab:103,grammar:105,listening:106}, notes:"", nextSteps:[] },
  { id:318, name:"Ivy Morgan", dob:"02/02/2020", g:"F", eal:true, fsm:false, is:107, es:null, neli:false, class:"B", attendance:97, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:105,expVocab:106,grammar:108,listening:109}, notes:"", nextSteps:[], homeLanguage:"Mandarin", ealStage:"Competent" },
  { id:319, name:"Finn Wallace", dob:"15/05/2020", g:"M", eal:false, fsm:false, is:110, es:null, neli:false, class:"B", attendance:96, leuven:{wellbeing:5,involvement:5}, subscores:{recVocab:108,expVocab:109,grammar:111,listening:112}, notes:"", nextSteps:[] },
]

// Map school short code to pupils
const SCHOOL_PUPILS: Record<string, any[]> = {
  PE: PUPILS,
  RA: RIVERSIDE_PUPILS,
  GS: GREENFIELDS_PUPILS,
  HI: HILLSIDE_PUPILS,
}

// Staff per school
const SCHOOL_STAFF: Record<string, any[]> = {
  PE: STAFF,
  RA: [
    { name:"Lisa Nguyen", role:"TEL TED Coordinator", c1:true, c2:true, c3:true },
    { name:"David Park", role:"Teaching Assistant", c1:true, c2:true, c3:false },
    { name:"Rachel Adams", role:"Kindergarten Teacher", c1:true, c2:false, c3:false },
  ],
  GS: [
    { name:"Mark Sullivan", role:"TEL TED Coordinator", c1:true, c2:true, c3:false },
    { name:"Priya Sharma", role:"Teaching Assistant", c1:true, c2:false, c3:false },
    { name:"Tom Henderson", role:"Kindergarten Teacher", c1:true, c2:false, c3:false },
  ],
  HI: [
    { name:"Amy Rodriguez", role:"TEL TED Coordinator", c1:true, c2:false, c3:false },
    { name:"Carlos Mendez", role:"Teaching Assistant", c1:true, c2:false, c3:false },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const statusColor = (s: string) => s === 'good' ? '#22C55E' : s === 'warning' ? '#F59E0B' : '#EF4444'
const statusLabel = (s: string) => s === 'good' ? 'On Track' : s === 'warning' ? 'Monitor' : 'Needs Attention'
const statusBg = (s: string) => s === 'good' ? 'rgba(34,197,94,0.1)' : s === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10
}

function getSchoolNeliPupils(short: string) {
  return (SCHOOL_PUPILS[short] || []).filter((p: any) => p.neli)
}

function getSchoolAvgI(short: string) {
  const pupils = SCHOOL_PUPILS[short] || []
  return avg(pupils.map((p: any) => p.is))
}

function getSchoolAvgE(short: string) {
  const pupils = (SCHOOL_PUPILS[short] || []).filter((p: any) => p.es != null)
  return pupils.length ? avg(pupils.map((p: any) => p.es)) : null
}

// Generate monthly trajectory data for a school
function getSchoolTrajectory(short: string) {
  const pupils = SCHOOL_PUPILS[short] || []
  const avgIs = avg(pupils.map((p: any) => p.is))
  const assessed = pupils.filter((p: any) => p.es != null)
  const avgEs = assessed.length ? avg(assessed.map((p: any) => p.es)) : null
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

  if (avgEs == null) {
    // Only have initial — flat or slight improvement guessed
    return months.slice(0, 4).map((m, i) => ({ month: m, score: Math.round((avgIs + i * 0.5) * 10) / 10 }))
  }
  const step = (avgEs - avgIs) / 6
  return months.map((m, i) => ({ month: m, score: Math.round((avgIs + step * i) * 10) / 10 }))
}

// Score distribution bins for a school
function getScoreDistribution(short: string) {
  const pupils = SCHOOL_PUPILS[short] || []
  const scores = pupils.map((p: any) => p.es ?? p.is)
  const bins = [
    { range: '<75', min: 0, max: 74, count: 0, color: '#EF4444' },
    { range: '75-84', min: 75, max: 84, count: 0, color: '#F59E0B' },
    { range: '85-89', min: 85, max: 89, count: 0, color: '#F59E0B' },
    { range: '90-94', min: 90, max: 94, count: 0, color: '#84CC16' },
    { range: '95-99', min: 95, max: 99, count: 0, color: '#22C55E' },
    { range: '100+', min: 100, max: 999, count: 0, color: '#15803D' },
  ]
  scores.forEach(s => {
    const bin = bins.find(b => s >= b.min && s <= b.max)
    if (bin) bin.count++
  })
  return bins
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const cardStyle: React.CSSProperties = { backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 20 }
const darkBg: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #1F2937', borderRadius: 12 }

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 1 — DISTRICT HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function DistrictHeader() {
  const totalStudents = DISTRICT_SCHOOLS.reduce((s, sc) => s + sc.pupils, 0)
  const totalNeli = DISTRICT_SCHOOLS.reduce((s, sc) => s + sc.neli, 0)
  const districtAvg = avg(DISTRICT_SCHOOLS.filter(s => s.avgE != null).map(s => s.avgE as number))
  const avgWeek = Math.round(DISTRICT_SCHOOLS.reduce((s, sc) => s + sc.weeks, 0) / DISTRICT_SCHOOLS.length)

  return (
    <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #111827 50%, #0C1A2E 100%)', border: '1px solid #1F2937' }}>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(200,150,12,0.15)', border: '1px solid rgba(200,150,12,0.3)' }}>
            <Building2 size={24} style={{ color: '#C8960C' }} />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Oak Valley District</h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>TEL TED Programme — District Intelligence Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Total Schools', value: 4, color: '#3B82F6' },
            { label: 'Total Students', value: totalStudents, color: '#0D9488' },
            { label: 'TEL TED Students', value: totalNeli, color: '#C8960C' },
            { label: 'District Avg Score', value: districtAvg || '—', color: '#22C55E' },
            { label: 'Programme Week', value: `${avgWeek} (avg)`, color: '#8B5CF6' },
          ].map(pill => (
            <div key={pill.label} className="flex flex-col items-center px-3 py-2 rounded-xl" style={{ backgroundColor: `${pill.color}15`, border: `1px solid ${pill.color}30`, minWidth: 80 }}>
              <span className="text-lg font-black" style={{ color: pill.color }}>{pill.value}</span>
              <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>{pill.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DistrictAlertStrip() {
  const alertSchools = DISTRICT_SCHOOLS.filter(s => s.status === 'alert' || s.status === 'warning')
  if (!alertSchools.length) return null

  return (
    <div className="space-y-1">
      {alertSchools.map(school => (
        <div key={school.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            backgroundColor: school.status === 'alert' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${school.status === 'alert' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            borderLeft: `4px solid ${school.status === 'alert' ? '#EF4444' : '#F59E0B'}`,
          }}>
          <AlertTriangle size={16} style={{ color: school.status === 'alert' ? '#EF4444' : '#F59E0B', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#F9FAFB' }}>
            {school.status === 'alert'
              ? `${school.name} is behind schedule — Week ${school.weeks} of 20, no end-of-term scores recorded`
              : `${school.name} requires monitoring — ${100 - school.assessed}% of students not yet assessed this term`}
          </p>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 2 — DISTRICT OVERVIEW CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

function DistrictChartsRow() {
  // Chart 1 — School Performance Comparison
  const perfData = DISTRICT_SCHOOLS.map(s => ({
    name: s.short,
    initial: s.avgI,
    current: s.avgE ?? 0,
  }))

  // Chart 2 — Progress Ring
  const progressData = DISTRICT_SCHOOLS.map((s, i) => ({
    name: s.short,
    value: Math.round((s.weeks / 20) * 100),
    fill: SCHOOL_LINE_COLORS[i],
  }))

  // Chart 3 — Score Trend
  const trendData = (() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
    return months.map(m => {
      const point: any = { month: m }
      DISTRICT_SCHOOLS.forEach((s, i) => {
        const traj = getSchoolTrajectory(s.short)
        const found = traj.find(t => t.month === m)
        point[s.short] = found?.score ?? null
      })
      return point
    })
  })()

  // Chart 4 — Student Band Distribution
  const bandData = DISTRICT_SCHOOLS.map(s => {
    const pupils = SCHOOL_PUPILS[s.short] || []
    const scores = pupils.map((p: any) => p.es ?? p.is)
    return {
      name: s.short,
      onTrack: scores.filter((v: number) => v >= 96).length,
      monitor: scores.filter((v: number) => v >= 85 && v < 96).length,
      needsSupport: scores.filter((v: number) => v < 85).length,
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Chart 1 */}
      <div style={cardStyle}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Assessment Scores by School</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={perfData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis domain={[80, 110]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="initial" name="Avg Initial" fill="#1B3060" radius={[4, 4, 0, 0]} />
            <Bar dataKey="current" name="Avg Current" fill="#C8960C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2 — Progress Ring */}
      <div style={cardStyle}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Programme Completion</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={progressData} startAngle={180} endAngle={0}>
            <RadialBar background dataKey="value" label={{ fill: '#F9FAFB', fontSize: 10, position: 'insideStart' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} formatter={(v: any) => `${v}%`} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-3 mt-1">
          {progressData.map(d => (
            <div key={d.name} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{d.name} {d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 3 — Score Trend */}
      <div style={cardStyle}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Score Trajectory — All Schools</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis domain={[80, 105]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
            <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'Threshold', fill: '#EF4444', fontSize: 10 }} />
            {DISTRICT_SCHOOLS.map((s, i) => (
              <Line key={s.short} type="monotone" dataKey={s.short} stroke={SCHOOL_LINE_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 4 — At-Risk Students */}
      <div style={cardStyle}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Student Band Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bandData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="onTrack" name="On Track" stackId="a" fill="#22C55E" />
            <Bar dataKey="monitor" name="Monitor" stackId="a" fill="#F59E0B" />
            <Bar dataKey="needsSupport" name="Needs Support" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 3 — DISTRICT SUMMARY TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DistrictSummaryTab() {
  const allPupils = Object.values(SCHOOL_PUPILS).flat()
  const allNeli = allPupils.filter((p: any) => p.neli)
  const allStaff = Object.values(SCHOOL_STAFF).flat()
  const schoolsOnTrack = DISTRICT_SCHOOLS.filter(s => s.status === 'good').length
  const schoolsMonitor = DISTRICT_SCHOOLS.filter(s => s.status === 'warning').length
  const schoolsAlert = DISTRICT_SCHOOLS.filter(s => s.status === 'alert').length
  const totalSessions = allNeli.reduce((s: number, p: any) => s + (p.neliSessions || 0), 0)

  const allWithScores = allPupils.filter((p: any) => p.es != null)
  const distAvgI = avg(allWithScores.map((p: any) => p.is))
  const distAvgE = avg(allWithScores.map((p: any) => p.es))
  const distGain = Math.round((distAvgE - distAvgI) * 10) / 10

  // League table
  const leagueData = DISTRICT_SCHOOLS.map(s => {
    const pupils = SCHOOL_PUPILS[s.short] || []
    const neliP = pupils.filter((p: any) => p.neli)
    const assessed = pupils.filter((p: any) => p.es != null)
    const aI = avg(pupils.map((p: any) => p.is))
    const aE = assessed.length ? avg(assessed.map((p: any) => p.es)) : null
    return { ...s, totalPupils: pupils.length, neliCount: neliP.length, aI, aE, gain: aE ? Math.round((aE - aI) * 10) / 10 : null }
  }).sort((a, b) => (b.aE ?? 0) - (a.aE ?? 0))

  // Radar — district avg subtests
  const radarData = ['recVocab', 'expVocab', 'grammar', 'listening'].map(key => {
    const label = key === 'recVocab' ? 'Rec Vocab' : key === 'expVocab' ? 'Exp Vocab' : key === 'grammar' ? 'Grammar' : 'Listening'
    const vals = allPupils.map((p: any) => p.subscores?.[key]).filter(Boolean)
    return { subject: label, value: avg(vals) }
  })

  // Parkside avg current for narrative
  const parksideAvgE = getSchoolAvgE('PE')

  return (
    <div className="space-y-4">
      {/* ROW 1 — KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Schools On Track', value: schoolsOnTrack, color: '#22C55E', icon: '✅' },
          { label: 'Schools Monitoring', value: schoolsMonitor, color: '#F59E0B', icon: '👁️' },
          { label: 'Needs Attention', value: schoolsAlert, color: '#EF4444', icon: '🔴' },
          { label: 'Sessions Delivered', value: totalSessions, color: '#0D9488', icon: '📖' },
          { label: 'District Avg Gain', value: distGain > 0 ? `+${distGain}` : distGain, color: '#3B82F6', icon: '📈' },
          { label: 'Staff Trained', value: allStaff.length, color: '#8B5CF6', icon: '🎓' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 text-center" style={{ ...darkBg }}>
            <span className="text-lg">{k.icon}</span>
            <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] font-medium mt-1" style={{ color: '#6B7280' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* ROW 2 — League Table + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>School League Table</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: '#0D0E14' }}>
                  {['Rank', 'School', 'Students', 'TEL TED', 'Avg Initial', 'Avg Current', 'Gain', 'Weeks', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leagueData.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: statusBg(s.status), borderBottom: '1px solid #1F293740' }}>
                    <td className="px-3 py-2.5 font-bold" style={{ color: '#F9FAFB' }}>{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: SCHOOL_COLORS[s.short] + '25', color: SCHOOL_COLORS[s.short] }}>{s.short}</div>
                        {s.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{s.totalPupils}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{s.neliCount}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{s.aI}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: s.aE ? '#22C55E' : '#6B7280' }}>{s.aE ?? '—'}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: s.gain && s.gain > 0 ? '#22C55E' : '#6B7280' }}>{s.gain != null ? (s.gain > 0 ? `+${s.gain}` : s.gain) : '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{s.weeks}/20</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor(s.status) + '20', color: statusColor(s.status) }}>{statusLabel(s.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ ...darkBg }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>District Subtest Profile</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1F2937" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} tick={{ fill: '#6B7280', fontSize: 10 }} />
              <Radar name="District Avg" dataKey="value" stroke="#C8960C" fill="#C8960C" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — AI District Summary */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '2px solid rgba(200,150,12,0.3)', borderRadius: 16 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🤖</span>
          <h3 className="text-sm font-bold" style={{ color: '#C8960C' }}>District AI Summary — Oak Valley District</h3>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
          Oak Valley District has {DISTRICT_SCHOOLS.reduce((s, sc) => s + sc.pupils, 0)} students across 4 schools completing the TEL TED programme.{' '}
          {schoolsOnTrack} schools are on track, {schoolsMonitor} requires monitoring, and Hillside Primary School needs immediate attention — currently at Week 8 with no end-of-term scores recorded.{' '}
          The district average score has improved from {distAvgI} to {distAvgE}, a gain of {distGain > 0 ? `+${distGain}` : distGain} standard score points.{' '}
          Parkside Elementary is the highest performing school with an average current score of {parksideAvgE ?? '96.8'}.
        </p>
      </div>

      {/* ROW 4 — Training Compliance */}
      <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
          <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Training Compliance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#0D0E14' }}>
                {['School', 'Staff Member', 'Role', 'Course 1', 'Course 2', 'Course 3', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISTRICT_SCHOOLS.map(school =>
                (SCHOOL_STAFF[school.short] || []).map((staff: any, si: number) => {
                  const complete = staff.c1 && staff.c2 && staff.c3
                  const inProgress = staff.c1 || staff.c2 || staff.c3
                  return (
                    <tr key={`${school.short}-${si}`} style={{ borderBottom: '1px solid #1F293740' }}>
                      {si === 0 && <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }} rowSpan={(SCHOOL_STAFF[school.short] || []).length}>{school.name}</td>}
                      <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{staff.name}</td>
                      <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{staff.role}</td>
                      <td className="px-3 py-2.5">{staff.c1 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                      <td className="px-3 py-2.5">{staff.c2 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                      <td className="px-3 py-2.5">{staff.c3 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: complete ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: complete ? '#22C55E' : '#F59E0B' }}>
                          {complete ? 'Fully Trained' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL SCHOOL TABS — 8 inner tabs
// ═══════════════════════════════════════════════════════════════════════════════

const INNER_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'languagescreen', label: 'LanguageScreen', icon: '🔍' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'atrisk', label: 'At Risk', icon: '⚠️' },
  { id: 'training', label: 'Training', icon: '🎓' },
  { id: 'sessions', label: 'Sessions', icon: '📋' },
  { id: 'reports', label: 'Reports', icon: '📄' },
]

function SchoolTabContent({ school }: { school: typeof DISTRICT_SCHOOLS[0] }) {
  const [innerTab, setInnerTab] = useState('overview')
  const [selectedPupil, setSelectedPupil] = useState<any>(null)
  const [studentFilter, setStudentFilter] = useState('all')

  const pupils = SCHOOL_PUPILS[school.short] || []
  const neliStudents = pupils.filter((p: any) => p.neli)
  const staff = SCHOOL_STAFF[school.short] || []
  const schoolAvgI = avg(pupils.map((p: any) => p.is))
  const assessed = pupils.filter((p: any) => p.es != null)
  const schoolAvgE = assessed.length ? avg(assessed.map((p: any) => p.es)) : null
  const schoolGain = schoolAvgE ? Math.round((schoolAvgE - schoolAvgI) * 10) / 10 : null

  if (selectedPupil) {
    return <PupilDetail pupil={selectedPupil} onBack={() => setSelectedPupil(null)} />
  }

  return (
    <div className="space-y-4">
      {/* School Header */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: `1px solid ${statusColor(school.status)}40` }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" style={{ backgroundColor: SCHOOL_COLORS[school.short] + '20', color: SCHOOL_COLORS[school.short], border: `2px solid ${SCHOOL_COLORS[school.short]}40` }}>
              {school.short}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{school.name}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor(school.status) + '20', color: statusColor(school.status) }}>{statusLabel(school.status)}</span>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Principal: {school.principal} · TEL TED Coordinator: {school.coordinator}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Programme Week: {school.weeks} of 20</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Students', value: pupils.length },
              { label: 'TEL TED', value: neliStudents.length },
              { label: 'Avg Initial', value: schoolAvgI },
              { label: 'Avg Current', value: schoolAvgE ?? '—' },
              { label: 'Avg Gain', value: schoolGain != null ? (schoolGain > 0 ? `+${schoolGain}` : schoolGain) : '—' },
            ].map(c => (
              <div key={c.label} className="px-3 py-1.5 rounded-lg text-center" style={{ ...darkBg, minWidth: 64 }}>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{c.value}</p>
                <p className="text-[10px]" style={{ color: '#6B7280' }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inner Tab Bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {INNER_TABS.map(t => (
          <button key={t.id} onClick={() => setInnerTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: innerTab === t.id ? '#C8960C' : '#111318',
              color: innerTab === t.id ? '#fff' : '#6B7280',
              border: innerTab === t.id ? '1px solid #C8960C' : '1px solid #1F2937',
            }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Inner Tab Content */}
      {innerTab === 'overview' && <SchoolOverviewTab school={school} pupils={pupils} neliStudents={neliStudents} />}
      {innerTab === 'languagescreen' && <SchoolLanguageScreenTab school={school} pupils={pupils} onSelectPupil={setSelectedPupil} />}
      {innerTab === 'progress' && <SchoolProgressTab school={school} pupils={pupils} neliStudents={neliStudents} />}
      {innerTab === 'students' && <SchoolStudentsTab school={school} pupils={pupils} filter={studentFilter} onFilterChange={setStudentFilter} onSelectPupil={setSelectedPupil} />}
      {innerTab === 'atrisk' && <SchoolAtRiskTab school={school} pupils={pupils} onSelectPupil={setSelectedPupil} />}
      {innerTab === 'training' && <SchoolTrainingTab school={school} staff={staff} />}
      {innerTab === 'sessions' && <SchoolSessionsTab school={school} neliStudents={neliStudents} />}
      {innerTab === 'reports' && <SchoolReportsTab school={school} />}
    </div>
  )
}

// ── INNER TAB 1: OVERVIEW ───────────────────────────────────────────────────

function SchoolOverviewTab({ school, pupils, neliStudents }: { school: any; pupils: any[]; neliStudents: any[] }) {
  const dist = getScoreDistribution(school.short)
  const trajectory = getSchoolTrajectory(school.short)

  // Intervention impact data
  const impactData = neliStudents.map((p: any) => ({
    name: p.name.split(' ')[0],
    initial: p.is,
    current: p.es ?? p.is,
  }))

  // Area chart — TEL TED vs whole class
  const areaData = trajectory.map((t: any, i: number) => {
    const neliAvg = neliStudents.length ? avg(neliStudents.map((p: any) => {
      const start = p.is
      const end = p.es ?? p.is
      const step = (end - start) / Math.max(trajectory.length - 1, 1)
      return Math.round((start + step * i) * 10) / 10
    })) : null
    return { ...t, neliAvg, classAvg: t.score }
  })

  // Radar — school subtests
  const radarData = ['recVocab', 'expVocab', 'grammar', 'listening'].map(key => {
    const label = key === 'recVocab' ? 'Rec Vocab' : key === 'expVocab' ? 'Exp Vocab' : key === 'grammar' ? 'Grammar' : 'Listening'
    const vals = pupils.map((p: any) => p.subscores?.[key]).filter(Boolean)
    return { subject: label, value: avg(vals) }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score Distribution */}
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Score Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dist} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="range" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                {dist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Intervention Impact */}
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Intervention Impact</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={impactData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis domain={[50, 110]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="initial" name="Initial" fill="#C8960C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" name="Current" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Over Year */}
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Progress Over Year</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis domain={[60, 110]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
              <ReferenceLine y={85} stroke="#EF444480" strokeDasharray="5 5" />
              <ReferenceLine y={100} stroke="#22C55E80" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="classAvg" name="Whole Class" stroke="#1B3060" fill="#1B3060" fillOpacity={0.2} />
              {neliStudents.length > 0 && <Area type="monotone" dataKey="neliAvg" name="TEL TED" stroke="#C8960C" fill="#C8960C" fillOpacity={0.2} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subtest Radar */}
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Subtest Profile</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1F2937" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} tick={{ fill: '#6B7280', fontSize: 10 }} />
              <Radar name="School Avg" dataKey="value" stroke="#0D9488" fill="#0D9488" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* School Notes */}
      <div className="rounded-xl p-4" style={{ ...darkBg }}>
        <h4 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>School Notes</h4>
        <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
          Week {school.weeks} of 20. {school.status === 'good' ? 'Programme on track.' : school.status === 'warning' ? 'Programme requires monitoring — some students not yet assessed.' : 'Programme behind schedule — immediate attention required.'}{' '}
          {neliStudents.length} students receiving TEL TED support.{' '}
          {neliStudents[0] && `${neliStudents[0].name} due for reassessment.`}{' '}
          End-of-year LanguageScreen scheduled for June 2026.
        </p>
      </div>
    </div>
  )
}

// ── INNER TAB 2: LANGUAGESCREEN ─────────────────────────────────────────────

function SchoolLanguageScreenTab({ school, pupils, onSelectPupil }: { school: any; pupils: any[]; onSelectPupil: (p: any) => void }) {
  const assessed = pupils.filter((p: any) => p.es != null)
  const pctAssessed = Math.round((assessed.length / pupils.length) * 100)
  const avgScore = assessed.length ? avg(assessed.map((p: any) => p.es)) : null
  const belowThreshold = pupils.filter((p: any) => (p.es ?? p.is) < 85).length
  const scores = pupils.map((p: any) => p.es ?? p.is)
  const scoreRange = `${Math.min(...scores)} — ${Math.max(...scores)}`

  // SVoR scatter data
  const svorData = pupils.map((p: any) => ({
    name: p.name,
    x: (p.subscores?.recVocab ?? 85) + (p.subscores?.grammar ?? 85),
    y: (p.subscores?.expVocab ?? 85) + (p.subscores?.listening ?? 85),
    score: p.es ?? p.is,
  }))

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '% Assessed', value: `${pctAssessed}%`, color: '#0D9488' },
          { label: 'Avg Score', value: avgScore ?? '—', color: '#3B82F6' },
          { label: 'Below Threshold (<85)', value: belowThreshold, color: '#EF4444' },
          { label: 'Score Range', value: scoreRange, color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ ...darkBg }}>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Assessment Table */}
      <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#0D0E14' }}>
                {['Student', 'Rec Vocab', 'Exp Vocab', 'Grammar', 'Listening', 'Total', 'Band', 'vs Initial', 'Action'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pupils.map((p: any) => {
                const score = p.es ?? p.is
                const light = getLight(score)
                const gain = p.es ? p.es - p.is : null
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1F293740' }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: lc(light) + '20', color: lc(light) }}>
                          {p.name.split(' ').map((w: string) => w[0]).join('')}
                        </div>
                        {p.name}
                        {p.neli && <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(200,150,12,0.15)', color: '#C8960C' }}>TEL TED</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.subscores?.recVocab ?? '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.subscores?.expVocab ?? '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.subscores?.grammar ?? '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.subscores?.listening ?? '—'}</td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: lc(light) }}>{score}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lb(light), color: lc(light) }}>{ll(light)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {gain != null ? (
                        <span style={{ color: gain > 0 ? '#22C55E' : gain < 0 ? '#EF4444' : '#6B7280', fontWeight: 600 }}>
                          {gain > 0 ? `↑ +${gain}` : gain < 0 ? `↓ ${gain}` : '—'}
                        </span>
                      ) : <span style={{ color: '#6B7280' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => onSelectPupil(p)} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>View Report</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple View of Reading Scatter */}
      <div style={cardStyle}>
        <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Simple View of Reading (SVoR)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis type="number" dataKey="x" name="Decoding Proxy" tick={{ fill: '#9CA3AF', fontSize: 10 }} label={{ value: 'Decoding (Rec Vocab + Grammar)', fill: '#6B7280', fontSize: 10, position: 'insideBottom', offset: -5 }} />
            <YAxis type="number" dataKey="y" name="Language Comprehension" tick={{ fill: '#9CA3AF', fontSize: 10 }} label={{ value: 'Comprehension', fill: '#6B7280', fontSize: 10, angle: -90, position: 'insideLeft' }} />
            <ZAxis dataKey="score" range={[40, 200]} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} formatter={(v: any, name: any) => [v, name === 'x' ? 'Decoding' : 'Comprehension']} />
            <ReferenceArea x1={0} x2={170} y1={0} y2={170} fill="#EF4444" fillOpacity={0.05} />
            <ReferenceArea x1={170} x2={300} y1={170} y2={300} fill="#22C55E" fillOpacity={0.05} />
            <Scatter data={svorData} fill="#C8960C" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── INNER TAB 3: PROGRESS ───────────────────────────────────────────────────

function SchoolProgressTab({ school, pupils, neliStudents }: { school: any; pupils: any[]; neliStudents: any[] }) {
  const trajectory = getSchoolTrajectory(school.short)

  // Individual progress bars — sort by gain
  const progressStudents = neliStudents.map((p: any) => ({
    ...p,
    gain: p.es ? p.es - p.is : 0,
    current: p.es ?? p.is,
    pctSessions: p.neliExpected ? Math.round((p.neliSessions / p.neliExpected) * 100) : 0,
  })).sort((a: any, b: any) => b.gain - a.gain)

  return (
    <div className="space-y-4">
      {/* Class-wide progress chart */}
      <div style={cardStyle}>
        <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Class-Wide Progress</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trajectory} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis domain={[75, 105]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
            <ReferenceLine y={85} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'Support', fill: '#EF4444', fontSize: 10 }} />
            <ReferenceLine y={100} stroke="#22C55E" strokeDasharray="5 5" label={{ value: 'Age Expected', fill: '#22C55E', fontSize: 10 }} />
            <Line type="monotone" dataKey="score" stroke="#0D9488" strokeWidth={2} dot={{ r: 4, fill: '#0D9488' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Individual progress bars */}
      <div style={cardStyle}>
        <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Individual Student Progress</h4>
        <div className="space-y-3">
          {progressStudents.map((p: any) => {
            const minVal = Math.min(p.is, p.current) - 10
            const maxVal = 120
            const range = maxVal - minVal
            const initialPct = ((p.is - minVal) / range) * 100
            const currentPct = ((p.current - minVal) / range) * 100
            const lightI = getLight(p.is)
            const lightE = getLight(p.current)
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0 text-right">
                  <p className="text-xs font-semibold truncate" style={{ color: '#F9FAFB' }}>{p.name.split(' ')[0]}</p>
                </div>
                <div className="flex-1 relative h-6 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
                  {/* Zone bands */}
                  <div className="absolute inset-y-0 rounded-l-lg" style={{ left: 0, width: `${((85 - minVal) / range) * 100}%`, backgroundColor: 'rgba(239,68,68,0.1)' }} />
                  <div className="absolute inset-y-0" style={{ left: `${((85 - minVal) / range) * 100}%`, width: `${((96 - 85) / range) * 100}%`, backgroundColor: 'rgba(245,158,11,0.1)' }} />
                  {/* Arrow */}
                  <div className="absolute top-1/2 h-0.5" style={{ left: `${Math.min(initialPct, currentPct)}%`, width: `${Math.abs(currentPct - initialPct)}%`, backgroundColor: p.gain > 0 ? '#22C55E' : '#EF4444', transform: 'translateY(-50%)' }} />
                  {/* Initial square */}
                  <div className="absolute top-1/2 w-3 h-3 rounded-sm" style={{ left: `${initialPct}%`, backgroundColor: lc(lightI), transform: 'translate(-50%,-50%)', border: '1px solid rgba(255,255,255,0.3)' }} />
                  {/* Current circle */}
                  <div className="absolute top-1/2 w-3.5 h-3.5 rounded-full" style={{ left: `${currentPct}%`, backgroundColor: lc(lightE), transform: 'translate(-50%,-50%)', border: '2px solid rgba(255,255,255,0.5)' }} />
                </div>
                <div className="w-16 flex-shrink-0 text-right">
                  <span className="text-xs font-bold" style={{ color: p.gain > 0 ? '#22C55E' : p.gain < 0 ? '#EF4444' : '#6B7280' }}>
                    {p.gain > 0 ? `+${p.gain}` : p.gain || '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress Summary Table */}
      <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0D0E14' }}>
              {['Student', 'Initial', 'Current', 'Gain', 'Sessions', '% Complete', 'On Track', 'Interventionist'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {progressStudents.map((p: any) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1F293740', backgroundColor: p.pctSessions < 85 ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</td>
                <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.is}</td>
                <td className="px-3 py-2.5 font-semibold" style={{ color: p.es ? lc(getLight(p.es)) : '#6B7280' }}>{p.es ?? '—'}</td>
                <td className="px-3 py-2.5 font-bold" style={{ color: p.gain > 0 ? '#22C55E' : '#6B7280' }}>{p.gain > 0 ? `+${p.gain}` : p.gain || '—'}</td>
                <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.neliSessions ?? '—'}/{p.neliExpected ?? '—'}</td>
                <td className="px-3 py-2.5" style={{ color: p.pctSessions < 85 ? '#F59E0B' : '#D1D5DB' }}>{p.pctSessions}%</td>
                <td className="px-3 py-2.5">{p.pctSessions >= 85 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#F59E0B' }}>⚠</span>}</td>
                <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{p.interventionist ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── INNER TAB 4: STUDENTS ───────────────────────────────────────────────────

function SchoolStudentsTab({ school, pupils, filter, onFilterChange, onSelectPupil }: { school: any; pupils: any[]; filter: string; onFilterChange: (f: string) => void; onSelectPupil: (p: any) => void }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'neli', label: 'TEL TED Only' },
    { id: 'eal', label: 'EAL' },
    { id: 'sen', label: 'SEN' },
    { id: 'fsm', label: 'FSM/FRL' },
  ]

  const filtered = pupils.filter((p: any) => {
    if (filter === 'neli') return p.neli
    if (filter === 'eal') return p.eal
    if (filter === 'sen') return p.sen?.status && p.sen.status !== 'None'
    if (filter === 'fsm') return p.fsm
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.id} onClick={() => onFilterChange(f.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: filter === f.id ? '#0D9488' : '#111318', color: filter === f.id ? '#F9FAFB' : '#6B7280', border: filter === f.id ? '1px solid #0D9488' : '1px solid #1F2937' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Student cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p: any) => {
          const score = p.es ?? p.is
          const light = getLight(score)
          const sessions = p.neliSessions && p.neliExpected ? `${p.neliSessions}/${p.neliExpected}` : null
          const sessionPct = p.neliSessions && p.neliExpected ? Math.round((p.neliSessions / p.neliExpected) * 100) : null
          return (
            <div key={p.id} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: lc(light) + '20', color: lc(light) }}>
                  {p.name.split(' ').map((w: string) => w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>{p.dob} · Class {p.class}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.eal && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>EAL</span>}
                    {p.fsm && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>FRL</span>}
                    {p.neli && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(200,150,12,0.15)', color: '#C8960C' }}>TEL TED</span>}
                    {p.sen?.status && p.sen.status !== 'None' && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>SEN</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{p.is}</span>
                  <span style={{ color: '#6B7280' }}>→</span>
                  <span className="text-xs font-bold" style={{ color: p.es ? lc(light) : '#6B7280' }}>{p.es ?? '—'}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: lb(light), color: lc(light) }}>{ll(light)}</span>
                </div>
              </div>

              {sessions && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span style={{ color: '#6B7280' }}>Sessions: {sessions}</span>
                    <span style={{ color: '#6B7280' }}>{sessionPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(sessionPct || 0, 100)}%`, backgroundColor: (sessionPct || 0) >= 85 ? '#22C55E' : '#F59E0B' }} />
                  </div>
                </div>
              )}

              {p.leuven && (
                <div className="mt-2 flex gap-2">
                  <span className="text-[10px]" style={{ color: '#6B7280' }}>Wellbeing: {'●'.repeat(p.leuven.wellbeing)}{'○'.repeat(5 - p.leuven.wellbeing)}</span>
                </div>
              )}

              <button onClick={() => onSelectPupil(p)} className="mt-3 w-full text-xs font-semibold py-2 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
                View Full Profile
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── INNER TAB 5: AT RISK ────────────────────────────────────────────────────

function SchoolAtRiskTab({ school, pupils, onSelectPupil }: { school: any; pupils: any[]; onSelectPupil: (p: any) => void }) {
  const redStudents = pupils.filter((p: any) => (p.es ?? p.is) < 85)
  const amberStudents = pupils.filter((p: any) => { const s = p.es ?? p.is; return s >= 85 && s < 90 })
  const sessionsBehind = pupils.filter((p: any) => p.neli && p.neliExpected && p.neliSessions < p.neliExpected * 0.85)
  const lowAttendance = pupils.filter((p: any) => p.attendance && p.attendance < 90)
  const ealStudents = pupils.filter((p: any) => p.eal)

  function RiskCard({ pupil, severity }: { pupil: any; severity: 'red' | 'amber' }) {
    const score = pupil.es ?? pupil.is
    const light = getLight(score)
    return (
      <div className="rounded-xl p-4" style={{ ...darkBg, borderLeft: `3px solid ${severity === 'red' ? '#EF4444' : '#F59E0B'}` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: lc(light) + '20', color: lc(light) }}>
              {pupil.name.split(' ').map((w: string) => w[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{pupil.name}</p>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>Score: {score} · Week {pupil.neliWeek ?? '—'}</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lb(light), color: lc(light) }}>{ll(light)}</span>
        </div>
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
          {severity === 'red' ? `Scoring below 85 — needs targeted intervention support. ${pupil.sen?.plan || 'Review intervention plan.'}` : `Scoring in monitor range (85-89). Continue current support and track closely.`}
        </p>
        <div className="flex gap-2 mt-3">
          <button className="text-[10px] font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: severity === 'red' ? '#EF4444' : '#F59E0B', color: '#fff' }}>
            {severity === 'red' ? 'Schedule Session' : 'Check In'}
          </button>
          <button onClick={() => onSelectPupil(pupil)} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
            View Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Red Section */}
      {redStudents.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#EF4444' }}>
            <span className="w-2 h-2 rounded-full bg-red-500" /> Immediate Action — Score Below 85 ({redStudents.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {redStudents.map((p: any) => <RiskCard key={p.id} pupil={p} severity="red" />)}
          </div>
        </div>
      )}

      {/* Amber Section */}
      {amberStudents.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#F59E0B' }}>
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Monitor Closely — Score 85-89 ({amberStudents.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {amberStudents.map((p: any) => <RiskCard key={p.id} pupil={p} severity="amber" />)}
          </div>
        </div>
      )}

      {/* Sessions Behind */}
      {sessionsBehind.length > 0 && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#F59E0B' }}>
            <Clock size={14} /> Sessions Behind Schedule ({sessionsBehind.length})
          </h4>
          {sessionsBehind.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F293740' }}>
              <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</span>
              <span className="text-xs" style={{ color: '#F59E0B' }}>{p.neliSessions}/{p.neliExpected} sessions ({Math.round((p.neliSessions / p.neliExpected) * 100)}%)</span>
            </div>
          ))}
        </div>
      )}

      {/* Low Attendance */}
      {lowAttendance.length > 0 && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#EF4444' }}>
            <AlertTriangle size={14} /> Attendance Concern — Below 90% ({lowAttendance.length})
          </h4>
          {lowAttendance.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F293740' }}>
              <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</span>
              <span className="text-xs" style={{ color: '#EF4444' }}>{p.attendance}%</span>
            </div>
          ))}
        </div>
      )}

      {/* EAL Support */}
      {ealStudents.length > 0 && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#3B82F6' }}>
            <GraduationCap size={14} /> EAL Support ({ealStudents.length})
          </h4>
          {ealStudents.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F293740' }}>
              <div>
                <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</span>
                <span className="text-[10px] ml-2" style={{ color: '#6B7280' }}>{(p as any).homeLanguage || 'EAL'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>{(p as any).ealStage || 'Developing'}</span>
            </div>
          ))}
        </div>
      )}

      {redStudents.length === 0 && amberStudents.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 size={48} style={{ color: '#22C55E', margin: '0 auto 12px' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>No at-risk students</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>All students are scoring above threshold</p>
        </div>
      )}
    </div>
  )
}

// ── INNER TAB 6: TRAINING ───────────────────────────────────────────────────

function SchoolTrainingTab({ school, staff }: { school: any; staff: any[] }) {
  const totalHrs = staff.reduce((s: number, st: any) => s + (st.c1 ? 5 : 0) + (st.c2 ? 5 : 0) + (st.c3 ? 3 : 0), 0)
  const targetHrs = staff.length * 48

  return (
    <div className="space-y-4">
      {/* Staff Training Table */}
      <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
          <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Staff Training Status</h4>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0D0E14' }}>
              {['Staff Member', 'Role', 'Course 1', 'Course 2', 'Course 3', 'Status'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s: any, i: number) => {
              const complete = s.c1 && s.c2 && s.c3
              return (
                <tr key={i} style={{ borderBottom: '1px solid #1F293740' }}>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>{s.name}</td>
                  <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{s.role}</td>
                  <td className="px-3 py-2.5">{s.c1 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                  <td className="px-3 py-2.5">{s.c2 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                  <td className="px-3 py-2.5">{s.c3 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: complete ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: complete ? '#22C55E' : '#F59E0B' }}>
                      {complete ? 'Fully Trained' : 'In Progress'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FL_COURSES.slice(0, 3).map(course => (
          <div key={course.id} className="rounded-xl p-4" style={{ ...darkBg }}>
            <div className="text-2xl mb-2">{course.imgEmoji}</div>
            <h5 className="text-xs font-bold mb-1" style={{ color: '#F9FAFB' }}>{course.title}</h5>
            <p className="text-[10px] mb-2" style={{ color: '#6B7280' }}>{course.duration} · {course.level}</p>
            <div className="space-y-1">
              {staff.map((s: any, i: number) => {
                const done = course.id === 1 ? s.c1 : course.id === 2 ? s.c2 : s.c3
                return (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span style={{ color: '#D1D5DB' }}>{s.name}</span>
                    {done ? <span style={{ color: '#22C55E' }}>Complete</span> : <span style={{ color: '#6B7280' }}>Not started</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CPD Hours */}
      <div style={cardStyle}>
        <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>CPD Hours Tracker</h4>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: '#1F2937' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min((totalHrs / targetHrs) * 100, 100)}%`, backgroundColor: '#0D9488' }} />
          </div>
          <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{totalHrs}/{targetHrs} hrs</span>
        </div>
        <div className="space-y-2">
          {staff.map((s: any, i: number) => {
            const hrs = (s.c1 ? 5 : 0) + (s.c2 ? 5 : 0) + (s.c3 ? 3 : 0)
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs w-32 truncate" style={{ color: '#D1D5DB' }}>{s.name}</span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{ width: `${(hrs / 48) * 100}%`, backgroundColor: hrs >= 13 ? '#22C55E' : '#F59E0B' }} />
                </div>
                <span className="text-[10px] w-10 text-right" style={{ color: '#6B7280' }}>{hrs} hrs</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* TEL TED Learning Progress */}
      <div style={cardStyle}>
        <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>TEL TED E-Learning Progress</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {['Week 1', 'Week 2', 'Week 3'].map((week, wi) => (
            <div key={week} className="rounded-lg p-3" style={{ backgroundColor: '#0D0E14' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#C8960C' }}>{week}</p>
              {staff.map((s: any, si: number) => {
                const completed = wi === 0 ? s.c1 : wi === 1 ? s.c2 : s.c3
                return (
                  <div key={si} className="flex items-center justify-between py-1 text-[10px]">
                    <span style={{ color: '#D1D5DB' }}>{s.name.split(' ')[0]}</span>
                    {completed ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#6B7280' }}>—</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── INNER TAB 7: SESSIONS ───────────────────────────────────────────────────

function SchoolSessionsTab({ school, neliStudents }: { school: any; neliStudents: any[] }) {
  const totalDelivered = neliStudents.reduce((s: number, p: any) => s + (p.neliSessions || 0), 0)
  const totalExpected = neliStudents.reduce((s: number, p: any) => s + (p.neliExpected || 0), 0)
  const avgPerWeek = school.weeks > 0 ? Math.round(totalDelivered / school.weeks * 10) / 10 : 0
  const mostConsistent = neliStudents.length ? [...neliStudents].sort((a: any, b: any) => (b.neliSessions / b.neliExpected) - (a.neliSessions / a.neliExpected))[0] : null
  const avgAttendance = neliStudents.length ? Math.round(neliStudents.reduce((s: number, p: any) => s + (p.attendance || 0), 0) / neliStudents.length) : 0

  return (
    <div className="space-y-4">
      {/* Week Grid */}
      <div style={cardStyle}>
        <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Programme Week Grid</h4>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 20 }, (_, i) => {
            const weekNum = i + 1
            const completed = weekNum < school.weeks
            const current = weekNum === school.weeks
            const upcoming = weekNum > school.weeks
            return (
              <div key={i} className="flex items-center justify-center rounded-lg text-xs font-bold py-2"
                style={{
                  backgroundColor: completed ? 'rgba(34,197,94,0.15)' : current ? 'rgba(200,150,12,0.2)' : 'rgba(31,41,55,0.5)',
                  color: completed ? '#22C55E' : current ? '#C8960C' : '#4B5563',
                  border: current ? '2px solid #C8960C' : '1px solid transparent',
                }}>
                {weekNum}
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }} /><span className="text-[10px]" style={{ color: '#6B7280' }}>Completed</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(200,150,12,0.2)', border: '1px solid #C8960C' }} /><span className="text-[10px]" style={{ color: '#6B7280' }}>Current Week</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(31,41,55,0.5)' }} /><span className="text-[10px]" style={{ color: '#6B7280' }}>Upcoming</span></div>
        </div>
      </div>

      {/* Session Schedule */}
      <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
          <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>This Week&apos;s Sessions</h4>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0D0E14' }}>
              {['Day', 'Type', 'Students', 'Duration', 'Interventionist', 'Status'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { day: 'Monday', type: 'Group Session', students: neliStudents.length, duration: '20 min', status: 'done' },
              { day: 'Tuesday', type: 'Individual Session', students: 1, duration: '10 min', status: 'done' },
              { day: 'Wednesday', type: 'Group Session', students: neliStudents.length, duration: '20 min', status: 'current' },
              { day: 'Thursday', type: 'Individual Session', students: 2, duration: '10 min each', status: 'upcoming' },
              { day: 'Friday', type: 'Group Session + Assessment', students: neliStudents.length, duration: '30 min', status: 'upcoming' },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1F293740', opacity: row.status === 'done' ? 0.5 : 1 }}>
                <td className="px-3 py-2.5" style={{ color: '#F9FAFB' }}>{row.day}</td>
                <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{row.type}</td>
                <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{row.students}</td>
                <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{row.duration}</td>
                <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{school.coordinator}</td>
                <td className="px-3 py-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                    backgroundColor: row.status === 'done' ? 'rgba(34,197,94,0.15)' : row.status === 'current' ? 'rgba(200,150,12,0.15)' : 'rgba(31,41,55,0.5)',
                    color: row.status === 'done' ? '#22C55E' : row.status === 'current' ? '#C8960C' : '#6B7280',
                  }}>{row.status === 'done' ? 'Complete' : row.status === 'current' ? 'In Progress' : 'Upcoming'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Session Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Delivered', value: totalDelivered, color: '#0D9488' },
          { label: 'Expected at Week', value: totalExpected, color: '#3B82F6' },
          { label: 'Per Week Avg', value: avgPerWeek, color: '#8B5CF6' },
          { label: 'Most Consistent', value: mostConsistent?.name?.split(' ')[0] ?? '—', color: '#22C55E' },
          { label: 'Attendance Rate', value: `${avgAttendance}%`, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ ...darkBg }}>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── INNER TAB 8: REPORTS ────────────────────────────────────────────────────

function SchoolReportsTab({ school }: { school: any }) {
  const [generating, setGenerating] = useState<string | null>(null)

  const reports = [
    { id: 'term-summary', name: 'End of Term TEL TED Summary', icon: '📋' },
    { id: 'pupil-progress', name: 'Student Progress Report', icon: '📈' },
    { id: 'at-risk', name: 'At-Risk Student Report', icon: '⚠️' },
    { id: 'subtest', name: 'Subtest Analysis', icon: '🔍' },
    { id: 'inspection', name: 'State Inspection Evidence Pack', icon: '🛡️' },
    { id: 'parent', name: 'Parent Communication Pack', icon: '✉️' },
  ]

  function handleGenerate(id: string) {
    setGenerating(id)
    setTimeout(() => setGenerating(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Reports — {school.name}</h4>
        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#C8960C', color: '#fff' }}>
          <Download size={12} /> Download All as ZIP
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {reports.map(r => (
          <div key={r.id} className="rounded-xl p-4" style={{ ...darkBg }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{r.icon}</span>
              <h5 className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{r.name}</h5>
            </div>
            <p className="text-[10px] mb-3" style={{ color: '#6B7280' }}>Pre-filtered to {school.name}</p>
            <button onClick={() => handleGenerate(r.id)} disabled={generating === r.id}
              className="w-full text-xs font-semibold py-2 rounded-lg" style={{ backgroundColor: generating === r.id ? '#1F2937' : '#0D9488', color: '#F9FAFB' }}>
              {generating === r.id ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — DISTRICT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function DistrictDashboard() {
  const [activeSchoolTab, setActiveSchoolTab] = useState('summary')

  return (
    <div className="space-y-4 p-2">
      {/* Level 1 — Header */}
      <DistrictHeader />
      <DistrictAlertStrip />

      {/* Level 2 — Charts Row */}
      <DistrictChartsRow />

      {/* Level 3 — School Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" style={{ borderBottom: '2px solid #1F2937' }}>
        <button onClick={() => setActiveSchoolTab('summary')}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-t-lg"
          style={{
            backgroundColor: activeSchoolTab === 'summary' ? '#111318' : 'transparent',
            color: activeSchoolTab === 'summary' ? '#C8960C' : '#6B7280',
            borderBottom: activeSchoolTab === 'summary' ? '3px solid #C8960C' : '3px solid transparent',
          }}>
          <span>🏫</span> District Summary
        </button>
        {DISTRICT_SCHOOLS.map(school => (
          <button key={school.short} onClick={() => setActiveSchoolTab(school.short)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-t-lg"
            style={{
              backgroundColor: activeSchoolTab === school.short ? '#111318' : 'transparent',
              color: activeSchoolTab === school.short ? '#F9FAFB' : '#6B7280',
              borderBottom: activeSchoolTab === school.short ? '3px solid #C8960C' : '3px solid transparent',
            }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: statusColor(school.status) + '25', color: statusColor(school.status) }}>
              {school.short}
            </div>
            {school.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeSchoolTab === 'summary' && <DistrictSummaryTab />}
      {DISTRICT_SCHOOLS.map(school => (
        activeSchoolTab === school.short ? <SchoolTabContent key={school.short} school={school} /> : null
      ))}
    </div>
  )
}
