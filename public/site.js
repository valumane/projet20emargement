import { parseCsv } from './csv.js';

const importMessage = document.querySelector('#import-message');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search');
const studentList = document.querySelector('#student-list');
const listMessage = document.querySelector('#list-message');
const detail = document.querySelector('#student-detail');
const detailTitle = document.querySelector('#detail-title');
const detailMessage = document.querySelector('#detail-message');
const attendanceList = document.querySelector('#attendance-list');
let attendances = [];

function findColumn(headers, candidates) {
  return headers.findIndex(header => candidates.includes(header.trim().toLowerCase()));
}

function getStudents(records) {
  const students = new Map();
  for (const record of records) {
    const student = students.get(record.id) ?? {
      id: record.id,
      nom: record.nom,
      prenom: record.prenom,
      records: [],
    };
    if (!student.nom && record.nom) student.nom = record.nom;
    if (!student.prenom && record.prenom) student.prenom = record.prenom;
    student.records.push(record);
    students.set(record.id, student);
  }
  return [...students.values()].sort((left, right) => studentLabel(left).localeCompare(studentLabel(right), 'fr'));
}

function studentLabel(student) {
  return [student.prenom, student.nom].filter(Boolean).join(' ') || student.id;
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value;
  row.append(cell);
}

function showStudents(students) {
  studentList.replaceChildren();
  detail.hidden = true;

  if (students.length === 0) {
    listMessage.textContent = attendances.length
      ? 'Aucun étudiant ne correspond à la recherche.'
      : 'Aucun émargement présent dans le fichier.';
    return;
  }

  listMessage.textContent = `${students.length} étudiant${students.length === 1 ? '' : 's'}.`;
  for (const student of students) {
    const presences = student.records.filter(record => record.statut === 'present').length;
    const absences = student.records.filter(record => record.statut === 'absent').length;
    const total = presences + absences;
    const rate = total === 0 ? 'Indisponible' : `${Math.round((presences / total) * 1000) / 10} %`;
    const row = document.createElement('tr');
    addCell(row, studentLabel(student));
    addCell(row, String(presences));
    addCell(row, String(absences));
    addCell(row, rate);

    const action = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Voir les présences';
    button.addEventListener('click', () => showDetails(student));
    action.append(button);
    row.append(action);
    studentList.append(row);
  }
}

function showDetails(student) {
  detail.hidden = false;
  detailTitle.textContent = `Présences de ${studentLabel(student)}`;
  const records = [...student.records].sort((left, right) =>
    right.date.localeCompare(left.date) || left.demiJournee.localeCompare(right.demiJournee));

  attendanceList.replaceChildren();
  detailMessage.textContent = `${records.length} demi-journée${records.length === 1 ? '' : 's'} enregistrée${records.length === 1 ? '' : 's'}.`;
  for (const record of records) {
    const row = document.createElement('tr');
    addCell(row, record.date);
    addCell(row, record.demiJournee === 'matin' ? 'Matin' : 'Après-midi');
    addCell(row, record.statut === 'present' ? 'Présent' : 'Absent');
    addCell(row, record.statut === 'absent' ? record.motif : '—');
    attendanceList.append(row);
  }
}

function filterStudents(query) {
  const normalizedQuery = query.trim().toLocaleLowerCase('fr');
  const students = getStudents(attendances);
  const filtered = normalizedQuery
    ? students.filter(student => `${studentLabel(student)} ${student.id}`.toLocaleLowerCase('fr').includes(normalizedQuery))
    : students;
  showStudents(filtered);
}

async function loadCsv() {
  importMessage.textContent = 'Chargement du fichier CSV…';
  try {
    const response = await fetch('/data/presences.csv', { cache: 'no-store' });
    if (!response.ok) throw new Error('Impossible de charger data/presences.csv.');

    const rows = parseCsv(await response.text());
    if (rows.length < 2) throw new Error('Le fichier est vide ou ne contient aucune ligne de présence.');

    const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim().toLowerCase());
    const columns = {
      id: findColumn(headers, ['discordid', 'discord_user_id', 'idetudiant', 'id_etudiant']),
      date: findColumn(headers, ['date']),
      demiJournee: findColumn(headers, ['demijournee', 'demi_journee']),
      statut: findColumn(headers, ['statut', 'statut_presence']),
      motif: findColumn(headers, ['motif', 'motif_absence']),
      nom: findColumn(headers, ['nom']),
      prenom: findColumn(headers, ['prenom', 'prénom']),
    };
    if ([columns.id, columns.date, columns.demiJournee, columns.statut].some(index => index < 0)) {
      throw new Error('Colonnes requises manquantes : identifiant, date, demi-journée et statut.');
    }

    const imported = rows.slice(1).map(row => ({
      id: row[columns.id]?.trim() ?? '',
      date: row[columns.date]?.trim() ?? '',
      demiJournee: row[columns.demiJournee]?.trim().toLowerCase() ?? '',
      statut: row[columns.statut]?.trim().toLowerCase() ?? '',
      motif: columns.motif < 0 ? '' : row[columns.motif]?.trim() ?? '',
      nom: columns.nom < 0 ? '' : row[columns.nom]?.trim() ?? '',
      prenom: columns.prenom < 0 ? '' : row[columns.prenom]?.trim() ?? '',
    })).filter(record =>
      record.id
      && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
      && ['matin', 'apres-midi'].includes(record.demiJournee)
      && ['present', 'absent'].includes(record.statut));

    attendances = imported;
    importMessage.textContent = `${imported.length} émargement${imported.length === 1 ? '' : 's'} chargé${imported.length === 1 ? '' : 's'}.`;
    filterStudents(searchInput.value);
  } catch (error) {
    attendances = [];
    studentList.replaceChildren();
    detail.hidden = true;
    listMessage.textContent = 'Import impossible.';
    importMessage.textContent = error.message;
  }
}

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  filterStudents(searchInput.value);
});

document.querySelector('#clear-search').addEventListener('click', () => {
  searchInput.value = '';
  filterStudents('');
});

loadCsv();
