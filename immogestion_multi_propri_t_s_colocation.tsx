import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Trash2, 
  Key, 
  Building2, 
  Wrench, 
  CalendarDays, 
  Settings, 
  Building, 
  ArrowLeftRight, 
  DollarSign, 
  TrendingDown, 
  Filter, 
  AlertOctagon, 
  TrendingUp, 
  Receipt, 
  Download, 
  LogOut,
  BookOpen,
  CheckCircle2,
  Send,
  Sun,
  Moon,
  Sparkles,
  Printer,
  Cloud,
  Check,
  Clock
} from 'lucide-react';

const START_DATE = new Date('2026-01-05');

// Utilitaire de formatage de numéro de téléphone canadien (ex: 8191234567 -> (819) 123-4567)
function formatPhoneCanadian(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Utilitaire de validation basique de courriel
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getWeekInfo(offsetWeeks = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetWeeks * 7 * 24 * 60 * 60 * 1000);
  const diffTime = Math.max(0, targetDate - START_DATE);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(diffDays / 7);

  const dayOfWeek = targetDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + daysToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (d) => `${d.getDate()} ${['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][d.getMonth()]}`;

  return {
    weekIndex,
    weekKey: `w_${monday.getFullYear()}_${weekIndex}`,
    startDateStr: formatDate(monday),
    endDateStr: formatDate(sunday),
    year: monday.getFullYear()
  };
}

const DEFAULT_BUILDINGS = [
  {
    id: 'bld_savard',
    name: '4060 Rue Savard',
    city: 'Trois-Rivières',
    address: '4060 Rue Savard',
    type: 'coliving',
    regulations: "1. Respect de la quiétude des lieux entre 22h et 7h.\n2. Sortie des bacs de recyclage et déchets les lundis matin.\n3. Interdiction de fumer dans les aires communes.\n4. Animaux permis sous réserve d'approbation.",
    rooms: [
      { id: 1, number: 1, level: 'RDC', occupant: 'Jean Dupont', active: true, email: 'jean.d@example.com', password: 'pass123', phone: '(819) 123-4567', carrier: 'bell', rentAmount: 550, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 2, number: 2, level: 'RDC', occupant: 'Sophie Martin', active: true, email: 'sophie.m@example.com', password: 'pass123', phone: '(819) 234-5678', carrier: 'telus', rentAmount: 525, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 3, number: 3, level: 'RDC', occupant: 'Luc Tremblay', active: true, email: 'luc.t@example.com', password: 'pass123', phone: '(819) 345-6789', carrier: 'rogers', rentAmount: 550, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 4, number: 4, level: 'RDC', occupant: 'Élodie Roy', active: true, email: 'elodie.r@example.com', password: 'pass123', phone: '(819) 456-7890', carrier: 'videotron', rentAmount: 525, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 5, number: 5, level: 'Sous-Sol', occupant: 'Alexandre Côté', active: true, email: 'alex.c@example.com', password: 'pass123', phone: '(819) 567-8901', carrier: 'bell', rentAmount: 500, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 6, number: 6, level: 'Sous-Sol', occupant: 'Camille Gagnon', active: true, email: 'camille.g@example.com', password: 'pass123', phone: '(819) 678-9012', carrier: 'telus', rentAmount: 500, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 7, number: 7, level: 'Sous-Sol', occupant: 'Mathieu Lévesque', active: true, email: 'mathieu.l@example.com', password: 'pass123', phone: '(819) 789-0123', carrier: 'rogers', rentAmount: 500, leaseStart: '2025-09-01', leaseEnd: '2026-08-31' },
      { id: 8, number: 8, level: 'Sous-Sol', occupant: '', active: false, email: '', password: 'pass123', phone: '', carrier: 'bell', rentAmount: 500, leaseStart: '', leaseEnd: '' }
    ]
  }
];

const INITIAL_ADMINS = [
  {
    id: 'adm_master',
    name: 'Propriétaire Principal',
    email: 'admin@gestion.com',
    password: 'admin123',
    recoveryPin: '7777',
    allBuildings: true,
    allowedBuildingIds: [],
    scopeLevel: 'all'
  }
];

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [toast, setToast] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => { setToast(null); }, 4000);
  };

  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('auth_user_session_v3');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminsList, setAdminsList] = useState(() => {
    const saved = localStorage.getItem('multi_admins_list_v2');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  const [buildings, setBuildings] = useState(() => {
    const saved = localStorage.getItem('multi_blds_v3');
    return saved ? JSON.parse(saved) : DEFAULT_BUILDINGS;
  });

  const [deletedBuildings, setDeletedBuildings] = useState(() => {
    const saved = localStorage.getItem('multi_deleted_blds_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeBuildingId, setActiveBuildingId] = useState(() => {
    const saved = localStorage.getItem('multi_active_bld_id_v2');
    return saved || 'bld_savard';
  });

  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('sb_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('sb_key') || '');
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPinInput, setRecoveryPinInput] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const [dutyWeekOffset, setDutyWeekOffset] = useState(0);

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('multi_expenses_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenseCategory, setExpenseCategory] = useState('hypotheque');
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(true);
  const [expenseHasInvoice, setExpenseHasInvoice] = useState('yes');
  const [expenseNotes, setExpenseNotes] = useState('');

  const [extraIncomes] = useState(() => {
    const saved = localStorage.getItem('multi_extra_incomes_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [violations, setViolations] = useState(() => {
    const saved = localStorage.getItem('multi_violations_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [violationRoomId, setViolationRoomId] = useState('');
  const [violationType, setViolationType] = useState('retard_loyer');
  const [violationAmount, setViolationAmount] = useState('');
  const [violationDate] = useState(new Date().toISOString().split('T')[0]);
  const [violationMonthTarget] = useState('Novembre 2026');
  const [violationDesc, setViolationDesc] = useState('');
  const [violationSolution, setViolationSolution] = useState('');

  const [swaps, setSwaps] = useState(() => {
    const saved = localStorage.getItem('multi_swaps_v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [swapTargetRoomId, setSwapTargetRoomId] = useState('broadcast');
  const [swapReason, setSwapReason] = useState('');

  const [reminderConfig, setReminderConfig] = useState(() => {
    const saved = localStorage.getItem('multi_reminder_config_v1');
    return saved ? JSON.parse(saved) : { enabled: true, dayOfWeek: '4', time: '09:00', channel: 'both', message: 'Rappel : Vous êtes responsable de votre niveau cette semaine (poubelles, bacs et propreté).' };
  });

  const [issues, setIssues] = useState(() => {
    const saved = localStorage.getItem('multi_issues_v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [issueCategory, setIssueCategory] = useState('plomberie');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');

  const [completions, setCompletions] = useState(() => {
    const saved = localStorage.getItem('multi_completions_v3');
    return saved ? JSON.parse(saved) : {};
  });

  const [customDutyInstructions] = useState(() => {
    const saved = localStorage.getItem('multi_custom_duty_instructions_v2');
    return saved || "En tant que responsable de votre niveau cette semaine, vous devez :\n1. Sortir les poubelles et bacs de recyclage.\n2. Veiller à la propreté des aires communes.\n3. Signaler toute anomalie.";
  });

  const [manualDutyAssignments, setManualDutyAssignments] = useState(() => {
    const saved = localStorage.getItem('multi_manual_duty_assignments_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [kpiPeriod, setKpiPeriod] = useState('month');
  const [adminTab, setAdminTab] = useState('kpi');

  const [editingRoom, setEditingRoom] = useState(null);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPassword, setTenantPassword] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantCarrier, setTenantCarrier] = useState('bell');
  const [tenantRentAmount, setTenantRentAmount] = useState('');
  const [tenantLeaseStart, setTenantLeaseStart] = useState('');
  const [tenantLeaseEnd, setTenantLeaseEnd] = useState('');
  const [tenantFormErrors, setTenantFormErrors] = useState({});

  const [newBldName, setNewBldName] = useState('');
  const [newBldCity, setNewBldCity] = useState('Trois-Rivières');
  const [newBldAddress, setNewBldAddress] = useState('');
  const [newBldType, setNewBldType] = useState('coliving');
  const [newBldUnitsCount, setNewBldUnitsCount] = useState(4);
  const [customUnits, setCustomUnits] = useState([
    { number: 1, level: 'RDC' },
    { number: 2, level: 'RDC' },
    { number: 3, level: 'Niveau 2' },
    { number: 4, level: 'Sous-Sol' }
  ]);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [buildingRegulationsEdit, setBuildingRegulationsEdit] = useState('');

  useEffect(() => { localStorage.setItem('auth_user_session_v3', JSON.stringify(authUser)); }, [authUser]);
  useEffect(() => { localStorage.setItem('multi_admins_list_v2', JSON.stringify(adminsList)); }, [adminsList]);
  useEffect(() => { localStorage.setItem('multi_blds_v3', JSON.stringify(buildings)); }, [buildings]);
  useEffect(() => { localStorage.setItem('multi_deleted_blds_v2', JSON.stringify(deletedBuildings)); }, [deletedBuildings]);
  useEffect(() => { localStorage.setItem('multi_active_bld_id_v2', activeBuildingId); }, [activeBuildingId]);
  useEffect(() => { localStorage.setItem('multi_expenses_v2', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('multi_extra_incomes_v2', JSON.stringify(extraIncomes)); }, [extraIncomes]);
  useEffect(() => { localStorage.setItem('multi_violations_v2', JSON.stringify(violations)); }, [violations]);
  useEffect(() => { localStorage.setItem('multi_swaps_v3', JSON.stringify(swaps)); }, [swaps]);
  useEffect(() => { localStorage.setItem('multi_reminder_config_v1', JSON.stringify(reminderConfig)); }, [reminderConfig]);
  useEffect(() => { localStorage.setItem('multi_issues_v3', JSON.stringify(issues)); }, [issues]);
  useEffect(() => { localStorage.setItem('multi_completions_v3', JSON.stringify(completions)); }, [completions]);
  useEffect(() => { localStorage.setItem('multi_custom_duty_instructions_v2', customDutyInstructions); }, [customDutyInstructions]);
  useEffect(() => { localStorage.setItem('multi_manual_duty_assignments_v2', JSON.stringify(manualDutyAssignments)); }, [manualDutyAssignments]);

  const currentBuilding = useMemo(() => buildings.find(b => b.id === activeBuildingId) || buildings[0], [buildings, activeBuildingId]);

  const accessibleBuildings = useMemo(() => {
    if (!authUser || authUser.role !== 'admin') return buildings;
    if (authUser.isMaster || authUser.allBuildings) return buildings;
    return buildings.filter(b => (authUser.allowedBuildingIds || []).includes(b.id));
  }, [buildings, authUser]);

  const currentWeek = useMemo(() => getWeekInfo(0), []);
  const selectedDutyWeek = useMemo(() => getWeekInfo(dutyWeekOffset), [dutyWeekOffset]);

  const filteredBuildingRooms = useMemo(() => {
    if (!currentBuilding) return [];
    if (!authUser || authUser.role !== 'admin' || authUser.scopeLevel === 'all') return currentBuilding.rooms;
    if (authUser.scopeLevel === 'rdc') {
      return currentBuilding.rooms.filter(r => r.level?.toLowerCase().includes('rdc'));
    }
    if (authUser.scopeLevel === 'sous-sol') {
      return currentBuilding.rooms.filter(r => r.level?.toLowerCase().includes('sous-sol') || r.level?.toLowerCase().includes('ss'));
    }
    return currentBuilding.rooms;
  }, [currentBuilding, authUser]);

  // MOTEUR D'ATTRIBUTION DYNAMIQUE AVEC PRIORITÉ AUX SWAPS VALIDÉS ET RÉATTRIBUTION AUTOMATIQUE EN CASCADE
  const getDutyManagerForLevel = (bld, level, targetWeekObj) => {
    if (!bld) return null;
    const levelRooms = bld.rooms.filter(r => r.active && r.level === level);
    if (levelRooms.length === 0) return null;

    // 1. Vérification d'un switch validé ou d'une affectation manuelle directe pour CETTE semaine précise
    const targetKey = `${bld.id}_${targetWeekObj.weekKey}_${level}`;
    const directManualId = manualDutyAssignments[targetKey];
    if (directManualId) {
      const room = levelRooms.find(r => String(r.id) === String(directManualId));
      if (room) return room;
    }

    const directSwap = swaps.find(sw => 
      sw.buildingId === bld.id && 
      sw.level === level && 
      sw.status === 'accepted' && 
      sw.targetWeekKey === targetWeekObj.weekKey
    );
    if (directSwap) {
      const room = levelRooms.find(r => String(r.id) === String(directSwap.acceptorRoomId));
      if (room) return room;
    }

    // 2. Recherche du plus récent point d'ancrage (override ou switch validé) dans le passé pour décaler automatiquement le cycle
    let pivotOffset = null;
    let pivotRoomIndex = -1;

    for (let w = targetWeekObj.weekIndex - 1; w >= 0; w--) {
      const wObj = getWeekInfo(w - currentWeek.weekIndex);
      const wKey = `${bld.id}_${wObj.weekKey}_${level}`;
      
      const manualId = manualDutyAssignments[wKey];
      const acceptedSwap = swaps.find(sw => 
        sw.buildingId === bld.id && 
        sw.level === level && 
        sw.status === 'accepted' && 
        sw.targetWeekKey === wObj.weekKey
      );

      let anchorRoomId = null;
      if (acceptedSwap) {
        anchorRoomId = acceptedSwap.acceptorRoomId;
      } else if (manualId) {
        anchorRoomId = manualId;
      }

      if (anchorRoomId) {
        const foundIdx = levelRooms.findIndex(r => String(r.id) === String(anchorRoomId));
        if (foundIdx !== -1) {
          pivotOffset = w;
          pivotRoomIndex = foundIdx;
          break;
        }
      }
    }

    // 3. Application du décalage dynamique en cascade
    if (pivotOffset !== null && pivotRoomIndex !== -1) {
      const weeksElapsed = targetWeekObj.weekIndex - pivotOffset;
      const nextIndex = (pivotRoomIndex + weeksElapsed) % levelRooms.length;
      return levelRooms[nextIndex];
    }

    // Rotation automatique standard de base
    const autoIndex = targetWeekObj.weekIndex % levelRooms.length;
    return levelRooms[autoIndex];
  };

  const selectedDutyWeekManagers = useMemo(() => {
    if (!currentBuilding) return {};
    const uniqueLevels = [...new Set(currentBuilding.rooms.map(r => r.level).filter(Boolean))];
    const managersMap = {};

    uniqueLevels.forEach(level => {
      const levelRooms = currentBuilding.rooms.filter(r => r.active && r.level === level);
      const manager = getDutyManagerForLevel(currentBuilding, level, selectedDutyWeek);
      managersMap[level] = { manager, rooms: levelRooms };
    });

    return managersMap;
  }, [currentBuilding, selectedDutyWeek, activeBuildingId, manualDutyAssignments, swaps]);

  const printScheduleWeeks = useMemo(() => {
    if (!currentBuilding) return [];
    const weeks = [0, 1, 2, 3].map(offset => getWeekInfo(offset));
    const uniqueLevels = [...new Set(currentBuilding.rooms.map(r => r.level).filter(Boolean))];

    return weeks.map(w => {
      const levelMap = {};
      uniqueLevels.forEach(level => {
        const manager = getDutyManagerForLevel(currentBuilding, level, w);
        if (manager) {
          const unitPrefix = currentBuilding.type === 'coliving' ? 'Ch.' : 'Apt.';
          levelMap[level] = `${manager.occupant} (${unitPrefix} ${manager.number})`;
        } else {
          levelMap[level] = 'Non attribué';
        }
      });
      return { weekInfo: w, levels: levelMap };
    });
  }, [currentBuilding, activeBuildingId, manualDutyAssignments, swaps]);

  const activeTenantRoom = useMemo(() => {
    if (!authUser || authUser.role !== 'tenant' || !currentBuilding) return null;
    return currentBuilding.rooms.find(r => r.id === authUser.roomId);
  }, [authUser, currentBuilding]);

  // VÉRIFICATION SI LE LOCATAIRE EST RESPONSABLE (SOIT PAR ROTATION/MANUEL, SOIT EN TANT QU'ACCEPTANT D'UN SWITCH VALIDÉ)
  const isTenantDutyThisWeek = useMemo(() => {
    if (!activeTenantRoom) return false;
    const currentManager = getDutyManagerForLevel(currentBuilding, activeTenantRoom.level, selectedDutyWeek);
    return currentManager?.id === activeTenantRoom.id;
  }, [activeTenantRoom, currentBuilding, selectedDutyWeek, manualDutyAssignments, swaps]);

  const isTaskDoneThisWeek = useMemo(() => {
    if (!activeTenantRoom) return false;
    return !!completions[`${activeBuildingId}_${currentWeek.weekKey}_${activeTenantRoom.id}`];
  }, [activeTenantRoom, currentWeek, activeBuildingId, completions]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.buildingId === activeBuildingId);
  }, [expenses, activeBuildingId]);

  const kpiDateRange = useMemo(() => {
    const now = new Date();
    if (kpiPeriod === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    }
    if (kpiPeriod === '30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end: now };
    }
    if (kpiPeriod === '90days') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start, end: now };
    }
    if (kpiPeriod === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start, end };
    }
    return { start: new Date(2000, 0, 1), end: new Date(2099, 11, 31) };
  }, [kpiPeriod]);

  const kpiMetrics = useMemo(() => {
    if (!currentBuilding) {
      return { totalRevenue: 0, totalExpenses: 0, netCashflow: 0, occupancyRate: 0, occupiedCount: 0, totalCount: 0, problematicTenants: [] };
    }

    const totalRooms = currentBuilding.rooms.length;
    const occupiedRooms = currentBuilding.rooms.filter(r => r.active);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms.length / totalRooms) * 100) : 0;

    const baseRentIncome = occupiedRooms.reduce((sum, r) => sum + (Number(r.rentAmount) || 0), 0);
    const buildingExtraIncomes = extraIncomes.filter(inc => {
      if (inc.buildingId !== activeBuildingId) return false;
      if (!inc.date) return true;
      const d = new Date(inc.date);
      return d >= kpiDateRange.start && d <= kpiDateRange.end;
    });
    const extraIncomesTotal = buildingExtraIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalRevenue = baseRentIncome + extraIncomesTotal;

    const buildingExpenses = expenses.filter(exp => {
      if (exp.buildingId !== activeBuildingId) return false;
      if (!exp.date) return true;
      const d = new Date(exp.date);
      return d >= kpiDateRange.start && d <= kpiDateRange.end;
    });
    const totalExpenses = buildingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netCashflow = totalRevenue - totalExpenses;

    const buildingViolations = violations.filter(v => v.buildingId === activeBuildingId);
    const tenantProblemsMap = {};

    buildingViolations.forEach(v => {
      const occupantKey = v.occupant || `Unité #${v.roomId}`;
      if (!tenantProblemsMap[occupantKey]) {
        tenantProblemsMap[occupantKey] = {
          occupant: occupantKey,
          roomId: v.roomId,
          incidentsCount: 0,
          totalAmountDue: 0,
          details: []
        };
      }
      tenantProblemsMap[occupantKey].incidentsCount += 1;
      tenantProblemsMap[occupantKey].totalAmountDue += (Number(v.amountDue) || 0);
      tenantProblemsMap[occupantKey].details.push(v);
    });

    const problematicTenants = Object.values(tenantProblemsMap).sort((a, b) => b.incidentsCount - a.incidentsCount || b.totalAmountDue - a.totalAmountDue);

    return {
      totalRevenue,
      totalExpenses,
      netCashflow,
      occupancyRate,
      occupiedCount: occupiedRooms.length,
      totalCount: totalRooms,
      problematicTenants
    };
  }, [currentBuilding, activeBuildingId, extraIncomes, expenses, violations, kpiDateRange]);

  const handleLogin = (e) => {
    e.preventDefault();
    const adminAcc = adminsList.find(a => a.email.toLowerCase() === loginEmail.toLowerCase() && a.password === loginPassword);
    if (adminAcc) {
      setAuthUser({
        role: 'admin',
        isMaster: adminAcc.id === 'adm_master',
        id: adminAcc.id,
        name: adminAcc.name,
        email: adminAcc.email,
        allBuildings: adminAcc.allBuildings,
        allowedBuildingIds: adminAcc.allowedBuildingIds,
        scopeLevel: adminAcc.scopeLevel || 'all'
      });
      setLoginError('');
      showToast(`Bienvenue ${adminAcc.name}`, 'success');
      return;
    }

    let foundRoom = null;
    let foundBuilding = null;
    for (const bld of buildings) {
      const rm = bld.rooms.find(r => r.active && r.email.toLowerCase() === loginEmail.toLowerCase() && r.password === loginPassword);
      if (rm) {
        foundRoom = rm;
        foundBuilding = bld;
        break;
      }
    }
    if (foundRoom && foundBuilding) {
      setActiveBuildingId(foundBuilding.id);
      setAuthUser({
        role: 'tenant',
        roomId: foundRoom.id,
        buildingId: foundBuilding.id,
        occupantName: foundRoom.occupant,
        email: foundRoom.email
      });
      setLoginError('');
      showToast(`Bienvenue ${foundRoom.occupant}`, 'success');
    } else {
      setLoginError('Identifiants incorrects (Admin ou Locataire)');
    }
  };

  const handleRecoveryReset = (e) => {
    e.preventDefault();
    const masterAdmin = adminsList.find(a => a.id === 'adm_master');
    if (masterAdmin && recoveryPinInput === masterAdmin.recoveryPin) {
      setAdminsList(prev => prev.map(a => a.id === 'adm_master' ? { ...a, password: newMasterPassword } : a));
      setAuthUser({
        role: 'admin',
        isMaster: true,
        id: 'adm_master',
        name: masterAdmin.name,
        email: masterAdmin.email,
        allBuildings: true,
        allowedBuildingIds: [],
        scopeLevel: 'all'
      });
      setIsRecoveryMode(false);
      showToast('Mot de passe Maître réinitialisé !', 'success');
    } else {
      setLoginError('PIN de récupération invalide.');
    }
  };

  const handleSaveCloudSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('sb_url', supabaseUrl);
    localStorage.setItem('sb_key', supabaseAnonKey);
    setIsCloudConnected(!!(supabaseUrl && supabaseAnonKey));
    showToast('Paramètres Cloud sauvegardés avec succès !', 'success');
  };

  const handleCompleteTask = (roomId) => {
    const key = `${activeBuildingId}_${currentWeek.weekKey}_${roomId}`;
    setCompletions(prev => ({ ...prev, [key]: true }));
    showToast('Tâche hebdomadaire accomplie avec succès !', 'success');
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const newExp = {
      id: Date.now(),
      buildingId: activeBuildingId,
      category: expenseCategory,
      label: expenseLabel,
      amount: parseFloat(expenseAmount) || 0,
      date: expenseDate,
      isRecurring: expenseIsRecurring,
      hasInvoice: expenseHasInvoice,
      notes: expenseNotes
    };
    setExpenses(prev => [newExp, ...prev]);
    setExpenseLabel('');
    setExpenseAmount('');
    setExpenseNotes('');
    showToast('Dépense comptabilisée !', 'success');
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Dépense supprimée.', 'info');
  };

  const handleExportTaxReport = () => {
    const bldExpenses = expenses.filter(e => e.buildingId === activeBuildingId);
    let csvContent = "data:text/csv;charset=utf-8,ID,Date,Immeuble,Categorie,Description,Montant,Recurrent,Justificatif,Notes\n";
    bldExpenses.forEach(e => {
      csvContent += `${e.id},${e.date},"${currentBuilding?.name}",${e.category},"${e.label}",${e.amount},${e.isRecurring ? 'Oui' : 'Non'},${e.hasInvoice},"${e.notes}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_impots_${activeBuildingId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rapport comptable CSV généré !', 'success');
  };

  const handleAddViolation = (e) => {
    e.preventDefault();
    if (!violationRoomId) return;
    const room = currentBuilding?.rooms.find(r => String(r.id) === String(violationRoomId));
    const newV = {
      id: Date.now(),
      buildingId: activeBuildingId,
      roomId: violationRoomId,
      occupant: room ? room.occupant : 'Locataire inconnu',
      type: violationType,
      amountDue: parseFloat(violationAmount) || 0,
      date: violationDate,
      monthTarget: violationMonthTarget,
      description: violationDesc,
      solution: violationSolution
    };
    setViolations(prev => [newV, ...prev]);
    setViolationAmount('');
    setViolationDesc('');
    setViolationSolution('');
    showToast('Incident / Impayé enregistré.', 'warning');
  };

  const handleSaveReminderConfig = (e) => {
    e.preventDefault();
    showToast('Paramètres de rappel sauvegardés.', 'success');
  };

  const handleTestSendReminderNow = () => {
    showToast('Test de rappel automatique transmis avec succès !', 'success');
  };

  const handleCreateCoAdmin = (e) => {
    e.preventDefault();
    const newAdmin = {
      id: `adm_${Date.now()}`,
      name: newAdminName,
      email: newAdminEmail,
      password: newAdminPassword,
      allBuildings: true,
      allowedBuildingIds: [],
      scopeLevel: 'all'
    };
    setAdminsList(prev => [...prev, newAdmin]);
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPassword('');
    showToast('Nouveau co-gestionnaire créé.', 'success');
  };

  const handleUnitsCountChange = (countVal) => {
    const cnt = parseInt(countVal) || 1;
    setNewBldUnitsCount(cnt);
    setCustomUnits(prev => {
      const arr = [];
      for (let i = 0; i < cnt; i++) {
        if (prev[i]) {
          arr.push(prev[i]);
        } else {
          arr.push({ number: i + 1, level: i < Math.ceil(cnt / 2) ? 'RDC' : 'Sous-Sol' });
        }
      }
      return arr;
    });
  };

  const handleCustomUnitChange = (index, key, value) => {
    setCustomUnits(prev => prev.map((u, i) => i === index ? { ...u, [key]: value } : u));
  };

  const handleCreateBuilding = (e) => {
    e.preventDefault();
    if (editingBuildingId) {
      setBuildings(prev => prev.map(b => {
        if (b.id !== editingBuildingId) return b;
        const updatedRooms = customUnits.map((u, i) => {
          const existingRoom = b.rooms[i];
          return {
            id: existingRoom ? existingRoom.id : i + 1,
            number: u.number,
            level: u.level || 'RDC',
            occupant: existingRoom ? existingRoom.occupant : '',
            active: existingRoom ? existingRoom.active : false,
            email: existingRoom ? existingRoom.email : '',
            password: existingRoom ? existingRoom.password : 'pass123',
            phone: existingRoom ? existingRoom.phone : '',
            carrier: existingRoom ? existingRoom.carrier : 'bell',
            rentAmount: existingRoom ? existingRoom.rentAmount : 500,
            leaseStart: existingRoom ? existingRoom.leaseStart : '',
            leaseEnd: existingRoom ? existingRoom.leaseEnd : ''
          };
        });
        return {
          ...b,
          name: newBldName,
          city: newBldCity,
          address: newBldAddress,
          type: newBldType,
          regulations: buildingRegulationsEdit || b.regulations,
          rooms: updatedRooms
        };
      }));
      setEditingBuildingId(null);
      showToast("Paramètres de l'immeuble mis à jour !", 'success');
    } else {
      const newBldId = `bld_${Date.now()}`;
      const generatedRooms = customUnits.map((u, i) => ({
        id: i + 1,
        number: u.number,
        level: u.level || 'RDC',
        occupant: '',
        active: false,
        email: '',
        password: 'pass123',
        phone: '',
        carrier: 'bell',
        rentAmount: 500,
        leaseStart: '',
        leaseEnd: ''
      }));

      const newBld = {
        id: newBldId,
        name: newBldName,
        city: newBldCity,
        address: newBldAddress,
        type: newBldType,
        regulations: buildingRegulationsEdit || "1. Respect du voisinage.\n2. Bacs de recyclage et déchets.",
        rooms: generatedRooms
      };

      setBuildings(prev => [...prev, newBld]);
      setActiveBuildingId(newBldId);
      showToast('Immeuble créé avec succès !', 'success');
    }
    setAdminTab('kpi');
  };

  const handleStartEditBuilding = (bld) => {
    setEditingBuildingId(bld.id);
    setNewBldName(bld.name);
    setNewBldCity(bld.city);
    setNewBldAddress(bld.address);
    setNewBldType(bld.type);
    setNewBldUnitsCount(bld.rooms.length);
    setCustomUnits(bld.rooms.map(r => ({ number: r.number, level: r.level })));
    setBuildingRegulationsEdit(bld.regulations || '');
    setAdminTab('add_bld');
  };

  const handleDeleteBuilding = (bldId) => {
    if (buildings.length <= 1) {
      showToast('Impossible de supprimer le seul immeuble actif.', 'error');
      return;
    }
    const target = buildings.find(b => b.id === bldId);
    if (!target) return;
    setDeletedBuildings(prev => [{ building: target, deletedAt: new Date().toISOString() }, ...prev]);
    const remaining = buildings.filter(b => b.id !== bldId);
    setBuildings(remaining);
    setActiveBuildingId(remaining[0].id);
    showToast(`Immeuble "${target.name}" déplacé dans la corbeille.`, 'info');
  };

  const handlePermanentDelete = (bldId) => {
    setDeletedBuildings(prev => prev.filter(item => item.building.id !== bldId));
    showToast('Immeuble définitivement effacé.', 'info');
  };

  const handleAssignTenantUpdated = (e) => {
    e.preventDefault();
    if (!editingRoom) return;

    const errors = {};
    if (!isValidEmail(tenantEmail)) {
      errors.email = 'Format de courriel invalide';
    }
    if (tenantLeaseStart && tenantLeaseEnd && new Date(tenantLeaseStart) >= new Date(tenantLeaseEnd)) {
      errors.leaseDates = 'La date de fin doit être après la date de début';
    }

    if (Object.keys(errors).length > 0) {
      setTenantFormErrors(errors);
      return;
    }
    setTenantFormErrors({});

    setBuildings(prev => prev.map(b => {
      if (b.id !== activeBuildingId) return b;
      return {
        ...b,
        rooms: b.rooms.map(r => {
          if (r.id !== editingRoom.id) return r;
          return {
            ...r,
            occupant: tenantName,
            email: tenantEmail,
            password: tenantPassword,
            phone: tenantPhone,
            carrier: tenantCarrier,
            rentAmount: parseFloat(tenantRentAmount) || 0,
            leaseStart: tenantLeaseStart,
            leaseEnd: tenantLeaseEnd,
            active: true
          };
        })
      };
    }));

    setEditingRoom(null);
    showToast('Locataire et bail attribués avec succès !', 'success');
  };

  const handleRevokeAccess = (roomId) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== activeBuildingId) return b;
      return {
        ...b,
        rooms: b.rooms.map(r => {
          if (r.id !== roomId) return r;
          return { ...r, active: false, occupant: '', email: '' };
        })
      };
    }));
    showToast('Bail libéré et accès révoqué.', 'info');
  };

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!activeTenantRoom) return;
    const newIssue = {
      id: Date.now(),
      buildingId: activeBuildingId,
      occupant: activeTenantRoom.occupant,
      level: activeTenantRoom.level,
      category: issueCategory,
      title: issueTitle,
      description: issueDesc,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setIssues(prev => [newIssue, ...prev]);
    setIssueTitle('');
    setIssueDesc('');
    showToast('Signalement transmis au gestionnaire !', 'success');
  };

  const handleRequestSwap = (e) => {
    e.preventDefault();
    if (!activeTenantRoom) return;

    const isBroadcast = swapTargetRoomId === 'broadcast';
    let targetRoom = null;

    if (!isBroadcast) {
      targetRoom = currentBuilding?.rooms.find(r => String(r.id) === String(swapTargetRoomId));
      if (targetRoom && targetRoom.level !== activeTenantRoom.level) {
        showToast('Erreur : Permutation limitée au même niveau.', 'error');
        return;
      }
    }

    const newSwap = {
      id: Date.now(),
      buildingId: activeBuildingId,
      level: activeTenantRoom.level,
      requesterRoomId: activeTenantRoom.id,
      requesterName: activeTenantRoom.occupant,
      targetRoomId: isBroadcast ? 'broadcast' : Number(swapTargetRoomId),
      targetName: isBroadcast ? '📢 Tous (Même Niveau)' : (targetRoom?.occupant || 'Autre colocataire'),
      reason: swapReason,
      status: 'pending',
      acceptedBy: null,
      acceptorRoomId: null,
      targetWeekKey: selectedDutyWeek.weekKey
    };

    setSwaps(prev => [newSwap, ...prev]);
    setSwapReason('');
    setSwapTargetRoomId('broadcast');
    showToast(isBroadcast ? 'Demande de switch spontanée diffusée !' : 'Demande de permutation envoyée.', 'success');
  };

  const handleAcceptSwap = (swapId) => {
    if (!activeTenantRoom) return;
    
    setSwaps(prev => prev.map(sw => {
      if (sw.id !== swapId) return sw;
      if (sw.status !== 'pending') return sw;

      if (sw.level !== activeTenantRoom.level) {
        showToast('Erreur : Cette demande est réservée au niveau ' + sw.level, 'error');
        return sw;
      }

      if (sw.targetRoomId !== 'broadcast' && Number(sw.targetRoomId) !== Number(activeTenantRoom.id)) {
        return sw;
      }

      if (Number(sw.requesterRoomId) === Number(activeTenantRoom.id)) {
        return sw;
      }

      return {
        ...sw,
        status: 'accepted',
        acceptedBy: activeTenantRoom.occupant,
        acceptorRoomId: activeTenantRoom.id
      };
    }));

    showToast('Switch accepté ! L\'acceptant devient le responsable officiel de la tâche pour cette semaine et le planning s\'actualise en cascade.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const isLight = theme === 'light';

  const c = {
    bgApp: isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100',
    bgHeader: isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800',
    card: isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800 border-slate-700 shadow-xl',
    subCard: isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800',
    innerBox: isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800',
    input: isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600' : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500',
    textMain: isLight ? 'text-slate-900' : 'text-white',
    textMuted: isLight ? 'text-slate-600' : 'text-slate-400',
    border: isLight ? 'border-slate-200' : 'border-slate-800',
    navBtnActive: isLight ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow',
    navBtnInactive: isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-900 text-slate-400 hover:text-white',
  };

  return (
    <div className={`min-h-screen font-sans antialiased pb-12 transition-colors duration-300 ${c.bgApp}`}>
      
      {/* TOAST FLOTTANT */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce print:hidden">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold text-white ${
            toast.type === 'error' ? 'bg-rose-600 border-rose-500' : toast.type === 'info' ? 'bg-blue-600 border-blue-500' : toast.type === 'warning' ? 'bg-amber-600 border-amber-500' : 'bg-emerald-600 border-emerald-500'
          }`}>
            <Sparkles className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* EN-TÊTE DE L'APPLICATION */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 print:hidden ${c.bgHeader}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`font-black text-base leading-tight ${c.textMain}`}>ImmoGestion Multi-Propriétés</h1>
              <p className={`text-[11px] ${c.textMuted}`}>Gestion Colocation & Appartements</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition shadow-sm ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-slate-800'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span className="font-bold">{isLight ? 'Mode Sombre' : 'Mode Clair'}</span>
            </button>

            {authUser && accessibleBuildings.length > 0 && authUser.role === 'admin' && (
              <div className={`flex items-center gap-2 p-1.5 border rounded-xl ${c.innerBox}`}>
                <Building className="w-4 h-4 text-emerald-500 ml-2" />
                <select
                  value={activeBuildingId}
                  onChange={(e) => setActiveBuildingId(e.target.value)}
                  className={`bg-transparent text-xs font-bold focus:outline-none pr-2 cursor-pointer ${c.textMain}`}
                >
                  {accessibleBuildings.map(b => (
                    <option key={b.id} value={b.id} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{b.name} ({b.city})</option>
                  ))}
                </select>
              </div>
            )}

            {authUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className={`font-bold block ${c.textMain}`}>{authUser.name || authUser.occupantName}</span>
                  <span className="text-[10px] text-indigo-500 font-semibold uppercase">{authUser.role === 'admin' ? (authUser.isMaster ? 'Maître Admin' : 'Co-Admin') : 'Espace Locataire'}</span>
                </div>
                <button
                  onClick={() => setAuthUser(null)}
                  className={`p-2 rounded-xl transition ${isLight ? 'text-slate-600 hover:text-rose-600 hover:bg-slate-200' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'}`}
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className={`text-xs font-bold ${c.textMuted}`}>Veuillez vous connecter</div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 print:m-0 print:p-0 print:max-w-none">
        {!authUser ? (
          <div className={`max-w-md mx-auto border p-6 rounded-2xl space-y-6 shadow-2xl mt-10 transition-colors ${c.card}`}>
            <div className="text-center space-y-2">
              <div className="inline-block p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-2">
                <Key className="w-8 h-8 mx-auto" />
              </div>
              <h2 className={`text-xl font-black ${c.textMain}`}>Connexion à la Plateforme</h2>
              <p className={`text-xs ${c.textMuted}`}>Accédez à votre espace de gestion ou résidentiel</p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-semibold text-center">
                {loginError}
              </div>
            )}

            {!isRecoveryMode ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className={`block mb-1 font-semibold ${c.textMuted}`}>Adresse Courriel</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@gestion.com ou jean.d@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`w-full rounded-xl p-3 focus:outline-none ${c.input}`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${c.textMuted}`}>Mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full rounded-xl p-3 focus:outline-none ${c.input}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition bg-indigo-600 hover:bg-indigo-500"
                >
                  Se Connecter
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryMode(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-semibold"
                  >
                    Mot de passe oublié ? (Récupération par Code PIN)
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecoveryReset} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-[11px] rounded-xl font-medium">
                  <strong>Récupération d'Accès Maître :</strong> Entrez le PIN secret configuré (par défaut : 7777).
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${c.textMuted}`}>PIN de Secours Secret</label>
                  <input
                    type="password"
                    required
                    placeholder="7777"
                    value={recoveryPinInput}
                    onChange={(e) => setRecoveryPinInput(e.target.value)}
                    className={`w-full rounded-xl p-3 focus:outline-none ${c.input}`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${c.textMuted}`}>Nouveau Mot de Passe Maître</label>
                  <input
                    type="password"
                    required
                    placeholder="Ex: NOUVEAU_PASS_123"
                    value={newMasterPassword}
                    onChange={(e) => setNewMasterPassword(e.target.value)}
                    className={`w-full rounded-xl p-3 focus:outline-none ${c.input}`}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryMode(false)}
                    className={`flex-1 py-2.5 font-bold rounded-xl border ${c.navBtnInactive}`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg"
                  >
                    Réinitialiser Accès
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : authUser.role === 'admin' ? (
          <div className="space-y-6">
            <div className={`flex items-center gap-2 overflow-x-auto pb-2 border-b text-xs print:hidden ${c.border}`}>
              <button onClick={() => setAdminTab('kpi')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'kpi' ? c.navBtnActive : c.navBtnInactive}`}>
                Dashboard & KPI
              </button>
              <button onClick={() => setAdminTab('expenses')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'expenses' ? c.navBtnActive : c.navBtnInactive}`}>
                Dépenses & Impôts
              </button>
              <button onClick={() => setAdminTab('rooms')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'rooms' ? c.navBtnActive : c.navBtnInactive}`}>
                Baux & Unités
              </button>
              <button onClick={() => setAdminTab('violations_form')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'violations_form' ? c.navBtnActive : c.navBtnInactive}`}>
                Impayés / Retards
              </button>
              <button onClick={() => setAdminTab('reminders')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'reminders' ? c.navBtnActive : c.navBtnInactive}`}>
                Rappels Auto SMS/Email
              </button>
              {authUser.isMaster && (
                <>
                  <button onClick={() => setAdminTab('co_admins')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'co_admins' ? c.navBtnActive : c.navBtnInactive}`}>
                    Co-Gestionnaires
                  </button>
                  <button onClick={() => setAdminTab('cloud')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'cloud' ? c.navBtnActive : c.navBtnInactive}`}>
                    Cloud & Synchronisation
                  </button>
                  <button onClick={() => {
                    setEditingBuildingId(null);
                    setNewBldName('');
                    setNewBldAddress('');
                    setNewBldUnitsCount(4);
                    setCustomUnits([
                      { number: 1, level: 'RDC' },
                      { number: 2, level: 'RDC' },
                      { number: 3, level: 'Niveau 2' },
                      { number: 4, level: 'Sous-Sol' }
                    ]);
                    setBuildingRegulationsEdit('');
                    setAdminTab('add_bld');
                  }} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'add_bld' ? c.navBtnActive : c.navBtnInactive}`}>
                    Nouvel Immeuble
                  </button>
                  <button onClick={() => setAdminTab('trash')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'trash' ? c.navBtnActive : c.navBtnInactive}`}>
                    Corbeille ({deletedBuildings.length})
                  </button>
                </>
              )}
              <button onClick={() => setAdminTab('issues')} className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${adminTab === 'issues' ? c.navBtnActive : c.navBtnInactive}`}>
                Signalements ({issues.filter(i => i.buildingId === activeBuildingId && i.status === 'pending').length})
              </button>
            </div>

            {/* TAB KPI & BILAN */}
            {adminTab === 'kpi' && (
              <div className="space-y-6">
                <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className={`text-xl font-black ${c.textMain}`}>{currentBuilding?.name}</h2>
                      <p className={`text-xs ${c.textMuted}`}>{currentBuilding?.address}, {currentBuilding?.city}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
                      >
                        <Printer className="w-4 h-4" /> Imprimer Planning Affiche
                      </button>

                      <div className={`flex flex-wrap items-center gap-2 p-1.5 border rounded-xl ${c.innerBox}`}>
                        <Filter className="w-4 h-4 text-indigo-500 ml-2" />
                        <select
                          value={kpiPeriod}
                          onChange={(e) => setKpiPeriod(e.target.value)}
                          className={`bg-transparent text-xs font-bold focus:outline-none pr-2 cursor-pointer ${c.textMain}`}
                        >
                          <option value="month" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>Mois en cours</option>
                          <option value="30days" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>30 derniers jours</option>
                          <option value="90days" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>90 derniers jours</option>
                          <option value="year" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>Année en cours</option>
                        </select>
                      </div>
                    </div>

                    {authUser.isMaster && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEditBuilding(currentBuilding)}
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Settings className="w-4 h-4" /> Modifier cet Immeuble
                        </button>
                        <button
                          onClick={() => handleDeleteBuilding(activeBuildingId)}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-4 h-4" /> Corbeille
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`border p-4 rounded-xl space-y-1 ${c.subCard}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${c.textMuted}`}>Total Revenus Bruts</span>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{kpiMetrics.totalRevenue} $</span>
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                      </div>
                    </div>

                    <div className={`border p-4 rounded-xl space-y-1 ${c.subCard}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${c.textMuted}`}>Total Dépenses</span>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">-{kpiMetrics.totalExpenses} $</span>
                        <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
                      </div>
                    </div>

                    <div className={`border p-4 rounded-xl space-y-1 ${c.subCard}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${c.textMuted}`}>Cash-Flow Net</span>
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-black ${kpiMetrics.netCashflow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {kpiMetrics.netCashflow >= 0 ? '+' : ''}{kpiMetrics.netCashflow} $
                        </span>
                        <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                      </div>
                    </div>

                    <div className={`border p-4 rounded-xl space-y-1 ${c.subCard}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${c.textMuted}`}>Taux d'Occupation</span>
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-black ${c.textMain}`}>{kpiMetrics.occupancyRate} %</span>
                        <span className={`text-xs font-semibold ${c.textMuted}`}>{kpiMetrics.occupiedCount}/{kpiMetrics.totalCount} unités</span>
                      </div>
                    </div>
                  </div>

                  <div className={`border p-5 rounded-xl space-y-4 ${c.subCard}`}>
                    <h3 className={`font-bold text-sm flex items-center gap-2 ${c.textMain}`}>
                      <AlertOctagon className="w-4 h-4 text-amber-500" /> Classement des Locataires à Incidents & Retards
                    </h3>
                    {kpiMetrics.problematicTenants.length === 0 ? (
                      <p className={`text-xs py-2 ${c.textMuted}`}>Aucun incident or retard enregistré pour cet immeuble.</p>
                    ) : (
                      <div className="space-y-2">
                        {kpiMetrics.problematicTenants.map((prob, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border flex flex-wrap items-center justify-between text-xs gap-3 ${c.innerBox}`}>
                            <div>
                              <strong className={`text-sm font-bold block ${c.textMain}`}>#{idx + 1} — {prob.occupant}</strong>
                              <span className={`text-[11px] ${c.textMuted}`}>{prob.incidentsCount} incident(s) enregistré(s)</span>
                            </div>
                            <div className="text-right">
                              <span className="text-rose-600 dark:text-rose-400 font-bold block">{prob.totalAmountDue} $ dus / enjeu</span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Dernière entente: {prob.details[0]?.solution || 'Aucune'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div key={activeBuildingId} className={`border p-5 rounded-xl space-y-4 ${c.subCard}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className={`font-bold text-sm flex items-center gap-2 ${c.textMain}`}>
                          <CalendarDays className="w-4 h-4 text-emerald-500" /> Responsables & Rotation des Bacs ({currentBuilding?.name})
                        </h3>
                        <p className={`text-[11px] ${c.textMuted}`}>
                          Semaine du <strong>{selectedDutyWeek.startDateStr}</strong> au <strong>{selectedDutyWeek.endDateStr}</strong>
                        </p>
                      </div>

                      <div className={`flex items-center gap-2 p-1 border rounded-xl text-xs font-bold ${c.innerBox}`}>
                        <button onClick={() => setDutyWeekOffset(prev => prev - 1)} className={`px-2.5 py-1 rounded-lg transition ${isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>← Précédente</button>
                        <button onClick={() => setDutyWeekOffset(0)} className={`px-2.5 py-1 rounded-lg transition ${dutyWeekOffset === 0 ? 'bg-indigo-600 text-white' : (isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300')}`}>Aujourd'hui</button>
                        <button onClick={() => setDutyWeekOffset(prev => prev + 1)} className={`px-2.5 py-1 rounded-lg transition ${isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>Suivante →</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {Object.entries(selectedDutyWeekManagers).map(([levelName, data]) => {
                        const hasPendingSwap = swaps.some(s => s.buildingId === activeBuildingId && s.level === levelName && s.status === 'pending' && s.targetWeekKey === selectedDutyWeek.weekKey);
                        const hasAcceptedSwap = swaps.some(s => s.buildingId === activeBuildingId && s.level === levelName && s.status === 'accepted' && s.targetWeekKey === selectedDutyWeek.weekKey);
                        return (
                          <div key={levelName} className={`border p-4 rounded-xl space-y-2 relative ${c.innerBox}`}>
                            <div className="flex justify-between items-center">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">🏠 Niveau : {levelName}</span>
                              {hasPendingSwap ? (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-[9px] rounded-full animate-pulse">
                                  🔄 Switch en cours
                                </span>
                              ) : hasAcceptedSwap ? (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-[9px] rounded-full">
                                  ✓ Switch validé & intégré
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <strong className={`text-sm ${c.textMain}`}>{data.manager?.occupant || 'Aucun occupant'}</strong>
                              <select
                                value={manualDutyAssignments[`${activeBuildingId}_${selectedDutyWeek.weekKey}_${levelName}`] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setManualDutyAssignments(prev => ({ ...prev, [`${activeBuildingId}_${selectedDutyWeek.weekKey}_${levelName}`]: val }));
                                  showToast('Responsable figé ! La rotation des semaines suivantes a été décalée automatiquement.', 'info');
                                }}
                                className={`border text-[11px] rounded-lg p-1 font-semibold ${c.input}`}
                              >
                                <option value="">Rotation Auto</option>
                                {data.rooms.map(r => (
                                  <option key={r.id} value={r.id}>{r.occupant}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`pt-3 border-t space-y-2 ${c.border}`}>
                      <span className={`font-bold text-xs ${c.textMain}`}>Suivi des Permutations (Switches) de cet immeuble</span>
                      {swaps.filter(s => s.buildingId === activeBuildingId).length === 0 ? (
                        <p className={`text-[11px] ${c.textMuted}`}>Aucune demande de switch pour l'instant.</p>
                      ) : (
                        <div className="space-y-2">
                          {swaps.filter(s => s.buildingId === activeBuildingId).map(sw => (
                            <div key={sw.id} className={`p-2.5 rounded-xl border text-[11px] flex justify-between items-center ${c.innerBox}`}>
                              <div>
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Niveau {sw.level} :</span> {sw.requesterName} {sw.status === 'accepted' ? `a permuté avec ${sw.acceptedBy}` : `a demandé un switch (${sw.targetName})`}
                              </div>
                              <span className={`px-2 py-0.5 font-bold rounded ${sw.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 animate-pulse'}`}>
                                {sw.status === 'accepted' ? 'Validé & Intégré au planning' : '⏳ Demande en cours'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB DÉPENSES */}
            {adminTab === 'expenses' && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                    <Receipt className="w-5 h-5 text-rose-500" /> Saisie des Dépenses & Exportation Impôts
                  </h3>
                  <button onClick={handleExportTaxReport} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow">
                    <Download className="w-4 h-4" /> Exportation Rapport Impôts (CSV)
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className={`space-y-4 text-xs border p-4 rounded-xl ${c.subCard}`}>
                  <h4 className={`font-bold text-xs ${c.textMain}`}>Ajouter une nouvelle dépense ({currentBuilding?.name})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Catégorie de dépense</label>
                      <select value={expenseCategory} onChange={(e) => {
                        const cat = e.target.value;
                        setExpenseCategory(cat);
                        const isRec = ['hypotheque', 'electricite', 'internet', 'assurances', 'taxes', 'deneigement_pelouse', 'conciergerie'].includes(cat);
                        setExpenseIsRecurring(isRec);
                      }} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="hypotheque">Hypothèque Immobilière (Récurrente)</option>
                        <option value="electricite">Hydro-Québec / Électricité (Récurrente)</option>
                        <option value="internet">Internet / Wifi / Fibre (Récurrente)</option>
                        <option value="assurances">Assurance Commerciale (Récurrente)</option>
                        <option value="taxes">Taxes Municipales / Scolaires (Récurrente)</option>
                        <option value="deneigement_pelouse">Déneigement & Entretien Pelouse</option>
                        <option value="conciergerie">Conciergerie & Ménage</option>
                        <option value="comptabilite">Comptabilité & Frais de Gestion</option>
                        <option value="reparation">Réparations & Plomberie</option>
                        <option value="deplacement">Registre Kilométrique (0.57$/km)</option>
                        <option value="ameublement">Ameublement & Équipements</option>
                        <option value="autre">Autre charge</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Description / Fournisseur</label>
                      <input type="text" required placeholder="Ex: Banque Nationale, Hydro..." value={expenseLabel} onChange={(e) => setExpenseLabel(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Montant Total ($)</label>
                      <input type="number" step="0.01" required placeholder="0.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Date</label>
                      <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Nature du frais</label>
                      <select value={expenseIsRecurring ? 'recurring' : 'one_time'} onChange={(e) => setExpenseIsRecurring(e.target.value === 'recurring')} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="recurring">Récurrente (Mensuelle / Fixe)</option>
                        <option value="one_time">Ponctuelle (À l'acte / Unique)</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Justificatif / Reçu</label>
                      <select value={expenseHasInvoice} onChange={(e) => setExpenseHasInvoice(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="yes">Facture / Reçu disponible</option>
                        <option value="km_log">Registre Kilométrique</option>
                        <option value="no">Sans justificatif</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block mb-1 font-semibold ${c.textMuted}`}>Notes / Détails</label>
                    <input type="text" placeholder="Détails supplémentaires..." value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                  </div>

                  <button type="submit" className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg">
                    Comptabiliser cette Dépense
                  </button>
                </form>

                <div className="space-y-3">
                  <h4 className={`font-bold text-xs ${c.textMain}`}>Journal des dépenses ({filteredExpenses.length})</h4>
                  {filteredExpenses.length === 0 ? (
                    <div className={`border p-6 rounded-xl text-center text-xs ${c.subCard} ${c.textMuted}`}>
                      Aucune dépense enregistrée pour cet immeuble.
                    </div>
                  ) : (
                    filteredExpenses.map(exp => (
                      <div key={exp.id} className={`border p-4 rounded-xl flex flex-wrap items-center justify-between text-xs gap-3 ${c.subCard}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className={`text-sm ${c.textMain}`}>{exp.label}</strong>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.innerBox} ${c.textMain}`}>{exp.category.toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exp.isRecurring ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>{exp.isRecurring ? 'Récurrente' : 'Ponctuelle'}</span>
                          </div>
                          <p className={`text-[11px] ${c.textMuted}`}>Date: {exp.date} — {exp.notes}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-rose-600 dark:text-rose-400 font-bold text-base">-{exp.amount} $</span>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 font-bold rounded-lg text-xs">Supprimer</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB BAUX & UNITÉS */}
            {adminTab === 'rooms' && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                  <Users className="w-5 h-5 text-emerald-500" /> Gestion des Baux & Attributions ({currentBuilding?.name})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBuildingRooms.map(room => (
                    <div key={room.id} className={`p-4 rounded-xl border space-y-3 ${room.active ? c.subCard : c.innerBox}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm ${c.textMain}`}>
                          {currentBuilding?.type === 'coliving' ? `Chambre ${room.number}` : `Unité ${room.number}`} ({room.level})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${room.active ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-500'}`}>
                          {room.active ? 'Occupée' : 'Vacante'}
                        </span>
                      </div>

                      {room.active ? (
                        <div className={`space-y-1 text-xs ${c.textMain}`}>
                          <p><strong>Occupant :</strong> {room.occupant}</p>
                          <p><strong>Courriel :</strong> {room.email}</p>
                          <p><strong>Téléphone :</strong> {room.phone || 'Non renseigné'}</p>
                          <p><strong>Loyer :</strong> {room.rentAmount} $/mois</p>
                          <p><strong>Bail :</strong> {room.leaseStart || 'N/A'} au {room.leaseEnd || 'N/A'}</p>
                          <div className="pt-2 flex gap-2">
                            <button
                              onClick={() => {
                                setEditingRoom(room);
                                setTenantName(room.occupant);
                                setTenantEmail(room.email);
                                setTenantPassword(room.password);
                                setTenantPhone(room.phone || '');
                                setTenantCarrier(room.carrier || 'bell');
                                setTenantRentAmount(room.rentAmount);
                                setTenantLeaseStart(room.leaseStart || '');
                                setTenantLeaseEnd(room.leaseEnd || '');
                                setTenantFormErrors({});
                              }}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${c.navBtnInactive}`}
                            >
                              Éditer Bail
                            </button>
                            <button
                              onClick={() => handleRevokeAccess(room.id)}
                              className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 rounded-lg text-[11px] font-bold"
                            >
                              Libérer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setTenantName('');
                              setTenantEmail('');
                              setTenantPassword('pass123');
                              setTenantPhone('');
                              setTenantCarrier('bell');
                              setTenantRentAmount(525);
                              setTenantLeaseStart('');
                              setTenantLeaseEnd('');
                              setTenantFormErrors({});
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                          >
                            Assigner un Locataire
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editingRoom && (
                  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`border p-6 rounded-2xl max-w-md w-full space-y-4 text-xs shadow-2xl ${c.card}`}>
                      <h4 className={`text-base font-bold ${c.textMain}`}>Édition du Bail ({editingRoom.level} - Unité {editingRoom.number})</h4>
                      <form onSubmit={handleAssignTenantUpdated} className="space-y-3">
                        <div>
                          <input type="text" required placeholder="Nom du locataire" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                        </div>
                        <div>
                          <input type="email" required placeholder="Courriel d'accès" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                          {tenantFormErrors.email && <span className="text-rose-500 text-[10px] font-bold block mt-1">{tenantFormErrors.email}</span>}
                        </div>
                        <div>
                          <input type="text" required placeholder="Mot de passe d'accès" value={tenantPassword} onChange={(e) => setTenantPassword(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                        </div>
                        <div>
                          <input type="tel" placeholder="Téléphone (ex: (819) 123-4567)" value={tenantPhone} onChange={(e) => setTenantPhone(formatPhoneCanadian(e.target.value))} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                        </div>
                        <div>
                          <input type="number" required placeholder="Montant Loyer ($)" value={tenantRentAmount} onChange={(e) => setTenantRentAmount(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`block mb-1 font-semibold ${c.textMuted}`}>Date de Début</label>
                            <input type="date" required value={tenantLeaseStart} onChange={(e) => setTenantLeaseStart(e.target.value)} className={`w-full rounded-xl p-2 ${c.input}`} />
                          </div>
                          <div>
                            <label className={`block mb-1 font-semibold ${c.textMuted}`}>Date de Fin</label>
                            <input type="date" required value={tenantLeaseEnd} onChange={(e) => setTenantLeaseEnd(e.target.value)} className={`w-full rounded-xl p-2 ${c.input}`} />
                          </div>
                        </div>
                        {tenantFormErrors.leaseDates && <span className="text-rose-500 text-[10px] font-bold block">{tenantFormErrors.leaseDates}</span>}

                        <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setEditingRoom(null)} className={`flex-1 py-2 font-bold rounded-xl border ${c.navBtnInactive}`}>Annuler</button>
                          <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">Enregistrer</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB IMPAYÉS / RETARDS */}
            {adminTab === 'violations_form' && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                  <AlertOctagon className="w-5 h-5 text-amber-500" /> Déclarer Impayé / Manquement ({currentBuilding?.name})
                </h3>

                <form onSubmit={handleAddViolation} className={`space-y-4 text-xs border p-4 rounded-xl ${c.subCard}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Locataire / Unité</label>
                      <select required value={violationRoomId} onChange={(e) => setViolationRoomId(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="">-- Sélectionner --</option>
                        {currentBuilding?.rooms.filter(r => r.active).map(r => (
                          <option key={r.id} value={r.id}>{r.occupant} (Unité #{r.number})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Type d'incident</label>
                      <select value={violationType} onChange={(e) => setViolationType(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="retard_loyer">Retard de loyer (après le 2 du mois)</option>
                        <option value="loyer_incomplet">Loyer incomplet</option>
                        <option value="infraction_reglement">Infraction au règlement</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Montant Dû / Enjeu ($)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={violationAmount} onChange={(e) => setViolationAmount(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Description</label>
                      <input type="text" required placeholder="Détails de l'incident..." value={violationDesc} onChange={(e) => setViolationDesc(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Solution / Entente conclue</label>
                      <input type="text" required placeholder="Entente de paiement..." value={violationSolution} onChange={(e) => setViolationSolution(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>

                  <button type="submit" className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg">
                    Enregistrer l'Incident
                  </button>
                </form>
              </div>
            )}

            {/* TAB RAPPELS AUTOMATIQUES SMS / EMAIL */}
            {adminTab === 'reminders' && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                      <CalendarDays className="w-5 h-5 text-indigo-500" /> Programmation des Rappels Automatiques (Gratuit - Mail & SMS)
                    </h3>
                    <p className={`text-xs mt-1 ${c.textMuted}`}>
                      Configurez l'envoi automatisé de rappels aux locataires responsables de leur niveau (via passerelles SMS canadiennes Bell, Telus, Rogers, Vidéotron et courriel).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSendReminderNow}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
                  >
                    <Send className="w-4 h-4" /> Envoyer un test immédiat
                  </button>
                </div>

                <form onSubmit={handleSaveReminderConfig} className={`space-y-4 text-xs border p-5 rounded-xl max-w-2xl ${c.subCard}`}>
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${c.innerBox}`}>
                    <div>
                      <strong className={`block ${c.textMain}`}>Activer les rappels automatiques</strong>
                      <span className={`text-[11px] ${c.textMuted}`}>Envoi planifié aux responsables de la semaine en cours</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={reminderConfig.enabled}
                      onChange={(e) => setReminderConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Jour de la semaine pour l'envoi</label>
                      <select
                        value={reminderConfig.dayOfWeek}
                        onChange={(e) => setReminderConfig(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                        className={`w-full rounded-xl p-2.5 ${c.input}`}
                      >
                        <option value="1">Lundi (Début de semaine)</option>
                        <option value="3">Mercredi (Milieu de semaine)</option>
                        <option value="4">Jeudi (Rappel de permanence)</option>
                        <option value="5">Vendredi</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Heure d'envoi</label>
                      <input
                        type="time"
                        value={reminderConfig.time}
                        onChange={(e) => setReminderConfig(prev => ({ ...prev, time: e.target.value }))}
                        className={`w-full rounded-xl p-2.5 ${c.input}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block mb-1 font-semibold ${c.textMuted}`}>Canal de diffusion</label>
                    <select
                      value={reminderConfig.channel}
                      onChange={(e) => setReminderConfig(prev => ({ ...prev, channel: e.target.value }))}
                      className={`w-full rounded-xl p-2.5 ${c.input}`}
                    >
                      <option value="both">Courriel et SMS (Passerelles canadiennes Bell, Telus, Rogers, Vidéotron)</option>
                      <option value="email">Courriel uniquement</option>
                      <option value="sms">SMS uniquement (E-mail to SMS)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block mb-1 font-semibold ${c.textMuted}`}>Modèle de message de rappel</label>
                    <textarea
                      rows="4"
                      value={reminderConfig.message}
                      onChange={(e) => setReminderConfig(prev => ({ ...prev, message: e.target.value }))}
                      className={`w-full rounded-xl p-3 ${c.input}`}
                    />
                  </div>

                  <button type="submit" className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow">
                    Sauvegarder la Programmation
                  </button>
                </form>
              </div>
            )}

            {/* TAB CLOUD & SUPABASE */}
            {adminTab === 'cloud' && authUser.isMaster && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-indigo-500" />
                  <div>
                    <h3 className={`text-lg font-bold ${c.textMain}`}>Connexion Base de Données Cloud (Supabase)</h3>
                    <p className={`text-xs ${c.textMuted}`}>Synchronisez vos immeubles, baux et finances à distance en mode sécurisé.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveCloudSettings} className={`space-y-4 text-xs border p-5 rounded-xl max-w-xl ${c.subCard}`}>
                  <div>
                    <label className={`block mb-1 font-semibold ${c.textMuted}`}>Supabase Project URL</label>
                    <input
                      type="url"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className={`w-full rounded-xl p-2.5 ${c.input}`}
                    />
                  </div>

                  <div>
                    <label className={`block mb-1 font-semibold ${c.textMuted}`}>Supabase Anon API Key</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      className={`w-full rounded-xl p-2.5 ${c.input}`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isCloudConnected ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {isCloudConnected ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {isCloudConnected ? 'Base de données synchronisée' : 'Mode Stockage Local Gratuit'}
                    </span>
                    <button type="submit" className="py-2.5 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow">
                      Sauvegarder les Clés
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CO-GESTIONNAIRES */}
            {adminTab === 'co_admins' && authUser.isMaster && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                  <Users className="w-5 h-5 text-indigo-500" /> Gestion des Co-Gestionnaires
                </h3>
                <form onSubmit={handleCreateCoAdmin} className={`space-y-4 text-xs border p-4 rounded-xl max-w-xl ${c.subCard}`}>
                  <input type="text" required placeholder="Nom du co-gestionnaire" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                  <input type="email" required placeholder="Courriel" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                  <input type="password" required placeholder="Mot de passe temporaire" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                  <button type="submit" className="py-2 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow">Créer le Co-Gestionnaire</button>
                </form>

                <div className="space-y-3">
                  <h4 className={`font-bold text-xs ${c.textMain}`}>Comptes existants ({adminsList.length})</h4>
                  {adminsList.map(a => (
                    <div key={a.id} className={`p-4 rounded-xl border text-xs flex justify-between items-center ${c.subCard}`}>
                      <div>
                        <strong className={`text-sm block ${c.textMain}`}>{a.name} ({a.email})</strong>
                        <span className={c.textMuted}>{a.id === 'adm_master' ? 'Propriétaire Maître' : 'Co-Gestionnaire'}</span>
                      </div>
                      {a.id !== 'adm_master' && (
                        <button onClick={() => setAdminsList(prev => prev.filter(x => x.id !== a.id))} className="text-rose-600 dark:text-rose-400 hover:underline font-bold">Supprimer</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB NOUVEL IMMEUBLE / ÉDITION IMMEUBLE */}
            {adminTab === 'add_bld' && authUser.isMaster && (
              <div className={`border p-6 rounded-2xl space-y-6 max-w-3xl mx-auto ${c.card}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                  <Building2 className="w-5 h-5 text-emerald-500" /> {editingBuildingId ? "Modifier les paramètres de l'immeuble" : "Créer un Nouvel Immeuble"}
                </h3>

                <form onSubmit={handleCreateBuilding} className={`space-y-4 text-xs border p-5 rounded-xl ${c.subCard}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Nom de l'immeuble</label>
                      <input type="text" required placeholder="Ex: Résidence Saint-Maurice" value={newBldName} onChange={(e) => setNewBldName(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Ville</label>
                      <input type="text" required value={newBldCity} onChange={(e) => setNewBldCity(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Adresse complète</label>
                      <input type="text" required placeholder="Ex: 123 rue Principale" value={newBldAddress} onChange={(e) => setNewBldAddress(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Type de propriété</label>
                      <select value={newBldType} onChange={(e) => setNewBldType(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="coliving">Colocation (Chambres individuelles)</option>
                        <option value="apartment">Appartements (Unités standards)</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Nombre total d'unités / chambres</label>
                      <input type="number" min="1" max="30" value={newBldUnitsCount} onChange={(e) => handleUnitsCountChange(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>

                  <div className={`space-y-2 pt-2 border-t ${c.border}`}>
                    <label className={`block font-bold text-xs ${c.textMain}`}>Configuration des Chambres / Unités & Niveaux personnalisés</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {customUnits.map((u, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl border ${c.innerBox}`}>
                          <span className={`font-bold w-20 ${c.textMuted}`}>Unité #{idx + 1}</span>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              placeholder="Numéro (ex: 1, 204, A)"
                              value={u.number}
                              onChange={(e) => handleCustomUnitChange(idx, 'number', e.target.value)}
                              className={`w-1/2 rounded-lg p-2 ${c.input}`}
                            />
                            <input
                              type="text"
                              placeholder="Niveau (ex: RDC, Sous-Sol, 2e étage)"
                              value={u.level}
                              onChange={(e) => handleCustomUnitChange(idx, 'level', e.target.value)}
                              className={`w-1/2 rounded-lg p-2 ${c.input}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`pt-2 border-t ${c.border}`}>
                    <label className={`block font-bold text-xs mb-1 ${c.textMain}`}>Règlement officiel de la propriété</label>
                    <textarea
                      rows="4"
                      value={buildingRegulationsEdit}
                      onChange={(e) => setBuildingRegulationsEdit(e.target.value)}
                      placeholder="1. Respect de la quiétude...\n2. Sortie des bacs..."
                      className={`w-full rounded-xl p-3 ${c.input}`}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingBuildingId && (
                      <button type="button" onClick={() => { setEditingBuildingId(null); setAdminTab('kpi'); }} className={`px-4 py-2.5 font-bold rounded-xl border ${c.navBtnInactive}`}>Annuler</button>
                    )}
                    <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                      {editingBuildingId ? "Enregistrer les modifications" : "Créer l'Immeuble & Générer les Unités"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CORBEILLE */}
            {adminTab === 'trash' && authUser.isMaster && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                  <Trash2 className="w-5 h-5 text-rose-500" /> Corbeille / Immeubles Archivés ({deletedBuildings.length})
                </h3>
                {deletedBuildings.length === 0 ? (
                  <p className={`text-xs ${c.textMuted}`}>Aucun immeuble dans la corbeille.</p>
                ) : (
                  <div className="space-y-3">
                    {deletedBuildings.map((item, idx) => (
                      <div key={idx} className={`border p-4 rounded-xl flex items-center justify-between text-xs ${c.subCard}`}>
                        <div>
                          <strong className={`text-sm block ${c.textMain}`}>{item.building.name}</strong>
                          <span className={c.textMuted}>Supprimé le {new Date(item.deletedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setBuildings(prev => [...prev, item.building]);
                            setDeletedBuildings(prev => prev.filter((_, i) => i !== idx));
                            setActiveBuildingId(item.building.id);
                            showToast('Immeuble restauré.', 'success');
                          }} className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl shadow">Restaurer</button>
                          <button onClick={() => handlePermanentDelete(item.building.id)} className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-xl shadow">Effacer Définitivement</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB SIGNALEMENTS ADMIN */}
            {adminTab === 'issues' && (
              <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${c.textMain}`}>
                  <Wrench className="w-5 h-5 text-indigo-500" /> Signalements Résidents ({currentBuilding?.name})
                </h3>
                {issues.filter(i => i.buildingId === activeBuildingId).length === 0 ? (
                  <p className={`text-xs ${c.textMuted}`}>Aucun signalement pour cet immeuble.</p>
                ) : (
                  <div className="space-y-3">
                    {issues.filter(i => i.buildingId === activeBuildingId).map(issue => (
                      <div key={issue.id} className={`border p-4 rounded-xl text-xs space-y-2 ${c.subCard}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <strong className={`text-sm ${c.textMain}`}>{issue.title}</strong>
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${c.innerBox} ${c.textMain}`}>{issue.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${issue.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                            {issue.status === 'resolved' ? 'Résolu' : 'En attente'}
                          </span>
                        </div>
                        <p className={c.textMain}>{issue.description}</p>
                        <div className={`flex justify-between items-center text-[11px] pt-1 border-t ${c.border} ${c.textMuted}`}>
                          <span>Par: {issue.occupant} (Niveau: {issue.level}) le {issue.date}</span>
                          <button onClick={() => {
                            setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: i.status === 'resolved' ? 'pending' : 'resolved' } : i));
                          }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                            {issue.status === 'resolved' ? 'Rouvrir' : 'Marquer comme Résolu'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ESPACE LOCATAIRE */
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className={`border p-6 rounded-2xl space-y-6 ${c.card}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-black ${c.textMain}`}>Espace Résident — {activeTenantRoom?.occupant}</h2>
                  <p className={`text-xs ${c.textMuted}`}>{currentBuilding?.name} (Chambre/Unité #{activeTenantRoom?.number} — Niveau : {activeTenantRoom?.level})</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isTenantDutyThisWeek ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300')}`}>
                  {isTenantDutyThisWeek ? '⚠️ Vous êtes RESPONSABLE cette semaine' : '✨ Semaine normale'}
                </div>
              </div>

              <div className={`border p-5 rounded-xl space-y-4 ${c.subCard}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${c.textMain}`}>
                    <CalendarDays className="w-4 h-4 text-emerald-500" /> Responsable de votre niveau ({activeTenantRoom?.level})
                  </h3>
                  <div className={`flex items-center gap-2 p-1 border rounded-xl text-xs font-bold ${c.innerBox}`}>
                    <button onClick={() => setDutyWeekOffset(prev => Math.max(0, prev - 1))} disabled={dutyWeekOffset === 0} className={`px-2 py-1 rounded-lg transition ${dutyWeekOffset === 0 ? 'opacity-40 cursor-not-allowed text-slate-400' : (isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700')}`}>← Actuel</button>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-300 px-1">{dutyWeekOffset === 0 ? 'Cette semaine' : `+${dutyWeekOffset} sem.`}</span>
                    <button onClick={() => setDutyWeekOffset(prev => prev + 1)} className={`px-2 py-1 rounded-lg transition ${isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>Suivante →</button>
                  </div>
                </div>

                {(() => {
                  const levelData = selectedDutyWeekManagers[activeTenantRoom?.level];
                  const activeManager = levelData?.manager;
                  const isPendingSwapOnLevel = swaps.some(s => s.buildingId === activeBuildingId && s.level === activeTenantRoom?.level && s.status === 'pending' && s.targetWeekKey === selectedDutyWeek.weekKey);
                  const isAcceptedSwapOnLevel = swaps.some(s => s.buildingId === activeBuildingId && s.level === activeTenantRoom?.level && s.status === 'accepted' && s.targetWeekKey === selectedDutyWeek.weekKey);

                  return (
                    <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${c.innerBox}`}>
                      <div>
                        <span className={`text-[10px] uppercase font-bold block ${c.textMuted}`}>
                          Semaine du {selectedDutyWeek.startDateStr} au {selectedDutyWeek.endDateStr}
                        </span>
                        <strong className={`text-base block mt-0.5 ${c.textMain}`}>
                          {activeManager ? activeManager.occupant : 'Aucun responsable'} {activeManager?.id === activeTenantRoom?.id ? '(C\'est vous !)' : ''}
                        </strong>
                      </div>
                      {isPendingSwapOnLevel ? (
                        <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1.5">
                          <span>🔄 Demande de Switch en cours de négociation</span>
                        </div>
                      ) : isAcceptedSwapOnLevel ? (
                        <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <span>✓ Switch validé & intégré</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                <div className={`p-4 rounded-xl border text-xs whitespace-pre-line leading-relaxed ${c.innerBox} ${c.textMain}`}>
                  <strong className="block mb-1">Consignes du niveau :</strong>
                  {customDutyInstructions}
                </div>

                {isTenantDutyThisWeek && dutyWeekOffset === 0 && (
                  <div className="pt-2">
                    {!isTaskDoneThisWeek ? (
                      <button
                        onClick={() => handleCompleteTask(activeTenantRoom.id)}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Marquer ma tâche comme accomplie (✓ Fait)
                      </button>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Merci ! Votre tâche pour cette semaine a bien été validée.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`border p-5 rounded-xl space-y-4 ${c.subCard}`}>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${c.textMain}`}>
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Règlement Officiel de la Propriété
                </h3>
                <div className={`p-4 rounded-xl border text-xs whitespace-pre-line leading-relaxed ${c.innerBox} ${c.textMain}`}>
                  {currentBuilding?.regulations || "Aucun règlement spécifique enregistré pour cet immeuble."}
                </div>
              </div>

              <div className={`border p-5 rounded-xl space-y-4 ${c.subCard}`}>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${c.textMain}`}>
                  <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> Demander une Permutation (Switch) — Même Niveau ({activeTenantRoom?.level})
                </h3>
                <form onSubmit={handleRequestSwap} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Destinataire</label>
                      <select required value={swapTargetRoomId} onChange={(e) => setSwapTargetRoomId(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="broadcast">📢 Spontané (Diffuser à tout le niveau {activeTenantRoom?.level})</option>
                        {currentBuilding?.rooms.filter(r => r.active && r.id !== activeTenantRoom?.id && r.level === activeTenantRoom?.level).map(r => (
                          <option key={r.id} value={r.id}>{r.occupant} (Unité #{r.number} - {r.level})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Motif de la demande</label>
                      <input type="text" required placeholder="Ex: Absence ce week-end..." value={swapReason} onChange={(e) => setSwapReason(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>
                  <button type="submit" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow">
                    Diffuser la Demande de Switch
                  </button>
                </form>

                <div className={`space-y-3 pt-4 border-t ${c.border}`}>
                  <h4 className={`font-bold text-xs ${c.textMain}`}>Suivi des Demandes de Switch (Niveau {activeTenantRoom?.level})</h4>
                  {swaps.filter(s => s.buildingId === activeBuildingId && s.level === activeTenantRoom?.level).length === 0 ? (
                    <p className={`text-xs ${c.textMuted}`}>Aucune demande de switch en cours pour votre niveau.</p>
                  ) : (
                    swaps.filter(s => s.buildingId === activeBuildingId && s.level === activeTenantRoom?.level).map(sw => {
                      const isMine = Number(sw.requesterRoomId) === Number(activeTenantRoom?.id);
                      const canAccept = !isMine && sw.status === 'pending' && (sw.targetRoomId === 'broadcast' || Number(sw.targetRoomId) === Number(activeTenantRoom?.id));

                      return (
                        <div key={sw.id} className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${c.innerBox}`}>
                          <div>
                            <strong className={`block font-bold ${c.textMain}`}>
                              {sw.requesterName} cherche à switcher {sw.targetRoomId === 'broadcast' ? '(📢 Broadcast niveau)' : `avec ${sw.targetName}`}
                            </strong>
                            <span className={`text-[11px] ${c.textMuted}`}>Motif : "{sw.reason}"</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {sw.status === 'accepted' ? (
                              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-[11px]">
                                Accepté par {sw.acceptedBy} ✓ (Responsable officiel de la tâche)
                              </span>
                            ) : canAccept ? (
                              <button
                                onClick={() => handleAcceptSwap(sw.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition"
                              >
                                Accepter le Switch
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold rounded-lg text-[11px]">
                                {isMine ? 'Votre demande (En attente)' : 'En attente'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className={`border p-5 rounded-xl space-y-4 ${c.subCard}`}>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${c.textMain}`}>
                  <Wrench className="w-4 h-4 text-rose-500" /> Signaler un Bris ou un Problème
                </h3>
                <form onSubmit={handleCreateIssue} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Catégorie</label>
                      <select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`}>
                        <option value="plomberie">Plomberie (Fuite, WC, Douche)</option>
                        <option value="chauffage">Chauffage / Électricité</option>
                        <option value="electromenager">Électroménager</option>
                        <option value="structure">Structure / Bâtiment</option>
                        <option value="autre">Autre problème</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-1 font-semibold ${c.textMuted}`}>Titre du problème</label>
                      <input type="text" required placeholder="Ex: Fuite sous l'évier de cuisine" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} className={`w-full rounded-xl p-2.5 ${c.input}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block mb-1 font-semibold ${c.textMuted}`}>Description détaillée</label>
                    <textarea rows="3" required placeholder="Décrivez précisément le problème..." value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} className={`w-full rounded-xl p-3 ${c.input}`} />
                  </div>
                  <button type="submit" className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow">
                    Transmettre le Signalement à l'Admin
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL / VUE D'IMPRESSION AIRES COMMUNES (1-CLIC) */}
      {showPrintModal && currentBuilding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white text-slate-900 p-8 rounded-3xl max-w-3xl w-full space-y-6 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none">
            
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  {currentBuilding.name}
                </h1>
                <p className="text-sm font-bold text-slate-600">{currentBuilding.address}, {currentBuilding.city}</p>
                <p className="text-xs text-indigo-600 font-bold mt-1">PLANNING OFFICIEL DES BACS & HORAIRE DES AIRES COMMUNES (SWAPS INTÉGRÉS)</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-slate-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block">
                  Affichage Immeuble
                </span>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Édition du {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 space-y-2">
              <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">Consignes & Directives Générales</h2>
              <p className="text-xs whitespace-pre-line text-slate-700 font-medium leading-relaxed">
                {customDutyInstructions}
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">Calendrier des Tournées (4 Prochaines Semaines)</h2>
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-3 border-b border-slate-700">Semaine</th>
                      {[...new Set(currentBuilding.rooms.map(r => r.level).filter(Boolean))].map(level => (
                        <th key={level} className="p-3 border-b border-slate-700">Responsable {level}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {printScheduleWeeks.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-3 border-t border-slate-200 font-bold text-slate-900">
                          {item.weekInfo.startDateStr} au {item.weekInfo.endDateStr}
                        </td>
                        {Object.entries(item.levels).map(([lvl, occupantName]) => (
                          <td key={lvl} className="p-3 border-t border-slate-200 font-semibold text-slate-800">
                            {occupantName}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">Règlement de la Propriété</h2>
              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                {currentBuilding.regulations}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center print:border-t">
              <span className="text-[10px] text-slate-500 font-bold">Document imprimé pour les aires communes — ImmoGestion</span>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Fermer
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" /> Lancer l'impression / PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}