import { invoke, isTauri } from '@tauri-apps/api/core';
import { getProfile as legacyProfile, getRecords as legacyRecords, saveRecord as browserSaveRecord, saveProfile as browserSaveProfile } from './store';
import type { LearnerProfile, LabRecord } from './store';

export interface StudentSession { token:string; studentId:string; studentName:string; classroom:string }
export interface StudentEnrolment { studentId:string; accessCode:string }
export async function loginStudent(accessCode:string,pin:string):Promise<StudentSession>{nativeOnly();return invoke('student_login',{accessCode,pin})}
export async function logoutStudent(token:string):Promise<void>{nativeOnly();await invoke('student_logout',{token})}
export async function teacherAccessCodes(token:string):Promise<StudentEnrolment[]>{nativeOnly();return invoke('teacher_access_codes',{token})}
export async function resetStudentPin(token:string,studentId:string,newPin:string):Promise<StudentEnrolment>{nativeOnly();return invoke('teacher_reset_student_pin',{token,studentId,newPin})}
export interface TeacherAccount { id: string; name: string }
export interface Classroom { id: string; name: string; level: string }
export interface Student { id: string; classId: string; name: string }
export interface Assignment { id: string; classId: string; experimentId: string; title: string; instructions: string; createdAt: string }
export interface TeacherSession { token: string; teacherName: string }
export interface TeacherSnapshot { classes: Classroom[]; students: Student[]; assignments: Assignment[]; records: LabRecord[] }
const nativeOnly = () => { if (!isTauri()) throw new Error('Teacher management requires the installed Scoolabs desktop application.'); };
export async function initialiseStore(): Promise<{profile:LearnerProfile;records:LabRecord[];classes:Classroom[]}> {
  if (!isTauri()) return {profile:legacyProfile(),records:legacyRecords(),classes:[]};
  // Native students must authenticate; no name/class-based access to school records.
  return {profile:{name:'',classroom:''},records:[],classes:await invoke<Classroom[]>('class_catalog')};
}
export async function readRecords(profile:LearnerProfile,token?:string):Promise<LabRecord[]>{
  if(!isTauri())return legacyRecords().filter(x=>x.student.toLowerCase()===profile.name.trim().toLowerCase() && x.classroom.toLowerCase()===profile.classroom.trim().toLowerCase());
  if(!token)throw new Error('Student authentication is required to view records.');
  return invoke<LabRecord[]>('student_records',{token});
}
export async function saveStudentProfile(profile:LearnerProfile):Promise<void>{
  if(isTauri())throw new Error('Student identities are managed by teachers. Sign in with a student code.');
  browserSaveProfile(profile);
}
export async function writeRecord(record:LabRecord,token?:string):Promise<void>{
  if(!isTauri()){browserSaveRecord(record);return;}
  if(!token)throw new Error('Student authentication is required to save records.');
  await invoke('student_submit_record',{token,record});
}
export async function getClassCatalog():Promise<Classroom[]>{
  return isTauri()?invoke<Classroom[]>('class_catalog'):[];
}
export async function getClassAssignments(classroom:string,token?:string):Promise<Assignment[]>{
  if(!isTauri())return [];
  if(!token)throw new Error('Student authentication required for assignments.');
  return invoke<Assignment[]>('student_assignments',{token});
}
export async function teacherAccounts():Promise<TeacherAccount[]>{nativeOnly();return invoke('teacher_accounts')}
export async function setupTeacher(name:string,pin:string):Promise<void>{nativeOnly();await invoke('setup_teacher',{name,pin})}
export async function loginTeacher(teacherId:string,pin:string):Promise<TeacherSession>{nativeOnly();return invoke('teacher_login',{teacherId,pin})}
export async function logoutTeacher(token:string):Promise<void>{nativeOnly();await invoke('teacher_logout',{token})}
export async function addTeacher(token:string,name:string,pin:string):Promise<void>{nativeOnly();await invoke('add_teacher',{token,name,pin})}
export async function backupSchoolDatabase(token:string):Promise<string>{nativeOnly();return invoke('backup_school_database',{token})}
export interface SchoolBackup {filename:string;bytes:number;modifiedUnix:number}
export async function listSchoolBackups(token:string):Promise<SchoolBackup[]>{nativeOnly();return invoke('list_local_backups',{token})}
export async function restoreSchoolBackup(token:string,filename:string,confirmation:string):Promise<string>{nativeOnly();return invoke('restore_local_backup',{token,filename,confirmation})}
export interface AssignmentRosterRow {studentId:string;studentName:string;recordId:string|null;submittedAt:string|null;score:number|null}
export async function teacherAssignmentRoster(token:string,assignmentId:string):Promise<AssignmentRosterRow[]>{nativeOnly();return invoke('teacher_assignment_roster',{token,assignmentId})}
export async function teacherSnapshot(token:string):Promise<TeacherSnapshot>{nativeOnly();return invoke('teacher_snapshot',{token})}
export async function createClass(token:string,name:string,level:string):Promise<void>{nativeOnly();await invoke('create_class',{token,name,level})}
export async function enrollStudent(token:string,classId:string,name:string,pin:string):Promise<StudentEnrolment>{nativeOnly();return invoke('teacher_enrol_student',{token,classId,name,pin})}
export async function createAssignment(token:string,classId:string,experimentId:string,title:string,instructions:string):Promise<void>{nativeOnly();await invoke('create_assignment',{token,classId,experimentId,title,instructions})}
export async function gradeRecord(token:string,recordId:string,score:number,feedback:string):Promise<void>{nativeOnly();await invoke('grade_record',{token,recordId,score,feedback})}
