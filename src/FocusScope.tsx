import {useEffect,useRef,type ReactNode} from 'react';

const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside the open modal, moves focus into it,
 * closes on Escape, and restores focus to the invoking control.
 * Deliberately uses only built-in DOM APIs so it works offline in WebView2.
 */
export default function FocusScope({className,children,onEscape,role='presentation',labelledBy,ariaLabel}:{
  className:string;
  children:ReactNode;
  onEscape:()=>void;
  role?:'presentation'|'dialog';
  labelledBy?:string;
  ariaLabel?:string;
}){
  const root=useRef<HTMLDivElement>(null);
  const closer=useRef(onEscape);
  closer.current=onEscape;
  useEffect(()=>{
    const dialog=root.current;
    if(!dialog)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const controls=()=>[...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
      .filter(node=>node.getClientRects().length>0&&!node.hasAttribute('inert'));
    // A close button is intentionally first in our modals.
    (controls()[0]??dialog).focus();
    function onKeyDown(event:KeyboardEvent){
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closer.current();return;}
      if(event.key!=='Tab')return;
      const items=controls();
      if(items.length===0){event.preventDefault();dialog?.focus();return;}
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&(document.activeElement===first||!dialog?.contains(document.activeElement))){
        event.preventDefault();last.focus();
      }else if(!event.shiftKey&&(document.activeElement===last||!dialog?.contains(document.activeElement))){
        event.preventDefault();first.focus();
      }
    }
    document.addEventListener('keydown',onKeyDown,true);
    return ()=>{document.removeEventListener('keydown',onKeyDown,true);previous?.focus({preventScroll:true});};
  },[]);
  return <div ref={root} className={className} role={role}
    aria-modal={role==='dialog'?true:undefined} aria-label={ariaLabel}
    aria-labelledby={labelledBy} tabIndex={-1}>{children}</div>;
}
