import { invoke, isTauri } from '@tauri-apps/api/core';
import { getProfile as legacyProfile, getRecords as legacyRecords, saveRecord as browserSaveRecord, saveProfile as browserSaveProfile } from './store';
import type { LearnerProfile, LabRecord } from './store';

export interface TeacherAccount { id: string; name: string }
export interface Classroom { id: string; name: string; level: string }
export interface Student { id: string; classId: string; name: string }
export interface Assignment { id: string; classId: string; experimentId: string; title: string; instructions: string; createdAt: string }
export interface TeacherSession { token: string; teacherName: string }
export interface TeacherSnapshot { classes: Classroom[]; students: Student[]; assignments: Assignment[]; records: LabRecord[] }
const nativeOnly = () => { if (!isTauri()) throw new Error('Teacher management requires the installed Scoolabs desktop application.'); };
export async function initialiseStore(): Promise<{profile:LearnerProfile;records:LabRecord[];classes:Classroom[]}> {
  if (!isTauri()) return {profile:legacyProfile(),records:legacyRecords(),classes:[]};
  const old=legacyRecords();
  // The legacy localStorage key is removed only after the SQLite transaction succeeds.
  if (old.length>0) {
    await invoke<number>('import_legacy_records',{records:old});
    localStorage.removeItem('scoolabs.records.v1');
  }
  let profile=await invoke<LearnerProfile>('get_profile');
  const oldProfile=legacyProfile();
  if(!profile.name && !profile.classroom && (oldProfile.name || oldProfile.classroom)){
    await invoke('set_profile',{profile:oldProfile});
    profile=oldProfile;
  }
  return {profile,records:await readRecords(profile),classes:await invoke<Classroom[]>('class_catalog')};
}
export async function readRecords(profile:LearnerProfile):Promise<LabRecord[]>{
  if(!isTauri())return legacyRecords().filter(x=>x.student.toLowerCase()===profile.name.trim().toLowerCase() && x.classroom.toLowerCase()===profile.classroom.trim().toLowerCase());
  return invoke<LabRecord[]>('list_lab_records',{student:profile.name,classroom:profile.classroom});
}
export async function saveStudentProfile(profile:LearnerProfile):Promise<void>{
  if(isTauri())return invoke('set_profile',{profile});
  browserSaveProfile(profile);
}
export async function writeRecord(record:LabRecord):Promise<void>{
  if(isTauri())await invoke('save_lab_record',{record});
  else browserSaveRecord(record);
}
export async function getClassCatalog():Promise<Classroom[]>{
  return isTauri()?invoke<Classroom[]>('class_catalog'):[];
}
export async function getClassAssignments(classroom:string):Promise<Assignment[]>{
  return isTauri()?invoke<Assignment[]>('class_assignments',{classroom}):[];
}
export async function teacherAccounts():Promise<TeacherAccount[]>{nativeOnly();return invoke('teacher_accounts')}
export async function setupTeacher(name:string,pin:string):Promise<void>{nativeOnly();await invoke('setup_teacher',{name,pin})}
export async function loginTeacher(teacherId:string,pin:string):Promise<TeacherSession>{nativeOnly();return invoke('teacher_login',{teacherId,pin})}
export async function logoutTeacher(token:string):Promise<void>{nativeOnly();await invoke('teacher_logout',{token})}
export async function addTeacher(token:string,name:string,pin:string):Promise<void>{nativeOnly();await invoke('add_teacher',{token,name,pin})}
export async function backupSchoolDatabase(token:string):Promise<string>{nativeOnly();return invoke('backup_school_database',{token})}
export async function teacherSnapshot(token:string):Promise<TeacherSnapshot>{nativeOnly();return invoke('teacher_snapshot',{token})}
export async function createClass(token:string,name:string,level:string):Promise<void>{nativeOnly();await invoke('create_class',{token,name,level})}
export async function enrollStudent(token:string,classId:string,name:string):Promise<void>{nativeOnly();await invoke('enroll_student',{token,classId,name})}
export async function createAssignment(token:string,classId:string,experimentId:string,title:string,instructions:string):Promise<void>{nativeOnly();await invoke('create_assignment',{token,classId,experimentId,title,instructions})}
export async function gradeRecord(token:string,recordId:string,score:number,feedback:string):Promise<void>{nativeOnly();await invoke('grade_record',{token,recordId,score,feedback})}
