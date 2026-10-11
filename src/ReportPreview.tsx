import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { guides } from './guides';
import type { LabRecord } from './store';
import { reportMetadata, RUBRIC } from './assessment';
import FocusScope from './FocusScope';

export default function ReportPreview({record,assignmentTitle,onClose}:{record:LabRecord;assignmentTitle?:string;onClose:()=>void}){
  const report=reportMetadata(record,assignmentTitle);
  const guide=guides[record.experimentId];
  return createPortal(<FocusScope className="report-preview-screen" role="dialog" ariaLabel="Practical report preview" onEscape={onClose}>
    <div className="report-preview-toolbar"><strong>Practical report preview</strong><span>Designed for A4 paper or Print to PDF</span><button className="button-primary" onClick={()=>window.print()}><Printer size={16}/> Print report</button><button className="button-outline" onClick={onClose}><X size={16}/> Close</button></div>
    <article className="report-sheet" aria-label="Printable laboratory report">
      <header className="report-sheet-header"><div className="report-sheet-mark"><img src="/brand/scoolabs-mark.svg" alt="" width="47" height="47"/></div><div><span className="report-sheet-product">SCOOLABS</span><strong>Virtual Science Laboratory</strong><small>STUDENT PRACTICAL REPORT</small></div></header>
      <h1>{report.title}</h1>
      <div className="report-sheet-meta">
        <div><span>Student</span><strong>{report.student}</strong></div><div><span>Class</span><strong>{report.classroom}</strong></div>
        <div><span>Subject</span><strong>{report.subject}</strong></div><div><span>Date recorded</span><strong>{new Date(report.date).toLocaleString()}</strong></div>
        <div className="report-sheet-wide"><span>Activity</span><strong>{report.assignment}</strong></div>
      </div>
      <section><h2>Experiment settings</h2><p>{report.settings}</p></section>
      <section><h2>Observations and measurements</h2><p>{report.observations}</p></section>
      <section><h2>Student conclusion</h2><p>{report.conclusion||'Not provided'}</p></section>
      {guide&&<section><h2>Scientific assumptions</h2><p>{guide.modelLimit}</p></section>}
      <section className="report-sheet-grade"><h2>Teacher assessment</h2>
        {report.grade!==null?<><strong className="report-sheet-score">{report.grade} / 100</strong>
          {report.rubric&&<table><thead><tr><th>Criterion</th><th>Score</th></tr></thead><tbody>{RUBRIC.map(c=><tr key={c.id}><td>{c.label}</td><td>{report.rubric?.inputs[c.id]} / {c.maximum}</td></tr>)}</tbody></table>}
          {report.rubric?.comment?<p>{report.rubric.comment}</p>:!report.rubric&&report.feedback?<p>{report.feedback}</p>:null}
        </>:<p>Not yet marked by the teacher.</p>}
      </section>
      <footer><span>Scoolabs educational simulation report</span><span>Generated locally. Experimental models may simplify real laboratory conditions.</span></footer>
    </article>
  </FocusScope>,document.body);
}
