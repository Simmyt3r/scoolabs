import type { Subject } from './engine';

export interface LabRecord {
  id: string;
  timestamp: string;
  student: string;
  classroom: string;
  experimentId: string;
  experimentTitle: string;
  subject: Subject;
  settings: string;
  observation: string;
  conclusion: string;
  grade?: number | null;
  feedback?: string | null;
  assignmentId?: string | null;
}
const KEY = 'scoolabs.records.v1';
const PROFILE = 'scoolabs.profile.v1';
export type LearnerProfile = { name: string; classroom: string };
export function getProfile(): LearnerProfile {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE) || '{}') as Partial<LearnerProfile>;
    return { name: typeof profile.name === 'string' ? profile.name : '', classroom: typeof profile.classroom === 'string' ? profile.classroom : '' };
  } catch { return { name: '', classroom: '' }; }
}
export function saveProfile(profile: LearnerProfile) { localStorage.setItem(PROFILE, JSON.stringify(profile)); }
export function getRecords(): LabRecord[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(data) ? data.filter((item): item is LabRecord => !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.experimentId === 'string') : [];
  } catch { return []; }
}
export function saveRecord(record: LabRecord) {
  const records = [record, ...getRecords()].slice(0, 500);
  localStorage.setItem(KEY, JSON.stringify(records));
  return records;
}
export function exportRecords(records: LabRecord[]) {
  const blob = new Blob([JSON.stringify({ schema: 1, exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'scoolabs-lab-records.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
