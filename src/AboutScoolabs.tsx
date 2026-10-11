import {ArrowRight, BookOpen, Database, FlaskConical, GraduationCap, HelpCircle, Mail, Phone, ShieldCheck, WifiOff} from 'lucide-react';
import BrandLockup from './BrandLockup';
import {version} from '../package.json';

type Props={onTeacher:()=>void;onStudent:()=>void};
export default function AboutScoolabs({onTeacher,onStudent}:Props){
  return <section className="scoolabs-about" aria-label="About Scoolabs">
    <div className="about-hero">
      <BrandLockup size="lg" inverse/>
      <span className="eyebrow">OFFLINE VIRTUAL SCIENCE LABORATORY</span>
      <h1>Practical science for every classroom.</h1>
      <p>Scoolabs brings Chemistry, Physics, Biology and Agricultural Science simulations, notebooks and teacher-led learning to one offline Windows computer.</p>
      <div className="about-hero-actions"><button className="button-primary" onClick={onStudent}>Continue learning <ArrowRight size={16}/></button>
        <button className="button-outline" onClick={onTeacher}>Teacher workspace <GraduationCap size={16}/></button></div>
    </div>
    <div className="about-facts">
      <div><FlaskConical size={20}/><strong>12</strong><span>Interactive practicals</span></div>
      <div><BookOpen size={20}/><strong>4</strong><span>Science subjects</span></div>
      <div><WifiOff size={20}/><strong>Offline</strong><span>No connection required for lessons</span></div>
      <div><Database size={20}/><strong>Local</strong><span>School records stored on device</span></div>
    </div>
    <div className="about-columns">
      <section className="about-panel"><h2><GraduationCap size={20}/> Setting up a school</h2>
        <ol>
          <li><strong>Teacher access.</strong> Open the Teacher workspace and create your first PIN-protected account.</li>
          <li><strong>Class records.</strong> Add classrooms and enrol each student with their own access code and PIN.</li>
          <li><strong>Practical learning.</strong> Assign activities and let students complete simulations and save reports.</li>
          <li><strong>Feedback.</strong> Mark reports, monitor assignments, export gradebook data and make protected local backups.</li>
        </ol>
        <button className="text-button" onClick={onTeacher}>Open teacher workspace <ArrowRight size={15}/></button>
      </section>
      <section className="about-panel"><h2><HelpCircle size={20}/> Common questions</h2>
        <details><summary>Does Scoolabs need internet?</summary><p>Core lessons, accounts, assignments and reports operate on the installed Windows computer without an internet connection.</p></details>
        <details><summary>Where are student records saved?</summary><p>The Windows application stores class and practical records in a local SQLite database. Backups are not automatically encrypted. Keep the device and backup files protected.</p></details>
        <details><summary>Can an activity replace a real laboratory?</summary><p>No. Scoolabs is a supplemental teaching aid. Scientific simulations simplify real conditions and do not replace supervised experiments or qualified teacher review.</p></details>
        <details><summary>How do I recover school data?</summary><p>An authenticated teacher can create and restore local backups in Teacher workspace → Recovery. Take a backup before updates or major changes.</p></details>
        <details><summary>Can I print a student's practical report?</summary><p>Open the student's notebook report or the teacher's Mark reports area, choose Preview / print report and use Windows printing or Print to PDF.</p></details>
      </section>
    </div>
    <section className="about-contact"><div><span className="eyebrow">CREATED BY</span>
      <h2>Simeon's Laboratories and Co Technologies Ltd</h2><p>Scoolabs {version} · Offline-first educational software developed for Nigerian schools.</p>
      <p>Development-stage science simulations. No WAEC, NECO, NERDC or other curriculum certification is claimed.</p></div>
      <div className="about-contact-methods"><a href="mailto:silabtechnologies@gmail.com"><Mail size={16}/> silabtechnologies@gmail.com</a><a href="tel:+2349039930006"><Phone size={16}/> +234 903 993 0006</a><span><ShieldCheck size={16}/> School data remains on the device unless you export or share it.</span></div>
    </section>
  </section>;
}
